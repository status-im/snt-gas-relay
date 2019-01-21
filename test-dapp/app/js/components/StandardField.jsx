import React from 'react';
import {FormGroup, Label, Input, InputGroup, InputGroupAddon, InputGroupText} from 'reactstrap';
import PropTypes from 'prop-types';

const StandardField = (props) => (
  <FormGroup>
    <Label for={props.name}>{props.label}</Label>
    <InputGroup>
      <Input type="text" name={props.name} placeholder={props.placeholder} id={props.name} value={props.value} onChange={props.onChange} />
      {props.suffix && <InputGroupAddon addonType="append">
          <InputGroupText>{props.suffix}</InputGroupText>
        </InputGroupAddon>}
      </InputGroup>
  </FormGroup>
);

StandardField.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  suffix: PropTypes.string
};

export default StandardField;
