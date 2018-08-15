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
- Symmetric key used to send the heartbeats that notify the tokens and prices accepted
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



## Additional notes
How to send a message to this service (all accounts and privatekeys should be replaced by your own test data)
```
shh.post({symKeyID: SYM_KEY, sig: WHISPER_KEY_ID, ttl: 1000, powTarget: 1, powTime: 20, topic: TOPIC_NAME, payload: PAYLOAD_BYTES});
```
- `SYM_KEY` must contain the whisper symmetric key used. It is shown on the console when running the service with `node`. With the provided configuration you can use the value:
```
0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b`
```
- `WHISPER_KEY_ID` represents a keypair registered on your node, that will be used to sign the message. Can be generated with `web3W.shh.newKeyPair()`
- `TOPIC_NAME` must contain one of the topic names generated based on converting the contract name to hex, and taking the first 8 bytes. For the provided configuration the following topics are available:
- - IdentityGasRelay: `0x4964656e`
- - SNTController: `0x534e5443`
- `PAYLOAD_BYTES` a hex string that contains the identity/contract address to invoke and the web3 encoded abi function invocation plus parameters. If we were to execute `callGasRelayed(address,uint256,bytes,uint256,uint256,uint256,address,bytes)` (part of the IdentityGasRelay) in contract `0x692a70d2e424a56d2c6c27aa97d1a86395877b3a`, with these values: `"0x11223344556677889900998877665544332211",100,"0x00",1,10,20,"0x1122334455112233445511223344551122334455"`, "0x1122334455", `PAYLOAD_BYTES` can be prepared as follows: 



```

const whisperKeyPairID = await web3W.shh.newKeyPair();
const jsonAbi = ABIOfIdentityGasRelay.filter(x => x.name == "callGasRelayed")[0];

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
    symKeyID: "0xd0d905c1c62b810b787141430417caf2b3f54cffadb395b7bb39fdeb8f17266b", 
    sig: whisperKeyPairID,
    ttl: 1000, 
    powTarget: 1, 
    powTime: 20, 
    topic: "0x4964656e", 
    payload: web3.utils.toHex({
        'contract': "0x692a70d2e424a56d2c6c27aa97d1a86395877b3a",
        'encodedFunctionCall': funCall,
        'address': web3.eth.defaultAccount
    })
};

        
web3.shh.post(msgObj)
.then((err, result) => {
    console.log(result);
    console.log(err);
});

```