const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const ethereumjsWallet = require('ethereumjs-wallet');
const path = require('path');
const fs = require('fs');


class AccountParser {
  static get(accountConfig, web3) {
    if (accountConfig.privateKey) {
      if (!accountConfig.privateKey.startsWith('0x')) {
        accountConfig.privateKey = '0x' + accountConfig.privateKey;
      }
      if (!web3.utils.isHexStrict(accountConfig.privateKey)) {
        console.error(`Private key ending with ${accountConfig.privateKey.substr(accountConfig.privateKey.length - 5)} is not a HEX string`);
        return null;
      }
      return web3.eth.accounts.privateKeyToAccount(accountConfig.privateKey);
    }

    
    if (accountConfig.privateKeyFile) {
      let privateKeyFile = path.resolve(accountConfig.privateKeyFile);
      let fileContent = fs.readFileSync(privateKeyFile).toString();
      if (accountConfig.password) {
        try {
          fileContent = JSON.parse(fileContent);
          if (!ethereumjsWallet['fromV' + fileContent.version]) {
            console.error(`Key file ${accountConfig.privateKeyFile} is not a valid keystore file`);
            return null;
          }
          const wallet = ethereumjsWallet['fromV' + fileContent.version](fileContent, accountConfig.password);
          return web3.eth.accounts.privateKeyToAccount('0x' + wallet.getPrivateKey().toString('hex'));
        } catch (e) {
          console.error('Private key file is not a keystore JSON file but a password was provided');
          console.error(e.message || e);
          return null;
        }
      }

      fileContent = fileContent.trim().split(/[,;]/);
      return fileContent.map((key, index) => {
        if (!key.startsWith('0x')) {
          key = '0x' + key;
        }
        if (!web3.utils.isHexStrict(key)) {
          console.error(`Private key is not a HEX string in file ${accountConfig.privateKeyFile} at index ${index}`);
          return null;
        }
        return web3.eth.accounts.privateKeyToAccount(key);
      });
    }

    if (accountConfig.mnemonic) {
      const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(accountConfig.mnemonic.trim()));
      const addressIndex = accountConfig.addressIndex || 0;
      const wallet_hdpath = accountConfig.hdpath || "m/44'/60'/0'/0/";
      const wallet = hdwallet.derivePath(wallet_hdpath + addressIndex).getWallet();
      return web3.eth.accounts.privateKeyToAccount('0x' + wallet.getPrivateKey().toString('hex'));
    }

    console.error('Unsupported account configuration: ' + JSON.stringify(accountConfig));
    console.error('Try using one of those: ' +
      '{ "privateKey": "your-private-key", "privateKeyFile": "path/to/file/containing/key", "mnemonic": "12 word mnemonic" }');
    
    return null;
  }
}

module.exports = AccountParser;
