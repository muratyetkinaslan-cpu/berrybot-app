// RoboArm3D.jsx — 4 eksenli ahşap robot kol (animasyonlu)
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function RoboArm3D({
  height = 520,
  autoRotate = true,
  background = "transparent",
  className = "",
  style = {},
  interactive = false,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

    let camR = 9.0, camTheta = 0.85, camPhi = 0.42;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 1.2,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 1.4, 0);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3e0, 0.95);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffe0c0, 0.35);
    fill.position.set(-5, 4, -4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffc890, 0.28);
    rim.position.set(2, 3, -6);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ─── Malzemeler (Porima Wood + siyah servo) ───
    const wood     = new THREE.MeshStandardMaterial({ color: 0xdcb078, roughness: 0.82 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0xbf9258, roughness: 0.88 });
    const servoBlk = new THREE.MeshStandardMaterial({ color: 0x17171a, roughness: 0.45 });
    const hornMat  = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.5 });
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.35, metalness: 0.8 });
    const cubeMat  = new THREE.MeshStandardMaterial({ color: 0xe8611a, roughness: 0.6 });

    const shadowify = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    const box = (w, h, d, mat) => shadowify(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    const cyl = (rt, rb, h, mat, seg = 28) => shadowify(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat));

    const addScrews = (parent, positions, r = 0.045) => {
      positions.forEach(([x, y, z]) => {
        const s = cyl(r, r, 0.05, screwMat, 12);
        s.rotation.x = Math.PI / 2;
        s.position.set(x, y, z);
        parent.add(s);
      });
    };

    // ─── Robot hiyerarşisi ───
    const robot = new THREE.Group();
    scene.add(robot);

    // Taban: geniş disk + tırtıklı gövde
    const basePlate = cyl(1.35, 1.45, 0.22, woodDark);
    basePlate.position.y = 0.11;
    robot.add(basePlate);
    const baseDrum = cyl(1.05, 1.05, 0.62, wood, 40);
    baseDrum.position.y = 0.53;
    robot.add(baseDrum);
    // vantuz ayaklar
    [[1.15, 0.06, 1.15], [-1.15, 0.06, 1.15], [1.15, 0.06, -1.15], [-1.15, 0.06, -1.15]].forEach(([x, y, z]) => {
      const foot = cyl(0.22, 0.28, 0.12, woodDark, 16);
      foot.position.set(x * 0.92, y, z * 0.92);
      robot.add(foot);
    });

    // ── Eksen 1: taban dönüşü ──
    const yaw = new THREE.Group();
    yaw.position.y = 0.86;
    robot.add(yaw);

    const turntable = cyl(0.92, 0.98, 0.16, woodDark);
    yaw.add(turntable);

    // Omuz kulesi: iki ahşap plaka + aradaki MG996R (siyah)
    const towerL = box(0.14, 1.0, 0.9, wood); towerL.position.set(-0.42, 0.58, 0); yaw.add(towerL);
    const towerR = box(0.14, 1.0, 0.9, wood); towerR.position.set(0.42, 0.58, 0); yaw.add(towerR);
    const mg996 = box(0.62, 0.62, 0.56, servoBlk); mg996.position.set(0, 0.62, 0); yaw.add(mg996);
    const hornBoss = cyl(0.09, 0.09, 0.7, hornMat, 16);
    hornBoss.rotation.z = Math.PI / 2; hornBoss.position.set(0, 0.92, 0); yaw.add(hornBoss);
    addScrews(towerL, [[0, 0.35, 0.32], [0, 0.35, -0.32], [0, -0.2, 0.32], [0, -0.2, -0.32]].map(([x, y, z]) => [x - 0.001, y, z]));

    // ── Eksen 2: omuz (üst kol) ──
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.92, 0);
    yaw.add(shoulder);

    const upperArm = box(0.3, 1.7, 0.5, wood);
    upperArm.position.y = 0.85;
    shoulder.add(upperArm);
    // yan destek plakaları
    const plateA = box(0.06, 1.5, 0.62, woodDark); plateA.position.set(-0.2, 0.8, 0); shoulder.add(plateA);
    const plateB = box(0.06, 1.5, 0.62, woodDark); plateB.position.set(0.2, 0.8, 0); shoulder.add(plateB);

    // ── Eksen 3: dirsek (ön kol) ──
    const elbow = new THREE.Group();
    elbow.position.set(0, 1.7, 0);
    shoulder.add(elbow);

    const mg90a = box(0.34, 0.42, 0.34, servoBlk); mg90a.position.set(0, 0.05, 0); elbow.add(mg90a);
    const foreArm = box(0.26, 1.35, 0.42, wood);
    foreArm.position.y = 0.72;
    elbow.add(foreArm);

    // ── Eksen 4: bilek + gripper ──
    const wrist = new THREE.Group();
    wrist.position.set(0, 1.38, 0);
    elbow.add(wrist);

    const mg90b = box(0.3, 0.36, 0.3, servoBlk); mg90b.position.y = 0.1; wrist.add(mg90b);
    const wristHub = box(0.5, 0.3, 0.55, wood); wristHub.position.y = 0.38; wrist.add(wristHub);

    // Gripper pençeleri (iki paralel kol, açılır-kapanır)
    const clawL = new THREE.Group(); clawL.position.set(-0.16, 0.53, 0); wrist.add(clawL);
    const clawR = new THREE.Group(); clawR.position.set(0.16, 0.53, 0); wrist.add(clawR);
    const mkFinger = (mirror) => {
      const g = new THREE.Group();
      const seg1 = box(0.09, 0.62, 0.2, wood); seg1.position.y = 0.31; g.add(seg1);
      const seg2 = box(0.09, 0.42, 0.2, woodDark);
      seg2.position.set(mirror * 0.1, 0.72, 0);
      seg2.rotation.z = mirror * -0.55;
      g.add(seg2);
      const tip = box(0.09, 0.22, 0.2, wood);
      tip.position.set(mirror * 0.24, 0.98, 0);
      g.add(tip);
      return g;
    };
    clawL.add(mkFinger(-1));
    clawR.add(mkFinger(1));

    // Gripper'ın tuttuğu küp (X kabartmalı turuncu)
    const cube = box(0.34, 0.34, 0.34, cubeMat);
    cube.position.set(0, 1.35, 0);
    wrist.add(cube);

    // ─── Etkileşim ───
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => { if (!interactive) return; dragging = true; lastX = e.clientX; lastY = e.clientY; container.style.cursor = "grabbing"; spinning = false; };
    const onMouseUp = () => { dragging = false; container.style.cursor = interactive ? "grab" : "default"; };
    const onMouseMove = (e) => {
      if (!dragging) return;
      camTheta -= (e.clientX - lastX) * 0.008;
      camPhi = Math.max(0.08, Math.min(1.25, camPhi + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      updateCam();
    };
    const onWheel = (e) => { e.preventDefault(); camR = Math.max(5, Math.min(18, camR + e.deltaY * 0.01)); updateCam(); };
    let touchLast = null;
    const onTouchStart = (e) => { if (!interactive) return; spinning = false; const t = e.touches[0]; touchLast = { x: t.clientX, y: t.clientY }; };
    const onTouchMove = (e) => {
      if (!touchLast) return;
      e.preventDefault();
      const t = e.touches[0];
      camTheta -= (t.clientX - touchLast.x) * 0.008;
      camPhi = Math.max(0.08, Math.min(1.25, camPhi + (t.clientY - touchLast.y) * 0.006));
      touchLast = { x: t.clientX, y: t.clientY };
      updateCam();
    };
    const onTouchEnd = () => { touchLast = null; };
    const onResize = () => {
      W = container.clientWidth || W;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
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

    // ─── Animasyon: eksenler yumuşak salınım, gripper aç-kapa ───
    let animId;
    const clock = new THREE.Clock();
    const loop = () => {
      const t = clock.getElapsedTime();
      if (spinning) { camTheta += 0.004; updateCam(); }

      yaw.rotation.y      = Math.sin(t * 0.45) * 0.7;
      shoulder.rotation.x = -0.45 + Math.sin(t * 0.6) * 0.28;
      elbow.rotation.x    = 0.85 + Math.sin(t * 0.6 + 1.2) * 0.32;
      wrist.rotation.x    = -0.35 + Math.sin(t * 0.6 + 2.1) * 0.2;

      // gripper: periyodik kavra/bırak
      const grip = (Math.sin(t * 1.4) + 1) / 2; // 0..1
      clawL.rotation.z = -grip * 0.35;
      clawR.rotation.z = grip * 0.35;
      cube.visible = grip > 0.45; // kapalıyken küp elinde
      cube.scale.setScalar(0.8 + grip * 0.2);

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
