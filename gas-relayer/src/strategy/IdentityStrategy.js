const Strategy = require('./BaseStrategy');
const erc20ABI = require('../../abi/ERC20Token.json');

const CallGasRelayed = "0xfd0dded5";
const ApproveAndCallGasRelayed = "0x59f4ac61";

/**
 * Class representing a strategy to validate a `transaction` request when the topic is related to Identities.
 * @extends Strategy
 */
class IdentityStrategy extends Strategy {

    /**
     * Validates if the contract being invoked represents an Identity instance 
     * @param {object} input - Object obtained from a `transaction` request.
     * @returns {bool} Valid instance or not
     */
    async _validateInstance(input){
        const instanceCodeHash = this.web3.utils.soliditySha3(await this.web3.eth.getCode(input.contract));
        const kernelVerifSignature = this.web3.utils.soliditySha3(this.contract.kernelVerification).slice(0, 10);

        if(instanceCodeHash === null) return false;
    
        let verificationResult = await this.web3.eth.call({
            to: this.contract.factoryAddress, 
            data: kernelVerifSignature + instanceCodeHash.slice(2)});
    
        return this.web3.eth.abi.decodeParameter('bool', verificationResult);
    }

    /**
     * Process Identity strategy
     * @param {object} input - Object obtained from an 'transaction' request. It expects an object with this structure `{contract, address, action, functionName, functionParameters, payload}`
     * @returns {object} Status of validation and estimated gas
     */
    async execute(input, cache){
        if(this.contract.isIdentity){
            let validInstance = await this._validateInstance(input);
            if(!validInstance){
                return {success: false, message: "Invalid identity instance"};
            }
        }
        
        const params = this._obtainParametersFunc(input);

        // Verifying if token is allowed
        const token = this.settings.getToken(params('_gasToken'));
        if(token == undefined) return {success: false, message: "Token not allowed"};
        
        // Determine if enough balance for baseToken
        const gasPrice = this.web3.utils.toBN(params('_gasPrice'));
        const gasLimit = this.web3.utils.toBN(params('_gasLimit'));
        if(this.contract.allowedFunctions[input.functionName].isToken){
            const Token = new this.web3.eth.Contract(erc20ABI.abi);
            Token.options.address = params('_baseToken');
            const tokenBalance = new this.web3.utils.BN(await Token.methods.balanceOf(input.contract).call()); 
            if(tokenBalance.lt(this.web3.utils.toBN(params('_value')))){
                return {success: false, message: "Identity has not enough balance for specified value"};
            }
        }

        // gasPrice * limit calculation
        const balance = await this.getBalance(input.contract, token);
        if(balance.lt(this.web3.utils.toBN(gasPrice.mul(gasLimit)))) {
            return {success: false, message: "Identity has not enough tokens for gasPrice*gasLimit"};
        }


        let estimatedGas = 0;
        try {
            // TODO: Investigate why sometimes geth fails estimations with proxies
            if(input.functionName == CallGasRelayed){
                estimatedGas = await this._estimateGas(input);
            } else {
                const tmp = Math.floor(parseInt((await this._estimateGas(input)).toString(10), 10) * 1.05);
                estimatedGas = this.web3.utils.toBN(tmp); // TODO: tune this
            }

            if(gasLimit.lt(estimatedGas)) {
                return {success: false, message: "Gas limit below estimated gas (" + estimatedGas + ")"};
            } 
        } catch(exc){
            if(exc.message.indexOf("revert") > -1) return {success: false, message: "Transaction will revert"};
            else {
                console.error(exc);
                return {success: false, message: "Transaction will fail"};
            }
        }

        // Get Price
        let tokenRate = await this.getTokenRate(token, cache);
        if(!tokenRate){
            return {
                success: false,
                message: "Token price unavailable"
            };
        }

        const gasPrices = await this.getGasPrices(token, tokenRate);
        if(tokenRate.lt(token.minAcceptedRate)){
            return {success: false, message: "Not accepting " + token.symbol + " at current rate. (Min rate: " + token.minAcceptedRate+ ")"};
        }

        if(gasPrice.lt(gasPrices.inTokens)){
            return {success: false, message: "Gas price is less than the required amount (" + gasPrices.inTokens.toString(10) + ")"};
        }

        return {
            success: true,
            message: "Valid transaction",
            estimatedGas
        };
    }

}

module.exports = IdentityStrategy;
