const ganache = require("ganache-cli");
const Web3 = require('web3');
const erc20ABI = require('../../abi/ERC20Token.json');

class BaseStrategy {
    constructor(web3, config, settings, contract){
        this.web3 = web3;
        this.settings = settings;
        this.contract = contract;
        this.config = config;
    }

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

    _obtainParametersFunc(message){
        const parameterList = this.web3.eth.abi.decodeParameters(this.contract.allowedFunctions[message.input.functionName].inputs, message.input.functionParameters);
        return function(parameterName){
            return parameterList[parameterName];
        };
    }

    async _estimateGas(message, gasLimit){
        let web3Sim = new Web3(ganache.provider({
            fork: `${this.config.node.ganache.protocol}://${this.config.node.ganache.host}:${this.config.node.ganache.port}`,
            locked: false,
            gasLimit: 10000000
        }));
        
        let simAccounts = await web3Sim.eth.getAccounts();
        
        let simulatedReceipt = await web3Sim.eth.sendTransaction({
            from: simAccounts[0],
            to: message.input.address,
            value: 0,
            data: message.input.payload, 
            gasLimit: gasLimit * 0.95 // 95% of current chain latest gas block limit

        });

        return web3Sim.utils.toBN(simulatedReceipt.gasUsed);
    }

    /*
    async execute(message){
        return {
            success: true,
            message: "Valid transaction"
        };
    }
    */
}

module.exports = BaseStrategy;
