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
          privateKeyFile: "path/to/file", // Either a keystore or a list of keys, separated by , or ;
          password: "passwordForTheKeystore" // Needed to decrypt the keystore file
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
        "args": ["$accounts[0]", "$STT"],
	
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


    },
      "afterDeploy": [
        "STT.methods.changeController(SNTController.options.address).send()",
        "SNTController.methods.enablePublicExecution(TestContract.options.address, true).send()"
      ]

  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run`
  development: {
    dappConnection: [
      "ws://localhost:8546",
      "http://localhost:8545",
      "$WEB3"  // uses pre existing web3 object if available (e.g in Mist)
    ]
  },

  // merges with the settings in default
  // used with "embark run privatenet"
  privatenet: {
  },

  // merges with the settings in default
  // used with "embark run testnet"
  testnet: {
  },

  // merges with the settings in default
  // used with "embark run livenet"
  livenet: {
  },

  // you can name an environment with specific settings and then specify with
  // "embark run custom_name" or "embark blockchain custom_name"
  //custom_name: {
  //}
};
