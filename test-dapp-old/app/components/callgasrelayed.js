import React, {Component} from 'react';
import StatusGasRelayer, {Contracts, Functions} from '../status-gas-relayer';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import EmbarkJS from 'Embark/EmbarkJS';
import Grid from '@material-ui/core/Grid';
import MySnackbarContentWrapper from './snackbar';
import PropTypes from 'prop-types';
import MiniMeToken from 'Embark/contracts/MiniMeToken';
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
class CallGasRelayed extends Component {

    constructor(props){
        super(props);
        this.state = {
            topic: '0x47617352',
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
            web3js: null, 
            relayer: '',
            transactionError: '',
            messagingError: '',
            submitting: false
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(() => {
            this.setState({
                gasToken: MiniMeToken.options.address
            });
        });
    }

    handleChange = name => event => {
        if(name == 'relayer'){
            this.props.updateRelayer(event.target.value);
        }
        this.setState({
            [name]: event.target.value
        });
    };

    sign = async (event) => {
        if(event) event.preventDefault();
  
        this.setState({
          msgSent: false,
          transactionError: ''
        });
  
        try {

            const s = new StatusGasRelayer.GasRelay(this.props.identityAddress, web3.eth.defaultAccount)
                                          .setContractFunction(Functions.GasRelay.call)
                                          .setTransaction(this.state.to, this.state.value, this.state.data)
                                          .setGas(this.state.gasToken, this.state.gasPrice, this.state.gasLimit);
                                          
            const signature = await s.sign(web3);

            this.setState({signature});
        } catch(error){
            this.setState({transactionError: error.message});
        }
    }

    obtainRelayers = async event => {
        event.preventDefault();

        const {web3, kid, skid} = this.props;

        this.setState({
          messagingError: '',
          submitting: true
        });
        this.props.clearMessages();
        
        try {
            const s = new StatusGasRelayer.AvailableRelayers(Contracts.GasRelay, this.props.identityAddress, web3.eth.defaultAccount)
                                          .setRelayersSymKeyID(skid)
                                          .setAsymmetricKeyID(kid)
                                          .setGas(this.state.gasToken, this.state.gasPrice);
            await s.post(web3);
            
            console.log("Message sent");
            this.setState({submitting: false});

        } catch(error){
            this.setState({messagingError: error.message, submitting: false});
        }
    }

    sendTransaction = async event => {
        event.preventDefault();

        const {web3, kid} = this.props;

        let relayer = this.state.relayer;


        let relayers = [];
        for (var key in this.props.relayers) {      
            if (this.props.relayers.hasOwnProperty(key)) relayers.push(key);
        }

        if(relayer == '' && relayers.length >= 1){
            relayer = relayers[0];
        } 

        this.setState({
          messagingError: '',
          submitting: true
        });
        this.props.clearMessages();
        
        try {
            const s = new StatusGasRelayer.GasRelay(this.props.identityAddress, web3.eth.defaultAccount)
                                          .setContractFunction(Functions.GasRelay.call)
                                          .setTransaction(this.state.to, this.state.value, this.state.data)
                                          .setGas(this.state.gasToken, this.state.gasPrice, this.state.gasLimit)
                                          .setRelayer(relayer)
                                          .setAsymmetricKeyID(kid);

            await s.post(this.state.signature, web3);

            this.setState({submitting: false});
            console.log("Message sent");
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
        TestContract.methods.val().call().then(value => console.log({message: "TestContract.val(): " + value}));
    }

    render(){
        const {classes} = this.props;

        let relayers = [];
        for (var key in this.props.relayers) {      
            if (this.props.relayers.hasOwnProperty(key)) relayers.push(key);
        }

        return <div>
        <Card className={classes.card}>
            <CardContent>
                <b>This functionality is used when a GasRelay will invoke a contract function or transfer ether without paying fees </b>
            </CardContent>
        </Card>
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
                            <option key={MiniMeToken.options.address} value={MiniMeToken.options.address}>
                            {MiniMeToken.options.address} (MiniMeToken)
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
            <CardHeader title="2. Find Available Relayers" />
            <CardContent>   
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
                <Button size="small" color="primary" onClick={this.obtainRelayers} disabled={this.state.submitting}>
                    Send &quot;availability&quot; Message
                </Button>
            </CardActions>   
        </Card>


        <Card className={classes.card}>
            <CardHeader title="3. Generate Transaction" />
            <CardContent>  
                <TextField
                    id="relayer"
                    label="Relayer"
                    value={this.state.relayer}
                    onChange={this.handleChange('relayer')}
                    margin="normal"
                    fullWidth
                    select
                    SelectProps={{
                        native: true
                    }}
                    >
                    { relayers.length > 0 ? relayers.map((r, i) => <option key={i} value={r}>Relayer #{i+1}: {r}</option>) : <option></option> }
                </TextField>
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
            </CardContent>  
            <CardActions>
                <Button size="small" color="primary" onClick={this.sendTransaction} disabled={this.state.submitting}>
                    Send &quot;transaction&quot; Message
                </Button>
            </CardActions>   
        </Card>
        </div>;
    }
}

CallGasRelayed.propTypes = {
    classes: PropTypes.object.isRequired,
    nonce: PropTypes.string.isRequired,
    identityAddress: PropTypes.string,
    web3: PropTypes.object,
    kid: PropTypes.string,
    skid: PropTypes.string,
    clearMessages: PropTypes.func,
    updateRelayer: PropTypes.func,
    relayers: PropTypes.object.isRequired
};

export default withStyles(styles)(CallGasRelayed);
