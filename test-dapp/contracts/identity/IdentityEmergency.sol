pragma solidity >=0.5.0 <0.6.0;

import "./IdentityAbstract.sol";
import "../status/LibraryCuration.sol";

/**
 * @title Identity Emergency Base
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
contract IdentityEmergency is IdentityAbstract {
    
    function execute(address, uint256, bytes calldata) external returns (uint256) {}
    function addKey(bytes32, Purpose, uint256) external returns (bool) {}
    function removeKey(bytes32, Purpose) external returns (bool) {}
    function addClaim(uint256,uint256,address,bytes calldata,bytes calldata,string calldata) external returns (bytes32) {}
    function removeClaim(bytes32) external returns (bool) {}

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

    function installBase(
        IdentityAbstract _newBase,
        bytes calldata _installMsg
    ) 
        external
        managementOnly
    {
        require(getLibraryCuration().isUpgradable(address(base),address(_newBase)));
        bool success;
        (success, ) = address(_newBase).delegatecall(_installMsg);
    }

    function getLibraryCuration() public view returns(LibraryCuration c) {

        address check = address(1);
        if (getCodeSize(check)>0){ //mainnet
            return LibraryCuration(check);
        }
        check = address(2);
        if (getCodeSize(check)>0){ //ropsten
            return LibraryCuration(check);
        }
        check = address(3);
        if (getCodeSize(check)>0){ //rinkeby
            return LibraryCuration(check);
        }
        check = address(4);
        if (getCodeSize(check)>0){ //kovan
            return LibraryCuration(check);
        }
        revert("library curation not found");
    }

    
    function getCodeSize(address _addr) internal view returns(uint _size) {
        assembly {
            _size := extcodesize(_addr)
        }   
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
                success = true;
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

   
}

