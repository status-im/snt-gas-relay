import React, {Component, Fragment} from 'react';
import AddIcon from '@material-ui/icons/Add';
import BalanceIcon from '@material-ui/icons/AccountBalance';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import EmbarkJS from 'Embark/EmbarkJS';
import KeyIcon from '@material-ui/icons/VpnKey';
import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import NumberIcon from '@material-ui/icons/ConfirmationNumber';
import PropTypes from 'prop-types';
import SNTController from 'Embark/contracts/SNTController';
import STT from 'Embark/contracts/STT';
import Typography from '@material-ui/core/Typography';
import config from '../config';
import web3 from 'Embark/web3';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
    button: {
        marginRight: theme.spacing.unit * 2
    },
    card: {
        marginBottom: theme.spacing.unit * 2
    },
    icon: {
        marginRight: theme.spacing.unit
    },
    container: {
        width: '100%',
        position: 'relative'
    },
    root: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: theme.palette.background.paper
      },
    right: {
        position: 'absolute',
        top: theme.spacing.unit * 4,
        right: theme.spacing.unit * 2
    }
  });

class Status extends Component {

    constructor(props){
        super(props);
        this.state = {
            'addressETHBalance': 0,
            'addressSTTBalance': 0,
            'relayerAddress': null,
            'relayerEthBalance': 0,
            'relayerSTTBalance': 0,
            'block': 0,
            'submitState': {
                'etherSend': false,
                'generateSTT': false
            }
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(err => {
            if(err) {
                console.error(err);
                return;
            }

            this.setState({
                relayerAddress: config.relayAccount
            });

            this.getBlock();
        });
    }

    getBlock = () => {
        web3.eth.subscribe('newBlockHeaders')
        .on('data', (block) => {
            this.setState({block: block.number});
            this.readChain();
            return true;
        });
    }
    
    readChain = () => {
        if(this.props.walletAddress){
            web3.eth.getBalance(this.props.walletAddress)
            .then(addressETHBalance => { 
                this.setState({addressETHBalance});
            });

            STT.methods.balanceOf(this.props.walletAddress)
            .call()
            .then(addressSTTBalance => {
                this.setState({addressSTTBalance: web3.utils.fromWei(addressSTTBalance, 'ether')});
            });

            web3.eth.getAccounts()
            .then(accounts => {
                SNTController.methods.signNonce(accounts[2])
                .call()
                .then((nonce) => {
                    this.props.nonceUpdateFunction(nonce);
                    return true;
                })
                .catch(() => { 
                    console.log("Address " + this.props.walletAddress + " is not a valid wallet");
                });
                return true;
            });
        }

        web3.eth.getBalance(this.state.relayerAddress)
        .then(relayerEthBalance => { 
            this.setState({relayerEthBalance});
        });

        STT.methods.balanceOf(this.state.relayerAddress)
        .call()
        .then(relayerSTTBalance => {
            this.setState({relayerSTTBalance: web3.utils.fromWei(relayerSTTBalance, 'ether')});
        });
    }

    generateSTT = (event) => {
        event.preventDefault();

        let submitState = this.state.submitState;
        submitState.generateSTT = true;
        this.setState({submitState});

        let toSend = STT.methods.generateTokens(this.props.walletAddress, web3.utils.toWei('5000', 'ether'));
        toSend.estimateGas()
        .then(estimatedGas => {
            return toSend.send({gas: estimatedGas + 10000});
        })
        .then((receipt) => {
            console.log(receipt);

            submitState = this.state.submitState;
            submitState.generateSTT = false;
            this.setState({submitState});
        });
    }

    changeSNTController = event => {
        event.preventDefault();
        const toSend = STT.methods.changeController(SNTController.options.address);

        toSend.estimateGas()
        .then(estimatedGas => {
            return toSend.send({gasLimit: estimatedGas + 100000});
        })
        .then(receipt => {
            console.log(receipt);
        });
    }

    sendEther = (event) => {
        event.preventDefault();

        let submitState = this.state.submitState;
        submitState.etherSend = false;
        this.setState({submitState});

        web3.eth.sendTransaction({from: web3.eth.defaultAccount, to: this.state.relayerAddress, value: web3.utils.toWei('1', "ether")})
            .then((receipt) => {
                console.log(receipt);
                submitState = this.state.submitState;
                submitState.etherSend = false;
                this.setState({submitState});
            });
    }

    render(){
        const {classes, walletAddress, nonce} = this.props;
        const {addressETHBalance, relayerAddress, relayerEthBalance, addressSTTBalance, relayerSTTBalance, submitState, block} = this.state;

        return <Fragment>
            <Card className={classes.card}>
                <CardContent>
                    <Typography>
                    Whisper Messages: 
                    </Typography>
                    <pre>{this.props.message}</pre>
                </CardContent>
            </Card>
            <div className={classes.container}>
            { (submitState.createIdentity || submitState.etherSend || submitState.generateSTT) && <LinearProgress /> }

            <List dense={true}>
                <ListItem>
                    <Typography variant="display1">
                        Address
                    </Typography>
                    <Button className={classes.button} color="primary" aria-label="Generate STT" onClick={this.generateSTT} disabled={submitState.generateSTT}>
                        <AddIcon className={classes.icon} />
                        1. Generate 5K STT (only on dev)
                    </Button> 
                    <Button className={classes.button} color="primary" aria-label="Generate STT" onClick={this.changeSNTController}>
                        <AddIcon className={classes.icon} />
                        2. Change SNT Controller
                    </Button> 
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={walletAddress}
                    secondary="Address"
                    />
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <NumberIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={nonce}
                    secondary="Nonce"
                    />
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <BalanceIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={addressETHBalance}
                    secondary="ETH Balance  (wei)"
                    />
                    <ListItemText
                    primary={addressSTTBalance}
                    secondary="STT Balance"
                    />
                </ListItem>
            </List>

            <List dense={true}>
                <ListItem>
                    <Typography variant="display1">
                        Relayer
                    </Typography>
                    <Button className={classes.button} color="primary" aria-label="Add ether" onClick={this.sendEther} disabled={submitState.etherSend}>
                        <AddIcon className={classes.icon} />
                        Send ether
                    </Button> 
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={relayerAddress}
                    secondary="Address"
                    />
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <BalanceIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={relayerEthBalance}
                    secondary="ETH Balance (wei)"
                    />
                    <ListItemText
                    primary={relayerSTTBalance}
                    secondary="STT Balance (wei)"
                    />
                </ListItem>
            </List>
            <div className={classes.right}>
                <CircularProgress />
                <Typography>
                Block<br />#{block}
                </Typography>
            </div>
        </div>
        </Fragment>;
    }

}

Status.propTypes = {
    classes: PropTypes.object.isRequired,
    walletAddress: PropTypes.string,
    nonce: PropTypes.string.isRequired,
    nonceUpdateFunction: PropTypes.func.isRequired,
    message: PropTypes.string
};
  
export default withStyles(styles)(Status);
