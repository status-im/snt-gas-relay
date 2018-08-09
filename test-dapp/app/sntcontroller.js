import React, {Component, Fragment} from 'react';
import BodySNTController from './components/body-sntcontroller';
import Header from './components/header';
import ReactDOM from 'react-dom';


class App extends Component {
  render(){
    return <Fragment>
      <Header />
      <BodySNTController />
    </Fragment>;
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
