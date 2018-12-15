pragma solidity >=0.5.0 <0.6.0;

import "./IdentityExtension.sol";

/**
 * @title Initializer Extension
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev should be used only as constructor for Extendable contract 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
  
contract IdentityInit is IdentityExtension {
    
    constructor() 
        public
    {
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
    }
    
    function () external {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Already Initialized");
        bytes32 _ownerKey = keccak256(abi.encodePacked(msg.sender));
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
        purposeThreshold[uint256(Purpose.ActionKey)] = 1;
        _addKey(_ownerKey, Purpose.ManagementKey, 0, 0);
        _addKey(_ownerKey, Purpose.ActionKey, 0, 0);
    }
    
    function createIdentity(
        bytes32 _ownerKey
    ) 
        external 
        returns (IdentityAbstract)
    {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Already Initialized");
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
        purposeThreshold[uint256(Purpose.ActionKey)] = 1;
        _addKey(_ownerKey, Purpose.ManagementKey, 0, 0);
        _addKey(_ownerKey, Purpose.ActionKey, 0, 0);
    }

    function createIdentity(   
        bytes32[] calldata _keys,
        Purpose[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold
    ) 
        external 
        returns (IdentityAbstract)
    {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Already Initialized");
        uint len = _keys.length;
        require(len > 0, "Bad argument");
        require(len == _purposes.length, "Wrong purposes lenght");
        require(len == _types.length, "Wrong types lenght");
        uint256 _salt = salt;
        uint managersAdded = 0;
        for(uint i = 0; i < len; i++) {
            Purpose _purpose = _purposes[i];
            _addKey(_keys[i], _purpose, _types[i], _salt);
            if(_purpose == Purpose.ManagementKey) {
                managersAdded++;
            }
        }
        require(_managerThreshold <= managersAdded, "Managers added is less then required");
        purposeThreshold[uint256(Purpose.ManagementKey)] = _managerThreshold;
        purposeThreshold[uint256(Purpose.ActionKey)] = _actorThreshold;
    }

    function _addKey(
        bytes32 _key,
        Purpose _purpose,
        uint256 _type,
        uint256 _salt
    ) 
        private
    {
        
        require(_key != 0, "Bad argument");
        require(_purpose != Purpose.DisabledKey, "Bad argument");
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt));
        bytes32 keySaltedHash = keccak256(abi.encodePacked(_key, _salt)); //key storage pointer
        bytes32 saltedKeyPurposeHash = keccak256(abi.encodePacked(keySaltedHash, _purpose)); // accounts by purpose hash element index pointer

        require(!isKeyPurpose[saltedKeyPurposeHash],"Bad call"); //cannot add a key already added
        isKeyPurpose[saltedKeyPurposeHash] = true; //set authorization
        uint256 keyElementIndex = keysByPurpose[purposeSaltedHash].push(_key) - 1; //add key to list by purpose 
        indexes[saltedKeyPurposeHash] = keyElementIndex; //save index of key in list by purpose
        if (keys[keySaltedHash].key == 0) { //is a new key
            Purpose[] memory purposes = new Purpose[](1);  //create new array with first purpose
            purposes[0] = _purpose;
            keys[keySaltedHash] = Key(purposes,_type,_key); //add new key
        } else {
            uint256 addedPurposeElementIndex = keys[keySaltedHash].purposes.push(_purpose) - 1; //add purpose to key
            bytes32 keyPurposeSaltedHash = keccak256(abi.encodePacked(_key, _purpose, _salt)); //index of purpose in key pointer
            indexes[keyPurposeSaltedHash] = addedPurposeElementIndex; //save index
        }
        
        emit KeyAdded(_key, _purpose, _type);
    }
}
