module.exports = {
  // default applies to all environments
  default: {
    // Blockchain node to deploy the contracts
    deployment: {
      host: "localhost", // Host of the blockchain node
      port: 8545, // Port of the blockchain node
      type: "rpc" // Type of connection (ws or rpc),

      // Accounts to use instead of the default account to populate your wallet
       /*,accounts: [
        {
          privateKey: "your_private_key",
          balance: "5 ether"  // You can set the balance of the account in the dev environment
                              // Balances are in Wei, but you can specify the unit with its name
        },
        {
          privateKeyFile: "path/to/file" // You can put more than one key, separated by , or ;
        },
        {
          mnemonic: "12 word mnemonic",
          addressIndex: "0", // Optionnal. The index to start getting the address
          numAddresses: "1", // Optionnal. The number of addresses to get
          hdpath: "m/44'/60'/0'/0/" // Optionnal. HD derivation path
        }
      ]*/
    },
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
    contracts: {      
      "Identity": {"deploy": false},
      "ERC20Receiver": {"deploy": false},
      "TestToken": {"deploy": false},
      "SafeMath": {"deploy": false},
      "DelayedUpdatableInstance": {"deploy": false},
      "DelayedUpdatableInstanceStorage": {"deploy": false},
      "Factory": {"deploy": false},
      "Instance": {"deploy": false},
      "InstanceStorage": {"deploy": false},
      "MiniMeTokenFactory": {"args":[]},
      "MiniMeToken": {"deploy": false},
      "TestMiniMeToken": {"deploy": false},
      "UpdatedIdentityKernel": {"deploy": false},
      "UpdatableInstance": {"deploy": false},
      "Controlled": {"deploy": false},
      "Owned": {"deploy": false},
      "IdentityKernel": {"deploy": false},
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Gas Relayer Test Token", 18, "STT", true],
        "gasLimit": 4000000
      },
      "SNTController": {
        "args": ["0x5f803F54679577fC974813E48abF012A243dD439", "$STT"]
       },
      "IdentityGasRelay": {
        "deploy": true,
        "args": [[], [], [], 1, 1, "0x0000000000000000000000000000000000000000"] 
      },
      "IdentityFactory": {
        "args":[], 
        "gasLimit": 5000000
      },
      "TestContract": {
        "args": ["$STT"]
      }
    }
  },

  development: {
    deployment: {
    accounts: [
      {
        privateKey: "b2ab40d549e67ba67f278781fec03b3a90515ad4d0c898a6326dd958de1e46fa",
        balance: "5 ether"  // You can set the balance of the account in the dev environment
                            // Balances are in Wei, but you can specify the unit with its name
      }
    ]
    }
  },

  testnet: {
    contracts: {
      "MiniMeTokenFactory": {
        "address": "0xb59E2Dc49a5F03CC25606F24934eA2CEE04f70dE"
      },
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "address": "0x91a3473a3e1e3D61C29fa2fAcDf17fa0Db922a08"
      },
      "SNTController": {
        "address": "0x39bFD424c2A83ca56FD557b373C01A27475bB314"
      },
      "IdentityGasRelay": {
        "address": "0x8FB13e0f38038C446d6d253C57BEb518512dB56E" 
      },
      "IdentityFactory": {
        "address": "0xC83a746c3B73457FF51eCE216bfBFb524aa4fDD0"
      },
      "TestContract": {
        "address": "0xf5F9B20b48C13FDb77ceB6bDa52D9664c27c84dd"
      }
      
      // If needed to deploy contracts again, uncomment the following lines
      /*
      "MiniMeTokenFactory": {
        "args":[],
        "gasPrice": 20000000000
      },
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Gas Relayer Test Token", 18, "STT", true],
        "gasLimit": 4000000,
        "gasPrice": 20000000000
      },
      "SNTController": {
        "args": ["0x26C3f244D0CfD5Bde38fC9A4eb212fA1556eDfA2", "$STT"],
        "gasPrice": 20000000000
      },
      "IdentityGasRelay": {
        "deploy": true,
        "args": [[], [], [], 1, 1, "0x0000000000000000000000000000000000000000"] ,
        "gasPrice": 20000000000
      },
      "IdentityFactory": {
        "args":[], 
        "gasLimit": 5000000,
        "onDeploy": ["IdentityFactory.methods.setKernel('$IdentityGasRelay').send({gasLimit: 6000000})"],
        "gasPrice": 20000000000
      },
      "TestContract": {
        "args": ["$STT"],
        "gasPrice": 20000000000
      }
      */
    }
   }
};
