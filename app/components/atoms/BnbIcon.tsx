
export const BnbIcon = ({ size = 24 }: { size?: number }) => {
    return (
        <img
            src="https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png"
            height={size}
            width={size}
            alt="BNB"
            loading="lazy"
            decoding="async"
            style={{ borderRadius: "50%" }}
        />
    );
};
