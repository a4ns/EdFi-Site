# EdFi smart contracts

Solidity contracts for the EdFi testnet pilot on BNB Smart Chain: the EDC token, an oracle-verified reward minter, and zero-fee campus payments.

> [!NOTE]
> **Status:** written and tested locally (22 tests, 100% line coverage). **Not deployed yet.** BSC testnet addresses will be listed here after the first deployment.

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

- **No self-reported data.** EDC is minted only when `ECDSA.recover` of the EIP-712 `Reward(student, amount, resultId, deadline)` digest is an address holding `ORACLE_ROLE`.
- **Replay protection.** `resultId` (for example a hash of `university/term/course/exam/studentId`) can be claimed once. The EIP-712 domain binds signatures to this chain and this contract.
- **Bound to the student.** Anyone (for example a gas relayer) can submit a claim, but tokens always go to the signed `student` address.
- **Blast-radius limits.** `maxRewardPerClaim` caps the damage from a leaked oracle key; the admin can revoke the oracle and `PAUSER_ROLE` can pause minting.
- **Least privilege.** The token's only minter is the `RewardMinter` contract. For the pilot, admin roles should move to a multisig.
- Built on OpenZeppelin Contracts 5 (`ERC20Permit`, `AccessControl`, `Pausable`, `EIP712`, `SafeERC20`). Not audited.

## Run the tests

Requires Node.js 20+.

```bash
cd contracts
npm install
npm test            # 22 tests
npm run coverage    # line and branch coverage report
```

## Deploy to BSC testnet

1. Create a fresh wallet used only for testing and get test BNB from the [BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet).
2. `cp .env.example .env` and fill in `PRIVATE_KEY`. Optionally set `ORACLE_ADDRESS` (defaults to the deployer, which is fine only for testing) and `BSCSCAN_API_KEY` for verification.
3. Dry run on the local network, then deploy:

   ```bash
   npx hardhat run scripts/deploy.js   # local in-memory chain
   npm run deploy:testnet              # BNB Smart Chain testnet (chainId 97)
   ```

The script deploys all three contracts, gives `MINTER_ROLE` to `RewardMinter`, gives `ORACLE_ROLE` to the oracle, registers three sample merchants, and prints the addresses plus the `hardhat verify` commands.

Never commit `.env`; it is git-ignored.
