import React, {Component} from 'react';
import AddIcon from '@material-ui/icons/Add';
import BalanceIcon from '@material-ui/icons/AccountBalance';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import EmbarkJS from 'Embark/EmbarkJS';
import KeyIcon from '@material-ui/icons/VpnKey';
import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';
import RefreshIcon from '@material-ui/icons/Refresh';
import STT from 'Embark/contracts/STT';
import Typography from '@material-ui/core/Typography';
import config from '../config';
import web3 from 'Embark/web3';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
    button: {
        marginRight: theme.spacing.unit * 2
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
        top: theme.spacing.unit * 2,
        right: theme.spacing.unit * 2
    }
  });

class Status extends Component {

    constructor(props){
        super(props);
        this.state = {
            'identityEthBalance': 0,
            'identitySTTBalance': 0,
            'relayerAddress': null,
            'relayerEthBalance': 0,
            'relayerSTTBalance': 0,
            'block': 0,
            'submitState': {
                'etherSend': false,
                'createIdentity': false,
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

            this.updateBalances();
            web3.eth.subscribe('newBlockHeaders')
                .on("data", (blockHeader) => {
                    if(blockHeader.number){
                        this.setState({block: blockHeader.number});
                        this.updateBalances();
                    }
                });
        });
    }
    
    updateBalances = () => {
        if(this.props.identityAddress){
            web3.eth.getBalance(this.props.identityAddress)
            .then(identityEthBalance => { 
                this.setState({identityEthBalance});
            });

            STT.methods.balanceOf(this.props.identityAddress)
            .call()
            .then(identitySTTBalance => {
                this.setState({identitySTTBalance: web3.utils.fromWei(identitySTTBalance, 'ether')});
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

        let toSend = STT.methods.generateTokens(this.props.identityAddress, web3.utils.toWei(5000, 'ether'));
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

    createIdentity = (event) => {
        event.preventDefault();

        let submitState = this.state.submitState;
        submitState.createIdentity = true;
        this.setState({submitState});

        this.props.identityCreationFunction(() => {
            submitState = this.state.submitState;
            submitState.createIdentity = false;
            this.setState({submitState});
        });
    }

    sendEther = (event) => {
        event.preventDefault();

        let submitState = this.state.submitState;
        submitState.etherSend = true;
        this.setState({submitState});

        web3.eth.sendTransaction({from: web3.eth.defaultAccount, to: this.state.relayerAddress, value: web3.utils.toWei(1, "ether")})
            .then((receipt) => {
                console.log(receipt);
                submitState = this.state.submitState;
                submitState.etherSend = false;
                this.setState({submitState});
            });
    }

    render(){
        const {classes, identityAddress} = this.props;
        const {identityEthBalance, relayerAddress, relayerEthBalance, identitySTTBalance, relayerSTTBalance, submitState, block} = this.state;

        return <div className={classes.container}>
            { (submitState.createIdentity || submitState.etherSend || submitState.generateSTT) && <LinearProgress /> }
            <List dense={true}>
                <ListItem>
                    <Typography variant="display1">
                        Identity
                    </Typography>
                    <Button className={classes.button} color="primary" aria-label="New Identity" onClick={this.createIdentity} disabled={submitState.createIdentity}>
                        <RefreshIcon className={classes.icon} />
                        Create new identity
                    </Button>
                    {
                    <Button className={classes.button} color="primary" aria-label="Generate STT" onClick={this.generateSTT} disabled={submitState.generateSTT}>
                        <AddIcon className={classes.icon} />
                        Generate 5K STT (only on dev)
                    </Button> 
                    }
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={identityAddress}
                    secondary="Address"
                    />
                </ListItem>
                <ListItem className={classes.root}>
                    <ListItemIcon>
                        <BalanceIcon />
                    </ListItemIcon>
                    <ListItemText
                    primary={identityEthBalance}
                    secondary="ETH Balance  (wei)"
                    />
                    <ListItemText
                    primary={identitySTTBalance}
                    secondary="STT Balance"
                    />
                </ListItem>
            </List>

            <List dense={true}>
                <ListItem>
                    <Typography variant="display1">
                        Miner
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
        </div>;
    }

}

Status.propTypes = {
    classes: PropTypes.object.isRequired,
    identityAddress: PropTypes.string,
    identityCreationFunction: PropTypes.func.isRequired
};
  
export default withStyles(styles)(Status);
