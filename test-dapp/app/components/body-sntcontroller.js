import React, {Component, Fragment} from 'react';
import StatusGasRelayer, {Messages} from '../status-gas-relayer';
import Divider from '@material-ui/core/Divider';
import EmbarkJS from 'Embark/EmbarkJS';
import Execute from './execute';
import PropTypes from 'prop-types';
import STT from 'Embark/contracts/STT';
import Status from './status-sntcontroller';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TransferSNT from './transfersnt';
import Typography from '@material-ui/core/Typography';
import Web3 from 'web3';
import config from '../config';
import web3 from 'Embark/web3';
import {withStyles} from '@material-ui/core/styles';

window.STT = STT;

const styles = {};

class Body extends Component {

    constructor(props){
        super(props);
        this.state = {
            tab: 0,
            walletAddress: null,
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

                    StatusGasRelayer.subscribe(web3js, (error, msgObj) => {
                        if(error) {
                            console.error(error);
                            return;
                        }

                        if(msgObj.message == Messages.available){
                            // found a relayer
                            console.log("Relayer available: " + msgObj.sig);
                            let relayers = this.state.relayers;
                            relayers.push(msgObj.sig);
                            relayers = relayers.filter((value, index, self) => self.indexOf(value) === index);
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

            web3.eth.getAccounts()
            .then(accounts => {
                this.setState({walletAddress: accounts[2]});
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

    render(){
        const {tab, walletAddress, nonce, web3js, message, kid, skid, relayers} = this.state;

        return <Fragment>
            <Tabs value={tab} onChange={this.handleChange}>
                <Tab label="Transfer SNT" />
                <Tab label="Execute" />
            </Tabs>
            {tab === 0 && <Container><TransferSNT clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} relayers={relayers} /></Container>}
            {tab === 1 && <Container><Execute clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} relayers={relayers} /></Container>}
            <Divider />
            <Container>
                <Status message={message} nonceUpdateFunction={this.updateNonce} nonce={nonce} walletAddress={walletAddress} />
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
