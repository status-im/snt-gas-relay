pragma solidity >=0.5.0 <0.6.0;

import "../deploy/Instance.sol";
import "./IdentityBase.sol";
import "./IdentityInit.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice creates Instance as Identity 
 */
contract IdentityFactory {
    IdentityBase public base;
    IdentityInit public init;

    event IdentityCreated(IdentityBase instance);

    constructor() 
        public
    {
        base = new IdentityBase();
        init = new IdentityInit();
    }

    /** @dev should be the same method signature of `init` function */
    function createIdentity() 
        external 
        returns (IdentityBase instance)
    {
        instance = IdentityBase(address(new Instance(base, init, msg.data)));
        emit IdentityCreated(instance);
    }

    /** @dev should be the same method signature of `init` function */
    function createIdentity(
        bytes32 _owner
    ) 
        external 
        returns (IdentityBase instance)
    {
        instance = IdentityBase(address(new Instance(base, init, msg.data)));
        emit IdentityCreated(instance);
    }

    /** @dev should be the same method signature of `init` function */
    function createIdentity(   
        bytes32[] calldata _keys,
        uint256[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold
    ) 
        external 
        returns (IdentityBase instance)
    {
        instance = IdentityBase(address(new Instance(base, init, msg.data)));
        emit IdentityCreated(instance);
    }

}
