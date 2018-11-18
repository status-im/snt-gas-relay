pragma solidity ^0.5.0;

import "../GasRelay.sol";
import "../common/Controlled.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";


/**
 * @title SimpleGasRelay
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for Controlled
 */
contract SimpleGasRelay is Controlled, MessageSigned, GasRelay {
    
    uint256 nonce;

    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignatures rsv concatenated ethereum signed message signatures required
     */
    function callGasRelayed(
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes _messageSignature
    ) 
        external 
        returns (bool success)
    {
        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        require(_nonce == nonce, ERR_BAD_NONCE);
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    callGasRelayHash(
                        _to,
                        _value,
                        keccak256(_data),
                        _nonce,
                        _gasPrice,
                        _gasLimit,
                        _gasToken                
                    )
                ), 
                _messageSignature
            ),
            ERR_BAD_SIGNER
        );
        
        //increase nonce
        nonce++;
        
        //executes transaction
        success = _to.call.value(_value)(_data);

        //refund gas used using contract held ERC20 tokens or ETH
        if (_gasPrice > 0) {
            uint256 _amount = 21000 + (startGas - gasleft());
            require(_amount <= _gasLimit, ERR_GAS_LIMIT_EXCEEDED);
            _amount = _amount * _gasPrice;
            if (_gasToken == address(0)) {
                address(msg.sender).transfer(_amount);
            } else {
                ERC20Token(_gasToken).transfer(msg.sender, _amount);
            }
        }
        
    }

    
    /**
     * @notice deploys contract in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _value call value (ether) to be sent to newly created contract
     * @param _data contract code data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _messageSignature rsv concatenated ethereum signed message signatures required
     */
    function deployGasRelayed(
        uint256 _value, 
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes _messageSignature
    ) 
        external 
        returns(address deployedAddress)
    {
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        require(_nonce == nonce, ERR_BAD_NONCE);
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    deployGasRelayHash(
                        _value,
                        keccak256(_data),
                        _nonce,
                        _gasPrice,
                        _gasLimit,
                        _gasToken                
                    )
                ), 
                _messageSignature
            ),
            ERR_BAD_SIGNER
        );
        
        //increase nonce
        nonce++;

        deployedAddress = doCreate(_value, _data);
        emit ContractDeployed(deployedAddress); 

        //refund gas used using contract held ERC20 tokens or ETH
        if (_gasPrice > 0) {
            uint256 _amount = 21000 + (startGas - gasleft());
            require(_amount <= _gasLimit, ERR_GAS_LIMIT_EXCEEDED);
            _amount = _amount * _gasPrice;
            if (_gasToken == address(0)) {
                address(msg.sender).transfer(_amount);
            } else {
                ERC20Token(_gasToken).transfer(msg.sender, _amount);
            }
        }       
    }


    /**
     * @notice include ethereum signed approve ERC20 and call hash 
     *         (`ERC20Token(baseToken).approve(_to, _value)` + `_to.call(_data)`).
     *         in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         fixes race condition in double transaction for ERC20.
     * @param _baseToken token approved for `_to` and token being used for paying `msg.sender`
     * @param _to destination of call
     * @param _value call value (in `_baseToken`)
     * @param _data call data
     * @param _nonce current identity nonce
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _messageSignatures rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasRelayed(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes _data,
        uint _nonce,
        uint _gasPrice,
        uint _gasLimit,
        bytes _messageSignature
    ) 
        external 
        returns(bool success)
    {
                        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        require(_nonce == nonce, ERR_BAD_NONCE);
        
        //verify if signatures are valid and came from correct actor;
        require(
            controller == recoverAddress(
                getSignHash(
                    approveAndCallGasRelayHash(
                        _baseToken,
                        _to,
                        _value,
                        keccak256(_data),
                        _nonce,
                        _gasPrice,
                        _gasLimit
                    )
                ), 
                _messageSignature
            ),
            ERR_BAD_SIGNER
        );
        
        //increase nonce
        nonce++;
        
        require(_baseToken != address(0), ERR_BAD_TOKEN_ADDRESS); //_baseToken should be something!
        require(_to != address(0) && _to != address(this), ERR_BAD_DESTINATION); //need valid destination
        ERC20Token(_baseToken).approve(_to, _value);
        success = _to.call.value(_value)(_data);

        //refund gas used using contract held _baseToken
        if (_gasPrice > 0) {
            uint256 _amount = 21000 + (startGas - gasleft());
            require(_amount <= _gasLimit, ERR_GAS_LIMIT_EXCEEDED); 
            ERC20Token(_baseToken).transfer(msg.sender, _amount * _gasPrice);
        }
    }

    /**
     * @notice creates new contract based on input `_code` and transfer `_value` ETH to this instance
     * @param _value amount ether in wei to sent to deployed address at its initialization
     * @param _code contract code
     */
    function doCreate(
        uint _value,
        bytes _code
    ) 
        internal 
        returns (address createdContract) 
    {
        assembly {
            createdContract := create(_value, add(_code, 0x20), mload(_code))
        }
        /* 
        //enabling this would prevent gas relayers from executing failed calls
        //however would insert this identity to gas relayer blocklist when this happens
        bool failed;
        assembly {
            failed := iszero(extcodesize(createdContract))
        }
        require(!failed); 
        */
    }

}