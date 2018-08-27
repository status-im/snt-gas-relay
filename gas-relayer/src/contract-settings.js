/**
 * Configuration Settings related to contracts
 */
class ContractSettings {

    /**
     * @param {object} config - Configuration object obtained from `./config/config.js`
     * @param {object} web3 - Web3 object already configured
     * @param {object} eventEmitter - Event Emitter
     */
    constructor(config, web3, eventEmitter){
        this.tokens = config.tokens;
        this.topics = [];
        this.contracts = config.contracts;
        this.config = config;
        
        this.web3 = web3;
        this.events = eventEmitter;

        this.pendingToLoad = 0;
    }

    /**
     * Process configuration file
     */
    process(){
        this._setTokenPricePlugin();
        this._processContracts();
    }

    /**
     * Set price plugin for token
     */
    _setTokenPricePlugin(){
        for(let token in this.tokens){
            if(this.tokens[token].pricePlugin !== undefined){
                let PricePlugin = require(this.tokens[token].pricePlugin);
                this.tokens[token].pricePlugin = new PricePlugin(this.tokens[token]);
            }
        }
    }

    /**
     * Get allowed tokens
     * @return {object} - Dictionary with allowed tokens (address as key)
     */
    getTokens(){
        return this.tokens;
    }

    /**
     * Get token by address
     * @param {string} - Token address
     * @return {object} - Token details
     */
    getToken(token){
        const tokenObj = this.tokens[token];
        tokenObj.address = token;
        return tokenObj;
    }

    /**
     * Get token by symbol
     * @param {string} - Token symbol
     * @return {object} - Token details
     */
    getTokenBySymbol(symbol){
        for(let token in this.tokens){
            if(this.tokens[token].symbol == symbol){
                const tokenObj = this.tokens[token];
                tokenObj.address = token;
                return tokenObj;
            }
        }
    }

    /**
     * Get contract by topicName
     * @param {string} topicName - Topic name that represents a contract
     * @return {object} - Contract details
     */
    getContractByTopic(topicName){
        return this.contracts[topicName];
    }

    /**
     * Calculate the topic based on the contract's name
     * @param {string} contractName - Name of the contract as it appears in the configuration
     * @return {string} - Topic
     */
    getTopicName(contractName){
        return this.web3.utils.toHex(contractName).slice(0, 10);
    }

    /**
     * Set contract's bytecode in the configuration
     * @param {string} topicName - Topic name that represents a contract
     */
    async _obtainContractBytecode(topicName){
        if(this.contracts[topicName].isIdentity) return;

        this.pendingToLoad++;

        try {
            const code = await this.web3.eth.getCode(this.contracts[topicName].address)
            this.contracts[topicName].code = this.web3.utils.soliditySha3(code);
            this.pendingToLoad--;
            if(this.pendingToLoad == 0) this.events.emit("setup:complete", this);
        } catch(err) {
            console.error("Invalid contract for " + topicName);
            console.error(err);
            process.exit();
        }
    }

    /**
     * Extract function details based on topicName
     * @param {string} topicName - Topic name that represents a contract
     */
    _extractFunctions(topicName){
        const contract = this.getContractByTopic(topicName);

        for(let i = 0; i < contract.allowedFunctions.length; i++){
            contract.allowedFunctions[i].functionName = contract.allowedFunctions[i].function.slice(0, contract.allowedFunctions[i].function.indexOf('('));
      
            // Extracting input
            contract.allowedFunctions[i].inputs = contract.abi.filter(x => x.name == contract.allowedFunctions[i].functionName && x.type == "function")[0].inputs;
      
            // Obtaining function signatures
            let functionSignature = this.web3.utils.sha3(contract.allowedFunctions[i].function).slice(0, 10);
            contract.allowedFunctions[functionSignature] = contract.allowedFunctions[i];
            delete this.contracts[topicName].allowedFunctions[i];
        }
      
        contract.functionSignatures = Object.keys(contract.allowedFunctions);
        this.contracts[topicName] = contract;
    }

    /**
     * Process contracts and setup the settings object
     */
    _processContracts(){
        for(let contractName in this.contracts){
            // Obtaining the abis
            this.contracts[contractName].abi = require(this.contracts[contractName].abiFile).abi;
            
            const topicName = this.getTopicName(contractName);

            // Extracting topic
            this.topics.push(topicName);
            this.contracts[topicName] = this.contracts[contractName];
            this.contracts[topicName].name = contractName;
            delete this.contracts[contractName];

            // Obtaining strategy
            if(this.contracts[topicName].strategy){
                this.contracts[topicName].strategy = this.buildStrategy(this.contracts[topicName].strategy, topicName);
            }
            
            this._obtainContractBytecode(topicName);

            this._extractFunctions(topicName);
        }
    }

    /**
     * Create strategy object based on source code and topicName
     * @param {string} strategyFile - Souce code path of strategy to build
     * @param {string} topicName - Hex string that represents a contract's topic
     */
    buildStrategy(strategyFile, topicName){
        const strategy = require(strategyFile);
        return new strategy(this.web3, this.config, this, this.contracts[topicName]);
    }
}


module.exports = ContractSettings;
