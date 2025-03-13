# Initial Configurations

Follow the following steps to create and deploy a set of Uniswap Pools
```shell
npm install --force
npx hardhat compile
```

Ensure that your `PRIVATE_KEY` and `RPC_URL` are correctly set up in `hardhat.config.js`. Use a private key with preloaded ETH for an easier deployment experience.

# Deploy Uniswap Pool

Populate `UNISWAP_CORE_CONTRACT_ADDRESS_PATH` and `MOCK_CONTRACT_ADDRESS_PATH` with the directory paths where the output addresses of the deployed Uniswap contracts (state.json file) and Mock ERC20 contracts were stored in the previous steps.

After everything is properly configured run the following command

```shell
npx hardhat run scripts/1_deployPool.js --network localnet
```

# Add Liquidity to Uniswap pool

Like we did in the previous step populate `UNISWAP_CORE_CONTRACT_ADDRESS_PATH` and `MOCK_CONTRACT_ADDRESS_PATH` with the directory paths where the output addresses of the deployed Uniswap contracts (state.json file) and Mock ERC20 contracts were stored in the previous steps.

After everything is properly configured run the following command

```shell
npx hardhat run scripts/2_addLiquidity.js --network localnet
```