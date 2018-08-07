import React, {Component} from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import EmbarkJS from 'Embark/EmbarkJS';
import ErrorIcon from '@material-ui/icons/Error';
import Grid from '@material-ui/core/Grid';
import IdentityGasRelay from 'Embark/contracts/IdentityGasRelay';
import PropTypes from 'prop-types';
import STT from 'Embark/contracts/STT';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import TestContract from 'Embark/contracts/TestContract';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
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
class CallGasRelayed extends Component {

    constructor(props){
        super(props);
        this.state = {
            topic: '0x4964656e',
            to: '0x0000000000000000000000000000000000000000',
            value: 0,
            data: '0x00',
            gasPrice: 0,
            gasLimit: 0,
            gasToken: "0x0000000000000000000000000000000000000000",
            signature: '',
            kid: null,
            skid: null,
            msgSent: '',
            payload: '',
            message: '',
            web3W: null, 
            transactionError: '',
            messagingError: '',
            submitting: false
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(() => {
            web3.shh.addSymKey(config.relaySymKey)
            .then((skid) => {
                this.setState({skid});

                const subsOptions = {
                    topic: [this.state.topic],
                    symKeyID: skid
                };

                EmbarkJS.Messages.listenTo(subsOptions, (error, message) => {
                    if(error){
                        console.error(error);
                    } else {
                        console.groupCollapsed("Message Sent");
                        console.log(message);
                        console.groupEnd();
                    }
                    this.setState({submitting: false});
                });

                EmbarkJS.Messages.listenTo({usePrivateKey: true}, (error, message) => {
                    if(error){
                        console.error(error);
                    } else {
                        this.setState({message: JSON.stringify(message.data, null, " ")});
                    }
                });
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
          payload: '',
          message: '',
          transactionError: ''
        });
  
        IdentityGasRelay.options.address = this.props.identityAddress;

        try {
            IdentityGasRelay.methods.callGasRelayHash(
                this.state.to,
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
  
        this.setState({
          message: '',
          messagingError: '',
          submitting: true
        });
  
        try {
            let jsonAbi = IdentityGasRelay._jsonInterface.filter(x => x.name == "callGasRelayed")[0];
            let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, [
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
                powTarget: 1, 
                powTime: 20, 
                topic: this.state.topic,
                symKeyID: this.state.skid,
                data: {
                    'address': this.props.identityAddress,
                    'encodedFunctionCall': funCall
                }
            };
            EmbarkJS.Messages.sendMessage(sendOptions);
            
        } catch(error){
            this.setState({messagingError: error.message, submitting: false});
        }
    }

    testContractDataSend = () => {
        let jsonAbi = TestContract._jsonInterface.filter(x => x.name == "test")[0];
        let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, []);
        this.setState({data: funCall, to: TestContract.options.address});
    }

    testContractDataCall = () => {
        TestContract.methods.val().call().then(value => this.setState({message: "TestContract.val(): " + value}));
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
                <Button size="small" onClick={this.testContractDataSend}>TestContract.methods.test().send()</Button>
                <Button size="small" onClick={this.testContractDataCall}>TestContract.methods.test().call()</Button>

            </CardActions>
        </Card>

        { this.state.messagingError && <MySnackbarContentWrapper variant="error" message={this.state.messagingError} /> }
        <Card className={classes.card}>
            <CardHeader title="2 Message" />
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
        <Card className={classes.card}>
                <CardContent>
                    <Typography>
                    Message Received: 
                    </Typography>
                    <pre>{this.state.message}</pre>
                </CardContent>
        </Card>
        </div>;
    }
}

CallGasRelayed.propTypes = {
    classes: PropTypes.object.isRequired,
    nonce: PropTypes.string.isRequired,
    identityAddress: PropTypes.string
};

const variantIcon = {
    error: ErrorIcon
};
  
const styles1 = theme => ({
error: {
    backgroundColor: theme.palette.error.dark
},
icon: {
    fontSize: 20
},
iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing.unit
},
message: {
    display: 'flex',
    alignItems: 'center'
}
});

function MySnackbarContent(props) {
    const {classes, className, message, variant, ...other} = props;
    const Icon = variantIcon[variant];
  
    return (
    <SnackbarContent
      className={classNames(classes[variant], className)}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={classNames(classes.icon, classes.iconVariant)} />
          {message}
        </span>
      }
      {...other}
    />
  );
}

MySnackbarContent.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  message: PropTypes.node,
  onClose: PropTypes.func,
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired
};

const MySnackbarContentWrapper = withStyles(styles1)(MySnackbarContent);

export default withStyles(styles)(CallGasRelayed);