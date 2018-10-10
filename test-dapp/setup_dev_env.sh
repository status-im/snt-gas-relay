#!/bin/bash
STT=`cat chains.json | awk /STT/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`
IdentityFactory=`cat chains.json | awk /IdentityFactory/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`
SNTController=`cat chains.json | awk /SNTController/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`

git checkout ../gas-relayer/config/config.js
sed -i 's/%STTAddress%/'"$STT"'/g' ../gas-relayer/config/config.js
sed -i 's/%IdentityFactoryAddress%/'"$IdentityFactory"'/g' ../gas-relayer/config/config.js
sed -i 's/%SNTController%/'"$SNTController"'/g' ../gas-relayer/config/config.js