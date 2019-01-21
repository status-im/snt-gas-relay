module.exports = {
  // default applies to all environments
  default: {
    // Blockchain node to deploy the contracts
    deployment: {
      host: "localhost", // Host of the blockchain node
      port: 8546, // Port of the blockchain node
      type: "ws" // Type of connection (ws or rpc),
      // Accounts to use instead of the default account to populate your wallet
      // The order here corresponds to the order of `web3.eth.getAccounts`, so the first one is the `defaultAccount`
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
        },
        {
          "nodeAccounts": true // Uses the Ethereum node's accounts
        }
      ]*/
    },
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "ws://localhost:8546",
      "http://localhost:8545"
    ],

    // Automatically call `ethereum.enable` if true.
    // If false, the following code must run before sending any transaction: `await EmbarkJS.enableEthereum();`
    // Default value is true.
    // dappAutoEnable: true,

    gas: "auto",

    // Strategy for the deployment of the contracts:
    // - implicit will try to deploy all the contracts located inside the contracts directory
    //            or the directory configured for the location of the contracts. This is default one
    //            when not specified
    // - explicit will only attempt to deploy the contracts that are explicity specified inside the
    //            contracts section.
    strategy: 'explicit',

    contracts: {
      "IdentityBase": {},
      "IdentityGasRelayBase": {},
      "IdentityInit": {},
      "IdentityEmergency": {},
      "IdentityGasRelayExt": {},
      "IdentityGasChannelExt": {},
      "NonceChannelFactory": {},
      "IdentityFactory": {    
        "args":["$IdentityBase", "$IdentityInit", "$IdentityEmergency"], 
        "onDeploy": [
          "await IdentityFactory.methods.approveExtension(IdentityBase.address, IdentityGasRelayExt.address, true).send()",
          "await IdentityFactory.methods.approveExtension(IdentityBase.address, IdentityGasChannelExt.address, true).send()",
          "await IdentityFactory.methods.updateBase(IdentityGasRelayBase.address, IdentityInit.address, IdentityEmergency.address, true, true).send()",
          "await IdentityFactory.methods.approveExtension(IdentityGasRelayBase.address, IdentityGasChannelExt.address, true).send()"
        ]
      },
      "MiniMeTokenFactory": {},
      "MiniMeToken": {
        "args":["$MiniMeTokenFactory", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "Status Test Token", 18, "STT", true]
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "args": ["0x0000000000000000000000000000000000000000", "$MiniMeToken", "$IdentityFactory"],
        "onDeploy": [
          "await MiniMeToken.methods.changeController(StatusRoot.address).send()",
          "await StatusRoot.methods.setOpen(true).send()"
        ]
      }
    }
  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run`
  development: {
    dappConnection: [
      "ws://localhost:8546",
      "http://localhost:8545",
      "$WEB3"  // uses pre existing web3 object if available (e.g in Mist)
    ],
    deployment: {
      accounts: [
        {
          nodeAccounts: true
        }
      ]
    }
  },

  testnet: {
    contracts: {
      "MiniMeTokenFactory": {
        "address": "0x6bFa86A71A7DBc68566d5C741F416e3009804279"
      },
      "MiniMeToken": {
        "address": "0xc55cF4B03948D7EBc8b9E8BAD92643703811d162"
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "address": "0x34358C45FbA99ef9b78cB501584E8cBFa6f85Cef"
      }
    }
  },
  rinkeby: {
    contracts: {
      "IdentityBase": {
        "address": "0x59a8A7fd1fD67C3eAD41C3B17F5107B91BFf6C64"
      }, 
      "IdentityGasRelayBase": {
        "address": "0x04E455E03383C5FaFCfaa25C1f52fA848a7dbd07"
      }, 
      "IdentityInit": {
        "address": "0x9D66Ae8326B8627d887231f50Cd285eDe755c304"
      }, 
      "IdentityEmergency": {
        "address": "0xedaB7DD4E42BD7A84700EcCA892fF4F4641018C8"
      }, 
      "IdentityGasRelayExt": {
        "address": "0xAE56F49c5BBF33F86f115A783744e58d4b511312"
      }, 
      "IdentityGasChannelExt": {  
        "address": "0x3Cc7eF7449bE6d60e18A8cE4d3f40A5Df5e6A2a4"
      }, 
      "NonceChannelFactory": {
        "address": "0x21bfe2658BDBAd0ceCCcB77152A212EFbe12C852"
      }, 
      "IdentityFactory": {
        "address": "0x2f70f304986167e905eb680e379ac67524c74da3"
      },
      "MiniMeTokenFactory": {
        "address": "0x5bA5C786845CaacD45f5952E1135F4bFB8855469"
      },
      "MiniMeToken": {
        "address": "0x43d5adC3B49130A575ae6e4b00dFa4BC55C71621"
      },
      "StatusRoot": {
        "instanceOf": "TestStatusNetwork",
        "address": "0xEdEB948dE35C6ac414359f97329fc0b4be70d3f1"
      }
    }
  }
};
