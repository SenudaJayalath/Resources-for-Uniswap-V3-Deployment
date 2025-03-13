const { ContractFactory, utils, hexlify, parseEther, MaxUint256, parseUnits } = require("ethers")
const fs = require('fs');
const path = require('path');

///pool///
const { Contract, BigNumber } = require("ethers")
const bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

const { ethers } = require("hardhat")

const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),

    // NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    Dai: require("../artifacts/contracts/Dai.sol/Dai.json"), //TODO: clairfy
    Matic: require("../artifacts/contracts/Matic.sol/Matic.json"), //TODO: clairfy
    Usdc: require("../artifacts/contracts/Usdc.sol/Usdc.json"), //TODO: clairfy
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};
const { Token } = require('@uniswap/sdk-core')
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')


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
    const chainId = (await ethers.provider.getNetwork()).chainId
    const provider = ethers.provider
    console.log("owner: " + owner.address)

    // Read file and get JSON data
    const mockERC20Addresses = await readDeployedMockAddresses();
    console.log('Returned mock ERC20 Addresses:', mockERC20Addresses);

    // Read file and get JSON data
    const uniswapAdresses = await readUniswapDeployedAddresses();
    console.log('Returned Uniswap Deployed Addresses:', uniswapAdresses);


    const DAI_ADDRESS = mockERC20Addresses.DAI_ADDRESS
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
    const DaiToken =   new Token(chainId, DAI_ADDRESS, 18, 'DAI', 'Dai')
    const UsdcToken =  new Token(chainId, USDC_ADDRESS, 18, 'USDC', 'UsdCoin')

    let token0, token1, address0, address1

    // NOTE it is important that token0, token1, address0 and address1 are ordered properly
    if (DAI_ADDRESS < USDC_ADDRESS) {
        token0 = DaiToken
        token1 = UsdcToken
        address0 = DAI_ADDRESS
        address1 = USDC_ADDRESS
    } else {
        token0 = UsdcToken
        token1 = DaiToken
        address0 = USDC_ADDRESS
        address1 = DAI_ADDRESS
    }
    const daiUsdc3000 = await factory.connect(owner).getPool(
        address0,
        address1,
        3000,  //fee
    ) 
    console.log(`DAI/USDC pool address: ${daiUsdc3000}`)

    const daiContract = new Contract(DAI_ADDRESS, artifacts.Dai.abi, provider)
    const usdcContract = new Contract(USDC_ADDRESS, artifacts.Usdc.abi, provider)

    let tx1 = await daiContract.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('1000'))
    await tx1.wait()
    let tx2 = await usdcContract.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('1000'))
    await tx2.wait()

    const poolContract = new Contract(daiUsdc3000, artifacts.UniswapV3Pool.abi, provider)

    const poolDataBefore = await getPoolData(poolContract)
    console.log( "Initial pool data", poolDataBefore)
    
    const pool = new Pool(
        token0,
        token1,
        poolDataBefore.fee,
        poolDataBefore.sqrtPriceX96.toString(),
        poolDataBefore.liquidity.toString(),
        poolDataBefore.tick
    )

    const position = new Position({
        pool: pool,
        liquidity: ethers.utils.parseEther('1'),
        tickLower: nearestUsableTick(poolDataBefore.tick, poolDataBefore.tickSpacing) - poolDataBefore.tickSpacing * 2,
        tickUpper: nearestUsableTick(poolDataBefore.tick, poolDataBefore.tickSpacing) + poolDataBefore.tickSpacing * 2,
    })

    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    params = {
        token0: address0,
        token1: address1,
        fee: poolDataBefore.fee,
        tickLower: nearestUsableTick(poolDataBefore.tick, poolDataBefore.tickSpacing) - poolDataBefore.tickSpacing * 2,
        tickUpper: nearestUsableTick(poolDataBefore.tick, poolDataBefore.tickSpacing) + poolDataBefore.tickSpacing * 2,
        amount0Desired: amount0Desired.toString(),
        amount1Desired: amount1Desired.toString(),
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: Math.floor(Date.now() / 1000) + (60 * 10)
    }

    const tx = await nonfungiblePositionManager.connect(owner).mint(
        params,
        { gasLimit: '1000000' }
    )

    const poolDataAfter = await getPoolData(poolContract)
    console.log('Pool data after adding liquidity', poolDataAfter)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });