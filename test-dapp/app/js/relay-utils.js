/* global web3 */

import StatusGasRelayer, {Contracts, Functions} from "./status-gas-relayer";
import StatusRoot from 'Embark/contracts/StatusRoot';
import MiniMeToken from 'Embark/contracts/MiniMeToken';

export const directTransfer = async (to, amount, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
    .transfer(to, amount)
    .setGas(MiniMeToken.options.address, gasPrice, gasLimit)
    .setRelayer(relayerData.sig)
    .setRelayerAddress(relayerData.address)
    .setAsymmetricKeyID(asymmetricKeyID);
  const signature = await s.sign(web3);
  return async (whisper) => {
    await s.post(signature, web3, whisper);
  };
};

export const convert = async (amount, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
    .convert(amount)
    .setGas(MiniMeToken.options.address, gasPrice, gasLimit)
    .setRelayer(relayerData.sig)
    .setRelayerAddress(relayerData.address)
    .setAsymmetricKeyID(asymmetricKeyID);
  const signature = await s.sign(web3);
  return async (whisper) => {
    await s.post(signature, web3, whisper);
  };
};

export const execute = async (contract, data, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, web3.eth.defaultAccount)
    .execute(contract, data)
    .setGas(MiniMeToken.options.address, gasPrice, gasLimit)
    .setRelayer(relayerData.sig)
    .setRelayerAddress(relayerData.address)
    .setAsymmetricKeyID(asymmetricKeyID);
  const signature = await s.sign(web3);
  await s.post(signature, web3);
};

export const queryRelayers = (symmetricKeyID, asymmetricKeyID, gasPrice) => {
  const s = new StatusGasRelayer.AvailableRelayers(Contracts.TokenGasRelay, StatusRoot.options.address, web3.eth.defaultAccount)
    .setRelayersSymKeyID(symmetricKeyID)
    .setAsymmetricKeyID(asymmetricKeyID)
    .setGas(MiniMeToken.options.address, gasPrice);
  return async (whisper) => {
    await s.post(web3, whisper);
  };
};

// ============== Identity

export const call = async (identityAddress, to, value, data, gasToken, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  const s = new StatusGasRelayer.GasRelay(identityAddress, web3.eth.defaultAccount)
    .setContractFunction(Functions.GasRelay.call)
    .setTransaction(to, value, data)
    .setGas(gasToken, gasPrice, gasLimit)
    .setRelayer(relayerData.sig)
    .setRelayerAddress(relayerData.address)
    .setAsymmetricKeyID(asymmetricKeyID);
  const signature = await s.sign(web3);
  return async (whisper) => {
    await s.post(signature, web3, whisper);
  };
};


export const approveAndCall = async (identityAddress, to, value, data, baseToken, gasPrice, gasLimit, relayerData, asymmetricKeyID) => {
  const s = new StatusGasRelayer.GasRelay(identityAddress, web3.eth.defaultAccount)
    .setContractFunction(Functions.GasRelay.approveAndCall)
    .setTransaction(to, value, data)
    .setBaseToken(baseToken)
    .setGas(MiniMeToken.options.address, gasPrice, gasLimit)
    .setRelayer(relayerData.sig)
    .setRelayerAddress(relayerData.address)
    .setAsymmetricKeyID(asymmetricKeyID);
  const signature = await s.sign(web3);
  return async (whisper) => {
    await s.post(signature, web3, whisper);
  };
};
