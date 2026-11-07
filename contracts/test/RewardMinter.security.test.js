const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

const EDC = (value) => ethers.parseEther(String(value));
const TYPES = { Reward: [
  { name: 'student', type: 'address' },
  { name: 'amount', type: 'uint256' },
  { name: 'resultId', type: 'bytes32' },
  { name: 'deadline', type: 'uint256' },
] };

async function deploy() {
  const [admin, oracle, student, other] = await ethers.getSigners();
  const token = await ethers.deployContract('EDCToken', [admin.address]);
  const minter = await ethers.deployContract('RewardMinter', [await token.getAddress(), admin.address, EDC(1000)]);
  await token.grantRole(await token.MINTER_ROLE(), await minter.getAddress());
  await minter.grantRole(await minter.ORACLE_ROLE(), oracle.address);
  const domain = {
    name: 'EdFi RewardMinter',
    version: '1',
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await minter.getAddress(),
  };
  const reward = {
    student: student.address,
    amount: EDC(50),
    resultId: ethers.id('security/academic-result/1'),
    deadline: (await time.latest()) + 3600,
  };
  const sign = (value = reward, domainOverrides = {}) => oracle.signTypedData({ ...domain, ...domainOverrides }, TYPES, value);
  return { admin, oracle, student, other, token, minter, domain, reward, sign };
}

const claim = (minter, reward, signature) => minter.claim(
  reward.student, reward.amount, reward.resultId, reward.deadline, signature,
);

async function expectUnclaimed(token, minter, reward) {
  expect(await minter.claimed(reward.resultId)).to.equal(false);
  expect(await token.balanceOf(reward.student)).to.equal(0);
  expect(await token.totalSupply()).to.equal(0);
}

describe('RewardMinter security boundaries', () => {
  it('matches the off-chain EIP-712 digest', async () => {
    const { minter, domain, reward } = await loadFixture(deploy);
    expect(await minter.rewardDigest(reward.student, reward.amount, reward.resultId, reward.deadline))
      .to.equal(ethers.TypedDataEncoder.hash(domain, TYPES, reward));
  });

  it('rejects a signature for another chain without consuming the result', async () => {
    const { token, minter, domain, reward, sign } = await loadFixture(deploy);
    const signature = await sign(reward, { chainId: domain.chainId + 1n });
    await expect(claim(minter, reward, signature)).to.be.revertedWithCustomError(minter, 'InvalidOracle');
    await expectUnclaimed(token, minter, reward);
  });

  it('rejects a signature from another RewardMinter deployment', async () => {
    const { admin, oracle, token, minter, reward, sign } = await loadFixture(deploy);
    const otherMinter = await ethers.deployContract('RewardMinter', [await token.getAddress(), admin.address, EDC(1000)]);
    await token.grantRole(await token.MINTER_ROLE(), await otherMinter.getAddress());
    await otherMinter.grantRole(await otherMinter.ORACLE_ROLE(), oracle.address);
    await expect(claim(otherMinter, reward, await sign()))
      .to.be.revertedWithCustomError(otherMinter, 'InvalidOracle');
    await expectUnclaimed(token, otherMinter, reward);
    await expectUnclaimed(token, minter, reward);
  });

  for (const field of ['resultId', 'deadline']) {
    it(`rejects a modified ${field} without consuming either result`, async () => {
      const { token, minter, reward, sign } = await loadFixture(deploy);
      const modified = { ...reward, [field]: field === 'resultId' ? ethers.id('another-result') : reward.deadline + 600 };
      await expect(claim(minter, modified, await sign()))
        .to.be.revertedWithCustomError(minter, 'InvalidOracle');
      await expectUnclaimed(token, minter, modified);
      await expectUnclaimed(token, minter, reward);
    });
  }

  for (const signature of ['0x', '0x1234']) {
    it(`rejects a malformed ${ethers.dataLength(signature)}-byte signature`, async () => {
      const { token, minter, reward } = await loadFixture(deploy);
      await expect(claim(minter, reward, signature))
        .to.be.revertedWithCustomError(minter, 'ECDSAInvalidSignatureLength')
        .withArgs(ethers.dataLength(signature));
      await expectUnclaimed(token, minter, reward);
    });
  }

  it('rejects an invalid 65-byte signature', async () => {
    const { token, minter, reward } = await loadFixture(deploy);
    const signature = ethers.hexlify(new Uint8Array(65));
    await expect(claim(minter, reward, signature)).to.be.revertedWithCustomError(minter, 'ECDSAInvalidSignature');
    await expectUnclaimed(token, minter, reward);
  });

  it('rejects a malleable high-s signature', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const signature = ethers.Signature.from(await sign());
    const curveOrder = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    const highS = ethers.toBeHex(curveOrder - BigInt(signature.s), 32);
    const malleable = ethers.concat([signature.r, highS, ethers.toBeHex(signature.v === 27 ? 28 : 27, 1)]);
    await expect(claim(minter, reward, malleable))
      .to.be.revertedWithCustomError(minter, 'ECDSAInvalidSignatureS').withArgs(highS);
    await expectUnclaimed(token, minter, reward);
  });

  it('accepts exactly the per-claim cap and rejects one wei above it', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const cap = await minter.maxRewardPerClaim();
    const over = { ...reward, amount: cap + 1n };
    await expect(claim(minter, over, await sign(over)))
      .to.be.revertedWithCustomError(minter, 'InvalidAmount').withArgs(cap + 1n);
    await expectUnclaimed(token, minter, over);
    const exact = { ...reward, amount: cap };
    await claim(minter, exact, await sign(exact));
    expect(await token.balanceOf(reward.student)).to.equal(cap);
    expect(await minter.claimed(reward.resultId)).to.equal(true);
  });

  it('applies cap changes to pending signatures without burning rejected results', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const signature = await sign();
    await minter.setMaxRewardPerClaim(reward.amount - 1n);
    await expect(claim(minter, reward, signature))
      .to.be.revertedWithCustomError(minter, 'InvalidAmount').withArgs(reward.amount);
    await expectUnclaimed(token, minter, reward);
    await minter.setMaxRewardPerClaim(reward.amount);
    await claim(minter, reward, signature);
    expect(await token.balanceOf(reward.student)).to.equal(reward.amount);
  });

  it('allows a zero cap to disable positive rewards and a later cap increase to restore them', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const signature = await sign();
    await minter.setMaxRewardPerClaim(0);
    expect(await minter.maxRewardPerClaim()).to.equal(0);
    await expect(claim(minter, reward, signature))
      .to.be.revertedWithCustomError(minter, 'InvalidAmount').withArgs(reward.amount);
    await expectUnclaimed(token, minter, reward);
    await minter.setMaxRewardPerClaim(reward.amount);
    await claim(minter, reward, signature);
    expect(await token.balanceOf(reward.student)).to.equal(reward.amount);
  });

  it('accepts a claim at its exact deadline', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const signature = await sign();
    await time.setNextBlockTimestamp(reward.deadline);
    await claim(minter, reward, signature);
    expect(await token.balanceOf(reward.student)).to.equal(reward.amount);
  });

  it('rolls back the claimed flag when the token rejects minting and permits a later retry', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const signature = await sign();
    const minterRole = await token.MINTER_ROLE();
    const minterAddress = await minter.getAddress();
    await token.revokeRole(minterRole, minterAddress);
    await expect(claim(minter, reward, signature))
      .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount').withArgs(minterAddress, minterRole);
    await expectUnclaimed(token, minter, reward);
    await token.grantRole(minterRole, minterAddress);
    await claim(minter, reward, signature);
    expect(await minter.claimed(reward.resultId)).to.equal(true);
    expect(await token.balanceOf(reward.student)).to.equal(reward.amount);
    expect(await token.totalSupply()).to.equal(reward.amount);
  });

  it('rejects a signature issued before the oracle role was revoked', async () => {
    const { oracle, token, minter, reward, sign } = await loadFixture(deploy);
    const signature = await sign();
    await minter.revokeRole(await minter.ORACLE_ROLE(), oracle.address);
    await expect(claim(minter, reward, signature))
      .to.be.revertedWithCustomError(minter, 'InvalidOracle').withArgs(oracle.address);
    await expectUnclaimed(token, minter, reward);
  });

  it('does not treat the per-claim cap as an aggregate issuance limit', async () => {
    const { token, minter, reward, sign } = await loadFixture(deploy);
    const cap = await minter.maxRewardPerClaim();
    for (const resultId of [ethers.id('independent-result/1'), ethers.id('independent-result/2')]) {
      const value = { ...reward, resultId, amount: cap };
      await claim(minter, value, await sign(value));
    }
    expect(await token.totalSupply()).to.equal(cap * 2n);
  });
});

describe('Token and reward role configuration', () => {
  it('assigns only the configured operational roles and leaves the token admin unable to mint directly', async () => {
    const { admin, oracle, student, token, minter } = await loadFixture(deploy);
    const minterRole = await token.MINTER_ROLE();
    expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await token.hasRole(minterRole, await minter.getAddress())).to.equal(true);
    for (const account of [admin, oracle, student]) {
      expect(await token.hasRole(minterRole, account.address)).to.equal(false);
    }
    expect(await minter.hasRole(await minter.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await minter.hasRole(await minter.PAUSER_ROLE(), admin.address)).to.equal(true);
    expect(await minter.hasRole(await minter.ORACLE_ROLE(), oracle.address)).to.equal(true);
    expect(await minter.hasRole(await minter.ORACLE_ROLE(), admin.address)).to.equal(false);
    await expect(token.mint(student.address, 1))
      .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount').withArgs(admin.address, minterRole);
  });

  it('prevents operational roles from granting themselves administrative or minting authority', async () => {
    const { oracle, token, minter } = await loadFixture(deploy);
    const adminRole = await minter.DEFAULT_ADMIN_ROLE();
    for (const role of [adminRole, await minter.ORACLE_ROLE(), await minter.PAUSER_ROLE()]) {
      await expect(minter.connect(oracle).grantRole(role, oracle.address))
        .to.be.revertedWithCustomError(minter, 'AccessControlUnauthorizedAccount').withArgs(oracle.address, adminRole);
    }
    await expect(token.connect(oracle).grantRole(await token.MINTER_ROLE(), oracle.address))
      .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount').withArgs(oracle.address, await token.DEFAULT_ADMIN_ROLE());
  });

  it('requires PAUSER_ROLE to unpause as well as to pause', async () => {
    const { oracle, minter } = await loadFixture(deploy);
    await minter.pause();
    await expect(minter.connect(oracle).unpause())
      .to.be.revertedWithCustomError(minter, 'AccessControlUnauthorizedAccount').withArgs(oracle.address, await minter.PAUSER_ROLE());
    expect(await minter.paused()).to.equal(true);
  });
});
