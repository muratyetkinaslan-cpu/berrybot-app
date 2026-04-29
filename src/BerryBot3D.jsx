// BerryBot3D.jsx — 3D animated robot component
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BerryBot3D({
  height = 520,
  autoRotate = false,
  background = "transparent",
  className = "",
  style = {},
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

    let camR = 9.5, camTheta = 0.85, camPhi = 0.45;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 0.6,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 0.6, 0);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;   sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xfff0d8, 0.35);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xb0c8ff, 0.25);
    rim.position.set(2, 3, -6);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const woodLight = new THREE.MeshStandardMaterial({ color: 0xddc09a, roughness: 0.85 });
    const woodMid   = new THREE.MeshStandardMaterial({ color: 0xc0986e, roughness: 0.9 });
    const woodDark  = new THREE.MeshStandardMaterial({ color: 0x8a6235, roughness: 0.95 });
    const cutoutMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
    const slatMat   = new THREE.MeshStandardMaterial({ color: 0x2e1f12, roughness: 0.9 });
    const tireMat   = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
    const metalMat  = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.3, metalness: 0.85 });
    const screwMat  = new THREE.MeshStandardMaterial({ color: 0xc6c6c6, roughness: 0.4, metalness: 0.7 });
    const ledOff    = new THREE.MeshStandardMaterial({ color: 0x8a1414, roughness: 0.4 });
    const blackPlas = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55 });
    const whiteConn = new THREE.MeshStandardMaterial({ color: 0xf3f3f3, roughness: 0.5 });
    const wireR = new THREE.MeshStandardMaterial({ color: 0xc92020, roughness: 0.5 });
    const wireY = new THREE.MeshStandardMaterial({ color: 0xeac24a, roughness: 0.5 });
    const wireW = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
    const wireBlk = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.55 });

    // PCB texture
    const pcbCanvas = document.createElement("canvas");
    pcbCanvas.width = 1024; pcbCanvas.height = 800;
    const ctx2d = pcbCanvas.getContext("2d");
    ctx2d.fillStyle = "#6e3eaa";
    ctx2d.fillRect(0, 0, 1024, 800);
    ctx2d.strokeStyle = "#5a2d99";
    ctx2d.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx2d.beginPath();
      const x1 = Math.random() * 1024, y1 = Math.random() * 800;
      ctx2d.moveTo(x1, y1);
      ctx2d.lineTo(x1 + (Math.random() - 0.5) * 300, y1 + (Math.random() - 0.5) * 300);
      ctx2d.stroke();
    }
    ctx2d.fillStyle = "white";
    ctx2d.font = "bold 86px sans-serif";
    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    ctx2d.fillText("BerryBot", 380, 400);
    ctx2d.fillStyle = "#caa1ee";
    for (let i = 0; i < 8; i++) {
      ctx2d.beginPath();
      ctx2d.arc(80 + i * 30, 60, 6, 0, Math.PI * 2);
      ctx2d.fill();
    }
    for (const [x, y] of [[120, 700], [900, 100], [120, 100], [900, 700]]) {
      ctx2d.fillStyle = "#ffaacf";
      ctx2d.beginPath(); ctx2d.arc(x, y, 22, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.fillStyle = "#3a8a3a";
      ctx2d.beginPath();
      ctx2d.moveTo(x, y - 22);
      ctx2d.lineTo(x + 14, y - 32);
      ctx2d.lineTo(x + 4, y - 14);
      ctx2d.fill();
    }
    const pcbTex = new THREE.CanvasTexture(pcbCanvas);
    pcbTex.anisotropy = 8;
    const pcbTopMat    = new THREE.MeshStandardMaterial({ map: pcbTex, roughness: 0.55, metalness: 0.05 });
    const pcbSideMat   = new THREE.MeshStandardMaterial({ color: 0x6e3eaa, roughness: 0.6 });
    const pcbBottomMat = new THREE.MeshStandardMaterial({ color: 0x4d2675, roughness: 0.65 });

    const robot = new THREE.Group();
    scene.add(robot);

    const halfL = 1.7, baseH = 0.4, topH = 1.25, cR = 0.55;
    const sideShape = new THREE.Shape();
    sideShape.moveTo(-halfL, 0);
    sideShape.lineTo(halfL, 0);
    sideShape.lineTo(halfL, baseH);
    sideShape.quadraticCurveTo(halfL, topH, halfL - cR, topH);
    sideShape.lineTo(-halfL + cR, topH);
    sideShape.quadraticCurveTo(-halfL, topH, -halfL, baseH);
    sideShape.lineTo(-halfL, 0);

    const bodyW = 2.4;
    const sideThick = 0.08;
    const innerW = bodyW - 2 * sideThick - 0.02;

    const innerBody = new THREE.Mesh(
      new THREE.ExtrudeGeometry(sideShape, { depth: innerW, bevelEnabled: false }),
      woodLight
    );
    innerBody.position.set(0, 0.18, -innerW / 2);
    innerBody.castShadow = true;
    innerBody.receiveShadow = true;
    robot.add(innerBody);

    function upperPath(s) {
      if (s < 0.3) {
        const t = s / 0.3, inv = 1 - t;
        const p0x = halfL, p0y = baseH;
        const p1x = halfL, p1y = topH;
        const p2x = halfL - cR, p2y = topH;
        return {
          x: inv * inv * p0x + 2 * inv * t * p1x + t * t * p2x,
          y: inv * inv * p0y + 2 * inv * t * p1y + t * t * p2y,
          tx: 2 * inv * (p1x - p0x) + 2 * t * (p2x - p1x),
          ty: 2 * inv * (p1y - p0y) + 2 * t * (p2y - p1y),
        };
      } else if (s < 0.7) {
        const t = (s - 0.3) / 0.4;
        return {
          x: (halfL - cR) - t * 2 * (halfL - cR),
          y: topH,
          tx: -1, ty: 0,
        };
      } else {
        const t = (s - 0.7) / 0.3, inv = 1 - t;
        const p0x = -halfL + cR, p0y = topH;
        const p1x = -halfL, p1y = topH;
        const p2x = -halfL, p2y = baseH;
        return {
          x: inv * inv * p0x + 2 * inv * t * p1x + t * t * p2x,
          y: inv * inv * p0y + 2 * inv * t * p1y + t * t * p2y,
          tx: 2 * inv * (p1x - p0x) + 2 * t * (p2x - p1x),
          ty: 2 * inv * (p1y - p0y) + 2 * t * (p2y - p1y),
        };
      }
    }

    const numSlats = 38;
    const slatLen = innerW - 0.04;
    for (let i = 0; i < numSlats; i++) {
      const s = (i + 0.5) / numSlats;
      const p = upperPath(s);
      const tlen = Math.sqrt(p.tx * p.tx + p.ty * p.ty);
      const ntx = p.tx / tlen, nty = p.ty / tlen;
      const nx = nty, ny = -ntx;
      const ang = Math.atan2(nty, ntx);
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.05, slatLen),
        slatMat
      );
      const offset = 0.022;
      slat.position.set(p.x + nx * offset, p.y + ny * offset + 0.18, 0);
      slat.rotation.z = ang;
      robot.add(slat);
    }

    const panelGeo = new THREE.ExtrudeGeometry(sideShape, { depth: sideThick, bevelEnabled: false });
    const lp = new THREE.Mesh(panelGeo, woodLight);
    lp.position.set(0, 0.18, -bodyW / 2);
    lp.castShadow = true; lp.receiveShadow = true;
    robot.add(lp);
    const rp = new THREE.Mesh(panelGeo, woodLight);
    rp.position.set(0, 0.18, bodyW / 2 - sideThick);
    rp.castShadow = true; rp.receiveShadow = true;
    robot.add(rp);

    function addSidePanelDetails(zSign) {
      const zSurface = zSign * (bodyW / 2 + 0.001);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.015), cutoutMat);
      slot.position.set(0.55, 0.18 + baseH + 0.32, zSurface);
      robot.add(slot);
      const sq = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.015), cutoutMat);
      sq.position.set(-0.5, 0.18 + 0.12, zSurface);
      robot.add(sq);
      for (let i = 0; i < 7; i++) {
        const hs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.018, 0.015), cutoutMat);
        hs.position.set(-0.05, 0.18 + baseH + 0.04 + i * 0.05, zSurface);
        robot.add(hs);
      }
      for (const pos of [
        [-1.55, 0.18 + baseH + 0.4],
        [ 1.55, 0.18 + baseH + 0.4],
        [-1.55, 0.18 + 0.12],
        [ 1.55, 0.18 + 0.12],
      ]) {
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 12), screwMat);
        sc.rotation.x = Math.PI / 2;
        sc.position.set(pos[0], pos[1], zSurface);
        robot.add(sc);
      }
    }
    addSidePanelDetails(1);
    addSidePanelDetails(-1);

    function makeWheel() {
      const g = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.22, 36), tireMat);
      tire.castShadow = true;
      g.add(tire);
      const tread = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 36), tireMat);
      tread.rotation.x = Math.PI / 2;
      g.add(tread);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 32), woodLight);
      hub.castShadow = true;
      g.add(hub);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.21, 32), woodMid);
      g.add(inner);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.13), woodLight);
        sp.rotation.y = a;
        g.add(sp);
      }
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 12), screwMat);
      g.add(bolt);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 8;
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 10), screwMat);
        sc.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
        g.add(sc);
      }
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 16), woodDark);
      g.add(center);
      return g;
    }

    const wheelXOffset = -0.35;
    const lw = makeWheel();
    lw.rotation.x = Math.PI / 2;
    lw.position.set(wheelXOffset, 0.7, -(bodyW / 2 + 0.13));
    robot.add(lw);
    const rw = makeWheel();
    rw.rotation.x = Math.PI / 2;
    rw.position.set(wheelXOffset, 0.7, (bodyW / 2 + 0.13));
    robot.add(rw);

    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), metalMat);
    caster.position.set(-1.4, 0.13, 0);
    caster.castShadow = true;
    robot.add(caster);

    const usY = baseH + 0.3 + 0.18;
    const usZspread = 0.32;
    const usMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.35, metalness: 0.7 });
    const usFace = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 });

    [-1, 1].forEach((sgn) => {
      const us = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24), usMat);
      us.rotation.z = Math.PI / 2;
      us.position.set(halfL + 0.04, usY, sgn * usZspread);
      robot.add(us);
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.04, 24), usFace);
      face.rotation.z = Math.PI / 2;
      face.position.set(halfL + 0.105, usY, sgn * usZspread);
      robot.add(face);
      for (let r = 0; r < 3; r++) {
        const ringR = 0.05 + r * 0.04;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(ringR, 0.005, 6, 22),
          new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5 })
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(halfL + 0.13, usY, sgn * usZspread);
        robot.add(ring);
      }
    });

    const usBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.18, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x1d4f2a, roughness: 0.5 })
    );
    usBoard.position.set(halfL - 0.01, usY, 0);
    robot.add(usBoard);

    const usLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 })
    );
    usLed.position.set(halfL + 0.05, usY + 0.18, 0);
    robot.add(usLed);

    for (const sgn of [-1, 1]) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), screwMat);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(halfL + 0.005, baseH - 0.05 + 0.18, sgn * 0.7);
      robot.add(screw);
    }

    const pcbY = topH + 0.18 + 0.18;
    const pcbW_ = 1.55, pcbD_ = 1.3, pcbT = 0.05;

    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const so = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.18, 0.13), woodMid);
      so.position.set(sx * (pcbW_ / 2 - 0.18), topH + 0.09 + 0.18, sz * (pcbD_ / 2 - 0.15));
      so.castShadow = true;
      robot.add(so);
    });

    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(pcbW_, pcbT, pcbD_),
      [pcbSideMat, pcbSideMat, pcbTopMat, pcbBottomMat, pcbSideMat, pcbSideMat]
    );
    pcb.position.set(0, pcbY, 0);
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    robot.add(pcb);

    const ledMatX = 0.32;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.05), ledOff);
        led.position.set(ledMatX - 0.2 + i * 0.1, pcbY + pcbT / 2 + 0.011, -0.2 + j * 0.1);
        robot.add(led);
      }
    }

    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), blackPlas);
    chip.position.set(-0.05, pcbY + pcbT / 2 + 0.02, 0.0);
    robot.add(chip);

    const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.14), blackPlas);
    chip2.position.set(-0.05, pcbY + pcbT / 2 + 0.015, -0.32);
    robot.add(chip2);

    for (const [x, z] of [
      [-0.55, 0.55], [-0.3, 0.55], [-0.05, 0.55], [0.25, 0.55], [0.55, 0.55],
    ]) {
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.11), whiteConn);
      conn.position.set(x, pcbY + pcbT / 2 + 0.035, z);
      robot.add(conn);
      const pins = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.03), metalMat);
      pins.position.set(x, pcbY + pcbT / 2 + 0.075, z + 0.05);
      robot.add(pins);
    }

    for (const [x, z] of [[-0.45, -0.55], [0.5, -0.55]]) {
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.11), whiteConn);
      conn.position.set(x, pcbY + pcbT / 2 + 0.035, z);
      robot.add(conn);
    }

    const battSw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.18), blackPlas);
    battSw.position.set(-pcbW_ / 2 + 0.06, pcbY + pcbT / 2 + 0.025, 0);
    robot.add(battSw);

    const oled = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.14), blackPlas);
    oled.position.set(-0.4, pcbY + pcbT / 2 + 0.02, -0.5);
    robot.add(oled);

    const btnA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), blackPlas);
    btnA.position.set(0.55, pcbY + pcbT / 2 + 0.02, -0.45);
    robot.add(btnA);

    function makeWire(material, points) {
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, 0.018, 8, false),
        material
      );
    }
    const wires = new THREE.Group();
    const baseZ = 0.62;
    for (const [offX, mat] of [[0.05, wireR], [0.0, wireY], [-0.05, wireW], [-0.1, wireBlk]]) {
      wires.add(
        makeWire(mat, [
          new THREE.Vector3(0.55 + offX, pcbY + 0.04, baseZ),
          new THREE.Vector3(0.55 + offX, pcbY + 0.18, 0.85),
          new THREE.Vector3(0.6 + offX, pcbY + 0.28, 1.18),
          new THREE.Vector3(0.6 + offX, pcbY + 0.05, 1.55),
        ])
      );
    }
    robot.add(wires);

    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; container.style.cursor = "grabbing"; spinning = false; };
    const onMouseUp = () => { dragging = false; container.style.cursor = "grab"; };
    const onMouseMove = (e) => {
      if (!dragging) return;
      camTheta -= (e.clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      updateCam();
    };
    const onWheel = (e) => { e.preventDefault(); camR = Math.max(5, Math.min(18, camR + e.deltaY * 0.01)); updateCam(); };
    const onTouchStart = (e) => { if (e.touches.length === 1) { dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; spinning = false; } };
    const onTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      e.preventDefault();
      camTheta -= (e.touches[0].clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.touches[0].clientY - lastY) * 0.006));
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      updateCam();
    };
    const onTouchEnd = () => { dragging = false; };
    const onResize = () => { W = container.clientWidth || 680; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", onResize);

    let animId;
    const loop = () => {
      if (spinning) { camTheta += 0.004; updateCam(); }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      pcbTex.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [height, autoRotate]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: "100%",
        height: `${height}px`,
        position: "relative",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        background,
        ...style,
      }}
    />
  );
}
