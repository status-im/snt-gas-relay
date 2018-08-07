#!/bin/bash
geth account import test_pk --password config/development/password --datadir .embark/development/datadir/
echo 'Waiting 5s before unlocking the account'
sleep 5s
geth --exec "personal.unlockAccount('0xb8d851486d1c953e31a44374aca11151d49b8bb3', 'dev_password', 0)" attach .embark/development/datadir/geth.ipc

STT=`cat chains.json | awk /STT/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`
IdentityFactory=`cat chains.json | awk /IdentityFactory/,/}/  | grep -Pzo "0x[0-9A-Za-z]+"`

git checkout ../gas-relayer/config/config.json
sed -i 's/%STTAddress%/'"$STT"'/g' ../gas-relayer/config/config.json
sed -i 's/%IdentityFactoryAddress%/'"$IdentityFactory"'/g' ../gas-relayer/config/config.json