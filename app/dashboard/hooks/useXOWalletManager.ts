import { Wallet } from "ethers";
import { Keypair } from "stellar-sdk";
import { mnemonicToSeedSync, validateMnemonic, generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { sha256 } from "ethereum-cryptography/sha256";
import { derivePath } from "ed25519-hd-key";
import { toast } from "react-toastify";
import { encryptPrivateKey, generateSalt } from "@/app/utils/cripto";
import { createUSDCTrustline } from "@/app/lib/stellar/createUSDCTrustline";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

interface UseXOWalletManagerProps {
    password: string;
    isUsingXO: boolean;
    setAddress: (addr: string | null) => void;
    setIsUsingXO: (val: boolean) => void;
}

export const useXOWalletManager = ({
    password,
    isUsingXO,
    setAddress,
    setIsUsingXO,
}: UseXOWalletManagerProps) => {
    const setMainWallet = useXOWalletStore((s) => s.setMainWallet);

    // ======================
    //  LOAD WALLET (IMPORT)
    // ======================
    const loadWallet = async (mnemonic: string, password: string) => {
        const trimmed = mnemonic.trim();
        if (!validateMnemonic(trimmed, wordlist)) {
            throw new Error("Frase semilla inválida");
        }

        // 1. Derive EVM Wallet (Standard BIP44)
        const evmWallet = Wallet.fromPhrase(trimmed);

        // 2. Derive Stellar Wallet (Standard SEP-0005: m/44'/148'/0')
        const seed = mnemonicToSeedSync(trimmed);
        const { key } = derivePath("m/44'/148'/0'", Buffer.from(seed).toString('hex'));
        const stellarKeypair = Keypair.fromRawEd25519Seed(key);

        // 3. Encrypt Keys
        const salt = generateSalt();
        const { encrypted: encryptedEVM, iv } = await encryptPrivateKey(
            evmWallet.privateKey,
            password,
            salt
        );

        const { encrypted: encryptedStellar } = await encryptPrivateKey(
            stellarKeypair.secret(),
            password,
            salt,
            iv
        );

        // Encrypt Mnemonic
        const { encrypted: encryptedMnemonic } = await encryptPrivateKey(
            trimmed,
            password,
            salt,
            iv
        );

        // 4. Update Store
        if (isUsingXO) {
            // HYBRID MODE: XO handles EVM, we only import Stellar
            const currentMainWallet = useXOWalletStore.getState().mainWallet;

            setMainWallet({
                ...currentMainWallet,
                addressStellar: stellarKeypair.publicKey(),
                encryptedPrivateKeyStellar: encryptedStellar,
                encryptedMnemonic: encryptedMnemonic, // Store mnemonic
                salt,
                iv,
            });

            toast.success(`Wallet Stellar importada: ${stellarKeypair.publicKey().slice(0, 6)}...`);
            // DO NOT switch setIsUsingXO(false)
        } else {
            // STANDARD MODE: Full Import
            setMainWallet({
                address: evmWallet.address,
                addressStellar: stellarKeypair.publicKey(),
                encryptedPrivateKey: encryptedEVM,
                encryptedPrivateKeyStellar: encryptedStellar,
                encryptedMnemonic: encryptedMnemonic, // Store mnemonic
                salt,
                iv,
            });

            // 5. Set Active
            setAddress(evmWallet.address);
            setIsUsingXO(false); // Switch to local wallet
        }

        // 6. Ensure Trustline & Auto-Fund
        const fundAndTrust = async () => {
            try {
                await fetch(`https://horizon-testnet.stellar.org/accounts/${stellarKeypair.publicKey()}`)
                    .then(res => { if (!res.ok) throw new Error("Not found"); });
            } catch {
                const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";
                if (isDevelopment) {
                    toast.info("Activando cuenta Stellar (Friendbot)...");
                    try {
                        await fetch(`https://friendbot.stellar.org?addr=${stellarKeypair.publicKey()}`);
                        toast.success("Cuenta Stellar activada con 10,000 XLM");
                    } catch (e) {
                        console.error("Friendbot error:", e);
                    }
                } else {
                    // Mainnet: User must fund manually
                    console.log("Mainnet: Skipping Friendbot. User must fund account.");
                }
            }

            createUSDCTrustline({
                stellarAddress: stellarKeypair.publicKey(),
                secret: stellarKeypair.secret(),
            }).catch(err => {
                if (err?.response?.status === 404 || err?.message?.includes("404")) return;
                console.error("Trustline setup warning:", err);
            });
        };

        fundAndTrust();

        // 7. Sync Password Store
        useWalletPasswordStore.getState().setCurrentPassword(password);
        await useWalletPasswordStore.getState().setPassword(password);
    };

    // ======================
    //  RESET WALLET
    // ======================
    const resetWallet = async () => {
        // Fallback to store password if prop is missing/stale
        const currentPwd = useWalletPasswordStore.getState().currentPassword;
        const effectivePassword = password || currentPwd;

        if (!effectivePassword) {
            toast.error("Error de sesión: No hay contraseña activa");
            return;
        }

        if (isUsingXO) {
            // HYBRID RESET: Only Stellar
            const mnemonic = generateMnemonic(wordlist);
            const seed = mnemonicToSeedSync(mnemonic);
            const { key } = derivePath("m/44'/148'/0'", Buffer.from(seed).toString('hex'));
            const keypair = Keypair.fromRawEd25519Seed(key);
            const secret = keypair.secret();

            const salt = generateSalt();

            const { encrypted: encryptedStellar, iv } = await encryptPrivateKey(
                secret,
                effectivePassword,
                salt
            );

            // Use same IV/Salt for Mnemonic to keep it simple in store (single field)
            // Or if encryptPrivateKey generates new IV if not passed...
            // We must pass the IV we just got to the next encryption if we want them to share `mainWallet.iv`.
            const { encrypted: encryptedMnemonic } = await encryptPrivateKey(
                mnemonic,
                effectivePassword,
                salt,
                iv
            );

            const currentMainWallet = useXOWalletStore.getState().mainWallet;
            setMainWallet({
                ...currentMainWallet,
                addressStellar: keypair.publicKey(),
                encryptedPrivateKeyStellar: encryptedStellar,
                encryptedMnemonic: encryptedMnemonic,
                salt,
                iv,
            });

            toast.info("Wallet Stellar reseteada. Activando...");

            const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";
            if (isDevelopment) {
                try {
                    await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
                    toast.success("Nueva cuenta Stellar activada (Friendbot)");
                } catch {
                    toast.warning("No se pudo activar con Friendbot");
                }
            } else {
                toast.info("MAINNET: Debes enviar XLM a tu cuenta para activarla.");
            }

            await createUSDCTrustline({
                stellarAddress: keypair.publicKey(),
                secret,
            }).catch(e => console.error(e));

        } else {
            // FULL RESET
            const wallet = Wallet.createRandom();
            const mnemonic = wallet.mnemonic?.phrase;

            if (!mnemonic) {
                toast.error("Error generando mnemonic");
                return;
            }

            const seed = mnemonicToSeedSync(mnemonic);
            const { key } = derivePath("m/44'/148'/0'", Buffer.from(seed).toString('hex'));
            const stellarKeypairDerived = Keypair.fromRawEd25519Seed(key);

            const salt = generateSalt();

            // Encrypt EVM Key -> Get IV
            const { encrypted, iv } = await encryptPrivateKey(
                wallet.privateKey,
                effectivePassword,
                salt
            );

            const { encrypted: encryptedStellar } = await encryptPrivateKey(
                stellarKeypairDerived.secret(),
                effectivePassword,
                salt,
                iv
            );

            const { encrypted: encryptedMnemonic } = await encryptPrivateKey(
                mnemonic,
                effectivePassword,
                salt,
                iv
            );

            setMainWallet({
                address: wallet.address,
                addressStellar: stellarKeypairDerived.publicKey(),
                encryptedPrivateKey: encrypted,
                encryptedPrivateKeyStellar: encryptedStellar,
                encryptedMnemonic: encryptedMnemonic,
                salt,
                iv,
            });

            setAddress(wallet.address);
            toast.success("Wallet reseteada (Unificada EVM/Stellar)");

            const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";
            if (isDevelopment) {
                try {
                    await fetch(`https://friendbot.stellar.org?addr=${stellarKeypairDerived.publicKey()}`);
                } catch { }
            }

            await createUSDCTrustline({
                stellarAddress: stellarKeypairDerived.publicKey(),
                secret: stellarKeypairDerived.secret(),
            }).catch(e => console.error(e));
        }
    };

    return { loadWallet, resetWallet };
};
