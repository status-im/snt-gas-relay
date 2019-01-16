#!/bin/bash
geth --testnet --syncmode=light --password=config/testnet/password --port=30303 --rpc --rpcport=8545 --rpcaddr=localhost --rpccorsdomain=http://localhost:8000 --ws --wsport=8546 --wsaddr=localhost --wsorigins=http://localhost:8000,http://localhost:8080 --maxpeers=25 --shh --shh.pow=0.002 --rpcapi=eth,web3,net,debug,shh --wsapi=eth,web3,net,shh,debug --unlock=7c13ad39c6c2b2ee9ada21482751be478df7fac7

