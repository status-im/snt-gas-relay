export const Contracts = {
    'Identity': 'IdentityGasRelay',
    'SNT': 'SNTController'
};

export const Functions = {
    'Identity': {
        'call': 'callGasRelayed',
        'approveAndCall': 'approveAndCallGasRelayed'
    }
};

export const Actions = {
    'Availability': 'availability',
    'Transaction': 'transaction'
};

const relayerSymmmetricKeyID = "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b";

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
        String(build.constructor) === String(StatusGasRelayer.Identity)
        );
    }

    static get AvailableRelayers() {
       return AvailableRelayersAction;
    }

    static get Identity() {
        return IdentityGasRelayedAction;
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

    setTransaction = (to, value, data) => {
        this.to = to;
        this.value = value;
        this.data = data;

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

        // TODO: this depends of the operation to execute
        const hashedMessage = await contract.methods.callGasRelayHash(
                this.to,
                this.value,
                web3.utils.soliditySha3({t: 'bytes', v: this.data}),
                nonce,
                this.gasPrice,
                this.gasLimit,
                this.gasToken
            ).call();
            
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
        // TODO: this depends on the operation to execute
        let jsonAbi = identityGasRelayABI.find(x => x.name == "callGasRelayed");
        let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                                                                this.to, 
                                                                this.value, 
                                                                this.data, 
                                                                this.nonce, 
                                                                this.gasPrice, 
                                                                this.gasLimit,
                                                                this.gasToken,
                                                                this.signature
                                                                ]);

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
      }
];

export default StatusGasRelayer;
