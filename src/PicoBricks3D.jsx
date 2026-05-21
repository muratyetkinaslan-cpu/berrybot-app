// PicoBricks3D.jsx — Gerçek PicoBricks 3D modelini (GLB) gösteren bileşen
//
// Model dosyası:  public/picobricks.glb   (~19 MB)
// Aynı prop arayüzü BerryBot3D / önceki PicoBricks3D ile uyumlu —
// App.jsx'te HİÇBİR değişiklik gerekmez.
//
// three@0.160 ile GLTFLoader, three'nin kendi examples klasöründen gelir.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// PicoBricks marka renkleri (yükleme ekranı / hata için)
const PB_ORANGE = "#FF6B1A";
const PB_DARK = "#1D1D2E";

export default function PicoBricks3D({
  height = 520,
  autoRotate = true,
  background = "transparent",
  className = "",
  style = {},
  interactive = true,
  modelUrl = "/picobricks.glb",
}) {
  const mountRef = useRef(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ilerleme, setIlerleme] = useState(0);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    let H = container.clientHeight || height || 520;

    // ─── Sahne ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    if (background && background !== "transparent") {
      scene.background = new THREE.Color(background);
    }

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 1000);

    // küresel koordinatlarla yörünge kamerası
    let camR = 9;            // mesafe — model yüklenince otomatik ayarlanır
    let camTheta = 0.6;      // yatay açı
    let camPhi = 0.5;        // dikey açı
    const hedef = new THREE.Vector3(0, 0, 0);

    function updateCam() {
      camPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, camPhi));
      camera.position.set(
        hedef.x + camR * Math.cos(camPhi) * Math.sin(camTheta),
        hedef.y + camR * Math.sin(camPhi),
        hedef.z + camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(hedef);
    }
    updateCam();

    // ─── Renderer ───────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: background === "transparent",
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // three r152+ renk yönetimi
    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ("outputEncoding" in renderer) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = interactive ? "grab" : "default";

    // ─── Işıklandırma ───────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff0e6, 0.6);
    fillLight.position.set(-7, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd9b3, 0.5);
    rimLight.position.set(0, 3, -9);
    scene.add(rimLight);

    // turuncu marka aksanı — alttan hafif ışıma
    const accentLight = new THREE.PointLight(0xff6b1a, 0.4, 30);
    accentLight.position.set(0, -3, 4);
    scene.add(accentLight);

    // ─── Zemin (yumuşak gölge yakalayıcı) ───────────────────────
    const zeminMat = new THREE.ShadowMaterial({ opacity: 0.22 });
    const zemin = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), zeminMat);
    zemin.rotation.x = -Math.PI / 2;
    zemin.receiveShadow = true;
    let zeminEklendi = false;

    // ─── Model konteyneri ───────────────────────────────────────
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let aktif = true;

    // ─── GLB yükle ──────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (!aktif) return;
        const model = gltf.scene;

        // gölge ayarları
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.needsUpdate = true;
              // çok parlak metalik yüzeyleri biraz yumuşat
              if (child.material.metalness !== undefined && child.material.metalness > 0.9) {
                child.material.metalness = 0.85;
              }
            }
          }
        });

        // ── modeli ortala ve ölçekle ──
        const box = new THREE.Box3().setFromObject(model);
        const boyut = box.getSize(new THREE.Vector3());
        const merkez = box.getCenter(new THREE.Vector3());

        // merkeze taşı, tabanını y=0'a oturt
        model.position.x -= merkez.x;
        model.position.z -= merkez.z;
        model.position.y -= box.min.y;

        // sabit görsel boyuta normalize et (en büyük kenar ~5 birim)
        const enBuyukKenar = Math.max(boyut.x, boyut.y, boyut.z);
        const olcek = enBuyukKenar > 0 ? 5 / enBuyukKenar : 1;
        model.scale.setScalar(olcek);

        modelGroup.add(model);

        // ölçeklenmiş yeni kutu — kamera ve zemin için
        const box2 = new THREE.Box3().setFromObject(modelGroup);
        const boyut2 = box2.getSize(new THREE.Vector3());
        const merkez2 = box2.getCenter(new THREE.Vector3());

        // kamera hedefini modelin ortasına al
        hedef.set(0, merkez2.y, 0);
        // kamera mesafesini modeli tam kadrajlayacak şekilde ayarla
        const r = Math.max(boyut2.x, boyut2.y, boyut2.z);
        camR = r * 1.9;
        updateCam();

        // zemini modelin tabanına koy
        zemin.position.y = box2.min.y + 0.001;
        if (!zeminEklendi) {
          scene.add(zemin);
          zeminEklendi = true;
        }

        setYukleniyor(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setIlerleme(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error("PicoBricks GLB yüklenemedi:", err);
        setHata("3D model yüklenemedi. picobricks.glb dosyasının public/ klasöründe olduğundan emin ol.");
        setYukleniyor(false);
      }
    );

    // ─── Fare / dokunma etkileşimi ──────────────────────────────
    let suruklemede = false;
    let sonX = 0;
    let sonY = 0;
    let kullaniciDokundu = false;

    function pointerDown(e) {
      if (!interactive) return;
      suruklemede = true;
      kullaniciDokundu = true;
      const p = e.touches ? e.touches[0] : e;
      sonX = p.clientX;
      sonY = p.clientY;
      renderer.domElement.style.cursor = "grabbing";
    }
    function pointerMove(e) {
      if (!interactive || !suruklemede) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - sonX;
      const dy = p.clientY - sonY;
      sonX = p.clientX;
      sonY = p.clientY;
      camTheta -= dx * 0.01;
      camPhi += dy * 0.01;
      updateCam();
    }
    function pointerUp() {
      suruklemede = false;
      renderer.domElement.style.cursor = interactive ? "grab" : "default";
    }
    function wheel(e) {
      if (!interactive) return;
      e.preventDefault();
      camR *= 1 + e.deltaY * 0.0012;
      camR = Math.max(2.5, Math.min(40, camR));
      updateCam();
    }

    if (interactive) {
      renderer.domElement.addEventListener("mousedown", pointerDown);
      window.addEventListener("mousemove", pointerMove);
      window.addEventListener("mouseup", pointerUp);
      renderer.domElement.addEventListener("touchstart", pointerDown, { passive: true });
      window.addEventListener("touchmove", pointerMove, { passive: true });
      window.addEventListener("touchend", pointerUp);
      renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    }

    // ─── Animasyon döngüsü ──────────────────────────────────────
    const saat = new THREE.Clock();
    let raf = 0;

    function animate() {
      if (!aktif) return;
      raf = requestAnimationFrame(animate);
      const dt = saat.getDelta();

      // otomatik döndür — kullanıcı dokunmadıysa
      if (autoRotate && !suruklemede && !(interactive && kullaniciDokundu)) {
        modelGroup.rotation.y += dt * 0.5;
      }

      renderer.render(scene, camera);
    }
    animate();

    // ─── Yeniden boyutlandırma ──────────────────────────────────
    function onResize() {
      if (!container) return;
      W = container.clientWidth || W;
      H = container.clientHeight || height || H;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener("resize", onResize);

    // ─── Temizlik ───────────────────────────────────────────────
    return () => {
      aktif = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (interactive) {
        renderer.domElement.removeEventListener("mousedown", pointerDown);
        window.removeEventListener("mousemove", pointerMove);
        window.removeEventListener("mouseup", pointerUp);
        renderer.domElement.removeEventListener("touchstart", pointerDown);
        window.removeEventListener("touchmove", pointerMove);
        window.removeEventListener("touchend", pointerUp);
        renderer.domElement.removeEventListener("wheel", wheel);
      }
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) {
            m.forEach((mm) => {
              Object.values(mm).forEach((v) => v?.isTexture && v.dispose());
              mm.dispose();
            });
          } else if (m) {
            Object.values(m).forEach((v) => v?.isTexture && v.dispose());
            m.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [height, autoRotate, background, interactive, modelUrl]);

  // ─── JSX ──────────────────────────────────────────────────────
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height,
        ...style,
      }}
    >
      {/* 3D sahne */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Yükleme ekranı */}
      {yukleniyor && !hata && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            pointerEvents: "none",
          }}
        >
          {/* dönen tuğla halkası */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `4px solid ${PB_ORANGE}33`,
              borderTopColor: PB_ORANGE,
              animation: "pb3d-spin 0.9s linear infinite",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: PB_DARK,
                letterSpacing: 0.5,
              }}
            >
              PicoBricks 3D yükleniyor
            </div>
            <div
              style={{
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                fontSize: 12,
                color: PB_ORANGE,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              %{ilerleme}
            </div>
          </div>
          <style>{`@keyframes pb3d-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Hata ekranı */}
      {hata && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 24,
            textAlign: "center",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 30 }}>⚙️</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: PB_DARK }}>{hata}</div>
        </div>
      )}
    </div>
  );
}
