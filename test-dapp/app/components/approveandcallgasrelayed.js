import React, {Component} from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import EmbarkJS from 'Embark/EmbarkJS';
import Grid from '@material-ui/core/Grid';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';
import MySnackbarContentWrapper from './snackbar';
import PropTypes from 'prop-types';
import STT from 'Embark/contracts/STT';
import TestContract from 'Embark/contracts/TestContract';
import TextField from '@material-ui/core/TextField';
import config from '../config';
import web3 from 'Embark/web3';
import {withStyles} from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
const styles = theme => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.paper
      },
    card: {
        marginBottom: theme.spacing.unit * 3
    }
  });

window.TestContract = TestContract;
class ApproveAndCallGasRelayed extends Component {

    constructor(props){
        super(props);
        this.state = {
            topic: '0x4964656e',
            to: '0x0000000000000000000000000000000000000000',
            value: 0,
            data: '0x00',
            baseToken: "0x0000000000000000000000000000000000000000",
            gasPrice: 0,
            gasLimit: 0,
            gasToken: "0x0000000000000000000000000000000000000000",
            signature: '',
            transactionError: '',
            messagingError: '',
            submitting: false
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(() => {
            this.setState({
                baseToken: STT.options.address,
                gasToken: STT.options.address
            });
        });
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value
        });
    };

    sign = (event) => {
        if(event) event.preventDefault();
  
        this.setState({
          msgSent: false,
          transactionError: ''
        });
  
        IdentityGasRelay.options.address = this.props.identityAddress;
        
        try {
            IdentityGasRelay.methods.deployGasRelayHash(
                this.state.value,
                web3.utils.soliditySha3({t: 'bytes', v: this.state.data}),
                this.props.nonce,
                this.state.gasPrice,
                this.state.gasLimit,
                this.state.gasToken
            )
            .call()
            .then(message => {
                return web3.eth.sign(message, web3.eth.defaultAccount);
            })
            .then(signature => {
                this.setState({signature});
            });
        } catch(error){
            this.setState({transactionError: error.message});
        }
    }

    sendMessage = event => {
        event.preventDefault();

        const {web3, kid, skid} = this.props;

        this.setState({
          messagingError: '',
          submitting: true
        });
        this.props.clearMessages();

  
        try {
            let jsonAbi = IdentityGasRelay._jsonInterface.filter(x => x.name == "approveAndCallGasRelayed")[0];
            let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                                                                this.state.baseToken,
                                                                this.state.to, 
                                                                this.state.value, 
                                                                this.state.data, 
                                                                this.props.nonce, 
                                                                this.state.gasPrice, 
                                                                this.state.gasLimit,
                                                                this.state.gasToken,
                                                                this.state.signature
                                                                ]);
            const sendOptions = {
                ttl: 1000, 
                sig: kid,
                powTarget: 1, 
                powTime: 20, 
                topic: this.state.topic,
                symKeyID: skid,
                payload: web3.utils.toHex({
                    'contract': this.props.identityAddress,
                    'encodedFunctionCall': funCall,
                    'address': web3.eth.defaultAccount
                })
            };

            web3.shh.post(sendOptions)
            .then(() => {
               this.setState({submitting: false});
               console.log("Message sent");
               return true;
            });
        } catch(error){
            this.setState({messagingError: error.message, submitting: false});
        }
    }

    testContractDataSend = () => {
        let jsonAbi = TestContract._jsonInterface.filter(x => x.name == "sentSTT")[0];
        let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [10]);
        this.setState({data: funCall, value: 10, to: TestContract.options.address});
    }

    testContractDataCall = () => {
        STT.methods.balanceOf(TestContract.options.address).call()
        .then(value => console.log({message: "STT Balance of TestContract: " + value}));
    }

    render(){
        const {classes} = this.props;
        return <div>
        <Card className={classes.card}>
            <CardContent>
                <b>This functionality is used when a Identity will invoke a contract function that requires a transfer of Tokens</b>
            </CardContent>
        </Card>
        { this.state.transactionError && <MySnackbarContentWrapper variant="error" message={this.state.transactionError} /> }
        <Card className={classes.card}>
            <CardHeader title="1. Transaction Data" />
            <CardContent>
                <form noValidate autoComplete="off">
                <Grid container spacing={24}>
                    <Grid item xs={12}>
                        <TextField
                            id="gasToken"
                            label="Base Token"
                            value={this.state.baseToken}
                            onChange={this.handleChange('baseToken')}
                            margin="normal"
                            fullWidth
                            select
                            SelectProps={{
                                native: true
                            }}
                            >
                            <option key={STT.options.address} value={STT.options.address}>
                            {STT.options.address} (STT)
                            </option>
                        </TextField>
                    </Grid>
                    <Grid item xs={5}>
                        <TextField
                            id="to"
                            label="To"
                            value={this.state.to}
                            onChange={this.handleChange('to')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                    <Grid item xs={2}>
                        <TextField
                            id="value"
                            label="Value"
                            value={this.state.value}
                            onChange={this.handleChange('value')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                    <Grid item xs={5}>
                        <TextField
                            id="data"
                            label="Data"
                            value={this.state.data}
                            onChange={this.handleChange('data')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                    <Grid item xs={2}>
                        <TextField
                            id="nonce"
                            label="Nonce"
                            value={this.props.nonce}
                            margin="normal"
                            fullWidth
                            InputProps={{
                                readOnly: true
                            }}
                            />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="gasToken"
                            label="Gas Token"
                            value={this.state.gasToken}
                            onChange={this.handleChange('gasToken')}
                            margin="normal"
                            fullWidth
                            select
                            SelectProps={{
                                native: true
                            }}
                            >
                            <option key={STT.options.address} value={STT.options.address}>
                            {STT.options.address} (STT)
                            </option>
                            <option key="0x0000000000000000000000000000000000000000" value="0x0000000000000000000000000000000000000000">
                            0x0000000000000000000000000000000000000000 (ETH)
                            </option>
                        </TextField>
                    </Grid>
                    <Grid item xs={2}>
                        <TextField
                            id="gasPrice"
                            label="Gas Price"
                            value={this.state.gasPrice}
                            onChange={this.handleChange('gasPrice')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                    <Grid item xs={2}>
                        <TextField
                            id="gasLimit"
                            label="Gas Limit"
                            value={this.state.gasLimit}
                            onChange={this.handleChange('gasLimit')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                </Grid>
                </form>
            </CardContent>
            <CardActions>
                <Button color="primary" onClick={this.sign}>
                    Sign Message
                </Button>
                <Button size="small" onClick={this.testContractDataSend}>TestContract.methods.sentSTT(10).send()</Button>
                <Button size="small" onClick={this.testContractDataCall}>STT.methods.balanceOf(TestContract).call()</Button>

            </CardActions>
        </Card>

        { this.state.messagingError && <MySnackbarContentWrapper variant="error" message={this.state.messagingError} /> }
        <Card className={classes.card}>
            <CardHeader title="2. Message" />
            <CardContent>   
                <TextField
                    id="signature"
                    label="Signed Message"
                    value={this.state.signature}
                    margin="normal"
                    fullWidth
                    InputProps={{
                        readOnly: true
                    }}
                    />
                <TextField
                    id="symKey"
                    label="Symmetric Key"
                    value={config.relaySymKey}
                    margin="normal"
                    fullWidth
                    InputProps={{
                        readOnly: true
                    }}
                    />
                <TextField
                    id="topic"
                    label="Whisper Topic"
                    value={this.state.topic}
                    margin="normal"
                    InputProps={{
                        readOnly: true
                    }}
                    />
            </CardContent>  
            <CardActions>
                <Button size="small" color="primary" onClick={this.sendMessage} disabled={this.state.submitting}>
                    Send Message
                </Button>
            </CardActions>   
        </Card>
        
        </div>;
    }
}

ApproveAndCallGasRelayed.propTypes = {
    classes: PropTypes.object.isRequired,
    nonce: PropTypes.string.isRequired,
    identityAddress: PropTypes.string,
    web3: PropTypes.object,
    kid: PropTypes.string,
    skid: PropTypes.string,
    clearMessages: PropTypes.func
};

export default withStyles(styles)(ApproveAndCallGasRelayed);
