pragma solidity ^0.5.0;

/**
 * @title GasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice abstract gas abstraction
 */
contract GasRelay {
    
    uint256 nonce;

    bytes4 public constant MSG_CALL_PREFIX = bytes4(
        keccak256("callGasRelay(address,uint256,bytes32,uint256,uint256,address)")
    );
    bytes4 public constant MSG_DEPLOY_PREFIX = bytes4(
        keccak256("deployGasRelay(uint256,bytes32,uint256,uint256,address)")
    );
    bytes4 public constant MSG_APPROVEANDCALL_PREFIX = bytes4(
        keccak256("approveAndCallGasRelay(address,address,uint256,bytes32,uint256,uint256)")
    );
    
    string public constant ERR_BAD_START_GAS = "Bad start gas";
    string public constant ERR_BAD_NONCE = "Bad nonce";
    string public constant ERR_BAD_SIGNER = "Bad signer";
    string public constant ERR_GAS_LIMIT_EXCEEDED = "Gas limit exceeded";
    string public constant ERR_BAD_TOKEN_ADDRESS = "Bad token address";
    string public constant ERR_BAD_DESTINATION = "Bad destination";

    event ExecutedGasRelayed(bytes32 messageHash);
    event ContractDeployed(address deployedAddress);

    constructor() internal {

    }

    /**
     * @notice get callHash
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender` 
     * @return callGasRelayHash the hash to be signed by wallet
     */
    function callGasRelayHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasToken
    )
        public 
        view 
        returns (bytes32 _callGasRelayHash) 
    {
        _callGasRelayHash = keccak256(
            abi.encodePacked(
                address(this), 
                MSG_CALL_PREFIX, 
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasPrice,
                _gasLimit,
                _gasToken
            )
        );
    }

    /**
     * @notice get callHash
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender` 
     * @return callGasRelayHash the hash to be signed by wallet
     */
    function deployGasRelayHash(
        uint256 _value,
        bytes32 _dataHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasToken
    )
        public 
        view 
        returns (bytes32 _callGasRelayHash) 
    {
        _callGasRelayHash = keccak256(
            abi.encodePacked(
                address(this), 
                MSG_DEPLOY_PREFIX,
                _value,
                _dataHash,
                _nonce,
                _gasPrice,
                _gasLimit,
                _gasToken
            )
        );
    }

    /**
     * @notice get callHash
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender` 
     * @return callGasRelayHash the hash to be signed by wallet
     */
    function approveAndCallGasRelayHash(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit
    )
        public 
        view 
        returns (bytes32 _callGasRelayHash) 
    {
        _callGasRelayHash = keccak256(
            abi.encodePacked(
                address(this), 
                MSG_APPROVEANDCALL_PREFIX,
                _baseToken,
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasPrice,
                _gasLimit
            )
        );
    }
    
}