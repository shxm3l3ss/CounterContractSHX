"use client";

import { useCallback, useMemo, useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import OwnerGuard from "./OwnerGuard";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useAccount } from "~~/hooks/useAccount";
import { useReadContract, Abi } from "@starknet-react/core";
import { uint256 } from "starknet";

const ResetCounter = () => {
  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "reset_counter",
  });

  // STRK allowance management (need 1 STRK)
  const REQUIRED_AMOUNT = 10n ** 18n; // 1 STRK with 18 decimals
  const { data: counterDeployed } = useDeployedContractInfo("CounterContract");
  const { data: strkDeployed } = useDeployedContractInfo("Strk");
  const { address: accountAddress } = useAccount();

  const allowanceRead = useReadContract({
    functionName: "allowance",
    address: strkDeployed?.address,
    abi: (strkDeployed?.abi as Abi) as any[],
    watch: true,
    enabled: Boolean(accountAddress && counterDeployed?.address),
    args:
      accountAddress && counterDeployed?.address
        ? [accountAddress, counterDeployed.address]
        : [],
    blockIdentifier: "pre_confirmed" as any,
  });

  const allowance: bigint = useMemo(() => {
    const data: any = allowanceRead.data;
    if (typeof data === "bigint") return data;
    if (data && typeof data === "object" && data.low != null && data.high != null) {
      const low = BigInt(data.low);
      const high = BigInt(data.high);
      return (high << 128n) + low;
    }
    return 0n;
  }, [allowanceRead.data]);

  const { sendAsync: approveAsync, status: approveStatus } = useScaffoldWriteContract({
    contractName: "Strk",
    functionName: "approve",
    // default args will be overridden on send; keep types happy
    args: [counterDeployed?.address ?? "0x0", uint256.bnToUint256(0n)] as any,
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

  const approving = approveStatus === "pending";
  const resetting = status === "pending";
  const needsApproval = allowance < REQUIRED_AMOUNT;

  return (
    <OwnerGuard>
      {({ ownerAddress, accountAddress }) => {
        const isOwner =
          ownerAddress && accountAddress
            ? BigInt(ownerAddress) === BigInt(accountAddress)
            : false;
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-row items-center gap-2">
              <button
                className="btn btn-secondary"
                disabled={resetting || needsApproval}
                onClick={onClick}
              >
                {resetting ? "Confirm in wallet..." : "Reset"}
              </button>
              {needsApproval && (
                <button
                  className="btn btn-secondary"
                  disabled={approving || !counterDeployed?.address}
                  onClick={async () => {
                    try {
                      setError(null);
                      await approveAsync({
                        args: [
                          counterDeployed?.address as string,
                          uint256.bnToUint256(REQUIRED_AMOUNT),
                        ],
                      });
                    } catch (e: any) {
                      setError(e?.message || "Approval failed");
                    }
                  }}
                >
                  {approving ? "Approve in wallet..." : "Approve 1 STRK"}
                </button>
              )}
            </div>
            {error && <div className="text-error text-sm">{error}</div>}
          </div>
        );
      }}
    </OwnerGuard>
  );
};

export default ResetCounter;


