const ganache = require("ganache-cli");
const Web3 = require('web3');
const erc20ABI = require('../../abi/ERC20Token.json');

/**
 * Abstract class used for validation strategies
 */
class BaseStrategy {

    /**
     * Validates if the contract being invoked represents an instance created via factory
     * @param {object} input - Object obtained from a `transaction` request.
     * @returns {bool} Valid instance or not
     */
    async _validateInstance(input){
        /*
        const baseVerifSignature = this.web3.utils.soliditySha3(this.contract.baseVerification).slice(0, 10);
    
        let verificationResult = await this.web3.eth.call({
            to: this.contract.factoryAddress, 
            data: baseVerifSignature + input.contract.slice(2)});
        
        return this.web3.eth.abi.decodeParameter('bool', verificationResult);
        */
       return true;
    }
    

    /**
     * @param {object} web3 - Web3 object already configured
     * @param {object} config - Configuration object obtained from `./config/config.js`
     * @param {object} settings - Settings obtained from parsing the configuration object
     * @param {object} contract - Object obtained from the settings based on the message topic
     */
    constructor(web3, config, settings, contract){
        this.web3 = web3;
        this.settings = settings;
        this.contract = contract;
        this.config = config;
    }

    /**
     * Obtain the balance in tokens or ETH from an address
     * @param {string} address - ETH address to obtain the balance from
     * @param {object} token - Obtained from `settings.getToken(tokenSymbol)`
     * @returns {web3.utils.BN} Balance
     */
    async getBalance(address, token){
        // Determining balances of token used
        if(token.symbol == "ETH"){
            return new this.web3.utils.BN(await this.web3.eth.getBalance(address));
        } else {
            const Token = new this.web3.eth.Contract(erc20ABI.abi);
            Token.options.address = token.address;
            return new this.web3.utils.BN(await Token.methods.balanceOf(address).call());  
        }
    }

    async getTokenRate(token, cache){
        // Get Price
        let tokenRate = cache.get(token.address);
        if(tokenRate === null){
            try {
                tokenRate = await token.pricePlugin.getRate();
                cache.put(token.address, tokenRate, token.refreshPricePeriod);
                return tokenRate;
            } catch (err) {
                console.error(err);
            }
        } else {
            return tokenRate;
        }
    }

    async getGasPrices(token, tokenRate){
        const {toBN} = this.web3.utils;
        const Token = new this.web3.eth.Contract(erc20ABI.abi);
        Token.options.address = token.address;
        const tokenDecimals = 18;
        const multiplier = toBN(Math.pow(10, tokenDecimals));
        const currentGasPrice = toBN(await this.web3.eth.getGasPrice());
        const currentGasConvertedToTokens = currentGasPrice.mul(multiplier).div(tokenRate);
        
        return {inEther: currentGasPrice, inTokens: currentGasConvertedToTokens};
    }

    /**
     * Build Parameters Function
     * @param {object} input - Object obtained from an `transaction` request. 
     * @returns {function} Function that simplifies accessing contract functions' parameters
     */
    _obtainParametersFunc(input){
        const parameterList = this.web3.eth.abi.decodeParameters(this.contract.allowedFunctions[input.functionName].inputs, input.functionParameters);
        return function(parameterName){
            return parameterList[parameterName];
        };
    }

    /**
     * Estimate gas using web3
     * @param {object} input - Object obtained from an `transaction` request.
     * @returns {web3.utils.toBN} Estimated gas fees
     */
    async _estimateGas(input){
        let p = {
            from: this.config.node.blockchain.account.address,
            to: input.contract,
            data: input.payload
        };
        const estimatedGas = await this.web3.eth.estimateGas(p);
        return this.web3.utils.toBN(estimatedGas);
    }

    /**
     * Simulate transaction using ganache. Useful for obtaining events
     * @param {object} input - Object obtained from an `transaction` request.
     * @returns {object} Simulated transaction receipt
     */
    async _simulateTransaction(input){
        let web3Sim = new Web3(ganache.provider({
            fork: `${this.config.node.ganache.protocol}://${this.config.node.ganache.host}:${this.config.node.ganache.port}`,
            locked: false,
            gasLimit: 10000000
        }));
        
        let simAccounts = await web3Sim.eth.getAccounts();

        let simulatedReceipt = await web3Sim.eth.sendTransaction({
            from: simAccounts[0],
            to: input.contract,
            value: 0,
            data: input.payload, 
            gasLimit: 9500000 // 95% of current chain latest gas block limit

        });
        return simulatedReceipt;
    }

    /*
    async execute(input){
        return {
            success: true,
            message: "Valid transaction"
        };
    }
    */
}

module.exports = BaseStrategy;
