const fs = require('fs');
const path = require('path');
const { Contract, BigNumber } = require("ethers")
const bn = require('bignumber.js')
const { ethers } = require("hardhat")
const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    Dai: require("../artifacts/contracts/Dai.sol/Dai.json"),
    Matic: require("../artifacts/contracts/Matic.sol/Matic.json"),
    Usdc: require("../artifacts/contracts/Usdc.sol/Usdc.json"),
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

const UNISWAP_CORE_CONTRACT_ADDRESS_PATH = ""        /* Path to state.json */
const MOCK_CONTRACT_ADDRESS_PATH         = ""        /* Path to deployedAddresses.json */;

async function getPoolData(poolContract) {
    const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])

    return {
        tickSpacing: tickSpacing,
        fee: fee,
        liquidity: liquidity,
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
    }
}

function encodePriceSqrt(reserve1, reserve0) {
    return BigNumber.from(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    )
}

async function deployPool(tokenA, tokenB, fee, price, owner, nonfungiblePositionManager, factory) {
    let token0 = tokenA
    let token1 = tokenB
    if (tokenA < tokenB) {
        token0 = tokenA
        token1 = tokenB
    } else {
        token0 = tokenB
        token1 = tokenA
    }


    let tx = await nonfungiblePositionManager.connect(owner).createAndInitializePoolIfNecessary(
        token0,
        token1,
        fee,
        price,
        { gasLimit: 5000000 }
    )

     await tx.wait();

    const poolAddress = await factory.connect(owner).getPool(
        token0,
        token1,
        fee,
    )
    return poolAddress
}

async function readUniswapDeployedAddresses() {
    try {
        const filePath = path.join(UNISWAP_CORE_CONTRACT_ADDRESS_PATH, 'state.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        return jsonData;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

async function readDeployedMockAddresses() {
    try {
        const filePath = path.join(MOCK_CONTRACT_ADDRESS_PATH, 'deployedAddresses.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        return jsonData;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

async function main() {
    const [owner] = await ethers.getSigners()
    const provider = ethers.provider
    console.log("owner: " + owner.address)

   // Read file and get JSON data
   const mockERC20Addresses = await readDeployedMockAddresses();
   console.log('Returned mock ERC20 Addresses:', mockERC20Addresses);

    // Read file and get JSON data
    const uniswapAdresses = await readUniswapDeployedAddresses();
    console.log('Returned Uniswap Deployed Addresses:', uniswapAdresses);


    const DAI_ADDRESS = mockERC20Addresses.DAI_ADDRESS
    const MATIC_ADDRESS = mockERC20Addresses.MATIC_ADDRESS
    const USDC_ADDRESS = mockERC20Addresses.USDC_ADDRESS

    const FACTORY_ADDRESS = uniswapAdresses.v3CoreFactoryAddress
    const POSITION_MANAGER_ADDRESS = uniswapAdresses.nonfungibleTokenPositionManagerAddress

    const nonfungiblePositionManager = new Contract(
        POSITION_MANAGER_ADDRESS,
        artifacts.NonfungiblePositionManager.abi,
        provider
    )

    const factory = new Contract(
        FACTORY_ADDRESS,
        artifacts.UniswapV3Factory.abi,
        provider
    )

    const daiUsdc3000 = await deployPool(DAI_ADDRESS, USDC_ADDRESS, 3000, encodePriceSqrt(1, 1), owner, nonfungiblePositionManager, factory)
    console.log(`DAI/USDC pool address: ${daiUsdc3000}`)

    const daiUsdcPoolContract = new Contract(daiUsdc3000, artifacts.UniswapV3Pool.abi, provider)

    const daiUsdcPoolData = await getPoolData(daiUsdcPoolContract)
    console.log("DAI/USDC initial pool data: ", daiUsdcPoolData)


    // Add second pool for MATIC/USDC
    const maticUsdc3000 = await deployPool(MATIC_ADDRESS, USDC_ADDRESS, 3000, encodePriceSqrt(1, 1), owner, nonfungiblePositionManager, factory)
    console.log(`MATIC/USDC pool address: ${maticUsdc3000}`)


    const maticUsdcPoolContract = new Contract(maticUsdc3000, artifacts.UniswapV3Pool.abi, provider)
    const maticUsdcPoolData = await getPoolData(maticUsdcPoolContract)
    console.log('MATIC/USDC initial pool data:', maticUsdcPoolData)
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });