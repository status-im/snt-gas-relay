import React, {Component, Fragment} from 'react';
import Divider from '@material-ui/core/Divider';
import EmbarkJS from 'Embark/EmbarkJS';
import STT from 'Embark/contracts/STT';
import PropTypes from 'prop-types';
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
            message: ''
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
                        if(error){
                            console.error(error);
                        } else {
                            this.setState({message: web3js.utils.toAscii(message.payload)});
                        }
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
        const {tab, walletAddress, nonce, web3js, message, kid, skid} = this.state;

        return <Fragment>
            <Tabs value={tab} onChange={this.handleChange}>
                <Tab label="Transfer SNT" />
                <Tab label="Execute" />
            </Tabs>
            {tab === 0 && <Container><TransferSNT clearMessages={this.clearMessages} web3={web3js} kid={kid} skid={skid} nonce={nonce} /></Container>}
            {tab === 1 && <Container>TODO</Container>}
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
