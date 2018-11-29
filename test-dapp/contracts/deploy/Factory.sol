pragma solidity ^0.5.0;

import "../common/Controlled.sol";

contract Factory is Controlled {

    event NewKernel(address newKernel, bytes32 codeHash);

    struct Version {
        uint256 blockNumber;
        uint256 timestamp;
        address kernel;
    }

    mapping(bytes32 => uint256) public hashToVersion;
    mapping(address => uint256) public versionMap;

    Version[] public versionLog;
    uint256 public latestUpdate;
    address public latestKernel;

    constructor(address _kernel)
        public 
    {
        _setKernel(_kernel);
    }

    function setKernel(address _kernel)
        external 
        onlyController
    {
        _setKernel(_kernel);
    }

    function getVersion(uint256 index)
        public
        view
        returns(
            uint256 blockNumber,
            uint256 timestamp,
            address kernel
        )
    {
        return (
            versionLog[index].blockNumber, 
            versionLog[index].timestamp, 
            versionLog[index].kernel
        );
    }

    function isKernel(bytes32 _codeHash) public view returns (bool){
        return hashToVersion[_codeHash] > 0;
    }

    function isKernel(address _addr) public view returns (bool){
        return versionMap[_addr] > 0;
    }

    function getCodeHash(address _addr) 
        public 
        view 
        returns (bytes32 codeHash) 
    {
        bytes memory o_code;
        uint size;
        assembly {
            // retrieve the size of the code, this needs assembly
            size := extcodesize(_addr)
        }
        require (size > 0);
        assembly {
            // allocate output byte array - this could also be done without assembly
            // by using o_code = new bytes(size)
            o_code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(o_code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(_addr, add(o_code, 0x20), 0, size)
        }
        codeHash = keccak256(o_code);
    }

    function _setKernel(address _kernel) 
        internal
    {
        require(_kernel != latestKernel, "Bad call");
        bytes32 _codeHash = getCodeHash(_kernel);
        versionMap[_kernel] = versionLog.length;
        if(hashToVersion[_codeHash] == 0){
            hashToVersion[_codeHash] = versionLog.length;
        } else {
            versionLog.push(
                Version({
                    blockNumber: block.number,
                    timestamp: block.timestamp,
                    kernel: _kernel
                })
            );
        }

        latestUpdate = block.timestamp;
        latestKernel = _kernel;
        emit NewKernel(_kernel, _codeHash);
    }
}