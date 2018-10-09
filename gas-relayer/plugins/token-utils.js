const axios = require('axios');

class TokenUtils {
    constructor(tokenConfig, gasPrice, web3){
        this.gasPrice = gasPrice;
        this.name = tokenConfig.name || "";
        this.symbol = tokenConfig.symbol || "";
        this.minRelayFactor = tokenConfig.minRelayFactor || 1;
        this.web3 = web3;
    }

    async getRate(){
        // Using cryptocompare API
        const {toBN, toWei} = this.web3.utils;

        const doc = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=' + this.symbol + '&tsyms=ETH');
        return toBN(toWei(doc.data.ETH.toString(), "ether"));
    }
}


module.exports = TokenUtils;
