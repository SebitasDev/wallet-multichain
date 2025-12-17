import { Wallet } from "ethers";
import { Keypair } from "stellar-sdk";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { sha256 } from "ethereum-cryptography/sha256";
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

        // 2. Derive Stellar Wallet (Deterministic: SHA256(Seed) -> Ed25519)
        const seed = mnemonicToSeedSync(trimmed);
        const stellarSeed = sha256(seed); // 32 bytes deterministic seed
        const stellarKeypair = Keypair.fromRawEd25519Seed(Buffer.from(stellarSeed));

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
            salt
        );

        // 4. Update Store
        if (isUsingXO) {
            // HYBRID MODE: XO handles EVM, we only import Stellar
            const currentMainWallet = useXOWalletStore.getState().mainWallet;

            setMainWallet({
                ...currentMainWallet,
                addressStellar: stellarKeypair.publicKey(),
                encryptedPrivateKeyStellar: encryptedStellar,
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
                toast.info("Activando cuenta Stellar (Friendbot)...");
                try {
                    await fetch(`https://friendbot.stellar.org?addr=${stellarKeypair.publicKey()}`);
                    toast.success("Cuenta Stellar activada con 10,000 XLM");
                } catch (e) {
                    console.error("Friendbot error:", e);
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
        if (!password) {
            toast.error("Error de sesión: No hay contraseña activa");
            return;
        }

        if (isUsingXO) {
            // HYBRID RESET: Only Stellar
            const keypair = Keypair.random();
            const secret = keypair.secret();
            const salt = generateSalt();

            const { encrypted: encryptedStellar } = await encryptPrivateKey(
                secret,
                password,
                salt
            );

            const currentMainWallet = useXOWalletStore.getState().mainWallet;
            setMainWallet({
                ...currentMainWallet,
                addressStellar: keypair.publicKey(),
                encryptedPrivateKeyStellar: encryptedStellar,
            });

            toast.info("Wallet Stellar reseteada. Activando...");

            try {
                await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
                toast.success("Nueva cuenta Stellar activada (Friendbot)");
            } catch {
                toast.warning("No se pudo activar con Friendbot");
            }

            await createUSDCTrustline({
                stellarAddress: keypair.publicKey(),
                secret,
            }).catch(e => console.error(e));

        } else {
            // FULL RESET
            const wallet = Wallet.createRandom();
            const keypair = Keypair.random();
            const secret = keypair.secret();
            const salt = generateSalt();

            const { encrypted, iv } = await encryptPrivateKey(
                wallet.privateKey,
                password,
                salt
            );

            const { encrypted: encryptedStellar } = await encryptPrivateKey(
                secret,
                password,
                salt
            );

            setMainWallet({
                address: wallet.address,
                addressStellar: keypair.publicKey(),
                encryptedPrivateKey: encrypted,
                encryptedPrivateKeyStellar: encryptedStellar,
                salt,
                iv,
            });

            setAddress(wallet.address);
            toast.success("Wallet totalmente reseteada");

            try {
                await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
            } catch { }

            await createUSDCTrustline({
                stellarAddress: keypair.publicKey(),
                secret,
            }).catch(e => console.error(e));
        }
    };

    return { loadWallet, resetWallet };
};
