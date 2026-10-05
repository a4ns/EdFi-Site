# EdFi smart contracts

Solidity contracts for the EdFi testnet pilot on BNB Smart Chain: the EDC token, an oracle-verified reward minter, and zero-fee campus payments.

> [!NOTE]
> **Status:** written and tested locally, with 100% line coverage enforced by the test workflow. **Not deployed yet.** BSC testnet addresses will be listed here after the first deployment. Tests and coverage are not a security audit.

## Architecture

```
 University systems                      Student wallet                 Campus merchant
 (LMS, registrar, check-in)                    │                              ▲
        │ signs result (EIP-712)               │ claim(sig)                   │ EDC
        ▼                                      ▼                              │
  Oracle key ──── allow-listed in ───▶  RewardMinter ── mint ──▶ EDCToken ── CampusPay.pay()
```

| Contract | What it does |
|---|---|
| [`EDCToken`](src/EDCToken.sol) | BEP-20 token "EdFi Coin" (EDC), 18 decimals, no pre-mint. Only addresses with `MINTER_ROLE` can mint. Supports EIP-2612 `permit` for gasless approvals. |
| [`RewardMinter`](src/RewardMinter.sol) | Mints EDC only against a result signed by an allow-listed university oracle. Each result id is paid once. Signatures expire, rewards are capped per claim, and minting can be paused. |
| [`CampusPay`](src/CampusPay.sol) | Registry of verified campus merchants and zero-fee EDC payments to them, with an order id in every `Payment` event for receipts. Supports one-step pay with a permit. |

## Security model

- **Oracle-authorized rewards.** `RewardMinter` mints only when `ECDSA.recover` of the EIP-712 `Reward(student, amount, resultId, deadline)` digest is an address currently holding `ORACLE_ROLE`. The contract trusts the oracle to verify the underlying academic result; it does not inspect university records itself.
- **Replay protection.** `resultId` (for example a hash of `university/term/course/exam/studentId`) can be claimed once. The EIP-712 domain binds signatures to this chain and this contract.
- **Bound to the student.** Anyone (for example a gas relayer) can submit a claim, but tokens always go to the signed `student` address.
- **Per-claim limit, not an issuance budget.** `maxRewardPerClaim` bounds one claim only. A compromised oracle can sign many distinct result IDs, so this cap does not bound aggregate damage. There is no total-supply, per-oracle, per-student or time-window issuance budget. The admin can revoke the oracle and `PAUSER_ROLE` can pause claims. Cap changes apply when a claim is submitted, including already-signed rewards; a zero cap rejects every positive reward.
- **Role configuration is part of the trust model.** The deploy script grants the token's `MINTER_ROLE` only to `RewardMinter`, but the token admin can grant it to other addresses and bypass oracle-verified issuance. The admin can also replace oracles and assign pausers or merchant managers. Do not grant extra token minters if every issuance must pass reward verification. All three contracts reject a zero admin at deployment; protect and migrate admin roles to a multisig before a real pilot.
- **Permit fallback and payment receipts.** `payWithPermit` tolerates a failed or already-submitted permit, then requires a sufficient existing allowance from the caller. An exact-value permit is consumed by its payment; replaying that signature alone cannot pay again. A fresh allowance can authorize another payment. `orderId` is receipt metadata, not on-chain payment deduplication; clients must prevent unintended duplicate submissions.
- Built on OpenZeppelin Contracts 5 (`ERC20Permit`, `AccessControl`, `Pausable`, `EIP712`, `SafeERC20`). Not audited.

## Run the tests

Use Node.js 22.12+ (22.x) or 24.x. CI is configured to test both major versions.

```bash
cd contracts
npm ci
npm test            # contract behavior and adversarial regression tests
npm run coverage    # report + a failing exit code if project line coverage is below 100%
npm run coverage:check # check the existing coverage.json report only
```

The suite covers signature domain separation and payload tampering, malformed signatures, deadline and cap boundaries, role revocation, rollback after failed minting, real permit front-running, exhausted-allowance replay and atomic payment failures. Coverage describes `src/` contracts, not imported OpenZeppelin code or all possible attacks. The coverage gate uses the Istanbul checker already included by `solidity-coverage`; no extra dependency is required.

## Deploy to BSC testnet

1. Create a fresh wallet used only for testing and get test BNB from the [BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet).
2. `cp .env.example .env` and fill in `PRIVATE_KEY`. Set `ORACLE_ADDRESS` to the intended test oracle and optionally set `BSCSCAN_API_KEY` for verification. Leaving the oracle unset reuses the deployer, which is suitable only for a local demonstration.
3. Dry run on the local network, then deploy:

   ```bash
   npx hardhat run scripts/deploy.js   # local in-memory chain
   npm run deploy:testnet              # BNB Smart Chain testnet (chainId 97)
   ```

The script deploys all three contracts, gives `MINTER_ROLE` to `RewardMinter`, gives `ORACLE_ROLE` to the oracle, registers three sample merchants, and prints the addresses plus the `hardhat verify` commands.

The default setup is a local demonstration: the deployer retains all admin roles, the pauser and merchant-manager roles, and receives all sample merchant payouts. Before a real campus pilot, configure separate oracle and merchant wallets, agree on issuance and duplicate-payment policies, and move administrative control to the intended multisig. The current script does not perform those operational steps.

Never commit `.env`; it is git-ignored.
