pragma solidity >=0.5.0 <0.6.0;

import "../deploy/ExtendableStorage.sol";
import "../common/Account.sol";
import "./ERC725.sol";
import "./ERC735.sol";

/**
 * @title IdentityAbstract
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract IdentityAbstract is ExtendableStorage, Account, ERC725, ERC735 {
    
    struct Transaction {
        uint256 approverCount;
        address to;
        uint256 value;
        bytes data;
        mapping(bytes32 => bool) approvals;
    }

    address public recoveryContract;
    uint256 salt;

    mapping (bytes32 => uint256) indexes;

    mapping (bytes32 => Key) keys;
    mapping (bytes32 => bool) isKeyPurpose;
    mapping (bytes32 => bytes32[]) keysByPurpose;

    mapping (uint256 => Transaction) pendingTx;
    mapping (uint256 => uint256) purposeThreshold;

    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) claimsByType;
    
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

    constructor() internal {}
    
    function _requestExecute(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes memory _data
    ) 
        internal 
        returns (uint256 txId)
    {
        Purpose requiredPurpose = _to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey;
        require(_keyHasPurpose(_key, requiredPurpose), "Unauthorized");
        if (purposeThreshold[uint256(requiredPurpose)] == 1) {
            txId = _execute(_to, _value, _data);
        } else {
            txId = _requestApproval(_key, _to, _value, _data);
        } 
    }

    function _requestApproval(
        bytes32 _key,
        address _to,
        uint256 _value,
        bytes memory _data
    )
        internal 
        returns (uint256 txId)
    {
        txId = nonce++;
        
        pendingTx[txId] = Transaction({
            approverCount: _key == 0 ? 0 : 1,
            to: _to,
            value: _value,
            data: _data
        });
        
        if (_key != 0) {
            pendingTx[txId].approvals[_key] = true;
        }

        emit ExecutionRequested(txId, _to, _value, _data);
    }

    function _keyHasPurpose(bytes32 _key, Purpose _purpose) 
        internal
        view 
        returns (bool exists) 
    {
        return isKeyPurpose[keccak256(abi.encodePacked(keccak256(abi.encodePacked(_key, salt)), _purpose))];
    }
   
}

