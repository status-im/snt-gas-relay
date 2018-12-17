pragma solidity >=0.5.0 <0.6.0;

import "../deploy/InstanceAbstract.sol";
import "../common/Controlled.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";

/**
 * @title NonceChannel
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables offchain payment agreements with payout limited by a nonce.
 */
contract NonceChannel is InstanceAbstract, Controlled, MessageSigned {
    address payable public recipient; 
    address public signer; 
    uint256 public expiration; 
    uint256 public nonce;
    uint256 public paid;

    /**
     * @param _signer address allowing payouts
     * @param _recipient address receiving payments
     * @param _duration expiration time for controller withdraw
     */
    constructor (
        address _signer,
        address payable _recipient,
        uint256 _duration
    ) 
        internal
    {
        signer = _signer;
        recipient = _recipient;
        expiration = now + _duration;
    }

    /**
     * @notice
     * @param _nonce nonce being claimed 
     * @param _amount amount agreed
     * @param _signature signer payoutHash signed
     */
    function payout(
        uint256 _nonce,
        uint256 _amount,
        bytes calldata _signature
    ) 
        external
    {
        require(msg.sender == recipient, "Only recipient allowed");
        require(_nonce <= nonce);
        require(_nonce > paid);
        require(
            signer == recoverAddress(
                getSignHash(
                    getPayoutHash(_nonce, _amount)
                ), 
                _signature
            )
        );
        paid = _nonce;
        process(_amount);
    }

    /**
     * @notice allows recipient to claim payout
     */
    function incrementNonce()
        external 
        onlyController 
    {
        nonce++;
    }

    /**
     * @notice extends channel sender withdraw lock
     * @param _newExpiration timestamp of new expiration
     */
    function extend(
        uint256 _newExpiration
    ) 
        external 
        onlyController
    {
        require(_newExpiration > expiration);
        expiration = _newExpiration;
    }
    
    /**
     * @notice withdraws `_token`, if `_token == address(0)` withdraw ETH
     * @param _token  token being withdraw, 
     */
    function withdraw(ERC20Token _token) 
        external 
        onlyController 
    {
        require(now >= expiration, "Channel not expired");
        if(address(_token) == address(0)) {
            controller.transfer(address(this).balance);
        } else {
            _token.transfer(
                controller,
                _token.balanceOf(address(this))
            );
        }
    }

    /**
     * @notice calculates payout hash
     * @param _nonce nonce being claimed 
     * @param _amount amount agreed
     */
    function getPayoutHash(
        uint256 _nonce,
        uint256 _amount
    ) 
        public 
        view 
        returns (bytes32 payoutHash) 
    {
        return keccak256(
            abi.encodePacked(
                this, 
                _nonce, 
                _amount
            )
        );
    }

    /**
     * @notice process `_amount` payout to recipient
     * @param _amount total being transfered
     */
    function process(
        uint256 _amount
    ) 
        internal;
}


