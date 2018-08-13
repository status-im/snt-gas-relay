const Strategy = require('./BaseStrategy');

const TransferSNT = "0x916b6511";

class SNTStrategy extends Strategy {

    async execute(message){
        const params = this._obtainParametersFunc(message);

        // Verifying if token is allowed
        const token = this.settings.getTokenBySymbol("SNT");
        if(token == undefined) return {success: false, message: "Token not allowed"};
        
        if(message.input.functionName == TransferSNT){
            const estimatedGas = await this.web3.eth.estimateGas({
                data: message.input.payload,
                from: this.config.node.blockchain.account,
                to: message.input.address
            });

            const gas = this.web3.utils.toBN(estimatedGas);
            const balance = await this.getBalance(message.input.wallet, token, message, token.address);
            const value = this.web3.utils.toBN(params('_amount'));
            const requiredGas = value.add(gas); // Adding 10% - TODO: tune this value

            if(balance.lt(requiredGas)){
                return {success: false, message: "Address has not enough balance to transfer specified value + fees (" + requiredGas.toString() + ")"};
            }
        } else {
            // TODO: logic is needed for executeGasRelayed. 
        }
        
        return {
            success: true,
            message: "Valid transaction"
        };
    }

}

module.exports = SNTStrategy;
