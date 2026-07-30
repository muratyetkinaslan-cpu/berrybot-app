// RoboPanzer3D.jsx — paletli eğitim tankı (animasyonlu: kule tarama, namlu, far flaşı)
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function RoboPanzer3D({
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

    let camR = 9.5, camTheta = 0.9, camPhi = 0.4;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 0.8,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 0.9, 0);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfff6e0, 0.95);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd8ffd0, 0.3);
    fill.position.set(-5, 4, -4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x90c890, 0.25);
    rim.position.set(2, 3, -6);
    scene.add(rim);

    // ── malzemeler (askeri palet) ─────────────────────────
    const M = {
      hull:   new THREE.MeshStandardMaterial({ color: 0x4a5d3a, roughness: 0.7, metalness: 0.25 }),
      hullD:  new THREE.MeshStandardMaterial({ color: 0x3a4a2e, roughness: 0.75, metalness: 0.2 }),
      camo:   new THREE.MeshStandardMaterial({ color: 0x6b7d4f, roughness: 0.8 }),
      track:  new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.95 }),
      wheel:  new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.6, metalness: 0.5 }),
      barrel: new THREE.MeshStandardMaterial({ color: 0x33402a, roughness: 0.5, metalness: 0.5 }),
      sensor: new THREE.MeshStandardMaterial({ color: 0x1a2740, roughness: 0.35, metalness: 0.6 }),
      eye:    new THREE.MeshStandardMaterial({ color: 0xc0c8d8, roughness: 0.2, metalness: 0.8 }),
      screen: new THREE.MeshStandardMaterial({ color: 0x06131f, roughness: 0.25, emissive: 0x0a2a12, emissiveIntensity: 0.9 }),
      star:   new THREE.MeshStandardMaterial({ color: 0xd8c05a, roughness: 0.4, metalness: 0.7 }),
    };
    const ledMat = () => new THREE.MeshStandardMaterial({
      color: 0x220000, emissive: 0xff2200, emissiveIntensity: 0.0, roughness: 0.3,
    });

    const tank = new THREE.Group();
    scene.add(tank);

    const box = (w, h, d, mat, x, y, z, parent = tank) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    // ── gövde ─────────────────────────────────────────────
    box(2.6, 0.55, 3.4, M.hull, 0, 0.72, 0);                 // ana gövde
    box(2.2, 0.22, 3.7, M.hullD, 0, 1.03, 0);                // üst güverte
    const glacis = box(2.2, 0.5, 0.7, M.camo, 0, 0.72, 1.85); // eğik ön zırh
    glacis.rotation.x = -0.5;
    box(2.2, 0.4, 0.5, M.camo, 0, 0.72, -1.85);              // arka zırh

    // ── paletler ──────────────────────────────────────────
    [-1.55, 1.55].forEach((x) => {
      const tr = box(0.55, 0.72, 3.6, M.track, x, 0.45, 0);
      tr.geometry = new THREE.BoxGeometry(0.55, 0.72, 3.6, 1, 1, 6);
      // yol tekerlekleri
      for (let i = 0; i < 5; i++) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.6, 20), M.wheel);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.32, -1.3 + i * 0.65);
        w.castShadow = true;
        tank.add(w);
      }
      // palet dişleri
      for (let i = 0; i < 7; i++) {
        box(0.6, 0.06, 0.16, M.wheel, x, 0.84, -1.5 + i * 0.5);
      }
    });

    // ── farlar (RGB WS2812 · GP6) ─────────────────────────
    const leds = [];
    [-0.85, -0.35, 0.35, 0.85].forEach((x) => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), ledMat());
      l.position.set(x, 0.92, 1.78);
      tank.add(l); leds.push(l);
    });

    // ── ön sensör grubu ───────────────────────────────────
    // HC-SR04 "gözler" (trig GP3 / echo GP2)
    const usBase = box(0.9, 0.34, 0.16, M.sensor, 0, 1.22, 1.62);
    [-0.24, 0.24].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 18), M.eye);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(x, 0, 0.1);
      usBase.add(eye);
    });
    // çizgi sensörleri (altta · GP14/GP15)
    [-0.5, 0.5].forEach((x) => box(0.22, 0.06, 0.3, M.sensor, x, 0.18, 1.5));

    // ── kule ──────────────────────────────────────────────
    const turret = new THREE.Group();
    turret.position.set(0, 1.14, -0.25);
    tank.add(turret);

    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.0, 0.55, 24), M.hull
    );
    dome.position.y = 0.28; dome.castShadow = true;
    turret.add(dome);
    box(0.6, 0.16, 0.6, M.hullD, -0.3, 0.62, -0.2, turret); // komutan kapağı
    const star = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 5), M.star);
    star.rotation.x = Math.PI / 2;
    star.position.set(0, 0.35, 0.86);
    turret.add(star); // rütbe yıldızı

    // OLED komuta ekranı (SDA GP4 / SCL GP5) — kule arkası
    const oled = box(0.7, 0.4, 0.05, M.screen, 0.25, 0.45, -0.83, turret);
    oled.rotation.y = Math.PI;

    // Nerf namlusu (tetik servosu GP16)
    const barrel = new THREE.Group();
    barrel.position.set(0, 0.32, 0.55);
    turret.add(barrel);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 18), M.barrel);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 0.95;
    tube.castShadow = true;
    barrel.add(tube);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 18),
      new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.4, emissive: 0xff5500, emissiveIntensity: 0.25 }));
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = 1.95;
    barrel.add(muzzle);

    // anten
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8), M.wheel);
    ant.position.set(-0.6, 1.1, -0.5);
    turret.add(ant);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.8 }));
    antTip.position.set(-0.6, 1.72, -0.5);
    turret.add(antTip);

    // ── zemin ─────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a3320, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── etkileşim (RoboArm3D ile aynı arayüz) ─────────────
    let dragging = false, px = 0, py = 0;
    const onDown = (e) => { if (!interactive) return; dragging = true; spinning = false;
      px = e.clientX ?? e.touches?.[0]?.clientX; py = e.clientY ?? e.touches?.[0]?.clientY; };
    const onMove = (e) => {
      if (!dragging) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY;
      camTheta -= (cx - px) * 0.008;
      camPhi = Math.min(1.3, Math.max(0.08, camPhi + (cy - py) * 0.006));
      px = cx; py = cy; updateCam();
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e) => { if (!interactive) return; e.preventDefault();
      camR = Math.min(16, Math.max(5, camR + e.deltaY * 0.01)); updateCam(); };
    if (interactive) {
      container.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      container.addEventListener("wheel", onWheel, { passive: false });
    }

    const onResize = () => {
      W = container.clientWidth || W;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    // ── animasyon ─────────────────────────────────────────
    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      if (spinning) { camTheta += 0.004; updateCam(); }
      turret.rotation.y = Math.sin(t * 0.7) * 0.9;            // radar taraması
      barrel.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.06;   // namlu nefesi
      tank.position.y = Math.sin(t * 2.2) * 0.015;            // motor titreşimi
      leds.forEach((l, i) => {                                // far devriye flaşı
        const on = (Math.sin(t * 3 + i * 1.4) + 1) / 2;
        l.material.emissiveIntensity = 0.15 + on * 0.85;
        l.material.emissive.setHSL(0.33 * ((i % 2) === 0 ? 1 : 0.05), 1, 0.5);
      });
      antTip.material.emissiveIntensity = 0.4 + ((Math.sin(t * 5) + 1) / 2) * 0.6;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (interactive) {
        container.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        container.removeEventListener("wheel", onWheel);
      }
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
