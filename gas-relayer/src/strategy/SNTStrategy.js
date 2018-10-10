const Strategy = require('./BaseStrategy');

const TransferSNT = "0x916b6511";
const ExecuteGasRelayed = "0x754e6ab0";

/**
 * Class representing a strategy to validate a `transaction` request when the topic is related to SNTController.
 * @extends Strategy
 */
class SNTStrategy extends Strategy {

    /**
     * Process SNTController strategy
     * @param {object} input - Object obtained from an 'transaction' request. It expects an object with this structure `{contract, address, action, functionName, functionParameters, payload}`
     * @returns {object} Status of validation and estimated gas
     */
    async execute(input, cache){
        const params = this._obtainParametersFunc(input);

        // Verifying if token is allowed
        const token = this.settings.getTokenBySymbol("SNT");
        if(token == undefined) return {success: false, message: "Token not allowed"};
        
        const balance = await this.getBalance(input.address, token);

        let estimatedGas;
        try {
            estimatedGas = await this.web3.eth.estimateGas({
                data: input.payload,
                from: this.config.node.blockchain.account.address,
                to: input.contract
            });
        } catch(exc){
            if(exc.message.indexOf("revert") > -1) return {success: false, message: "Transaction will revert"};
            else {
                console.error(exc);
                return {success: false, message: "Transaction will fail"};
            }
        }

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

        const gasPrice = this.web3.utils.toBN(params('_gasPrice'));
        if(gasPrice.lt(gasPrices.inTokens)){
            return {success: false, message: "Gas price is less than the required amount (" + gasPrices.inTokens.toString(10) + ")"};
        }

        if(input.functionName == TransferSNT){
            const gas = this.web3.utils.toBN(estimatedGas);
            const value = this.web3.utils.toBN(params('_amount'));
            const requiredGas = value.add(gas);

            if(balance.lt(requiredGas)){
                return {success: false, message: "Address has not enough balance to transfer specified value + fees (" + requiredGas.toString() + ")"};
            }
        } else if(input.functionName == ExecuteGasRelayed){
            const latestBlock = await this.web3.eth.getBlock("latest");
            let estimatedGas = 0;
            try {
                const simulatedReceipt = await this._simulateTransaction(input, latestBlock.gasLimit);
                estimatedGas = this.web3.utils.toBN(simulatedReceipt.gasUsed);
            } catch(exc){
                if(exc.message.indexOf("revert") > -1) return {success: false, message: "Transaction will revert"};
            }

            if(balance.lt(estimatedGas)){
                return {success: false, message: "Address has not enough balance to execute the transaction (" + estimatedGas.toString() + ")"};
            }

            const gasMinimal = this.web3.utils.toBN(params('_gasMinimal'));
            if(gasMinimal.lt(estimatedGas)){
                return {success: false, message: "Gas minimal is less than estimated gas (" + estimatedGas.toString() + ")"};
            }

            if(balance.lt(gasMinimal)){
                return {success: false, message: "Address has not enough balance for the specified _gasMinimal"};
            }
        }
        
        return {
            success: true,
            message: "Valid transaction",
            estimatedGas
        };
    }

}

module.exports = SNTStrategy;
