"use client";

import { useMemo, type ReactNode } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useAccount } from "~~/hooks/useAccount";
import { ContractName } from "~~/utils/scaffold-stark/contract";

type OwnerGuardProps = {
  contractName?: ContractName;
  ownerFunctionName?: "owner";
  children: (args: {
    isOwner: boolean;
    ownerAddress?: string;
    accountAddress?: string;
    isLoading: boolean;
  }) => ReactNode;
};

const OwnerGuard = ({
  contractName = "CounterContract",
  ownerFunctionName = "owner",
  children,
}: OwnerGuardProps) => {
  const { address } = useAccount();
  const { data: ownerData, isLoading } = useScaffoldReadContract({
    contractName,
    functionName: ownerFunctionName,
    args: [],
  });

  const { isOwner, ownerAddress, accountAddress } = useMemo(() => {
    const toHexLower = (v: unknown): string | undefined => {
      if (typeof v === "string") return v.toLowerCase();
      if (typeof v === "bigint") return `0x${v.toString(16)}`;
      if (Array.isArray(v) && v.length > 0) return toHexLower(v[0]);
      return undefined;
    };

    const ownerAddr = toHexLower(ownerData as unknown);
    const userAddr = toHexLower(address as unknown);
    return {
      isOwner: !!ownerAddr && !!userAddr && ownerAddr === userAddr,
      ownerAddress: ownerAddr,
      accountAddress: userAddr,
    };
  }, [ownerData, address]);

  return <>{children({ isOwner, ownerAddress, accountAddress, isLoading })}</>;
};

export default OwnerGuard;


