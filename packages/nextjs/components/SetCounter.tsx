"use client";

import { useState, useCallback, useMemo } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import OwnerGuard from "./OwnerGuard";

const SetCounterForm = () => {
  const [setInput, setSetInput] = useState("");
  const { sendAsync: setCounter, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "set_counter",
    args: [0n],
  });


  const parsedValue = useMemo(() => {
    try {
      if (setInput.trim() === "") return undefined;
      const v = BigInt(setInput);
      const MAX_U32 = 4294967295n;
      if (v < 0n || v > MAX_U32) return undefined;
      return v;
    } catch {
      return undefined;
    }
  }, [setInput]);

  const onSetCounter = useCallback(async () => {
    if (parsedValue === undefined) return;
    try {
      await setCounter({ args: [parsedValue] });
      setSetInput("");
    } catch (e) {
      // swallow to keep UX simple; notifications handled by hook
    }
  }, [parsedValue, setCounter]);

  return (
    <OwnerGuard>
      {({ ownerAddress, accountAddress }) => {
        const isOwner =
          ownerAddress && accountAddress
            ? BigInt(ownerAddress) === BigInt(accountAddress)
            : false;
        return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={4294967295}
            placeholder="Type new value"
            className="input input-bordered"
            value={setInput}
            onChange={(e) => setSetInput(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            disabled={status === "pending" || parsedValue === undefined || !isOwner}
            onClick={onSetCounter}
          >
            {status === "pending" ? "Confirm in wallet..." : "Set"}
          </button>
        </div>
        );
      }}
    </OwnerGuard>
  );
};

export default SetCounterForm;


