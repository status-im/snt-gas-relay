pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";

contract TokenGasRelay {
    
    bytes4 public constant TRANSFER_PREFIX = bytes4(
        keccak256("transferGasRelay(address,uint256,uint256,uint256)")
    );

    bytes4 public constant EXECUTE_PREFIX = bytes4(
        keccak256("executeGasRelay(address,bytes,uint256,uint256,uint256)")
    );

    bytes4 public constant CONVERT_PREFIX = bytes4(
        keccak256("convertGasRelay(uint256,uint256,uint256)")
    );

    string public constant ERR_BAD_START_GAS = "Bad start gas";
    string public constant ERR_BAD_NONCE = "Bad nonce";
    string public constant ERR_BAD_SIGNER = "Bad signer";
    string public constant ERR_GAS_LIMIT_EXCEEDED = "Gas limit exceeded";
    string public constant ERR_BAD_TOKEN_ADDRESS = "Bad token address";
    string public constant ERR_BAD_DESTINATION = "Bad destination";

    constructor() internal {}
    
    /**
     * @notice creates an identity and transfer _amount to the newly generated identity.
     */
    function convertAccount(
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        bytes calldata _signature
    ) 
        external;
    
    /** 
     * @notice allows externally owned address sign a message to transfer SNT and pay  
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _signature concatenated rsv of message
     */
    function transfer(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        bytes calldata _signature
    )
        external;

    /**
     * @notice allows externally owned address sign a message to offer SNT for a execution 
     * @param _allowedContract address of a contracts in execution trust list;
     * @param _data msg.data to be sent to `_allowedContract`
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature concatenated rsv of message
     */
    function executeGasRelay(
        address _allowedContract,
        bytes calldata _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes calldata _signature
    )
        external;


        /**
     * @notice get execution hash
     * @param _allowedContract address of a contracts in execution trust list;
     * @param _data msg.data to be sent to `_allowedContract`
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     */
    function getExecuteGasRelayHash(
        address _allowedContract,
        bytes memory _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasRelayer
    ) 
        public 
        view 
        returns (bytes32 execHash) 
    {
        execHash = keccak256(
            abi.encodePacked(
                address(this),
                EXECUTE_PREFIX,
                _allowedContract,
                keccak256(_data),
                _nonce,
                _gasPrice,
                _gasLimit,
                _gasRelayer
            )
        );
    }

    /**
     * @notice get transfer hash
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     */
    function getTransferHash(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        address _gasRelayer
    ) 
        public 
        view 
        returns (bytes32 txHash) 
    {
        txHash = keccak256(
            abi.encodePacked(
                address(this),
                TRANSFER_PREFIX,
                _to,
                _amount,
                _nonce,
                _gasPrice,
                _gasRelayer
            )
        );
    }

    /**
     * @notice get transfer hash
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     */
    function getConvertHash(
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        address _gasRelayer
    ) 
        public 
        view 
        returns (bytes32 txHash) 
    {
        txHash = keccak256(
            abi.encodePacked(
                address(this),
                CONVERT_PREFIX,
                _amount,
                _nonce,
                _gasPrice,
                _gasRelayer
            )
        );
    }

}