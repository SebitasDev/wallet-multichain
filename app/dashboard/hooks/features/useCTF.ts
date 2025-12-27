import { useState, useEffect, useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";
import { parseEther, Address, createWalletClient, http, publicActions, parseEventLogs, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

import CTFFactoryABI from "../../ctf/abis/CTFFactory.json";
import CTFGameABI from "../../ctf/abis/CTFGame.json";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";

// Deployed Address (Scroll Sepolia)
const FACTORY_ADDRESS = "0x18fA0850E4b4E7Fba2CF39E827Ed87d412b5406B";

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
    const { isUsingXO, provider: xoProvider, address: xoAddress } = useXOContracts();

    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<any>(null);
    const [needsPassword, setNeedsPassword] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalGames, setTotalGames] = useState(0);

    const [games, setGames] = useState<GameData[]>([]);
    const gamesRef = useRef<GameData[]>([]); // Ref to access latest games in interval

    // Sync games ref
    useEffect(() => {
        gamesRef.current = games;
    }, [games]);

    const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardData>>({});
    // Mini-Notification State: { gameAddress: { text, type, timestamp } }
    const [gameEvents, setGameEvents] = useState<Record<string, { text: string, type: 'join' | 'capture', timestamp: number }>>({});
    const leaderboardRef = useRef<Record<string, LeaderboardData>>({}); // Ref to access latest state in async callbacks

    // Sync ref with state
    useEffect(() => {
        leaderboardRef.current = leaderboard;
    }, [leaderboard]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to handle wallet unlocking (Local OR XO)
    useEffect(() => {
        const unlockWallet = async () => {
            // Priority 1: XO Connect
            if (isUsingXO && xoProvider && xoAddress) {
                try {
                    const client = createWalletClient({
                        account: xoAddress as Address,
                        chain: polygon,
                        transport: custom(xoProvider) // Use XO Provider
                    }).extend(publicActions);

                    setAccount(xoAddress as Address);
                    setWalletClient(client);
                    setNeedsPassword(false);
                    return;
                } catch (e) {
                    console.error("Failed to setup XO client", e);
                }
            }

            // Priority 2: Local Wallet
            // If we don't have a main wallet set up, we can't do anything
            if (!mainWallet.address) return;

            // If we already have a wallet client, we are good (UNLESS we switched to XO, but hook re-runs)
            if (walletClient && !isUsingXO) return;

            // If we have the encrypted PK but no password, we need the password
            if (mainWallet.encryptedPrivateKey && !currentPassword) {
                if (!isUsingXO) setNeedsPassword(true); // Only ask password if not using XO
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
                        chain: polygon,
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
    }, [mainWallet, currentPassword, walletClient, isUsingXO, xoProvider, xoAddress]);

    const fetchGames = useCallback(async (targetPage?: number) => {
        if (!publicClient || !FACTORY_ADDRESS) return;

        const pageToFetch = targetPage || page; // Use arg or state

        try {
            // 1. Fetch Games List from DB (Paginated)
            let gamesList: any[] = [];
            try {
                const res = await fetch(`/api/ctf/list?page=${pageToFetch}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.metadata) {
                        gamesList = data.games;
                        setTotalPages(data.metadata.totalPages);
                        setTotalGames(data.metadata.total);
                    } else {
                        // Fallback for old API structure (shouldn't happen)
                        gamesList = Array.isArray(data) ? data : [];
                    }
                }
            } catch (e) {
                console.error("Failed to fetch games list from DB", e);
            }

            // If empty, fallback to chain (just in case) or handle empty state
            if (gamesList.length === 0) {
                // You could keep the old logic as fallback, but let's assume DB is source of truth for "active" UI
                setGames([]);
                return;
            }

            // 2. Hydrate Game State from Chain (Time, Holder) for each game
            // We parallelize these calls.
            const gamesData = await Promise.all(
                gamesList.map(async (dbGame) => {
                    const gameAddr = dbGame.address as Address;
                    // Skip invalid addresses OR if it matches Factory (Bad Data prevention)
                    if (!gameAddr || !gameAddr.startsWith("0x") || gameAddr.toLowerCase() === FACTORY_ADDRESS.toLowerCase()) return null;

                    // Update Leaderboard immediately from DB Batch (Optimization)
                    if (dbGame.top5) {
                        setLeaderboard(prev => ({
                            ...prev,
                            [gameAddr]: {
                                top5: dbGame.top5,
                                userRank: null // Only Top 5 fetched in batch. User rank needs individual fetch IF they care.
                            }
                        }));
                    }

                    try {
                        const state = await publicClient.readContract({
                            address: gameAddr,
                            abi: CTFGameABI,
                            functionName: "getGameState",
                        }) as [Address, bigint, boolean];

                        const [holder, timeLeft, isActive] = state;

                        // Check my time held if connected
                        let myTime = BigInt(0);
                        let joined = false;
                        const checkAddress = account || (mainWallet.address as Address);

                        if (checkAddress) {
                            // ... (Existing multicall logic kept same, simplified here for brevity of reading)
                            // Re-using the logic from before or keeping it concise
                            try {
                                const [timeHeldResult, hasJoinedResult] = await publicClient.multicall({
                                    contracts: [
                                        { address: gameAddr, abi: CTFGameABI, functionName: "timeHeld", args: [checkAddress] },
                                        { address: gameAddr, abi: CTFGameABI, functionName: "hasJoined", args: [checkAddress] }
                                    ]
                                });
                                if (timeHeldResult.status === "success") myTime = timeHeldResult.result as bigint;
                                if (hasJoinedResult.status === "success") joined = hasJoinedResult.result as boolean;
                            } catch (e) { /* silent fail */ }
                        }

                        return {
                            address: gameAddr,
                            holder,
                            timeLeft: Number(timeLeft),
                            rewardPool: dbGame.rewardAmount || "0",
                            isActive, // Chain is source of truth for Active status
                            myTimeHeld: Number(myTime),
                            hasJoined: joined
                        };

                    } catch (e) {
                        console.error(`Failed to fetch state for game ${gameAddr}`, e);
                        // Return partial data from DB if chain fails? Or null?
                        // Better to return null and filter out broken games
                        return null;
                    }
                })
            );

            // Filter out nulls
            setGames(gamesData.filter(g => g !== null) as GameData[]);
            setError(null); // Clear error on success


        } catch (error: any) {
            console.error("Error fetching games:", error);
            setError("Failed to load games. Check database connection.");
        } finally {
            setLoading(false);
        }
    }, [publicClient, account, mainWallet.address, page]); // Depend on page

    // REAL-TIME: Listen for NEW Games created
    useEffect(() => {
        if (!publicClient) return;

        const unwatch = publicClient.watchContractEvent({
            address: FACTORY_ADDRESS,
            abi: CTFFactoryABI,
            eventName: 'GameCreated',
            onLogs: async (logs) => {
                console.log("🆕 New Game Created Event!", logs);

                // If we are on page 1, fetch new games. If not, maybe just notify?
                // For simplicity, let's refresh current view.
                fetchGames();
            }
        });

        return () => unwatch();
        // Depend on the JSON string of game addresses to catch new games
    }, [publicClient, fetchGames]); // Re-check when game list structure changes

    const createGame = async (durationHours: number, captureFeeETH: string, rewardAmount: string = "0") => {
        if (!walletClient || !account) {
            console.error("Wallet not connected");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Convert inputs
            const durationSeconds = Math.floor(durationHours * 3600);
            const feeWei = parseEther(captureFeeETH);

            const hash = await walletClient.writeContract({
                address: FACTORY_ADDRESS,
                abi: CTFFactoryABI,
                functionName: "createGame",
                args: [BigInt(durationSeconds), feeWei]
            });

            const receipt = await publicClient?.waitForTransactionReceipt({ hash });

            // Find deployed game address from logs
            const logs = parseEventLogs({
                abi: CTFFactoryABI,
                eventName: 'GameCreated',
                logs: receipt?.logs || [],
            });

            // @ts-ignore
            const newGameAddress = logs[0]?.args?.gameAddress;

            if (newGameAddress) {
                console.log("Detected new game:", newGameAddress);
                // Call API to index the game creation
                const res = await fetch("/api/ctf/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        address: newGameAddress,
                        creator: account,
                        captureFee: captureFeeETH,
                        duration: durationSeconds,
                        txHash: hash,
                        rewardAmount // Pass reward amount to API
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error("Failed to index game:", errorData);
                    // Don't block UI success, just log it. 
                } else {
                    console.log("Game Created Successfully!");
                }

                // Go to page 1 to see new game
                setPage(1);
                fetchGames(1);
            } else {
                console.warn("No GameCreated event found in logs", logs);
                fetchGames();
            }

        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to create game");
        } finally {
            setLoading(false);
        }
    };

    const joinGame = async (gameAddress: Address) => {
        if (!walletClient || !account) {
            console.error("Wallet not connected");
            return;
        }

        try {
            setLoading(true);
            setError(null); // Clear error on success
            const hash = await walletClient.writeContract({
                address: gameAddress,
                abi: CTFGameABI,
                functionName: "joinGame"
            });

            await publicClient?.waitForTransactionReceipt({ hash });
            console.log("Joined game!");

            // Log Join
            fetch("/api/ctf/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameAddress: gameAddress,
                    newHolder: account,
                    previousHolder: null,
                    amount: "0",
                    txHash: hash,
                    type: "JOIN"
                })
            });

            // Optimistic UI Update (Instant Feedback)
            const shortPlayer = `${account.slice(0, 6)}...${account.slice(-4)}`;
            setGameEvents(prev => ({
                ...prev,
                [gameAddress]: {
                    text: `👋 ${shortPlayer} joined!`,
                    type: 'join',
                    timestamp: Date.now()
                }
            }));

            fetchGames();
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to join game");
        } finally {
            setLoading(false);
        }
    };

    const captureFlag = async (gameAddress: Address, feeETH: string) => {
        if (!walletClient || !account) {
            console.error("Wallet not connected");
            return;
        }

        try {
            setLoading(true);
            setError(null); // Clear error on success
            const feeWei = parseEther(feeETH);

            const hash = await walletClient.writeContract({
                address: gameAddress,
                abi: CTFGameABI,
                functionName: "captureFlag",
                value: feeWei
            });

            await publicClient?.waitForTransactionReceipt({ hash });
            console.log("Flag captured!");

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

            // Optimistic UI Update (Instant Feedback)
            const shortHolder = `${(account || mainWallet.address).slice(0, 6)}...${(account || mainWallet.address).slice(-4)}`;
            setGameEvents(prev => ({
                ...prev,
                [gameAddress]: {
                    text: `👑 Captured by ${shortHolder}`,
                    type: 'capture',
                    timestamp: Date.now()
                }
            }));

            fetchGames();
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to capture flag");
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
                    // Only update if game is active AND has time left
                    const nullAddress = "0x0000000000000000000000000000000000000000";
                    if (!game.isActive || game.timeLeft <= 0 || !game.holder || game.holder === nullAddress) return;

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

    // REAL-TIME: Listen for Game Events (Capture & Join)
    // We use a ref to track which games we are already watching to avoid re-subscribing constantly
    const watchedGamesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!publicClient) return;

        // Identify active games to watch
        const activeGames = gamesRef.current.filter(g => g.isActive);
        const activeAddresses = activeGames.map(g => g.address);

        // Determine which ones are new to watch
        const newToWatch = activeAddresses.filter(addr => !watchedGamesRef.current.has(addr));

        newToWatch.forEach(gameAddr => {
            watchedGamesRef.current.add(gameAddr);

            // Watch Capture
            publicClient.watchContractEvent({
                address: gameAddr,
                abi: CTFGameABI,
                eventName: 'FlagCaptured',
                onLogs: (logs) => {
                    logs.forEach(log => {
                        const args = (log as any).args;
                        const newHolder = args.newHolder;
                        const previousHolder = args.previousHolder;

                        // Valid notification
                        if (newHolder) {
                            // Set Mini-Notification Event
                            const shortHolder = `${newHolder.slice(0, 6)}...${newHolder.slice(-4)}`;
                            setGameEvents(prev => ({
                                ...prev,
                                [gameAddr]: {
                                    text: `👑 Captured by ${shortHolder}`,
                                    type: 'capture',
                                    timestamp: Date.now()
                                }
                            }));
                        }

                        console.log("🚩 Real-time Capture!", args);
                        fetchGames(); // Refresh state
                    });
                }
            });

            // Watch Join
            publicClient.watchContractEvent({
                address: gameAddr,
                abi: CTFGameABI,
                eventName: 'PlayerJoined',
                onLogs: (logs) => {
                    logs.forEach(log => {
                        const args = (log as any).args;
                        const player = args.player;

                        if (player) {
                            const shortPlayer = `${player.slice(0, 6)}...${player.slice(-4)}`;
                            setGameEvents(prev => ({
                                ...prev,
                                [gameAddr]: {
                                    text: `👋 ${shortPlayer} joined!`,
                                    type: 'join',
                                    timestamp: Date.now()
                                }
                            }));
                        }
                    });
                }
            });
        });

        // Note: We don't implement unwatch here for simplicity in this specific "add-only" logic 
        // because unwatching specific individual listeners without storing their return fns is hard.
        // A full teardown/rebuild approach (like previous) is cleaner for unwatching but caused loops.
        // For this app, games don't go "inactive" active state often, preventing memory leaks is good but 
        // given the "loop" issue, let's try to stabilize by only adding listeners for new games.
        // If strict cleanup is needed, we'd store the unwatch fn in a Map<address, fn[]>.

        // Depend on the JSON string of game addresses to catch new games
    }, [publicClient, JSON.stringify(games.map(g => g.address))]); // Re-check when game list structure changes

    // Back-up Polling (Reduced Frequency)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchGames();
        }, 60000); // 60 seconds
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
        leaderboard, // Export leaderboard
        gameEvents, // Exposed for UI
        // Pagination
        page,
        setPage,
        totalPages,
        totalGames,
        error // Export error
    };
};
