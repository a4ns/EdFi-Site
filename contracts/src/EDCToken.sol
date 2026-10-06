// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title EdFi Coin (EDC)
/// @notice BEP-20 reward token. Only addresses holding MINTER_ROLE can mint new EDC.
/// @dev Grant MINTER_ROLE only to RewardMinter to enforce oracle-verified issuance.
contract EDCToken is ERC20, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error ZeroAddress();

    constructor(address admin) ERC20("EdFi Coin", "EDC") ERC20Permit("EdFi Coin") {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
