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
        const gasMinimal = this.web3.utils.toBN(params('_gasMinimal'));
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
        if(balance.lt(this.web3.utils.toBN(gasPrice.mul(gasMinimal)))) {
            return {success: false, message: "Identity has not enough tokens for gasPrice*gasMinimal"};
        }


        let estimatedGas = 0;
        try {
            if(input.functionName == CallGasRelayed){
                estimatedGas = await this._estimateGas(input);
            } else {
                const tmp = Math.floor(parseInt((await this._estimateGas(input)).toString(10), 10) * 1.05);
                estimatedGas = this.web3.utils.toBN(tmp);
            }

            // TODO: executing functions with gas minimal causes relayers to incur in a loss. 
            // TODO: maybe this can be fixed by increasing the gas price for this kind of operations
            if(gasMinimal.add(this.web3.utils.toBN(75000)).lt(estimatedGas)) {
                return {success: false, message: "Gas limit below estimated gas (" + estimatedGas + ")"};
            } else {
                estimatedGas = estimatedGas.add(this.web3.utils.toBN(75000));
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
