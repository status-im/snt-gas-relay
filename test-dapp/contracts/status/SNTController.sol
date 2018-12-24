pragma solidity >=0.5.0 <0.6.0;

import "../token/TokenController.sol";
import "../common/Owned.sol";
import "../common/MessageSigned.sol";
import "../token/ERC20Token.sol";
import "../token/MiniMeToken.sol";
import "../gasrelay/TokenGasRelay.sol";
import "../identity/IdentityFactory.sol";
/**
 * @title SNTController
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice enables economic abstraction for SNT
 */
contract SNTController is TokenController, Owned, TokenGasRelay, MessageSigned {

    MiniMeToken public snt;
    mapping (address => uint256) public nonce;
    mapping (address => bool) public allowPublicExecution;
    IdentityFactory public identityFactory;

    event ConvertedAccount(address indexed _signer, InstanceAbstract _identity, uint256 _transferAmount);
    event GasRelayedExecution(address indexed _signer, bytes32 _callHash, bool _success, bytes _returndata);
    event FactoryChanged(IdentityFactory identityFactory);
    event PublicExecutionEnabled(address indexed contractAddress, bool enabled);
    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event ControllerChanged(address indexed _newController);

    /**
     * @notice Constructor
     * @param _owner Authority address
     * @param _snt SNT token
     * @param _identityFactory used for converting accounts
     */
    constructor(address payable _owner, MiniMeToken _snt, IdentityFactory _identityFactory) public {
        if(_owner != address(0)){
            owner = _owner;
        }
        snt = _snt;
        identityFactory = _identityFactory;
    }
    
    /**
     * @notice creates an identity and transfer _amount to the newly generated account.
     * @param _amount total being transfered to new account
     * @param _nonce current nonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature concatenated rsv of message    
     */
    function convertGasRelay(
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,        
        bytes calldata _signature
    ) 
        external
    {
        require(address(identityFactory) != address(0), "Unavailable");
        uint256 startGas = gasleft();

        address msgSigner = recoverAddress(
            getSignHash(
                getConvertGasRelayHash(
                    _amount,
                    _nonce,
                    _gasPrice,
                    _gasLimit,
                    msg.sender
                )
            ),
            _signature
        );
        
        require(nonce[msgSigner] == _nonce, ERR_BAD_NONCE);
        nonce[msgSigner]++;
        InstanceAbstract userIdentity = identityFactory.createIdentity(
            keccak256(abi.encodePacked(msgSigner))
        );
        require(
            snt.transferFrom(msgSigner, address(userIdentity), _amount),
            "Transfer fail"
        );
        emit ConvertedAccount(msgSigner, userIdentity, _amount);
        payGasRelayer(startGas, _gasPrice, _gasLimit, msgSigner, msg.sender); 
    }

    /** 
     * @notice allows externally owned address sign a message to transfer SNT and pay  
     * @param _to address receving the tokens from message signer
     * @param _amount total being transfered
     * @param _nonce current nonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature concatenated rsv of message
     */
    function transferGasRelay(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes calldata _signature
    )
        external
    {
        uint256 startGas = gasleft();

        address msgSigner = recoverAddress(
            getSignHash(
                getTransferGasRelayHash(
                    _to,
                    _amount,
                    _nonce,
                    _gasPrice,
                    _gasLimit,
                    msg.sender
                )
            ),
             _signature
        );

        require(nonce[msgSigner] == _nonce, ERR_BAD_NONCE);
        nonce[msgSigner]++;
        require(
            snt.transferFrom(msgSigner, _to, _amount),
            "Transfer fail"
        );
        payGasRelayer(startGas, _gasPrice, _gasLimit, msgSigner, msg.sender); 
    }

    /**
     * @notice allows externally owned address sign a message to offer SNT for a execution 
     * @param _allowedContract address of a contracts in execution trust list;
     * @param _data msg.data to be sent to `_allowedContract`
     * @param _nonce current nonce of message signer
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signature concatenated rsv of message
     */
    function executeGasRelay(
        address _allowedContract,
        bytes calldata _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes calldata _signature
    )
        external
    {
        uint256 startGas = gasleft();
        require(allowPublicExecution[_allowedContract], ERR_BAD_DESTINATION);
        bytes32 msgSigned = getSignHash(
            getExecuteGasRelayHash(
                _allowedContract,
                _data,
                _nonce,
                _gasPrice,
                _gasLimit,
                msg.sender
            )
        );
        address msgSigner = recoverAddress(msgSigned, _signature);
        require(nonce[msgSigner] == _nonce, ERR_BAD_NONCE);
        nonce[msgSigner]++;
        bool success; 
        bytes memory returndata;
        (success, returndata) = _allowedContract.call(_data);
        emit GasRelayedExecution(msgSigner, msgSigned, success, returndata);
        payGasRelayer(startGas, _gasPrice, _gasLimit, msgSigner, msg.sender); 
    }

    /** 
     * @notice The owner of this contract can change the controller of the SNT token
     *  Please, be sure that the owner is a trusted agent or 0x0 address.
     *  @param _newController The address of the new controller
     */
    function changeController(address  payable _newController) public onlyOwner {
        snt.changeController(_newController);
        emit ControllerChanged(_newController);
    }
    
    function enablePublicExecution(address _contract, bool _enable) public onlyOwner {
        allowPublicExecution[_contract] = _enable;
        emit PublicExecutionEnabled(_contract, _enable);
    }

    function changeIdentityFactory(IdentityFactory _identityFactory) public onlyOwner {
        identityFactory = _identityFactory;
        emit FactoryChanged(_identityFactory);
    }

    //////////
    // Safety Methods
    //////////

    /**
     * @notice This method can be used by the controller to extract mistakenly
     *  sent tokens to this contract.
     * @param _token The address of the token contract that you want to recover
     *  set to 0 in case you want to extract ether.
     */
    function claimTokens(address _token) public onlyOwner {
        if (snt.controller() == address(this)) {
            snt.claimTokens(_token);
        }
        if (_token == address(0)) {
            address(owner).transfer(address(this).balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
        emit ClaimedTokens(_token, owner, balance);
    }


    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) external payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) external returns (bool) {
        return true;
    }

    function onApprove(address, address, uint256) external returns (bool) {
        return true;
    }
    
    function getNonce(address account) external view returns(uint256){
        return nonce[account];
    }

    /**
     * @notice check gas limit and pays gas to relayer
     * @param _startGas gasleft on call start
     * @param _gasPrice price in SNT paid back to msg.sender for each gas unit used
     * @param _gasLimit maximum gas of this transacton
     * @param _signer gas payer
     * @param _gasRelayer beneficiary gas payout
     */
    function payGasRelayer(
        uint256 _startGas,
        uint _gasPrice,
        uint _gasLimit,
        address _signer,
        address _gasRelayer
    )
        internal
    {
        uint256 _amount = 21000 + (_startGas - gasleft());
        require(_amount <= _gasLimit, ERR_GAS_LIMIT_EXCEEDED);
        if (_gasPrice > 0) {
            _amount = _amount * _gasPrice;
            snt.transferFrom(_signer, _gasRelayer, _amount); 
        }
    }
    
}