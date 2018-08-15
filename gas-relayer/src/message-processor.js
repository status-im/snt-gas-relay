class MessageProcessor {

    constructor(config, settings, web3, kId){
        this.config = config;
        this.settings = settings;
        this.web3 = web3;
        this.kId = kId;
    }

    _reply(text, message, receipt){
        if(message.sig !== undefined){
            console.log(text);
            this.web3.shh.post({ 
                pubKey: message.sig, 
                sig: this.kId,
                ttl: this.config.node.whisper.ttl, 
                powTarget:this.config.node.whisper.minPow, 
                powTime: this.config.node.whisper.powTime, 
                topic: message.topic, 
                payload: this.web3.utils.fromAscii(JSON.stringify({message:text, receipt}, null, " "))
            }).catch(console.error);
        }
    }

    async _validateInput(message){
        console.info("Processing request to: %s, %s", message.input.contract, message.input.functionName);

        const contract = this.settings.getContractByTopic(message.topic);

        if(contract == undefined){
            this._reply('Invalid topic', message);
            return false;
        }
        
        if(!contract.functionSignatures.includes(message.input.functionName)){
            this._reply('Function not allowed', message);
            return false;
        }
            
        // Get code from contract and compare it against the contract code
        if(!contract.isIdentity){
            const code = this.web3.utils.soliditySha3(await this.web3.eth.getCode(message.input.contract));
            if(code != contract.code){
                this._reply('Invalid contract code', message);
                return false;
            }
        } else {
            if(!(/^0x[0-9a-f]{40}$/i).test(message.input.contract)){
                this._reply('Invalid contract address', message);
                return false;
            }
        }

        if(message.input.address && !(/^0x[0-9a-f]{40}$/i).test(message.input.address)){
            this._reply('Invalid address', message);
            return false;
        }

        return true;
    }

    _extractInput(message){
        let obj = {
            contract: null,
            address: null,
            functionName: null,
            functionParameters: null,
            payload: null
        };

        try {
            const msg = this.web3.utils.toAscii(message.payload);
            let parsedObj = JSON.parse(msg);
            obj.contract = parsedObj.contract;
            obj.address = parsedObj.address;
            obj.functionName = parsedObj.encodedFunctionCall.slice(0, 10);
            obj.functionParameters = "0x" + parsedObj.encodedFunctionCall.slice(10);
            obj.payload = parsedObj.encodedFunctionCall;
        } catch(err){
            console.error("Couldn't parse " + message);
        }
        
        message.input = obj;
    }

    /*
    _getFactor(input, contract, gasToken){
        if(contract.allowedFunctions[input.functionName].isToken){
            return this.web3.utils.toBN(this.settings.getToken(gasToken).pricePlugin.getFactor());
        } else {
            return this.web3.utils.toBN(1);
        }
    } */

    async process(error, message){
        if(error){
          console.error(error);
        } else {
            this._extractInput(message);
            const contract = this.settings.getContractByTopic(message.topic);

            if(!await this._validateInput(message)) return; // TODO Log

            if(contract.strategy){
                let validationResult = await contract.strategy.execute(message);
                if(!validationResult.success){
                    return this._reply(validationResult.message, message);
                }
            }

            let p = {
                from: this.config.node.blockchain.account,
                to: message.input.contract,
                value: 0,
                data: message.input.payload,
                gasPrice: this.config.gasPrice
            };

            this.web3.eth.estimateGas(p)
            .then((estimatedGas) => {
                p.gas = parseInt(estimatedGas * 1.1, 10);
                return this.web3.eth.sendTransaction(p);
            })
            .then((receipt) => {
                return this._reply("Transaction mined", message, receipt);
            }).catch((err) => {
                this._reply("Couldn't mine transaction: " + err.message, message);
                // TODO log this?
                console.error(err);
            });
        }
    }  
}

module.exports = MessageProcessor;
