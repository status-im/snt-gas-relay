#!/bin/bash
MiniMeToken=`cat chains.json | awk /\"MiniMeToken\"/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`
IdentityFactory=`cat chains.json | awk /\"IdentityFactory\"/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`
StatusNetwork=`cat chains.json | awk /\"StatusNetwork\"/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`

git checkout ../gas-relayer/config/config.js
sed -i 's/%MiniMeTokenAddress%/'"$MiniMeToken"'/g' ../gas-relayer/config/config.js
sed -i 's/%IdentityFactoryAddress%/'"$IdentityFactory"'/g' ../gas-relayer/config/config.js
sed -i 's/%StatusNetworkAddress%/'"$StatusNetwork"'/g' ../gas-relayer/config/config.js