import { z } from "zod";
import { ChainKeyEnum } from "@/app/types/chain";

export const sendSchema = z.object({
    toAddress: z.string().min(1, "Address requerida"),
    sendAmount: z.string().min(1, "Monto requerido"),
    sendPassword: z.string().min(1, "Password muy corta"),
    sendChain: ChainKeyEnum,
    optimize: z.boolean(),
    sourceToken: z.string().default("USDC"),
});

export type SendForm = z.infer<typeof sendSchema>;
