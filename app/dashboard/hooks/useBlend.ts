import { useState, useEffect, useCallback } from "react";
import { Keypair } from "stellar-sdk";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { blendService, BlendData } from "../services/blendService";
import { BLEND_CONFIG } from "../config/blendConfig";

export const useBlend = (selectedAsset: "USDC" | "USDGLO") => {
    const { mainWallet } = useXOWalletStore();
    const { currentPassword } = useWalletPasswordStore();

    const [data, setData] = useState<BlendData>({
        balance: 0,
        invested: 0,
        apy: 0,
        timestamp: 0,
        hasTrustline: true // Default true to avoid flash of "Enable"
    });

    const [loading, setLoading] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);

    // Get asset config based on selection
    const getAssetConfig = useCallback(() => {
        if (selectedAsset === "USDGLO") {
            return {
                id: BLEND_CONFIG.USDGLO_ASSET_ID,
                issuer: BLEND_CONFIG.USDGLO_ISSUER,
                code: "USDGLO"
            };
        }
        return {
            id: BLEND_CONFIG.USDC_ASSET_ID,
            issuer: BLEND_CONFIG.USDC_ISSUER,
            code: "USDC"
        };
    }, [selectedAsset]);

    const fetchBlendData = useCallback(async () => {
        if (!mainWallet.addressStellar) return;
        setLoading(true);
        try {
            const config = getAssetConfig();
            const blendData = await blendService.getBlendData(
                mainWallet.addressStellar,
                config.id,
                config.issuer,
                config.code
            );
            setData(blendData);
        } catch (error) {
            console.error("Error fetching Blend data:", error);
        } finally {
            setLoading(false);
        }
    }, [mainWallet.addressStellar, getAssetConfig]);

    useEffect(() => {
        fetchBlendData();
    }, [fetchBlendData]);

    const getSigner = async () => {
        if (!currentPassword || !mainWallet.encryptedPrivateKeyStellar || !mainWallet.salt || !mainWallet.iv) {
            throw new Error("Wallet locked or keys missing");
        }
        try {
            // Using correct salt/iv from the stored wallet
            const secret = await decryptPrivateKey(
                mainWallet.encryptedPrivateKeyStellar,
                currentPassword,
                mainWallet.salt,
                mainWallet.iv
            );
            return Keypair.fromSecret(secret);
        } catch (e) {
            throw new Error("Failed to decrypt wallet");
        }
    };

    const handleTransaction = async (amount: number, type: "deposit" | "withdraw") => {
        try {
            setLoadingTx(true);
            const signer = await getSigner();
            const config = getAssetConfig();

            await blendService.submitTransaction(signer, amount, type, config.id);

            // Wait for RPC indexing
            await new Promise(r => setTimeout(r, 4000));
            await fetchBlendData();

            return true;
        } catch (error) {
            console.error(`${type} failed:`, error);
            throw error;
        } finally {
            setLoadingTx(false);
        }
    };

    const enableAsset = async () => {
        try {
            setLoadingTx(true);
            const signer = await getSigner();
            const config = getAssetConfig();

            await blendService.createTrustline(
                signer,
                config.id,
                config.issuer,
                config.code
            );

            // Wait for RPC indexing
            await new Promise(r => setTimeout(r, 4000));
            await fetchBlendData();

            return true;
        } catch (error) {
            console.error(`Enable asset failed:`, error);
            throw error;
        } finally {
            setLoadingTx(false);
        }
    };

    return {
        ...data,
        data,
        loading,
        loadingTx,
        deposit: (amount: number) => handleTransaction(amount, "deposit"),
        withdraw: (amount: number) => handleTransaction(amount, "withdraw"),
        refresh: fetchBlendData,
        enableAsset
    };
};
