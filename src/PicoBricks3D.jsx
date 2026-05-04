import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * PicoBricks3D — High-detail interactive 3D model of the PicoBricks educational kit.
 *
 * Components included (in board order):
 *   Center : Raspberry Pi Pico W (RP2040 + CYW43439 WiFi shield, USB, gold pin headers)
 *   Left   : OLED · RGB LED · LED+Button · DHT11 · Relay
 *   Right  : Motor Driver · Wireless+IR · Buzzer · LDR · Potentiometer
 *   Extra  : Servo motor (cabled to protoboard area)
 *
 * Visual features:
 *   - Photo-accurate PCB silkscreen rendered to a 2K canvas texture
 *   - Live OLED display with animated readouts (canvas texture)
 *   - LED bloom via additive sprite halos
 *   - Working servo arm, rotating pot knob, pulsing buzzer, RGB color cycle,
 *     OLED flicker, Pico activity LED, IR receiver indicator, power LED
 *   - PBR materials with proper metalness / roughness
 *   - Mouse + touch orbit, mouse-wheel zoom, auto-rotate toggle
 *
 * Dependency:  three  (^0.128 or newer)
 */
export default function PicoBricks3D() {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W0 = mount.clientWidth;
    const H0 = mount.clientHeight;

    // ============================================================
    //  SCENE / CAMERA / RENDERER
    // ============================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07070c);
    scene.fog = new THREE.Fog(0x07070c, 18, 38);

    const camera = new THREE.PerspectiveCamera(38, W0 / H0, 0.1, 100);
    camera.position.set(0, 6, 13);
    camera.lookAt(0, 0, 0);

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
    //  LIGHTING (three-point + rims)
    // ============================================================
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));

    const keyLight = new THREE.DirectionalLight(0xfff2dd, 1.05);
    keyLight.position.set(6, 14, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0008;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8aa8ff, 0.45);
    fillLight.position.set(-9, 5, 6);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xff8a66, 0.35);
    backLight.position.set(2, 4, -8);
    scene.add(backLight);

    const rimBlue = new THREE.PointLight(0x4488ff, 1.0, 16);
    rimBlue.position.set(-6, 1.5, -3);
    scene.add(rimBlue);
    const rimPink = new THREE.PointLight(0xff44aa, 0.8, 16);
    rimPink.position.set(6, 1.5, -3);
    scene.add(rimPink);

    // ============================================================
    //  TEXTURE FACTORY
    // ============================================================
    const makeCanvasTex = (w, h, draw) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      draw(ctx, w, h);
      const tex = new THREE.CanvasTexture(c);
      if ("encoding" in tex) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 8;
      return tex;
    };

    // ---------- PCB silkscreen (top face) ----------
    const SILK = "rgba(240,238,225,0.92)";
    const SILK_DIM = "rgba(220,215,190,0.55)";
    const pcbW = 9.6, pcbH = 6.6;
    const TEX_W = 2048, TEX_H = Math.round(TEX_W * (pcbH / pcbW));

    const pcbSilkTex = makeCanvasTex(TEX_W, TEX_H, (ctx, w, h) => {
      // base PCB color
      ctx.fillStyle = "#16161c";
      ctx.fillRect(0, 0, w, h);

      // subtle vertical column dividers — gold trace lines
      ctx.fillStyle = "rgba(184,144,40,0.6)";
      [w * 0.30, w * 0.70].forEach((x) => ctx.fillRect(x - 1, h * 0.06, 2, h * 0.88));

      // module cutout outlines
      ctx.strokeStyle = "rgba(180,180,160,0.35)";
      ctx.lineWidth = 2;
      const drawSlot = (x, y, sw, sh) => ctx.strokeRect(x - sw/2, y - sh/2, sw, sh);
      const rowY = [h*0.115, h*0.295, h*0.475, h*0.655, h*0.835];
      const sw = w*0.20, sh = h*0.135;
      rowY.forEach((y) => {
        drawSlot(w*0.155, y, sw, sh);
        drawSlot(w*0.845, y, sw, sh);
      });

      // Pico cutout
      ctx.strokeRect(w*0.5 - w*0.06, h*0.05, w*0.12, h*0.42);
      // Protoboard cutout
      ctx.strokeRect(w*0.5 - w*0.16, h*0.55, w*0.32, h*0.36);

      // Vertical edge labels (yellow)
      ctx.fillStyle = "rgba(245,210,50,0.95)";
      ctx.font = "bold 22px monospace";
      const vLabel = (txt, x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      };
      vLabel("OLED", w*0.045, h*0.16);
      vLabel("RGB LED", w*0.045, h*0.36);
      vLabel("LED+BUTTON", w*0.045, h*0.56);
      vLabel("TEMP & HUM.", w*0.045, h*0.74);
      vLabel("RELAY", w*0.045, h*0.92);
      vLabel("MOTOR DRIVER", w*0.96, h*0.18);
      vLabel("WIRELESS / IR", w*0.96, h*0.38);
      vLabel("BUZZER", w*0.96, h*0.55);
      vLabel("LDR", w*0.96, h*0.71);
      vLabel("POTENTIOMETER", w*0.96, h*0.92);

      // GP pin labels
      ctx.fillStyle = SILK;
      ctx.font = "bold 16px monospace";
      const gpLeft = ["I2C: 0x3C", "GP6", "GP7 / GP10", "GP11", "GP12"];
      const gpRight = ["GP21 GP22", "TX:GP0  RX:GP1", "GP20", "GP27", "GP26"];
      gpLeft.forEach((t, i) => ctx.fillText(t, w*0.275, h*0.115 + i*h*0.18));
      gpRight.forEach((t, i) => {
        ctx.textAlign = "right";
        ctx.fillText(t, w*0.725, h*0.115 + i*h*0.18);
      });
      ctx.textAlign = "left";

      // Pico labels
      ctx.font = "bold 14px monospace";
      ctx.fillStyle = SILK_DIM;
      ctx.fillText("SDA GP4", w*0.43, h*0.16);
      ctx.fillText("SCL GP5", w*0.43, h*0.20);
      ctx.fillText("RX-GP1", w*0.43, h*0.30);
      ctx.fillText("TX-GP0", w*0.43, h*0.34);

      // RELAY BOARD label
      ctx.fillStyle = SILK;
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RELAY BOARD GP12", w*0.5, h*0.50);
      ctx.fillText("LDR GP27", w*0.5, h*0.535);

      // PROTOBOARD label
      ctx.fillStyle = SILK;
      ctx.font = "bold 28px monospace";
      ctx.fillText("PROTOBOARD", w*0.5, h*0.62);

      // Hello World text bottom
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = SILK;
      ctx.fillText("Hello World", w*0.55, h*0.965);

      // Tiny robot icon
      const rx = w*0.42, ry = h*0.94;
      ctx.fillStyle = SILK;
      ctx.fillRect(rx, ry, 28, 22);
      ctx.fillRect(rx-3, ry+22, 34, 18);
      ctx.fillRect(rx-7, ry+30, 4, 10);
      ctx.fillRect(rx+34, ry+30, 4, 10);
      ctx.fillStyle = "#16161c";
      ctx.fillRect(rx+5, ry+6, 5, 5);
      ctx.fillRect(rx+18, ry+6, 5, 5);
      ctx.fillStyle = SILK;
      ctx.fillRect(rx+6, ry-6, 2, 8);
      ctx.fillRect(rx+22, ry-6, 2, 8);
      ctx.beginPath(); ctx.arc(rx+7, ry-7, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx+23, ry-7, 3, 0, Math.PI*2); ctx.fill();

      // logo top-left
      ctx.textAlign = "left";
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = SILK_DIM;
      ctx.fillText("◢ picobricks", w*0.04, h*0.05);
    });

    // ---------- OLED screen (animated) ----------
    const oledCanvas = document.createElement("canvas");
    oledCanvas.width = 256; oledCanvas.height = 128;
    const oledCtx = oledCanvas.getContext("2d");
    const oledTex = new THREE.CanvasTexture(oledCanvas);
    if ("encoding" in oledTex) oledTex.encoding = THREE.sRGBEncoding;

    const drawOLED = (t) => {
      const c = oledCtx;
      c.fillStyle = "#001428";
      c.fillRect(0, 0, 256, 128);

      c.strokeStyle = "#00d2ff";
      c.lineWidth = 2;
      c.strokeRect(2, 2, 252, 124);

      c.fillStyle = "#67f0ff";
      c.font = "bold 22px monospace";
      c.fillText("PicoBricks", 18, 32);

      c.fillStyle = "#a8f0ff";
      c.font = "bold 16px monospace";
      const temp = (24 + Math.sin(t * 0.7) * 0.6).toFixed(1);
      const hum  = (55 + Math.sin(t * 0.5) * 2).toFixed(0);
      c.fillText("Temp: " + temp + "C", 18, 60);
      c.fillText("Hum : " + hum + "%", 18, 82);

      const barW = 90 + (Math.sin(t * 1.5) + 1) * 60;
      c.fillStyle = "#00aaff";
      c.fillRect(18, 96, barW, 8);
      c.strokeStyle = "#67f0ff";
      c.strokeRect(18, 96, 220, 8);

      if (Math.floor(t * 2) % 2 === 0) {
        c.fillStyle = "#ffffff";
        c.fillRect(228, 22, 10, 14);
      }

      oledTex.needsUpdate = true;
    };
    drawOLED(0);

    // ---------- Glow sprite texture ----------
    const glowTex = makeCanvasTex(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    // ---------- DHT grid texture ----------
    const dhtTex = makeCanvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#4ea4d4";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#235a82";
      const step = 22;
      for (let y = step; y < h; y += step)
        for (let x = step; x < w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
    });

    // ---------- Protoboard hole texture ----------
    const protoTex = makeCanvasTex(1024, 768, (ctx, w, h) => {
      ctx.fillStyle = "#f2efe6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a1a";
      const cols = 22, rows = 16;
      const padX = 60, padY = 60;
      const sx = (w - padX*2) / (cols - 1);
      const sy = (h - padY*2) / (rows - 1);
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          ctx.beginPath();
          ctx.arc(padX + i*sx, padY + j*sy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.fillStyle = "rgba(180,140,60,0.18)";
      for (let j = 0; j < rows; j++) {
        const y = padY + j * sy;
        ctx.fillRect(padX - 14, y - 1, w - padX*2 + 28, 2);
      }
    });

    // ---------- Pico W top texture ----------
    const picoTex = makeCanvasTex(512, 1100, (ctx, w, h) => {
      ctx.fillStyle = "#0d4a37";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(240,240,235,0.9)";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Raspberry Pi Pico W", w/2, h*0.66);
      ctx.font = "bold 14px monospace";
      ctx.fillText("©2022", w/2, h*0.69);

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(240,240,235,0.7)";
      const leftLabels = ["GP0","GP1","GND","GP2","GP3","GP4","GP5","GND","GP6","GP7","GP8","GP9","GND","GP10","GP11","GP12","GP13","GND","GP14","GP15"];
      const rightLabels = ["VBUS","VSYS","GND","3V3_EN","3V3","ADC_VR","AGND","GP28","GP27","GP26","RUN","GP22","GND","GP21","GP20","GP19","GP18","GND","GP17","GP16"];
      leftLabels.forEach((t, i) => {
        const y = 38 + i * (h - 80) / leftLabels.length;
        ctx.textAlign = "left";
        ctx.fillText(t, 14, y);
        ctx.textAlign = "right";
        ctx.fillText(rightLabels[i], w - 14, y);
      });

      ctx.fillStyle = "rgba(240,240,235,0.5)";
      ctx.textAlign = "center";
      ctx.font = "bold 10px monospace";
      ctx.fillText("BOOTSEL", w/2, h*0.16);
    });

    // ============================================================
    //  SHARED MATERIALS
    // ============================================================
    const matPCBTop = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: pcbSilkTex, roughness: 0.6, metalness: 0.25,
    });
    const matPCBSide = new THREE.MeshStandardMaterial({
      color: 0x14141a, roughness: 0.7, metalness: 0.2,
    });
    const matPicoTop = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: picoTex, roughness: 0.55, metalness: 0.3,
    });
    const matPicoSide = new THREE.MeshStandardMaterial({
      color: 0x0c4029, roughness: 0.55, metalness: 0.3,
    });
    const matModuleWhite = new THREE.MeshStandardMaterial({
      color: 0xeeeae0, roughness: 0.78,
    });
    const matJST = new THREE.MeshStandardMaterial({
      color: 0xefefe6, roughness: 0.55,
    });
    const matGold = new THREE.MeshStandardMaterial({
      color: 0xd9a93a, roughness: 0.28, metalness: 0.95,
    });
    const matSilver = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0, roughness: 0.32, metalness: 0.85,
    });
    const matChip = new THREE.MeshStandardMaterial({
      color: 0x111114, roughness: 0.5,
    });
    const matGreenTerm = new THREE.MeshStandardMaterial({
      color: 0x2e9c45, roughness: 0.45,
    });

    // ============================================================
    //  GLOW HELPER
    // ============================================================
    const glowSprite = (hex, size = 1, opacity = 0.85) => {
      const m = new THREE.SpriteMaterial({
        map: glowTex,
        color: hex,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const s = new THREE.Sprite(m);
      s.scale.set(size, size, 1);
      return s;
    };

    // ============================================================
    //  ROOT BOARD GROUP
    // ============================================================
    const board = new THREE.Group();
    board.rotation.x = -0.55;  // Tilt forward more — see all sensors/buttons from above
    board.rotation.y = 0;       // Face camera directly (no Y rotation)
    scene.add(board);

    // ============================================================
    //  PCB BASE (rounded rect with silk on top, dark on sides)
    // ============================================================
    {
      const r = 0.20;
      const w2 = pcbW / 2, h2 = pcbH / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-w2 + r, -h2);
      shape.lineTo( w2 - r, -h2);
      shape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
      shape.lineTo(w2, h2 - r);
      shape.quadraticCurveTo(w2, h2, w2 - r, h2);
      shape.lineTo(-w2 + r, h2);
      shape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
      shape.lineTo(-w2, -h2 + r);
      shape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.18,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.015,
        bevelSegments: 2,
      });
      // Group 0 = front face (top after rotation), Group 1 = sides
      const pcb = new THREE.Mesh(geo, [matPCBTop, matPCBSide]);
      pcb.rotation.x = -Math.PI / 2;
      pcb.position.y = -0.18;
      pcb.castShadow = true; pcb.receiveShadow = true;
      board.add(pcb);

      // Re-project UVs for the silk texture
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        const u = (uv.getX(i) + w2) / pcbW;
        const v = 1 - (uv.getY(i) + h2) / pcbH;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }

    // Mounting hole rings
    [
      [-pcbW/2 + 0.4,  pcbH/2 - 0.4],
      [ pcbW/2 - 0.4,  pcbH/2 - 0.4],
      [-pcbW/2 + 0.4, -pcbH/2 + 0.4],
      [ pcbW/2 - 0.4, -pcbH/2 + 0.4],
    ].forEach(([x, z]) => {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.21, 28),
        new THREE.MeshStandardMaterial({ color: 0x707070, metalness: 0.85, roughness: 0.3 })
      );
      ring.position.set(x, 0.015, -z);
      ring.castShadow = true;
      board.add(ring);
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.32, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      hole.position.set(x, 0.025, -z);
      board.add(hole);
    });

    const anim = {};

    // ============================================================
    //  RASPBERRY PI PICO W
    // ============================================================
    const buildPicoW = () => {
      const g = new THREE.Group();

      const picoBoxGeo = new THREE.BoxGeometry(0.95, 0.085, 2.20);
      const picoBoxMats = [
        matPicoSide, matPicoSide,
        matPicoTop, matPicoSide,
        matPicoSide, matPicoSide,
      ];
      const picoBoard = new THREE.Mesh(picoBoxGeo, picoBoxMats);
      picoBoard.position.y = 0.0425;
      picoBoard.castShadow = true; picoBoard.receiveShadow = true;
      g.add(picoBoard);

      // RP2040
      const rp = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.05, 0.42),
        new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.45, metalness: 0.15 })
      );
      rp.position.set(0.05, 0.111, -0.05);
      rp.castShadow = true;
      g.add(rp);
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.018, 16),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(-0.13, 0.137, -0.22);
      g.add(dot);

      // CYW43439 WiFi shield
      const wifi = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.06, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.3 })
      );
      wifi.position.set(0, 0.116, 0.55);
      wifi.castShadow = true;
      g.add(wifi);
      const ant = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.005, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xd9a93a, metalness: 0.9, roughness: 0.3 })
      );
      ant.position.set(0, 0.118, 0.94);
      g.add(ant);

      // USB
      const usb = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.18, 0.30),
        new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
      );
      usb.position.set(0, 0.135, -1.04);
      usb.castShadow = true;
      g.add(usb);
      const usbHole = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.10, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      usbHole.position.set(0, 0.135, -1.21);
      g.add(usbHole);

      // BOOTSEL
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.04, 0.10),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      boot.position.set(-0.20, 0.105, -0.55);
      g.add(boot);

      // Test points
      [[-0.32, 0.78], [0.32, 0.78], [-0.32, -0.78]].forEach(([x, z]) => {
        const tp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12),
          matSilver
        );
        tp.position.set(x, 0.097, z);
        g.add(tp);
      });

      // Pin headers (gold) — InstancedMesh
      const pinGeo = new THREE.BoxGeometry(0.055, 0.075, 0.055);
      const pinMesh = new THREE.InstancedMesh(pinGeo, matGold, 40);
      const m4 = new THREE.Matrix4();
      let k = 0;
      for (let i = 0; i < 20; i++) {
        const z = -0.95 + i * 0.10;
        m4.makeTranslation(-0.43, 0.117, z); pinMesh.setMatrixAt(k++, m4);
        m4.makeTranslation( 0.43, 0.117, z); pinMesh.setMatrixAt(k++, m4);
      }
      pinMesh.count = k;
      pinMesh.instanceMatrix.needsUpdate = true;
      pinMesh.castShadow = true;
      g.add(pinMesh);

      // Header strips (black plastic under the gold pins)
      const stripL = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.03, 1.95),
        matChip
      );
      stripL.position.set(-0.43, 0.10, 0);
      g.add(stripL);
      const stripR = stripL.clone();
      stripR.position.x = 0.43;
      g.add(stripR);

      // Activity LED
      const act = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.03, 0.05),
        new THREE.MeshStandardMaterial({
          color: 0x88ffaa, emissive: 0x33ff66, emissiveIntensity: 1.5,
        })
      );
      act.position.set(-0.18, 0.105, 0.85);
      g.add(act);
      const actGlow = glowSprite(0x33ff66, 0.55, 0.7);
      actGlow.position.set(-0.18, 0.13, 0.85);
      g.add(actGlow);
      anim.activityLed = act;
      anim.activityGlow = actGlow;

      // Bottom debug header
      for (let i = 0; i < 3; i++) {
        const dp = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.07, 0.05),
          matGold
        );
        dp.position.set(-0.10 + i * 0.10, 0.117, 1.06);
        g.add(dp);
      }

      g.position.set(0, 0.05, -1.30);
      return g;
    };
    board.add(buildPicoW());

    // ============================================================
    //  MODULE FACTORY
    // ============================================================
    function moduleBase(jstSide) {
      const g = new THREE.Group();
      const sx = jstSide === "right" ? 1 : -1;

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.07, 1.05),
        matModuleWhite
      );
      base.position.y = 0.035;
      base.castShadow = true; base.receiveShadow = true;
      g.add(base);

      const jst = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.20, 0.24),
        matJST
      );
      jst.position.set(0.55 * sx, 0.14, 0);
      jst.castShadow = true;
      g.add(jst);
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.13, 0.10),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 })
      );
      slot.position.set(0.55 * sx - sx * 0.12, 0.155, 0);
      g.add(slot);
      for (let i = 0; i < 4; i++) {
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.06, 0.02),
          matGold
        );
        pin.position.set(0.55 * sx - sx * 0.07, 0.16, -0.08 + i * 0.053);
        g.add(pin);
      }

      const screwBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.07, 18),
        new THREE.MeshStandardMaterial({ color: 0xb5b5b5, metalness: 0.7, roughness: 0.3 })
      );
      screwBody.position.set(-0.55 * sx, 0.07, 0);
      g.add(screwBody);
      const screwSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.005, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      screwSlot.position.set(-0.55 * sx, 0.108, 0);
      g.add(screwSlot);

      return g;
    }

    const leftX = -2.8, rightX = 2.8;
    const rowZ = [-2.40, -1.20, 0.0, 1.20, 2.40];

    // ============================================================
    //  LEFT COLUMN MODULES
    // ============================================================

    // 1. OLED
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[0]);
      board.add(m);

      const dispPcb = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.04, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x1c4a85, metalness: 0.5, roughness: 0.4 })
      );
      dispPcb.position.set(-0.10, 0.09, 0);
      m.add(dispPcb);

      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.045, 0.46),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.5 })
      );
      bezel.position.set(-0.10, 0.115, 0);
      m.add(bezel);

      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.40),
        new THREE.MeshStandardMaterial({
          map: oledTex, emissive: 0xffffff, emissiveMap: oledTex,
          emissiveIntensity: 0.95, roughness: 0.2, metalness: 0.0,
        })
      );
      glass.rotation.x = -Math.PI / 2;
      glass.position.set(-0.10, 0.139, 0);
      m.add(glass);
      anim.oledGlass = glass;

      for (let i = 0; i < 4; i++) {
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.10, 0.04),
          matGold
        );
        pin.position.set(-0.42 + i * 0.10, 0.125, -0.34);
        m.add(pin);
      }
      const pinHeader = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.06, 0.08),
        matChip
      );
      pinHeader.position.set(-0.27, 0.10, -0.34);
      m.add(pinHeader);

      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.12),
        matChip
      );
      chip.position.set(-0.10, 0.115, 0.24);
      m.add(chip);
    }

    // 2. RGB LED (WS2812)
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[1]);
      board.add(m);

      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.50, 0.10, 0.50),
        new THREE.MeshStandardMaterial({ color: 0xf5f5ed, roughness: 0.6 })
      );
      housing.position.set(-0.25, 0.12, 0);
      m.add(housing);
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.10, 0.30),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xff00ff, emissiveIntensity: 1.8,
          transparent: true, opacity: 0.92,
          roughness: 0.2,
        })
      );
      led.position.set(-0.25, 0.18, 0);
      m.add(led);
      const ledGlow = glowSprite(0xff00ff, 1.4, 0.85);
      ledGlow.position.set(-0.25, 0.21, 0);
      m.add(ledGlow);
      anim.rgbLed = led;
      anim.rgbGlow = ledGlow;

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.05, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.5 })
      );
      cap.position.set(0.10, 0.10, 0);
      m.add(cap);
    }

    // 3. LED + Button
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[2]);
      board.add(m);

      const ledBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.085, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x880000 })
      );
      ledBase.position.set(-0.45, 0.095, 0);
      m.add(ledBase);
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 22, 22, 0, Math.PI*2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({
          color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.5,
          transparent: true, opacity: 0.9, roughness: 0.15,
        })
      );
      led.position.set(-0.45, 0.12, 0);
      m.add(led);
      const ledGlow = glowSprite(0xff2200, 0.7, 0.9);
      ledGlow.position.set(-0.45, 0.15, 0);
      m.add(ledGlow);
      anim.redLed = led;
      anim.redGlow = ledGlow;

      const btnHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.18, 0.36),
        new THREE.MeshStandardMaterial({ color: 0xf5f5ed, roughness: 0.5 })
      );
      btnHousing.position.set(0.05, 0.16, 0);
      m.add(btnHousing);
      [[-0.16,-0.16],[0.16,-0.16],[-0.16,0.16],[0.16,0.16]].forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.06, 0.04),
          matSilver
        );
        leg.position.set(0.05 + dx, 0.10, dz);
        m.add(leg);
      });
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.10, 24),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55 })
      );
      cap.position.set(0.05, 0.30, 0);
      m.add(cap);
      const res = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      res.position.set(-0.45, 0.085, -0.30);
      m.add(res);
    }

    // 4. DHT11
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[3]);
      board.add(m);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.78),
        new THREE.MeshStandardMaterial({ map: dhtTex, color: 0xffffff, roughness: 0.7 })
      );
      body.position.set(0.0, 0.16, 0);
      m.add(body);

      for (let i = 0; i < 4; i++) {
        const lead = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.06, 0.02),
          matSilver
        );
        lead.position.set(-0.18 + i * 0.12, 0.10, -0.42);
        m.add(lead);
      }

      const res = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xeeddaa })
      );
      res.position.set(0.40, 0.08, 0);
      m.add(res);
    }

    // 5. Relay
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[4]);
      board.add(m);

      const relay = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.36, 0.62),
        new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.45 })
      );
      relay.position.set(0.15, 0.23, 0);
      m.add(relay);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.50, 0.20),
        new THREE.MeshStandardMaterial({ color: 0x232328 })
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(0.15, 0.412, 0);
      m.add(label);

      const term = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.26, 0.42),
        matGreenTerm
      );
      term.position.set(-0.45, 0.18, 0);
      m.add(term);
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14),
          matSilver
        );
        s.position.set(-0.45, 0.32, -0.13 + i * 0.13);
        m.add(s);
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.003, 0.018),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        slot.position.set(-0.45, 0.342, -0.13 + i * 0.13);
        m.add(slot);
      }
      const sLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 1.2,
        })
      );
      sLed.position.set(-0.10, 0.10, -0.40);
      m.add(sLed);
    }

    // ============================================================
    //  RIGHT COLUMN MODULES
    // ============================================================

    // 6. Motor Driver
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[0]);
      board.add(m);

      [-0.20, 0.20].forEach((zo) => {
        const chip = new THREE.Mesh(
          new THREE.BoxGeometry(0.30, 0.06, 0.30),
          matChip
        );
        chip.position.set(-0.10, 0.10, zo);
        m.add(chip);
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.012, 12),
          new THREE.MeshStandardMaterial({ color: 0xeeeeee })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(-0.21, 0.131, zo - 0.10);
        m.add(dot);
      });
      [-0.25, 0.25].forEach((zo) => {
        const t = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.24, 0.40),
          matGreenTerm
        );
        t.position.set(0.42, 0.17, zo);
        m.add(t);
        const sc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14),
          matSilver
        );
        sc.position.set(0.42, 0.30, zo);
        m.add(sc);
      });
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.10, 18),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      cap.position.set(0.10, 0.12, 0.40);
      m.add(cap);
    }

    // 7. Wireless + IR Sensor
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[1]);
      board.add(m);

      const shield = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.10, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.3 })
      );
      shield.position.set(0.05, 0.115, -0.18);
      m.add(shield);
      for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.005, 0.015),
          new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        line.position.set(0.05, 0.171, -0.34 + i * 0.10);
        m.add(line);
      }
      const antenna = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.005, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xd9a93a, metalness: 0.9, roughness: 0.3 })
      );
      antenna.position.set(0.45, 0.073, -0.18);
      m.add(antenna);

      // IR receiver
      const irBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.12),
        matSilver
      );
      irBase.position.set(-0.10, 0.10, 0.30);
      m.add(irBase);
      const irDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 22, 16, 0, Math.PI*2, 0, Math.PI*0.55),
        new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.45 })
      );
      irDome.position.set(-0.10, 0.13, 0.30);
      m.add(irDome);
      const irLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.8,
        })
      );
      irLed.position.set(0.20, 0.09, 0.30);
      m.add(irLed);
      anim.irLed = irLed;
    }

    // 8. Buzzer
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[2]);
      board.add(m);
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.30, 36),
        new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.75, roughness: 0.4 })
      );
      can.position.set(-0.05, 0.20, 0);
      m.add(can);
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.32, 18),
        matChip
      );
      hole.position.set(-0.05, 0.20, 0);
      m.add(hole);
      const plus = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      plus.rotation.x = -Math.PI / 2;
      plus.position.set(0.18, 0.351, 0);
      m.add(plus);
      const plus2 = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      plus2.rotation.x = -Math.PI / 2;
      plus2.position.set(0.18, 0.351, 0);
      m.add(plus2);
      anim.buzzer = can;
    }

    // 9. LDR
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[3]);
      board.add(m);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.21, 0.10, 28),
        new THREE.MeshStandardMaterial({ color: 0xff8a14, roughness: 0.55 })
      );
      body.position.set(-0.05, 0.13, 0);
      m.add(body);
      for (let i = 0; i < 5; i++) {
        const line = new THREE.Mesh(
          new THREE.TorusGeometry(0.04 + i * 0.025, 0.008, 6, 24),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        line.rotation.x = Math.PI / 2;
        line.position.set(-0.05, 0.185, 0);
        m.add(line);
      }
      [-0.10, 0.10].forEach((dx) => {
        const lead = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.05, 0.02),
          matSilver
        );
        lead.position.set(-0.05 + dx, 0.10, 0.22);
        m.add(lead);
      });
    }

    // 10. Potentiometer
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[4]);
      board.add(m);

      const baseBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.15, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x1c5dad, roughness: 0.5 })
      );
      baseBody.position.set(-0.05, 0.14, 0);
      m.add(baseBody);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.10, 18),
        matSilver
      );
      shaft.position.set(-0.05, 0.27, 0);
      m.add(shaft);

      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.22, 0.13, 32),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3e, metalness: 0.55, roughness: 0.4 })
      );
      knob.position.set(-0.05, 0.36, 0);
      m.add(knob);
      const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.025, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      notch.position.set(0, 0.075, -0.06);
      knob.add(notch);
      anim.potKnob = knob;
    }

    // ============================================================
    //  PROTOBOARD
    // ============================================================
    {
      const proto = new THREE.Mesh(
        new THREE.BoxGeometry(2.85, 0.08, 1.95),
        new THREE.MeshStandardMaterial({ map: protoTex, roughness: 0.7 })
      );
      proto.position.set(0, 0.04, 1.65);
      proto.receiveShadow = true; proto.castShadow = true;
      board.add(proto);
    }

    // ============================================================
    //  EXTRA: SERVO MOTOR (parked on the protoboard with cable)
    // ============================================================
    const servo = new THREE.Group();
    {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.50, 0.30),
        new THREE.MeshStandardMaterial({ color: 0x2a64c8, roughness: 0.4 })
      );
      body.position.y = 0.25;
      body.castShadow = true;
      servo.add(body);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.08, 0.30),
        new THREE.MeshStandardMaterial({ color: 0x2a64c8, roughness: 0.4 })
      );
      top.position.set(0.20, 0.54, 0);
      servo.add(top);
      [[-0.40, 0],[0.55, 0]].forEach(([dx]) => {
        const tab = new THREE.Mesh(
          new THREE.BoxGeometry(0.20, 0.05, 0.30),
          new THREE.MeshStandardMaterial({ color: 0x2a64c8 })
        );
        tab.position.set(dx, 0.30, 0);
        servo.add(tab);
        const sh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.06, 14),
          new THREE.MeshBasicMaterial({ color: 0x111111 })
        );
        sh.rotation.x = Math.PI / 2;
        sh.position.set(dx, 0.30, 0);
        servo.add(sh);
      });
      const gear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 })
      );
      gear.position.set(-0.10, 0.62, 0);
      servo.add(gear);

      const toothGeo = new THREE.BoxGeometry(0.018, 0.06, 0.05);
      const toothMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
      const teeth = new THREE.InstancedMesh(toothGeo, toothMat, 12);
      const M = new THREE.Matrix4();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        M.makeRotationY(a);
        M.setPosition(-0.10 + Math.cos(a) * 0.105, 0.625, Math.sin(a) * 0.105);
        teeth.setMatrixAt(i, M);
      }
      teeth.instanceMatrix.needsUpdate = true;
      servo.add(teeth);

      const arm = new THREE.Group();
      const armBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.04, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xf5f5ed, roughness: 0.5 })
      );
      armBar.position.x = 0.20;
      arm.add(armBar);
      const armHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.05, 18),
        new THREE.MeshStandardMaterial({ color: 0xf5f5ed })
      );
      arm.add(armHub);
      for (let i = 0; i < 4; i++) {
        const h = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 0.06, 10),
          new THREE.MeshBasicMaterial({ color: 0x111111 })
        );
        h.position.set(0.10 + i * 0.10, 0, 0);
        arm.add(h);
      }
      arm.position.set(-0.10, 0.68, 0);
      servo.add(arm);
      anim.servoArm = arm;

      // 3-pin connector cable (curved wires)
      ["#a02020", "#3a2a18", "#d49830"].forEach((col, i) => {
        const wire = new THREE.Mesh(
          new THREE.TorusGeometry(0.55, 0.025, 6, 24, Math.PI * 0.55),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })
        );
        wire.rotation.set(Math.PI / 2, 0, Math.PI * 0.45);
        wire.position.set(-0.20, 0.20, -0.20 + i * 0.04);
        servo.add(wire);
      });

      servo.position.set(-1.15, 0.08, 1.20);
      servo.scale.set(0.85, 0.85, 0.85);
      servo.rotation.y = -0.4;
    }
    board.add(servo);

    // ============================================================
    //  POWER LED (corner)
    // ============================================================
    const powerLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.04, 0.07),
      new THREE.MeshStandardMaterial({
        color: 0xff0044, emissive: 0xff0044, emissiveIntensity: 0.95,
      })
    );
    powerLed.position.set(-pcbW/2 + 0.85, 0.025, pcbH/2 - 0.85);
    board.add(powerLed);
    const powerGlow = glowSprite(0xff0044, 0.6, 0.85);
    powerGlow.position.set(-pcbW/2 + 0.85, 0.06, pcbH/2 - 0.85);
    board.add(powerGlow);
    anim.powerLed = powerLed;
    anim.powerGlow = powerGlow;

    // ============================================================
    //  MOUSE / TOUCH ORBIT + WHEEL ZOOM
    // ============================================================
    let dragging = false;
    let prevX = 0, prevY = 0;
    const onDown = (cx, cy) => { dragging = true; prevX = cx; prevY = cy; };
    const onMove = (cx, cy) => {
      if (!dragging) return;
      const dx = cx - prevX, dy = cy - prevY;
      board.rotation.y += dx * 0.0055;
      board.rotation.x += dy * 0.0055;
      board.rotation.x = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, board.rotation.x));
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
    renderer.domElement.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("touchstart", td, { passive: true });
    window.addEventListener("touchmove", tm, { passive: false });
    window.addEventListener("touchend", onUp);

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(7, Math.min(20, camera.position.z + e.deltaY * 0.01));
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // ============================================================
    //  ANIMATION LOOP
    // ============================================================
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // PicoBricks should stay upright and static — no rotation
      // Only subtle floating motion preserved
      board.position.y = Math.sin(t * 0.7) * 0.10;

      if (anim.rgbLed) {
        const hue = (t * 0.22) % 1;
        const c = new THREE.Color().setHSL(hue, 1, 0.55);
        anim.rgbLed.material.color.copy(c);
        anim.rgbLed.material.emissive.copy(c);
        anim.rgbGlow.material.color.copy(c);
      }
      if (anim.activityLed) {
        const v = 0.45 + (Math.sin(t * 5.5) + 1) * 0.6;
        anim.activityLed.material.emissiveIntensity = v;
        anim.activityGlow.material.opacity = 0.4 + v * 0.25;
      }
      if (anim.redLed) {
        const v = 0.6 + (Math.sin(t * 2.7) + 1) * 0.7;
        anim.redLed.material.emissiveIntensity = v;
        anim.redGlow.material.opacity = 0.4 + v * 0.25;
      }
      if (Math.floor(t * 30) % 2 === 0) drawOLED(t);
      if (anim.powerLed) {
        const v = 0.85 + Math.sin(t * 1.8) * 0.25;
        anim.powerLed.material.emissiveIntensity = v;
        anim.powerGlow.material.opacity = 0.55 + v * 0.2;
      }
      if (anim.buzzer) {
        const s = 1 + Math.sin(t * 9) * 0.04;
        anim.buzzer.scale.set(s, 1, s);
      }
      if (anim.potKnob) {
        anim.potKnob.rotation.y = Math.sin(t * 0.55) * 1.0;
      }
      if (anim.servoArm) {
        anim.servoArm.rotation.y = Math.sin(t * 1.1) * 0.9;
      }
      if (anim.irLed) {
        const blink = (Math.sin(t * 3.2) + Math.sin(t * 7.8)) * 0.5 + 0.5;
        anim.irLed.material.emissiveIntensity = 0.3 + blink * 1.4;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ============================================================
    //  RESIZE
    // ============================================================
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ============================================================
    //  CLEANUP
    // ============================================================
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("touchstart", td);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            ["map","emissiveMap","normalMap","roughnessMap","metalnessMap"].forEach((k) => {
              if (m[k] && m[k].dispose) { try { m[k].dispose(); } catch (e) {} }
            });
            m.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PicoBricks 3D</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Raspberry Pi Pico W · 10 Modüller + Servo · Interactive Viewer
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
            {autoRotate ? "⏸  Pause Rotation" : "▶  Auto Rotate"}
          </button>
        </div>

        <div className="absolute bottom-4 left-4 text-[11px] text-gray-300 bg-black/40 px-3 py-2 rounded-lg backdrop-blur border border-white/5">
          🖱️  Drag = döndür · Scroll = zoom
        </div>

        <div className="absolute bottom-4 right-4 text-[10px] text-gray-300 bg-black/40 px-3 py-2 rounded-lg backdrop-blur border border-white/5 hidden md:block">
          <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
            <span className="text-gray-500">MCU</span><span>RP2040 (Pico W)</span>
            <span className="text-gray-500">Modüller</span><span>10 + Servo</span>
            <span className="text-gray-500">Render</span><span>Three.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}