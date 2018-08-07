import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import web3 from 'Embark/web3';

class AccountBalance extends React.Component {

    constructor(props) {
        super(props);
  
        this.state = {
            eth: 0,
            rnd: 0
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(err => {
            if(!err) this.updateBalances();
        });
    }

    updateBalances(ev){
        if(ev) ev.preventDefault();

    }

    sendEther(ev){
        ev.preventDefault();

        web3.eth.sendTransaction({to: this.props.address, value: web3.utils.toWei('1', 'ether')})
                .then(() => {
                    this.updateBalances();
                    return true;
                });
    }

    generateTokens(ev){
        ev.preventDefault();

        this.props.RND.methods.generateTokens(this.props.address, web3.utils.toWei('500', 'ether'))
                              .send({gas: 1000000})
                              .then(() => {
                                  this.updateBalances();
                                  return true;
                              });
    }

    render(){
        const rnd = 1;
        const eth =2;

        return <div>
              <h3>{this.props.name}</h3>
              <small>{this.props.address}</small>
              <p><b>RDN</b><br /><small>{rnd}</small></p>
              <p><b>ETH</b><br /><small>{eth}</small></p>
              <a href="#" onClick={(ev) => this.updateBalances(ev)}>Update balances</a><br />
              <a href="#" onClick={(ev) => this.generateTokens(ev)}>Generate Tokens</a><br />
              <a href="#" onClick={(ev) => this.sendEther(ev)}>Send 1 Ether</a><br />

            </div>;
    }
}

export default AccountBalance;
