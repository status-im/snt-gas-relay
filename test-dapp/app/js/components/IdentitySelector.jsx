/* global web3 */

import React, {Component} from 'react';
import {FormGroup, Label, Input, InputGroup, InputGroupButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser} from '@fortawesome/free-solid-svg-icons';

class IdentitySelector extends Component {
  state = {
    account: web3.eth.defaultAccount,
    availableIdentities: [],
    dropdownOpen: false
  }

  handleChange = event => {
    const account = event.target.value;
    this.setState({account});
    this.props.onChange(account);
  };

  handleMenuClick = account => event => {
    event.preventDefault();
    this.setState({account});
    this.props.onChange(account);
  }

  toggleDropDown = () => {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  render() {
    return <FormGroup>
    <Label for="account">From</Label>
    <InputGroup>
      <Input type="text" name="select" id="account" value={this.state.account} onChange={this.handleChange} />
      <InputGroupButtonDropdown addonType="append" isOpen={this.state.dropdownOpen} toggle={this.toggleDropDown}>
      <DropdownToggle caret>
        <FontAwesomeIcon icon={faUser} />
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>Default Account</DropdownItem>
        <DropdownItem onClick={this.handleMenuClick(web3.eth.defaultAccount)}>{web3.eth.defaultAccount}</DropdownItem>
        <DropdownItem divider />
        <DropdownItem header>Identities</DropdownItem>
        <DropdownItem>0x1234567890123456789012345678901234567890</DropdownItem>
        <DropdownItem divider />
      </DropdownMenu>
    </InputGroupButtonDropdown>

    </InputGroup>
  </FormGroup>;
  }
}

IdentitySelector.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default IdentitySelector;
