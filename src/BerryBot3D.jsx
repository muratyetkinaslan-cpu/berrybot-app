// BerryBot3D.jsx — 3D robot component loading Fusion 360 OBJ/MTL export
//
// Kullanım / Usage:
//   import BerryBot3D from "./BerryBot3D";
//
//   <BerryBot3D
//     objUrl="/models/berrybot.obj"
//     mtlUrl="/models/berrybot.mtl"
//   />
//
// NOT: OBJ dosyası içinde "mtllib Berry_Botb.mtl" yazıyor.
// MTLLoader bu satırı kendi yükleme path'iyle override eder,
// bu yüzden mtlUrl prop'u üzerinden doğrudan MTL yüklenir.
//
// Gerekli paketler:
//   npm install three
//   (OBJLoader ve MTLLoader three/examples/jsm içinde gelir)

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

// ---------------------------------------------------------------------------
// Fusion 360 MTL'den gelen materyallere fiziksel özellik ekler.
// Sadece Kd (diffuse renk) var — bu fonksiyon material adına bakarak
// roughness / metalness / envMapIntensity atar. Renk dokunulmaz.
// ---------------------------------------------------------------------------
function enrichMaterial(mat) {
  if (!mat) return;

  const name = (mat.name || "").toLowerCase();

  // Temel MeshStandardMaterial'e dönüştür
  const std = new THREE.MeshStandardMaterial();
  std.name = mat.name;

  // Kd rengini koru
  if (mat.color) std.color.copy(mat.color);
  if (mat.map) std.map = mat.map;

  // Addan fiziksel özellik tahmini
  if (name.includes("steel") || name.includes("çelik") || name.includes("demir") || name.includes("iron")) {
    std.metalness = 0.85;
    std.roughness = 0.25;
  } else if (name.includes("parlak") || name.includes("glossy") || name.includes("enamel") || name.includes("emaye")) {
    std.metalness = 0.0;
    std.roughness = 0.15;
  } else if (name.includes("plastik") || name.includes("plastic") || name.includes("mat")) {
    std.metalness = 0.0;
    std.roughness = 0.75;
  } else if (name.includes("akrilik") || name.includes("cam") || name.includes("şeffaf")) {
    std.metalness = 0.0;
    std.roughness = 0.05;
    std.transparent = true;
    std.opacity = 0.45;
    std.color.set(0xccddff);
  } else if (name.includes("hus")) {
    // Ahşap benzeri
    std.metalness = 0.0;
    std.roughness = 0.9;
  } else if (name.includes("prizma") || name.includes("opak")) {
    std.metalness = 0.0;
    std.roughness = 0.55;
  } else {
    // Genel opak plastik varsayılanı
    std.metalness = 0.0;
    std.roughness = 0.6;
  }

  return std;
}

// ---------------------------------------------------------------------------
// Ana component
// ---------------------------------------------------------------------------
export default function BerryBot3D({
  objUrl,
  mtlUrl,
  height = 520,
  autoRotate = true,
  background = "transparent",
  className = "",
  style = {},
  interactive = false,
  onLoad = null,
  onError = null,
}) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    if (!objUrl || !mtlUrl) return;

    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;

    // ── Sahne ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 1000);

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
    renderer.outputEncoding = THREE.sRGBEncoding; // Fusion 360 renkleri doğru göster
    container.appendChild(renderer.domElement);

    // ── Işıklandırma ────────────────────────────────────────────────────────
    // Hafif ambient — Fusion 360 Kd renklerini soldurmasın
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 8;   sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xfff0d8, 0.3);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xb0c8ff, 0.2);
    rim.position.set(2, 3, -6);
    scene.add(rim);

    // Zemin gölgesi
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── OBJ + MTL Yükleme ──────────────────────────────────────────────────
    // MTL'yi base path'ten yükle (OBJ içindeki "mtllib" satırı ignore edilir)
    const mtlBasePath = mtlUrl.substring(0, mtlUrl.lastIndexOf("/") + 1);
    const mtlFile = mtlUrl.substring(mtlUrl.lastIndexOf("/") + 1);

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(mtlBasePath);

    let animId;
    let robotGroup;

    mtlLoader.load(
      mtlFile,
      (materials) => {
        materials.preload();

        // Materyalleri MeshStandardMaterial'e yükselt (rengi koru)
        Object.keys(materials.materials).forEach((key) => {
          const enriched = enrichMaterial(materials.materials[key]);
          if (enriched) materials.materials[key] = enriched;
        });

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load(
          objUrl,
          (obj) => {
            // ── Model boyutlandırma ─────────────────────────────────────
            const box = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            // Hedef: ~3 birim yükseklik
            const targetSize = 3.0;
            const scaleFactor = targetSize / maxDim;
            obj.scale.setScalar(scaleFactor);

            // Tabanı zemine otur
            const boxScaled = new THREE.Box3().setFromObject(obj);
            obj.position.y = -boxScaled.min.y;

            // Merkeze al
            const centerX = (boxScaled.min.x + boxScaled.max.x) / 2;
            const centerZ = (boxScaled.min.z + boxScaled.max.z) / 2;
            obj.position.x = -centerX * scaleFactor;
            obj.position.z = -centerZ * scaleFactor;

            // Gölge ayarları
            obj.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            robotGroup = obj;
            scene.add(obj);
            setStatus("ready");
            onLoad?.();

            // ── Animasyon döngüsü ─────────────────────────────────────
            const loop = () => {
              if (spinning) {
                camTheta += 0.004;
                updateCam();
              }
              renderer.render(scene, camera);
              animId = requestAnimationFrame(loop);
            };
            loop();
          },
          (xhr) => {
            // yükleme ilerlemesi — isteğe bağlı kullanabilirsiniz
          },
          (err) => {
            console.error("OBJ yükleme hatası:", err);
            setStatus("error");
            onError?.(err);
          }
        );
      },
      undefined,
      (err) => {
        console.error("MTL yükleme hatası:", err);
        // MTL olmadan devam et
        const objLoader = new OBJLoader();
        objLoader.load(
          objUrl,
          (obj) => {
            const box = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            obj.scale.setScalar(3.0 / maxDim);
            const boxScaled = new THREE.Box3().setFromObject(obj);
            obj.position.y = -boxScaled.min.y;
            obj.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
            robotGroup = obj;
            scene.add(obj);
            setStatus("ready");
            onLoad?.();
            const loop = () => {
              if (spinning) { camTheta += 0.004; updateCam(); }
              renderer.render(scene, camera);
              animId = requestAnimationFrame(loop);
            };
            loop();
          },
          undefined,
          (e2) => { setStatus("error"); onError?.(e2); }
        );
      }
    );

    // ── Etkileşim event'leri ───────────────────────────────────────────────
    let dragging = false, lastX = 0, lastY = 0;

    const onMouseDown = (e) => {
      if (!interactive) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.style.cursor = "grabbing";
      spinning = false;
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
      lastX = e.clientX;
      lastY = e.clientY;
      updateCam();
    };
    const onWheel = (e) => {
      e.preventDefault();
      camR = Math.max(3, Math.min(25, camR + e.deltaY * 0.012));
      updateCam();
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        spinning = false;
      }
    };
    const onTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      e.preventDefault();
      camTheta -= (e.touches[0].clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.touches[0].clientY - lastY) * 0.006));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
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

    // ── Cleanup ────────────────────────────────────────────────────────────
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
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [objUrl, mtlUrl, height, autoRotate, interactive]);

  return (
    <div
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
      className={className}
    >
      {/* Yükleme göstergesi */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "#888",
            fontFamily: "system-ui, sans-serif",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15" stroke="#ddd" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15"
              stroke="#888" strokeWidth="3"
              strokeDasharray="30 70"
              strokeLinecap="round"
              style={{ transformOrigin: "center", animation: "berrybot-spin 1s linear infinite" }}
            />
          </svg>
          <span>BerryBot yükleniyor…</span>
          <style>{`@keyframes berrybot-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Hata göstergesi */}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c00",
            fontFamily: "system-ui, sans-serif",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          Model yüklenemedi. OBJ / MTL URL&apos;lerini kontrol edin.
        </div>
      )}

      {/* Three.js canvas buraya mount edilir */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}