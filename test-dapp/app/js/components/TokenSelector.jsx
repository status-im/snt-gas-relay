import React, {Component} from 'react';
import { FormGroup, Label, Input } from 'reactstrap';
import PropTypes from 'prop-types';
import MiniMeToken from 'Embark/contracts/MiniMeToken';

class TokenSelector extends Component {
  state = {
    token: MiniMeToken.options.address,
    tokenList: []
  }

  componentDidMount(){
    const tokenList = this.state.tokenList;

    // TODO: obtain list of tokens
    tokenList.push({name: "Ethereum", symbol: "ETH", address: "0x0000000000000000000000000000000000000000"});
    this.setState({tokenList});
  }

  handleChange = event => {
    const token = event.target.value;
    this.setState({token});
    this.props.onChange(event);
  };

  componentDidUpdate(prevProps) {
    if (this.props.mode !== prevProps.mode) {
      if(this.props.mode == "CONVERT") this.setState({token: MiniMeToken.options.address});
    }
  }

  render() {
    const {token, tokenList} = this.state;
    const {mode} = this.props;
    
    return (
      <FormGroup>
        <Label for="token">Token</Label>
        <Input type="select" name="select" id="token" value={token} onChange={this.handleChange}>
          <option value={MiniMeToken.options.address}>Status Network Token (SNT)</option>
          {mode !== "CONVERT" && tokenList.map((t, i) => <option key={i} value={t.address}>{t.name} ({t.symbol})</option>)}
        </Input>
    </FormGroup>);
  }
}

TokenSelector.propTypes = {
  mode: PropTypes.string,
  onChange: PropTypes.func
};

export default TokenSelector;
