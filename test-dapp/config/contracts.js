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
        "gasLimit": 5000000,
        "onDeploy": ["IdentityFactory.methods.setKernel('$IdentityGasRelay').send({gasLimit: 6000000})"]
      },
      "TestContract": {
        "args": ["$STT"]
      }
    }
  },
  testnet: {
    contracts: {
      //
      "MiniMeTokenFactory": {
        "address": "0xD1A2f3726331d6100E8BcD1484EdF796B0b20cc9"
      },
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "address": "0x121a430A73Fc13e2D6d4a9dc3E943de647c30f8f"
      },
      "SNTController": {
        "address": "0xf558aC91312821B0E1802567BC785355AA811783"
      },
      "IdentityGasRelay": {
        "address": "0x4b571c5e75E93F53E985b12A3D107318178b9B5F" 
      },
      "IdentityFactory": {
        "address": "0x89976FeEC7CFDF2DF5194e363FD2a3388e2DC91A"
      },
      "TestContract": {
        "address": "0xa7aeF1cd3e4a8425D9A1E13B5557908895dCbdBE"
      }
      // If needed to deploy contracts again, uncomment the following lines
      /*
      "MiniMeTokenFactory": {"args":[]},
      "STT": {
        "instanceOf": "MiniMeToken",
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Gas Relayer Test Token", 18, "STT", true],
        "gasLimit": 4000000
      },
      "SNTController": {
        "args": ["0x26C3f244D0CfD5Bde38fC9A4eb212fA1556eDfA2", "$STT"]
      },
      "IdentityGasRelay": {
        "deploy": true,
        "args": [[], [], [], 1, 1, "0x0000000000000000000000000000000000000000"] 
      },
      "IdentityFactory": {
        "args":[], 
        "gasLimit": 5000000,
        "onDeploy": ["IdentityFactory.methods.setKernel('$IdentityGasRelay').send({gasLimit: 6000000})"]
      },
      "TestContract": {
        "args": ["$STT"]
      }*/
    }
   }
};
