pragma solidity >=0.5.0 <0.6.0;

import "../identity/IdentityBase.sol";


contract UpdatedIdentityKernel is IdentityBase {

    event TestFunctionExecuted(uint256 minApprovalsByManagementKeys);

    function test() public {
        emit TestFunctionExecuted(purposeThreshold[uint256(Purpose.ManagementKey)]);
    }   
}