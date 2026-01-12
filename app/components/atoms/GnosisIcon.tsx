export default function GnosisIcon({ size = 28 }: { size?: number }) {
    return (
        <img
            alt="gnosis"
            width={size}
            height={size}
            src="https://s2.coinmarketcap.com/static/img/coins/128x128/1659.png"
            srcSet="https://s2.coinmarketcap.com/static/img/coins/128x128/1659.png 1x"
            style={{ width: size, height: size }}
            loading="lazy"
        />
    );
}
