const Strategy = require('./BaseStrategy');

class SNTStrategy extends Strategy {

    async execute(message){
        const params = this._obtainParametersFunc(message);

        // TODO: logic is needed for executeGasRelayed. 

        
        // TODO: Transfers are simple and only need to:
        // -------- estimate cost of transfer
        // -------- check balance is enough to cover transfer + gas estimate
        // ------- notify if not enough balance for transfer too.


        return {
            success: true,
            message: "Valid transaction"
        };
    }

}

module.exports = SNTStrategy;
