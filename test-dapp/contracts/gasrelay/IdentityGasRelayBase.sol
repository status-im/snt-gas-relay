pragma solidity >=0.5.0 <0.6.0;

import "../identity/IdentityBase.sol";
import "./GasRelay.sol";
import "../common/MessageSigned.sol";

/**
 * @title IdentityGasRelayExt
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for Identity via Base
 */
contract IdentityGasRelayBase is IdentityBase, GasRelay, MessageSigned {
    
    /**
     * @notice include ethereum signed callHash in return of gas proportional amount multiplied by `_gasPrice` of `_gasToken`
     *         allows identity of being controlled without requiring ether in key balace
     * @param _to destination of call
     * @param _value call value (ether)
     * @param _data call data
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _gasToken token being used for paying `msg.sender`
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function callGasRelay(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _signatures
    ) 
        external 
    {
        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        
        //verify if signatures are valid and came from correct actors;
        verifySignatures(
            _to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey,
            callGasRelayHash(
                _to,
                _value,
                keccak256(_data),
                nonce,
                _gasPrice,
                _gasLimit,
                _gasToken,
                msg.sender                
            ), 
            _signatures
        );

        _execute(_to, _value, _data);

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
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function deployGasRelay(
        uint256 _value, 
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _signatures
    ) 
        external
    {
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        
        //verify if signatures are valid and came from correct actors;
        verifySignatures(
            Purpose.ActionKey,
            deployGasRelayHash(
                _value,
                keccak256(_data),
                nonce,
                _gasPrice,
                _gasLimit,
                _gasToken,
                msg.sender                
            ), 
            _signatures
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
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function approveAndCallGasRelay(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        bytes calldata _signatures        
    ) 
        external 
    {
                        
        //query current gas available
        uint startGas = gasleft(); 
        
        //verify transaction parameters
        require(startGas >= _gasLimit, ERR_BAD_START_GAS); 
        //verify if signatures are valid and came from correct actors;
        verifySignatures(
            Purpose.ActionKey,
            approveAndCallGasRelayHash(
                _baseToken,
                _to,
                _value,
                keccak256(_data),
                nonce,
                _gasPrice,
                _gasLimit,
                msg.sender
            ), 
            _signatures
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
     * @notice reverts if signatures are not valid for the signed hash and required key type. 
     * @param _requiredKey key required to call, if _to from payload is the identity itself, is `MANAGEMENT_KEY`, else `ACTION_KEY`
     * @param _messageHash message hash provided for the payload
     * @param _signatures ethereum signed `getSignHash(_messageHash)` message
     * @return true case valid
     */    
    function verifySignatures(
        Purpose _requiredKey,
        bytes32 _messageHash,
        bytes memory _signatures
    ) 
        public
        view
        returns(bool)
    {
        // calculates signHash
        bytes32 signHash = getSignHash(_messageHash);
        uint _amountSignatures = _signatures.length / 65;
        require(_amountSignatures == purposeThreshold[uint256(_requiredKey)], "Too few signatures");
        bytes32 _lastKey = 0;
        for (uint256 i = 0; i < _amountSignatures; i++) {
            bytes32 _currentKey = recoverKey(
                signHash,
                _signatures,
                i
                );
            require(_currentKey > _lastKey, "Bad signatures order"); //assert keys are different
            require(_keyHasPurpose(_currentKey, _requiredKey), ERR_BAD_SIGNER);
            _lastKey = _currentKey;
        }
        return true;
    }

    /**
     * @notice recovers key who signed the message 
     * @param _signHash operation ethereum signed message hash
     * @param _messageSignature message `_signHash` signature
     * @param _pos which signature to read
     */
    function recoverKey(
        bytes32 _signHash, 
        bytes memory _messageSignature,
        uint256 _pos
    )
        public
        pure
        returns(bytes32) 
    {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v,r,s) = signatureSplit(_messageSignature, _pos);
        return keccak256(
            abi.encodePacked(
                ecrecover(
                    _signHash,
                    v,
                    r,
                    s
                )
            )
        );
    }

    /**
     * @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s`
     * @param _pos which signature to read
     * @param _signatures concatenated vrs signatures
     */
    function signatureSplit(bytes memory _signatures, uint256 _pos)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        uint pos = _pos + 1;
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(_signatures, mul(32,pos)))
            s := mload(add(_signatures, mul(64,pos)))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(_signatures, mul(65,pos))), 0xff)
        }

        require(v == 27 || v == 28, "Bad signature");
    }

}