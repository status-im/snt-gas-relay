pragma solidity ^0.5.0;

import "../deploy/Factory.sol";
import "../deploy/DelayedUpdatableInstance.sol";
import "./IdentityKernel.sol";


contract IdentityFactory is Factory {

    event IdentityCreated(address instance);

    constructor() 
        public
        Factory(address(new IdentityKernel())) 
    {
    }

    function createIdentity() 
        external 
        returns (address)
    {      
        
        bytes32[] memory initKeys = new bytes32[](2);
        uint256[] memory initPurposes = new uint256[](2);
        uint256[] memory initTypes = new uint256[](2);
        initKeys[0] = keccak256(abi.encodePacked(msg.sender));
        initKeys[1] = initKeys[0];
        initPurposes[0] = 1;
        initPurposes[1] = 2;
        initTypes[0] = 0;
        initTypes[1] = 0;
        return createIdentity(
            initKeys,
            initPurposes,
            initTypes,
            1,
            1,
            address(0)
            );
    }

    function createIdentity(   
        bytes32[] memory _keys,
        uint256[] memory _purposes,
        uint256[] memory _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) 
        public 
        returns (address payable)
    {
        IdentityKernel instance = IdentityKernel(address(uint160(address(new DelayedUpdatableInstance(address(latestKernel)))))); 
        instance.initIdentity(_keys,_purposes,_types,_managerThreshold,_actorThreshold,_recoveryContract);
        emit IdentityCreated(address(instance));
        return address(instance);
    }

}
