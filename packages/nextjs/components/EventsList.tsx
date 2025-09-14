"use client";

import { useMemo } from "react";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

const EventsList = () => {
  const getEnumLabel = (value: any): string | undefined => {
    const NAMES = ["Increase", "Decrease", "Reset", "Set"] as const;

    const mapIndex = (v: number | bigint) => {
      const idx = Number(v);
      return NAMES[idx] as string | undefined;
    };

    const visit = (v: any, depth = 0): string | undefined => {
      if (v == null || depth > 4) return undefined;
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "bigint") return mapIndex(v);
      if (Array.isArray(v)) {
        for (const item of v) {
          const res = visit(item, depth + 1);
          if (res) return res;
        }
        return undefined;
      }
      if (typeof v === "object") {
        // Handle { variant: { Increase: true } }-like shapes
        if (v.variant && typeof v.variant === "object") {
          const keys = Object.keys(v.variant);
          if (keys.length === 0) return "";
          if (keys.length === 1) return keys[0] as string;
          const found = keys.find((k) => (v.variant as any)[k]);
          if (found) return found as string;
        }
        if (typeof v.__kind === "string") return v.__kind as string;
        if (typeof v.variant === "string") return v.variant as string;
        if (typeof v.value === "number" || typeof v.value === "bigint")
          return mapIndex(v.value);
        if (typeof v.val === "number" || typeof v.val === "bigint")
          return mapIndex(v.val);
        if (typeof v.name === "string") return v.name as string;
        for (const k of Object.keys(v)) {
          if (k === "variant" || k === "__kind") continue;
          if (/^\d+$/.test(k)) {
            const named = mapIndex(Number(k));
            if (named) return named;
          }
          if ((NAMES as readonly string[]).includes(k)) return k;
        }
        for (const k of Object.keys(v)) {
          const res = visit((v as any)[k], depth + 1);
          if (res) return res;
        }
      }
      return undefined;
    };

    return visit(value);
  };

  const toBigInt = (v: any): bigint | undefined => {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(v);
    if (typeof v === "string") {
      try {
        return v.startsWith("0x") ? BigInt(v) : BigInt(v);
      } catch {}
    }
    return undefined;
  };

  const decodeChangeReason = (
    reason: any,
    oldValue: any,
    newValue: any,
  ): string => {
    // Try explicit enum decoding first
    const label = getEnumLabel(reason);
    if (label) return label;

    // Try object with keys Increase/Decrease/Reset/Set
    if (reason && typeof reason === "object") {
      for (const key of ["Increase", "Decrease", "Reset", "Set"]) {
        if ((reason as any)[key] != null) return key;
      }
    }

    // Fallback: infer from values
    const oldBn = toBigInt(oldValue) ?? 0n;
    const newBn = toBigInt(newValue) ?? 0n;
    if (newBn > oldBn) return "Increase";
    if (newBn < oldBn) return "Decrease";
    if (newBn === 0n && oldBn !== 0n) return "Reset";
    return "Set";
  };

  // fromBlock = 0n to read since deployment
  const { data, isLoading, error } = useScaffoldEventHistory({
    contractName: "CounterContract",
    eventName: "CounterChanged",
    fromBlock: 0n,
    blockData: false,
    transactionData: false,
    receiptData: false,
    watch: true,
    format: true,
  });

  const items = useMemo(() => data ?? [], [data]);

  if (error) {
    return <div className="text-error">Failed to load events.</div>;
  }

  if (isLoading && items.length === 0) {
    return <div>Loading events…</div>;
  }

  return (
    <div className="w-full max-w-3xl">
      <h3 className="text-lg font-semibold mb-2">CounterChanged events</h3>
      {items.length === 0 ? (
        <div className="opacity-70">No events yet</div>
      ) : (
        <ul className="space-y-2">
          {items.map((e: any, idx: number) => {
            const show = e?.parsedArgs ?? e?.args ?? {};
            let reasonValue = (e?.args as any)?.reason ?? (show as any)?.reason;
            if (reasonValue === undefined && e?.type && show && typeof show === "object") {
              try {
                const byIndex: Record<string, any> = show as any;
                const named: Record<string, any> = {};
                for (let i = 0; i < (e.type?.length ?? 0); i++) {
                  const key = e.type[i]?.name;
                  if (!key) continue;
                  const v = byIndex[i] ?? byIndex[String(i)];
                  if (v !== undefined) named[key] = v;
                }
                reasonValue = named.reason;
              } catch {}
            }
            const reasonLabel = decodeChangeReason(
              reasonValue,
              (show as any)?.old_value ?? (e?.args as any)?.old_value,
              (show as any)?.new_value ?? (e?.args as any)?.new_value,
            );
            return (
              <li key={idx} className="p-3 rounded border border-base-300">
                <div className="text-sm opacity-70">#{items.length - idx}</div>
                <div className="text-sm break-all">Reason: {reasonLabel}</div>
                <div className="text-sm">Old Value: {String(show?.old_value ?? "-")}</div>
                <div className="text-sm">New Value: {String(show?.new_value ?? "-")}</div>
                <div className="text-xs opacity-70 break-all">Caller: {String(show?.caller ?? "-")}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default EventsList;


