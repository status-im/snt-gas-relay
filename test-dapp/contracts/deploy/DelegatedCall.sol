pragma solidity >=0.5.0 <0.6.0;


/**
 * @title DelegatedCall
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Encapsulates delegatecall related logic.
 */
contract DelegatedCall {

    constructor(address _init, bytes memory _initMsg) internal {
        if(_init == address(0)) return;
        bool success;
        (success, ) = _init.delegatecall(_initMsg);
        require(success, "Delegated Construct fail");
    }
    /**
     * @dev delegates the call of this function
     */
    modifier delegated(address target) {
        //require successfull delegate call to remote `_target()`
        bytes memory returned;
        bool success;
        (success, returned) = target.delegatecall(msg.data);
        require(success, "Delegated Call failed"); 
        assembly {
            return(add(returned, 0x20), returned) 
        }
        assert(false); //should never reach here
        _; //never will execute local logic
    }

}
