// PicoBricks3D.jsx — 3D animated PicoBricks educational kit component
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PicoBricks3D({
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
    let H = container.clientHeight || height || 520;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);

    let camR = 14, camTheta = 0.25, camPhi = 0.55;
    let spinning = autoRotate;

    function updateCam() {
      camera.position.set(
        camR * Math.cos(camPhi) * Math.sin(camTheta),
        camR * Math.sin(camPhi) + 0.4,
        camR * Math.cos(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(0, 0, 0);
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

    // ------------------- TEXTURE FACTORY -------------------
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

    const SILK = "rgba(240,238,225,0.92)";
    const SILK_DIM = "rgba(220,215,190,0.55)";
    const pcbW = 9.6, pcbH = 6.6;
    const TEX_W = 2048, TEX_H = Math.round(TEX_W * (pcbH / pcbW));

    const pcbSilkTex = makeCanvasTex(TEX_W, TEX_H, (ctx, w, h) => {
      ctx.fillStyle = "#16161c";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(184,144,40,0.6)";
      [w * 0.30, w * 0.70].forEach((x) => ctx.fillRect(x - 1, h * 0.06, 2, h * 0.88));
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
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = SILK;
      ctx.fillText("PROTOBOARD", w*0.5, h*0.62);
      ctx.fillText("Hello World", w*0.55, h*0.965);
      ctx.textAlign = "left";
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = SILK_DIM;
      ctx.fillText("◢ picobricks", w*0.04, h*0.05);
    });

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
      oledTex.needsUpdate = true;
    };
    drawOLED(0);

    const glowTex = makeCanvasTex(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    const matPCBTop = new THREE.MeshStandardMaterial({ color: 0xffffff, map: pcbSilkTex, roughness: 0.6, metalness: 0.25 });
    const matPCBSide = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.7, metalness: 0.2 });
    const matModuleWhite = new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.78 });
    const matJST = new THREE.MeshStandardMaterial({ color: 0xefefe6, roughness: 0.55 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xd9a93a, roughness: 0.28, metalness: 0.95 });
    const matSilver = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.32, metalness: 0.85 });
    const matChip = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.5 });
    const matGreenTerm = new THREE.MeshStandardMaterial({ color: 0x2e9c45, roughness: 0.45 });

    const glowSprite = (hex, size = 1, opacity = 0.85) => {
      const m = new THREE.SpriteMaterial({
        map: glowTex, color: hex, transparent: true,
        opacity, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const s = new THREE.Sprite(m);
      s.scale.set(size, size, 1);
      return s;
    };

    // ------------------- BOARD ROOT (UPRIGHT/VERTICAL) -------------------
    const board = new THREE.Group();
    // VERTICAL: stand the board upright with COMPONENTS facing camera
    board.rotation.x = Math.PI / 2 - 0.15; // flipped — components/modules face viewer
    board.rotation.z = 0;
    board.position.y = 0.5; // lift slightly so power LED visible at bottom
    scene.add(board);

    // ------------------- PCB BASE -------------------
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
        depth: 0.18, bevelEnabled: true,
        bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2,
      });
      const pcb = new THREE.Mesh(geo, [matPCBTop, matPCBSide]);
      pcb.rotation.x = -Math.PI / 2;
      pcb.position.y = -0.18;
      pcb.castShadow = true; pcb.receiveShadow = true;
      board.add(pcb);

      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        const u = (uv.getX(i) + w2) / pcbW;
        const v = 1 - (uv.getY(i) + h2) / pcbH;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }

    const anim = {};

    // ------------------- RASPBERRY PI PICO W (CENTER) -------------------
    {
      const picoTex = makeCanvasTex(512, 1100, (ctx, w, h) => {
        ctx.fillStyle = "#0d4a37";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(240,240,235,0.9)";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Raspberry Pi", w / 2, h * 0.62);
        ctx.fillText("Pico W", w / 2, h * 0.66);
        ctx.font = "bold 14px monospace";
        ctx.fillText("©2022", w / 2, h * 0.69);
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "rgba(240,240,235,0.7)";
        const leftLabels = ["GP0","GP1","GND","GP2","GP3","GP4","GP5","GND","GP6","GP7","GP8","GP9","GND","GP10","GP11","GP12","GP13","GND","GP14","GP15"];
        const rightLabels = ["VBUS","VSYS","GND","3V3_EN","3V3","ADC_VR","AGND","GP28","GP27","GP26","RUN","GP22","GND","GP21","GP20","GP19","GP18","GND","GP17","GP16"];
        leftLabels.forEach((t, i) => {
          const y = 38 + (i * (h - 80)) / leftLabels.length;
          ctx.textAlign = "left";
          ctx.fillText(t, 14, y);
          ctx.textAlign = "right";
          ctx.fillText(rightLabels[i], w - 14, y);
        });
        ctx.fillStyle = "rgba(240,240,235,0.5)";
        ctx.textAlign = "center";
        ctx.font = "bold 10px monospace";
        ctx.fillText("BOOTSEL", w / 2, h * 0.16);
      });

      const matPicoTop = new THREE.MeshStandardMaterial({ color: 0xffffff, map: picoTex, roughness: 0.55, metalness: 0.3 });
      const matPicoSide = new THREE.MeshStandardMaterial({ color: 0x0c4029, roughness: 0.55, metalness: 0.3 });

      const g = new THREE.Group();

      // Pico PCB
      const picoBoxGeo = new THREE.BoxGeometry(0.95, 0.085, 2.20);
      const picoBoxMats = [matPicoSide, matPicoSide, matPicoTop, matPicoSide, matPicoSide, matPicoSide];
      const picoBoard = new THREE.Mesh(picoBoxGeo, picoBoxMats);
      picoBoard.position.y = 0.0425;
      picoBoard.castShadow = true; picoBoard.receiveShadow = true;
      g.add(picoBoard);

      // RP2040 chip
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

      // WiFi shield (CYW43439)
      const wifi = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.06, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.3 })
      );
      wifi.position.set(0, 0.116, 0.55);
      wifi.castShadow = true;
      g.add(wifi);

      // Antenna (gold trace)
      const ant = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.005, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xd9a93a, metalness: 0.9, roughness: 0.3 })
      );
      ant.position.set(0, 0.118, 0.94);
      g.add(ant);

      // USB connector
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

      // BOOTSEL button
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.04, 0.10),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      boot.position.set(-0.20, 0.105, -0.55);
      g.add(boot);

      // Gold pin headers (40 pins, 20 each side)
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

      // Pin header strips
      const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.03, 1.95), matChip);
      stripL.position.set(-0.43, 0.10, 0);
      g.add(stripL);
      const stripR = stripL.clone();
      stripR.position.x = 0.43;
      g.add(stripR);

      // Activity LED (animated)
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

      // Position Pico in center of PicoBricks board
      g.position.set(0, 0.05, 0);
      board.add(g);
    }

    // ------------------- MODULE FACTORY -------------------
    function moduleBase(jstSide) {
      const g = new THREE.Group();
      const sx = jstSide === "right" ? 1 : -1;
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 1.05), matModuleWhite);
      base.position.y = 0.035;
      base.castShadow = true; base.receiveShadow = true;
      g.add(base);
      const jst = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.20, 0.24), matJST);
      jst.position.set(0.55 * sx, 0.14, 0);
      g.add(jst);
      return g;
    }

    const leftX = -2.8, rightX = 2.8;
    const rowZ = [-2.40, -1.20, 0.0, 1.20, 2.40];

    // OLED
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
    }

    // RGB LED
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
          color: 0xffffff, emissive: 0xff00ff, emissiveIntensity: 1.8,
          transparent: true, opacity: 0.92, roughness: 0.2,
        })
      );
      led.position.set(-0.25, 0.18, 0);
      m.add(led);
      const ledGlow = glowSprite(0xff00ff, 1.4, 0.85);
      ledGlow.position.set(-0.25, 0.21, 0);
      m.add(ledGlow);
      anim.rgbLed = led;
      anim.rgbGlow = ledGlow;
    }

    // LED + Button
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[2]);
      board.add(m);
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
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.10, 24),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55 })
      );
      cap.position.set(0.05, 0.30, 0);
      m.add(cap);
    }

    // DHT11
    {
      const m = moduleBase("right");
      m.position.set(leftX, 0, rowZ[3]);
      board.add(m);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.78),
        new THREE.MeshStandardMaterial({ color: 0x4ea4d4, roughness: 0.7 })
      );
      body.position.set(0.0, 0.16, 0);
      m.add(body);
    }

    // Relay
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
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.42), matGreenTerm);
      term.position.set(-0.45, 0.18, 0);
      m.add(term);
    }

    // Motor Driver
    {
      const m = moduleBase("left");
      m.position.set(rightX, 0, rowZ[0]);
      board.add(m);
      [-0.20, 0.20].forEach((zo) => {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.06, 0.30), matChip);
        chip.position.set(-0.10, 0.10, zo);
        m.add(chip);
      });
      [-0.25, 0.25].forEach((zo) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.40), matGreenTerm);
        t.position.set(0.42, 0.17, zo);
        m.add(t);
      });
    }

    // Wireless+IR
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
      const irLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.8 })
      );
      irLed.position.set(0.20, 0.09, 0.30);
      m.add(irLed);
      anim.irLed = irLed;
    }

    // Buzzer
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
      anim.buzzer = can;
    }

    // LDR
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
    }

    // Potentiometer
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
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.22, 0.13, 32),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3e, metalness: 0.55, roughness: 0.4 })
      );
      knob.position.set(-0.05, 0.36, 0);
      m.add(knob);
      anim.potKnob = knob;
    }

    // Power LED
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

    // ------------------- INTERACTION -------------------
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => {
      if (!interactive) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      container.style.cursor = "grabbing"; spinning = false;
    };
    const onMouseUp = () => { if (!interactive) return; dragging = false; container.style.cursor = "grab"; };
    const onMouseMove = (e) => {
      if (!interactive || !dragging) return;
      camTheta -= (e.clientX - lastX) * 0.008;
      camPhi = Math.max(-0.2, Math.min(1.4, camPhi + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      updateCam();
    };
    const onWheel = (e) => {
      if (!interactive) return;
      e.preventDefault();
      camR = Math.max(7, Math.min(22, camR + e.deltaY * 0.012));
      updateCam();
    };
    const onResize = () => {
      W = container.clientWidth || 680;
      H = container.clientHeight || height || 520;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };

    if (interactive) {
      container.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);
      container.addEventListener("wheel", onWheel, { passive: false });
    }
    window.addEventListener("resize", onResize);

    // ResizeObserver — react to container size changes
    const ro = new ResizeObserver(() => onResize());
    ro.observe(container);
    // Trigger initial sizing after layout
    setTimeout(onResize, 0);

    // ------------------- LOOP -------------------
    let animId;
    const clock = new THREE.Clock();
    const loop = () => {
      const t = clock.getElapsedTime();
      // Subtle floating only — NO rotation, board stays vertical/upright
      board.position.y = Math.sin(t * 0.6) * 0.08;

      if (anim.rgbLed) {
        const hue = (t * 0.22) % 1;
        const c = new THREE.Color().setHSL(hue, 1, 0.55);
        anim.rgbLed.material.color.copy(c);
        anim.rgbLed.material.emissive.copy(c);
        anim.rgbGlow.material.color.copy(c);
      }
      if (anim.redLed) {
        const v = 0.6 + (Math.sin(t * 2.7) + 1) * 0.7;
        anim.redLed.material.emissiveIntensity = v;
        anim.redGlow.material.opacity = 0.4 + v * 0.25;
      }
      if (anim.activityLed) {
        const v = 0.45 + (Math.sin(t * 5.5) + 1) * 0.6;
        anim.activityLed.material.emissiveIntensity = v;
        anim.activityGlow.material.opacity = 0.4 + v * 0.25;
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
      if (anim.irLed) {
        const blink = (Math.sin(t * 3.2) + Math.sin(t * 7.8)) * 0.5 + 0.5;
        anim.irLed.material.emissiveIntensity = 0.3 + blink * 1.4;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        container.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
        container.removeEventListener("wheel", onWheel);
      }
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      pcbSilkTex.dispose();
      oledTex.dispose();
      glowTex.dispose();
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
        height: "100%",
        minHeight: 200,
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