export const Contracts = {
    'Identity': 'IdentityGasRelay',
    'SNT': 'SNTController'
};

export const Functions = {
    'Identity': {
        'call': 'callGasRelayed',
        'approveAndCall': 'approveAndCallGasRelayed'
    },
    'SNT': {
        'transfer': 'transferSNT',
        'execute': 'executeGasRelayed'
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
            ttl: options.ttl || 1000, 
            sig: kid,
            powTarget: options.powTarget || 1, 
            powTime: options.powTime || 20, 
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
        
        const msgId = await this.web3.shh.post(sendOptions);
        return msgId;
    }

    validateBuild = (build) => {
       return (String(build.constructor) === String(StatusGasRelayer.AvailableRelayers) || 
        String(build.constructor) === String(StatusGasRelayer.Identity) ||
        String(build.constructor) === String(StatusGasRelayer.SNTController)
        );
    }

    static get AvailableRelayers() {
       return AvailableRelayersAction;
    }

    static get Identity() {
        return IdentityGasRelayedAction;
    }

    static get SNTController() {
        return SNTControllerAction;
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

class IdentityGasRelayedAction extends Action {
    constructor(contractAddress, accountAddress) {
        super();
        this.contractName = Contracts.Identity;
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
        const nonce = await contract.methods.nonce().call();
        return nonce;
    }

    getNonce = async (web3) => {
        const contract = new web3.eth.Contract(identityGasRelayABI, this.contractAddress);
        const nonce = await this._nonce(contract);
        return nonce;
    }

    sign = async web3 => {
        const contract = new web3.eth.Contract(identityGasRelayABI, this.contractAddress);
        const nonce = await this._nonce(contract);
        let hashedMessage;

        switch(this.contractFunction){
            case Functions.Identity.call:
                hashedMessage = await contract.methods.callGasRelayHash(
                    this.to,
                    this.value,
                    this.data == "0x" ? emptyBytesSha : web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasToken
                ).call();
                break;
            case Functions.Identity.approveAndCall:
                hashedMessage = await contract.methods.deployGasRelayHash(
                    this.value,
                    this.data == "0x" ? emptyBytesSha : web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                    nonce,
                    this.gasPrice,
                    this.gasLimit,
                    this.gasToken
                ).call(); 
                break;
            default:
                throw new Error("Function not allowed");
        }
          
        const signedMessage = await web3.eth.sign(hashedMessage, this.accountAddress);

        return signedMessage;
    }

    post = async (signature, web3, options) => {
        this.nonce = await this.getNonce(web3);
        this.signature = signature;
        
        const s = new StatusGasRelayer(this, web3);
        return s.post(options);
    }

    _getMessage = web3 => {
        let jsonAbi = identityGasRelayABI.find(x => x.name == this.contractFunction);
        let funCall;
        
        switch(this.contractFunction){
            case Functions.Identity.call:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.to, 
                            this.value, 
                            this.data, 
                            this.nonce, 
                            this.gasPrice, 
                            this.gasLimit,
                            this.gasToken,
                            this.signature
                            ]);
                break;
            case Functions.Identity.approveAndCall:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.baseToken,
                            this.to, 
                            this.value, 
                            this.data, 
                            this.nonce, 
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
            'contract': this.contractAddress,
            'address': this.accountAddress,
            'action': Actions.Transaction,
            'encodedFunctionCall': funCall
        };
    }
}

class SNTControllerAction extends Action {
    constructor(contractAddress, accountAddress) {
        super();
        this.contractName = Contracts.SNT;
        this.contractAddress = contractAddress;
        this.accountAddress = accountAddress;

        this.operation = Actions.Transaction;
        return this;
    }

    transferSNT = (to, value) => {
        this.to = to;
        this.value = value;
        this.contractFunction = Functions.SNT.transfer;
        return this;
    }

    execute = (contract, data) => {
        this.allowedContract = contract;
        this.data = data;
        this.contractFunction = Functions.SNT.execute;
        return this;
    }

    _nonce = async(contract) => {
        const nonce = await contract.methods.signNonce(this.accountAddress).call();
        return nonce;
    }

    getNonce = async (web3) => {
        const contract = new web3.eth.Contract(sntControllerABI, this.contractAddress);
        const nonce = await this._nonce(contract);
        return nonce;
    }

    setGas(price, minimal){
        this.gasPrice = price;
        this.gasMinimal = minimal;
        return this;
    }

    sign = async web3 => {
        const contract = new web3.eth.Contract(sntControllerABI, this.contractAddress);
        const nonce = await this._nonce(contract);
        let hashedMessage;

        switch(this.contractFunction){
            case Functions.SNT.execute:
                hashedMessage = await contract.methods.getExecuteGasRelayedHash(
                    this.allowedContract,
                    this.data,
                    nonce,
                    this.gasPrice,
                    this.gasMinimal,
                ).call();
                break;
            case Functions.SNT.transfer:
                hashedMessage = await contract.methods.getTransferSNTHash(
                    this.to,
                    this.value,
                    nonce,
                    this.gasPrice
                ).call(); 
                break;
            default:
                throw new Error("Function not allowed");
        }
          
        const signedMessage = await web3.eth.sign(hashedMessage, this.accountAddress);

        return signedMessage;
    }

    post = async (signature, web3, options) => {
        this.nonce = await this.getNonce(web3);
        this.signature = signature;
        const s = new StatusGasRelayer(this, web3);
        return s.post(options);
    }

    _getMessage = web3 => {
        let jsonAbi = sntControllerABI.find(x => x.name == this.contractFunction);
        let funCall;

        switch(this.contractFunction){
            case Functions.SNT.execute:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.allowedContract, 
                            this.data, 
                            this.nonce, 
                            this.gasPrice, 
                            this.gasMinimal,
                            this.signature
                            ]);
                break;
            case Functions.SNT.transfer:
                funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                            this.to, 
                            this.value, 
                            this.nonce, 
                            this.gasPrice, 
                            this.signature
                            ]);
                break;
            default:
                throw new Error("Function not allowed");
        }

        return {
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

const sntControllerABI = [
    {
        "constant": true,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          }
        ],
        "name": "getTransferSNTHash",
        "outputs": [
          {
            "name": "txHash",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0x0c1f1f25"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_allowedContract",
            "type": "address"
          },
          {
            "name": "_data",
            "type": "bytes"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_gasMinimal",
            "type": "uint256"
          }
        ],
        "name": "getExecuteGasRelayedHash",
        "outputs": [
          {
            "name": "execHash",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0x31c128b1"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_signature",
            "type": "bytes"
          }
        ],
        "name": "transferSNT",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0x916b6511"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_allowedContract",
            "type": "address"
          },
          {
            "name": "_data",
            "type": "bytes"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_gasMinimal",
            "type": "uint256"
          },
          {
            "name": "_signature",
            "type": "bytes"
          }
        ],
        "name": "executeGasRelayed",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0x754e6ab0"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "signNonce",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0x907920c7"
      }
];

const identityGasRelayABI = [
    {
        "constant": true,
        "inputs": [
        {
            "name": "_to",
            "type": "address"
        },
        {
            "name": "_value",
            "type": "uint256"
        },
        {
            "name": "_dataHash",
            "type": "bytes32"
        },
        {
            "name": "_nonce",
            "type": "uint256"
        },
        {
            "name": "_gasPrice",
            "type": "uint256"
        },
        {
            "name": "_gasLimit",
            "type": "uint256"
        },
        {
            "name": "_gasToken",
            "type": "address"
        }
        ],
        "name": "callGasRelayHash",
        "outputs": [
        {
            "name": "_callGasRelayHash",
            "type": "bytes32"
        }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0xe27e2e5c"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "nonce",
        "outputs": [
        {
            "name": "",
            "type": "uint256"
        }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0xaffed0e0"
    },
    {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_data",
            "type": "bytes"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_gasLimit",
            "type": "uint256"
          },
          {
            "name": "_gasToken",
            "type": "address"
          },
          {
            "name": "_messageSignatures",
            "type": "bytes"
          }
        ],
        "name": "callGasRelayed",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0xfd0dded5"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_baseToken",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_data",
            "type": "bytes"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_gasLimit",
            "type": "uint256"
          },
          {
            "name": "_gasToken",
            "type": "address"
          },
          {
            "name": "_messageSignatures",
            "type": "bytes"
          }
        ],
        "name": "approveAndCallGasRelayed",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0x59f4ac61"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_dataHash",
            "type": "bytes32"
          },
          {
            "name": "_nonce",
            "type": "uint256"
          },
          {
            "name": "_gasPrice",
            "type": "uint256"
          },
          {
            "name": "_gasLimit",
            "type": "uint256"
          },
          {
            "name": "_gasToken",
            "type": "address"
          }
        ],
        "name": "deployGasRelayHash",
        "outputs": [
          {
            "name": "_callGasRelayHash",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0x86962d85"
      }
];

export default StatusGasRelayer;
