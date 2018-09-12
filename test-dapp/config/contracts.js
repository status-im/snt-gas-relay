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
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
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
      "MiniMeTokenFactory": {
        "address": "0xBda00586BF6D79F22203EeDe046DEcaaf2B771B4"
      },
      "STT": {
        "instanceOf": "TestMiniMeToken",
        "address": "0xd7879e4401c548544196dc0215df449B2a1E23B3"
      },
      "SNTController": {
        "address": "0xA77A1014F55157c3119FB3f53E653E42f8fa634c"
      },
      "IdentityGasRelay": {
        "address": "0xEA60E967BA16Bf4313B5d23b78e44763C8928C67" 
      },
      "IdentityFactory": {
        "address": "0x7F106A1Bc637AC4AAed3DC72582749c4562D4323"
      },
      "TestContract": {
        "address": "0x1F0C9ebD14Ba43BDD5b43C52EbEfc31066704988"
      }
      // If needed to deploy contracts again, uncomment the following lines
      /*
      "MiniMeTokenFactory": {"args":[]},
      "STT": {
        "instanceOf": "MiniMeToken",
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
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
      }
      */
    },
    accounts: [{privateKey: "71DB9B832BF457B4D812D6D6D673A02A1A2F5F687DBF59A2E41302A43459153C"}]
  }
};
