import { ethers } from "hardhat";

async function main() {
    const factoryAddress = process.env.FACTORY_ADDRESS;

    if (!factoryAddress) {
        throw new Error("Missing FACTORY_ADDRESS in .env");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Creating event with account:", deployer.address);

    // 1. Get Contracts
    const Factory = await ethers.getContractAt("CTFFactory", factoryAddress);

    // 2. Define Game Params
    const duration = 3 * 60 * 60; // 3 hours
    const captureFee = ethers.parseEther("0.001"); // 0.001 ETH (native token)

    // 3. Create Game (No USDC approval needed)
    console.log("Creating Game (No Reward)...");
    const txCreate = await Factory.createGame(duration, captureFee);
    const receipt = await txCreate.wait();

    // 4. Find Event
    // @ts-ignore
    const event = receipt.logs.find(log => {
        try {
            return Factory.interface.parseLog(log)?.name === "GameCreated";
        } catch (e) { return false; }
    });

    if (event) {
        const parsedLog = Factory.interface.parseLog(event);
        console.log(`Game Created! Address: ${parsedLog?.args[0]} `);
    } else {
        console.log("Game created but event not found in logs (check txn)");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
