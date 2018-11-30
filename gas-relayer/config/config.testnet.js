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
            privateKey: "0x......" //
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
        "0x139724523662E54447B70d043b711b2A00c5EF49": {
            "name": "Status Test Token",
            "symbol": "SNT",
            "minAcceptedRate": 150000000000000,
            "refreshPricePeriod": 60000,
            "pricePlugin": "../plugins/token-utils.js"
        }
    },

    "contracts":{
        "IdentityGasRelay": {
            "abiFile": "../abi/IdentityGasRelay.json",
            "isIdentity": true,
            "factoryAddress": "0xCf3473C2A50F7A94D3D7Dcc2BeBbeE989dAA014E",
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
            "address": "0x1f42B87b375b8ac6C77A8CAd8E78319c18695E75",
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
