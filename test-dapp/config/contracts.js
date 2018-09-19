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
        "address": "0xc20405f3CfF14854Db820FcF0CD376BdC20e1d79"
      },
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "address": "0x6DBf417FB1b23E14Bb888BF22fb5f40CbBED4D0C"
      },
      "SNTController": {
        "address": "0x2dFC150a152b02256C91708C7B71D3068E08DAd7"
      },
      "IdentityGasRelay": {
        "address": "0x186427a558E7038B5500D44Bd4da9CCe37f66209" 
      },
      "IdentityFactory": {
        "address": "0x3CBe029665B0688612CE19CFcB74a41BC1aEe179"
      },
      "TestContract": {
        "address": "0x9f770Ec6955b1Ba4f3E10F3e93acF2530cBCF1Fc"
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
      }*/
    }
   }
};
