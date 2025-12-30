
export const EureIcon = ({ size = 24 }: { size?: number }) => {
    return (
        <img
            alt="EURe"
            width={size}
            height={size}
            className="h-4 min-h-4 w-4 min-w-4"
            src="https://s2.coinmarketcap.com/static/img/coins/128x128/20920.png"
            srcSet="https://s2.coinmarketcap.com/static/img/coins/128x128/20920.png 1x"
            style={{ color: "transparent" }}
            loading="lazy"
        />
    );
};
