const { ContractFactory, parseEther} = require("ethers")

const WETH9 = require("../WETH9.json")

async function main() {

    const [owner] = await ethers.getSigners()
    console.log(owner.address)

    const DaiFactory = await ethers.getContractFactory("Dai", owner);
    const Dai = await DaiFactory.deploy();
    await Dai.waitForDeployment();
    console.log("DAI deployed at:", await Dai.getAddress())

    const MaticFactory = await ethers.getContractFactory("Matic", owner);
    const Matic = await MaticFactory.deploy();
    await Matic.waitForDeployment();
    console.log("MATIC deployed at:", await Matic.getAddress())


    await Dai.connect(owner).mint(
        owner.address,
        parseEther('100000')
    )

    await Matic.connect(owner).mint(
        owner.address,
        parseEther('100000')
    )

    const Weth = new ContractFactory(WETH9.abi, WETH9.bytecode, owner)
    const weth = await Weth.deploy(); 
    await weth.waitForDeployment();

    // Get the deployed contract address
    const wethAddress = await weth.getAddress();
    console.log('weth', wethAddress)

 }


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });