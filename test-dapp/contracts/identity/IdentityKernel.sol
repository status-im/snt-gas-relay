pragma solidity ^0.5.0;

import "../deploy/DelayedUpdatableInstanceStorage.sol";
import "../gasrelay/IdentityGasChannel.sol";

contract IdentityKernel is DelayedUpdatableInstanceStorage, IdentityGasChannel {

    constructor() 
        IdentityGasChannel(
            new bytes32[](0),
            new uint256[](0),
            new uint256[](0),
            0,
            0,
            address(0)
        ) 
        public
    {

    }

    function initIdentity(   
        bytes32[] calldata _keys,
        uint256[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) external {
        _constructIdentity(
            _keys,
            _purposes,
            _types,
            _managerThreshold,
            _actorThreshold,
            _recoveryContract);
    }
}
