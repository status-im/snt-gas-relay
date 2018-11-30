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
| status/SNTController       | 0x1f42B87b375b8ac6C77A8CAd8E78319c18695E75 | -                                          |
| identity/IdentityFactory   | 0xCf3473C2A50F7A94D3D7Dcc2BeBbeE989dAA014E | -                                          |
