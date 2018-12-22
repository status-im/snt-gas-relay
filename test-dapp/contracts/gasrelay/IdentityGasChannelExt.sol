pragma solidity >=0.5.0 <0.6.0;

import "../identity/IdentityExtension.sol";
import "./GasChannel.sol";
import "../common/MessageSigned.sol";

/**
 * @title IdentityGasChannel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction through gas channel for Identity
 */
contract IdentityGasChannelExt is IdentityExtension, GasChannel, MessageSigned {

    function installExtension(IdentityAbstract _extension, bool _enable) 
        external 
        managementOnly 
    {
        bytes4 createSig = bytes4(
            keccak256("newChannel(address,address,address,address,uint256,uint256,uint256,bytes)")
        );
        bytes4 callSig = bytes4(
            keccak256("callGasChannel(address,uint256,bytes32,uint256,address,bytes)")
        );
        bytes4 deploySig = bytes4(
            keccak256("deployGasChannel(uint256,bytes32,uint256,address,bytes)")
        );
        bytes4 approveAndCallSig = bytes4(
            keccak256("approveAndCallGasChannel(address,address,uint256,bytes32,uint256,address,bytes)")
        );
        if (_enable) {
            extensions[createSig] = _extension;
            extensions[callSig] = _extension;
            extensions[deploySig] = _extension;
            extensions[approveAndCallSig] = _extension;
        } else {
            delete extensions[createSig];
            delete extensions[callSig];
            delete extensions[deploySig];
            delete extensions[approveAndCallSig];
        }
    }

    /**
     * @notice creates a new channel and pay gas in the newly created channel 
     * @param _channelFactory address of trusted factory
     * @param _signer address signing the gas agreement
     * @param _gasRelayer beneficiary of channel
     * @param _duration duration of channel to account be able to withdraw
     * @param _amountToReserve amount of token to reserve in channel for gas paying
     * @param _token ERC20Token used, if `address(0)` then is ETH
     * @param _signatures rsv concatenated ethereum signed message signature required
     */
    function newChannel(
        NonceChannelFactory _channelFactory,
        address _signer,
        address _gasRelayer,
        uint256 _duration,
        uint256 _amountToReserve,
        ERC20Token _token,
        bytes calldata _signatures
    ) 
        external 
        returns(NonceChannel gasChannel)
    {

        //verify if signatures are valid and came from correct actor;
        verifySignatures(
            Purpose.ManagementKey,
            newChannelHash(
                nonce,
                _channelFactory,
                _signer,
                _gasRelayer,
                _duration,
                _amountToReserve,
                _token
            ),
            _signatures
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
        external 
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);

        verifySignatures(
            _to == address(this) ? Purpose.ManagementKey : Purpose.ActionKey,
            callGasChannelHash(
                _to,
                _value,
                keccak256(_data),
                nonce,
                _gasLimit,
                _gasChannel                
            ),
            _signatures
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
     * @param _signatures rsv concatenated ethereum signed message signatures required
     */
    function deployGasChannel(
        uint256 _value, 
        bytes calldata _data,
        uint256 _gasLimit,
        NonceChannel _gasChannel, 
        bytes calldata _signatures
    ) 
        external
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);

        verifySignatures(
            Purpose.ActionKey,
            deployGasChannelHash(
                _value,
                keccak256(_data),
                nonce,
                _gasLimit,
                _gasChannel              
            ), 
            _signatures
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
        external 
    {
        require(gasleft() >= _gasLimit, ERR_BAD_START_GAS);

        verifySignatures(
            Purpose.ActionKey,
            approveAndCallGasChannelHash(
                _baseToken,
                _to,
                _value,
                keccak256(_data),
                nonce,
                _gasLimit,
                _gasChannel
            ),
            _signatures
        );
        _approveAndCall(_baseToken, _to, _value, _data);

        authorizeChannel(_gasChannel);
        
    }

    function getNonce() external view returns(uint256){
        return nonce;
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