import React, {Component} from 'react';
import StatusGasRelayer, {Contracts} from '../status-gas-relayer';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import MySnackbarContentWrapper from './snackbar';
import PropTypes from 'prop-types';
import StatusRoot from 'Embark/contracts/StatusRoot';
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

class Execute extends Component {

    constructor(props){
        super(props);
        this.state = {
            topic: '0x546f6b65',
            account: '',
            allowedContract: '0x0000000000000000000000000000000000000000',
            data: '0x00',
            gasPrice: 0,
            gasLimit: 0,
            signature: '',
            kid: null,
            skid: null,
            msgSent: '',
            payload: '',
            message: '',
            relayer: '',
            web3js: null, 
            transactionError: '',
            messagingError: '',
            submitting: false
        };
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
  
        this.setState({account: web3.eth.defaultAccount});

        this.setState({
          msgSent: false,
          transactionError: ''
        });
  
        try {
            const accounts = await web3.eth.getAccounts();
            
            const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address,web3.eth.defaultAccount)
                                          .execute(this.state.allowedContract, this.state.data)
                                          .setGas(MiniMeToken.options.address, this.state.gasPrice, this.state.gasLimit);
                                          
            const signature = await s.sign(web3);

            this.setState({signature});
        } catch(error){
            this.setState({transactionError: error.message});
        }
    }

    testContractDataSend = () => {
        let jsonAbi = TestContract._jsonInterface.filter(x => x.name == "test")[0];
        let funCall = web3.eth.abi.encodeFunctionCall(jsonAbi, []);
        this.setState({data: funCall, allowedContract: TestContract.options.address});
    }

    testContractDataCall = () => {
        TestContract.methods.val().call().then(value => console.log({message: "TestContract.val(): " + value}));
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
            const s = new StatusGasRelayer.AvailableRelayers(Contracts.TokenGasRelay, StatusRoot.options.address, this.state.account)
                                          .setRelayersSymKeyID(skid)
                                          .setAsymmetricKeyID(kid)
                                          .setGas(MiniMeToken.options.address, this.state.gasPrice);
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
            const s = new StatusGasRelayer.TokenGasRelay(StatusRoot.options.address, this.state.account)
                                          .execute(this.state.allowedContract, this.state.data)
                                          .setGas(MiniMeToken.options.address, this.state.gasPrice, this.state.gasLimit)
                                          .setRelayer(relayer)
                                          .setAsymmetricKeyID(kid);

            await s.post(this.state.signature, web3);

            this.setState({submitting: false});
            console.log("Message sent");

        } catch(error){
            this.setState({messagingError: error.message, submitting: false});
        }
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
                <b>This functionality is used for simple wallets executing transactions and paying fees in TokenGasRelay</b>
            </CardContent>
        </Card>
        { this.state.transactionError && <MySnackbarContentWrapper variant="error" message={this.state.transactionError} /> }
        <Card className={classes.card}>
            <CardHeader title="1. Transaction Data" />
            <CardContent>
                <form noValidate autoComplete="off">
                <Grid container spacing={24}>
                    <Grid item xs={6}>
                        <TextField
                            id="allowedContract"
                            label="Contract"
                            value={this.state.allowedContract}
                            onChange={this.handleChange('allowedContract')}
                            margin="normal"
                            fullWidth
                            />
                    </Grid>
                    <Grid item xs={6}>
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

Execute.propTypes = {
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

export default withStyles(styles)(Execute);
