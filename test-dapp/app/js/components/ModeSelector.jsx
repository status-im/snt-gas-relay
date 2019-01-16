import React from 'react';
import {FormGroup, Label, Input} from 'reactstrap';
import PropTypes from 'prop-types';

const ModeSelector = (props) => (
      <FormGroup>
        <Label for="mode">Mode</Label>
        <Input type="select" name="select" id="mode" value={props.mode} onChange={props.onChange}>
          <option value="DIRECT_TRANSFER">Direct Transfer</option>
          <option value="CONVERT">Convert</option>
          <option value="EXECUTE_CONTRACT">Execute allowed contract</option>
        </Input>
    </FormGroup>
);

ModeSelector.propTypes = {
  mode: PropTypes.string,
  onChange: PropTypes.func
};

export default ModeSelector;
