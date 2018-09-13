#!/bin/bash
geth --networkid=1337 --datadir=.embark/development/datadir --password=config/development/password --port=30303 --rpc --rpcport=8545 --rpcaddr=localhost --rpccorsdomain=* --ws --wsport=8546 --wsaddr=localhost --wsorigins=* --nodiscover --maxpeers=0 --mine --shh --shh.pow=0.002 --rpcapi=eth,web3,net,debug,shh --wsapi=eth,web3,net,shh,debug,personal --targetgaslimit=8000000 --dev
