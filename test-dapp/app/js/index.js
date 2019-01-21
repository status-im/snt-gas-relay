/* global web3 */

import React, {Component, Fragment} from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import {Form, Button, Alert} from 'reactstrap';
import {IdentitySelector, ModeSelector, TokenSelector, RelayerSelector, StandardField, RelayResponse} from "./components";
import StatusGasRelayer, {Messages} from "./status-gas-relayer";
import MiniMeToken from 'Embark/contracts/MiniMeToken';
import StatusRoot from 'Embark/contracts/StatusRoot';
import {directTransfer, convert, execute, queryRelayers, call, approveAndCall} from "./relay-utils";
import {RELAY_SYMKEY, DIRECT_TRANSFER, CONVERT, EXECUTE_CONTRACT, IDENTITY_CALL, IDENTITY_APPROVEANDCALL} from "./constants";

window.MiniMeToken = MiniMeToken;
window.StatusRoot = StatusRoot;

import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
  state = {
    loading: true,
    busy: false,
    account: web3.eth.defaultAccount,
    mode: DIRECT_TRANSFER,
    to: '0x0000000000000000000000000000000000000001',
    contract: '',
    data: '0x0',
    gasPrice: '10000',
    gasLimit: '200000',
    amount: '123',
    token: MiniMeToken.options.address,
    baseToken: MiniMeToken.options.address,
    isContract: false,
    symmetricKeyID: null,
    asymmetricKeyID: null,
    relayer: '',
    availableRelayers: [],
    identities: [],
    showResponse: true,
    response: {},
    error: ''
  }

  componentDidMount(){
    EmbarkJS.onReady(async (err) => {
      if(!err) this.setState({loading: false});
      await this.whisperSetup();
    });
  }

  async whisperSetup() {
    const asymmetricKeyID = await web3.shh.newKeyPair();
    const symmetricKeyID = await web3.shh.addSymKey(RELAY_SYMKEY);
    this.setState({asymmetricKeyID, symmetricKeyID});
    await web3.shh.setMinPoW(0.002);
    StatusGasRelayer.subscribe(web3, this.processWhisperMessages, {privateKeyID: this.state.asymmetricKeyID});  

    // Obtain identities for signer
    StatusRoot.events.ConvertedAccount({fromBlock: 0, filter: {_msgSigner: web3.eth.defaultAccount}}, (error, event) => { 
      const identities = this.state.identities;
      identities.push(event.returnValues._identity);
      this.setState({identities});
    });
  }

  processWhisperMessages = (error, response) => {
    if(error) {
        console.error(error);
        return;
    }

    if(response.message == Messages.available){ 
        console.log("Relayer available: " + response.sig);
        let availableRelayers = this.state.availableRelayers;
        if(!availableRelayers.find(x => x.sig != response.sig)) availableRelayers.push(response);
        this.setState({availableRelayers});
    } else {
      this.setState({response});
    }
  }

  obtainRelayers = async (event) => {
    event.preventDefault();
    this.setState({availableRelayers: [], busy: true});
    const {symmetricKeyID, asymmetricKeyID, gasPrice} = this.state;
    await queryRelayers(symmetricKeyID, asymmetricKeyID, gasPrice);
    setTimeout(() => { this.setState({busy: false}); }, 1500);
  }

  selectAccount = async (account) => {
    this.setState({account, error: ''});
    try {
      const codeSize = await web3.eth.getCode(account);
      this.setState({isContract: codeSize !== "0x"});
    } catch(e) {
      console.error(e);
      this.setState({error: "Invalid 'from' address"});
    }
  }

  handleRelayerChange = (event) => {
    const {availableRelayers, gasPrice} = this.state;
    const relayer = event.target.value;
    this.setState({relayer});

    if(!relayer) return;
    const relayerData = availableRelayers.find(x => x.address === relayer);
    if(web3.utils.toBN(gasPrice).lt(web3.utils.toBN(relayerData.minGasPrice))){
      if(confirm("Gas Price is less than Relayer's min price. Update?")) this.setState({gasPrice: relayerData.minGasPrice});
    }
  }

  handleChange = name => event => {
    const state = this.state;
    state[name] = event.target.value;
    this.setState(state);
  }

  handleSubmit = async () => {
    const {account, to, amount, data, contract, gasPrice, baseToken, gasLimit, relayer, availableRelayers, asymmetricKeyID, mode, token} = this.state;
    const relayerData = availableRelayers.find(x => x.address === relayer);

    this.setState({busy: true, error: ''});
    
    try {
      switch(mode){
        case DIRECT_TRANSFER:
          await directTransfer(to, amount, gasPrice, gasLimit, relayerData, asymmetricKeyID);
          break;
        case CONVERT:
          await convert(amount, gasPrice, gasLimit, relayerData, asymmetricKeyID);
          break;
        case EXECUTE_CONTRACT:
          await execute(contract, data, gasPrice, gasLimit, relayerData, asymmetricKeyID);
          break;
        case IDENTITY_CALL:
          await call(account, to, amount, data, token, gasPrice, gasLimit, relayerData, asymmetricKeyID);
          break;
        case IDENTITY_APPROVEANDCALL:
          await approveAndCall(account, to, amount, data, baseToken, gasPrice, gasLimit, relayerData, asymmetricKeyID);
          break;
        default:
          throw new Error("Unknown mode");
      }
    } catch(e) {
      console.error(e);
      this.setState({error: e.message});
    }

    this.setState({busy: false});
  }

  render(){
    const {error, loading, to, contract, isContract, data, gasPrice, gasLimit, amount, relayer, availableRelayers, mode, busy, response, identities} = this.state;

    return <Fragment>
      {!loading && <Fragment>
        <Form>
          <div className="row">
            <div className="col">
              {error && <Alert color="danger">{error}</Alert>}
            </div>
          </div>
          <div className="row">
            <div className="col">
              <IdentitySelector onChange={this.selectAccount} identities={identities} />
            </div>
            <div className="col">
              <ModeSelector onChange={this.handleChange('mode')} isContract={isContract} />
            </div>
          </div>
          {isContract && <div className="row">
            <div className="col">
              <TokenSelector label="Token" {...this.state} onChange={this.handleChange('token')} />
            </div>
          </div>}
          {mode === IDENTITY_APPROVEANDCALL && <div className="row">
            <div className="col">
              <TokenSelector label="Token to approve and call" {...this.state} onlyTokens={true} onChange={this.handleChange('baseToken')} />
            </div>
          </div>}
          <div className="row">
            {mode !== EXECUTE_CONTRACT && mode !== CONVERT && <div className="col-6">
                <StandardField name="to" label="To" value={to} placeholder="0x1234...ABCDE" onChange={this.handleChange('to')} />
              </div> }
            { mode !== EXECUTE_CONTRACT && <div className="col">
                <StandardField name="amount" label="Amount" value={amount} onChange={this.handleChange('amount')} suffix="wei" />
              </div> }
            {mode === EXECUTE_CONTRACT && <Fragment>
              <div className="col-4">
                <StandardField name="contract" label="Contract" placeholder="0x1234...ABCDE" value={contract} onChange={this.handleChange('contract')} />
              </div>
              <div className="col">
                <StandardField name="data" label="Data" placeholder="0x0" value={data} onChange={this.handleChange('data')} />
              </div>
            </Fragment>}
            <div className="col">
              <StandardField name="gasPrice" label="Gas Price" value={gasPrice} onChange={this.handleChange('gasPrice')} suffix="wei" />
            </div>
            <div className="col">
              <StandardField name="gasLimit" label="Gas Limit" value={gasLimit} onChange={this.handleChange('gasLimit')} suffix="wei" />
            </div>
          </div>
          {isContract && <div className="row">
              <div className="col">
                <StandardField name="data" label="Data" placeholder="0x0" value={data} onChange={this.handleChange('data')} />
              </div>
            </div>}
          <div className="row">
            <div className="col">
              <RelayerSelector disabled={busy} onChange={this.handleRelayerChange} onClick={this.obtainRelayers} relayer={relayer} relayers={availableRelayers} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <hr />
              <Button disabled={!relayer || busy} className="btn btn-primary btn-lg btn-block" onClick={this.handleSubmit}>Submit</Button>
            </div>
          </div>
        </Form>
        <hr />
        <RelayResponse response={response} />
      </Fragment> }
    </Fragment>;
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
