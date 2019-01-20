import React, {Fragment} from 'react';
import {FormGroup, Label, Input} from 'reactstrap';
import PropTypes from 'prop-types';
import {DIRECT_TRANSFER, CONVERT, EXECUTE_CONTRACT, IDENTITY_APPROVEANDCALL, IDENTITY_CALL} from "../constants";

const ModeSelector = (props) => (
      <FormGroup>
        <Label for="mode">Mode</Label>
        <Input type="select" name="select" id="mode" value={props.mode} onChange={props.onChange}>
          {!props.isContract && (
            <Fragment>
              <option value={DIRECT_TRANSFER}>Direct Transfer</option>
              <option value={CONVERT}>Convert</option>
              <option value={EXECUTE_CONTRACT}>Execute allowed contract</option>
            </Fragment>)}
          {props.isContract && (
            <Fragment>
              <option value={IDENTITY_CALL}>Call</option>
              <option value={IDENTITY_APPROVEANDCALL}>Approve and Call</option>
            </Fragment>)}
        </Input>
    </FormGroup>
);

ModeSelector.propTypes = {
  isContract: PropTypes.bool,
  mode: PropTypes.string,
  onChange: PropTypes.func
};

export default ModeSelector;
