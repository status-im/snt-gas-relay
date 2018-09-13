
# Javascript Library

To simplify the process of building the whisper messages, a js file `status-gas-relayer.js` was created in the test-dapp. It only requires to setup connection to geth, and required keypairs and symkeys. This file might be expanded upon in the future and converted to a npm package.

## Use

```
import StatusGasRelayer, {Contracts, Functions, Messages} from 'status-gas-relayer';

// Connecting to web3
const web3 = new Web3('ws://localhost:8546');
const kid = await web3js.shh.newKeyPair()
const skid = await web3.shh.addSymKey("0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b");
```

#### Subscribing to messages
General message subscription. Special handling is needed for handling relayer availability messages. The `sig` property is the relayer's public key that needs to be sent when sending a transaction message. More than 1 relayer can reply, so it's recommended to save these keys in a list/array.

```
StatusGasRelayer.subscribe(web3js, (error, msgObj) => {
    if(error) {
        console.error(error);
        return;
    }

    if(msgObj.message == Messages.available){
        // Relayer availability message
        console.log("Relayer available: " + msgObj.sig);
    } else {
        // Normal message
        console.log(msgObj);
    }
}, {
    privateKeyID: kid
});
```

#### Polling for relayers
```
const identityAddress = this.props.identityAddress; // Identity contract
const accountAddress = web3.eth.defaultAccount;
const gasToken = SNT.options.address;
const gasPrice = 1000000000000;  // In wei equivalent to the used token

const s = new StatusGasRelayer.AvailableRelayers(Contracts.Identity, identityAddress, accountAddress)
                              .setRelayersSymKeyID(skid)
                              .setAsymmetricKeyID(kid)
                              .setGas(gasToken, gasPrice);
await s.post(web3);
```

#### Signing a message
Signing a message is similar to invoking a function. Both use mostly the same functions. The difference is that when you invoke a function, you need to specify the relayer and asymmetric key Id.

```
try {
    const s = new StatusGasRelayer.Identity(identityAddress, accountAddress)
                                  .setContractFunction(Functions.Identity.call)
                                  .setTransaction(to, value, data)
                                  .setGas(gasToken, gasPrice, gasLimit);
                                          
    const signature = await s.sign(web3);
} catch(error){
    console.log(error);
}

```

#### Using Identity contract `call` function
This functionality is used when a Identity will invoke a contract function or transfer ether without paying fees

```
try {
    const s = new StatusGasRelayer.Identity(identityAddress, accountAddress)
                                  .setContractFunction(Functions.Identity.call)
                                  .setTransaction(to, value, data)  // 'value' is in wei, and 'data' must be a hex string
                                  .setGas(gasToken, gasPrice, gasLimit)
                                  .setRelayer(relayer)
                                  .setAsymmetricKeyID(kid);

    await s.post(signature, web3);
} catch(error){
    console.log(error);
}
```

#### Using Identity contract `approveAndCall` function
This functionality is used when a Identity will invoke a contract function that requires a transfer of Tokens

```
try {
    const s = new StatusGasRelayer.Identity(identityAddress, accountAddress)
                                  .setContractFunction(Functions.Identity.approveAndCall)
                                  .setTransaction(to, value, data)
                                  .setBaseToken(baseToken)
                                  .setGas(gasToken, gasPrice, gasLimit)
                                  .setRelayer(relayer)
                                  .setAsymmetricKeyID(kid);

    await s.post(signature, web3);
} catch(error){
    console.log(error);
}
```

#### Using SNTController `transferSNT` function
This functionality is used for simple wallets to perform SNT transfers without paying ETH fees
```
try {
    const accounts = await web3.eth.getAccounts();

    const s = new StatusGasRelayer.SNTController(SNTController.options.address, accounts[2])
                                    .transferSNT(to, amount)
                                    .setGas(gasPrice)
                                    .setRelayer(relayer)
                                    .setAsymmetricKeyID(kid);

    await s.post(signature, web3);
} catch(error){
    console.log(error);
}
```

#### Using SNTController `execute` function
```
try {
    const accounts = await web3.eth.getAccounts();

    const s = new StatusGasRelayer.SNTController(SNTController.options.address, accounts[2])
                                  .execute(allowedContract, data)
                                  .setGas(gasPrice, gasMinimal)
                                  .setRelayer(relayer)
                                  .setAsymmetricKeyID(kid);

    await s.post(signature, web3);
} catch(error){
    console.log(error);
}
```
