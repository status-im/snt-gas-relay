const IdentityFactory = require('Embark/contracts/IdentityFactory');
const IdentityGasRelay = require('Embark/contracts/IdentityGasRelay');


var contractsConfig = {
    "IdentityFactory": {
        
    }
  };

config({ contracts: contractsConfig });

contract('IdentityFactory', function () {

  describe('createIdentity()', function () {
    it('should create an IdentityGasRelay', async function () {
      let result = await IdentityFactory.createIdentity();
      createdIdentity = new web3.eth.Contract(
          IdentityGasRelay.options.jsonInterface,
          result.events.InstanceCreated.returnValues.instance
      );
      
      assert(await createdIdentity.methods.nonce().call(), 0);
    });

  });
});
