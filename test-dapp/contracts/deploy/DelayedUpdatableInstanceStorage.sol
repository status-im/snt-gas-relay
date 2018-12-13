pragma solidity >=0.5.0 <0.6.0;

/**
 * @title DelayedUpdatableInstanceStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with DelayedUpdatableInstance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceStorage should be always the first contract at heritance.
 */
contract DelayedUpdatableInstanceStorage {    
    // protected zone start (InstanceStorage vars)
    address public kernel;
    Update public update;
    
    struct Update {
        address kernel;
        uint256 activation;
    }
    // protected zone end

    constructor() internal { }
}