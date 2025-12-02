export function toUSDCBigInt(value: number): bigint {
    return BigInt(Math.round(value * 1_000_000));
}