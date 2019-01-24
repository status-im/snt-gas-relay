pragma solidity >=0.5.0 <0.6.0;

import "../deploy/InstanceFactory.sol";
/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice creates Instance as Identity 
 */
contract IdentityFactory is InstanceFactory {

    constructor(InstanceAbstract _base, InstanceAbstract _init, InstanceAbstract _emergency) 
        InstanceFactory(_base, _init, _emergency)
        public
    { }
    
    function createIdentity() 
        external 
        returns (InstanceAbstract instance)
    {
        instance = newInstance(
            base,
            prototypes[address(base)].init,
            abi.encodeWithSignature(
                "createIdentity(bytes32)",
                keccak256(abi.encodePacked(msg.sender))
            ),
            uint256(msg.sender)
        );
        
        emit InstanceCreated(instance);
    }

    /** @dev should be the same method signature of `init` function */
    function createIdentity(
        bytes32
    ) 
        external 
        returns (InstanceAbstract instance) 
    {
        instance = newInstance(base, prototypes[address(base)].init, msg.data, uint256(msg.sender));
        emit InstanceCreated(instance);
    }

    /** @dev should be the same method signature of `init` function */
    function createIdentity(   
        bytes32[] calldata,
        uint256[] calldata,
        uint256[] calldata,
        uint256,
        uint256
    ) 
        external 
        returns (InstanceAbstract instance)
    {
        instance = new Instance(base, prototypes[address(base)].init, msg.data);
        emit InstanceCreated(instance);
    }

}
