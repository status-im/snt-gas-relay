import React, {Component} from 'react';
import {FormGroup, Label, Input} from 'reactstrap';
import PropTypes from 'prop-types';
import {tokenList} from "../token-list";
import {ZERO_ADDRESS, CONVERT} from "../constants";

class TokenSelector extends Component {
  state = {
    token: '',
    tokenList: []
  }

  componentDidMount(){
    this.setState({tokenList});
  }

  handleChange = event => {
    const token = event.target.value;
    this.setState({token});
    this.props.onChange(event);
  };

  componentDidUpdate(prevProps) {
    if (this.props.mode !== prevProps.mode) {
      if(this.props.mode === CONVERT) {
        this.setState({
          tokenList: tokenList.filter(x => x.address !== ZERO_ADDRESS)
        });
      }
    }
  }

  render() {
    const {token, tokenList} = this.state;

    return (
      <FormGroup>
        <Label for="token">Token</Label>
        <Input type="select" name="select" id="token" value={token} onChange={this.handleChange}>
          {tokenList.map((t, i) => <option key={i} value={t.address}>{t.name} ({t.symbol})</option>)}
        </Input>
    </FormGroup>);
  }
}

TokenSelector.propTypes = {
  mode: PropTypes.string,
  onChange: PropTypes.func
};

export default TokenSelector;
