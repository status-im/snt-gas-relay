pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "./InstanceAbstract.sol";

contract PrototypeRegistry is Controlled {
    struct Prototype {
        InstanceAbstract init;
        InstanceAbstract emergency;
    }
    mapping(address => Prototype) public prototypes;
    mapping(address => bool) private bases;
    mapping(bytes32 => bool) private upgradable;
    mapping(bytes32 => bool) private extensions;

    function setPrototype(InstanceAbstract base, InstanceAbstract init, InstanceAbstract emergency) external onlyController {
        prototypes[address(base)] = Prototype(init, emergency);
    }

    function approveBase(InstanceAbstract _base, bool _approve) external onlyController {
        bases[address(_base)] = _approve;
    }   

    function approveUpgrade(InstanceAbstract _baseFrom, InstanceAbstract _baseTo, bool _approve) external onlyController {
        extensions[keccak256(abi.encodePacked(_baseFrom, _baseTo))] = _approve;
    }

    function approveExtension(InstanceAbstract _base, InstanceAbstract _extension, bool _approve) external onlyController {
        extensions[keccak256(abi.encodePacked(_base, _extension))] = _approve;
    }

    function isBase(InstanceAbstract _base) external view returns(bool){
        return bases[address(_base)];
    }

    function isUpgradable(InstanceAbstract _baseFrom, InstanceAbstract _baseTo) external view returns(bool){
        return extensions[keccak256(abi.encodePacked(_baseFrom, _baseTo))];
    }

    function isExtension(InstanceAbstract _base, InstanceAbstract _extension) external view returns(bool){
        return extensions[keccak256(abi.encodePacked(_base, _extension))];
    }

    function getInit(InstanceAbstract base) external view returns (InstanceAbstract init){
        return prototypes[address(base)].init;
    }

    function getEmergency(InstanceAbstract base) external view returns (InstanceAbstract emergency){
        return prototypes[address(base)].emergency;
        
    }

}