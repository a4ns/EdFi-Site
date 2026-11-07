// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title CampusPay
/// @notice Zero-fee EDC payments to verified campus merchants (canteen, dormitory office,
///         merch store). Students pay with an allowance or a one-step EIP-2612 permit.
contract CampusPay is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MERCHANT_MANAGER_ROLE = keccak256("MERCHANT_MANAGER_ROLE");

    struct Merchant {
        address payout;
        bool active;
        string name;
    }

    IERC20 public immutable edc;
    uint256 public merchantCount;
    mapping(uint256 merchantId => Merchant) public merchants;

    event MerchantAdded(uint256 indexed merchantId, address payout, string name);
    event MerchantUpdated(uint256 indexed merchantId, address payout, bool active);
    event Payment(uint256 indexed merchantId, address indexed payer, uint256 amount, bytes32 indexed orderId);

    error UnknownMerchant(uint256 merchantId);
    error InactiveMerchant(uint256 merchantId);
    error InvalidAmount();
    error ZeroAddress();

    constructor(IERC20 edc_, address admin) {
        if (address(edc_) == address(0) || admin == address(0)) revert ZeroAddress();
        edc = edc_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MERCHANT_MANAGER_ROLE, admin);
    }

    function addMerchant(address payout, string calldata name)
        external
        onlyRole(MERCHANT_MANAGER_ROLE)
        returns (uint256 merchantId)
    {
        if (payout == address(0)) revert ZeroAddress();
        merchantId = ++merchantCount;
        merchants[merchantId] = Merchant({payout: payout, active: true, name: name});
        emit MerchantAdded(merchantId, payout, name);
    }

    function updateMerchant(uint256 merchantId, address payout, bool active) external onlyRole(MERCHANT_MANAGER_ROLE) {
        if (merchantId == 0 || merchantId > merchantCount) revert UnknownMerchant(merchantId);
        if (payout == address(0)) revert ZeroAddress();
        merchants[merchantId].payout = payout;
        merchants[merchantId].active = active;
        emit MerchantUpdated(merchantId, payout, active);
    }

    /// @notice Pays `amount` EDC to a merchant. Requires a prior allowance to this contract.
    function pay(uint256 merchantId, uint256 amount, bytes32 orderId) public {
        if (amount == 0) revert InvalidAmount();
        Merchant storage m = merchants[merchantId];
        if (m.payout == address(0)) revert UnknownMerchant(merchantId);
        if (!m.active) revert InactiveMerchant(merchantId);
        edc.safeTransferFrom(msg.sender, m.payout, amount);
        emit Payment(merchantId, msg.sender, amount, orderId);
    }

    /// @notice Approve and pay in one transaction using an EIP-2612 permit signature.
    function payWithPermit(
        uint256 merchantId,
        uint256 amount,
        bytes32 orderId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // A front-run permit must not block the payment, so ignore failure if allowance is already set.
        try IERC20Permit(address(edc)).permit(msg.sender, address(this), amount, deadline, v, r, s) {} catch {}
        pay(merchantId, amount, orderId);
    }
}
