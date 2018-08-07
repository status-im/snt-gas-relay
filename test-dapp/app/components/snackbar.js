import ErrorIcon from '@material-ui/icons/Error';
import PropTypes from 'prop-types';
import React from 'react';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import classNames from 'classnames';
import {withStyles} from '@material-ui/core/styles';

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

export default withStyles(styles1)(MySnackbarContent);
