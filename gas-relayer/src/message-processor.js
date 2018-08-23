class MessageProcessor {

    constructor(config, settings, web3, events){
        this.config = config;
        this.settings = settings;
        this.web3 = web3;
        this.events = events;
    }

    async _validateInput(contract, input){
        console.info("Processing request to: %s, %s", input.contract, input.functionName);

        if(contract == undefined){
            return {success: false, message: 'Unknown contract'};
        }
        
        if(!contract.functionSignatures.includes(input.functionName)){
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

    async process(contract, input, reply){
        const inputValidation = await this._validateInput(contract, input);
        if(!inputValidation.success){
            // TODO Log?
            reply(inputValidation);
            return;
        }

        let validationResult;

        if(contract.strategy){
            validationResult = await contract.strategy.execute(input, reply);
            if(!validationResult.success){
                reply(validationResult.message);
                return;
            }
        }

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
                return reply("Transaction mined", receipt);
            } catch(err){
                reply("Couldn't mine transaction: " + err.message);
                // TODO log this?
                console.error(err);
            }
        }
    }  
}

module.exports = MessageProcessor;
