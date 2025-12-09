"use client"

import { useRouter } from "next/navigation";

export const Test = () => {

    const router = useRouter();

    const goToPremium = () => {
        router.push("/premium");
    };

    return (
        <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={goToPremium}
        >
            Acceder a Premium
        </button>
    )
}