# Installation - Development Environment

- Install the latest develop version of embark: `npm install -g https://github.com/embark-framework/embark.git`

- Install `geth`

- Clone the repository
`git clone https://github.com/status-im/snt-gas-relay.git`

- Execute the following commands
```
cd snt-gas-relay/test-dapp
chmod +x setup_dev_env.sh
npm install
embark reset
embark blockchain
```

- When Embark finishes loading, execute `embark run` to deploy the contracts.

- After the contracts are deployed and the test dapp is available, execute `./setup_dev_env.sh` to create the test account

## Test DApp
To run the test dapp, use `embark run` and then browse `http://localhost:8000/index.html`.

The gas relayer service needs to be running, and configured correctly to process the transactions. Things to take in account are: the account used in embark, and the contract addresses.

You may use the test dapp to generate SNT and fund the relayer account before running the gas relayer, as it requires ether to start. You may fund the relayer with `web3.eth.sendTransaction` or configure embark so it funds an account when it starts the chain.

## Relayer Node

- `cd snt-gas-relay/gas-relayer`

- This program is configured with the default values on `config/config.json` for a embark installation run from 0. To execute the gas-relayer, you may use any of the following three commands. 

```
npm start
node src/service.js
nodemon src/service.js
```
