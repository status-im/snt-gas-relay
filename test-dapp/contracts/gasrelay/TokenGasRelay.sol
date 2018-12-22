pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";

contract TokenGasRelay {
    
    bytes4 internal constant TRANSFER_PREFIX = bytes4(
        keccak256("transferGasRelay(address,uint256,uint256,uint256,uint256)")
    );

    bytes4 internal constant EXECUTE_PREFIX = bytes4(
        keccak256("executeGasRelay(address,bytes,uint256,uint256,uint256)")
    );

    bytes4 internal constant CONVERT_PREFIX = bytes4(
        keccak256("convertGasRelay(uint256,uint256,uint256,uint256)")
    );

    string internal constant ERR_BAD_NONCE = "Bad nonce";
    string internal constant ERR_BAD_SIGNER = "Bad signer";
    string internal constant ERR_GAS_LIMIT_EXCEEDED = "Gas limit exceeded";
    string internal constant ERR_BAD_DESTINATION = "Bad destination";

    constructor() internal {}
    
    /**
     * @notice creates an identity and transfer _amount to the newly generated account.
     * @param _amount total being transfered to new account
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature concatenated rsv of message    
     */
    function convertGasRelay(
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,        
        bytes calldata _signature
    ) 
        external;
    
    /** 
     * @notice allows externally owned address sign a message to transfer SNT and pay  
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _signature concatenated rsv of message
     */
    function transferGasRelay(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
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
     * @param _gasLimit maximum gas of this transacton
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     */
    function getTransferHash(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
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
                _gasLimit,
                _gasRelayer
            )
        );
    }

    /**
     * @notice get transfer hash
     * @param _amount total being transfered
     * @param _nonce current signNonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasRelayer beneficiary of gas, if address(0), msg.sender
     */
    function getConvertHash(
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
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
                _gasLimit,
                _gasRelayer
            )
        );
    }

}