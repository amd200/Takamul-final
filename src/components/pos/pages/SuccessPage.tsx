import { usePos } from "@/context/PosContext";

export function SuccessPage() {
  const { successInfo, setScreen } = usePos();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3 h-full">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
      <div className="text-lg font-black text-green-600">Payment Successful!</div>
      <div className="text-sm text-gray-500">Order #0542145 · $195.00 received</div>
      <div className="text-sm font-bold text-primary">
        {successInfo.method} · ${successInfo.amount} paid
      </div>
      <button onClick={() => setScreen("home")} className="mt-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
        + New Order
      </button>
    </div>
  );
}
