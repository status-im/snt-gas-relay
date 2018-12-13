pragma solidity >=0.5.0 <0.6.0;

/**
 * @title ExtendableStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Extendable.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      ExtendableStorage should be always the first contract at heritance.
 */
contract ExtendableStorage {    
    // protected zone start
    ExtendableStorage public base;
    mapping(bytes4 => ExtendableStorage) extensions;
    // protected zone end
    constructor() internal { }
}