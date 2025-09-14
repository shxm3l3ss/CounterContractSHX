"use client";

import { useState, useCallback } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const IncreaseCounterButton = () => {
  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "increase_counter",
  });

  const [error, setError] = useState<string | null>(null);

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
      <button className="btn btn-secondary" onClick={onClick} disabled={status === "pending"}>
        {status === "pending" ? "Confirm in wallet..." : "Increase"}
      </button>
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
};

export default IncreaseCounterButton;


