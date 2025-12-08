import { z } from "zod";
import {ChainKeyEnum} from "@/app/constants/chainsInformation";

export const sendSchema = z.object({
    toAddress: z.string().min(1, "Address requerida"),
    sendAmount: z.string().min(1, "Monto requerido"),
    sendPassword: z.string().min(1, "Password muy corta"),
    sendChain: ChainKeyEnum,
    optimize: z.boolean(),

});

export type SendForm = z.infer<typeof sendSchema>;
