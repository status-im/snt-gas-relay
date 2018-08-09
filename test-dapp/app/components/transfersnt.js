import React, {Component} from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import MySnackbarContentWrapper from './snackbar';
import PropTypes from 'prop-types';
import SNTController from 'Embark/contracts/SNTController';
import TestContract from 'Embark/contracts/TestContract';
import TextField from '@material-ui/core/TextField';
import config from '../config';
import web3 from 'Embark/web3';
import {withStyles} from '@material-ui/core/styles';
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
class TransferSNT extends Component {

    constructor(props){
        super(props);
        this.state = {
            topic: '0x534e5443',
            to: '0x0000000000000000000000000000000000000000',
            amount: 0,
            gasPrice: 0,
            signature: '',
            kid: null,
            skid: null,
            msgSent: '',
            payload: '',
            message: '',
            web3js: null, 
            transactionError: '',
            messagingError: '',
            submitting: false
        };
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
  
        SNTController.options.address = this.props.identityAddress;
        
        try {
            let message = "";
            SNTController.methods.getTransferSNTHash(
                this.state.to,
                this.state.amount,
                this.props.nonce,
                this.state.gasPrice
            )
            .call()
            .then(result => {
                message = result;
                return web3.eth.getAccounts();
            })
            .then(accounts => {
                return web3.eth.sign(message, accounts[2]);
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
            let jsonAbi = SNTController._jsonInterface.filter(x => x.name == "transferSNT")[0];
            let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
                                                                this.state.to, 
                                                                this.state.amount, 
                                                                this.props.nonce, 
                                                                this.state.gasPrice, 
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
                    'address': SNTController.options.address,
                    'encodedFunctionCall': funCall
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

    render(){
        const {classes} = this.props;
        return <div>
        { this.state.transactionError && <MySnackbarContentWrapper variant="error" message={this.state.transactionError} /> }
        <Card className={classes.card}>
            <CardHeader title="1. Transaction Data" />
            <CardContent>
                <form noValidate autoComplete="off">
                <Grid container spacing={24}>
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
                            id="amount"
                            label="Amount"
                            value={this.state.amount}
                            onChange={this.handleChange('amount')}
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
                </Grid>
                </form>
            </CardContent>
            <CardActions>
                <Button color="primary" onClick={this.sign}>
                    Sign Message
                </Button>
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

TransferSNT.propTypes = {
    classes: PropTypes.object.isRequired,
    nonce: PropTypes.string.isRequired,
    identityAddress: PropTypes.string,
    web3: PropTypes.object,
    kid: PropTypes.string,
    skid: PropTypes.string,
    clearMessages: PropTypes.func
};

export default withStyles(styles)(TransferSNT);
