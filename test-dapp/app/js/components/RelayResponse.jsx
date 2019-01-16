import React, {Component} from 'react';
import {Alert} from 'reactstrap';
import PropTypes from 'prop-types';

class RelayResponse extends Component {
  state = {
    show: false
  }

  close = () => {
    this.setState({show: false});
  }

  componentDidUpdate(prevProps) {
    const {text, sig} = this.props.response;
    if (sig && (text !== prevProps.response.text || sig !== prevProps.response.sig)) {
      this.setState({show: true});
    }
  }

  render() {
    const {text, sig} = this.props.response;

    return this.state.show && <Alert color="secondary" isOpen={this.state.show} toggle={this.close}>
    <h4 className="alert-heading">Relay Response</h4>
      <p>{text}</p>
      <p>Pubkey: {sig}</p>
  </Alert>;
  }
}

RelayResponse.propTypes = {
  response: PropTypes.object
};

export default RelayResponse;
