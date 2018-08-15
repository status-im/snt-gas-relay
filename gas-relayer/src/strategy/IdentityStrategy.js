const Strategy = require('./BaseStrategy');
const erc20ABI = require('../../abi/ERC20Token.json');

class IdentityStrategy extends Strategy {

    async _validateInstance(message){
        const instanceCodeHash = this.web3.utils.soliditySha3(await this.web3.eth.getCode(message.input.contract));
        const kernelVerifSignature = this.web3.utils.soliditySha3(this.contract.kernelVerification).slice(0, 10);
        if(instanceCodeHash === null) return false;
    
        let verificationResult = await this.web3.eth.call({
            to: this.contract.factoryAddress, 
            data: kernelVerifSignature + instanceCodeHash.slice(2)});
    
        return this.web3.eth.abi.decodeParameter('bool', verificationResult);
    }

    async execute(message){
        if(this.contract.isIdentity){
            let validInstance = await this._validateInstance(message);
            if(!validInstance){
                return {success: false, message: "Invalid identity instance"};
            }
        }

        const params = this._obtainParametersFunc(message);

        // Verifying if token is allowed
        const token = this.settings.getToken(params('_gasToken'));
        if(token == undefined) return {success: false, message: "Token not allowed"};
        
        // Determine if enough balance for baseToken
        const gasPrice = this.web3.utils.toBN(params('_gasPrice'));
        const gasLimit = this.web3.utils.toBN(params('_gasLimit'));
        if(this.contract.allowedFunctions[message.input.functionName].isToken){
            const Token = new this.web3.eth.Contract(erc20ABI.abi);
            Token.options.address = params('_baseToken');
            const tokenBalance = new this.web3.utils.BN(await Token.methods.balanceOf(message.input.contract).call()); 
            if(tokenBalance.lt(this.web3.utils.toBN(params('_value')))){
                return {success: false, message: "Identity has not enough balance for specified value"};
            }
        }

        // gasPrice * limit calculation
        const balance = await this.getBalance(message.input.contract, token);
        if(balance.lt(this.web3.utils.toBN(gasPrice.mul(gasLimit)))) {
            return {success: false, message: "Identity has not enough tokens for gasPrice*gasLimit"};
        }


        const latestBlock = await this.web3.eth.getBlock("latest");
        let estimatedGas = 0;
        try {
            estimatedGas = await this._estimateGas(message, latestBlock.gasLimit);
            if(gasLimit.lt(estimatedGas)) {
                return {success: false, message: "Gas limit below estimated gas (" + estimatedGas + ")"};
            } 
        } catch(exc){
            if(exc.message.indexOf("revert") > -1) return {success: false, message: "Transaction will revert"};
        }

        return {
            success: true,
            message: "Valid transaction"
        };
    }

}

module.exports = IdentityStrategy;
