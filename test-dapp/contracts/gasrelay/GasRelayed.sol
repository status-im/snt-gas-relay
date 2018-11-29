pragma solidity ^0.5.0;

import "../token/ERC20Token.sol";

/**
 * @title GasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice abstract gas abstraction
 */
contract GasRelayed {
    
    bytes4 public constant MSG_CALL_PREFIX = bytes4(
        keccak256("callGasRelay(address,uint256,bytes32,uint256,uint256,address,address)")
    );
    bytes4 public constant MSG_DEPLOY_PREFIX = bytes4(
        keccak256("deployGasRelay(uint256,bytes32,uint256,uint256,address,address)")
    );
    bytes4 public constant MSG_APPROVEANDCALL_PREFIX = bytes4(
        keccak256("approveAndCallGasRelay(address,address,uint256,bytes32,uint256,uint256,address)")
    );
    
    string public constant ERR_BAD_START_GAS = "Bad start gas";
    string public constant ERR_BAD_NONCE = "Bad nonce";
    string public constant ERR_BAD_SIGNER = "Bad signer";
    string public constant ERR_GAS_LIMIT_EXCEEDED = "Gas limit exceeded";
    string public constant ERR_BAD_TOKEN_ADDRESS = "Bad token address";
    string public constant ERR_BAD_DESTINATION = "Bad destination";

    constructor() internal {

    }

    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignatures rsv concatenated ethereum signed message signatures required
     */
    function callGasRelayed(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _messageSignatures
    ) 
        external;

    /**
     * @notice deploys contract in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignatures rsv concatenated ethereum signed message signatures required
     */
    function deployGasRelayed(
        uint256 _value, 
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _messageSignatures
    ) 
        external;
    
   /**
     * @notice include ethereum signed approve ERC20 and call hash 
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _messageSignatures rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasRelayed(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        bytes calldata _messageSignatures        
    ) 
        external;

    /**
     * @notice get callHash
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `_gasRelayer`
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     * @return callGasRelayHash the hash to be signed by wallet
     */
    function callGasRelayHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasToken,
        address _gasRelayer
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
                _gasToken,
                _gasRelayer
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
     * @param _gasToken token being used for paying `_gasRelayer` 
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     * @return callGasRelayHash the hash to be signed by wallet
     */
    function deployGasRelayHash(
        uint256 _value,
        bytes32 _dataHash,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasToken,
        address _gasRelayer
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
                _gasToken,
                _gasRelayer
            )
        );
    }

    /**
     * @notice return approveAndCall Relay Hash
     * @param _baseToken token approved for `_to` and token being used for paying `_gasRelayer`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _dataHash call data hash
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     * @return approveAndCallHash the hash to be signed by wallet
     */
    function approveAndCallGasRelayHash(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasRelayer
    )
        public 
        view 
        returns (bytes32 approveAndCallHash) 
    {
        approveAndCallHash = keccak256(
            abi.encodePacked(
                address(this), 
                MSG_APPROVEANDCALL_PREFIX,
                _baseToken,
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasPrice,
                _gasLimit,
                _gasRelayer
            )
        );
    }

    /**
     * @notice pays gas to relayer
     * @param _startGas gasleft on call start
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `_gasRelayer` 
     * @param _gasRelayer beneficiary of the payout
     */
    function payGasRelayer(
        uint256 _startGas,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken,
        address payable _gasRelayer
    )
        internal
    {
        if (_gasPrice > 0) {
            uint256 _amount = 21000 + (_startGas - gasleft());
            require(_amount <= _gasLimit, ERR_GAS_LIMIT_EXCEEDED);
            _amount = _amount * _gasPrice;
            if (_gasToken == address(0)) {
                _gasRelayer.transfer(_amount);
            } else {
                ERC20Token(_gasToken).transfer(_gasRelayer, _amount);
            }
        }
    }
    
}
