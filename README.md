# token-gas-relayer
Gas relayer mplementation for economic abstraction. This project consists of two elements:
- `gas-relayer`: nodejs service that listens to whisper on a symmetric key, with specific topics, and processes any transaction.
- `test-dapp`: DApp created for testing purposes. It allows the easy creation of the messages expected by the service.


## Documentation
1. [Installation - testnet/mainnet](installation-testnet-mainnet.md)
2. [Installation - development environment](installation-development.md)
3. [Gas relayer protocol](relayer-protocol.md)
4. [Javascript library](javascript-library.md)
5. Status Extensions (TODO)


## Deployment Details
| Contract                   | Ropsten Address                            | Mainnet Address                            |
| ---------------------------|------------------------------------------- | ------------------------------------------ |
| status/SNTController       | 0xA77A1014F55157c3119FB3f53E653E42f8fa634c | -                                          |
| identity/IdentityFactory   | 0x7F106A1Bc637AC4AAed3DC72582749c4562D4323 | -                                          |
