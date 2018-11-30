#!/bin/bash
#!/bin/bash
geth --testnet --syncmode=light --port=30303 --ws --wsport=8546 --wsaddr=localhost --wsorigins=http://localhost:8000,embark,gas-relayer --maxpeers=25 --shh --shh.pow=0.002 --wsapi=eth,web3,net,shh

