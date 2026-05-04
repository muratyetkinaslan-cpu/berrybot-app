import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * TankRobot3D — Interactive 3D model of a Raspberry Pi Pico tank robot kit.
 *
 * Features:
 *   - Laser-cut wooden chassis (top, bottom, side panels) with slot patterns
 *   - 4 wooden gear-toothed sprocket wheels (animated rotation)
 *   - 2 continuous rubber tracks with ~32 segments each that physically
 *     translate along a stadium-shaped path around the wheels
 *   - 2 yellow TT gear motors mounted between front and rear wheels
 *   - Mini PicoBricks-style top board with green Raspberry Pi Pico W
 *   - HC-SR04 ultrasonic distance sensor on the front with curved cable bundle
 *   - Auto-orbit camera animation (toggleable)
 *   - Mouse-drag and touch-drag for manual orbit
 *   - Mouse-wheel zoom
 *
 * Dependency: three (^0.128 or newer)
 */
export default function TankRobot3D({ interactive = true } = {}) {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W0 = mount.clientWidth || 800, H0 = mount.clientHeight || 600;

    // ============================================================
    //  SCENE / CAMERA / RENDERER
    // ============================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070b);
    scene.fog = new THREE.Fog(0x06070b, 18, 40);

    const camera = new THREE.PerspectiveCamera(40, W0 / H0, 0.1, 100);
    camera.position.set(5, 3.5, 7);
    camera.lookAt(0, -0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W0, H0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // ============================================================
    //  LIGHTING
    // ============================================================
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    const keyLight = new THREE.DirectionalLight(0xfff2dd, 1.05);
    keyLight.position.set(6, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.42);
    fillLight.position.set(-7, 4, 3);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xff9988, 0.35);
    backLight.position.set(0, 4, -8);
    scene.add(backLight);

    const rimBlue = new THREE.PointLight(0x4477ff, 0.9, 14);
    rimBlue.position.set(-5, 1, -2);
    scene.add(rimBlue);
    const rimWarm = new THREE.PointLight(0xff7744, 0.7, 14);
    rimWarm.position.set(5, 1, -2);
    scene.add(rimWarm);

    // Subtle ground for shadow grounding
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.45 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.4;
    ground.receiveShadow = true;
    scene.add(ground);

    // ============================================================
    //  TEXTURE FACTORY
    // ============================================================
    const makeTex = (w, h, draw) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      draw(ctx, w, h);
      const tex = new THREE.CanvasTexture(c);
      if ("encoding" in tex) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 8;
      return tex;
    };

    // ---- Light wood (laser-cut MDF) ----
    const woodTex = makeTex(1024, 1024, (ctx, w, h) => {
      // base creamy tan
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#dfc699");
      grad.addColorStop(0.5, "#d4b985");
      grad.addColorStop(1, "#cdb079");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Long grain streaks
      for (let i = 0; i < 220; i++) {
        const y = Math.random() * h;
        const len = 200 + Math.random() * 600;
        const x = Math.random() * w - 100;
        ctx.strokeStyle = `rgba(120,90,40,${Math.random() * 0.18})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + len*0.3, y + (Math.random()-0.5)*8, x + len*0.7, y + (Math.random()-0.5)*8, x + len, y);
        ctx.stroke();
      }
      // small darker knots
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 4 + Math.random() * 8;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(80, 50, 20, 0.55)");
        g.addColorStop(1, "rgba(80, 50, 20, 0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      }
      // burn marks at edges (laser-cut signature)
      const edge = ctx.createLinearGradient(0, 0, 0, 18);
      edge.addColorStop(0, "rgba(60,40,20,0.6)");
      edge.addColorStop(1, "rgba(60,40,20,0)");
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, 18);
      ctx.fillRect(0, h - 18, w, 18);
    });

    // ---- Top deck pattern (chevron slot pattern + screw holes burned in) ----
    const deckTex = makeTex(1200, 800, (ctx, w, h) => {
      // base wood
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#dfc699");
      grad.addColorStop(1, "#cdb079");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // grain
      for (let i = 0; i < 180; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = `rgba(120,90,40,${Math.random() * 0.15})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.bezierCurveTo(w*0.3, y + 4, w*0.7, y - 4, w, y);
        ctx.stroke();
      }
      // chevron slots (dark — these are the cutouts)
      ctx.strokeStyle = "rgba(40,25,10,0.92)";
      ctx.fillStyle = "rgba(20,12,6,0.95)";
      const drawSlot = (cx, cy, len, ang) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(-len/2, -8, len, 16, 8) : ctx.rect(-len/2, -8, len, 16);
        ctx.fill();
        // burnt edge
        ctx.strokeStyle = "rgba(70, 40, 20, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      };
      // 4 rows of chevron slots (V pattern)
      const cols = 6;
      for (let row = 0; row < 4; row++) {
        const y = h * (0.18 + row * 0.18);
        for (let col = 0; col < cols; col++) {
          const x1 = w * (0.20 + col * 0.10);
          const x2 = w * (0.55 + col * 0.07);
          drawSlot(x1, y, 110, -Math.PI / 6);
          drawSlot(x2, y, 110, Math.PI / 6);
        }
      }
      // 4 small dot slots at corners (screw locations - burned)
      [[0.06,0.08],[0.94,0.08],[0.06,0.92],[0.94,0.92]].forEach(([rx, ry]) => {
        const x = rx * w, y = ry * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 30);
        g.addColorStop(0, "rgba(40,25,10,0.7)");
        g.addColorStop(1, "rgba(40,25,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI*2); ctx.fill();
        // hole
        ctx.fillStyle = "#1a1208";
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI*2); ctx.fill();
      });
    });

    // ---- Bottom plate pattern (different slot layout, cleaner) ----
    const bottomTex = makeTex(1200, 800, (ctx, w, h) => {
      ctx.fillStyle = "#d4b985";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 120; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = `rgba(120,90,40,${Math.random() * 0.13})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.bezierCurveTo(w*0.3, y+3, w*0.7, y-3, w, y); ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,12,6,0.93)";
      // diagonal slot pattern
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const x = w * (0.25 + col * 0.15);
          const y = h * (0.18 + row * 0.16);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-50, -6, 100, 12);
          ctx.restore();
        }
      }
    });

    // ============================================================
    //  SHARED MATERIALS
    // ============================================================
    const matWoodSide = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: woodTex, roughness: 0.85, metalness: 0.05,
    });
    const matDeck = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: deckTex, roughness: 0.85, metalness: 0.05,
    });
    const matBottom = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: bottomTex, roughness: 0.85, metalness: 0.05,
    });
    const matTrack = new THREE.MeshStandardMaterial({
      color: 0x1a1a1d, roughness: 0.55, metalness: 0.2,
    });
    const matTrackEdge = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c, roughness: 0.65,
    });
    const matBolt = new THREE.MeshStandardMaterial({
      color: 0xa0a0a8, metalness: 0.85, roughness: 0.3,
    });
    const matMotorYellow = new THREE.MeshStandardMaterial({
      color: 0xf2c020, roughness: 0.55,
    });
    const matMotorWhite = new THREE.MeshStandardMaterial({
      color: 0xebe8df, roughness: 0.55,
    });
    const matMotorBlue = new THREE.MeshStandardMaterial({
      color: 0x2c5fb5, roughness: 0.5,
    });
    const matChip = new THREE.MeshStandardMaterial({
      color: 0x111114, roughness: 0.5,
    });
    const matGold = new THREE.MeshStandardMaterial({
      color: 0xd9a93a, roughness: 0.3, metalness: 0.95,
    });

    // ============================================================
    //  GEOMETRIC HELPERS
    // ============================================================
    // Gear-toothed wheel shape (sprocket)
    const makeSprocketShape = (R, teeth, depth) => {
      const shape = new THREE.Shape();
      const inner = R - depth;
      const stepAng = Math.PI / teeth; // half a tooth
      for (let i = 0; i <= teeth * 2; i++) {
        const ang = i * stepAng;
        const r = i % 2 === 0 ? R : inner;
        const x = r * Math.cos(ang);
        const y = r * Math.sin(ang);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      // center hole
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.10, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      return shape;
    };

    // Stadium-path point (for tracks)
    const trackR = 0.78;            // wheel-pitch radius
    const trackHalfStraight = 1.05; // half the wheel-axle separation
    const trackTotalLen = 4 * trackHalfStraight + 2 * Math.PI * trackR;

    const pointOnTrack = (t) => {
      let s = ((t % 1) + 1) % 1 * trackTotalLen;
      if (s < 2 * trackHalfStraight) {
        return { y: trackR, z: -trackHalfStraight + s, ang: 0 };
      }
      s -= 2 * trackHalfStraight;
      if (s < Math.PI * trackR) {
        const th = s / trackR;
        return { y: trackR * Math.cos(th), z: trackHalfStraight + trackR * Math.sin(th), ang: th };
      }
      s -= Math.PI * trackR;
      if (s < 2 * trackHalfStraight) {
        return { y: -trackR, z: trackHalfStraight - s, ang: Math.PI };
      }
      s -= 2 * trackHalfStraight;
      const th = s / trackR;
      return { y: -trackR * Math.cos(th), z: -trackHalfStraight - trackR * Math.sin(th), ang: Math.PI + th };
    };

    // ============================================================
    //  ROOT TANK GROUP
    // ============================================================
    const tank = new THREE.Group();
    tank.position.y = 0.0;
    scene.add(tank);

    // ============================================================
    //  CHASSIS — wooden plates
    // ============================================================
    const chassis = new THREE.Group();
    const chassisW = 2.3;   // X
    const chassisL = 3.4;   // Z
    const chassisH = 1.1;   // Y
    const plateThick = 0.07;

    // Top deck (with chevron texture)
    const topDeck = new THREE.Mesh(
      new THREE.BoxGeometry(chassisW, plateThick, chassisL),
      matDeck
    );
    topDeck.position.y = chassisH / 2;
    topDeck.castShadow = true; topDeck.receiveShadow = true;
    chassis.add(topDeck);

    // Bottom deck
    const botDeck = new THREE.Mesh(
      new THREE.BoxGeometry(chassisW, plateThick, chassisL),
      matBottom
    );
    botDeck.position.y = -chassisH / 2;
    botDeck.castShadow = true; botDeck.receiveShadow = true;
    chassis.add(botDeck);

    // Side panels (left + right, long)
    const sidePanelGeo = new THREE.BoxGeometry(plateThick, chassisH, chassisL - 0.3);
    [-1, 1].forEach((s) => {
      const sp = new THREE.Mesh(sidePanelGeo, matWoodSide);
      sp.position.set(s * (chassisW / 2 - plateThick / 2), 0, 0);
      sp.castShadow = true; sp.receiveShadow = true;
      chassis.add(sp);
    });

    // End panels (front + back, short)
    const endPanelGeo = new THREE.BoxGeometry(chassisW - 0.2, chassisH, plateThick);
    [-1, 1].forEach((s) => {
      const ep = new THREE.Mesh(endPanelGeo, matWoodSide);
      ep.position.set(0, 0, s * (chassisL / 2 - plateThick / 2));
      ep.castShadow = true; ep.receiveShadow = true;
      chassis.add(ep);
    });

    // Bolts on the deck corners
    [
      [-chassisW/2 + 0.18,  chassisL/2 - 0.18],
      [ chassisW/2 - 0.18,  chassisL/2 - 0.18],
      [-chassisW/2 + 0.18, -chassisL/2 + 0.18],
      [ chassisW/2 - 0.18, -chassisL/2 + 0.18],
    ].forEach(([x, z]) => {
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.04, 6),
        matBolt
      );
      head.position.set(x, chassisH / 2 + plateThick / 2 + 0.02, z);
      head.castShadow = true;
      chassis.add(head);
    });

    tank.add(chassis);

    // ============================================================
    //  WHEELS (4) — wooden sprockets with teeth
    // ============================================================
    const wheelR = 0.85;
    const wheelTeeth = 24;
    const wheelDepth = 0.085;
    const wheelThickness = 0.13;

    const sprocketShape = makeSprocketShape(wheelR, wheelTeeth, wheelDepth);
    const sprocketGeo = new THREE.ExtrudeGeometry(sprocketShape, {
      depth: wheelThickness,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.008,
      bevelSegments: 2,
    });
    sprocketGeo.translate(0, 0, -wheelThickness / 2); // center on Z

    // Wheel positions: side (X) × axle (Z)
    const sideOffset = chassisW / 2 + 0.12;        // outside edge of chassis
    const axleZ = trackHalfStraight;               // matches stadium half-straight

    const wheels = []; // { sideSign, mesh } for animation

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const holder = new THREE.Group();
        holder.position.set(sx * sideOffset, -0.05, sz * axleZ);
        // Orient so wheel axle is along world X axis
        holder.rotation.y = Math.PI / 2;
        tank.add(holder);

        const wheel = new THREE.Mesh(sprocketGeo, matWoodSide);
        wheel.castShadow = true; wheel.receiveShadow = true;
        holder.add(wheel);

        // Center hub (gold/brass spacer)
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.10, 0.10, wheelThickness + 0.05, 18),
          new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 0.85, roughness: 0.35 })
        );
        hub.rotation.x = Math.PI / 2;
        wheel.add(hub);

        // Bolt heads on wheel face (3 small bolts)
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const bolt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6),
            matBolt
          );
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(0.30 * Math.cos(a), 0.30 * Math.sin(a), wheelThickness / 2 + 0.005);
          wheel.add(bolt);
        }

        wheels.push({ sx, sz, mesh: wheel });
      }
    }

    // ============================================================
    //  TRACKS (2 sides) — animated stadium-path segments
    // ============================================================
    const N_SEGMENTS = 32;
    const trackSideOffset = sideOffset + 0.05; // slightly outboard of wheel face
    const trackWidth = 0.36; // along X (sideways thickness)

    // Each segment: trapezoidal profile with a cleat ridge on top.
    // We model as ExtrudeGeometry of a 2D wedge shape, extruded along X.
    const segShape = new THREE.Shape();
    const segLen = 0.32; // along Z
    segShape.moveTo(-segLen/2, -0.04);
    segShape.lineTo( segLen/2, -0.04);
    segShape.lineTo( segLen/2 - 0.04,  0.06);
    segShape.lineTo(-segLen/2 + 0.04,  0.06);
    segShape.lineTo(-segLen/2, -0.04);
    const segGeo = new THREE.ExtrudeGeometry(segShape, {
      depth: trackWidth,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 1,
    });
    segGeo.translate(0, 0, -trackWidth / 2);
    segGeo.rotateY(Math.PI / 2); // extrude direction (was Z) becomes X
    // After rotation: shape is in YZ plane, depth along X. Good.

    const trackSegments = []; // { side, mesh, baseT }

    for (const sx of [-1, 1]) {
      const sideGroup = new THREE.Group();
      sideGroup.position.x = sx * trackSideOffset;
      tank.add(sideGroup);

      for (let i = 0; i < N_SEGMENTS; i++) {
        const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? matTrack : matTrackEdge);
        seg.castShadow = true;
        sideGroup.add(seg);
        trackSegments.push({ sx, sideGroup, mesh: seg, baseT: i / N_SEGMENTS });
      }
    }

    // ============================================================
    //  TT MOTORS (2) — yellow gear motors mounted between front+back wheels
    // ============================================================
    for (const sx of [-1, 1]) {
      const motor = new THREE.Group();
      // Yellow body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.40, 0.55),
        matMotorYellow
      );
      body.castShadow = true;
      motor.add(body);
      // White gearbox extension
      const gbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.30, 0.30),
        matMotorWhite
      );
      gbox.position.set(sx * 0.16, 0, 0);
      motor.add(gbox);
      // Output shaft (gold)
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.18, 14),
        matBolt
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(sx * 0.30, 0, 0);
      motor.add(shaft);
      // Blue motor coupling adapter at the wheel side
      const coupling = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.07, 18),
        matMotorBlue
      );
      coupling.rotation.z = Math.PI / 2;
      coupling.position.set(sx * 0.42, 0, 0);
      motor.add(coupling);
      // Two thin wires going up to the top board (red+black)
      ["#a02020", "#1a1a1a"].forEach((col, i) => {
        const wire = new THREE.Mesh(
          new THREE.TorusGeometry(0.30, 0.012, 6, 16, Math.PI * 0.7),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })
        );
        wire.rotation.set(Math.PI / 2, 0, Math.PI * 0.55 * sx);
        wire.position.set(0, 0.30, -0.04 + i * 0.04);
        motor.add(wire);
      });

      motor.position.set(sx * (chassisW/2 - 0.18), -chassisH/2 + 0.30, 0);
      tank.add(motor);
    }

    // ============================================================
    //  TOP BOARD (mini PicoBricks-style) WITH RASPBERRY PI PICO W
    // ============================================================
    const topBoard = new THREE.Group();
    {
      // Black PCB
      const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.07, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x16161c, roughness: 0.6 })
      );
      pcb.castShadow = true; pcb.receiveShadow = true;
      topBoard.add(pcb);

      // Pico W (green) sitting on top
      const pico = new THREE.Group();
      const picoBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.05, 1.05),
        new THREE.MeshStandardMaterial({ color: 0x0d4a37, roughness: 0.55 })
      );
      picoBoard.position.y = 0.06;
      picoBoard.castShadow = true;
      pico.add(picoBoard);
      // RP2040 chip
      const rp = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.03, 0.20),
        matChip
      );
      rp.position.set(0.02, 0.10, -0.02);
      pico.add(rp);
      // CYW43439 silver shield
      const wifi = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.21),
        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.3 })
      );
      wifi.position.set(0, 0.105, 0.26);
      pico.add(wifi);
      // USB
      const usb = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.10, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
      );
      usb.position.set(0, 0.115, -0.50);
      pico.add(usb);
      // Pin headers — instanced
      const pinGeo = new THREE.BoxGeometry(0.025, 0.05, 0.025);
      const pins = new THREE.InstancedMesh(pinGeo, matGold, 40);
      const M = new THREE.Matrix4();
      let k = 0;
      for (let i = 0; i < 20; i++) {
        const z = -0.45 + i * 0.047;
        M.makeTranslation(-0.205, 0.105, z); pins.setMatrixAt(k++, M);
        M.makeTranslation( 0.205, 0.105, z); pins.setMatrixAt(k++, M);
      }
      pins.count = k;
      pins.instanceMatrix.needsUpdate = true;
      pico.add(pins);
      // Header strips
      [-0.205, 0.205].forEach((px) => {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.02, 0.95),
          matChip
        );
        strip.position.set(px, 0.090, 0);
        pico.add(strip);
      });
      // Activity LED
      const actLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.015, 0.025),
        new THREE.MeshStandardMaterial({
          color: 0xaaffaa, emissive: 0x33ff66, emissiveIntensity: 1.4,
        })
      );
      actLed.position.set(-0.10, 0.095, 0.40);
      pico.add(actLed);
      pico.userData.actLed = actLed;

      pico.position.y = 0.05;
      topBoard.add(pico);
      topBoard.userData.pico = pico;

      // Power LED on the corner
      const pwrLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.02, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0xff2244, emissive: 0xff2244, emissiveIntensity: 1.0,
        })
      );
      pwrLed.position.set(-0.70, 0.055, -0.40);
      topBoard.add(pwrLed);
      topBoard.userData.pwrLed = pwrLed;
    }
    topBoard.position.set(0, chassisH/2 + 0.10, 0);
    tank.add(topBoard);

    // ============================================================
    //  HC-SR04 ULTRASONIC SENSOR (front)
    // ============================================================
    const sensor = new THREE.Group();
    {
      // Blue PCB
      const sPcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.04, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x1c4a85, metalness: 0.5, roughness: 0.4 })
      );
      sensor.add(sPcb);
      // Two transducers (the "eyes")
      [-0.28, 0.28].forEach((dx) => {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.20, 28),
          new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
        );
        can.position.set(dx, 0.12, 0);
        can.castShadow = true;
        sensor.add(can);
        // mesh grille on top
        const grille = new THREE.Mesh(
          new THREE.CircleGeometry(0.14, 28),
          new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.6 })
        );
        grille.rotation.x = -Math.PI / 2;
        grille.position.set(dx, 0.221, 0);
        sensor.add(grille);
        // concentric rings on the grille
        for (let r = 1; r <= 3; r++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.04 + r * 0.025, 0.005, 6, 28),
            new THREE.MeshStandardMaterial({ color: 0x40454d })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(dx, 0.224, 0);
          sensor.add(ring);
        }
      });
      // 4 gold pins on the back
      for (let i = 0; i < 4; i++) {
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.10, 0.025),
          matGold
        );
        pin.position.set(-0.18 + i * 0.12, -0.05, -0.13);
        sensor.add(pin);
      }
      // small chip in the middle
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.025, 0.10),
        matChip
      );
      chip.position.set(0, 0.04, -0.05);
      sensor.add(chip);
    }
    sensor.position.set(0, chassisH/2 - 0.30, chassisL/2 + 0.10);
    sensor.rotation.x = -0.05;
    tank.add(sensor);

    // ============================================================
    //  CABLE BUNDLE — sensor → top board (4 curved wires)
    // ============================================================
    const wireColors = [0x9c1818, 0x1a1a1a, 0xeac030, 0xf0eedf];
    wireColors.forEach((col, i) => {
      const off = -0.06 + i * 0.04;
      const start = new THREE.Vector3(off, chassisH/2 - 0.20, chassisL/2 + 0.04);
      const peak  = new THREE.Vector3(off, chassisH/2 + 0.55, chassisL/2 - 0.20);
      const end   = new THREE.Vector3(off, chassisH/2 + 0.18, 0.10);
      const curve = new THREE.CatmullRomCurve3([start, peak, end]);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, 0.018, 8, false),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })
      );
      tube.castShadow = true;
      tank.add(tube);
    });

    // ============================================================
    //  MOUSE / TOUCH ORBIT
    // ============================================================
    let dragging = false;
    let prevX = 0, prevY = 0;
    let orbitAngle = Math.atan2(camera.position.x, camera.position.z); // radians
    let orbitHeight = camera.position.y;
    let orbitDist = Math.hypot(camera.position.x, camera.position.z);

    const setCameraFromOrbit = () => {
      camera.position.x = orbitDist * Math.sin(orbitAngle);
      camera.position.z = orbitDist * Math.cos(orbitAngle);
      camera.position.y = orbitHeight;
      camera.lookAt(0, -0.6, 0);
    };

    const onDown = (cx, cy) => { dragging = true; prevX = cx; prevY = cy; };
    const onMove = (cx, cy) => {
      if (!dragging) return;
      const dx = cx - prevX, dy = cy - prevY;
      orbitAngle -= dx * 0.0055;
      orbitHeight = Math.max(0.5, Math.min(7, orbitHeight + dy * 0.015));
      setCameraFromOrbit();
      prevX = cx; prevY = cy;
    };
    const onUp = () => { dragging = false; };

    const md = (e) => onDown(e.clientX, e.clientY);
    const mm = (e) => onMove(e.clientX, e.clientY);
    const td = (e) => { if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY); };
    const tm = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    if (interactive) {
      renderer.domElement.addEventListener("mousedown", md);
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", onUp);
      renderer.domElement.addEventListener("touchstart", td, { passive: true });
      window.addEventListener("touchmove", tm, { passive: false });
      window.addEventListener("touchend", onUp);
    }

    const onWheel = (e) => {
      e.preventDefault();
      orbitDist = Math.max(4, Math.min(15, orbitDist + e.deltaY * 0.01));
      setCameraFromOrbit();
    };
    if (interactive) {
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    }

    // ============================================================
    //  ANIMATION
    // ============================================================
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Auto-orbit camera around tank
      if (autoRotateRef.current && !dragging) {
        orbitAngle += 0.004;
        setCameraFromOrbit();
      }

      // Subtle floating motion
      tank.position.y = 0.05 + Math.sin(t * 0.6) * 0.04;

      // Track segments cycle along the stadium path.
      // For both sides going forward visually, the right side advances in +Z,
      // the left side also advances in +Z (same direction → tank goes forward).
      const trackOffset = (t * 0.18) % 1;
      trackSegments.forEach((s) => {
        const tt = (s.baseT + trackOffset) % 1;
        const p = pointOnTrack(tt);
        s.mesh.position.set(0, p.y, p.z);
        s.mesh.rotation.x = p.ang;
      });

      // Wheel rotation — speed matched to track linear velocity
      // linear velocity at wheel surface = trackTotalLen / cycleSeconds
      // cycleSeconds = 1 / 0.18 ≈ 5.56s per loop
      // wheel angular vel = -2π / cycleSeconds (negative because forward = rotation toward -Z which is -X-rot direction)
      const wheelOmega = -trackTotalLen / trackR * 0.18;
      const wheelAngle = t * wheelOmega;
      wheels.forEach((w) => {
        w.mesh.rotation.z = wheelAngle; // local Z spin (which is world X axis here)
      });

      // Pico activity LED
      if (topBoard.userData.pico && topBoard.userData.pico.userData.actLed) {
        const v = 0.5 + (Math.sin(t * 5.5) + 1) * 0.7;
        topBoard.userData.pico.userData.actLed.material.emissiveIntensity = v;
      }
      // Power LED pulse
      if (topBoard.userData.pwrLed) {
        topBoard.userData.pwrLed.material.emissiveIntensity = 0.85 + Math.sin(t * 2.0) * 0.25;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ============================================================
    //  RESIZE
    // ============================================================
    const onResize = () => {
      const w = mount.clientWidth || 800, h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => onResize());
    ro.observe(mount);
    setTimeout(onResize, 0);

    // ============================================================
    //  CLEANUP
    // ============================================================
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (interactive) {
        renderer.domElement.removeEventListener("mousedown", md);
        window.removeEventListener("mousemove", mm);
        window.removeEventListener("mouseup", onUp);
        renderer.domElement.removeEventListener("touchstart", td);
        window.removeEventListener("touchmove", tm);
        window.removeEventListener("touchend", onUp);
        renderer.domElement.removeEventListener("wheel", onWheel);
      }
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            ["map", "emissiveMap", "normalMap"].forEach((k) => {
              if (m[k] && m[k].dispose) { try { m[k].dispose(); } catch {} }
            });
            m.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tank Robot 3D</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Wooden chassis · Pico W · HC-SR04 · Animated tracks
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-emerald-300 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        />

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg backdrop-blur border border-white/10 transition"
          >
            {autoRotate ? "⏸  Pause Orbit" : "▶  Auto Orbit"}
          </button>
        </div>

        <div className="absolute bottom-4 left-4 text-[11px] text-gray-300 bg-black/40 px-3 py-2 rounded-lg backdrop-blur border border-white/5">
          🖱️  Drag = döndür · Scroll = zoom
        </div>

        <div className="absolute bottom-4 right-4 text-[10px] text-gray-300 bg-black/40 px-3 py-2 rounded-lg backdrop-blur border border-white/5 hidden md:block">
          <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
            <span className="text-gray-500">Şasi</span><span>Lazer-kesim ahşap</span>
            <span className="text-gray-500">Tahrik</span><span>2× TT motor + paletler</span>
            <span className="text-gray-500">MCU</span><span>Raspberry Pi Pico W</span>
            <span className="text-gray-500">Sensör</span><span>HC-SR04 Ultrasonik</span>
          </div>
        </div>
      </div>
    </div>
  );
}