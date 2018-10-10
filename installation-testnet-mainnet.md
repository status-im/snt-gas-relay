# Installation - Testnet

### Notes
1. This installation assumes you're using Ubuntu or similar
2. You need a non-root user that belongs to the sudo group.

### Required software install procedure

1. Install Ethereum
```
sudo apt install software-properties-common
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt install ethereum
```

2. Install NodeJS using NVM (Check NVM repo for updated procedure)
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source .bashrc
nvm install --lts
```

3. Install Python and other software
```
sudo apt install python build-essential
```

### Clone the repo
```
git clone https://github.com/status-im/snt-gas-relay.git
cd snt-gas-relay/gas-relayer
npm install
```

### Setup geth for Whisper

1. Verify `geth` light mode starts successfully. Exit geth when you see everything is ok
```
geth --testnet --syncmode=light console
> exit
```

2. Create an account (at the moment, this install procedure has only been tested with Ropsten testnet). It will ask you for a password
```
geth --testnet account new
```

3. Create a file `geth_pass` that will contain the password. Ensure the permissions are read/write for the owner. This file can be put in any secure folder you determine. YOu need access to this file from the folder where the gas-relayer will execute
```
echo "MyPassword" > testnet_password
chmod 600 testnet_password
```

4. There aren't enough geth peers with Whisper enabled to guarantee that messages will arrive from one node to other. We need to create a `static-nodes.json` file in `~/.ethereum/testnet/geth/`.
`vi ~/.ethereum/testnet/geth/`

This file needs to contain the following array:
```
[
    "enode://436cc6f674928fdc9a9f7990f2944002b685d1c37f025c1be425185b5b1f0900feaf1ccc2a6130268f9901be4a7d252f37302c8335a2c1a62736e9232691cc3a@174.138.105.243:30404",
    "enode://5395aab7833f1ecb671b59bf0521cf20224fe8162fc3d2675de4ee4d5636a75ec32d13268fc184df8d1ddfa803943906882da62a4df42d4fccf6d17808156a87@206.189.243.57:30404",
    "enode://7427dfe38bd4cf7c58bb96417806fab25782ec3e6046a8053370022cbaa281536e8d64ecd1b02e1f8f72768e295d06258ba43d88304db068e6f2417ae8bcb9a6@104.154.88.123:30404",
    "enode://ebefab39b69bbbe64d8cd86be765b3be356d8c4b24660f65d493143a0c44f38c85a257300178f7845592a1b0332811542e9a58281c835babdd7535babb64efc1@35.202.99.224:30404",
    "enode://a6a2a9b3a7cbb0a15da74301537ebba549c990e3325ae78e1272a19a3ace150d03c184b8ac86cc33f1f2f63691e467d49308f02d613277754c4dccd6773b95e8@206.189.243.176:30304",
    "enode://207e53d9bf66be7441e3daba36f53bfbda0b6099dba9a865afc6260a2d253fb8a56a72a48598a4f7ba271792c2e4a8e1a43aaef7f34857f520c8c820f63b44c8@35.224.15.65:30304",
    "enode://c42f368a23fa98ee546fd247220759062323249ef657d26d357a777443aec04db1b29a3a22ef3e7c548e18493ddaf51a31b0aed6079bd6ebe5ae838fcfaf3a49@206.189.243.162:30504",
    "enode://7aa648d6e855950b2e3d3bf220c496e0cae4adfddef3e1e6062e6b177aec93bc6cdcf1282cb40d1656932ebfdd565729da440368d7c4da7dbd4d004b1ac02bf8@206.189.243.169:30504",
    "enode://8a64b3c349a2e0ef4a32ea49609ed6eb3364be1110253c20adc17a3cebbc39a219e5d3e13b151c0eee5d8e0f9a8ba2cd026014e67b41a4ab7d1d5dd67ca27427@206.189.243.168:30504",
    "enode://7de99e4cb1b3523bd26ca212369540646607c721ad4f3e5c821ed9148150ce6ce2e72631723002210fac1fd52dfa8bbdf3555e05379af79515e1179da37cc3db@35.188.19.210:30504",
    "enode://015e22f6cd2b44c8a51bd7a23555e271e0759c7d7f52432719665a74966f2da456d28e154e836bee6092b4d686fe67e331655586c57b718be3997c1629d24167@35.226.21.19:30504",
    "enode://531e252ec966b7e83f5538c19bf1cde7381cc7949026a6e499b6e998e695751aadf26d4c98d5a4eabfb7cefd31c3c88d600a775f14ed5781520a88ecd25da3c6@35.225.227.79:30504"
]
```
These enodes were extracted from https://github.com/status-im/status-go/blob/develop/params/cluster.go. 

### Setup the gas relayer

Before executing this program, `config/config.json` must be setup and `npm install` needs to be executed. Important values to verify are related to the node configuration, just like:
- Host, port and protocol to connect to the geth node
- Host, port and protocol Ganache will use when forking the blockchain for gas estimations and other operations
- Wallet account used for processing the transactions
- Symmetric key used to receive the Whisper messages
- Accepted tokens information
- Contract configuration

1. For testnet, a config file is provided with the required configuration.
```
cd config
rm config.js 
mv config.testnet.js config.js
```

2. A node that wants to act as a relayer only needs to have a geth node with whisper enabled, and an account with ether to process the transactions. This account needs to be configured in `./config/config.js`. Edit this file and set the account:
```
"blockchain": {
    // Use one of these options:

    // Option1 ===========================
    // privateKey: "your_private_key",

    // Option2 ===========================
    // privateKeyFile: "path/to/file"

    // Option3 ===========================
    // mnemonic: "12 word mnemonic",
    // addressIndex: "0", // Optionnal. The index to start getting the address
    // hdpath: "m/44'/60'/0'/0/" // Optionnal. HD derivation path
},
```


### Launching the relayer
A `launch-geth-testnet.sh` script is provided in the `snt-gas-relayer/gas-relayer` folder. You need to edit this file and set the `--unlock` option with the address used for procesing the transactions, and also the `--password` with the path to the password file. This script assumes the password file is called `testnet_password` and it's located in the same folder of the gas-relayer service.

After editing the file, assuming your account has eth, launch geth:

```
chmod +x ./launch-geth-testnet.sh
./launch-geth-testnet.sh
```

you may use any of the following three commands to launch the relayer. 

```
npm start
node src/service.js
nodemon src/service.js
```


### Using the testdapp with testnet
The test dapp may be used for testnet from your computer. It requires a provider that allows websockets:
1. Edit `launch-geth-testnet.sh`  in the `test-dapp` folder to use an address you control. Then execute `launch-geth-testnet.sh` to start the geth node with the required config to communicate with the status cluster via whisper. 
2. Execute `embark run testnet` to launch the dapp connected to testnet
3. Navigate in your browser to http://localhost:8000. Remember to disable Metamask (The provider injected by Metamask does not support Whisper)
4. You're now able to use the dapp normally. The status for the relayer that can be seen in the footer of the dapp won't reflect accurate information, since the relayers account are not deterministic anymore since you're not in a development environment

#### NOTE
For using Identity operations, or of you wish to use the functionality to generate tokens, and sending ether, you need to configure `config/contracts.js` to add a private key you control, and from which the SNTController and the Identity Contract was deployed.

Work is in progress for using the test-dapp inside status.

```
  testnet: {
    accounts: [
      { 
        privateKey: "your_private_key_here" 
      }
    ],
     ....
 ```
