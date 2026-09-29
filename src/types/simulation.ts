export type DispatchStrategy = 
  | 'NORMAL'
  | 'FCFS'
  | 'AI_OPTIMIZED';

export type DestinationPattern = 
  | 'UNIFORM'
  | 'UPPER_HEAVY'
  | 'GROUND_HEAVY'
  | 'MIDDLE_HEAVY';

export type ViewMode = 
  | 'NORMAL'
  | 'CROWD_HEATMAP'
  | 'ELEVATOR_FLOW'
  | 'CONGESTION_VIEW';

export type CameraPreset = 
  | 'FULL'
  | 'TOP'
  | 'ELEVATOR'
  | 'CROWD'
  | 'FLOOR'
  | 'FOLLOW_STUDENT'
  | 'FOLLOW_ELEVATOR'
  | 'FOLLOW_CONGESTION';

export type ElevatorStatus = 
  | 'IDLE'
  | 'MOVING_UP'
  | 'MOVING_DOWN'
  | 'DOORS_OPENING'
  | 'DOORS_OPEN'
  | 'DOORS_CLOSING'
  | 'MAINTENANCE'
  | 'FAILED';

export type AgentState =
  | 'WALKING_TO_ELEVATOR'
  | 'WAITING'
  | 'QUEUEING'
  | 'ENTERING_ELEVATOR'
  | 'INSIDE_ELEVATOR'
  | 'EXITING_ELEVATOR'
  | 'WALKING_TO_CLASS'
  | 'COMPLETED';

export interface Passenger {
  id: string;
  sourceFloor: number;
  destinationFloor: number;
  spawnTime: number;
  boardTime?: number;
  leaveTime?: number;
  assignedElevatorId?: string;
  isStairRider?: boolean;
}

export interface StudentAgent {
  id: string;
  sourceFloor: number;
  destinationFloor: number;
  spawnTime: number;
  state: AgentState;
  position: [number, number, number]; // 3D coordinates
  targetPosition: [number, number, number];
  assignedElevatorId?: string;
  slotInLift?: number;
  queueIndex?: number;
  
  // Waypoint Pathfinding
  waypoints: [number, number, number][];
  currentWaypointIndex: number;
  
  // Visual Aesthetics
  shirtColor: string;
  pantsColor: string;
  backpackColor: string;
  hairColor: string;
  skinColor: string;
  heightScale: number; // 0.9 to 1.1 for subtle natural variety
  
  // Animation
  animPhase: number;
  rotationY: number;
  speed: number;
  waitTime: number;
  travelTime: number;
}

export interface ElevatorCar {
  id: string;
  name: string; // e.g., 'Elevator 1', 'Elevator 2'
  currentFloor: number; // floating point during kinematic movement
  targetFloors: number[]; // scheduled stop sequence
  direction: 'UP' | 'DOWN' | 'IDLE';
  status: ElevatorStatus;
  capacity: number;
  passengers: Passenger[];
  speed: number; // floors per second
  doorOpenTimer: number; // seconds remaining for doors
  doorsState: number; // 0 = closed, 1 = fully open
  doorOpenTime: number; // door dwell time in seconds
  enabled: boolean;
  isExpressUpper?: boolean;
  tripsCompleted: number;
  totalPassengersTransported: number;
  shaftX: number; // 3D X offset in central elevator bank
}

export interface FloorData {
  floorNumber: number;
  label: string; // "GROUND", "F1", ..., "F6"
  waitingUp: Passenger[];
  waitingDown: Passenger[];
  alightedStudents: Passenger[];
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  congestionScore: number; // 0.0 to 1.0
  classroomCapacity: number;
  activeStudentsInRooms: number;
  avgWaitSeconds: number;
  isPredictedHotspot?: boolean;
  predictedDemandTimer?: number;
}

export interface TimetableClassEvent {
  id: string;
  timeString: string; // "10:00"
  timeMinutes: number; // minutes from start of sim day e.g. 600 = 10:00
  title: string;
  floorNumber: number;
  studentsReleased: number;
  destinationPreference: DestinationPattern;
  triggered: boolean;
}

export interface SimulationConfig {
  numFloors: number; // 7 (Ground=0, Floors 1-6)
  numElevators: number; // 1 to 5 (default 3)
  elevatorCapacity: number; // 4 to 20 (default 12)
  elevatorSpeed: number; // 0.8 to 2.8 floors/sec (default 1.5)
  doorOpenDuration: number; // seconds
  studentPopulation: number; // 10 to 500
  studentArrivalRate: number; // students per minute
  walkingSpeed: number; // 1.0 to 2.5
  peakMultiplier: number; // 0.5x to 4.0x
  destinationPattern: DestinationPattern;
  dispatchStrategy: DispatchStrategy;
  aiDispatchEnabled: boolean;
  seed: number;
  timeScale: number; // 0.5, 1, 2, 5, 10
  explodedSpacing: number; // 0.0 (normal) to 1.5 (cutaway exploded view)
}

export interface SimulationMetrics {
  currentTimeSeconds: number;
  simulatedClockTime: string; // "10:04:12 AM"
  totalSpawnedStudents: number;
  totalCompletedJourneys: number;
  studentsInBuilding: number;
  studentsWaiting: number;
  studentsMoving: number;
  studentsInsideElevators: number;
  
  // Metric aliases
  currentlyWaiting?: number;
  currentlyInTransit?: number;
  
  // Wait times
  avgWaitSeconds: number;
  maxWaitSeconds: number;
  baselineAvgWaitSeconds: number;
  
  // Queue stats
  avgQueueLength: number;
  maxQueueLength: number;
  
  // Key Outcome Metric:
  totalStudentMinutesLost: number;
  totalStudentMinutesSaved: number;
  percentImprovement: number;
  
  // Elevator stats
  avgUtilization: number; // 0 - 100%
  totalTripsCompleted: number;
  congestionEventsCount: number;
  
  // History for charts & comparison
  history: {
    timeSeconds: number;
    clockTime: string;
    waitingCount: number;
    avgWaitTime: number;
    timeSavedMinutes: number;
    utilization: number;
  }[];
}

export interface RouteOption {
  name: string;
  waitTimeSec: number;
  travelTimeSec: number;
  totalTimeSec: number;
  isRecommended: boolean;
}

export interface CrowdPrediction {
  timestampMinutes: number;
  currentWaitingLobby: number;
  predictedWait2Min: number;
  predictedWait5Min: number;
  predictedWait10Min: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  topCongestedFloors: { floor: number; expectedQueue: number }[];
}

export interface AIAdvisory {
  id: string;
  timestamp: string;
  category: 'PREDICTION' | 'DISPATCH' | 'OPTIMIZATION' | 'ALERT' | 'BENCHMARK';
  message: string;
  impactScore?: string;
  actionTaken?: string;
}

export interface BenchmarkResult {
  baselineAvgWait: number;
  baselineMaxWait: number;
  baselineTotalLostMin: number;
  baselineQueueLength: number;
  aiAvgWait: number;
  aiMaxWait: number;
  aiTotalLostMin: number;
  aiQueueLength: number;
  totalMinutesSaved: number;
  percentSaved: number;
  utilizationChange: string;
}
