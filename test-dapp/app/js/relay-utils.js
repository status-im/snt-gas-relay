/* global web3 */

import StatusGasRelayer, {Contracts} from "./status-gas-relayer";
import StatusRoot from 'Embark/contracts/StatusRoot';
import SNT from 'Embark/contracts/MiniMeToken';


export const directTransfer = async (to, amount, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  try {
    const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
      .transfer(to, amount)
      .setGas(SNT.options.address, gasPrice, gasLimit)
      .setRelayer(relayerData.sig)
      .setRelayerAddress(relayerData.address)
      .setAsymmetricKeyID(asymmetricKeyID);
    const signature = await s.sign(web3);
    await s.post(signature, web3);
  }
  catch (error) {
    console.error(error);
  }
};

export const convert = async (amount, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  try {
    const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
      .convert(amount)
      .setGas(SNT.options.address, gasPrice, gasLimit)
      .setRelayer(relayerData.sig)
      .setRelayerAddress(relayerData.address)
      .setAsymmetricKeyID(asymmetricKeyID);
    const signature = await s.sign(web3);
    await s.post(signature, web3);
  }
  catch (error) {
    console.error(error);
  }
};


export const execute = async (contract, data, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  try {
    const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
      .execute(contract, data)
      .setGas(SNT.options.address, gasPrice, gasLimit)
      .setRelayer(relayerData.sig)
      .setRelayerAddress(relayerData.address)
      .setAsymmetricKeyID(asymmetricKeyID);
    const signature = await s.sign(web3);
    await s.post(signature, web3);
  }
  catch (error) {
    console.error(error);
  }
};

export const queryRelayers = async (symmetricKeyID, asymmetricKeyID, gasPrice) => {
  try {
    const s = new StatusGasRelayer.AvailableRelayers(Contracts.TokenGasRelay, StatusRoot.options.address, web3.eth.defaultAccount)
      .setRelayersSymKeyID(symmetricKeyID)
      .setAsymmetricKeyID(asymmetricKeyID)
      .setGas(SNT.options.address, gasPrice);
    await s.post(web3);
  }
  catch (e) {
    console.error(e);
  }
};
