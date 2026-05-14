// BerryBot3D.jsx — Robotistan orijinal STEP modelinden üretilmiş GLB'yi yükleyen 3D robot componenti
//
// Kullanım:
//   1) berrybot.glb dosyasını projende `public/` klasörüne (veya istediğin yere) koy.
//   2) <BerryBot3D /> olarak kullan. Varsayılan olarak "/berrybot.glb" yolunu okur.
//   3) Farklı bir yol kullanacaksan: <BerryBot3D modelUrl="/static/berrybot.glb" />
//
// Bağımlılıklar:  npm i three
//
// Props önceki BerryBot3D ile birebir uyumlu — drop-in replacement gibi davranır.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function BerryBot3D({
  height = 520,
  autoRotate = true,
  background = "transparent",
  className = "",
  style = {},
  interactive = false,
  modelUrl = "/berrybot.glb",
  // İsteğe bağlı görsel ince ayarlar
  initialCameraDistance = 7.5,
  initialAzimuth = 0.85,   // theta — yatay açı (radyan)
  initialElevation = 0.45, // phi   — dikey açı (radyan)
  spinSpeed = 0.004,
  exposure = 1.05,
}) {
  const mountRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;

    // ---- Sahne, kamera, renderer ----
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

    let camR = initialCameraDistance;
    let camTheta = initialAzimuth;
    let camPhi = initialElevation;
    let spinning = autoRotate;

    // Look target — modeli yükledikten sonra gerçek centroid ile güncellenecek
    const lookTarget = new THREE.Vector3(0.5, 0.65, 0.25);

    function updateCam() {
      camera.position.set(
        lookTarget.x + camR * Math.cos(camPhi) * Math.sin(camTheta),
        lookTarget.y + camR * Math.sin(camPhi) + 0.4,
        lookTarget.z + camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(lookTarget);
    }
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    container.appendChild(renderer.domElement);

    // ---- Işıklar (önceki component ile aynı stil) ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xfff0d8, 0.4);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xb0c8ff, 0.3);
    rim.position.set(2, 3, -6);
    scene.add(rim);

    // Zemin (gölge yakalayıcı)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- Robot grubu ----
    const robot = new THREE.Group();
    scene.add(robot);

    // ---- GLB yükleyici ----
    const loader = new GLTFLoader();
    let disposed = false;

    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;

        // Tüm mesh'lere gölge ata ve materyal tutarlılığını sağla
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            if (obj.material) {
              // Per-vertex normal yoksa düz görünmesin diye düzelt
              if (!obj.geometry.attributes.normal) {
                obj.geometry.computeVertexNormals();
              }
            }
          }
        });

        // Modelin merkezini bul ve kamera hedefini ona göre güncelle
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Modeli, gövdesi orijinde olacak şekilde yatay merkezle
        // (zemin Y=0'da kalsın diye dikey kaymayı uygulamıyoruz — GLB zaten yere oturmuş)
        model.position.x -= center.x;
        model.position.z -= center.z;

        robot.add(model);

        // Kamera hedefini robotun gerçek merkezine taşı
        lookTarget.set(0, size.y * 0.45, 0);
        // Mesafeyi modele göre yumuşakça ölçekle
        camR = Math.max(5.5, size.length() * 1.7);
        updateCam();

        setLoaded(true);
      },
      (xhr) => {
        if (xhr.total) {
          setProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error("BerryBot3D — GLB yüklenemedi:", err);
        setError(err?.message || "Model yüklenemedi");
      }
    );

    // ---- Kullanıcı etkileşimi ----
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

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
      camR = Math.max(3.5, Math.min(20, camR + e.deltaY * 0.01));
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
    const onTouchEnd = () => {
      dragging = false;
    };
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

    // ---- Render döngüsü ----
    let animId;
    const loop = () => {
      if (spinning) {
        camTheta += spinSpeed;
        updateCam();
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

    // ---- Temizlik ----
    return () => {
      disposed = true;
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
  }, [
    height,
    autoRotate,
    interactive,
    modelUrl,
    initialCameraDistance,
    initialAzimuth,
    initialElevation,
    spinSpeed,
    exposure,
  ]);

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
    >
      {!loaded && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            font: "13px system-ui, sans-serif",
            pointerEvents: "none",
          }}
        >
          BerryBot yükleniyor… {progress > 0 ? `%${progress}` : ""}
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b00",
            font: "13px system-ui, sans-serif",
            padding: 16,
            textAlign: "center",
          }}
        >
          Model yüklenemedi: {error}
        </div>
      )}
    </div>
  );
}