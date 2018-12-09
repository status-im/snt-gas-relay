pragma solidity >=0.5.0 <0.6.0;

import "../deploy/Instance.sol";
import "./NonceChannelERC20.sol";
import "./NonceChannelETH.sol";

/**
 * @title NonceChannelFactory
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Factory of Instance (delegatecall) of NonceChannel 
 */
contract NonceChannelFactory {

    NonceChannelERC20 public modelERC20;
    NonceChannelETH public modelETH;

    /**
     * @notice creates factory and models for instances
     */
    constructor() 
        public
    {
        address payable self = address(uint160(address(this)));
        modelERC20 = new NonceChannelERC20(self, self, 0, ERC20Token(0));
        modelETH = new NonceChannelETH(self, self, 0);
    }

    /**
     * @notice creates channel for ETH payments
     * @param _signer address allowing payouts
     * @param _recipient address receiving payments
     * @param _duration expiration time for controller withdraw
     * @return instance created
     */
    function createETHChannel(   
        address _signer,
        address payable _recipient, 
        uint256 _duration
    ) 
        external
        payable
        returns (NonceChannelETH instance)
    {
        instance = NonceChannelETH(address(new Instance(address(modelETH)))); 
        instance.init.value(msg.value)(msg.sender, _signer, _recipient, _duration);
    }

    /**
     * @notice create channel for ERC20 `_token` payments
     * @param _signer address allowing payouts
     * @param _recipient address receiving payments
     * @param _duration expiration time for controller withdraw
     * @param _amount token to transfer on creation
     * @param _token token base for channel
     * @return instance created
     */
    function createERC20Channel(   
        address _signer,
        address _recipient, 
        uint256 _duration,
        uint256 _amount,
        ERC20Token _token
    ) 
        external 
        returns (NonceChannelERC20 instance)
    {
        instance = NonceChannelERC20(address(new Instance(address(modelERC20)))); 
        instance.init(msg.sender, _signer, _recipient, _duration, _token);
        if (_amount > 0) {
            _token.transferFrom(msg.sender, _recipient, _amount);
        }
    }

}
