import { usePos } from "@/context/PosContext";

export function HoldListPage() {
  const { heldCarts, restoreHold, setScreen } = usePos();

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-4">
        <span className="text-base font-black text-gray-800">⏸ On Hold Carts</span>
        <button onClick={() => setScreen("home")} className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
          + New Order
        </button>
      </div>

      {heldCarts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No held carts yet</div>
      ) : (
        heldCarts.map((h, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border-2 border-dashed border-primary/30 mb-2.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-800">
                🛒 {h.items.length} item{h.items.length !== 1 ? "s" : ""} · ${h.total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Note: {h.note} · Held at {h.time}
              </div>
            </div>
            <button onClick={() => restoreHold(i)} className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
              Restore
            </button>
          </div>
        ))
      )}
    </div>
  );
}
