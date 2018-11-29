pragma solidity ^0.5.0;


/**
 * @title DelegatedCall
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Abstract contract that delegates calls by `delegated` modifier to result of `targetDelegatedCall()`
 *      Important to avoid overwriting wrong storage pointers is that never define storage to this contract
 */
contract DelegatedCall {

    constructor() internal {

    }
    /**
     * @dev delegates the call of this function
     */
    modifier delegated {
        //require successfull delegate call to remote `_target()`
        bytes memory returned;
        bool success;
        (success, returned) = targetDelegatedCall().delegatecall(msg.data);
        require(success, "Call failed"); 
        assembly {
            return(add(returned, 0x20), returned) 
        }
        assert(false); //should never reach here
        _; //never will execute local logic
    }

    /**
     * @dev defines the address for delegation of calls
     */
    function targetDelegatedCall()
        internal
        view
        returns(address);

}
