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
            // privateKey: "your_private_key",
            
            // privateKeyFile: "path/to/file"

            // mnemonic: "12 word mnemonic",
            // addressIndex: "0", // Optionnal. The index to start getting the address
            // hdpath: "m/44'/60'/0'/0/" // Optionnal. HD derivation path
        },
        "whisper": {
            "symKey": "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b",
            "ttl": 1000,
            "minPow": 0.2,
            "powTime": 1000
        }
    },
    
    "tokens": {
        "0x0000000000000000000000000000000000000000": {
            "name": "Ethereum",
            "symbol": "ETH",
            "minAcceptedRate": 1,
            "refreshPricePeriod": 60000
        },
        "%STTAddress%": {
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
            "factoryAddress": "%IdentityFactoryAddress%",
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
            "address": "%SNTController%",
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
