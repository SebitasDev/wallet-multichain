
export const XdaiIcon = ({ size = 24 }: { size?: number }) => {
    return (
        <img
            alt="xDAI"
            width={size}
            height={size}
            className="h-8 min-h-8 w-8 min-w-8"
            src="https://s2.coinmarketcap.com/static/img/coins/128x128/8635.png"
            srcSet="https://s2.coinmarketcap.com/static/img/coins/128x128/8635.png 1x"
            style={{ color: "transparent" }}
            loading="lazy"
        />
    );
};
