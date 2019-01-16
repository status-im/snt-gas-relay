pragma solidity >=0.5.0 <0.6.0;

import "./NonceChannel.sol";
import "../token/ERC20Token.sol";
import "../common/MessageSigned.sol";

/**
 * @title NonceChannelERC20
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables offchain ERC20 payment agreements with payout limited by a nonce.
 */
contract NonceChannelERC20 is NonceChannel {
    ERC20Token public token;

    constructor (
        address _signer,
        address _recipient, 
        uint256 _duration,
        ERC20Token _token 
    ) 
        public 
        NonceChannel(
            _signer, 
            address(uint160(_recipient)), 
            _duration
        )
    {
        token = _token;
    }

    /**
     * @notice initialize instance
     * @param _controller address allowing payouts
     * @param _signer address allowing payouts
     * @param _recipient address receiving payments
     * @param _duration expiration time for controller withdraw
     * @param _token token base for channel
     */
    function init(
        address _controller,
        address _signer, 
        address _recipient, 
        uint256 _duration,
        ERC20Token _token
    )
        external
    {
        require(controller == address(0), "Unauthorized");
        controller = address(uint160(_controller));
        signer = _signer;
        token = _token;
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
        token.transfer(recipient, _amount);
    }



}

