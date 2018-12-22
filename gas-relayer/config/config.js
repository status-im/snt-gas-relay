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
            // DO NOT USE THIS ACCOUNT ON MAINNET - IT IS ONLY FOR DEV PURPOSES
            // For dev chain, address: 0x5b9b5db9cde96fda2e2c88e83f1b833f189e01f4 has this privKey
            privateKey: "b2ab40d549e67ba67f278781fec03b3a90515ad4d0c898a6326dd958de1e46fa" //


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
        "%MiniMeTokenAddress%": {
            "name": "Status Test Token",
            "symbol": "SNT",
            "minAcceptedRate": 150000000000000,
            "refreshPricePeriod": 60000,
            "pricePlugin": "../plugins/token-utils.js"
        }
    },

    "contracts":{
        "GasRelay": {
            "abiFile": "../abi/GasRelay.json",
            "isIdentity": true,
            "baseVerification": "isBase(address)",
            "factoryAddress": "%IdentityFactoryAddress%",
            "allowedFunctions": [
                { 
                    "function": "approveAndCallGasRelay(address,address,uint256,bytes,uint256,uint256,bytes)", 
                    "isToken": true
                },
                {
                    "function": "callGasRelay(address,uint256,bytes,uint256,uint256,address,bytes)",
                    "isToken": false
                },
                {
                    "function": "deployGasRelay(uint256,bytes,uint256,uint256,address,bytes)",
                    "isToken": false
                }
            ],
            "strategy": "../src/strategy/IdentityStrategy.js"
        },
        "TokenGasRelay": {
            "abiFile": "../abi/TokenGasRelay.json",
            "isIdentity": false,
            "address": "%StatusNetworkAddress%",
            "allowedFunctions": [
                {
                    "function":"transferGasRelay(address,uint256,uint256,uint256,uint256,bytes)"
                },
                {
                    "function":"convertGasRelay(uint256,uint256,uint256,uint256,bytes)"
                }
                {
                    "function":"executeGasRelay(address,bytes,uint256,uint256,uint256,bytes)"
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
