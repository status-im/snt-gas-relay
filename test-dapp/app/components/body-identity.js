import React, {Component, Fragment} from 'react';
import ApproveAndCallGasRelayed from './approveandcallgasrelayed';
import CallGasRelayed from './callgasrelayed';
import Divider from '@material-ui/core/Divider';
import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';
import PropTypes from 'prop-types';
import Status from './status-identity';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import Web3 from 'web3';
import config from '../config';
import {withStyles} from '@material-ui/core/styles';


const styles = {};

class Body extends Component {

    constructor(props){
        super(props);
        this.state = {
            tab: 0,
            identityAddress: null,
            nonce: '0',
            kid: null,
            skid: null,
            message: '',
            relayers: []
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(err => {
            if(err) {
                console.error(err);
                return;
            }

            const web3js = new Web3('ws://localhost:8546');
            
            web3js.shh.newKeyPair()
            .then((kid) => {
                web3js.shh.addSymKey(config.relaySymKey)
                .then((skid) => {
                    this.setState({kid, skid});
                    web3js.shh.subscribe('messages', {
                        "privateKeyID": kid,
                        "ttl": 1000,
                        "minPow": 0.1,
                        "powTime": 1000
                      }, (error, message) => {
                        console.log(message);

                        const msg = web3js.utils.toAscii(message.payload);
                        const msgObj = JSON.parse(msg);

                        if(msgObj.message == 'Available'){
                            // found a relayer
                            console.log("Relayer available: " + message.sig);

                            let relayers = this.state.relayers;
                            relayers.push(message.sig);
                            relayers = relayers.filter((value, index, self) => self.indexOf(value) === index);
                            this.setState({relayers});
                        }

                        if(error){
                            console.error(error);
                        } else {
                            this.setState({message: msg});
                        }
                    });

                    return true;
                });
            });

            this.setState({
                web3js,
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

    randomizeAddress = () => {
        // TODO:
        this.setState({identityAddress: "0xC0F1349e154Be9c2eBcc18088AC65d48Fc9ED0FF"});
    }

    render(){
        const {tab, identityAddress, nonce, web3js, message, kid, skid, relayers} = this.state;

        return <Fragment>
            <Tabs value={tab} onChange={this.handleChange}>
                <Tab label="Call" />
                <Tab label="Approve and Call" />
                <Tab label="Deploy" />
            </Tabs>
            {tab === 0 && <Container><CallGasRelayed clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} identityAddress={identityAddress} relayers={relayers} /></Container>}
            {tab === 1 && <Container><ApproveAndCallGasRelayed clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} identityAddress={identityAddress} relayers={relayers} /></Container>}
            {tab === 2 && <Container>Item Three</Container>}
            <Divider />
            <Container>
                <Status message={message} identityCreationFunction={this.newIdentity} randomizeAddress={this.randomizeAddress} nonceUpdateFunction={this.updateNonce} nonce={nonce} identityAddress={identityAddress} />
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
