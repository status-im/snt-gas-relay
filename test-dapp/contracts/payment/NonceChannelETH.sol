pragma solidity >=0.5.0 <0.6.0;

import "./NonceChannel.sol";
/**
 * @title NonceChannelETH
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables offchain ETH payment agreements with payout limited by a nonce.
 */
contract NonceChannelETH is NonceChannel {
   
   constructor (
        address _signer,
        address payable _recipient, 
        uint256 _duration
    ) 
        public 
        NonceChannel(
            _signer, 
            _recipient, 
            _duration
        )
    {

    }
    /** 
     * @notice allow ETH deposits 
     */
    function () 
        external 
        payable 
    {

    }

    /**
     * @notice initialize instance
     * @param _controller address allowing payouts
     * @param _signer address allowing payouts
     * @param _recipient address receiving payments
     * @param _duration expiration time for controller withdraw
     */
    function init(
        address _controller,
        address _signer, 
        address _recipient, 
        uint256 _duration
    )
        external
        payable
    {
        require(controller == address(0), "Unauthorized");
        controller = address(uint160(_controller));
        signer = _signer;
        recipient = address(uint160(_recipient));
        expiration = now + _duration;
    }

    /**
     * @notice process `_amount` payout to recipient
     * @param _amount total being transfered
     */
    function process(uint256 _amount) 
        internal
    {
        address(recipient).transfer(_amount);
    }

}

