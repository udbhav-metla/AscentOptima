import React from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  X, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Pause, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Gauge, 
  Compass,
  Clock,
  Sparkles
} from 'lucide-react';

interface ElevatorInspectorModalProps {
  engine: SimulationEngine;
  elevatorId: string | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onRideLift?: (id: string) => void;
}

export const ElevatorInspectorModal: React.FC<ElevatorInspectorModalProps> = ({
  engine,
  elevatorId,
  onClose,
  onToggleStatus,
  onRideLift,
}) => {
  if (!elevatorId) return null;

  const lift = engine.elevators.find(e => e.id === elevatorId);
  if (!lift) return null;

  const occupancyPct = Math.round((lift.passengers.length / Math.max(1, lift.capacity)) * 100);

  // Estimated arrival time to next target stop
  let etaSeconds = 0;
  if (lift.targetFloors.length > 0) {
    const nextStop = lift.targetFloors[0];
    const diff = Math.abs(nextStop - lift.currentFloor);
    etaSeconds = Math.round(diff / lift.speed + (lift.doorsState > 0 ? 2 : 0));
  }

  return (
    <div className="absolute top-20 right-88 z-30 w-84 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden select-none text-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm">
              {lift.name} TELEMETRY
            </h3>
            <span className="text-[10px] text-slate-400">
              Core Shaft Position: X={lift.shaftX.toFixed(1)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3.5">
        {/* Status banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !lift.enabled
                  ? 'bg-rose-500 animate-ping'
                  : lift.direction === 'UP'
                  ? 'bg-emerald-400'
                  : lift.direction === 'DOWN'
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="font-bold text-slate-200">
              {!lift.enabled ? 'OUT OF SERVICE (FAILED)' : lift.status}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
            {lift.direction}
          </span>
        </div>

        {/* Current Floor & ETA */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
              Current Level
            </div>
            <div className="font-mono text-base font-bold text-white">
              {Math.round(lift.currentFloor) === 0 ? 'GROUND' : `FLOOR ${Math.round(lift.currentFloor)}`}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Exact: {lift.currentFloor.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Next Stop ETA
            </div>
            <div className="font-mono text-base font-bold text-cyan-300">
              {etaSeconds > 0 ? `${etaSeconds} sec` : 'At Floor'}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Target: {lift.targetFloors[0] !== undefined ? (lift.targetFloors[0] === 0 ? 'Ground' : `F${lift.targetFloors[0]}`) : 'None'}
            </div>
          </div>
        </div>

        {/* Passenger Occupancy */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold">Car Occupancy:</span>
            <span className="font-mono text-cyan-300 font-bold">
              {lift.passengers.length} / {lift.capacity} ({occupancyPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                occupancyPct >= 100
                  ? 'bg-rose-500'
                  : occupancyPct > 70
                  ? 'bg-amber-500'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>

        {/* Scheduled Stop Sequence */}
        <div>
          <span className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" />
            Scheduled Stop Queue ({lift.targetFloors.length})
          </span>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex flex-wrap gap-1.5 min-h-10 items-center">
            {lift.targetFloors.length === 0 ? (
              <span className="text-slate-500 text-[10px]">No scheduled stops • Car is idle</span>
            ) : (
              lift.targetFloors.map((fl, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-200"
                >
                  #{idx + 1}: {fl === 0 ? 'Ground' : `F${fl}`}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Trips & Energy */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            Trips: <strong className="text-slate-200">{lift.tripsCompleted}</strong>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            Transported: <strong className="text-emerald-400">{lift.totalPassengersTransported}</strong>
          </div>
        </div>

        {/* Action Buttons: Ride Lift / Fail Lift */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          {onRideLift && (
            <button
              onClick={() => onRideLift(lift.id)}
              className="w-full py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              RIDE THIS LIFT WITH STUDENTS
            </button>
          )}

          <button
            onClick={() => onToggleStatus(lift.id)}
            className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              lift.enabled
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {lift.enabled ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                SIMULATE FAILURE (FAIL LIFT)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                RESTORE TO SERVICE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
