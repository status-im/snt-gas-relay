const Strategy = require('./BaseStrategy');

class AvailabilityStrategy extends Strategy {

    async execute(input){
        // Verifying if token is allowed
        const token = this.settings.getToken(input.gasToken);
        if(token == undefined) return {success: false, message: "Token not allowed"};

        // TODO Validate gasPrice, and return the minPrice accepted
        const minPrice = 0.00;

        return {
            success: true,
            message: {
                message: "Available",
                minPrice: minPrice
            }
        };
    }

}

module.exports = AvailabilityStrategy;
