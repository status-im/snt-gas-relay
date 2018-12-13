pragma solidity >=0.5.0 <0.6.0;

import "./IdentityAbstract.sol";

/**
 * @title IdentityBase
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
contract IdentityBase is IdentityAbstract {
    
    /**
     * @notice requires called by identity itself, otherwise forward to execute process
     */
    modifier managementOnly {
        if(msg.sender == address(this)) {
            _;
        } else {
            _requestExecute(keccak256(abi.encodePacked(msg.sender)), address(this), 0, msg.data);
        }
    }

    /**
     * @notice requires called by recovery address
     */
    modifier recoveryOnly {
        require(
            recoveryContract != address(0) && 
            msg.sender == recoveryContract,
            "Unauthorized"
        );
        _;
    }

    /**
     * @notice default function allows deposit of ETH
     */
    function () 
        external 
        payable 
    {
        require(purposeThreshold[uint256(Purpose.ManagementKey)] > 0, "Unauthorized");
    }

    ////////////////
    // Execute calls and multisig approval
    ////////////////

    /**
     * @notice execute (or request) call
     * @param _to destination of call
     * @param _value amount of ETH in call
     * @param _data data
     */
    function execute(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) 
        external 
        returns (uint256 txId)
    {
        txId = _requestExecute(keccak256(abi.encodePacked(msg.sender)), _to, _value, _data);   
    }

    /**
     * @notice approve a multisigned execution
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     */
    function approve(uint256 _txId, bool _approval) 
        external 
        returns (bool success)
    {   
        return _approveRequest(keccak256(abi.encodePacked(msg.sender)), _txId, _approval);
    }
    
    ////////////////
    // Management functions 
    ////////////////

    /**
     * @notice Adds a _key to the identity. The `_purpose`  
     * @param _key key hash being added
     * @param _purpose specifies the purpose of key.
     * @param _type inform type of key 
     */
    function addKey(
        bytes32 _key,
        Purpose _purpose,
        uint256 _type
    )
        external
        managementOnly
        returns (bool success)
    {   
        _addKey(_key, _purpose, _type, salt);
        return true;
    }

    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     */
    function replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType
    )
        external
        managementOnly
        returns (bool success)
    {   
        return _replaceKey(_oldKey, _newKey, _newType, salt);
    } 

    /**
     * @notice Removes `_purpose` of `_key`
     * @param _key key to remove
     * @param _purpose purpose to remove
     */
    function removeKey(
        bytes32 _key,
        Purpose _purpose
    )
        external
        managementOnly
        returns (bool success)
    {
        _removeKey(_key, _purpose, salt);
        return true;
    }

    /**
     * @notice Defines minimum approval required by key type
     * @param _purpose select purpose
     * @param _minimumApprovals select how much signatures needed
     */
    function setMinimumApprovalsByKeyType(
        Purpose _purpose,
        uint256 _minimumApprovals
    ) 
        external 
        managementOnly
    {
        require(_minimumApprovals > 0,"Invalid argument");
        require(_minimumApprovals <= keysByPurpose[keccak256(abi.encodePacked(_purpose, salt))].length, "Invalid argument");
        purposeThreshold[uint256(_purpose)] = _minimumApprovals;
    }
    
    /**
     * @notice Defines recovery address. This is one time only action.
     * @param _recoveryContract address of recovery contract
     */
    function setupRecovery(address _recoveryContract) 
        external
        managementOnly
    {
        require(recoveryContract == address(0), "Unauthorized");
        recoveryContract = _recoveryContract;
    }

        
    function setExtension(
        bytes4 _sig, 
        IdentityAbstract _extension
    ) 
        external
        managementOnly
    {
        extensions[_sig] = _extension;
    }
    
    
    ////////////////
    // Claim related
    ////////////////

    function addClaim(
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes calldata _signature,
        bytes calldata _data,
        string calldata _uri
    ) 
        external 
        returns (bytes32 claimHash)
    {
        claimHash = keccak256(abi.encodePacked(_issuer, _topic));
        if (msg.sender == address(this)) {
            if (claims[claimHash].topic > 0) {
                _modifyClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            } else {
                _includeClaim(claimHash, _topic, _scheme, _issuer, _signature, _data, _uri);
            }
        } else {
            require(_keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), Purpose.ClaimSignerKey), "Bad key");
            _requestApproval(0, address(this), 0, msg.data);
            emit ClaimRequested(
                claimHash,
                _topic,
                _scheme,
                _issuer,
                _signature,
                _data,
                _uri
            );
        }
    }

    function removeClaim(bytes32 _claimId) 
        external 
        returns (bool success) 
    {
        Claim memory c = claims[_claimId];
        
        require(
            msg.sender == c.issuer ||
            msg.sender == address(this),
            "Unauthorized");
        
        // MUST only be done by the issuer of the claim, or KEYS OF PURPOSE 1, or the identity itself.
        // TODO If its the identity itself, the approval process will determine its approval.
        
        uint256 claimIdTopicPos = indexes[_claimId];
        delete indexes[_claimId];
        bytes32[] storage claimsTopicArr = claimsByType[c.topic];
        bytes32 replacer = claimsTopicArr[claimsTopicArr.length - 1];
        claimsTopicArr[claimIdTopicPos] = replacer;
        indexes[replacer] = claimIdTopicPos;
        delete claims[_claimId];
        claimsTopicArr.length--;
        emit ClaimRemoved(_claimId, c.topic, c.scheme, c.issuer, c.signature, c.data, c.uri);
        return true;
    }

    ////////////////
    // Recovery methods
    ////////////////

    /** 
     * @notice Increase salt for hashing storage pointer of keys and add `_recoveryNewKey` 
     * @param _recoveryNewKey new key being defined
     */
    function recoveryReset(bytes32 _recoveryNewKey) 
        external 
        recoveryOnly
    {
        salt++;
        _addKey(_recoveryNewKey, Purpose.ManagementKey, 0, salt);
        _addKey(_recoveryNewKey, Purpose.ActionKey, 0, salt);
        purposeThreshold[uint256(Purpose.ManagementKey)] = 1;
    }
    
    ////////////////
    // Public Views
    ////////////////

    function getKey(
        bytes32 _key
    ) 
        external 
        view 
        returns(Purpose[] memory purposes, uint256 keyType, bytes32 key) 
    {
        Key storage myKey = keys[keccak256(abi.encodePacked(_key, salt))];
        return (myKey.purposes, myKey.keyType, myKey.key);
    }
    
    function keyHasPurpose(bytes32 _key, Purpose _purpose) 
        external
        view 
        returns (bool exists) 
    {
        return _keyHasPurpose(_key, _purpose);
    }

    function getKeyPurpose(bytes32 _key)
        external 
        view 
        returns(Purpose[] memory purpose)
    {
        return keys[keccak256(abi.encodePacked(_key, salt))].purposes;
    }
    
    function getKeysByPurpose(Purpose _purpose)
        external
        view
        returns(bytes32[] memory)
    {
        return keysByPurpose[keccak256(abi.encodePacked(_purpose, salt))];
    }
    
    function getClaim(bytes32 _claimId)
        external
        view 
        returns(
            uint256 topic,
            uint256 scheme,
            address issuer,
            bytes memory signature,
            bytes memory data,
            string memory uri
            ) 
    {
        Claim memory _claim = claims[_claimId];
        return (_claim.topic, _claim.scheme, _claim.issuer, _claim.signature, _claim.data, _claim.uri);
    }
    
    function getClaimIdsByTopic(uint256 _topic)
        external
        view
        returns(bytes32[] memory claimIds)
    {
        return claimsByType[_topic];
    }

    ////////////////
    // Private methods
    ////////////////

    function _approveRequest(
        bytes32 _key,
        uint256 _txId,
        bool _approval
    ) 
        private 
        returns(bool success) //(?) should return approved instead of success?
    {
        
        Transaction memory approvedTx = pendingTx[_txId];
        require(approvedTx.approverCount > 0 || approvedTx.to == address(this), "Unknown trasaction");
        Purpose requiredKeyPurpose = approvedTx.to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey;
        require(_keyHasPurpose(_key, requiredKeyPurpose), "Unauthorized");
        require(pendingTx[_txId].approvals[_key] != _approval, "Bad call");
        
        if (_approval) {
            if (approvedTx.approverCount + 1 == purposeThreshold[uint256(requiredKeyPurpose)]) {
                delete pendingTx[_txId];
                emit Approved(_txId, _approval);
                _execute(approvedTx.to, approvedTx.value, approvedTx.data);
            } else {
                pendingTx[_txId].approvals[_key] = true;
                pendingTx[_txId].approverCount++;
            }
        } else {
            delete pendingTx[_txId].approvals[_key];
            if (pendingTx[_txId].approverCount == 1) {
                delete pendingTx[_txId];
                emit Approved(_txId, _approval);
            } else {
                pendingTx[_txId].approverCount--;
            }
        }
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
    
    function _removeKey(
        bytes32 _key,
        Purpose _purpose,
        uint256 _salt
    )
        private 
    {
        bytes32 keySaltedHash = keccak256(abi.encodePacked(_key, _salt)); // key storage pointer
        _removeKeyFromPurposes(keySaltedHash, _purpose, _salt);
        //remove key purposes array purpose element
        Key storage myKey = keys[keySaltedHash]; //load Key storage pointer
        uint256 _type = myKey.keyType; //save type for case key deleted
        uint256 replacerPurposeIndex = myKey.purposes.length; //load amount of purposes
        bytes32 keyPurposeSaltedHash = keccak256(abi.encodePacked(_key, _purpose, _salt)); //account purpose array element index
        uint256 removedPurposeIndex = indexes[keyPurposeSaltedHash]; //read old index
        delete indexes[keyPurposeSaltedHash]; //delete key's purpose index
        if (replacerPurposeIndex > 1) { //is not the last key
            replacerPurposeIndex--; //move to last element pos
            if(removedPurposeIndex != replacerPurposeIndex) { //removed element is not last element
                Purpose replacerPurpose = myKey.purposes[replacerPurposeIndex]; //take last element
                myKey.purposes[removedPurposeIndex] = replacerPurpose; //replace removed element with replacer element
                indexes[keccak256(abi.encodePacked(_key, replacerPurpose, _salt))] = removedPurposeIndex; //update index
            }
            myKey.purposes.length--; //remove last element
        } else { //is the last purpose
            delete keys[keySaltedHash]; //drop this Key 
        }
        
        emit KeyRemoved(_key, _purpose, _type);
    }

    function _removeKeyFromPurposes(
        bytes32 keySaltedHash,
        Purpose _purpose,
        uint256 _salt
    ) private {
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt)); // salted accounts by purpose array index pointer   
        // forbidden to remove last management key
        if (_purpose == Purpose.ManagementKey) {
            require(purposeThreshold[uint256(Purpose.ManagementKey)] <= keysByPurpose[purposeSaltedHash].length-1, "Bad call");
        }

        bytes32 saltedKeyPurposeHash = keccak256(abi.encodePacked(keySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        require(isKeyPurpose[saltedKeyPurposeHash], "Unknown key"); //not possible to remove what not exists
        delete isKeyPurpose[saltedKeyPurposeHash]; //remove authorization

        // remove keys by purpose array key element
        uint256 removedKeyIndex = indexes[saltedKeyPurposeHash]; // read old key element index
        delete indexes[saltedKeyPurposeHash]; // delete key index
        
        uint256 replacerKeyIndex = keysByPurpose[purposeSaltedHash].length - 1; // replacer is last element
        if (removedKeyIndex != replacerKeyIndex) {  // deleted not the last element, replace deleted by last element
            bytes32 replacerKey = keysByPurpose[purposeSaltedHash][replacerKeyIndex]; // get replacer key 
            keysByPurpose[purposeSaltedHash][removedKeyIndex] = replacerKey; // overwrite removed index by replacer
            indexes[keccak256(abi.encodePacked(keccak256(abi.encodePacked(replacerKey, _salt)), _purpose))] = removedKeyIndex; // update saltedKeyPurposeHash index of replacer
        }
        keysByPurpose[purposeSaltedHash].length--; // remove last element
    }
    
    /**
     * @notice Replaces one `_oldKey` with other `_newKey`
     * @param _oldKey key to remove
     * @param _newKey key to add
     * @param _newType inform type of `_newKey`
     * @param _salt current salt
     */
    function _replaceKey(
        bytes32 _oldKey,
        bytes32 _newKey,
        uint256 _newType,
        uint256 _salt
    )
        private
        returns (bool success)
    {   
        bytes32 newKeySaltedHash = keccak256(abi.encodePacked(_newKey, _salt)); // key storage pointer     
        if (_oldKey == _newKey) { //not replacing key, just keyType
            keys[newKeySaltedHash].keyType == _newType; 
            return true;
        }
        bytes32 oldKeySaltedHash = keccak256(abi.encodePacked(_oldKey, _salt)); // key storage pointer     
        Key memory oldKey = keys[oldKeySaltedHash];
        delete keys[oldKeySaltedHash];
        uint256 len = oldKey.purposes.length;
        for (uint i = 0; i < len; i++) {
            _replaceKeyPurpose(oldKeySaltedHash, oldKeySaltedHash, _oldKey, _newKey, oldKey.purposes[i], _salt);
        }
        keys[newKeySaltedHash] = Key(oldKey.purposes, _newType, _newKey); //add new key
        return true;
    } 

    function _replaceKeyPurpose(
        bytes32 newKeySaltedHash,
        bytes32 oldKeySaltedHash,
        bytes32 _oldKey,
        bytes32 _newKey,
        Purpose _purpose,
        uint256 _salt
    ) private
    {
        bytes32 purposeSaltedHash = keccak256(abi.encodePacked(_purpose, _salt)); // salted accounts by purpose array index pointer   
        bytes32 saltedOldKeyPurposeHash = keccak256(abi.encodePacked(oldKeySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        bytes32 saltedNewKeyPurposeHash = keccak256(abi.encodePacked(newKeySaltedHash, _purpose)); // accounts by purpose hash element index pointer
        bytes32 oldKeyPurposeSaltedHash = keccak256(abi.encodePacked(_oldKey, _purpose, _salt)); //account purpose array element index
        bytes32 newKeyPurposeSaltedHash = keccak256(abi.encodePacked(_newKey, _purpose, _salt)); //account purpose array element index

        delete isKeyPurpose[saltedOldKeyPurposeHash]; //clear oldKey auth
        isKeyPurpose[saltedNewKeyPurposeHash] = true; //set newKey auth
        
        uint256 replacedKeyElementIndex = indexes[saltedOldKeyPurposeHash];
        delete indexes[saltedOldKeyPurposeHash];
        keysByPurpose[purposeSaltedHash][replacedKeyElementIndex] = _newKey; //replace key at list by purpose
        indexes[saltedNewKeyPurposeHash] = replacedKeyElementIndex; // save index
        
        indexes[newKeyPurposeSaltedHash] = indexes[oldKeyPurposeSaltedHash]; //transfer key purposes list index
        delete indexes[oldKeyPurposeSaltedHash];
    }

    function _includeClaim(
        bytes32 _claimHash,
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    ) 
        private
    {
        claims[_claimHash] = Claim(
            {
            topic: _topic,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
            }
        );
        indexes[_claimHash] = claimsByType[_topic].length;
        claimsByType[_topic].push(_claimHash);
        emit ClaimAdded(
            _claimHash,
            _topic,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

    function _modifyClaim(
        bytes32 _claimHash,
        uint256 _topic,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    ) 
        private
    {
        require(msg.sender == _issuer, "Unauthorized");
        claims[_claimHash] = Claim({
            topic: _topic,
            scheme: _scheme,
            issuer: _issuer,
            signature: _signature,
            data: _data,
            uri: _uri
        });
        emit ClaimChanged(
            _claimHash,
            _topic,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );
    }

   
}

