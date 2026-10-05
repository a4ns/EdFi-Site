// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EDCToken} from "./EDCToken.sol";

/// @title RewardMinter
/// @notice Mints EDC for academic results (grades, attendance, research) that a university
///         oracle has signed. Students never self-report: the contract only accepts an
///         EIP-712 signature from an allow-listed oracle key, and each result can be paid once.
/// @dev Anyone may submit a claim (e.g. a gas-paying relayer); tokens always go to the student
///      named in the signed payload.
contract RewardMinter is AccessControl, Pausable, EIP712 {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public constant REWARD_TYPEHASH =
        keccak256("Reward(address student,uint256 amount,bytes32 resultId,uint256 deadline)");

    EDCToken public immutable token;
    /// @notice Upper bound for a single reward, protects against a leaked or buggy oracle.
    uint256 public maxRewardPerClaim;
    /// @notice Result IDs that were already paid out (replay protection).
    mapping(bytes32 resultId => bool) public claimed;

    event RewardClaimed(address indexed student, bytes32 indexed resultId, uint256 amount, address indexed oracle);
    event MaxRewardUpdated(uint256 maxRewardPerClaim);

    error AlreadyClaimed(bytes32 resultId);
    error Expired(uint256 deadline);
    error InvalidOracle(address signer);
    error InvalidAmount(uint256 amount);
    error ZeroAddress();

    constructor(EDCToken token_, address admin, uint256 maxRewardPerClaim_) EIP712("EdFi RewardMinter", "1") {
        if (address(token_) == address(0) || admin == address(0)) revert ZeroAddress();
        token = token_;
        maxRewardPerClaim = maxRewardPerClaim_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Pays a signed reward to `student`.
    function claim(address student, uint256 amount, bytes32 resultId, uint256 deadline, bytes calldata signature)
        external
        whenNotPaused
    {
        if (student == address(0)) revert ZeroAddress();
        if (amount == 0 || amount > maxRewardPerClaim) revert InvalidAmount(amount);
        if (block.timestamp > deadline) revert Expired(deadline);
        if (claimed[resultId]) revert AlreadyClaimed(resultId);

        address signer = ECDSA.recover(rewardDigest(student, amount, resultId, deadline), signature);
        if (!hasRole(ORACLE_ROLE, signer)) revert InvalidOracle(signer);

        claimed[resultId] = true;
        token.mint(student, amount);
        emit RewardClaimed(student, resultId, amount, signer);
    }

    /// @notice EIP-712 digest an oracle signs for a reward.
    function rewardDigest(address student, uint256 amount, bytes32 resultId, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(REWARD_TYPEHASH, student, amount, resultId, deadline)));
    }

    function setMaxRewardPerClaim(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxRewardPerClaim = value;
        emit MaxRewardUpdated(value);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
