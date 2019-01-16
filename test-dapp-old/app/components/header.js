import React, {Component} from 'react';
import AppBar from '@material-ui/core/AppBar';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import {Typography} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';


const styles = {
    root: {
      flexGrow: 1
    },
    flex: {
      flexGrow: 1
    },
    toolBarTyp: {
        color: '#fff'
    }
};

class Header extends Component {

  render(){
    const {classes} = this.props;
    return (
        <div className={classes.root} >
          <AppBar position="static">
            <Toolbar className={classes.toolBar}>
                <Typography className={classes.toolBarTyp}>Gas Relayer Demo</Typography>
            </Toolbar>
          </AppBar>
        </div>
    );
  }
}

Header.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Header);
