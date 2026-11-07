const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

const EDC = (n) => ethers.parseUnits(String(n), 18);
const PERMIT_TYPES = { Permit: [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
] };

async function deployFundedCampusPay() {
  const [admin, student, attacker, merchantWallet] = await ethers.getSigners();
  const token = await ethers.deployContract('EDCToken', [admin.address]);
  const pay = await ethers.deployContract('CampusPay', [await token.getAddress(), admin.address]);
  const payAddress = await pay.getAddress();

  // Direct test funding isolates payment behavior from reward-claim validation.
  await token.grantRole(await token.MINTER_ROLE(), admin.address);
  await token.mint(student.address, EDC(100));
  await token.mint(attacker.address, EDC(100));
  await pay.addMerchant(merchantWallet.address, 'Campus Canteen');

  const domain = {
    name: 'EdFi Coin',
    version: '1',
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await token.getAddress(),
  };
  return { admin, student, attacker, merchantWallet, token, pay, payAddress, domain };
}

async function signPermit(f, owner, amount, deadline) {
  deadline = deadline ?? (await time.latest()) + 600;
  const nonce = await f.token.nonces(owner.address);
  const sig = ethers.Signature.from(await owner.signTypedData(f.domain, PERMIT_TYPES, {
    owner: owner.address, spender: f.payAddress, value: amount, nonce, deadline,
  }));
  return { deadline, sig };
}

const payWithPermit = (f, caller, merchantId, amount, orderId, { deadline, sig }) =>
  f.pay.connect(caller).payWithPermit(merchantId, amount, orderId, deadline, sig.v, sig.r, sig.s);

const frontRunPermit = (f, amount, { deadline, sig }) =>
  f.token.connect(f.attacker).permit(f.student.address, f.payAddress, amount, deadline, sig.v, sig.r, sig.s);

async function paymentState(f) {
  return {
    supply: await f.token.totalSupply(),
    studentBalance: await f.token.balanceOf(f.student.address),
    attackerBalance: await f.token.balanceOf(f.attacker.address),
    merchantBalance: await f.token.balanceOf(f.merchantWallet.address),
    contractBalance: await f.token.balanceOf(f.payAddress),
    studentAllowance: await f.token.allowance(f.student.address, f.payAddress),
    attackerAllowance: await f.token.allowance(f.attacker.address, f.payAddress),
    studentNonce: await f.token.nonces(f.student.address),
    attackerNonce: await f.token.nonces(f.attacker.address),
  };
}

describe('CampusPay adversarial permit and merchant authorization', () => {
  it('honors the intended payment after a third party submits the exact signed permit first', async () => {
    const f = await loadFixture(deployFundedCampusPay);
    const amount = EDC(20);
    const permit = await signPermit(f, f.student, amount);
    const before = await paymentState(f);

    await expect(frontRunPermit(f, amount, permit))
      .to.emit(f.token, 'Approval').withArgs(f.student.address, f.payAddress, amount);
    expect(await paymentState(f)).to.deep.equal({
      ...before, studentAllowance: amount, studentNonce: before.studentNonce + 1n,
    });

    const orderId = ethers.id('front-run-receipt');
    // The repeated permit fails, but its existing allowance must still fund the payment.
    await expect(payWithPermit(f, f.student, 1, amount, orderId, permit))
      .to.emit(f.pay, 'Payment').withArgs(1, f.student.address, amount, orderId);
    expect(await paymentState(f)).to.deep.equal({
      ...before,
      studentBalance: before.studentBalance - amount,
      merchantBalance: before.merchantBalance + amount,
      studentNonce: before.studentNonce + 1n,
    });
  });

  it('cannot replay a consumed exact-value permit, regardless of the receipt order id', async () => {
    const f = await loadFixture(deployFundedCampusPay);
    const amount = EDC(20);
    const permit = await signPermit(f, f.student, amount);
    const orderId = ethers.id('original-receipt');
    await payWithPermit(f, f.student, 1, amount, orderId, permit);
    const afterPayment = await paymentState(f);
    expect(afterPayment.studentAllowance).to.equal(0);
    expect(afterPayment.studentNonce).to.equal(1);

    for (const replayOrder of [orderId, ethers.id('different-receipt')]) {
      await expect(payWithPermit(f, f.student, 1, amount, replayOrder, permit))
        .to.be.revertedWithCustomError(f.token, 'ERC20InsufficientAllowance')
        .withArgs(f.payAddress, 0, amount);
      expect(await paymentState(f)).to.deep.equal(afterPayment);
    }
  });

  for (const kind of ['malformed', 'expired']) {
    for (const allowance of [0, 5]) {
      it(`rejects ${kind} permits with ${allowance} EDC allowance without changing token state`, async () => {
        const f = await loadFixture(deployFundedCampusPay);
        const amount = EDC(20);
        await f.token.connect(f.student).approve(f.payAddress, EDC(allowance));
        const permit = await signPermit(f, f.student, amount);
        if (kind === 'expired') {
          await time.increaseTo(permit.deadline + 1);
        } else {
          permit.sig = { v: 27, r: ethers.ZeroHash, s: ethers.ZeroHash };
        }
        const before = await paymentState(f);

        await expect(payWithPermit(f, f.student, 1, amount, ethers.id(kind), permit))
          .to.be.revertedWithCustomError(f.token, 'ERC20InsufficientAllowance')
          .withArgs(f.payAddress, EDC(allowance), amount);
        expect(await paymentState(f)).to.deep.equal(before);
      });
    }
  }

  const paymentFailures = [
    {
      name: 'an unknown merchant', merchantId: 2, amount: EDC(20), error: 'UnknownMerchant',
      repair: async (f) => f.pay.addMerchant(f.merchantWallet.address, 'Second Canteen'),
    },
    {
      name: 'an inactive merchant', merchantId: 1, amount: EDC(20), error: 'InactiveMerchant',
      prepare: async (f) => f.pay.updateMerchant(1, f.merchantWallet.address, false),
      repair: async (f) => f.pay.updateMerchant(1, f.merchantWallet.address, true),
    },
    {
      name: 'insufficient balance', merchantId: 1, amount: EDC(150), error: 'ERC20InsufficientBalance',
      repair: async (f) => f.token.mint(f.student.address, EDC(50)),
    },
  ];

  for (const scenario of paymentFailures) {
    it(`rolls back a valid permit when payment fails for ${scenario.name}`, async () => {
      const f = await loadFixture(deployFundedCampusPay);
      if (scenario.prepare) await scenario.prepare(f);
      const originalAllowance = EDC(5);
      await f.token.connect(f.student).approve(f.payAddress, originalAllowance);
      const permit = await signPermit(f, f.student, scenario.amount);
      const orderId = ethers.id(`rollback-${scenario.name}`);
      const before = await paymentState(f);
      const errorContract = scenario.error === 'ERC20InsufficientBalance' ? f.token : f.pay;
      const errorArgs = errorContract === f.token
        ? [f.student.address, before.studentBalance, scenario.amount]
        : [scenario.merchantId];

      await expect(payWithPermit(f, f.student, scenario.merchantId, scenario.amount, orderId, permit))
        .to.be.revertedWithCustomError(errorContract, scenario.error).withArgs(...errorArgs);
      expect(await paymentState(f)).to.deep.equal(before);

      await scenario.repair(f);
      const beforeRetry = await paymentState(f);
      // Reusing the same signature proves the failed transaction did not consume its nonce.
      await expect(payWithPermit(f, f.student, scenario.merchantId, scenario.amount, orderId, permit))
        .to.emit(f.pay, 'Payment').withArgs(scenario.merchantId, f.student.address, scenario.amount, orderId);
      expect(await paymentState(f)).to.deep.equal({
        ...beforeRetry,
        studentBalance: beforeRetry.studentBalance - scenario.amount,
        merchantBalance: beforeRetry.merchantBalance + scenario.amount,
        studentAllowance: 0n,
        studentNonce: beforeRetry.studentNonce + 1n,
      });
    });
  }

  for (const alreadySubmitted of [false, true]) {
    it(`cannot spend a victim's funds with their ${alreadySubmitted ? 'already-submitted' : 'unused'} permit`, async () => {
      const f = await loadFixture(deployFundedCampusPay);
      const amount = EDC(20);
      const permit = await signPermit(f, f.student, amount);
      if (alreadySubmitted) await frontRunPermit(f, amount, permit);
      const before = await paymentState(f);

      await expect(payWithPermit(f, f.attacker, 1, amount, ethers.id('stolen-permit'), permit))
        .to.be.revertedWithCustomError(f.token, 'ERC20InsufficientAllowance')
        .withArgs(f.payAddress, 0, amount);
      expect(await paymentState(f)).to.deep.equal(before);

      await payWithPermit(f, f.student, 1, amount, ethers.id('victim-payment'), permit);
      expect(await paymentState(f)).to.deep.equal({
        ...before,
        studentBalance: before.studentBalance - amount,
        merchantBalance: before.merchantBalance + amount,
        studentAllowance: 0n,
        studentNonce: 1n,
      });
    });
  }

  it('only charges the caller when their own allowance permits payment with a victim signature', async () => {
    const f = await loadFixture(deployFundedCampusPay);
    const amount = EDC(20);
    const permit = await signPermit(f, f.student, amount);
    await frontRunPermit(f, amount, permit);
    await f.token.connect(f.attacker).approve(f.payAddress, amount);
    const before = await paymentState(f);
    const orderId = ethers.id('caller-funded-receipt');

    await expect(payWithPermit(f, f.attacker, 1, amount, orderId, permit))
      .to.emit(f.pay, 'Payment').withArgs(1, f.attacker.address, amount, orderId);
    expect(await paymentState(f)).to.deep.equal({
      ...before,
      attackerBalance: before.attackerBalance - amount,
      merchantBalance: before.merchantBalance + amount,
      attackerAllowance: 0n,
    });
  });

  it('allows separate authorized payments to reuse receipt metadata', async () => {
    const f = await loadFixture(deployFundedCampusPay);
    const amount = EDC(20);
    const orderId = ethers.id('shared-receipt-metadata');
    const before = await paymentState(f);
    for (let payment = 0; payment < 2; payment += 1) {
      const permit = await signPermit(f, f.student, amount);
      await expect(payWithPermit(f, f.student, 1, amount, orderId, permit))
        .to.emit(f.pay, 'Payment').withArgs(1, f.student.address, amount, orderId);
    }
    expect(await paymentState(f)).to.deep.equal({
      ...before,
      studentBalance: before.studentBalance - 2n * amount,
      merchantBalance: before.merchantBalance + 2n * amount,
      studentNonce: before.studentNonce + 2n,
    });
  });

  for (const change of ['redirect payout', 'deactivate merchant']) {
    it(`does not let an unauthorized caller ${change}`, async () => {
      const f = await loadFixture(deployFundedCampusPay);
      const before = await paymentState(f);
      const merchantBefore = await f.pay.merchants(1);
      const countBefore = await f.pay.merchantCount();
      const payout = change === 'redirect payout' ? f.attacker.address : f.merchantWallet.address;
      const active = change !== 'deactivate merchant';

      await expect(f.pay.connect(f.attacker).updateMerchant(1, payout, active))
        .to.be.revertedWithCustomError(f.pay, 'AccessControlUnauthorizedAccount')
        .withArgs(f.attacker.address, await f.pay.MERCHANT_MANAGER_ROLE());
      expect(await f.pay.merchants(1)).to.deep.equal(merchantBefore);
      expect(await f.pay.merchantCount()).to.equal(countBefore);
      expect(await paymentState(f)).to.deep.equal(before);
    });
  }
});
