const axios = require('axios');

class TokenUtils {
    constructor(tokenConfig, gasPrice){
        this.gasPrice = gasPrice;
        this.name = tokenConfig.name || "";
        this.symbol = tokenConfig.symbol || "";
        this.minRelayFactor = tokenConfig.minRelayFactor || 1;
    }

    async getRate(){
        // Using cryptocompare API
        const doc = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=' + this.symbol + '&tsyms=ETH');
        return parseFloat(doc.data.ETH);
    }

    calculateMinGasPrice(estimatedGas, currentPrice){
        // Example
        // Cost for a simple ETH transaction: 21000
        // Rate between SNT & ETH = 0.0001562;
        //
        // Total SNT that should be spent for a transaction at the previous price:
        // 21000 / 0.0001562 = 134443021
        //
        // Min Gas Price = Total SNT / Cost for Transaction
        // 134443021 / 21000 = 6402

        const totalGasCost = parseInt(estimatedGas, 10) * this.gasPrice;
        const totalTokenCost = totalGasCost / currentPrice;
        const minGasPrice = Math.ceil(totalTokenCost / totalGasCost);

        return minGasPrice;
    }
}





module.exports = TokenUtils;
