import { ethers } from "hardhat";

async function main() {
    console.log("Deploying CTFFactory (No Reward Mode)...");

    // Removed USDC dependency
    const factory = await ethers.deployContract("CTFFactory");

    await factory.waitForDeployment();

    console.log(`CTFFactory deployed to: ${factory.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
