pragma solidity >=0.5.0 <0.6.0;

import "./IdentityView.sol";
import "../status/LibraryCuration.sol";

/**
 * @title Identity Emergency Base
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Cannot be used stand-alone, use IdentityFactory.createIdentity
 */
contract IdentityEmergency is IdentityView {
    
    function execute(address, uint256, bytes calldata) external returns (uint256) {}
    function addKey(bytes32, Purpose, uint256) external returns (bool) {}
    function removeKey(bytes32, Purpose) external returns (bool) {}
    function addClaim(uint256,uint256,address,bytes calldata,bytes calldata,string calldata) external returns (bytes32) {}
    function removeClaim(bytes32) external returns (bool) {}

    /**
     * @notice approve a multisigned execution
     * @param _txId unique id multisig transaction
     * @param _approval approve (true) or reject (false)
     */
    function approve(uint256 _txId, bool _approval) 
        external 
        returns (bool success)
    {   
        return _approveRequest(keccak256(abi.encodePacked(msg.sender)), _txId, _approval);
    }

    function installBase(
        IdentityAbstract _newBase,
        bytes calldata _installMsg
    ) 
        external
        managementOnly
    {
        require(getLibraryCuration().isUpgradable(address(base),address(_newBase)));
        bool success;
        (success, ) = address(_newBase).delegatecall(_installMsg);
    }

    function getLibraryCuration() public view returns(LibraryCuration c) {

        address check = address(1);
        if (getCodeSize(check)>0){ //mainnet
            return LibraryCuration(check);
        }
        check = address(2);
        if (getCodeSize(check)>0){ //ropsten
            return LibraryCuration(check);
        }
        check = address(3);
        if (getCodeSize(check)>0){ //rinkeby
            return LibraryCuration(check);
        }
        check = address(4);
        if (getCodeSize(check)>0){ //kovan
            return LibraryCuration(check);
        }
        revert("library curation not found");
    }

    
    function getCodeSize(address _addr) internal view returns(uint _size) {
        assembly {
            _size := extcodesize(_addr)
        }   
    }

}

