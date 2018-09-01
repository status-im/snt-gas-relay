# token-gas-relayer
Gas relayer mplementation for economic abstraction. This project consists of two elements:
- `gas-relayer`: nodejs service that listens to whisper on a symmetric key, with specific topics, and processes any transaction.
- `test-dapp`: DApp created for testing purposes. It allows the easy creation of the messages expected by the service.

## Installation
- `geth` is required for installation
- Install the latest develop version of embark: `npm install -g https://github.com/embark-framework/embark.git`
- If running a development version of the gas relay
```
cd test-dapp
chmod a+x setup_dev_env.sh
npm install
embark reset
embark blockchain
```
- When Embark finishes loading, execute `embark run` && `./setup_dev_env.sh` to create the test account

## Node

Before executing this program, `config/config.json` must be setup and `npm install` needs to be executed. Important values to verify are related to the node configuration, just like:
- Host, port and protocol to connect to the geth node
- Host, port and protocol Ganache will use when forking the blockchain for gas estimations and other operations
- Wallet account used for processing the transactions
- Symmetric key used to receive the Whisper messages
- Accepted tokens information
- Contract configuration

This program is configured with the default values for a embark installation run from 0

A `geth` node running whisper (via `-shh` option) is required. To execute the gas-relayer, you may use any of the following three methods.

```
npm start
node src/service.js
nodemon src/service.js
```

## Test DApp
To run the test dapp, use `embark run` and then browse `http://localhost:8000/index.html`.

The gas relayer service needs to be running, and configured correctly to process the transactions. Things to take in account are: the account used in embark, and the contract addresses.

(TODO: update testnet configuration to guarantee the contract addresses don't change)



## Using the gas relayer

### The relayer
A node that wants to act as a relayer only needs to have a geth node with whisper enabled, and an account with ether to process the transactions. This account and node need to be configured in `./config/config.js`.

The relayer will be subscribed to receive messages in a specific symkey (this will change in the future to use ENS), and will reply back to both availability and transaction requests

### The user

#### Sending a message to the gas relayer network (all accounts and privatekeys should be replaced by your own test data)
```
shh.post({
    symKeyID: SYM_KEY,  // If requesting availability
    pubKey: PUBLIC_KEY_ID,  // If sending a transaction
    sig: WHISPER_KEY_ID, 
    ttl: 1000, 
    powTarget: 1, 
    powTime: 20, 
    topic: TOPIC_NAME, 
    payload: PAYLOAD_BYTES
}).then(......)
```
- `symKeyID: SYM_KEY` must contain the whisper symmetric key used. It is shown on the console when running the service with `node`. With the provided configuration you can use the symmetric key `0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b`. Only used when asking for relayer availability.
- `pubKey: PUBLIC_KEY_ID`. After asking for availability, once the user decides on a relayer, it needs to set the `pubKey` attribute with the relayer public key (received in the availability reply in the `sig` attribute of the message).  
- `WHISPER_KEY_ID` represents a keypair registered on your node, that will be used to sign the message. Can be generated with `web3W.shh.newKeyPair()`
- `TOPIC_NAME` must contain one of the topic names generated based on converting the contract name to hex, and taking the first 8 bytes. For the provided configuration the following topics are available:
- - IdentityGasRelay: `0x4964656e`
- - SNTController: `0x534e5443`
- `PAYLOAD_BYTES` a hex string that contains details on the operation to perform.


#### Polling for gas relayers
The first step is asking the relayers for their availability. The message payload needs to be the hex string representation of a JSON object with a specific structure:

```
const payload = web3.utils.toHex({
        'contract': "0xContractToInvoke",
        'address': web3.eth.defaultAccount,
        'action': 'availability',
        'token': "0xGasTokenAddress",
        'gasPrice': 1234
    });
```

- `contract` is the address of the contract that will perform the operation, in this case it can be an Identity, or the SNTController.
- `address` The address that will sign the transactions. Normally it's `web3.eth.defaultAccount`
- `gasToken`: token used for paying the gas cost
- `gasPrice`: The gas price used for the transaction

This is a example code of how to send an 'availability' message:

```
const whisperKeyPairID = await web3W.shh.newKeyPair();

const msgObj = { 
    symKeyId: "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b", 
    sig: whisperKeyPairID,
    ttl: 1000, 
    powTarget: 1, 
    powTime: 20, 
    topic: "0x4964656e", 
    payload: web3.utils.toHex({
        'contract': "0x692a70d2e424a56d2c6c27aa97d1a86395877b3a",
        'address': web3.eth.defaultAccount
        'action': 'availability',
        'gasToken': "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
        'gasPrice': 40000000000 // 40 gwei equivalent in SNT
    })
};

        
web3.shh.post(msgObj)
.then((err, result) => {
    console.log(result);
    console.log(err);
});
```

When it replies, you need to extract the `sig` attribute to obtain the relayer's public key

#### Sending transaction details

Sending a transaction is similar to the previous operation, except that we send the message to an specific node, we use the action `transaction`, and also we send a `encodedFunctionCall` with the details of the transaction to execute.

From the list of relayers received via whisper messages, you need to extract the `message.sig` to obtain the `pubKey`. This value is used to send the transaction to that specific relayer.

`encodedFunCall` is the hex data used obtained from `web3.eth.abi.encodeFunctionCall` for the specific function we want to invoke.

If we were to execute `callGasRelayed(address,uint256,bytes,uint256,uint256,uint256,address,bytes)` (part of the IdentityGasRelay) in contract `0x692a70d2e424a56d2c6c27aa97d1a86395877b3a`, with these values: `"0x11223344556677889900998877665544332211",100,"0x00",1,10,20,"0x1122334455112233445511223344551122334455"`, "0x1122334455", `PAYLOAD_BYTES` can be prepared as follows: 

```
// The following values are created obtained when polling for relayers
const whisperKeyPairID = await web3W.shh.newKeyPair();
const relayerPubKey = "0xRELAYER_PUBLIC_KEY_HERE";
// ...
// ...
const jsonAbi = ABIOfIdentityGasRelay.find(x => x.name == "callGasRelayed");

const funCall = web3.eth.abi.encodeFunctionCall(jsonAbi,
                [
                    "0x11223344556677889900998877665544332211", 
                    100, 
                    "0x00",
                    1,
                    10,
                    20,
                    "0x1122334455112233445511223344551122334455",
                    "0x1122334455"
                ]);

const msgObj = { 
    pubKey: relayerPubKey, 
    sig: whisperKeyPairID,
    ttl: 1000, 
    powTarget: 1, 
    powTime: 20, 
    topic: "0x4964656e", 
    payload: web3.utils.toHex({
        'contract': "0x692a70d2e424a56d2c6c27aa97d1a86395877b3a",
        'address': web3.eth.defaultAccount
        'action': 'transaction',
        'encodedFunctionCall': funCall,
    })
};

        
web3.shh.post(msgObj)
.then((err, result) => {
    console.log(result);
    console.log(err);
});

```


#### Valid operations
TODO

