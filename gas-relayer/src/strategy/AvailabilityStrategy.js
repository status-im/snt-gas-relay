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
    execute(input){
        // Verifying if token is allowed
        const token = this.settings.getToken(input.gasToken);
        if(token == undefined) return {success: false, message: "Token not allowed"};

        // TODO: Validate gasPrice, and return the minPrice accepted
        const minPrice = 0.00;

        return {
            success: true,
            message: {
                message: "Available",
                address: this.config.node.blockchain.account,
                minPrice: minPrice
            }
        };
    }

}

module.exports = AvailabilityStrategy;
