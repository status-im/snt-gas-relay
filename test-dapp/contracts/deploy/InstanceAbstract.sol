pragma solidity >=0.5.0 <0.6.0;

/**
 * @title InstanceAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Instance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceAbstract should be always the first contract at heritance.
 */
contract InstanceAbstract {    
    // protected zone start (InstanceAbstract vars)
    InstanceAbstract public base;
    // protected zone end
    constructor() internal { }
}