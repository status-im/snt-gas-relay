/**
 * Message Processor to analyze and execute strategies based on input objects
 */
class MessageProcessor {

    /**
     * @param {object} config - Configuration object obtained from `./config/config.js`
     * @param {object} settings - Settings obtained from parsing the configuration object
     * @param {object} web3 - Web3 object already configured
     * @param {object} events - Event emitter
     */
    constructor(config, settings, web3, events){
        this.config = config;
        this.settings = settings;
        this.web3 = web3;
        this.events = events;
    }

    /**
     * Validate input message content
     * @param {object} contract - Object obtained from the settings based on the message topic
     * @param {object} input - Object obtained from a message. 
     * @returns {object} State of validation
     */
    async _validateInput(contract, input){
        console.info("Processing '%s' request to contract: %s", input.action, input.contract);

        if(contract == undefined){
            return {success: false, message: 'Unknown contract'};
        }
        
        if(input.functionName && !contract.functionSignatures.includes(input.functionName)){
            return {success: false, message: 'Function not allowed'};
        }
            
        // Get code from contract and compare it against the contract code
        if(!contract.isIdentity){
            const code = this.web3.utils.soliditySha3(await this.web3.eth.getCode(input.contract));
            if(code != contract.code){
                return {success: false, message: 'Invalid contract code'};
            }
        } else {
            if(!(/^0x[0-9a-f]{40}$/i).test(input.contract)){
                return {success: false, message: 'Invalid contract address'};
            }
        }

        if(input.address && !(/^0x[0-9a-f]{40}$/i).test(input.address)){
            return {success: false, message: 'Invalid address'};
        }

        return {success: true};
    }

    /**
     * Process strategy and return validation result
     * @param {object} contract - Object obtained from the settings based on the message topic
     * @param {object} input - Object obtained from a message. 
     * @param {function} reply - Function to reply a message
     * @param {object} strategy - Strategy to apply. If undefined, it will use a strategy based on the contract
     * @returns {object} State of validation
     */
    async processStrategy(contract, input, reply, strategy){
        const inputValidation = await this._validateInput(contract, input);
        if(!inputValidation.success){
            // TODO Log?
            reply(inputValidation);
            return;
        }

        if(strategy || contract.strategy){
            let validationResult;
            if(strategy){
                validationResult = await strategy.execute(input, reply);
            } else {
                validationResult = await contract.strategy.execute(input, reply);
            }

            if(!validationResult.success){
                reply(validationResult.message);
                return;
            }

            return validationResult;
        }
    }

    /**
     * Process strategy and based on its result, send a transaction to the blockchain
     * @param {object} contract - Object obtained from the settings based on the message topic
     * @param {object} input - Object obtained from a message. 
     * @param {function} reply - function to reply a message
     * @returns {undefined}
     */
    async processTransaction(contract, input, reply){
        const validationResult = await this.processStrategy(contract, input, reply);
        
        let p = {
            from: this.config.node.blockchain.account,
            to: input.contract,
            value: 0,
            data: input.payload,
            gasPrice: this.config.gasPrice
        };

        if(!validationResult.estimatedGas){
            validationResult.estimatedGas = await this.web3.eth.estimateGas(p);
        }

        p.gas = parseInt(validationResult.estimatedGas * 1.05, 10); // Tune this
        
        const nodeBalance =  await this.web3.eth.getBalance(this.config.node.blockchain.account);
    
        if(nodeBalance < p.gas){
            reply("Relayer unavailable");
            console.error("Relayer doesn't have enough gas to process trx: %s, required %s", nodeBalance, p.gas);
            this.events.emit('exit');
        } else {
            try {
                const receipt = await this.web3.eth.sendTransaction(p);
                // TODO: parse events
                reply("Transaction mined", receipt);
            } catch(err){
                reply("Couldn't mine transaction: " + err.message);
                // TODO log this?
                console.error(err);
            }
        }
    }  
}

module.exports = MessageProcessor;
