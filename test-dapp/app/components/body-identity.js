import React, {Component, Fragment} from 'react';
import StatusGasRelayer, {Messages} from '../status-gas-relayer';
import ApproveAndCallGasRelayed from './approveandcallgasrelayed';
import CallGasRelayed from './callgasrelayed';
import Divider from '@material-ui/core/Divider';
import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';
import IdentityGasRelayBase from 'Embark/contracts/IdentityGasRelayBase';
import PropTypes from 'prop-types';
import Status from './status-identity';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import Web3 from 'web3';
import config from '../config';
import {withStyles} from '@material-ui/core/styles';

window.IdentityFactory = IdentityFactory;

const styles = {};

class Body extends Component {

    constructor(props){
        super(props);
        this.state = {
            tab: 0,
            identityAddress: "0x0000000000000000000000000000000000000000",
            nonce: '0',
            kid: null,
            skid: null,
            message: '',
            relayerAddress: '0x0000000000000000000000000000000000000000',
            relayers: {}
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(err => {
            if(err) {
                console.error(err);
                return;
            }

            const web3js = new Web3('ws://localhost:8546');


            // Default for devenv
            web3js.eth.net.getId().then(netId => {
                if(netId != 1 && netId != 3){
                    this.setState({relayerAddress: config.relayAccount});
                }
            });

            web3js.shh.newKeyPair()
            .then((kid) => {
                web3js.shh.addSymKey(config.relaySymKey)
                .then((skid) => {
                    this.setState({kid, skid});

                    StatusGasRelayer.subscribe(web3js, (error, msgObj) => {
                        if(error) {
                            console.error(error);
                            return;
                        }

                        if(msgObj.message == Messages.available){
                            // found a relayer
                            console.log("Relayer available: " + msgObj.sig);

                            let relayers = this.state.relayers;
                            relayers[msgObj.sig] = msgObj.address;

                            if(this.state.relayerAddress == '0x0000000000000000000000000000000000000000'){
                                this.setState({relayerAddress: msgObj.address});
                            }
                            
                            this.setState({relayers});
                        }

                        this.setState({message: JSON.stringify(msgObj, null, 2)});
                    }, {
                        privateKeyID: kid
                    });

                    return true;
                });
            });

            this.setState({
                web3js
            });
        });
    }

    handleChange = (event, tab) => {
        this.setState({tab});
    };

    updateRelayer = (relayer) => {
        this.setState({relayerAddress: this.state.relayers[relayer]});
    }

    updateNonce = (newNonce) => {
        this.setState({nonce: newNonce});
    }

    clearMessages = () => {
        this.setState({message: ''});
    }

    newIdentity = (cb) => {
        let toSend = IdentityFactory.methods['createIdentity()']();
        toSend.estimateGas()
        .then(estimatedGas => {
            console.log("Estimated Gas: " + estimatedGas);
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
        const {tab, identityAddress, nonce, web3js, message, kid, skid, relayers, relayerAddress} = this.state;

        return <Fragment>
            <Tabs value={tab} onChange={this.handleChange}>
                <Tab label="Call" />
                <Tab label="Approve and Call" />
                <Tab label="Deploy" />
            </Tabs>
            {tab === 0 && <Container><CallGasRelayed clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} identityAddress={identityAddress} relayers={relayers} updateRelayer={this.updateRelayer} /></Container>}
            {tab === 1 && <Container><ApproveAndCallGasRelayed clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} identityAddress={identityAddress} relayers={relayers} updateRelayer={this.updateRelayer} /></Container>}
            {tab === 2 && <Container>Item Three</Container>}
            <Divider />
            <Container>
                <Status relayerAddress={relayerAddress} message={message} identityCreationFunction={this.newIdentity} nonceUpdateFunction={this.updateNonce} nonce={nonce} identityAddress={identityAddress} />
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
