import React, {Component, Fragment} from 'react';
import CallGasRelayed from './callgasrelayed';
import Divider from '@material-ui/core/Divider';
import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';
import PropTypes from 'prop-types';
import Status from './status';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import {Typography} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';

const styles = {};

class Body extends Component {

    constructor(props){
        super(props);
        this.state = {
            tab: 0,
            identityAddress: null,
            nonce: '0'
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(err => {
            if(err) {
                console.error(err);
                return;
            }

            this.setState({
                identityAddress: IdentityGasRelay.options.address
            });
        });
    }

    handleChange = (event, tab) => {
        this.setState({tab});
    };

    updateNonce = (newNonce) => {
        this.setState({nonce: newNonce});
    }

    newIdentity = (cb) => {
        let toSend = IdentityFactory.methods['createIdentity()']();
        toSend.estimateGas()
        .then(estimatedGas => {
            return toSend.send({gas: estimatedGas + 1000000});
        })
        .then((receipt) => {
            console.log(receipt);
            const instance = receipt.events.IdentityCreated.returnValues.instance;
            this.setState({identityAddress: instance});
            cb();
        });
    }

    render(){
        const {tab, identityAddress, nonce} = this.state;

        return <Fragment>
            <Tabs value={tab} onChange={this.handleChange}>
                <Tab label="Call" />
                <Tab label="Approve and Call" />
                <Tab label="Deploy" />
            </Tabs>
            {tab === 0 && <Container><CallGasRelayed nonce={nonce} identityAddress={identityAddress} /></Container>}
            {tab === 1 && <Container>Item Two</Container>}
            {tab === 2 && <Container>Item Three</Container>}
            <Divider />
            <Container>
                <Status identityCreationFunction={this.newIdentity} nonceUpdateFunction={this.updateNonce} nonce={nonce} identityAddress={identityAddress} />
            </Container>
        </Fragment>;
    }
}

function Container(props) {
    return <Typography component="div" style={{padding: 8 * 3}}>
        {props.children}
    </Typography>;
}
  
Container.propTypes = {
    children: PropTypes.node.isRequired
};

Body.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Body);
