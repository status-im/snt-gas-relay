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

    function createIdentity(
        bytes32 _ownerKey,
        address _recoveryContract
    ) external {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Already Initialized");
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
        purposeThreshold[uint256(Purpose.ActionKey)] = 1;
        _addKey(_ownerKey, Purpose.ManagementKey, 0, 0);
        _addKey(_ownerKey, Purpose.ActionKey, 0, 0);
        recoveryContract = _recoveryContract;
    }

    function createIdentity(   
        bytes32[] calldata _keys,
        Purpose[] calldata _purposes,
        uint256[] calldata _types,
        uint256 _managerThreshold,
        uint256 _actorThreshold,
        address _recoveryContract
    ) external {
        uint256 _salt = salt;
        uint len = _keys.length;
        require(len > 0, "Bad argument");
        require(purposeThreshold[uint256(Purpose.ManagementKey)] == 0, "Already Initialized");
        require(len == _purposes.length, "Wrong _purposes lenght");
        uint managersAdded = 0;
        for(uint i = 0; i < len; i++) {
            Purpose _purpose = _purposes[i];
            _addKey(_keys[i], _purpose, _types[i], _salt);
            if(_purpose == Purpose.ManagementKey) {
                managersAdded++;
            }
        }
        require(_managerThreshold <= managersAdded, "managers added is less then required");
        purposeThreshold[uint256(Purpose.ManagementKey)] = _managerThreshold;
        purposeThreshold[uint256(Purpose.ActionKey)] = _actorThreshold;
        recoveryContract = _recoveryContract;
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
        
        bytes32 keySaltedHash = keccak256(abi.encodePacked(_key, _salt)); //key storage pointer
        bytes32 saltedKeyPurposeHash = keccak256(abi.encodePacked(keySaltedHash, _purpose)); // accounts by purpose hash element index pointer

        require(!isKeyPurpose[saltedKeyPurposeHash],"Bad call"); //cannot add a key already added
        isKeyPurpose[saltedKeyPurposeHash] = true; //set authorization
        uint256 keyElementIndex = keysByPurpose[saltedKeyPurposeHash].push(_key) - 1; //add key to list by purpose 
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
