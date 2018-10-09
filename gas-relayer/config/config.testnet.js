module.exports = {
    "node": {
        "local":{
            "protocol": "ws",
            "host": "localhost",
            "port": 8546
        },
        "ganache": {
            "protocol": "http",
            "host": "localhost",
            "port": 8545
        },
        "blockchain": {
            "account": "0xb8d851486d1c953e31a44374aca11151d49b8bb3"
        },
        "whisper": {
            "symKey": "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b",
            "ttl": 10,
            "minPow": 0.002,
            "powTime": 1
        }
    },
    
    "tokens": {
        "0x0000000000000000000000000000000000000000": {
            "name": "Ethereum",
            "symbol": "ETH",
            "minAcceptedRate": 1,
            "refreshPricePeriod": 60000
        },
        "0x91a3473a3e1e3D61C29fa2fAcDf17fa0Db922a08": {
            "name": "Status Gas Relayer Test Token",
            "symbol": "SNT",
            "minAcceptedRate": 0.0001500,
            "pricePlugin": "../plugins/token-utils.js",
            "refreshPricePeriod": 60000
        }
    },

    "contracts":{
        "IdentityGasRelay": {
            "abiFile": "../abi/IdentityGasRelay.json",
            "isIdentity": true,
            "factoryAddress": "0xC83a746c3B73457FF51eCE216bfBFb524aa4fDD0",
            "kernelVerification": "isKernel(bytes32)",
            "allowedFunctions": [
                { 
                    "function": "approveAndCallGasRelayed(address,address,uint256,bytes,uint256,uint256,uint256,address,bytes)", 
                    "isToken": true
                },
                {
                    "function": "callGasRelayed(address,uint256,bytes,uint256,uint256,uint256,address,bytes)",
                    "isToken": false
                }
            ],
            "strategy": "../src/strategy/IdentityStrategy.js"
        },
        "SNTController": {
            "abiFile": "../abi/SNTController.json",
            "isIdentity": false,
            "address": "0x39bFD424c2A83ca56FD557b373C01A27475bB314",
            "allowedFunctions": [
                {
                    "function":"transferSNT(address,uint256,uint256,uint256,bytes)"
                },
                {
                    "function":"executeGasRelayed(address,bytes,uint256,uint256,uint256,bytes)"
                }
            ],
            "strategy": "../src/strategy/SNTStrategy.js"
        }
    },
    "gasPrice": {
        "modifier": 50000, // Added/removed to current network gas price
        "maxPrice": 20000000000 // 20 gwei
    }
};
