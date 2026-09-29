import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SimulationEngine, 
  INITIAL_CONFIG 
} from './engine/simulationEngine';
import { 
  ViewMode, 
  CameraPreset, 
  DispatchStrategy 
} from './types/simulation';
import { BuildingCanvas } from './components/3d/BuildingCanvas';
import { HeaderBar } from './components/ui/HeaderBar';
import { MetricsBar } from './components/ui/MetricsBar';
import { SimulationControlsPanel } from './components/ui/SimulationControlsPanel';
import { AiCommandCenter } from './components/ui/AiCommandCenter';
import { WhatIfLabModal } from './components/ui/WhatIfLabModal';
import { BeforeVsAiModal } from './components/ui/BeforeVsAiModal';
import { TimetableModal } from './components/ui/TimetableModal';
import { FloorInspectorModal } from './components/ui/FloorInspectorModal';
import { ElevatorInspectorModal } from './components/ui/ElevatorInspectorModal';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function App() {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());
  const engine = engineRef.current;

  // React state for reactive UI updates
  const [, setTick] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);

  // 3D Viewport State
  const [viewMode, setViewMode] = useState<ViewMode>('NORMAL');
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('FULL');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedElevatorId, setSelectedElevatorId] = useState<string | null>(null);
  const [explodedSpacing, setExplodedSpacing] = useState<number>(0.0);

  // Sidebar Toggles
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Modals State
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isBeforeVsAiOpen, setIsBeforeVsAiOpen] = useState<boolean>(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState<boolean>(false);

  // Simulation tick loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const safeDt = Math.min(dt, 0.1);

      if (isRunning) {
        engine.update(safeDt);
        setTick(prev => (prev + 1) % 1000000);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [isRunning, engine]);

  const handleStep = useCallback(() => {
    engine.update(2.0);
    setTick(prev => (prev + 1) % 1000000);
  }, [engine]);

  const handleReset = useCallback(() => {
    engine.resetSimulation();
    setSelectedFloor(null);
    setSelectedElevatorId(null);
    setTick(prev => (prev + 1) % 1000000);
  }, [engine]);

  const handleStrategyChange = useCallback((strat: DispatchStrategy) => {
    engine.config.dispatchStrategy = strat;
    engine.config.aiDispatchEnabled = strat === 'AI_OPTIMIZED';
    engine.addAdvisory('OPTIMIZATION', `Dispatch algorithm changed to ${strat}.`, 'Re-evaluating fleet');
    setTick(prev => (prev + 1) % 1000000);
  }, [engine]);

  const handleForceUpdate = useCallback(() => {
    setTick(prev => (prev + 1) % 1000000);
  }, []);

  // Follow congestion button handler: automatically flies camera to the floor with highest queue
  const handleFollowCongestion = useCallback(() => {
    let worstFloor = 0;
    let maxWaiting = -1;
    for (const f of engine.floors) {
      const count = f.waitingUp.length + f.waitingDown.length;
      if (count > maxWaiting) {
        maxWaiting = count;
        worstFloor = f.floorNumber;
      }
    }
    setSelectedFloor(worstFloor);
    setActiveCameraPreset('FLOOR');
    engine.addAdvisory('ALERT', `Camera tracking worst congestion bottleneck at ${engine.floors[worstFloor].label} (${maxWaiting} waiting).`, 'Focus engaged');
    setTick(prev => (prev + 1) % 1000000);
  }, [engine]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Game Top Header Bar */}
      <HeaderBar
        engine={engine}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        speed={speed}
        setSpeed={setSpeed}
        onReset={handleReset}
        onStep={handleStep}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenBeforeVsAi={() => setIsBeforeVsAiOpen(true)}
        onOpenTimetable={() => setIsTimetableOpen(true)}
        onFollowCongestion={handleFollowCongestion}
      />

      {/* 2. Primary Telemetry HUD Bar */}
      <MetricsBar
        engine={engine}
        onStrategyChange={handleStrategyChange}
      />

      {/* 3. Main Workspace: 3D Digital Twin Viewport */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Panel: Simulation Controls & Sliders */}
        {isLeftPanelOpen && (
          <SimulationControlsPanel
            engine={engine}
            onUpdate={handleForceUpdate}
            selectedElevatorId={selectedElevatorId}
            setSelectedElevatorId={setSelectedElevatorId}
          />
        )}

        {/* Toggle button for left panel */}
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`absolute top-4 ${isLeftPanelOpen ? 'left-82' : 'left-4'} z-20 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-xl transition-all`}
          title={isLeftPanelOpen ? 'Collapse Controls Panel' : 'Open Controls Panel'}
        >
          {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Center: 3D Digital Twin Building Canvas */}
        <main className="flex-1 h-full relative">
          <BuildingCanvas
            engine={engine}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
            selectedElevatorId={selectedElevatorId}
            setSelectedElevatorId={setSelectedElevatorId}
            activeCameraPreset={activeCameraPreset}
            setActiveCameraPreset={setActiveCameraPreset}
            explodedSpacing={explodedSpacing}
            setExplodedSpacing={setExplodedSpacing}
            onFollowCongestion={handleFollowCongestion}
          />

          {/* Floor Inspector Popup (when floor is clicked or selected) */}
          <FloorInspectorModal
            engine={engine}
            floorNumber={selectedFloor}
            onClose={() => setSelectedFloor(null)}
            onTriggerCrowd={handleForceUpdate}
          />

          {/* Elevator Inspector Popup (when lift is clicked or selected) */}
          <ElevatorInspectorModal
            engine={engine}
            elevatorId={selectedElevatorId}
            onClose={() => setSelectedElevatorId(null)}
            onToggleStatus={(id) => {
              engine.toggleElevatorStatus(id);
              handleForceUpdate();
            }}
            onRideLift={(id) => {
              setSelectedElevatorId(id);
              setActiveCameraPreset('FOLLOW_ELEVATOR');
            }}
          />
        </main>

        {/* Toggle button for right panel */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className={`absolute top-4 ${isRightPanelOpen ? 'right-86' : 'right-4'} z-20 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-xl transition-all`}
          title={isRightPanelOpen ? 'Collapse AI Command Center' : 'Open AI Command Center'}
        >
          {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        {/* Right Panel: AI Command Center & Route Advisor */}
        {isRightPanelOpen && (
          <AiCommandCenter
            engine={engine}
            onSelectFloor={(fl) => {
              setSelectedFloor(fl);
              setActiveCameraPreset('FLOOR');
              handleForceUpdate();
            }}
          />
        )}
      </div>

      {/* 4. Global Modals */}
      <WhatIfLabModal
        engine={engine}
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        onApplyScenario={handleForceUpdate}
      />

      <BeforeVsAiModal
        engine={engine}
        isOpen={isBeforeVsAiOpen}
        onClose={() => setIsBeforeVsAiOpen(false)}
        onSwitchToAi={() => {
          handleStrategyChange('AI_OPTIMIZED');
          handleForceUpdate();
        }}
        onSwitchToBaseline={() => {
          handleStrategyChange('NORMAL');
          handleForceUpdate();
        }}
      />

      <TimetableModal
        engine={engine}
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        onSimulateClassChange={() => {
          setViewMode('CROWD_HEATMAP');
          handleForceUpdate();
        }}
      />
    </div>
  );
}
