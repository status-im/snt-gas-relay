import GasRelay from 'Embark/contracts/GasRelay';
import TokenGasRelay from 'Embark/contracts/TokenGasRelay';

export const Contracts = {
    'GasRelay': 'GasRelay',
    'TokenGasRelay': 'TokenGasRelay'
};

export const Functions = {
    'GasRelay': {
        'call': 'callGasRelay',
        'deploy': 'deployGasRelay',
        'approveAndCall': 'approveAndCallGasRelay'
    },
    'TokenGasRelay': {
        'transfer': 'transferGasRelay',
        'execute': 'executeGasRelay',
        'convert': 'convertGasRelay'
    }
};

export const Actions = {
    'Availability': 'availability',
    'Transaction': 'transaction'
};

export const Messages = {
    'available': 'Available'
};

const relayerSymmmetricKeyID = "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b";
const emptyBytesSha = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";

class StatusGasRelayer {
    constructor(build, web3) {
        if (arguments.length !== 2 || !this.validateBuild(build)) throw new Error("Invalid build");

        this.web3 = web3;

        Object.defineProperties(this, {
            message: {
                value: build._getMessage(web3),
                writable: false
            },
            topic: {
                value: web3.utils.toHex(build.contractName).slice(0, 10),
                writable: false
            },
            kid: {
                value: build.kid,
                writable: false
            }
        });

        if(build.operation === Actions.Transaction){
            Object.defineProperties(this, {
                pubKey: {
                    value: build.relayer,
                    writable: false
                }
            });
        } else {
            Object.defineProperties(this, {
                skid: {
                    value: build.skid,
                    writable: false
                }
            });
        }
    }

    static async subscribe(web3, cb, options) {
        options = options || {};

        if(!options.privateKeyID){
            options.privateKeyID = await web3.shh.newKeyPair();
            // TODO: keypair should be shared between actions and this class.
        }

        web3.shh.subscribe('messages', {
            "privateKeyID": options.privateKeyID,
            "ttl": options.ttl || 1000,
            "minPow": options.minPow || 0.002,
            "powTime": options.powTime || 1000
          }, (error, message) => {
            if(error){
                cb(error);
                return;
            }

            try {
                const msg = web3.utils.toAscii(message.payload);
                const msgObj = JSON.parse(msg);
                msgObj.sig =  message.sig;
                cb(false, msgObj);
            } catch (err) {
                cb(err);
            }
        });     
    }

    post = async (options) => {
        options = options || {};

        let pubKey = options.pubKey || this.pubKey;
        let skid = options.skid || this.skid;

        let kid = options.kid || this.kid;
        if(!kid){
            kid = await this.web3.shh.newKeyPair();
        }

        const sendOptions = {
            ttl: options.ttl || 10, 
            sig: kid,
            powTarget: options.powTarget || 0.002, 
            powTime: options.powTime || 1, 
            topic: this.topic,
            payload: this.web3.utils.toHex(this.message)
        };

        if(pubKey){
            sendOptions.pubKey = pubKey;
        } else {
            if(!skid){
                skid = await this.web3.shh.addSymKey(relayerSymmmetricKeyID);
            }
            sendOptions.symKeyID = skid;
        }
        
        await this.web3.shh.post(sendOptions);

        console.log("Message ID: " + this.message.id);

        return this.message.id;
    }

    validateBuild = (build) => {
       return (String(build.constructor) === String(StatusGasRelayer.AvailableRelayers) || 
        String(build.constructor) === String(StatusGasRelayer.GasRelay) ||
        String(build.constructor) === String(StatusGasRelayer.TokenGasRelay)
        );
    }

    static get AvailableRelayers() {
       return AvailableRelayersAction;
    }

    static get GasRelay() {
        return GasRelayAction;
    }

    static get TokenGasRelay() {
        return TokenGasRelayAction;
    }
}

class Action {
    setGas(token, price, limit){
        this.gasToken = token;
        this.gasPrice = price;
        this.gasLimit = limit;
        return this;
    }

    setOperation(operation){
        this.operation = operation;
        return this;
    }

    setRelayerAddress(relayerAddress){
        this.gasRelayer = relayerAddress;
        return this;
    }

    setRelayer(relayer){
        this.relayer = relayer;
        return this;
    }

    setRelayersSymKeyID = (skid) => {
        this.skid = skid;
        return this;
    }

    setAsymmetricKeyID = (kid) => {
        this.kid = kid;
        return this;
    }
}

class GasRelayAction extends Action {
    constructor(contractAddress, accountAddress) {
        super();
        this.contractName = Contracts.GasRelay;
        this.contractAddress = contractAddress;
        this.accountAddress = accountAddress;

        this.operation = Actions.Transaction;
        return this;
    }

    setContractFunction = contractFunction => {
        this.contractFunction = contractFunction;
        return this;
    }

    setTransaction = (to, value, data) => {
        this.to = to;
        this.value = value;
        this.data = data;

        return this;
    }

    setBaseToken = baseToken => {
        this.baseToken = baseToken;
        return this;
    }

    _nonce = async(contract) => {
        const nonce = await contract.methods.getNonce().call();
        return nonce;
    }

    getNonce = async (web3) => {
        const contract = new web3.eth.Contract(GasRelay.options.jsonInterface, this.contractAddress);
        const nonce = await this._nonce(contract);
        return nonce;
    }

    sign = async web3 => {
        const contract = new web3.eth.Contract(GasRelay.options.jsonInterface, this.contractAddress);
        const nonce = await this._nonce(contract);
        let hashedMessage;

        switch(this.contractFunction){
            case Functions.GasRelay.call:
                hashedMessage = await contract.methods.callGasRelayHash(
                    this.to,
                    this.value,
                    this.data == "0x" ? emptyBytesSha : web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasToken,
                    this.gasRelayer
                ).call();
                break;
                case Functions.GasRelay.approveAndCall:
                hashedMessage = await contract.methods.approveAndCallGasRelayHash(
                    this.baseToken,
                    this.to,
                    this.value,
                    this.data == "0x" ? emptyBytesSha : web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasRelayer
                ).call(); 
                break;
                case Functions.GasRelay.deploy:
                hashedMessage = await contract.methods.deployGasRelayHash(
                    this.value,
                    this.data == "0x" ? emptyBytesSha : web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasToken,
                    this.gasRelayer
                ).call(); 
                break;
            default:
                throw new Error("Function not allowed");
        }
          
        const signedMessage = await web3.eth.personal.sign(hashedMessage, this.accountAddress);

        return signedMessage;
    }

    post = async (signature, web3, options) => {
        this.nonce = await this.getNonce(web3);
        this.signature = signature;
        
        const s = new StatusGasRelayer(this, web3);
        return s.post(options);
    }

    _getMessage = web3 => {
        let jsonAbi = GasRelay.options.jsonInterface.find(x => x.name == this.contractFunction);
        let funCall;

        switch(this.contractFunction){
            case Functions.GasRelay.call:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.to, 
                            this.value, 
                            this.data, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.gasToken,
                            this.signature
                            ]);
                break;
            case Functions.GasRelay.approveAndCall:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.baseToken,
                            this.to, 
                            this.value, 
                            this.data, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.signature
                            ]);
                break;
            case Functions.GasRelay.deploy:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                    this.value, 
                    this.data, 
                    this.gasPrice, 
                    this.gasLimit,
                    this.gasToken,
                    this.signature
                    ]);
                break;
            default:
                throw new Error("Function not allowed");
        }

        return {
            'id': (new Date()).getTime(),
            'contract': this.contractAddress,
            'address': this.accountAddress,
            'action': Actions.Transaction,
            'encodedFunctionCall': funCall
        };
    }
}

class TokenGasRelayAction extends Action {
    constructor(contractAddress, accountAddress) {
        super();
        this.contractName = Contracts.TokenGasRelay;
        this.contractAddress = contractAddress;
        this.accountAddress = accountAddress;

        this.operation = Actions.Transaction;
        return this;
    }

    transfer = (to, value) => {
        this.to = to;
        this.value = value;
        this.contractFunction = Functions.TokenGasRelay.transfer;
        return this;
    }

    convert = (value) => {
        this.value = value;
        this.contractFunction = Functions.TokenGasRelay.convert;
        return this;
    }

    execute = (contract, data) => {
        this.allowedContract = contract;
        this.data = data;
        this.contractFunction = Functions.TokenGasRelay.execute;
        return this;
    }

    _nonce = async(contract) => {
        const nonce = await contract.methods.getNonce(this.accountAddress).call();
        return nonce;
    }

    getNonce = async (web3) => {
        const contract = new web3.eth.Contract(TokenGasRelay.options.jsonInterface, this.contractAddress);
        const nonce = await this._nonce(contract);
        return nonce;
    }

    sign = async web3 => {
        const contract = new web3.eth.Contract(TokenGasRelay.options.jsonInterface, this.contractAddress);
        const nonce = await this._nonce(contract);
        let hashedMessage;
        switch(this.contractFunction){
            case Functions.TokenGasRelay.execute:
                hashedMessage = await contract.methods.getExecuteGasRelayHash(
                    this.allowedContract,
                    this.data,
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasRelayer
                ).call();
                break;
            case Functions.TokenGasRelay.transfer:
                hashedMessage = await contract.methods.getTransferGasRelayHash(
                    this.to,
                    this.value,
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasRelayer
                ).call(); 
                break;
            case Functions.TokenGasRelay.convert:
                hashedMessage = await contract.methods.getConvertGasRelayHash(
                    this.value,
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasRelayer
                ).call(); 
                break;
            default:
                throw new Error("Function not allowed");
        }

        const signedMessage = await web3.eth.personal.sign(hashedMessage, this.accountAddress);

        return signedMessage;
    }

    post = async (signature, web3, options) => {
        this.nonce = await this.getNonce(web3);
        this.signature = signature;
        const s = new StatusGasRelayer(this, web3);
        return s.post(options);
    }

    _getMessage = web3 => {
        let jsonAbi = TokenGasRelay.options.jsonInterface.find(x => x.name == this.contractFunction);
        let funCall;

        switch(this.contractFunction){
            case Functions.TokenGasRelay.execute:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.allowedContract, 
                            this.data, 
                            this.nonce, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.signature
                            ]);
                break;
            case Functions.TokenGasRelay.transfer:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.to, 
                            this.value, 
                            this.nonce, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.signature
                            ]);
                break;
            case Functions.TokenGasRelay.convert:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.value, 
                            this.nonce, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.signature
                            ]);
                break;
            default:
                throw new Error("Function not allowed");
        }

        return {
            'id': (new Date()).getTime(),
            'contract': this.contractAddress,
            'address': this.accountAddress,
            'action': Actions.Transaction,
            'encodedFunctionCall': funCall
        };
    }
}


class AvailableRelayersAction extends Action {
    constructor(contractName, contractAddress, accountAddress) {
        super();
        this.contractName = contractName;
        this.contractAddress = contractAddress;
        this.accountAddress = accountAddress;

        this.operation = Actions.Availability;

        return this;
    }

    _getMessage = web3 => {
        return {
            id: (new Date()).getTime(),
            contract: this.contractAddress,
            address: this.accountAddress || web3.eth.defaultAccount,
            action: Actions.Availability,
            gasToken: this.gasToken,
            gasPrice: this.gasPrice
        };
    }

    post(web3, options) {
        const s = new StatusGasRelayer(this, web3);
        return s.post(options);
    }
}

export default StatusGasRelayer;
