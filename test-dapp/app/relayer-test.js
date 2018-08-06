import './relayer-test.css';
import {Tab, Tabs} from 'react-bootstrap';
import ApproveAndCallGasRelayed from './components/approveandcallgasrelayed';
import CallGasRelayed from './components/callgasrelayed';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';
import RND from 'Embark/contracts/RND';
import React from 'react';
import ReactDOM from 'react-dom';
import web3 from 'Embark/web3';

class App extends React.Component {

  constructor(props) {
    super(props);

    window['RND'] = RND;
    window['IdentityGasRelay'] = IdentityGasRelay;
  }

  _renderStatus(title, available){
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title} 
      <span className={className}></span>
    </React.Fragment>;
  }

  render(){
    return (<div><h3>IdentityGasRelay - Usage Example</h3>
      <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
        <Tab eventKey={1} title="callGasRelayed">
          <CallGasRelayed IdentityGasRelay={IdentityGasRelay} RND={RND} web3={web3} />
        </Tab>
        <Tab eventKey={2} title="approveAndCallGasRelayed">
          <ApproveAndCallGasRelayed IdentityGasRelay={IdentityGasRelay} RND={RND} web3={web3} />
        </Tab>
      </Tabs>
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
