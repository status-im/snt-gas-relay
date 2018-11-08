const Strategy = require('./BaseStrategy');

/**
 * Class representing a strategy to validate an 'availability' request.
 * @extends Strategy
 */
class AvailabilityStrategy extends Strategy {

    /**
     * Process availability strategy
     * @param {object} input - Object obtained from an 'availability' request. It expects an object with this structure `{contract, address, action, gasToken, gasPrice}`
     * @returns {object} Status of validation, and minimum price
     */
    async execute(input, cache){
        
        if(this.contract.isIdentity){
            let validInstance = await this._validateInstance(input);
            if(!validInstance){
                return {success: false, message: "Invalid identity instance"};
            }
        }

        // Verifying if token is allowed
        const token = this.settings.getToken(input.gasToken);
        if(token == undefined) return {success: false, message: "Token not allowed"};

        let tokenRate = await this.getTokenRate(token, cache);
        if(!tokenRate){
            return {
                success: false,
                message: "Token price unavailable"
            };
        }

        const {toBN} = this.web3.utils;

        const gasPrices = await this.getGasPrices(token, tokenRate);
        if(tokenRate.gte(token.minAcceptedRate) && gasPrices.inEther.lte(toBN(this.config.gasPrice.maxPrice))){
            return {
                success: true,
                message: {
                    message: "Available",
                    address: this.config.node.blockchain.account.address,
                    minGasPrice: gasPrices.inTokens.toString(),
                    gasPriceETH: gasPrices.inEther.add(toBN(this.config.gasPrice.modifier)).toString()
                }
            };
        }

        return {success: true};
    }

}

module.exports = AvailabilityStrategy;
