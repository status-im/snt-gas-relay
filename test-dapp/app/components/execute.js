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
import SNTController from 'Embark/contracts/SNTController';
import STT from 'Embark/contracts/STT';
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
            topic: '0x534e5443',
            allowedContract: '0x0000000000000000000000000000000000000000',
            data: '0x00',
            gasPrice: 0,
            gasMinimal: 0,
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
            const accounts = await web3.eth.getAccounts();
            
            const s = new StatusGasRelayer.SNTController(SNTController.options.address, accounts[2])
                                          .execute(this.state.allowedContract, this.state.data)
                                          .setGas(this.state.gasPrice, this.state.gasMinimal);
                                          
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
            const accounts = await web3.eth.getAccounts();

            const s = new StatusGasRelayer.AvailableRelayers(Contracts.SNT, SNTController.options.address, accounts[2])
                                          .setRelayersSymKeyID(skid)
                                          .setAsymmetricKeyID(kid)
                                          .setGas(STT.options.address, this.state.gasPrice);
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
        if(relayer == '' && this.props.relayers.length == 1){
            relayer = this.props.relayers[0];
        } 


        this.setState({
          messagingError: '',
          submitting: true
        });
        this.props.clearMessages();
        
        try {
            const accounts = await web3.eth.getAccounts();

            const s = new StatusGasRelayer.SNTController(SNTController.options.address, accounts[2])
                                          .execute(this.state.allowedContract, this.state.data)
                                          .setGas(this.state.gasPrice, this.state.gasMinimal)
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
        return <div>
        <Card className={classes.card}>
            <CardContent>
                <b>This functionality is used for simple wallets executing transactions and paying fees in SNT</b>
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
                            id="gasMinimal"
                            label="Gas Minimal"
                            value={this.state.gasMinimal}
                            onChange={this.handleChange('gasMinimal')}
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
                    {
                        this.props.relayers.length > 0 ?
                        this.props.relayers.map((r, i) => <option key={i} value={r}>Relayer #{i+1}: {r}</option>)
                        :
                        <option></option>
                    }
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
    relayers: PropTypes.array.isRequired
};

export default withStyles(styles)(Execute);
