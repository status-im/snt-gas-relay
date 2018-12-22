pragma solidity >=0.5.0 <0.6.0;

import "./GasRelay.sol";
import "../common/Account.sol";
import "../common/Controlled.sol";
import "../common/MessageSigned.sol";

/**
 * @title SimpleGasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for Controlled
 */
contract SimpleGasRelay is Account, Controlled, GasRelay, MessageSigned {
    
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

    function getNonce() external view returns(uint256){
        return nonce;
    }
    
}