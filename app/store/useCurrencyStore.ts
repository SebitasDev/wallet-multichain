import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
    code: string;
    symbol: string;
    rate: number;
    loading: boolean;
    useLocal: boolean;
    fetchCurrency: () => Promise<void>;
    toggleCurrency: () => void;
}

const RATES: Record<string, number> = {
    USD: 1,
    ARS: 1040,      // Argentina
    EUR: 0.92,      // Europe
    BRL: 5.0,       // Brazil
    COP: 3900,      // Colombia
    MXN: 17,        // Mexico
    CLP: 950,       // Chile
    PEN: 3.7,       // Peru
    UYU: 39,        // Uruguay
    VES: 36,        // Venezuela
    BOB: 6.9,       // Bolivia
    GTQ: 7.8,       // Guatemala
    HNL: 24.7,      // Honduras
    NIO: 36.8,      // Nicaragua
    CRC: 515,       // Costa Rica
    DOP: 59,        // Dominican Republic
    PYG: 7280,      // Paraguay
};

const SYMBOLS: Record<string, string> = {
    USD: "$",
    ARS: "$",
    EUR: "€",
    BRL: "R$",
    COP: "$",
    MXN: "$",
    CLP: "$",
    PEN: "S/",
    UYU: "$",
    VES: "Bs.",
    BOB: "Bs.",
    GTQ: "Q",
    HNL: "L",
    NIO: "C$",
    CRC: "₡",
    DOP: "RD$",
    PYG: "₲",
};

export const useCurrencyStore = create(
    persist<CurrencyState>(
        (set, get) => ({
            code: "USD",
            symbol: "$",
            rate: 1,
            loading: true,
            useLocal: true,

            toggleCurrency: () => set((state) => ({ useLocal: !state.useLocal })),

            fetchCurrency: async () => {
                const state = get();
                // If we already have a detected currency that is NOT USD, or if checks were recent, we could skip.
                // But for now, let's just log and proceed.
                console.log("[CurrencyStore] Fetching currency...", { currentCode: state.code });

                set({ loading: true });

                let detectedCurrency = "USD";
                let liveRate = 1;

                try {
                    // 1. Detect User Location & Currency
                    console.log("[CurrencyStore] Detecting location...");
                    const locationResponse = await fetch("https://ipapi.co/json/");
                    if (!locationResponse.ok) throw new Error("Location fetch failed");
                    const locationData = await locationResponse.json();
                    detectedCurrency = locationData.currency || "USD";
                    console.log("[CurrencyStore] Detected currency:", detectedCurrency);
                } catch (error) {
                    console.warn("[CurrencyStore] Failed to detect location, defaulting to previous or USD", error);
                    // If we failed to detect, maybe keep existing code if valid?
                    if (state.code !== "USD") detectedCurrency = state.code;
                }

                try {
                    // 2. Fetch Live Exchange Rates (Base USD)
                    console.log("[CurrencyStore] Fetching rates for:", detectedCurrency);
                    if (detectedCurrency === "ARS") {
                        const arsResponse = await fetch("https://dolarapi.com/v1/dolares/cripto");
                        if (arsResponse.ok) {
                            const arsData = await arsResponse.json();
                            liveRate = arsData.venta || 1100;
                            console.log("[CurrencyStore] DolarAPI success, rate:", liveRate);
                        } else {
                            throw new Error("DolarAPI failed");
                        }
                    } else {
                        const ratesResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
                        if (ratesResponse.ok) {
                            const ratesData = await ratesResponse.json();
                            if (ratesData.rates && ratesData.rates[detectedCurrency]) {
                                liveRate = ratesData.rates[detectedCurrency];
                            } else {
                                liveRate = RATES[detectedCurrency] || 1;
                            }
                            console.log("[CurrencyStore] ExchangeRateAPI success, rate:", liveRate);
                        } else {
                            liveRate = RATES[detectedCurrency] || 1;
                        }
                    }
                } catch (error) {
                    console.warn("[CurrencyStore] Failed to fetch rates, using fallback", error);
                    liveRate = RATES[detectedCurrency] || 1;
                }

                set({
                    code: detectedCurrency,
                    symbol: SYMBOLS[detectedCurrency] || "$",
                    rate: liveRate,
                    loading: false,
                });
            }
        }),
        {
            name: 'currency-storage', // name of the item in the storage (must be unique)
        }
    )
);
