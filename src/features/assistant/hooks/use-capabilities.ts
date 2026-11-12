import useSWR from "swr";
import { apiUrl } from "@/lib/base";
import type { CapabilitiesBundle } from "../types";

async function fetchCapabilities(): Promise<CapabilitiesBundle> {
    const res = await fetch(apiUrl("api/assistant/capabilities"));
    if (!res.ok) {
        let detail = `capabilities fetch failed: ${res.status}`;
        try {
            const j = await res.json();
            if (j?.detail) detail = j.detail;
        } catch {}
        throw new Error(detail);
    }
    return res.json();
}

export function useCapabilities() {
    return useSWR<CapabilitiesBundle>("assistant-capabilities", fetchCapabilities, {
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        shouldRetryOnError: false,
    });
}
