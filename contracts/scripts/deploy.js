// Deploys EDCToken, RewardMinter and CampusPay, wires up roles and registers sample merchants.
//
//   npx hardhat run scripts/deploy.js                        # local in-memory network (dry run)
//   npm run deploy:testnet                                   # BNB Smart Chain testnet (needs .env)

const hre = require('hardhat');

const { ethers, network } = hre;

const MAX_REWARD_PER_CLAIM = ethers.parseEther('1000');
const SAMPLE_MERCHANTS = ['Main canteen', 'Dormitory office', 'Campus merch store'];

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error('No deployer account. Set PRIVATE_KEY in contracts/.env');

  const oracle = process.env.ORACLE_ADDRESS || deployer.address;
  if (!ethers.isAddress(oracle)) throw new Error(`ORACLE_ADDRESS is not a valid address: ${oracle}`);

  console.log(`Network:  ${network.name} (chainId ${network.config.chainId ?? 'local'})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Oracle:   ${oracle}${oracle === deployer.address ? ' (deployer, testing only)' : ''}\n`);

  const token = await ethers.deployContract('EDCToken', [deployer.address]);
  await token.waitForDeployment();

  const minter = await ethers.deployContract('RewardMinter', [
    await token.getAddress(),
    deployer.address,
    MAX_REWARD_PER_CLAIM,
  ]);
  await minter.waitForDeployment();

  const pay = await ethers.deployContract('CampusPay', [await token.getAddress(), deployer.address]);
  await pay.waitForDeployment();

  await (await token.grantRole(await token.MINTER_ROLE(), await minter.getAddress())).wait();
  await (await minter.grantRole(await minter.ORACLE_ROLE(), oracle)).wait();

  // Sample merchants pay out to the deployer until real merchant wallets exist.
  for (const name of SAMPLE_MERCHANTS) {
    await (await pay.addMerchant(deployer.address, name)).wait();
  }

  const addresses = {
    EDCToken: await token.getAddress(),
    RewardMinter: await minter.getAddress(),
    CampusPay: await pay.getAddress(),
  };
  console.table(addresses);

  if (network.name === 'bscTestnet') {
    console.log('\nVerify on BscScan:');
    console.log(`  npx hardhat verify --network bscTestnet ${addresses.EDCToken} ${deployer.address}`);
    console.log(`  npx hardhat verify --network bscTestnet ${addresses.RewardMinter} ${addresses.EDCToken} ${deployer.address} ${MAX_REWARD_PER_CLAIM}`);
    console.log(`  npx hardhat verify --network bscTestnet ${addresses.CampusPay} ${addresses.EDCToken} ${deployer.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
