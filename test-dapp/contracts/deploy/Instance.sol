pragma solidity >=0.5.0 <0.6.0;

import "./InstanceStorage.sol";
import "./DelegatedCall.sol";

/**
 * @title Instance
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Contract that forward everything through delegatecall to defined base
 */
contract Instance is InstanceStorage, DelegatedCall {

    /**
     * @notice delegatecall `_init` with `_initMsg` and set base as `_base` 
     * @param _base base for delegatecall 
     * @param _init constructor contract 
     * @param _initMsg arguments to be passed for the single delegatecall on `_init` 
     */
    constructor(
        InstanceStorage _base,
        InstanceStorage _init,
        bytes memory _initMsg
    ) 
        public 
        DelegatedCall(address(_init), _initMsg)
    {
        base = _base;
    }

    /**
     * @dev delegatecall everything (but declared functions) to `_target()`
     * @notice Verify `base()` code to predict behavior
     */
    function () 
        external 
        payable 
        delegateAndReturn(address(base)) 
    { }

}