export const Contracts = {
    'Identity': 'IdentityGasRelay',
    'SNT': 'SNTController'
};

export const Functions = {
    'Identity': {
        'call': 'callGasRelayed',
        'approveAndCall': 'approveAndCallGasRelayed'
    }
}

export const Actions = {
    'Availability': 'availability',
    'Transaction': 'transaction'
}

const relayerSymmmetricKeyID = "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b";

class StatusGasRelayer {
    constructor(build, web3) {
        this.web3 = web3;
        if (arguments.length === 2 && this.validateBuild(build)) {
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
                },
                skid: {
                    value: build.skid,
                    writable: false
                }
            });
        }
    }

    post = async (options) => {
        options = options || {};

        let skid = options.skid || this.skid;
        if(!skid){
            skid = await this.web3.shh.addSymKey(relayerSymmmetricKeyID);
        }

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
            symKeyID: skid,
            payload: this.web3.utils.toHex(this.message)
        };

        return await web3.shh.post(sendOptions);
    }

    validateBuild = (build) => {
       return (String(build.constructor) === String(StatusGasRelayer.AvailableRelayers));
    }

    static get AvailableRelayers() {
       return AvailableRelayersAction;
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

    setRelayersSymKeyID = (skid) => {
        this.skid = skid;
        return this;
    }

    setAsymmetricKeyID = (kid) => {
        this.kid = kid;
        return this;
    }

    _getMessage = (web3) => {
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

export default StatusGasRelayer;