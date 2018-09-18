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
        // Verifying if token is allowed
        const token = this.settings.getToken(input.gasToken);
        if(token == undefined) return {success: false, message: "Token not allowed"};


        // Get Price
        let tokenRate = cache.get(input.gasToken);
        if(tokenRate === null){
            try {
                tokenRate = await token.pricePlugin.getRate();
                cache.put(input.gasToken, tokenRate, token.refreshPricePeriod);
            } catch (err) {
                console.error(err);
                return {
                    success: false,
                    message: "Token price unavailable"
                };
            }
        }

        const minRate = token.minAcceptedRate;

        if(tokenRate >= minRate){ // TODO: verify this
            return {
                success: true,
                message: {
                    message: "Available",
                    address: this.config.node.blockchain.account,
                    acceptedRate: tokenRate,
                    gasPriceUsed: this.config.gasPrice
                }
            };
        } else {
            return {success: true};
        }
    }

}

module.exports = AvailabilityStrategy;
