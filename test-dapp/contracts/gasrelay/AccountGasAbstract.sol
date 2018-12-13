pragma solidity >=0.5.0 <0.6.0;

import "./GasRelay.sol";
import "./GasChannel.sol";
import "../common/Account.sol";
import "../common/Controlled.sol";
import "../common/MessageSigned.sol";

/**
 * @title SimpleGasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for Controlled
 */
contract AccountGasAbstract is Account, Controlled, GasRelay, GasChannel, MessageSigned {
    
    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `_gasRelayer` (or msg.sender if relayer is 0)
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function callGasRelay(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _signature
    ) 
        external 
    {
        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    callGasRelayHash(
                        _to,
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasPrice,
                        _gasLimit,
                        _gasToken,
                        msg.sender                
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );

        _execute(_to, _value,_data);
     

        //refund gas used using contract held ERC20 tokens or ETH
        payGasRelayer(
            startGas,
            _gasPrice,
            _gasLimit,
            _gasToken,
            msg.sender
        );
        
    }

    /**
     * @notice deploys contract in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function deployGasRelay(
        uint256 _value, 
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _signature
    ) 
        external
    {
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    deployGasRelayHash(
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasPrice,
                        _gasLimit,
                        _gasToken,
                        msg.sender                
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );
        
        _deploy(_value, _data);

        //refund gas used using contract held ERC20 tokens or ETH
        payGasRelayer(
            startGas,
            _gasPrice,
            _gasLimit,
            _gasToken,
            msg.sender
        );   
    }

    /**
     * @notice include ethereum signed approve ERC20 and call hash 
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of gas proportional amount multiplied by `_gasPrice` of `_baseToken`
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasRelay(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        bytes calldata _signature
    ) 
        external 
    {
                        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    approveAndCallGasRelayHash(
                        _baseToken,
                        _to,
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasPrice,
                        _gasLimit,
                        msg.sender
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );
        
        _approveAndCall(_baseToken, _to, _value, _data);
        
        //refund gas used using contract held _baseToken
        payGasRelayer(
            startGas,
            _gasPrice,
            _gasLimit,
            _baseToken,
            msg.sender
        );
    }
    
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
        returns(NonceChannel gasChannel)
    {

        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    newChannelHash(
                        nonce,
                        _channelFactory,
                        _signer,
                        _gasRelayer,
                        _duration,
                        _amountToReserve,
                        _token
                    )
                ),
                _signature 
            ),
            ERR_BAD_SIGNER
        );
        nonce++;

        gasChannel = newChannel(
            _channelFactory,
            _signer,
            _gasRelayer,
            _duration,
            _amountToReserve,
            _token
        );

        authorizeChannel(gasChannel);
    }

    /**
     * @notice include ethereum signed callHash in return of authorizing channel payout in an offchain agreement 
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function callGasChannel(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel, 
        bytes calldata _signature
    ) 
        external 
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    callGasChannelHash(
                        _to,
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasLimit,
                        _gasChannel                
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );

        _execute(_to, _value, _data);

        authorizeChannel(_gasChannel);
    }

    /**
     * @notice deploys contract in return of authorizing channel payout in an offchain agreement 
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function deployGasChannel(
        uint256 _value, 
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel, 
        bytes calldata _signature
    ) 
        external
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    deployGasChannelHash(
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasLimit,
                        _gasChannel              
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );

        _deploy(_value, _data);

        authorizeChannel(_gasChannel);
        
    }

    /**
     * @notice include ethereum signed approve ERC20 and call hash 
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of authorizing channel payout in an offchain agreement 
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _gasLimit maximum gas of this transacton
     * @param _gasChannel kicked NonceChannel which will charge for the execution
     * @param _signature rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasChannel(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel,
        bytes calldata _signature
    ) 
        external 
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    approveAndCallGasChannelHash(
                        _baseToken,
                        _to,
                        _value,
                        keccak256(_data),
                        nonce,
                        _gasLimit,
                        _gasChannel
                    )
                ), 
                _signature
            ),
            ERR_BAD_SIGNER
        );

        _approveAndCall(_baseToken, _to, _value, _data);

        authorizeChannel(_gasChannel);
        
    }
}