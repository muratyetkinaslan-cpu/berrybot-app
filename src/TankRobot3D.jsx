// TankRobot3D.jsx — 3D animated tank robot kit component
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function TankRobot3D({
  height = 520,
  autoRotate = false,
  background = "transparent",
  className = "",
  style = {},
  interactive = true,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);

    let camR = 9.5, camTheta = 0.85, camPhi = 0.45;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 0.6,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 0.4, 0);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ------------------- LIGHTING -------------------
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.4;
    ground.receiveShadow = true;
    scene.add(ground);

    // ------------------- TEXTURES -------------------
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

    const woodTex = makeTex(1024, 1024, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#dfc699");
      grad.addColorStop(0.5, "#d4b985");
      grad.addColorStop(1, "#cdb079");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
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
      const edge = ctx.createLinearGradient(0, 0, 0, 18);
      edge.addColorStop(0, "rgba(60,40,20,0.6)");
      edge.addColorStop(1, "rgba(60,40,20,0)");
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, 18);
      ctx.fillRect(0, h - 18, w, 18);
    });

    const deckTex = makeTex(1200, 800, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#dfc699");
      grad.addColorStop(1, "#cdb079");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 180; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = `rgba(120,90,40,${Math.random() * 0.15})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.bezierCurveTo(w*0.3, y + 4, w*0.7, y - 4, w, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,12,6,0.95)";
      const drawSlot = (cx, cy, len, ang) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-len/2, -8, len, 16, 8);
        else ctx.rect(-len/2, -8, len, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(70, 40, 20, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      };
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
      [[0.06,0.08],[0.94,0.08],[0.06,0.92],[0.94,0.92]].forEach(([rx, ry]) => {
        const x = rx * w, y = ry * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 30);
        g.addColorStop(0, "rgba(40,25,10,0.7)");
        g.addColorStop(1, "rgba(40,25,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#1a1208";
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI*2); ctx.fill();
      });
    });

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

    // ------------------- MATERIALS -------------------
    const matWoodSide = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.85, metalness: 0.05 });
    const matDeck = new THREE.MeshStandardMaterial({ color: 0xffffff, map: deckTex, roughness: 0.85, metalness: 0.05 });
    const matBottom = new THREE.MeshStandardMaterial({ color: 0xffffff, map: bottomTex, roughness: 0.85, metalness: 0.05 });
    const matTrack = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.55, metalness: 0.2 });
    const matTrackEdge = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.65 });
    const matBolt = new THREE.MeshStandardMaterial({ color: 0xa0a0a8, metalness: 0.85, roughness: 0.3 });
    const matMotorYellow = new THREE.MeshStandardMaterial({ color: 0xf2c020, roughness: 0.55 });
    const matMotorWhite = new THREE.MeshStandardMaterial({ color: 0xebe8df, roughness: 0.55 });
    const matMotorBlue = new THREE.MeshStandardMaterial({ color: 0x2c5fb5, roughness: 0.5 });
    const matChip = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.5 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xd9a93a, roughness: 0.3, metalness: 0.95 });

    // ------------------- HELPERS -------------------
    const makeSprocketShape = (R, teeth, depth) => {
      const shape = new THREE.Shape();
      const inner = R - depth;
      const stepAng = Math.PI / teeth;
      for (let i = 0; i <= teeth * 2; i++) {
        const ang = i * stepAng;
        const r = i % 2 === 0 ? R : inner;
        const x = r * Math.cos(ang);
        const y = r * Math.sin(ang);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.10, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      return shape;
    };

    const trackR = 0.78;
    const trackHalfStraight = 1.05;
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

    // ------------------- TANK ROOT -------------------
    const tank = new THREE.Group();
    tank.position.y = 0.0;
    scene.add(tank);

    // ------------------- CHASSIS -------------------
    const chassis = new THREE.Group();
    const chassisW = 2.3;
    const chassisL = 3.4;
    const chassisH = 1.1;
    const plateThick = 0.07;

    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(chassisW, plateThick, chassisL), matDeck);
    topDeck.position.y = chassisH / 2;
    topDeck.castShadow = true; topDeck.receiveShadow = true;
    chassis.add(topDeck);

    const botDeck = new THREE.Mesh(new THREE.BoxGeometry(chassisW, plateThick, chassisL), matBottom);
    botDeck.position.y = -chassisH / 2;
    botDeck.castShadow = true; botDeck.receiveShadow = true;
    chassis.add(botDeck);

    const sidePanelGeo = new THREE.BoxGeometry(plateThick, chassisH, chassisL - 0.3);
    [-1, 1].forEach((s) => {
      const sp = new THREE.Mesh(sidePanelGeo, matWoodSide);
      sp.position.set(s * (chassisW / 2 - plateThick / 2), 0, 0);
      sp.castShadow = true; sp.receiveShadow = true;
      chassis.add(sp);
    });

    const endPanelGeo = new THREE.BoxGeometry(chassisW - 0.2, chassisH, plateThick);
    [-1, 1].forEach((s) => {
      const ep = new THREE.Mesh(endPanelGeo, matWoodSide);
      ep.position.set(0, 0, s * (chassisL / 2 - plateThick / 2));
      ep.castShadow = true; ep.receiveShadow = true;
      chassis.add(ep);
    });

    [
      [-chassisW/2 + 0.18,  chassisL/2 - 0.18],
      [ chassisW/2 - 0.18,  chassisL/2 - 0.18],
      [-chassisW/2 + 0.18, -chassisL/2 + 0.18],
      [ chassisW/2 - 0.18, -chassisL/2 + 0.18],
    ].forEach(([x, z]) => {
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.04, 6), matBolt
      );
      head.position.set(x, chassisH / 2 + plateThick / 2 + 0.02, z);
      head.castShadow = true;
      chassis.add(head);
    });

    tank.add(chassis);

    // ------------------- WHEELS -------------------
    const wheelR = 0.85;
    const wheelTeeth = 24;
    const wheelDepth = 0.085;
    const wheelThickness = 0.13;

    const sprocketShape = makeSprocketShape(wheelR, wheelTeeth, wheelDepth);
    const sprocketGeo = new THREE.ExtrudeGeometry(sprocketShape, {
      depth: wheelThickness, bevelEnabled: true,
      bevelSize: 0.012, bevelThickness: 0.008, bevelSegments: 2,
    });
    sprocketGeo.translate(0, 0, -wheelThickness / 2);

    const sideOffset = chassisW / 2 + 0.12;
    const axleZ = trackHalfStraight;

    const wheels = [];

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const holder = new THREE.Group();
        holder.position.set(sx * sideOffset, -0.05, sz * axleZ);
        holder.rotation.y = Math.PI / 2;
        tank.add(holder);

        const wheel = new THREE.Mesh(sprocketGeo, matWoodSide);
        wheel.castShadow = true; wheel.receiveShadow = true;
        holder.add(wheel);

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.10, 0.10, wheelThickness + 0.05, 18),
          new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 0.85, roughness: 0.35 })
        );
        hub.rotation.x = Math.PI / 2;
        wheel.add(hub);

        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const bolt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6), matBolt
          );
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(0.30 * Math.cos(a), 0.30 * Math.sin(a), wheelThickness / 2 + 0.005);
          wheel.add(bolt);
        }

        wheels.push({ sx, sz, mesh: wheel });
      }
    }

    // ------------------- TRACKS -------------------
    const N_SEGMENTS = 32;
    const trackSideOffset = sideOffset + 0.05;
    const trackWidth = 0.36;

    const segShape = new THREE.Shape();
    const segLen = 0.32;
    segShape.moveTo(-segLen/2, -0.04);
    segShape.lineTo( segLen/2, -0.04);
    segShape.lineTo( segLen/2 - 0.04,  0.06);
    segShape.lineTo(-segLen/2 + 0.04,  0.06);
    segShape.lineTo(-segLen/2, -0.04);
    const segGeo = new THREE.ExtrudeGeometry(segShape, {
      depth: trackWidth, bevelEnabled: true,
      bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 1,
    });
    segGeo.translate(0, 0, -trackWidth / 2);
    segGeo.rotateY(Math.PI / 2);

    const trackSegments = [];

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

    // ------------------- TT MOTORS -------------------
    for (const sx of [-1, 1]) {
      const motor = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.40, 0.55), matMotorYellow);
      body.castShadow = true;
      motor.add(body);
      const gbox = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.30, 0.30), matMotorWhite);
      gbox.position.set(sx * 0.16, 0, 0);
      motor.add(gbox);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 14), matBolt);
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(sx * 0.30, 0, 0);
      motor.add(shaft);
      const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.07, 18), matMotorBlue);
      coupling.rotation.z = Math.PI / 2;
      coupling.position.set(sx * 0.42, 0, 0);
      motor.add(coupling);
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

    // ------------------- TOP BOARD WITH PICO W -------------------
    const topBoard = new THREE.Group();
    {
      const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.07, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x16161c, roughness: 0.6 })
      );
      pcb.castShadow = true; pcb.receiveShadow = true;
      topBoard.add(pcb);

      const pico = new THREE.Group();
      const picoBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.05, 1.05),
        new THREE.MeshStandardMaterial({ color: 0x0d4a37, roughness: 0.55 })
      );
      picoBoard.position.y = 0.06;
      picoBoard.castShadow = true;
      pico.add(picoBoard);
      const rp = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.03, 0.20), matChip);
      rp.position.set(0.02, 0.10, -0.02);
      pico.add(rp);
      const wifi = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.21),
        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.3 })
      );
      wifi.position.set(0, 0.105, 0.26);
      pico.add(wifi);
      const usb = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.10, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
      );
      usb.position.set(0, 0.115, -0.50);
      pico.add(usb);
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
      [-0.205, 0.205].forEach((px) => {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.95), matChip);
        strip.position.set(px, 0.090, 0);
        pico.add(strip);
      });
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

    // ------------------- HC-SR04 ULTRASONIC -------------------
    const sensor = new THREE.Group();
    {
      const sPcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.04, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x1c4a85, metalness: 0.5, roughness: 0.4 })
      );
      sensor.add(sPcb);
      [-0.28, 0.28].forEach((dx) => {
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.20, 28),
          new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
        );
        can.position.set(dx, 0.12, 0);
        can.castShadow = true;
        sensor.add(can);
        const grille = new THREE.Mesh(
          new THREE.CircleGeometry(0.14, 28),
          new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.6 })
        );
        grille.rotation.x = -Math.PI / 2;
        grille.position.set(dx, 0.221, 0);
        sensor.add(grille);
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
      for (let i = 0; i < 4; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.10, 0.025), matGold);
        pin.position.set(-0.18 + i * 0.12, -0.05, -0.13);
        sensor.add(pin);
      }
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.025, 0.10), matChip);
      chip.position.set(0, 0.04, -0.05);
      sensor.add(chip);
    }
    sensor.position.set(0, chassisH/2 - 0.30, chassisL/2 + 0.10);
    sensor.rotation.x = -0.05;
    tank.add(sensor);

    // ------------------- CABLE BUNDLE -------------------
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

    // ------------------- INTERACTION -------------------
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => {
      if (!interactive) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      container.style.cursor = "grabbing"; spinning = false;
    };
    const onMouseUp = () => {
      if (!interactive) return;
      dragging = false;
      container.style.cursor = "grab";
    };
    const onMouseMove = (e) => {
      if (!interactive || !dragging) return;
      camTheta -= (e.clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      updateCam();
    };
    const onWheel = (e) => {
      e.preventDefault();
      camR = Math.max(5, Math.min(18, camR + e.deltaY * 0.01));
      updateCam();
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        spinning = false;
      }
    };
    const onTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      e.preventDefault();
      camTheta -= (e.touches[0].clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.touches[0].clientY - lastY) * 0.006));
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      updateCam();
    };
    const onTouchEnd = () => { dragging = false; };
    const onResize = () => {
      W = container.clientWidth || 680;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    if (interactive) {
      container.addEventListener("wheel", onWheel, { passive: false });
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", onTouchEnd);
    }
    window.addEventListener("resize", onResize);

    // ------------------- LOOP -------------------
    let animId;
    const clock = new THREE.Clock();
    const loop = () => {
      const t = clock.getElapsedTime();
      if (spinning) { camTheta += 0.004; updateCam(); }

      tank.position.y = 0.05 + Math.sin(t * 0.6) * 0.04;

      const trackOffset = (t * 0.18) % 1;
      trackSegments.forEach((s) => {
        const tt = (s.baseT + trackOffset) % 1;
        const p = pointOnTrack(tt);
        s.mesh.position.set(0, p.y, p.z);
        s.mesh.rotation.x = p.ang;
      });

      const wheelOmega = -trackTotalLen / trackR * 0.18;
      const wheelAngle = t * wheelOmega;
      wheels.forEach((w) => {
        w.mesh.rotation.z = wheelAngle;
      });

      if (topBoard.userData.pico && topBoard.userData.pico.userData.actLed) {
        const v = 0.5 + (Math.sin(t * 5.5) + 1) * 0.7;
        topBoard.userData.pico.userData.actLed.material.emissiveIntensity = v;
      }
      if (topBoard.userData.pwrLed) {
        topBoard.userData.pwrLed.material.emissiveIntensity = 0.85 + Math.sin(t * 2.0) * 0.25;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      if (interactive) {
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onTouchEnd);
      }
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      woodTex.dispose();
      deckTex.dispose();
      bottomTex.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [height, autoRotate, interactive]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: "100%",
        height: `${height}px`,
        position: "relative",
        cursor: interactive ? "grab" : "default",
        userSelect: "none",
        touchAction: interactive ? "none" : "auto",
        pointerEvents: interactive ? "auto" : "none",
        background,
        ...style,
      }}
    />
  );
}