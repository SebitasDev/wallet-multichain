import { useState, useEffect, useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";
import { parseEther, Address, createWalletClient, http, publicActions, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { scrollSepolia } from "viem/chains";
import { toast } from "react-toastify";
import CTFFactoryABI from "../ctf/abis/CTFFactory.json";
import CTFGameABI from "../ctf/abis/CTFGame.json";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";

// Deployed Address (Scroll Sepolia)
const FACTORY_ADDRESS = "0x8a54B5EE985e9B81460b6EfF80dAdd507537A594";

export interface GameData {
    address: Address;
    holder: Address;
    timeLeft: number;
    rewardPool: string;
    isActive: boolean;
    myTimeHeld: number;
    hasJoined: boolean;
}

export interface LeaderboardEntry {
    rank: number;
    address: string;
    totalDuration: number;
}

export interface LeaderboardData {
    top5: LeaderboardEntry[];
    userRank: LeaderboardEntry | null;
}

export const useCTF = () => {
    const publicClient = usePublicClient();

    // Internal Wallet Stores
    const mainWallet = useXOWalletStore((s) => s.mainWallet);
    const { currentPassword, encryptedPassword } = useWalletPasswordStore();

    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<any>(null);
    const [needsPassword, setNeedsPassword] = useState(false);

    const [games, setGames] = useState<GameData[]>([]);
    const gamesRef = useRef<GameData[]>([]); // Ref to access latest games in interval

    // Sync games ref
    useEffect(() => {
        gamesRef.current = games;
    }, [games]);

    const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardData>>({});
    const leaderboardRef = useRef<Record<string, LeaderboardData>>({}); // Ref to access latest state in async callbacks

    // Sync ref with state
    useEffect(() => {
        leaderboardRef.current = leaderboard;
    }, [leaderboard]);

    const [loading, setLoading] = useState(false);

    // Effect to handle wallet unlocking
    useEffect(() => {
        const unlockWallet = async () => {
            // If we don't have a main wallet set up, we can't do anything
            if (!mainWallet.address) return;

            // If we already have a wallet client, we are good
            if (walletClient) return;

            // If we have the encrypted PK but no password, we need the password
            if (mainWallet.encryptedPrivateKey && !currentPassword) {
                setNeedsPassword(true);
                return;
            }

            // If we have password and encrypted PK, try to unlock
            if (currentPassword && mainWallet.encryptedPrivateKey && mainWallet.salt && mainWallet.iv) {
                try {
                    setNeedsPassword(false); // Hide modal if it was open

                    const pk = await decryptPrivateKey(
                        mainWallet.encryptedPrivateKey,
                        currentPassword,
                        mainWallet.salt,
                        mainWallet.iv
                    );

                    const account = privateKeyToAccount(pk as `0x${string}`);
                    const client = createWalletClient({
                        account,
                        chain: scrollSepolia,
                        transport: http()
                    }).extend(publicActions);

                    setAccount(account.address);
                    setWalletClient(client);

                } catch (e) {
                    console.error("Failed to unlock wallet for CTF", e);
                    // Password might be wrong or something else, force re-entry?
                    // helpful to signal 'needsPassword' again maybe?
                    setNeedsPassword(true);
                }
            }
        };

        unlockWallet();
    }, [mainWallet, currentPassword, walletClient]);

    const fetchGames = useCallback(async () => {
        if (!publicClient || !FACTORY_ADDRESS) return;

        try {
            // Get all game addresses
            const gameAddresses = await publicClient.readContract({
                address: FACTORY_ADDRESS,
                abi: CTFFactoryABI,
                functionName: "getAllGames",
            }) as Address[];

            const gamesData = await Promise.all(
                gameAddresses.map(async (gameAddr) => {
                    const state = await publicClient.readContract({
                        address: gameAddr,
                        abi: CTFGameABI,
                        functionName: "getGameState",
                    }) as [Address, bigint, boolean];

                    const [holder, timeLeft, isActive] = state;

                    // Optional: Get my time held and joined status if connected
                    let myTime = BigInt(0);
                    let joined = false;

                    // Use 'account' state if available, otherwise fallback to mainWallet address for view-only
                    const checkAddress = account || (mainWallet.address as Address);

                    if (checkAddress) {
                        try {
                            const [timeHeldResult, hasJoinedResult] = await publicClient.multicall({
                                contracts: [
                                    {
                                        address: gameAddr,
                                        abi: CTFGameABI,
                                        functionName: "timeHeld",
                                        args: [checkAddress]
                                    },
                                    {
                                        address: gameAddr,
                                        abi: CTFGameABI,
                                        functionName: "hasJoined",
                                        args: [checkAddress]
                                    }
                                ]
                            });

                            if (timeHeldResult.status === "success") myTime = timeHeldResult.result as bigint;
                            if (hasJoinedResult.status === "success") joined = hasJoinedResult.result as boolean;

                        } catch (e) {
                            console.log("Multicall failed, trying single calls", e);
                            try {
                                myTime = await publicClient.readContract({
                                    address: gameAddr,
                                    abi: CTFGameABI,
                                    functionName: "timeHeld",
                                    args: [checkAddress]
                                }) as bigint;
                                joined = await publicClient.readContract({
                                    address: gameAddr,
                                    abi: CTFGameABI,
                                    functionName: "hasJoined",
                                    args: [checkAddress]
                                }) as boolean;
                            } catch (innerE) {
                                console.error("Single calls failed", innerE);
                            }
                        }
                    }

                    return {
                        address: gameAddr,
                        holder,
                        timeLeft: Number(timeLeft),
                        rewardPool: "0", // No reward
                        isActive,
                        myTimeHeld: Number(myTime),
                        hasJoined: joined
                    };
                })
            );

            setGames(gamesData);

            // Fetch Leaderboards immediately after fetching games (every 10s or 15s normally)
            const addressToCheck = account || mainWallet.address;
            gamesData.forEach(async (game) => {
                // Optimization: If game ended and we already have data, don't fetch again
                if (!game.isActive && leaderboardRef.current[game.address]) {
                    return;
                }

                try {
                    const res = await fetch(`/api/ctf/leaderboard?gameAddress=${game.address}&userAddress=${addressToCheck || ""}`);
                    if (!res.ok) throw new Error("Failed to fetch");
                    const data = await res.json();

                    if (data.top5) {
                        setLeaderboard(prev => ({
                            ...prev,
                            [game.address]: data
                        }));
                    }
                } catch (e) {
                    // console.error("Error fetching leaderboard", e); 
                    // Silent fail to avoid spam
                }
            });

        } catch (error) {
            console.error("Error fetching games:", error);
        }
    }, [publicClient, account, mainWallet.address]);

    const createGame = async (durationHours: number, captureFeeETH: string) => {
        if (!walletClient || !account) {
            toast.error("Wallet not unlocked");
            setNeedsPassword(true);
            return;
        }

        try {
            setLoading(true);
            setLoading(true);
            const durationSec = Math.floor(durationHours * 3600);
            const feeWei = parseEther(captureFeeETH);

            const hash = await walletClient.writeContract({
                address: FACTORY_ADDRESS,
                abi: CTFFactoryABI,
                functionName: "createGame",
                args: [BigInt(durationSec), feeWei],
                chain: scrollSepolia
            });

            toast.success("Transaction sent!");
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            toast.success("Game created!");

            // Parse logs to get the new Game Address
            let newGameAddress = FACTORY_ADDRESS; // Fallback
            if (receipt) {
                const logs = parseEventLogs({
                    abi: CTFFactoryABI,
                    eventName: 'GameCreated',
                    logs: receipt.logs,
                });
                if (logs.length > 0) {
                    newGameAddress = (logs[0] as any).args.gameAddress;
                }
            }

            // Log to Backend with CORRECT Game Address
            fetch("/api/ctf/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: newGameAddress,
                    creator: account || mainWallet.address,
                    captureFee: captureFeeETH,
                    duration: durationSec,
                    txHash: hash
                })
            });

            fetchGames();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create game");
        } finally {
            setLoading(false);
        }
    };

    const joinGame = async (gameAddress: Address) => {
        if (!walletClient || !account) {
            setNeedsPassword(true);
            return;
        }
        try {
            setLoading(true);
            const hash = await walletClient.writeContract({
                address: gameAddress,
                abi: CTFGameABI,
                functionName: "joinGame",
                args: [],
                chain: scrollSepolia
            });
            toast.success("Joining game...");
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            toast.success("Joined game!");

            // Log Join
            fetch("/api/ctf/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameAddress: gameAddress,
                    newHolder: account || mainWallet.address, // Executor is new holder for JOIN (though they don't hold flag yet, just participant)
                    // Wait, joinGame doesn't make you holder. It just enters you.
                    // User asked: "guardar cada vez que se hace una tx".
                    // Let's log it as type JOIN.
                    type: "JOIN",
                    previousHolder: null,
                    amount: "0",
                    txHash: hash
                })
            });

            fetchGames();
        } catch (error) {
            console.error(error);
            toast.error("Failed to join game");
        } finally {
            setLoading(false);
        }
    };

    const captureFlag = async (gameAddress: Address, feeETH: string) => {
        if (!walletClient || !account) {
            setNeedsPassword(true);
            return;
        }
        try {
            setLoading(true);
            const hash = await walletClient.writeContract({
                address: gameAddress,
                abi: CTFGameABI,
                functionName: "captureFlag",
                value: parseEther(feeETH),
                chain: scrollSepolia
            });
            toast.success("Capturing flag...");
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            toast.success("Flag captured!");

            // Log Capture
            // We need previous holder to log it correctly?
            // We can find it from the `games` state
            const game = games.find(g => g.address === gameAddress);
            const previousHolder = game?.holder;

            fetch("/api/ctf/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameAddress: gameAddress,
                    newHolder: account || mainWallet.address,
                    previousHolder: previousHolder,
                    amount: feeETH,
                    txHash: hash,
                    type: "CAPTURE"
                })
            });

            fetchGames();
        } catch (error) {
            console.error(error);
            toast.error("Capture failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    // Removed separate fetchLeaderboards effect as it is now handled in fetchGames
    // to prevent rapid polling caused by countdown effect updates.


    // Countdown effect (Local Game Timer)
    useEffect(() => {
        const interval = setInterval(() => {
            setGames((prevGames) =>
                prevGames.map((game) => {
                    if (!game.isActive || game.timeLeft <= 0) return game;
                    return {
                        ...game,
                        timeLeft: game.timeLeft - 1
                    };
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Optimistic Leaderboard Update Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setLeaderboard(prev => {
                const nextState = { ...prev };
                let hasChanges = false;

                gamesRef.current.forEach(game => {
                    // Only update if game is active and has a valid holder
                    const nullAddress = "0x0000000000000000000000000000000000000000";
                    if (!game.isActive || !game.holder || game.holder === nullAddress) return;

                    const gameLb = nextState[game.address];
                    if (!gameLb) return;

                    const currentHolder = game.holder.toLowerCase();

                    // Update Top 5
                    let updatedTop5 = false;
                    const newTop5 = gameLb.top5.map(entry => {
                        if (entry.address.toLowerCase() === currentHolder) {
                            updatedTop5 = true;
                            return { ...entry, totalDuration: entry.totalDuration + 1 };
                        }
                        return entry;
                    });

                    // Re-sort if scores changed (optional, but nice for real-time overtaking)
                    // newTop5.sort((a, b) => b.totalDuration - a.totalDuration); 
                    // Sorting might be jittery if we only have top 5. Let's keep order stable until fetch.

                    // Update User Rank if needed
                    let newUserRank = gameLb.userRank;
                    if (gameLb.userRank && gameLb.userRank.address.toLowerCase() === currentHolder) {
                        newUserRank = { ...gameLb.userRank, totalDuration: gameLb.userRank.totalDuration + 1 };
                    }

                    if (updatedTop5 || (newUserRank && newUserRank !== gameLb.userRank)) {
                        hasChanges = true;
                        nextState[game.address] = {
                            ...gameLb,
                            top5: newTop5,
                            userRank: newUserRank
                        };
                    }
                });

                return hasChanges ? nextState : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Poll for game updates (FlagCaptured event impacts state) every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchGames();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchGames]);

    return {
        games,
        loading,
        createGame,
        joinGame,
        captureFlag,
        refresh: fetchGames,
        address: account || (mainWallet.address as Address | null),
        needsPassword,
        setNeedsPassword,
        leaderboard // Export leaderboard
    };
};
