require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ quiet: true });

const { PRIVATE_KEY, BSC_TESTNET_RPC_URL, BSCSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun' },
  },
  paths: { sources: './src' },
  networks: {
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: { apiKey: BSCSCAN_API_KEY || '' },
};
