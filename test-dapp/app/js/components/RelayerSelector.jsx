import React from 'react';
import {FormGroup, Label, Input, InputGroup, InputGroupAddon, Button} from 'reactstrap';
import PropTypes from 'prop-types';

const RelayerSelector = props => (
  <FormGroup>
    <Label for="select">Relayer</Label>
    <InputGroup>
      <Input disabled={props.relayers.length == 0 || props.disabled} type="select" name="select" id="select" value={props.relayer} onChange={props.onChange}>
        <option key={0} value=""></option>
        { props.relayers.map((r,i) => <option key={i} value={r.address}>{r.address + " - Minimum accepted gas price: " + r.minGasPrice + " - Trxs will be created with gas price: ~" + r.gasPriceETH }</option>)}
      </Input>
      <InputGroupAddon addonType="append"><Button disabled={props.disabled} onClick={props.onClick}>...</Button></InputGroupAddon>
    </InputGroup>
  </FormGroup>
);

RelayerSelector.propTypes = {
  relayer: PropTypes.string,
  relayers: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default RelayerSelector;
