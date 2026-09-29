import React, { useState } from 'react';
import { 
  SimulationEngine, 
  TOTAL_FLOORS 
} from '../../engine/simulationEngine';
import { 
  TimetableClassEvent, 
  DestinationPattern 
} from '../../types/simulation';
import { 
  CalendarClock, 
  X, 
  Bell, 
  Plus, 
  Trash2, 
  Play, 
  Sparkles,
  Users,
  Clock
} from 'lucide-react';

interface TimetableModalProps {
  engine: SimulationEngine;
  isOpen: boolean;
  onClose: () => void;
  onSimulateClassChange: (floor: number, count: number) => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  engine,
  isOpen,
  onClose,
  onSimulateClassChange,
}) => {
  const [timetable, setTimetable] = useState<TimetableClassEvent[]>(engine.timetable);
  const [newFloor, setNewFloor] = useState<number>(4);
  const [newStudents, setNewStudents] = useState<number>(85);
  const [newTime, setNewTime] = useState<string>('10:15 AM');
  const [newTitle, setNewTitle] = useState<string>('Computer Science Lecture Dismissal');

  if (!isOpen) return null;

  const handleTriggerImmediate = (event: TimetableClassEvent) => {
    engine.triggerClassRelease(event.floorNumber, event.studentsReleased, event.destinationPreference);
    event.triggered = true;
    setTimetable([...engine.timetable]);
    onSimulateClassChange(event.floorNumber, event.studentsReleased);
  };

  const handleAddEvent = () => {
    const newEv: TimetableClassEvent = {
      id: `tt-${Date.now()}`,
      timeString: newTime,
      timeMinutes: 615,
      title: newTitle || `Floor ${newFloor} Dismissal`,
      floorNumber: newFloor,
      studentsReleased: newStudents,
      destinationPreference: 'GROUND_HEAVY',
      triggered: false,
    };
    engine.timetable.push(newEv);
    setTimetable([...engine.timetable]);
  };

  const handleDeleteEvent = (id: string) => {
    engine.timetable = engine.timetable.filter(e => e.id !== id);
    setTimetable([...engine.timetable]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                COLLEGE CLASS TIMETABLE SIMULATION
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Simulate scheduled class dismissal events and watch students flood corridors and elevators.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Schedule list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                Scheduled Class Dismissals & Campus Rush Events
              </span>
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Clock: {engine.metrics.simulatedClockTime}
              </span>
            </div>

            <div className="space-y-2">
              {timetable.map(ev => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    ev.triggered
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-indigo-800/40">
                      {ev.timeString}
                    </span>

                    <div>
                      <div className="font-bold text-slate-200 text-xs">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-cyan-300 font-semibold">{ev.floorNumber === 0 ? 'Ground Lobby' : `Floor ${ev.floorNumber}`}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Users className="w-3 h-3 text-cyan-400" />
                          {ev.studentsReleased} students
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{ev.destinationPreference.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerImmediate(ev)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Bell className="w-3 h-3 text-cyan-300" />
                      DISMISS CLASS NOW
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                      title="Remove event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom event */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider block text-xs">
              Schedule New Class Dismissal
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Time:</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="10:15 AM"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Floor:</label>
                <select
                  value={newFloor}
                  onChange={(e) => setNewFloor(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                >
                  {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Ground Lobby' : `Floor ${i}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Students Released:</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="5"
                  value={newStudents}
                  onChange={(e) => setNewStudents(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Timetable
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Click &apos;DISMISS CLASS NOW&apos; on any event to watch student bots exit classrooms toward elevators.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
