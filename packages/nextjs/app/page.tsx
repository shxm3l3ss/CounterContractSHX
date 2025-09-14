"use client";

import CounterValue from "~~/components/CounterValue";
import IncreaseCounterButton from "~~/components/IncreaseCounter";
import DecreaseCounterButton from "~~/components/DecreaseCounter";
import SetCounterForm from "~~/components/SetCounter";
import EventsList from "~~/components/EventsList";
import ResetCounter from "~~/components/ResetCounter";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const Home = () => {
  const { data, isLoading } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "get_counter",
  });

  let counterValue: bigint | undefined;
  if (typeof data === "bigint") {
    counterValue = data;
  } else if (typeof data === "number") {
    counterValue = BigInt(data);
  }


  return (
    <div className="flex items-center flex-col grow pt-10">
      <CounterValue value={counterValue} isLoading={isLoading} />
      <div className="h-3" />
      <div className="flex flex-row items-center gap-3 flex-wrap">
        <IncreaseCounterButton />
        <DecreaseCounterButton counterValue={counterValue} />
        <ResetCounter />
      </div>
      <div className="h-3" />
      <SetCounterForm />
      <div className="h-6" />
      <EventsList />
    </div>
  );
};

export default Home;
