const { ContractFactory, parseEther} = require("ethers")

const WETH9 = require("../WETH9.json")
const fs = require('fs');

async function main() {

    const [owner] = await ethers.getSigners()
    console.log("Owner: ", owner.address)

    const DaiFactory = await ethers.getContractFactory("Dai", owner);
    const Dai = await DaiFactory.deploy();
    await Dai.waitForDeployment();
    console.log("DAI deployed at:", await Dai.getAddress())

    const MaticFactory = await ethers.getContractFactory("Matic", owner);
    const Matic = await MaticFactory.deploy();
    await Matic.waitForDeployment();
    console.log("MATIC deployed at:", await Matic.getAddress())

    const UsdcFactory = await ethers.getContractFactory("Usdc", owner);
    const Usdc = await UsdcFactory.deploy();
    await Usdc.waitForDeployment();
    console.log("USDC deployed at:", await Usdc.getAddress())


    await Dai.connect(owner).mint(
        owner.address,
        parseEther('100000')
    )

    await Matic.connect(owner).mint(
        owner.address,
        parseEther('100000')
    )

    await Usdc.connect(owner).mint(
        owner.address,
        parseEther('100000')
    )

    const Weth = new ContractFactory(WETH9.abi, WETH9.bytecode, owner)
    const weth = await Weth.deploy(); 
    await weth.waitForDeployment();

    // Get the deployed contract address
    const wethAddress = await weth.getAddress();
    console.log('WETH Deployed at: ', wethAddress)

    const deployedAddresses = {
        DAI_ADDRESS: await Dai.getAddress(),
        MATIC_ADDRESS: await Matic.getAddress(),
        USDC_ADDRESS: await Usdc.getAddress(),
        WETH_ADDRESS: wethAddress,
    }

    // Convert object to JSON string
    const jsonContent = JSON.stringify(deployedAddresses, null, 2);

    // Write to a file (deployedAddresses.json)
    fs.writeFileSync('../deployedAddresses.json', jsonContent, 'utf8');

    console.log('Addresses saved to deployedAddresses.json');

 }


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });