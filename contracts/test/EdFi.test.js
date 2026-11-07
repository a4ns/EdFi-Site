const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

const EDC = (n) => ethers.parseUnits(String(n), 18);
const id = (s) => ethers.id(s);

async function deploy() {
  const [admin, oracle, student, other, merchantWallet, relayer] = await ethers.getSigners();
  const token = await ethers.deployContract('EDCToken', [admin.address]);
  const minter = await ethers.deployContract('RewardMinter', [await token.getAddress(), admin.address, EDC(1000)]);
  const pay = await ethers.deployContract('CampusPay', [await token.getAddress(), admin.address]);
  await token.grantRole(await token.MINTER_ROLE(), await minter.getAddress());
  await minter.grantRole(await minter.ORACLE_ROLE(), oracle.address);

  const domain = {
    name: 'EdFi RewardMinter',
    version: '1',
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await minter.getAddress(),
  };
  const types = { Reward: [
    { name: 'student', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'resultId', type: 'bytes32' },
    { name: 'deadline', type: 'uint256' },
  ] };
  const sign = async (signer, reward) => signer.signTypedData(domain, types, reward);
  const reward = async (overrides = {}) => ({
    student: student.address,
    amount: EDC(50),
    resultId: id('kozybayev/2026/macroeconomics/exam/210404'),
    deadline: (await time.latest()) + 3600,
    ...overrides,
  });
  return { admin, oracle, student, other, merchantWallet, relayer, token, minter, pay, sign, reward };
}

const claim = (minter, r, sig, from) =>
  (from ? minter.connect(from) : minter).claim(r.student, r.amount, r.resultId, r.deadline, sig);

describe('EDCToken', () => {
  it('rejects a zero admin at deployment', async () => {
    const Token = await ethers.getContractFactory('EDCToken');
    await expect(Token.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(Token, 'ZeroAddress');
  });

  it('has EdFi metadata and starts with zero supply', async () => {
    const { token } = await loadFixture(deploy);
    expect(await token.name()).to.equal('EdFi Coin');
    expect(await token.symbol()).to.equal('EDC');
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(0);
  });

  it('only lets MINTER_ROLE mint', async () => {
    const { token, other } = await loadFixture(deploy);
    await expect(token.connect(other).mint(other.address, 1))
      .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount');
  });
});

describe('RewardMinter', () => {
  it('mints a reward signed by an allow-listed oracle', async () => {
    const { minter, token, oracle, student, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    await expect(claim(minter, r, await sign(oracle, r)))
      .to.emit(minter, 'RewardClaimed').withArgs(student.address, r.resultId, r.amount, oracle.address);
    expect(await token.balanceOf(student.address)).to.equal(EDC(50));
    expect(await minter.claimed(r.resultId)).to.equal(true);
  });

  it('lets a relayer submit the claim but always pays the student', async () => {
    const { minter, token, oracle, student, relayer, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    await claim(minter, r, await sign(oracle, r), relayer);
    expect(await token.balanceOf(student.address)).to.equal(EDC(50));
    expect(await token.balanceOf(relayer.address)).to.equal(0);
  });

  it('rejects paying the same result twice', async () => {
    const { minter, oracle, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    const sig = await sign(oracle, r);
    await claim(minter, r, sig);
    await expect(claim(minter, r, sig)).to.be.revertedWithCustomError(minter, 'AlreadyClaimed').withArgs(r.resultId);
  });

  it('rejects signatures from keys that are not oracles', async () => {
    const { minter, other, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    await expect(claim(minter, r, await sign(other, r)))
      .to.be.revertedWithCustomError(minter, 'InvalidOracle').withArgs(other.address);
  });

  it('rejects a valid signature redirected to another wallet', async () => {
    const { minter, oracle, other, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    const sig = await sign(oracle, r);
    await expect(claim(minter, { ...r, student: other.address }, sig)).to.be.revertedWithCustomError(minter, 'InvalidOracle');
  });

  it('rejects a tampered amount', async () => {
    const { minter, oracle, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    const sig = await sign(oracle, r);
    await expect(claim(minter, { ...r, amount: EDC(500) }, sig)).to.be.revertedWithCustomError(minter, 'InvalidOracle');
  });

  it('rejects a claim one second after its deadline', async () => {
    const { minter, oracle, sign, reward } = await loadFixture(deploy);
    const r = await reward();
    const sig = await sign(oracle, r);
    await time.setNextBlockTimestamp(r.deadline + 1);
    await expect(claim(minter, r, sig)).to.be.revertedWithCustomError(minter, 'Expired').withArgs(r.deadline);
  });

  it('caps a single reward and rejects zero amounts', async () => {
    const { minter, oracle, sign, reward } = await loadFixture(deploy);
    const big = await reward({ amount: EDC(1001) });
    await expect(claim(minter, big, await sign(oracle, big))).to.be.revertedWithCustomError(minter, 'InvalidAmount');
    const zero = await reward({ amount: 0n, resultId: id('zero') });
    await expect(claim(minter, zero, await sign(oracle, zero))).to.be.revertedWithCustomError(minter, 'InvalidAmount');
  });

  it('stops honoring an oracle once its role is revoked', async () => {
    const { minter, admin, oracle, sign, reward } = await loadFixture(deploy);
    await minter.connect(admin).revokeRole(await minter.ORACLE_ROLE(), oracle.address);
    const r = await reward();
    await expect(claim(minter, r, await sign(oracle, r))).to.be.revertedWithCustomError(minter, 'InvalidOracle');
  });

  it('can be paused by the pauser and only by the pauser', async () => {
    const { minter, admin, other, oracle, sign, reward } = await loadFixture(deploy);
    await expect(minter.connect(other).pause()).to.be.revertedWithCustomError(minter, 'AccessControlUnauthorizedAccount');
    await minter.connect(admin).pause();
    const r = await reward();
    await expect(claim(minter, r, await sign(oracle, r))).to.be.revertedWithCustomError(minter, 'EnforcedPause');
    await minter.connect(admin).unpause();
    await claim(minter, r, await sign(oracle, r));
  });

  it('lets only the admin change the per-claim cap', async () => {
    const { minter, admin, other } = await loadFixture(deploy);
    await expect(minter.connect(other).setMaxRewardPerClaim(1)).to.be.revertedWithCustomError(minter, 'AccessControlUnauthorizedAccount');
    await expect(minter.connect(admin).setMaxRewardPerClaim(EDC(300))).to.emit(minter, 'MaxRewardUpdated').withArgs(EDC(300));
  });

  it('rejects the zero address as student, token or admin', async () => {
    const { minter, token, admin, oracle, sign, reward } = await loadFixture(deploy);
    const r = await reward({ student: ethers.ZeroAddress });
    await expect(claim(minter, r, await sign(oracle, r))).to.be.revertedWithCustomError(minter, 'ZeroAddress');
    const Minter = await ethers.getContractFactory('RewardMinter');
    await expect(Minter.deploy(ethers.ZeroAddress, admin.address, 1)).to.be.revertedWithCustomError(Minter, 'ZeroAddress');
    await expect(Minter.deploy(await token.getAddress(), ethers.ZeroAddress, 1)).to.be.revertedWithCustomError(Minter, 'ZeroAddress');
  });
});

describe('CampusPay', () => {
  async function funded() {
    const f = await loadFixture(deploy);
    const r = await f.reward({ amount: EDC(100) });
    await claim(f.minter, r, await f.sign(f.oracle, r));
    await f.pay.connect(f.admin).addMerchant(f.merchantWallet.address, 'Campus Canteen');
    return f;
  }

  it('pays a merchant with zero fees and emits a receipt event', async () => {
    const { pay, token, student, merchantWallet } = await funded();
    await token.connect(student).approve(await pay.getAddress(), EDC(15));
    const order = id('order-1');
    await expect(pay.connect(student).pay(1, EDC(15), order))
      .to.emit(pay, 'Payment').withArgs(1, student.address, EDC(15), order);
    expect(await token.balanceOf(merchantWallet.address)).to.equal(EDC(15));
    expect(await token.balanceOf(student.address)).to.equal(EDC(85));
  });

  it('supports one-step payment with an EIP-2612 permit', async () => {
    const { pay, token, student, merchantWallet } = await funded();
    const deadline = (await time.latest()) + 600;
    const domain = { name: 'EdFi Coin', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await token.getAddress() };
    const types = { Permit: [
      { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' },
    ] };
    const sig = ethers.Signature.from(await student.signTypedData(domain, types, {
      owner: student.address, spender: await pay.getAddress(), value: EDC(20), nonce: await token.nonces(student.address), deadline,
    }));
    await pay.connect(student).payWithPermit(1, EDC(20), id('order-2'), deadline, sig.v, sig.r, sig.s);
    expect(await token.balanceOf(merchantWallet.address)).to.equal(EDC(20));
  });

  it('rejects unknown and deactivated merchants', async () => {
    const { pay, token, admin, student, merchantWallet } = await funded();
    await token.connect(student).approve(await pay.getAddress(), EDC(50));
    await expect(pay.connect(student).pay(7, EDC(1), id('x'))).to.be.revertedWithCustomError(pay, 'UnknownMerchant');
    await pay.connect(admin).updateMerchant(1, merchantWallet.address, false);
    await expect(pay.connect(student).pay(1, EDC(1), id('y'))).to.be.revertedWithCustomError(pay, 'InactiveMerchant');
  });

  it('rejects zero payments and payments without allowance', async () => {
    const { pay, token, student } = await funded();
    await expect(pay.connect(student).pay(1, 0, id('z'))).to.be.revertedWithCustomError(pay, 'InvalidAmount');
    await expect(pay.connect(student).pay(1, EDC(5), id('w'))).to.be.revertedWithCustomError(token, 'ERC20InsufficientAllowance');
  });

  it('lets only merchant managers register merchants', async () => {
    const { pay, other } = await funded();
    await expect(pay.connect(other).addMerchant(other.address, 'Fake shop'))
      .to.be.revertedWithCustomError(pay, 'AccessControlUnauthorizedAccount');
  });

  it('validates merchant ids and payout addresses', async () => {
    const { pay, admin, merchantWallet } = await funded();
    await expect(pay.connect(admin).addMerchant(ethers.ZeroAddress, 'Nowhere')).to.be.revertedWithCustomError(pay, 'ZeroAddress');
    await expect(pay.connect(admin).updateMerchant(0, merchantWallet.address, true)).to.be.revertedWithCustomError(pay, 'UnknownMerchant');
    await expect(pay.connect(admin).updateMerchant(2, merchantWallet.address, true)).to.be.revertedWithCustomError(pay, 'UnknownMerchant');
    await expect(pay.connect(admin).updateMerchant(1, ethers.ZeroAddress, true)).to.be.revertedWithCustomError(pay, 'ZeroAddress');
    await expect(pay.connect(admin).updateMerchant(1, admin.address, true)).to.emit(pay, 'MerchantUpdated').withArgs(1, admin.address, true);
  });

  it('falls back to an existing allowance when a permit is invalid', async () => {
    const { pay, token, student, merchantWallet } = await funded();
    await token.connect(student).approve(await pay.getAddress(), EDC(10));
    const garbage = ethers.ZeroHash;
    await pay.connect(student).payWithPermit(1, EDC(10), id('order-3'), 0, 27, garbage, garbage);
    expect(await token.balanceOf(merchantWallet.address)).to.equal(EDC(10));
  });

  it('rejects zero token or admin at deployment', async () => {
    const { token, admin } = await funded();
    const Pay = await ethers.getContractFactory('CampusPay');
    await expect(Pay.deploy(ethers.ZeroAddress, admin.address)).to.be.revertedWithCustomError(Pay, 'ZeroAddress');
    await expect(Pay.deploy(await token.getAddress(), ethers.ZeroAddress)).to.be.revertedWithCustomError(Pay, 'ZeroAddress');
  });
});
