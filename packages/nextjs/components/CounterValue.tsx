"use client";

type CounterValueProps = {
  value?: bigint;
  isLoading?: boolean;
};

const CounterValue = ({ value, isLoading }: CounterValueProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm opacity-70">Counter</div>
      <div className="text-3xl font-bold">
        {isLoading ? "Loading..." : value?.toString() ?? "—"}
      </div>
    </div>
  );
};

export default CounterValue;


