/* global web3 */

import React, {Component} from 'react';
import {FormGroup, Label, Input} from 'reactstrap';
import PropTypes from 'prop-types';

class IdentitySelector extends Component {
  state = {
    account: ''
  }

  handleChange = event => {
    const account = event.target.value;
    this.setState({account});
    this.props.onChange(account);
  };

  render() {
    return <FormGroup>
    <Label for="account">From</Label>
    <Input type="select" name="select" id="account" value={this.state.account} onChange={this.handleChange}>
      <option key={1} value={web3.eth.defaultAccount}>{web3.eth.defaultAccount} (Default)</option>
    </Input>
  </FormGroup>;
  }
}

IdentitySelector.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default IdentitySelector;
