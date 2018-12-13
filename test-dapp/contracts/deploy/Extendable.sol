pragma solidity >=0.5.0 <0.6.0;

import "./ExtendableStorage.sol";

/**
 * @title Extendable
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 */
contract Extendable is ExtendableStorage {

    /**
     * @notice delegatecall `_init` with `_initMsg` and set base as `_base` 
     * @param _base base for delegatecall 
     * @param _init constructor contract 
     * @param _initMsg arguments to be passed for the single delegatecall on `_init` 
     */
    constructor(
        ExtendableStorage _base,
        ExtendableStorage _init,
        bytes memory _initMsg
    ) public {
        address(_init).delegatecall(_initMsg);
        base = _base;
    }

    /**
     * @dev delegatecall everything (but declared functions) to `_target()`
     */
    function () external payable {
        bytes memory returned;
        bool success;
        (success, returned) = targetDelegatedCall().delegatecall(msg.data);
        require(success, "Call failed"); 
        assembly {
            return(add(returned, 0x20), returned) 
        }
        assert(false); //should never reach here
    }

    /**
     * @dev returns address for delegatecall
     * @return delegatecall address
     */
    function targetDelegatedCall()
        private
        view
        returns(address)
    {
        address extension = address(extensions[msg.sig]);
        return extension == address(0) ? address(base) : extension;
    }


}