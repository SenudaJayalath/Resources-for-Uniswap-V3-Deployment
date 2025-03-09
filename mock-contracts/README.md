# Deploy a seet of mock contracts

Follow the following steps to deploy the set of mock contracts to our local EVM blockchain

```shell
npm install --force
npx hardhat compile
```

Ensure that your `PRIVATE_KEY` and `RPC_URL` are correctly set up in `hardhat.config.js`. Use a private key with preloaded ETH for an easier deployment experience.

After your `hardhat.config.js` properly configured run the following command

```shell
npx hardhat run scripts/deployContract.js --network localnet
```
 
