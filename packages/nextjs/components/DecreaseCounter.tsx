"use client";

import { useCallback, useMemo, useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
const DecreaseCounterButton = ({ counterValue }: { counterValue?: bigint }) => {

  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "decrease_counter",
  });

  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    const value = typeof counterValue === "bigint" ? counterValue : 0n;
    return status === "pending" || value === 0n;
  }, [counterValue, status]);

  const onClick = useCallback(async () => {
    setError(null);
    try {
      await sendAsync();
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
    }
  }, [sendAsync]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button className="btn btn-secondary" onClick={onClick} disabled={disabled}>
        {status === "pending" ? "Confirm in wallet..." : "Decrease"}
      </button>
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
};

export default DecreaseCounterButton;


