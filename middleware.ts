import { paymentMiddleware } from "x402-next";

export const middleware = paymentMiddleware(
  "0x0b00a75637601e0F1B98d7B79b28A77c1f64E16D",
  {
    "/premium": {
      price: "$0.01",
      network: "base-sepolia",
      config: {
        description: "Premium page access",
      },
    },
  },
  {
    url: "https://facilitator.ultravioletadao.xyz",
  }
);

export const config = {
  matcher: ["/premium/:path*"],
};
