import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { 
  SimulationEngine, 
  TOTAL_FLOORS,
  BASE_FLOOR_HEIGHT
} from '../../engine/simulationEngine';
import { 
  ViewMode, 
  CameraPreset, 
  ElevatorCar,
  StudentAgent
} from '../../types/simulation';
import { 
  Eye, 
  Flame, 
  Activity, 
  Camera, 
  Zap, 
  Layers,
  ArrowRight,
  Focus,
  Maximize2
} from 'lucide-react';

interface BuildingCanvasProps {
  engine: SimulationEngine;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
  selectedElevatorId: string | null;
  setSelectedElevatorId: (id: string | null) => void;
  activeCameraPreset: CameraPreset;
  setActiveCameraPreset: (preset: CameraPreset) => void;
  explodedSpacing: number;
  setExplodedSpacing: (spacing: number) => void;
  onFollowCongestion: () => void;
}

const BUILDING_WIDTH = 26;
const BUILDING_DEPTH = 15;
const MAX_BOTS = 250;

export const BuildingCanvas: React.FC<BuildingCanvasProps> = ({
  engine,
  viewMode,
  setViewMode,
  selectedFloor,
  setSelectedFloor,
  selectedElevatorId,
  setSelectedElevatorId,
  activeCameraPreset,
  setActiveCameraPreset,
  explodedSpacing,
  setExplodedSpacing,
  onFollowCongestion,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Structural mesh references
  const floorGroupsRef = useRef<{
    group: THREE.Group;
    slabMesh: THREE.Mesh;
    haloMesh: THREE.Mesh;
    floorNum: number;
    baseY: number;
  }[]>([]);

  const elevatorCarsRef = useRef<Map<string, {
    group: THREE.Group;
    doorLeft: THREE.Mesh;
    doorRight: THREE.Mesh;
    glassBody: THREE.Mesh;
    interiorLight: THREE.PointLight;
    hudSprite: THREE.Sprite;
    cable: THREE.Line;
    counterweight: THREE.Mesh;
  }>>(new Map());

  // 8-Part Animated Student Bot Instanced Meshes (including Glowing Visors)
  const botPartsRef = useRef<{
    head: THREE.InstancedMesh;
    visor: THREE.InstancedMesh;
    hair: THREE.InstancedMesh;
    torso: THREE.InstancedMesh;
    backpack: THREE.InstancedMesh;
    leftArm: THREE.InstancedMesh;
    rightArm: THREE.InstancedMesh;
    leftLeg: THREE.InstancedMesh;
    rightLeg: THREE.InstancedMesh;
  } | null>(null);

  // Smooth camera vectors
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(25, 17, 30));
  const controlsTargetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 11, 0));

  // Follow tracking
  const followedStudentId = useRef<string | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.012);
    sceneRef.current = scene;

    // 2. Camera for 7-Floor Building (fits comfortably without zooming out too far)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(25, 17, 30);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 120;
    controls.minDistance = 3.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.target.set(0, 11, 0);
    controlsRef.current = controls;

    // 5. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x475569, 2.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xf8fafc, 2.6);
    mainSun.position.set(30, 60, 40);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    scene.add(mainSun);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 2.0);
    cyanRim.position.set(-30, 35, -25);
    scene.add(cyanRim);

    const warmFill = new THREE.DirectionalLight(0xfef08a, 1.2);
    warmFill.position.set(0, 15, 25);
    scene.add(warmFill);

    // 6. Ground Foundation & Tech Grid
    const groundGrid = new THREE.GridHelper(80, 40, 0x0284c7, 0x1e293b);
    groundGrid.position.y = -0.05;
    scene.add(groundGrid);

    const groundGeo = new THREE.BoxGeometry(BUILDING_WIDTH + 8, 0.4, BUILDING_DEPTH + 8);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
    const groundBase = new THREE.Mesh(groundGeo, groundMat);
    groundBase.position.y = -0.2;
    groundBase.receiveShadow = true;
    scene.add(groundBase);

    // 7. Build 7-Floor College Building
    buildBuildingFloors(scene);

    // 8. Build 3 Panoramic Glass Observation Elevators
    buildElevators(scene, engine);

    // 9. Build Multi-Part Animated Student Bots
    buildAnimatedStudentBots(scene);

    // 10. Raycasting for Object Selection (Clicking Floors & Elevators)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check elevator cabs
      const elevatorMeshes: THREE.Object3D[] = [];
      elevatorCarsRef.current.forEach((val) => elevatorMeshes.push(val.glassBody));
      const elevatorHits = raycaster.intersectObjects(elevatorMeshes, true);
      if (elevatorHits.length > 0) {
        const clickedObj = elevatorHits[0].object;
        let foundLiftId: string | null = null;
        elevatorCarsRef.current.forEach((val, key) => {
          if (val.glassBody === clickedObj || val.group === clickedObj.parent) {
            foundLiftId = key;
          }
        });
        if (foundLiftId) {
          setSelectedElevatorId(foundLiftId);
          return;
        }
      }

      // Check floor slabs
      const floorMeshes = floorGroupsRef.current.map(f => f.slabMesh);
      const floorHits = raycaster.intersectObjects(floorMeshes, false);
      if (floorHits.length > 0) {
        const hit = floorHits[0];
        const match = floorGroupsRef.current.find(f => f.slabMesh === hit.object);
        if (match !== undefined) {
          setSelectedFloor(match.floorNum);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 11. Window Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. Simulation Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera Follow Tracking
      if (cameraRef.current && controlsRef.current) {
        if (activeCameraPreset === 'FOLLOW_ELEVATOR') {
          const lift = engine.elevators.find(e => e.id === (selectedElevatorId || engine.elevators[0]?.id)) || engine.elevators[0];
          if (lift) {
            const currentFloorY = lift.currentFloor * (BASE_FLOOR_HEIGHT + explodedSpacing) + 1.6;
            cameraTargetPos.current.set(lift.shaftX + 4.2, currentFloorY + 1.2, 5.5);
            controlsTargetLookAt.current.set(lift.shaftX, currentFloorY, 0);
          }
        } else if (activeCameraPreset === 'FOLLOW_STUDENT') {
          const activeAgent = engine.agents.find(a => a.id === followedStudentId.current) || engine.agents[0];
          if (activeAgent) {
            followedStudentId.current = activeAgent.id;
            const agentY = activeAgent.position[1];
            cameraTargetPos.current.set(activeAgent.position[0] + 3.5, agentY + 2.0, activeAgent.position[2] + 4.0);
            controlsTargetLookAt.current.set(activeAgent.position[0], agentY + 0.8, activeAgent.position[2]);
          }
        }

        cameraRef.current.position.lerp(cameraTargetPos.current, 0.06);
        controlsRef.current.target.lerp(controlsTargetLookAt.current, 0.06);
        controlsRef.current.update();
      }

      // Update 3D scene elements
      updateScene(engine, delta, elapsedTime, explodedSpacing);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        mountRef.current?.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Camera Presets handler for 7 Floors
  useEffect(() => {
    switch (activeCameraPreset) {
      case 'FULL':
        cameraTargetPos.current.set(25, 17, 30);
        controlsTargetLookAt.current.set(0, 11, 0);
        break;
      case 'TOP':
        cameraTargetPos.current.set(0.1, 38, 6);
        controlsTargetLookAt.current.set(0, 11, 0);
        break;
      case 'ELEVATOR':
        cameraTargetPos.current.set(0, 11, 14);
        controlsTargetLookAt.current.set(0, 11, 0);
        break;
      case 'CROWD':
        cameraTargetPos.current.set(12, 4.5, 14);
        controlsTargetLookAt.current.set(0, 1.8, 1.2);
        break;
      case 'FLOOR':
        if (selectedFloor !== null) {
          const fy = selectedFloor * (BASE_FLOOR_HEIGHT + explodedSpacing);
          cameraTargetPos.current.set(13, fy + 3.5, 15);
          controlsTargetLookAt.current.set(0, fy + 1.2, 0);
        }
        break;
      case 'FOLLOW_CONGESTION':
        break;
      case 'FOLLOW_STUDENT':
      case 'FOLLOW_ELEVATOR':
        break;
    }
  }, [activeCameraPreset, selectedFloor, explodedSpacing]);

  // Re-build elevators if fleet size changes
  useEffect(() => {
    if (!sceneRef.current) return;
    rebuildElevators(sceneRef.current, engine);
  }, [engine.config.numElevators, engine.elevators.length]);

  // Build 7-Floor College Building with Classrooms & Cutaway Openings
  const buildBuildingFloors = (scene: THREE.Scene) => {
    floorGroupsRef.current = [];

    // Building terminates strictly at top of Floor 6 (the 7th floor)
    const buildingRoofY = (TOTAL_FLOORS - 1) * BASE_FLOOR_HEIGHT + 2.8;

    // Columns - ending exactly at the roof level
    const colGeo = new THREE.BoxGeometry(0.5, buildingRoofY, 0.5);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
    const colOffsets = [
      [-BUILDING_WIDTH / 2 + 0.4, -BUILDING_DEPTH / 2 + 0.4],
      [BUILDING_WIDTH / 2 - 0.4, -BUILDING_DEPTH / 2 + 0.4],
      [-BUILDING_WIDTH / 2 + 0.4, BUILDING_DEPTH / 2 - 0.4],
      [BUILDING_WIDTH / 2 - 0.4, BUILDING_DEPTH / 2 - 0.4],
    ];
    for (const [cx, cz] of colOffsets) {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, buildingRoofY / 2, cz);
      scene.add(col);
    }

    // Central core structural back wall - ending exactly at the roof level
    const coreGeo = new THREE.BoxGeometry(16, buildingRoofY, 4.2);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, buildingRoofY / 2, -1.8);
    scene.add(coreMesh);

    // Staircase tower on the right - ending exactly at the roof level
    const stairGeo = new THREE.BoxGeometry(3.6, buildingRoofY, 4.8);
    const stairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, transparent: true, opacity: 0.65 });
    const stairTower = new THREE.Mesh(stairGeo, stairMat);
    stairTower.position.set(BUILDING_WIDTH / 2 - 2.5, buildingRoofY / 2, 0);
    scene.add(stairTower);

    // Rooftop Slab on top of Floor 6 (Ceiling of the 7th floor)
    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING_WIDTH, 0.35, BUILDING_DEPTH),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5 })
    );
    roofSlab.position.set(0, buildingRoofY, 0);
    scene.add(roofSlab);

    const roofEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(roofSlab.geometry),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 })
    );
    roofEdge.position.set(0, buildingRoofY, 0);
    scene.add(roofEdge);

    // Sleek glass terrace railing around rooftop
    const railingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      depthWrite: false,
    });
    const frontRailing = new THREE.Mesh(new THREE.BoxGeometry(BUILDING_WIDTH - 0.4, 0.7, 0.05), railingMat);
    frontRailing.position.set(0, buildingRoofY + 0.35, BUILDING_DEPTH / 2 - 0.2);
    scene.add(frontRailing);

    const backRailing = new THREE.Mesh(new THREE.BoxGeometry(BUILDING_WIDTH - 0.4, 0.7, 0.05), railingMat);
    backRailing.position.set(0, buildingRoofY + 0.35, -BUILDING_DEPTH / 2 + 0.2);
    scene.add(backRailing);

    // Slabs & Architectural Interiors for all 7 floors (0 to 6)
    for (let f = 0; f < TOTAL_FLOORS; f++) {
      const floorGroup = new THREE.Group();
      const baseY = f * BASE_FLOOR_HEIGHT;
      floorGroup.position.set(0, baseY, 0);

      // Floor slab
      const slabGeo = new THREE.BoxGeometry(BUILDING_WIDTH, 0.35, BUILDING_DEPTH);
      const slabMat = new THREE.MeshStandardMaterial({
        color: f === 0 ? 0x1e293b : 0x0f172a,
        roughness: 0.4,
        metalness: 0.35,
        transparent: true,
        opacity: 0.92,
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(0, 0, 0);
      slabMesh.receiveShadow = true;
      floorGroup.add(slabMesh);

      // Glowing edge outline
      const edgeGeo = new THREE.EdgesGeometry(slabGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      floorGroup.add(edgeLine);

      // Classroom wings (Interior desks, monitors & partitions)
      buildClassroomInteriors(floorGroup, f);

      // Elevator Lobby Congestion Halo
      const haloGeo = new THREE.RingGeometry(1.6, 4.6, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 0.20, 1.8);
      haloMesh.rotation.x = -Math.PI / 2;
      floorGroup.add(haloMesh);

      // Floating Floor Label Badge
      const floorLabel = engine.floors[f]?.label || (f === 0 ? 'GROUND LOBBY' : `F${f} • CLASSROOMS`);
      const labelSprite = createFloorLabelSprite(floorLabel);
      labelSprite.position.set(-BUILDING_WIDTH / 2 - 3.4, 1.4, 0);
      floorGroup.add(labelSprite);

      scene.add(floorGroup);

      floorGroupsRef.current.push({
        group: floorGroup,
        slabMesh,
        haloMesh,
        floorNum: f,
        baseY,
      });
    }
  };

  const buildClassroomInteriors = (floorGroup: THREE.Group, floorNum: number) => {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.5 });
    const boardMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Left Classroom Partition
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 8), wallMat);
    leftWall.position.set(-4.5, 1.3, 0);
    floorGroup.add(leftWall);

    // Right Classroom Partition
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 8), wallMat);
    rightWall.position.set(4.5, 1.3, 0);
    floorGroup.add(rightWall);

    // Desks inside wings
    for (let d = -2.2; d <= 2.2; d += 1.8) {
      // Left desks
      const lDesk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.75), deskMat);
      lDesk.position.set(-8.5, 0.50, d);
      floorGroup.add(lDesk);

      // Right desks
      const rDesk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.75), deskMat);
      rDesk.position.set(8.5, 0.50, d);
      floorGroup.add(rDesk);
    }

    // Whiteboards on back walls
    const lBoard = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 0.05), boardMat);
    lBoard.position.set(-8.5, 1.6, -4.5);
    floorGroup.add(lBoard);

    const rBoard = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 0.05), boardMat);
    rBoard.position.set(8.5, 1.6, -4.5);
    floorGroup.add(rBoard);
  };

  const createFloorLabelSprite = (text: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(8, 8, 364, 80, 14);
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 190, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.4, 1.1, 1.0);
    return sprite;
  };

  // Build Panoramic Transparent Glass Observation Elevators
  const buildElevators = (scene: THREE.Scene, sim: SimulationEngine) => {
    rebuildElevators(scene, sim);
  };

  const rebuildElevators = (scene: THREE.Scene, sim: SimulationEngine) => {
    elevatorCarsRef.current.forEach(item => {
      scene.remove(item.group);
      scene.remove(item.cable);
      scene.remove(item.counterweight);
    });
    elevatorCarsRef.current.clear();

    const roofTopY = (TOTAL_FLOORS - 1) * (BASE_FLOOR_HEIGHT + explodedSpacing) + 2.8;

    for (const lift of sim.elevators) {
      // 1. Car Group
      const carGroup = new THREE.Group();
      carGroup.position.set(lift.shaftX, lift.currentFloor * (BASE_FLOOR_HEIGHT + explodedSpacing) + 1.3, 0);

      // Panoramic Crystal-Clear Glass Cab (depthWrite: false ensures bots inside are 100% visible)
      const cabGeo = new THREE.BoxGeometry(2.3, 2.5, 2.3);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const glassCab = new THREE.Mesh(cabGeo, glassMat);
      carGroup.add(glassCab);

      // Illuminated floor plate
      const cabFloor = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.14, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x0284c7, emissiveIntensity: 0.55 })
      );
      cabFloor.position.set(0, -1.20, 0);
      carGroup.add(cabFloor);

      // Illuminated ceiling plate
      const cabRoof = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.14, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x38bdf8, emissiveIntensity: 0.4 })
      );
      cabRoof.position.set(0, 1.20, 0);
      carGroup.add(cabRoof);

      // Chrome Corner Posts
      const pMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
      const pOffsets = [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]];
      for (const [px, pz] of pOffsets) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.5, 8), pMat);
        pillar.position.set(px, 0, pz);
        carGroup.add(pillar);
      }

      // Interior High-Intensity Spotlight shining directly on student passengers
      const interiorLight = new THREE.PointLight(0xffffff, 3.8, 6.0);
      interiorLight.position.set(0, 0.95, 0);
      carGroup.add(interiorLight);

      // Sliding Glass Doors
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.70,
        depthWrite: false,
      });
      const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.06), doorMat);
      doorLeft.position.set(-0.28, 0, 1.14);
      carGroup.add(doorLeft);

      const doorRight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.06), doorMat);
      doorRight.position.set(0.28, 0, 1.14);
      carGroup.add(doorRight);

      // Floating Live HUD Badge above elevator
      const hudSprite = createElevatorHudSprite(lift.name);
      carGroup.add(hudSprite);

      scene.add(carGroup);

      // Dynamic Suspension Cable - terminates strictly at roof
      const cablePoints = [
        new THREE.Vector3(lift.shaftX, lift.currentFloor * (BASE_FLOOR_HEIGHT + explodedSpacing) + 2.5, 0),
        new THREE.Vector3(lift.shaftX, roofTopY, 0),
      ];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const cableMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
      const cable = new THREE.Line(cableGeo, cableMat);
      scene.add(cable);

      // Counterweight - stays strictly below roof
      const counterweight = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.8, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
      );
      const initCwY = 1.0 + ((TOTAL_FLOORS - 1 - lift.currentFloor) / (TOTAL_FLOORS - 1)) * (roofTopY - 3.0);
      counterweight.position.set(lift.shaftX, initCwY, -1.0);
      scene.add(counterweight);

      elevatorCarsRef.current.set(lift.id, {
        group: carGroup,
        doorLeft,
        doorRight,
        glassBody: glassCab,
        interiorLight,
        hudSprite,
        cable,
        counterweight,
      });
    }
  };

  const createElevatorHudSprite = (name: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.roundRect(6, 6, 388, 84, 14);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${name} • 👥 0/12 • IDLE`, 200, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.0, 0.95, 1.0);
    sprite.position.set(0, 2.1, 0);
    return sprite;
  };

  const updateElevatorHudCanvas = (sprite: THREE.Sprite, lift: ElevatorCar) => {
    const texture = sprite.material.map;
    if (!texture || !texture.image) return;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = !lift.enabled ? 'rgba(127, 29, 29, 0.94)' : 'rgba(15, 23, 42, 0.92)';
    ctx.roundRect(6, 6, 388, 84, 14);
    ctx.fill();

    ctx.strokeStyle = !lift.enabled ? '#ef4444' : lift.direction === 'UP' ? '#10b981' : lift.direction === 'DOWN' ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    const dirArrow = lift.direction === 'UP' ? '▲' : lift.direction === 'DOWN' ? '▼' : '●';
    const floorLabel = Math.round(lift.currentFloor) === 0 ? 'G' : `F${Math.round(lift.currentFloor)}`;

    ctx.fillStyle = !lift.enabled ? '#fca5a5' : '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = !lift.enabled
      ? `${lift.name} • OFFLINE`
      : `${lift.name} • 👥 ${lift.passengers.length}/${lift.capacity} • ${floorLabel} ${dirArrow}`;

    ctx.fillText(text, 200, 48);
    texture.needsUpdate = true;
  };

  // Build Full 8-Part Animated Student Bots (Head, Glowing Visor, Hair, Torso, Backpack, Arms, Legs)
  const buildAnimatedStudentBots = (scene: THREE.Scene) => {
    // 1. Head
    const headGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.5 });
    const headMesh = new THREE.InstancedMesh(headGeo, headMat, MAX_BOTS);
    headMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(headMesh);

    // 2. Glowing Visor / LED Eye Strip
    const visorGeo = new THREE.BoxGeometry(0.26, 0.08, 0.06);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const visorMesh = new THREE.InstancedMesh(visorGeo, visorMat, MAX_BOTS);
    visorMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(visorMesh);

    // 3. Hair / Cap
    const hairGeo = new THREE.BoxGeometry(0.27, 0.10, 0.27);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221c18, roughness: 0.8 });
    const hairMesh = new THREE.InstancedMesh(hairGeo, hairMat, MAX_BOTS);
    hairMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(hairMesh);

    // 4. Torso (Hoodie / Tech Jacket) - with dynamic per-instance coloring
    const torsoGeo = new THREE.BoxGeometry(0.36, 0.44, 0.26);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });
    const torsoMesh = new THREE.InstancedMesh(torsoGeo, torsoMat, MAX_BOTS);
    torsoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(torsoMesh);

    // 5. Backpack
    const bpGeo = new THREE.BoxGeometry(0.26, 0.34, 0.15);
    const bpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const bpMesh = new THREE.InstancedMesh(bpGeo, bpMat, MAX_BOTS);
    bpMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(bpMesh);

    // 6. Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.10, 0.36, 0.10);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const leftArmMesh = new THREE.InstancedMesh(armGeo, armMat, MAX_BOTS);
    leftArmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(leftArmMesh);

    const rightArmMesh = new THREE.InstancedMesh(armGeo, armMat, MAX_BOTS);
    rightArmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(rightArmMesh);

    // 7. Left & Right Legs (Pants)
    const legGeo = new THREE.BoxGeometry(0.12, 0.42, 0.12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const leftLegMesh = new THREE.InstancedMesh(legGeo, legMat, MAX_BOTS);
    leftLegMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(leftLegMesh);

    const rightLegMesh = new THREE.InstancedMesh(legGeo, legMat, MAX_BOTS);
    rightLegMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(rightLegMesh);

    botPartsRef.current = {
      head: headMesh,
      visor: visorMesh,
      hair: hairMesh,
      torso: torsoMesh,
      backpack: bpMesh,
      leftArm: leftArmMesh,
      rightArm: rightArmMesh,
      leftLeg: leftLegMesh,
      rightLeg: rightLegMesh,
    };
  };

  // Main Scene Update (runs every frame)
  const updateScene = (sim: SimulationEngine, dt: number, elapsedTime: number, spacing: number) => {
    const floorH = BASE_FLOOR_HEIGHT + spacing;

    // 1. Update Floor groups positions (for exploded view) & congestion halos
    for (const fItem of floorGroupsRef.current) {
      const floorData = sim.floors[fItem.floorNum];
      if (!floorData) continue;
      const targetY = fItem.floorNum * floorH;
      fItem.group.position.y = targetY;

      const haloMat = fItem.haloMesh.material as THREE.MeshBasicMaterial;
      const slabMat = fItem.slabMesh.material as THREE.MeshStandardMaterial;

      if (floorData.congestionLevel === 'CRITICAL') {
        haloMat.color.setHex(0xef4444);
        haloMat.opacity = 0.45 + Math.sin(elapsedTime * 6) * 0.15;
        if (viewMode === 'CROWD_HEATMAP') slabMat.color.setHex(0xef4444);
      } else if (floorData.congestionLevel === 'HIGH') {
        haloMat.color.setHex(0xf97316);
        haloMat.opacity = 0.35;
        if (viewMode === 'CROWD_HEATMAP') slabMat.color.setHex(0xf97316);
      } else if (floorData.congestionLevel === 'MEDIUM') {
        haloMat.color.setHex(0xeab308);
        haloMat.opacity = 0.25;
        if (viewMode === 'CROWD_HEATMAP') slabMat.color.setHex(0xeab308);
      } else {
        haloMat.color.setHex(0x10b981);
        haloMat.opacity = 0.14;
        if (viewMode === 'CROWD_HEATMAP') slabMat.color.setHex(0x10b981);
      }

      if (viewMode !== 'CROWD_HEATMAP') {
        slabMat.color.setHex(fItem.floorNum === 0 ? 0x1e293b : 0x0f172a);
      }
    }

    // 2. Update Elevators
    const buildingRoofY = (TOTAL_FLOORS - 1) * floorH + 2.8;

    for (const lift of sim.elevators) {
      const carData = elevatorCarsRef.current.get(lift.id);
      if (!carData) continue;

      const targetY = lift.currentFloor * floorH + 1.3;
      carData.group.position.y = targetY;
      carData.group.position.x = lift.shaftX;

      // Sliding doors animation
      const doorSlide = lift.doorsState * 0.52;
      carData.doorLeft.position.x = -0.28 - doorSlide;
      carData.doorRight.position.x = 0.28 + doorSlide;

      // Suspension cable - terminates strictly at roof
      const cablePositions = carData.cable.geometry.attributes.position as THREE.BufferAttribute;
      cablePositions.setXYZ(0, lift.shaftX, targetY + 1.25, 0);
      cablePositions.setXYZ(1, lift.shaftX, buildingRoofY, 0);
      cablePositions.needsUpdate = true;

      // Counterweight - stays strictly within building height below roof
      const cwRatio = Math.max(0, Math.min(1, (TOTAL_FLOORS - 1 - lift.currentFloor) / (TOTAL_FLOORS - 1)));
      const cwY = 1.0 + cwRatio * (buildingRoofY - 3.0);
      carData.counterweight.position.y = cwY;
      carData.counterweight.position.x = lift.shaftX;

      // Update HUD
      updateElevatorHudCanvas(carData.hudSprite, lift);

      // Dynamic interior lighting
      if (!lift.enabled) {
        carData.interiorLight.color.setHex(0xef4444);
      } else if (lift.direction === 'UP') {
        carData.interiorLight.color.setHex(0x10b981);
      } else if (lift.direction === 'DOWN') {
        carData.interiorLight.color.setHex(0xf59e0b);
      } else {
        carData.interiorLight.color.setHex(0x38bdf8);
      }
    }

    // 3. Update 8-Part Animated Student Bots (walking, queueing & riding inside lifts!)
    if (botPartsRef.current) {
      const parts = botPartsRef.current;
      const count = Math.min(sim.agents.length, MAX_BOTS);
      const dummy = new THREE.Object3D();
      const colorHelper = new THREE.Color();

      for (let i = 0; i < count; i++) {
        const agent = sim.agents[i];

        const isWalking = (
          agent.state === 'WALKING_TO_ELEVATOR' || 
          agent.state === 'ENTERING_ELEVATOR' || 
          agent.state === 'EXITING_ELEVATOR' || 
          agent.state === 'WALKING_TO_CLASS'
        );

        let posX = agent.position[0];
        let posY = agent.position[1];
        let posZ = agent.position[2];
        let rotY = agent.rotationY;

        // If inside elevator: lock position exactly to the moving car cabin
        if (agent.state === 'INSIDE_ELEVATOR' && agent.assignedElevatorId) {
          const lift = sim.elevators.find(e => e.id === agent.assignedElevatorId);
          if (lift) {
            const slot = agent.slotInLift ?? 0;
            const col = (slot % 3) - 1;
            const row = Math.floor(slot / 3) - 1.2;
            const offsetX = col * 0.50;
            const offsetZ = row * 0.42;

            posX = lift.shaftX + offsetX;
            posY = lift.currentFloor * floorH + 0.12;
            posZ = offsetZ;
            rotY = 0; // face forward toward transparent glass front
          }
        } else if (spacing > 0) {
          // Adjust vertical Y with exploded spacing when on floors
          posY += (agent.position[1] / BASE_FLOOR_HEIGHT) * spacing;
        }

        // Articulated walk cycle
        const strideAngle = isWalking ? Math.sin(agent.animPhase) * 0.45 : 0;
        const armAngle = isWalking ? -Math.sin(agent.animPhase) * 0.42 : 0;
        const walkBounce = isWalking ? Math.abs(Math.sin(agent.animPhase * 2)) * 0.04 : Math.sin(elapsedTime * 2 + i) * 0.015;

        const effectiveY = posY + walkBounce;

        // Apply dynamic team hoodie color
        colorHelper.set(agent.shirtColor || '#00e5ff');
        parts.torso.setColorAt(i, colorHelper);

        // A. Torso
        dummy.position.set(posX, effectiveY + 0.52, posZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.torso.setMatrixAt(i, dummy.matrix);

        // B. Head
        dummy.position.set(posX, effectiveY + 0.86, posZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.head.setMatrixAt(i, dummy.matrix);

        // C. Glowing Eye Visor (front of head)
        const visorOffX = Math.sin(rotY) * 0.13;
        const visorOffZ = Math.cos(rotY) * 0.13;
        dummy.position.set(posX + visorOffX, effectiveY + 0.87, posZ + visorOffZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.visor.setMatrixAt(i, dummy.matrix);

        // D. Hair
        dummy.position.set(posX, effectiveY + 0.99, posZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.hair.setMatrixAt(i, dummy.matrix);

        // E. Backpack
        const bpOffsetX = -Math.sin(rotY) * 0.16;
        const bpOffsetZ = -Math.cos(rotY) * 0.16;
        dummy.position.set(posX + bpOffsetX, effectiveY + 0.54, posZ + bpOffsetZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.backpack.setMatrixAt(i, dummy.matrix);

        // F. Left & Right Arms
        const leftArmOffsetX = Math.cos(rotY) * 0.23;
        const leftArmOffsetZ = -Math.sin(rotY) * 0.23;
        dummy.position.set(posX - leftArmOffsetX, effectiveY + 0.52, posZ - leftArmOffsetZ);
        dummy.rotation.set(armAngle, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.leftArm.setMatrixAt(i, dummy.matrix);

        const rightArmOffsetX = Math.cos(rotY) * 0.23;
        const rightArmOffsetZ = -Math.sin(rotY) * 0.23;
        dummy.position.set(posX + rightArmOffsetX, effectiveY + 0.52, posZ + rightArmOffsetZ);
        dummy.rotation.set(-armAngle, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.rightArm.setMatrixAt(i, dummy.matrix);

        // G. Left & Right Legs (stride)
        const legSpacingX = Math.cos(rotY) * 0.11;
        const legSpacingZ = -Math.sin(rotY) * 0.11;

        dummy.position.set(posX - legSpacingX, effectiveY + 0.21, posZ - legSpacingZ);
        dummy.rotation.set(strideAngle, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.leftLeg.setMatrixAt(i, dummy.matrix);

        dummy.position.set(posX + legSpacingX, effectiveY + 0.21, posZ + legSpacingZ);
        dummy.rotation.set(-strideAngle, rotY, 0);
        dummy.scale.set(agent.heightScale, agent.heightScale, agent.heightScale);
        dummy.updateMatrix();
        parts.rightLeg.setMatrixAt(i, dummy.matrix);
      }

      // Hide unused instances
      for (let i = count; i < MAX_BOTS; i++) {
        dummy.position.set(0, -200, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        parts.head.setMatrixAt(i, dummy.matrix);
        parts.visor.setMatrixAt(i, dummy.matrix);
        parts.hair.setMatrixAt(i, dummy.matrix);
        parts.torso.setMatrixAt(i, dummy.matrix);
        parts.backpack.setMatrixAt(i, dummy.matrix);
        parts.leftArm.setMatrixAt(i, dummy.matrix);
        parts.rightArm.setMatrixAt(i, dummy.matrix);
        parts.leftLeg.setMatrixAt(i, dummy.matrix);
        parts.rightLeg.setMatrixAt(i, dummy.matrix);
      }

      parts.head.instanceMatrix.needsUpdate = true;
      parts.visor.instanceMatrix.needsUpdate = true;
      parts.hair.instanceMatrix.needsUpdate = true;
      parts.torso.instanceMatrix.needsUpdate = true;
      if (parts.torso.instanceColor) parts.torso.instanceColor.needsUpdate = true;
      parts.backpack.instanceMatrix.needsUpdate = true;
      parts.leftArm.instanceMatrix.needsUpdate = true;
      parts.rightArm.instanceMatrix.needsUpdate = true;
      parts.leftLeg.instanceMatrix.needsUpdate = true;
      parts.rightLeg.instanceMatrix.needsUpdate = true;
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Viewport Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* View Mode Toolbar */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-1.5 shadow-2xl flex items-center gap-1">
          <button
            onClick={() => setViewMode('NORMAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'NORMAL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Normal View</span>
          </button>

          <button
            onClick={() => setViewMode('CROWD_HEATMAP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'CROWD_HEATMAP'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Congestion Heatmap</span>
          </button>

          <button
            onClick={() => setViewMode('ELEVATOR_FLOW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'ELEVATOR_FLOW'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Elevator Flow</span>
          </button>
        </div>

        {/* Camera Quick Presets */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-1.5 shadow-2xl flex items-center gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold px-2 flex items-center gap-1">
            <Camera className="w-3 h-3 text-cyan-400" />
            Cam:
          </span>

          {[
            { id: 'FULL', label: '7-Floor Full' },
            { id: 'FOLLOW_ELEVATOR', label: 'Ride Lift' },
            { id: 'FOLLOW_STUDENT', label: 'Follow Bot' },
            { id: 'CROWD', label: 'Lobby Queue' },
            { id: 'TOP', label: 'Top-Down' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCameraPreset(c.id as CameraPreset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCameraPreset === c.id
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exploded View Slider (Bottom-Left) */}
      <div className="absolute bottom-5 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3.5 py-2 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Exploded Floor Spacing:</span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.5"
          step="0.1"
          value={explodedSpacing}
          onChange={(e) => setExplodedSpacing(parseFloat(e.target.value))}
          className="w-28 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="font-mono text-cyan-300 text-xs w-8">
          {explodedSpacing > 0 ? `+${explodedSpacing.toFixed(1)}m` : '0m'}
        </span>
      </div>

      {/* 3D Navigation Guide Badge (Bottom-Right) */}
      <div className="absolute bottom-5 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-3 text-[11px] text-slate-400 font-medium">
        <span>🖱️ Left-Click: Rotate</span>
        <span>•</span>
        <span>Right-Click: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
        <span>•</span>
        <span className="text-cyan-400">Click Floors / Lifts to Inspect</span>
      </div>
    </div>
  );
};
