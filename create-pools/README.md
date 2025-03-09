# Deploy Uniswap Pool

Follow the following steps to create and deploy a set of Uniswap Pools
```shell
npm install --force
npx hardhat compile
```

Ensure that your `PRIVATE_KEY` and `RPC_URL` are correctly set up in `hardhat.config.js`. Use a private key with preloaded ETH for an easier deployment experience.

Populate the `UNISWAP_CORE_CONTRACT_ADDRESS_PATH` and `MOCK_CONTRACT_ADDRESS_PATH` with the path directory for output of deploying Uniswap contracts and Mock ERC20 contracts in the previous steps

After everything is properly configured run the following command

```shell
npx hardhat run scripts/deployPool.js --network localnet
```