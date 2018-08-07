#!/bin/bash
geth account import test_pk --password config/development/password --datadir .embark/development/datadir/
sleep 5s
echo 'Waiting 5s before unlocking the account'
geth --exec "personal.unlockAccount('0xb8d851486d1c953e31a44374aca11151d49b8bb3', 'dev_password', 0)" attach .embark/development/datadir/geth.ipc

