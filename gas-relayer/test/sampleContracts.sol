pragma solidity >=0.5.0 <0.6.0;

contract TestIdentityGasRelay {
    event Debug();
    
    function approveAndCallGasRelay(
        address _baseToken, 
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        bytes calldata _messageSignatures
    ) external {
        emit Debug();
    }

    function callGasRelay(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint _gasPrice,
        uint _gasLimit,
        address _gasToken, 
        bytes calldata _messageSignatures
    ) external { 
        emit Debug();
    }

    function() external payable {
        
    }
}

contract TestIdentityFactory {
    address public latestKernel;
    constructor() public {
        latestKernel = address(new TestIdentityGasRelay());
    }
}

contract TestSNTController {
    event Debug();
    function transferGasRelay(address a,uint256 b,uint256 c,uint256 d, bytes f) external {
        emit Debug();
    } 
    function executeGasRelay(address a,bytes b,uint256 c,uint256 d,uint256 e,bytes f) external {
        emit Debug();
    }
}