module.exports = {
  // default applies to all environments
  default: {
    // Blockchain node to deploy the contracts
    deployment: {
      host: "localhost", // Host of the blockchain node
      port: 8545, // Port of the blockchain node
      type: "rpc" // Type of connection (ws or rpc),
    },
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
    contracts: {      
      "ERC20Receiver": {"deploy": false},
      "TestToken": {"deploy": false},
      "TestContract": {"deploy": false},
      "SafeMath": {"deploy": false},
      "Instance": {"deploy": false},
      "InstanceAbstract": {"deploy": false},
      "UpdatedIdentityKernel": {"deploy": false},
      "NonceChannelETH": {"deploy": false},
      "NonceChannelERC20": {"deploy": false},
      "PrototypeRegistry": {"deploy": false},
      "InstanceFactory": {"deploy": false},
      "SNTController": {"deploy": false},
      "TestSNTController": {"deploy": false},
      "AccountGasAbstract": {"deploy": false},
      "AccountGasChannel": {"deploy": false},
      "SimpleGasRelay": {"deploy": false},
      
      "IdentityBase": {"deploy": true},
      "IdentityGasRelayBase": {"deploy": true},
      "IdentityInit": {"deploy": true},
      "IdentityEmergency": {"deploy": true},
      "IdentityGasRelayExt": {"deploy": true},
      "IdentityGasChannelExt": {"deploy": true},
      "NonceChannelFactory": {"deploy": true},

      "IdentityFactory": {
        "args":["$IdentityBase", "$IdentityInit", "$IdentityEmergency"], 
        "onDeploy": [
          "IdentityFactory.methods.approveExtension(IdentityBase.address, IdentityGasRelayExt.address, true).send()",
          "IdentityFactory.methods.approveExtension(IdentityBase.address, IdentityGasChannelExt.address, true).send()",
          "IdentityFactory.methods.updateBase(IdentityGasRelayBase.address, IdentityInit.address, IdentityEmergency.address, true, true).send()",
          "IdentityFactory.methods.approveExtension(IdentityGasRelayBase.address, IdentityGasChannelExt.address, true).send()",
        ]
      },

      "MiniMeTokenFactory": {
        "args":[]
      },

      "MiniMeToken": {
        "args":["$MiniMeTokenFactory", "0x0", "0x0", "Status Test Token", 18, "STT", true],
      },
      "StatusNetwork": {
        "instanceOf": "TestSNTController",
        "deploy": true,
        "args": ["0x0", "$MiniMeToken", "$IdentityFactory"],
        "onDeploy": [
          "MiniMeToken.methods.changeController(StatusNetwork.address).send()"
        ]
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
    deployment: {
      accounts: [
        {
          nodeAccounts: true,
          password: "config/testnet/secretpass" // Password to unlock the account
        }
      ]
    },
    contracts: {
      "MiniMeTokenFactory": {
        "deploy": false,
        "address": "0x6bFa86A71A7DBc68566d5C741F416e3009804279"
      },
      "MiniMeToken": {
        "deploy": false,
        "address": "0xc55cF4B03948D7EBc8b9E8BAD92643703811d162"
      },
      "SNTPlaceHolder": {
        "deploy": false,
        "instanceOf": "TestSNTController",
        "address": "0x34358C45FbA99ef9b78cB501584E8cBFa6f85Cef"
      },
      "StatusNetwork": {
        "instanceOf": "TestSNTController",
        "deploy": true,
        "args": ["0x0", "$MiniMeToken", "$IdentityFactory"],
        "onDeploy": [
          "SNTPlaceHolder.methods.changeController(StatusNetwork.address).send()"
        ]
      }
    }
  },
  rinkeby: {
    deployment: {
      accounts: [
        {
          nodeAccounts: true,
          password: "config/rinkeby/secretpass" // Password to unlock the account
        }
      ]
    }

  }
}
