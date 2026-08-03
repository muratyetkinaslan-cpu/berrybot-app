// Tank3D.jsx — 🪖 BerryTank 3D model (savaş temalı kit için)
// BerryBot3D ile aynı prop arayüzü: height, autoRotate, background, interactive
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Tank3D({
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

    let camR = 10, camTheta = 0.85, camPhi = 0.42;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 0.6,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 0.7, 0);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfff4e0, 0.95);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;   sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd8e8d0, 0.3);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Malzemeler: askeri palet ──
    const armor    = new THREE.MeshStandardMaterial({ color: 0x4a5d3a, roughness: 0.8 });   // zeytin yeşili
    const armorD   = new THREE.MeshStandardMaterial({ color: 0x37452c, roughness: 0.85 });  // koyu gövde
    const camo     = new THREE.MeshStandardMaterial({ color: 0x5c6b45, roughness: 0.8 });   // kamuflaj açık
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.95 });  // palet
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.3 });
    const hubMat   = new THREE.MeshStandardMaterial({ color: 0x6b7a55, roughness: 0.5, metalness: 0.4 });
    const metal    = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.35, metalness: 0.8 });
    const pcbMat   = new THREE.MeshStandardMaterial({ color: 0x146b2e, roughness: 0.6 });   // BerryBot kartı yeşil PCB
    const ledR     = new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0x881008, roughness: 0.4 });
    const ledG     = new THREE.MeshStandardMaterial({ color: 0x30ff50, emissive: 0x0a7a1a, roughness: 0.4 });
    const ledB     = new THREE.MeshStandardMaterial({ color: 0x3090ff, emissive: 0x0a2a88, roughness: 0.4 });
    const ledY     = new THREE.MeshStandardMaterial({ color: 0xffd020, emissive: 0x8a6a08, roughness: 0.4 });
    const matrixOn = new THREE.MeshStandardMaterial({ color: 0xff5522, emissive: 0xcc3300, roughness: 0.4 });
    const matrixOff= new THREE.MeshStandardMaterial({ color: 0x201810, roughness: 0.7 });
    const sensorMat= new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.5 });
    const star     = new THREE.MeshStandardMaterial({ color: 0xe8c840, roughness: 0.4, metalness: 0.5 });

    const tank = new THREE.Group();
    scene.add(tank);
    const S = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

    // ── Paletler ──
    const trackL = new THREE.Group(), trackR = new THREE.Group();
    [[-1.35, trackL], [1.35, trackR]].forEach(([x, g]) => {
      const body = S(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 3.6), trackMat));
      body.position.set(x, 0.62, 0);
      g.add(body);
      // palet dişleri
      for (let i = 0; i < 9; i++) {
        const tooth = S(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.16), wheelMat));
        tooth.position.set(x, 1.04, -1.6 + i * 0.4);
        g.add(tooth);
      }
      // yol tekerleri
      for (let i = 0; i < 4; i++) {
        const w = S(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.7, 20), wheelMat));
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.42, -1.2 + i * 0.8);
        g.add(w);
        const hub = S(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.74, 12), hubMat));
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(w.position);
        g.add(hub);
      }
      tank.add(g);
    });

    // ── Gövde ──
    const hull = S(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 3.3), armor));
    hull.position.y = 1.1;
    tank.add(hull);
    // eğimli ön zırh
    const glacis = S(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.72, 0.9), armorD));
    glacis.position.set(0, 1.02, -1.85);
    glacis.rotation.x = 0.5;
    tank.add(glacis);
    // arka zırh
    const rear = S(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.5), armorD));
    rear.position.set(0, 1.05, 1.8);
    rear.rotation.x = -0.35;
    tank.add(rear);
    // kamuflaj lekeleri
    [[-0.7, 1.46, -0.6, 0.9], [0.6, 1.46, 0.7, 1.1], [0.2, 1.46, -1.2, 0.7]].forEach(([x, y, z, s]) => {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.28 * s, 10), camo);
      spot.rotation.x = -Math.PI / 2;
      spot.position.set(x, y + 0.001, z);
      tank.add(spot);
    });

    // ── BerryBot kartı (gövde üstü, arka) ──
    const pcb = S(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), pcbMat));
    pcb.position.set(0, 1.49, 1.0);
    tank.add(pcb);
    // 4 RGB LED
    [[-0.55, ledR], [-0.2, ledG], [0.2, ledB], [0.55, ledY]].forEach(([x, m]) => {
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10), m);
      led.position.set(x, 1.55, 0.65);
      tank.add(led);
    });
    // 5x5 LED matrix (kart üstünde) — "T" harfi yanık
    const tShape = [[0,0],[1,0],[2,0],[3,0],[4,0],[2,1],[2,2],[2,3],[2,4]];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const on = tShape.some(([cc, rr]) => cc === c && rr === r);
      const px = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.09), on ? matrixOn : matrixOff);
      px.position.set(-0.26 + c * 0.13, 1.53, 0.85 + r * 0.13);
      tank.add(px);
    }

    // ── Taret ──
    const turret = new THREE.Group();
    turret.position.set(0, 1.45, -0.45);
    const tBase = S(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.55, 24), armorD));
    tBase.position.y = 0.28;
    turret.add(tBase);
    const tTop = S(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 0.35, 24), armor));
    tTop.position.y = 0.68;
    turret.add(tTop);
    // yıldız rozeti
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.18, 5), star);
    badge.position.set(0, 0.55, -1.02);
    turret.add(badge);
    // namlu
    const barrel = S(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.3, 14), metal));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.42, -1.9);
    turret.add(barrel);
    const muzzle = S(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 14), armorD));
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.42, -3.0);
    turret.add(muzzle);
    // kapak
    const hatch = S(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), armorD));
    hatch.position.set(0.25, 0.9, 0.15);
    turret.add(hatch);
    // anten
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.2, 8), sensorMat);
    antenna.position.set(-0.55, 1.4, 0.4);
    turret.add(antenna);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), ledR);
    antTip.position.set(-0.55, 2.0, 0.4);
    turret.add(antTip);
    // ESP32-CAM yuvası (gelecek kamera)
    const camBox = S(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), sensorMat));
    camBox.position.set(0, 0.95, -0.55);
    turret.add(camBox);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), metal);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.95, -0.68);
    turret.add(lens);
    tank.add(turret);

    // ── Ön sensörler ──
    // çizgi sensörü (altta önde)
    const lineSensor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.25), sensorMat);
    lineSensor.position.set(0, 0.2, -1.95);
    tank.add(lineSensor);
    // mesafe sensörü gözleri (önde)
    [-0.3, 0.3].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12), sensorMat);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(x, 1.15, -2.28);
      tank.add(eye);
      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 10), ledB);
      iris.rotation.x = Math.PI / 2;
      iris.position.set(x, 1.15, -2.29);
      tank.add(iris);
    });

    // ── Etkileşim (BerryBot3D ile aynı) ──
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => { if (!interactive) return; dragging = true; lastX = e.clientX; lastY = e.clientY; container.style.cursor = "grabbing"; spinning = false; };
    const onMouseUp = () => { if (!interactive) return; dragging = false; container.style.cursor = "grab"; };
    const onMouseMove = (e) => {
      if (!interactive || !dragging) return;
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
    if (interactive) {
      container.addEventListener("wheel", onWheel, { passive: false });
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", onTouchEnd);
    }
    window.addEventListener("resize", onResize);

    let animId, t = 0;
    const loop = () => {
      t += 0.016;
      if (spinning) { camTheta += 0.004; updateCam(); }
      // taret hafif tarama hareketi + anten ucu yanıp sönme
      turret.rotation.y = Math.sin(t * 0.5) * 0.35;
      antTip.material.emissive.setScalar(Math.sin(t * 4) > 0 ? 0.6 : 0.05);
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
