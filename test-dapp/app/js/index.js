/* global web3 */

import React, {Component, Fragment} from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import {Form, Button} from 'reactstrap';
import {IdentitySelector, ModeSelector, TokenSelector, RelayerSelector, StandardField, RelayResponse} from "./components";
import StatusGasRelayer, {Messages} from "./status-gas-relayer";
import MiniMeToken from 'Embark/contracts/MiniMeToken';
import StatusRoot from 'Embark/contracts/StatusRoot';
import {directTransfer, convert, execute, queryRelayers} from "./relay-utils";
import {RELAY_SYMKEY, DIRECT_TRANSFER, CONVERT, EXECUTE_CONTRACT} from "./constants";

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
    data: '',
    gasPrice: '10000',
    gasLimit: '0',
    amount: '123',
    token: MiniMeToken.options.address,
    isContract: false,
    symmetricKeyID: null,
    asymmetricKeyID: null,
    relayer: '',
    availableRelayers: [],
    showResponse: true,
    response: {}
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
  }

  processWhisperMessages = (error, result) => {
    if(error) {
        console.error(error);
        return;
    }

    if(result.message == Messages.available){ 
        console.log("Relayer available: " + result.sig);
        let availableRelayers = this.state.availableRelayers;
        if(!availableRelayers.find(x => x.sig != result.sig)) availableRelayers.push(result);
        this.setState({availableRelayers});
    } else {
      this.setState({response: result});
    }
  }

  obtainRelayers = async (event) => {
    event.preventDefault();
    this.setState({availableRelayers: [], busy: true});
    const {symmetricKeyID, asymmetricKeyID, gasPrice} = this.state;
    await queryRelayers(symmetricKeyID, asymmetricKeyID, gasPrice);
    this.setState({busy: false});
  }

  selectAccount = async (account) => {
    this.setState({account});
    const codeSize = await web3.eth.getCode(account);
    this.setState({isContract: codeSize === "0x"});
  }

  handleChange = name => event => {
    const state = this.state;
    state[name] = event.target.value;
    this.setState(state);
  }

  handleSubmit = async () => {
    const {to, amount, data, contract, gasPrice, gasLimit, relayer, availableRelayers, asymmetricKeyID, mode} = this.state;
    const relayerData = availableRelayers.find(x => x.address === relayer);

    this.setState({busy: true});

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
      default:
        throw new Error("Unknown mode");
    }

    this.setState({busy: false});
  }

  render(){
    const {loading, to, contract, data, gasPrice, amount, relayer, availableRelayers, mode, busy, response} = this.state;
    return <Fragment>
      {!loading && <Fragment>
        <Form>
          <div className="row">
            <div className="col">
              <IdentitySelector onChange={this.selectAccount} />
            </div>
            <div className="col">
              <ModeSelector onChange={this.handleChange('mode')} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <TokenSelector {...this.state} onChange={this.handleChange('token')} />
            </div>
          </div>
          <div className="row">
            {mode !== EXECUTE_CONTRACT && <Fragment>
              <div className="col-6">
                <StandardField name="to" label="To" value={to} onChange={this.handleChange('to')} />
              </div>
              <div className="col">
                <StandardField name="amount" label="Amount" value={amount} onChange={this.handleChange('amount')} suffix="wei" />
              </div>
            </Fragment>}
            {mode === EXECUTE_CONTRACT && <Fragment>
              <div className="col-6">
                <StandardField name="contract" label="Contract" value={contract} onChange={this.handleChange('contract')} />
              </div>
              <div className="col">
                <StandardField name="data" label="Data" value={data} onChange={this.handleChange('data')} />
              </div>
            </Fragment>}
            <div className="col">
              <StandardField name="gasPrice" label="Gas Price" value={gasPrice} onChange={this.handleChange('gasPrice')} suffix="wei" />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <RelayerSelector disabled={busy} onChange={this.handleChange('relayer')} onClick={this.obtainRelayers} relayer={relayer} relayers={availableRelayers} />
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
