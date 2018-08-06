import React, {Component, Fragment} from 'react';
import Body from './components/body';
import Header from './components/header';
import ReactDOM from 'react-dom';


class App extends Component {
  render(){
    return <Fragment>
      <Header />
      <Body />
    </Fragment>;
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
