#!/bin/bash
geth --testnet --syncmode=light --port=30303 --rpc --rpcport=8545 --rpcaddr=localhost --rpccorsdomain=http://localhost:8000 --ws --wsport=8546 --wsaddr=localhost --wsorigins="gas-relayer" --shh --shh.pow=0.002 --rpcapi=eth,web3,net,shh --wsapi=eth,web3,net,shh
