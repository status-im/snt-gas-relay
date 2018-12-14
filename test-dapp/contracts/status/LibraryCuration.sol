pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

contract LibraryCuration is Controlled {

    mapping(bytes32 => bool) public bases;
    mapping(bytes32 => bool) public upgradable;
    mapping(bytes32 => bool) public extensions;

    function approveBase(bytes4 _class, address _base, bool _approve) external onlyController {
        bases[keccak256(abi.encodePacked(_class, _base))] = _approve;
    }

    function approveUpgrade(address _baseFrom, address _baseTo, bool _approve) external onlyController {
        extensions[keccak256(abi.encodePacked(_baseFrom, _baseTo))] = _approve;
    }

    function approveExtension(address _base, address _extension, bool _approve) external onlyController {
        extensions[keccak256(abi.encodePacked(_base, _extension))] = _approve;
    }

    function isBase(bytes4 _class, address _base) external view returns(bool){
        return bases[keccak256(abi.encodePacked(_class, _base))];
    }

    function isUpgradable(address _baseFrom, address _baseTo) external view returns(bool){
        return extensions[keccak256(abi.encodePacked(_baseFrom, _baseTo))];
    }

    function isExtension(address _base, address _extension) external view returns(bool){
        return extensions[keccak256(abi.encodePacked(_base, _extension))];
    }

}