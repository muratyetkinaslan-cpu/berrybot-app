import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Generic 3D Robot Preview — Single Three.js scene with model swap
 * Constrained to fit any container size (not h-screen)
 * Auto-rotates, no UI controls
 */
export default function Robot3DPreview({ kitId = "berrybot" }) {
  const mountRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    let renderer, scene, camera, model, animId;
    let mounted = true;

    try {
      // Scene setup
      scene = new THREE.Scene();
      scene.background = null; // transparent

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(3, 2.5, 4);
      camera.lookAt(0, 0.5, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      // Lighting — premium 3-point setup
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(5, 8, 5);
      key.castShadow = true;
      key.shadow.mapSize.width = 1024;
      key.shadow.mapSize.height = 1024;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
      fill.position.set(-5, 3, -3);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffaa44, 0.3);
      rim.position.set(0, 2, -5);
      scene.add(rim);

      // Floor (subtle)
      const floorGeo = new THREE.CircleGeometry(3, 32);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1a1530,
        roughness: 0.9,
        metalness: 0.1,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.01;
      floor.receiveShadow = true;
      scene.add(floor);

      // Build kit-specific model
      model = buildModel(kitId);
      model.castShadow = true;
      scene.add(model);

      // Animation loop
      const startTime = Date.now();
      const animate = () => {
        if (!mounted) return;
        animId = requestAnimationFrame(animate);
        const t = (Date.now() - startTime) / 1000;
        if (model) {
          model.rotation.y = t * 0.5;
          model.position.y = Math.sin(t * 1.5) * 0.05;
        }
        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
      const handleResize = () => {
        if (!mount || !renderer) return;
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        mounted = false;
        window.removeEventListener("resize", handleResize);
        if (animId) cancelAnimationFrame(animId);
        if (renderer) {
          renderer.dispose();
          if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        }
        scene?.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      };
    } catch (e) {
      console.error("3D init error", e);
      setError(true);
    }
  }, [kitId]);

  return (
    <div ref={mountRef} style={{
      width: "100%",
      height: "100%",
      position: "relative",
    }}>
      {error && <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, opacity: 0.5,
      }}>3D yüklenemedi</div>}
    </div>
  );
}

// ─── Kit-specific 3D models ───
function buildModel(kitId) {
  const group = new THREE.Group();

  if (kitId === "tank") {
    return buildTank(group);
  } else if (kitId === "picobricks") {
    return buildPicoBricks(group);
  }
  return buildBerryBot(group);
}

// ═══════════════════════════════════════════════════════════════
// BERRYBOT — Wooden chassis with sensors
// ═══════════════════════════════════════════════════════════════
function buildBerryBot(group) {
  // Wooden base
  const wood = new THREE.MeshStandardMaterial({
    color: 0xc4945a,
    roughness: 0.8,
    metalness: 0.1,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.2), wood);
  base.position.y = 0.4;
  base.castShadow = true;
  group.add(base);

  // Top deck
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), wood);
  top.position.y = 0.85;
  top.castShadow = true;
  group.add(top);

  // Pillars (4 corners)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), pillarMat);
    p.position.set(i % 2 === 0 ? -0.65 : 0.65, 0.62, i < 2 ? -0.45 : 0.45);
    p.castShadow = true;
    group.add(p);
  }

  // Wheels (4 yellow wheels)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    const x = i % 2 === 0 ? -0.85 : 0.85;
    const z = i < 2 ? -0.5 : 0.5;
    wheel.position.set(x, 0.22, z);
    wheel.castShadow = true;
    group.add(wheel);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16), tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.position.set(x, 0.22, z);
    group.add(tire);
  }

  // RGB LED on top (bright)
  const ledColors = [0xff3333, 0x33ff33, 0x3333ff];
  ledColors.forEach((c, i) => {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8 })
    );
    led.position.set(-0.4 + i * 0.4, 0.95, 0);
    group.add(led);
  });

  // Front sensor (ultrasonic, two "eyes")
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0088cc, metalness: 0.7 });
  for (let i = 0; i < 2; i++) {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), eyeMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(i === 0 ? -0.2 : 0.2, 0.5, 0.61);
    group.add(eye);
  }

  // Pi board on top (cyan)
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.04, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x00aa66, roughness: 0.5 })
  );
  board.position.y = 0.91;
  board.position.z = 0.2;
  group.add(board);

  return group;
}

// ═══════════════════════════════════════════════════════════════
// TANK — Tracked military robot (green theme)
// ═══════════════════════════════════════════════════════════════
function buildTank(group) {
  // Chassis (dark green)
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x4a7035,
    roughness: 0.7,
    metalness: 0.3,
  });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.0), chassisMat);
  chassis.position.y = 0.4;
  chassis.castShadow = true;
  group.add(chassis);

  // Track wheels (left + right side, multiple)
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
  
  for (let side = -1; side <= 1; side += 2) {
    // Track outer shell (continuous belt)
    const trackShell = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.4, 0.25),
      trackMat
    );
    trackShell.position.set(0, 0.25, side * 0.55);
    trackShell.castShadow = true;
    group.add(trackShell);

    // Track texture rings (5 wheels per side visible)
    for (let i = 0; i < 5; i++) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16),
        wheelMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-0.65 + i * 0.32, 0.22, side * 0.55);
      group.add(wheel);
    }
  }

  // Turret base
  const turretBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 0.18, 16),
    chassisMat
  );
  turretBase.position.y = 0.74;
  turretBase.castShadow = true;
  group.add(turretBase);

  // Turret dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    chassisMat
  );
  dome.position.y = 0.83;
  dome.castShadow = true;
  group.add(dome);

  // Cannon barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.55, 0.86, 0);
  group.add(barrel);

  // LED indicators on top (green/red)
  [
    { c: 0x00ff44, x: -0.2 },
    { c: 0xff2200, x: 0.2 },
  ].forEach(led => {
    const l = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshStandardMaterial({ color: led.c, emissive: led.c, emissiveIntensity: 1 })
    );
    l.position.set(led.x, 1.0, -0.1);
    group.add(l);
  });

  // Antenna
  const ant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  ant.position.set(-0.2, 1.15, 0.2);
  group.add(ant);
  const antTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
  );
  antTip.position.set(-0.2, 1.4, 0.2);
  group.add(antTip);

  return group;
}

// ═══════════════════════════════════════════════════════════════
// PICOBRICKS — Modular orange brick board
// ═══════════════════════════════════════════════════════════════
function buildPicoBricks(group) {
  // Main PCB board (orange)
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.4,
    metalness: 0.2,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.0), boardMat);
  board.position.y = 0.5;
  board.castShadow = true;
  group.add(board);

  // PCB traces (subtle gold lines on top)
  const traceMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const trace = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.005, 0.02),
      traceMat
    );
    trace.position.set(0, 0.535, -0.4 + i * 0.16);
    group.add(trace);
  }

  // 6 modular brick modules on top
  const modules = [
    { x: -0.45, z: -0.3, c: 0x4ade80, label: "LED" },     // green LED
    { x: 0,     z: -0.3, c: 0xfbbf24, label: "BUZZ" },    // yellow buzzer
    { x: 0.45,  z: -0.3, c: 0xa78bfa, label: "SVO" },     // purple servo
    { x: -0.45, z: 0.3,  c: 0x22d3ee, label: "TEMP" },    // cyan temp
    { x: 0,     z: 0.3,  c: 0xf87171, label: "POT" },     // red potentiometer
    { x: 0.45,  z: 0.3,  c: 0x60a5fa, label: "BTN" },     // blue button
  ];

  modules.forEach(m => {
    const mod = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.18, 0.22),
      new THREE.MeshStandardMaterial({ color: m.c, roughness: 0.5 })
    );
    mod.position.set(m.x, 0.62, m.z);
    mod.castShadow = true;
    group.add(mod);

    // Connector pins underneath
    const pin = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.02, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 })
    );
    pin.position.set(m.x, 0.535, m.z - 0.1);
    group.add(pin);
  });

  // Center microcontroller (Pico)
  const pico = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5 })
  );
  pico.position.y = 0.55;
  group.add(pico);

  // USB connector (silver, end)
  const usb = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
  );
  usb.position.set(0, 0.55, -0.28);
  group.add(usb);

  // Power LED (always on, glowing)
  const powerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 })
  );
  powerLed.position.set(0.05, 0.585, 0);
  group.add(powerLed);

  // Mounting holes (4 corners — small circles)
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  [
    [-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]
  ].forEach(([x, z]) => {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.07),
      holeMat
    );
    hole.position.set(x, 0.5, z);
    group.add(hole);
  });

  return group;
}
