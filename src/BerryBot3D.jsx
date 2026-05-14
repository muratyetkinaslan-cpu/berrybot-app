// BerryBot3D.jsx — Robotistan BerryBot 3D component
// Loads the real geometry from the BerryBot Fusion 360 STEP export (berrybot.glb)
// and animates the wheels.
//
// USAGE
//   1) Place berrybot.glb in your public/ folder (or wherever you serve static assets).
//   2) <BerryBot3D modelUrl="/berrybot.glb" autoRotate interactive />
//
// The GLB was exported with gltfpack -cc -tc, so it uses MESHOPT_compression.
// We register the MeshoptDecoder from three's examples. If you re-export without
// meshopt compression, GLTFLoader still handles the file just fine.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export default function BerryBot3D({
  modelUrl = "/berrybot.glb",
  height = 520,
  autoRotate = true,
  background = "transparent",
  className = "",
  style = {},
  interactive = false,
  spinWheels = true,
  wheelRpm = 35,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || 680;
    const H = height;
    let disposed = false;

    // ── Scene & camera ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);

    let camR = 9.5, camTheta = 0.85, camPhi = 0.42;
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ── Lighting ──────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;   sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xfff0d8, 0.4);
    fill.position.set(-5, 4, -4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xb0c8ff, 0.3);
    rim.position.set(2, 3, -6); scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.95;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Materials per category ────────────────────────────────────────────
    const matTire  = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
    const matHub   = new THREE.MeshStandardMaterial({ color: 0xddc09a, roughness: 0.7 });
    const matWood  = new THREE.MeshStandardMaterial({ color: 0xddc09a, roughness: 0.85 });
    const matPcb   = new THREE.MeshStandardMaterial({ color: 0x7d40b8, roughness: 0.55, metalness: 0.05 });
    const matElec  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.35, metalness: 0.7 });

    // GLB meshes are in this order:
    //   0=tire_L  1=tire_R  2=hub_L  3=hub_R
    //   4=chassis_wood  5=pcb_substrate  6=electronics  7=metal
    const categoryMaterials = [
      matTire, matTire, matHub, matHub,
      matWood, matPcb, matElec, matMetal,
    ];

    // ── Robot group ───────────────────────────────────────────────────────
    const robot = new THREE.Group();
    scene.add(robot);

    // ── Load the GLB ──────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    let leftWheel = null, rightWheel = null;

    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;

        let i = 0;
        const tireMeshes = { L: null, R: null };
        const hubMeshes  = { L: null, R: null };
        model.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.material = categoryMaterials[i] || matMetal;
          if (i === 0) tireMeshes.L = obj;
          else if (i === 1) tireMeshes.R = obj;
          else if (i === 2) hubMeshes.L = obj;
          else if (i === 3) hubMeshes.R = obj;
          i++;
        });

        // Re-parent the wheels into pivot groups at their bbox centers so
        // they can rotate around their own axles.
        function makeWheelGroup(tire, hub) {
          if (!tire) return null;
          const box = new THREE.Box3().setFromObject(tire);
          const center = box.getCenter(new THREE.Vector3());
          const pivot = new THREE.Group();
          pivot.position.copy(center);
          robot.add(pivot);
          // attach() preserves world transform during reparenting
          pivot.attach(tire);
          if (hub) pivot.attach(hub);
          return pivot;
        }
        leftWheel  = makeWheelGroup(tireMeshes.L, hubMeshes.L);
        rightWheel = makeWheelGroup(tireMeshes.R, hubMeshes.R);

        // Add the rest of the model
        robot.add(model);

        // Drop the rig so it rests on y=-0.95 (ground level)
        const fullBox = new THREE.Box3().setFromObject(robot);
        robot.position.y -= fullBox.min.y + 0.95;
      },
      undefined,
      (err) => console.error("BerryBot3D: failed to load model", modelUrl, err)
    );

    // ── Interaction ───────────────────────────────────────────────────────
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => {
      if (!interactive) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      container.style.cursor = "grabbing"; spinning = false;
    };
    const onMouseUp = () => {
      if (!interactive) return;
      dragging = false; container.style.cursor = "grab";
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
      camR = Math.max(4.5, Math.min(18, camR + e.deltaY * 0.01));
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

    // ── Animation loop ────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId;
    const loop = () => {
      const dt = clock.getDelta();
      if (spinning) { camTheta += 0.004; updateCam(); }
      if (spinWheels && spinning) {
        const omega = (wheelRpm / 60) * Math.PI * 2;
        if (leftWheel)  leftWheel.rotation.z  += omega * dt;
        if (rightWheel) rightWheel.rotation.z += omega * dt;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

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
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [modelUrl, height, autoRotate, interactive, spinWheels, wheelRpm]);

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
        background,
        ...style,
      }}
    />
  );
}