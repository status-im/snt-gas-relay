pragma solidity >=0.5.0 <0.6.0;

import "../token/ERC20Token.sol";
import "../payment/NonceChannel.sol";
import "../payment/NonceChannelFactory.sol";

/**
 * @title GasChannel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice abstract gas channel
 */
contract GasChannel {

    bytes4 public constant MSG_NEWCHANNEL_PREFIX = bytes4(
        keccak256("newChannel(address,address,address,address,uint256,uint256,uint256)")
    );

    bytes4 public constant MSG_CALL_GASCHANNEL_PREFIX = bytes4(
        keccak256("callGasChannel(address,uint256,bytes32,uint256,address)")
    );

    bytes4 public constant MSG_DEPLOY_GASCHANNEL_PREFIX = bytes4(
        keccak256("deployGasChannel(uint256,bytes32,uint256,address)")
    );

    bytes4 public constant MSG_APPROVEANDCALL_GASCHANNEL_PREFIX = bytes4(
        keccak256("approveAndCallGasChannel(address,address,uint256,bytes32,uint256,address)")
    );

    string internal constant ERR_BAD_START_GAS = "Bad start gas";
    string internal constant ERR_BAD_NONCE = "Bad nonce";
    string internal constant ERR_BAD_SIGNER = "Bad signer";
    string internal constant ERR_GAS_LIMIT_EXCEEDED = "Gas limit exceeded";
    string internal constant ERR_BAD_TOKEN_ADDRESS = "Bad token address";
    string internal constant ERR_BAD_DESTINATION = "Bad destination";

    constructor() internal {}

    /**
     * @notice creates a new channel and pay gas in the newly created channel 
     * @param _channelFactory address of trusted factory
     * @param _signer address signing the gas agreement
     * @param _gasRelayer beneficiary of channel
     * @param _duration duration of channel to account be able to withdraw
     * @param _amountToReserve amount of token to reserve in channel for gas paying
     * @param _token ERC20Token used, if `address(0)` then is ETH
     * @param _signature rsv concatenated ethereum signed message signature required
     */
    function newChannel(
        NonceChannelFactory _channelFactory,
        address _signer,
        address _gasRelayer,
        uint256 _duration,
        uint256 _amountToReserve,
        ERC20Token _token,
        bytes calldata _signature
    ) 
        external 
        returns(NonceChannel gasChannel);

    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows account of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function callGasChannel(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel,
        bytes calldata _signatures
    ) 
        external;

    /**
     * @notice deploys contract in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows account of being controlled without requiring ether in key balace
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function deployGasChannel(
        uint256 _value, 
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel,
        bytes calldata _signatures
    ) 
        external;
    
   /**
     * @notice include ethereum signed approve ERC20 and call hash 
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of gas proportional amount multiplied by `_gasPrice` of `_baseToken`
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasChannel(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel,
        bytes calldata _signatures        
    ) 
        external;

    /**
     * @notice get callHash
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current account nonce
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @return callGasChannelHash the hash to be signed by wallet
     */
    function callGasChannelHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint256 _nonce,
        uint256 _gasLimit,
        NonceChannel _gasChannel
    )
        public 
        view 
        returns (bytes32) 
    {
        return keccak256(
            abi.encodePacked(
                address(this), 
                MSG_CALL_GASCHANNEL_PREFIX, 
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasLimit,
                _gasChannel
            )
        );
    }

     /**
     * @notice get callHash
     * @param _value call value (ether)
     * @param _dataHash call data hash
     * @param _nonce current account nonce
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @return callGasChannelHash the hash to be signed by wallet
     */
    function deployGasChannelHash(
        uint256 _value,
        bytes32 _dataHash,
        uint256 _nonce,
        uint256 _gasLimit,
        NonceChannel _gasChannel
    )
        public 
        view 
        returns (bytes32) 
    {
        return keccak256(
            abi.encodePacked(
                address(this), 
                MSG_DEPLOY_GASCHANNEL_PREFIX,
                _value,
                _dataHash,
                _nonce,
                _gasLimit,
                _gasChannel
            )
        );
    }

    /**
     * @notice return approveAndCall Channel Hash
     * @param _baseToken token approved for `_to` and token being used for paying `_gasChannel`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _dataHash call data hash
     * @param _nonce current account nonce
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @return approveAndCallHash the hash to be signed by wallet
     */
    function approveAndCallGasChannelHash(
        address _baseToken,
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint256 _nonce,
        uint256 _gasLimit,
        NonceChannel _gasChannel
    )
        public 
        view 
        returns (bytes32) 
    {
        keccak256(
            abi.encodePacked(
                address(this), 
                MSG_APPROVEANDCALL_GASCHANNEL_PREFIX,
                _baseToken,
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasLimit,
                _gasChannel
            )
        );
    }

    /**
     * @notice calculate hash for newChannel
     * @param _nonce current account nonce
     * @param _channelFactory Address of trusted factory
     * @param _signer address signing the gas agreement
     * @param _gasRelayer beneficiary of channel
     * @param _duration duration of channel to account be able to withdraw
     * @param _amountToReserve amount of token to reserve in channel for gas paying
     * @param _token ERC20Token used, if `address(0)` then is ETH
     */
    function newChannelHash(
        uint256 _nonce,
        NonceChannelFactory _channelFactory,
        address _signer,
        address _gasRelayer,
        uint256 _duration,
        uint256 _amountToReserve,
        ERC20Token _token
    )
        public 
        view 
        returns (bytes32) 
    {
        return keccak256(
            abi.encodePacked(
                address(this), 
                MSG_NEWCHANNEL_PREFIX,
                _nonce,
                _channelFactory,
                _signer,
                _gasRelayer,
                _duration,
                _amountToReserve,
                _token
            )
        );
    }

    /**
     * @notice creates a new channel 
     * @param _channelFactory address of trusted factory
     * @param _signer address signing the gas agreement
     * @param _gasRelayer beneficiary of channel
     * @param _duration duration of channel to account be able to withdraw
     * @param _amountToReserve amount of token to reserve in channel for gas paying
     * @param _token ERC20Token used, if `address(0)` then is ETH
     */
    function newChannel(
        NonceChannelFactory _channelFactory,
        address _signer,
        address _gasRelayer,
        uint256 _duration,
        uint256 _amountToReserve,
        ERC20Token _token
    ) 
        internal 
        returns(NonceChannel gasChannel) 
    {
        if(address(_token) == address(0)){
            gasChannel = _channelFactory.createETHChannel.value(_amountToReserve)(
                _signer,
                address(uint160(_gasRelayer)),
                _duration
            );
        } else {
            _token.approve(address(_channelFactory), _amountToReserve);
            gasChannel = _channelFactory.createERC20Channel(
                _signer,
                _gasRelayer,
                _duration,
                _amountToReserve,
                _token
            );
        }
    }

    /**
     * @notice authorizes channel to withdraw nonce
     * @param _channel channel to be autorized
     */
    function authorizeChannel(NonceChannel _channel) 
        internal 
    {
        _channel.incrementNonce();
    }

}
