import * as THREE from 'three';
import { BIOLOGY_DATA } from './quizData.js';
import { sound } from './audio.js';

export class CellWorld {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.scene.add(this.group);

    this.interactiveObjects = [];
    this.atpParticles = [];
    this.oxygenBubbles = [];
    this.vesicles = [];
    this.sunlightActive = true;
    this.mitochondriaPumping = false;

    this.initCellEnvironment();
    this.initMitochondria();
    this.initNucleusAndDNA();
    this.initChloroplast();
    this.initGolgiAndVesicles();
    this.initCellHUD();
    this.initExitPortal();
  }

  initCellEnvironment() {
    // 1. Surrounding Plasma Membrane Dome / Cytosol Environment
    const cytoGeo = new THREE.SphereGeometry(24, 32, 32);
    const cytoMat = new THREE.MeshBasicMaterial({
      color: 0x051b2a,
      side: THREE.BackSide
    });
    this.cytosol = new THREE.Mesh(cytoGeo, cytoMat);
    this.group.add(this.cytosol);

    // Bioluminescent Cytoplasm Fog / Particles (Ribosomes & Cytosol proteins)
    const riboGeo = new THREE.BufferGeometry();
    const riboCount = 800;
    const riboPos = new Float32Array(riboCount * 3);
    for (let i = 0; i < riboCount * 3; i += 3) {
      riboPos[i] = (Math.random() - 0.5) * 36;
      riboPos[i + 1] = (Math.random() - 0.5) * 20;
      riboPos[i + 2] = (Math.random() - 0.5) * 36;
    }
    riboGeo.setAttribute('position', new THREE.BufferAttribute(riboPos, 3));
    const riboMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.7
    });
    this.ribosomes = new THREE.Points(riboGeo, riboMat);
    this.group.add(this.ribosomes);

    // Cytoskeleton Microtubules (Curved neon tubes spanning the cell)
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-12, -4, -8),
      new THREE.Vector3(-5, 2, -2),
      new THREE.Vector3(4, 3, 5),
      new THREE.Vector3(12, 1, 10)
    ]);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, 32, 0.08, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.3,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4
    });
    const tube1 = new THREE.Mesh(tubeGeo1, tubeMat);
    this.group.add(tube1);

    // Lights inside cell
    const cellAmbient = new THREE.AmbientLight(0x1e3a5f, 1.2);
    this.group.add(cellAmbient);

    this.coreLight = new THREE.PointLight(0x38bdf8, 2.5, 30);
    this.coreLight.position.set(0, 4, 0);
    this.group.add(this.coreLight);
  }

  initMitochondria() {
    // Mitochondria Model at Position (x: -5, y: 1.5, z: -5)
    this.mitoGroup = new THREE.Group();
    this.mitoGroup.position.set(-5, 1.5, -4);

    // Outer Membrane (translucent orange/red elongated capsule)
    const outerGeo = new THREE.CapsuleGeometry(1.2, 2.2, 16, 24);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.4,
      roughness: 0.2,
      metalness: 0.1
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.z = Math.PI / 4;
    this.mitoGroup.add(outer);

    // Inner Cristae Folds (wavy inner membrane folds)
    const innerGeo = new THREE.CapsuleGeometry(1.0, 2.0, 16, 24);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      wireframe: true,
      roughness: 0.4
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.z = Math.PI / 4;
    this.mitoGroup.add(inner);

    // ATP Synthase complex knobs along cristae
    this.synthaseKnobs = [];
    for (let k = 0; k < 6; k++) {
      const knobGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const knobMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.5
      });
      const knob = new THREE.Mesh(knobGeo, knobMat);
      const ang = (k / 6) * Math.PI * 2;
      knob.position.set(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7, (k - 2.5) * 0.35);
      this.mitoGroup.add(knob);
      this.synthaseKnobs.push(knob);
    }

    // Interactive Button: "เติม Glucose & O2 -> ผลิต ATP"
    const btnGeo = new THREE.BoxGeometry(1.8, 0.4, 0.2);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(0, -1.8, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ เติม Glucose + O2', 256, 55);
    ctx.font = '24px sans-serif';
    ctx.fillText('ผลิตพลังงาน ATP', 256, 95);

    const tex = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.36),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    label.position.set(0, -1.8, 0.11);
    this.mitoGroup.add(label);

    btn.userData = { isMitoButton: true };
    this.interactiveObjects.push(btn);
    this.mitoGroup.add(btn);

    // Organelle Title Label
    this.createFloatingLabel(this.mitoGroup, 'ไมโทคอนเดรีย (Mitochondria)', 'สร้างพลังงาน ATP ระดับเซลล์', new THREE.Vector3(0, 2.2, 0));

    this.group.add(this.mitoGroup);
  }

  initNucleusAndDNA() {
    // Giant Nucleus at Position (x: 0, y: 3.5, z: -7)
    this.nucGroup = new THREE.Group();
    this.nucGroup.position.set(0, 3.0, -8);

    // Nuclear Envelope (Perforated Sphere)
    const nucGeo = new THREE.SphereGeometry(2.4, 32, 32, 0, Math.PI * 1.5); // 3/4 cutaway to peek inside
    const nucMat = new THREE.MeshPhysicalMaterial({
      color: 0x4338ca,
      roughness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.nucMesh = new THREE.Mesh(nucGeo, nucMat);
    this.nucGroup.add(this.nucMesh);

    // Nuclear Pores (Gold rings on the membrane)
    for (let p = 0; p < 16; p++) {
      const pGeo = new THREE.RingGeometry(0.08, 0.13, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
      const pore = new THREE.Mesh(pGeo, pMat);
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 1.4;
      pore.position.setFromSphericalCoords(2.42, theta, phi);
      pore.lookAt(0, 0, 0);
      this.nucGroup.add(pore);
    }

    // DNA Double Helix rotating inside Nucleus
    this.dnaGroup = new THREE.Group();
    this.dnaGroup.position.set(0, 0, 0);

    const r = 0.6;
    const strandSteps = 40;
    const length = 3.6;

    const baseColors = {
      A: 0xef4444, // Adenine: Red
      T: 0x22c55e, // Thymine: Green
      C: 0x3b82f6, // Cytosine: Blue
      G: 0xf59e0b  // Guanine: Yellow
    };

    const basePairs = [
      ['A', 'T'], ['G', 'C'], ['T', 'A'], ['C', 'G'],
      ['A', 'T'], ['C', 'G'], ['G', 'C'], ['T', 'A']
    ];

    for (let s = 0; s < strandSteps; s++) {
      const t = (s / strandSteps) * Math.PI * 4;
      const y = (s / strandSteps) * length - length / 2;

      const x1 = Math.cos(t) * r;
      const z1 = Math.sin(t) * r;
      const x2 = Math.cos(t + Math.PI) * r;
      const z2 = Math.sin(t + Math.PI) * r;

      // Sugar-phosphate backbone spheres
      const sGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const sMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
      const b1 = new THREE.Mesh(sGeo, sMat);
      b1.position.set(x1, y, z1);
      this.dnaGroup.add(b1);

      const b2 = new THREE.Mesh(sGeo, sMat);
      b2.position.set(x2, y, z2);
      this.dnaGroup.add(b2);

      // Base pair bridge
      if (s % 2 === 0) {
        const pair = basePairs[(s / 2) % basePairs.length];
        const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, r * 2, 8);
        const rungMat1 = new THREE.MeshStandardMaterial({ color: baseColors[pair[0]] });
        const rung = new THREE.Mesh(rungGeo, rungMat1);
        rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x1 - x2, 0, z1 - z2).normalize());
        this.dnaGroup.add(rung);
      }
    }

    this.nucGroup.add(this.dnaGroup);

    this.createFloatingLabel(this.nucGroup, 'นิวเคลียส (Nucleus & DNA)', 'เกลียวคู่ DNA: รหัสพันธุกรรม A-T / C-G', new THREE.Vector3(0, 3.0, 0));

    this.group.add(this.nucGroup);
  }

  initChloroplast() {
    // Chloroplast at Position (x: 5, y: 1.5, z: -4)
    this.chloroGroup = new THREE.Group();
    this.chloroGroup.position.set(5, 1.5, -4);

    // Outer double-membrane
    const cGeo = new THREE.CapsuleGeometry(1.1, 2.0, 16, 24);
    const cMat = new THREE.MeshPhysicalMaterial({
      color: 0x15803d,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2
    });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.rotation.z = -Math.PI / 4;
    this.chloroGroup.add(cMesh);

    // Thylakoid Stacks (Grana discs)
    this.granaDiscs = [];
    for (let g = 0; g < 4; g++) {
      const gx = (g - 1.5) * 0.55;
      for (let d = 0; d < 5; d++) {
        const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16);
        const discMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          roughness: 0.3,
          emissive: 0x16a34a,
          emissiveIntensity: 0.3
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(gx, (d - 2) * 0.12, 0);
        this.chloroGroup.add(disc);
        this.granaDiscs.push(disc);
      }
    }

    // Toggle Sunlight Button
    const btnGeo = new THREE.BoxGeometry(1.8, 0.4, 0.2);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(0, -1.8, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☀️ สลับแสงแดด (Photosynthesis)', 256, 55);
    ctx.font = '22px sans-serif';
    ctx.fillText('สร้างน้ำตาลและออกซิเจน O2', 256, 95);

    const tex = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.36),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    label.position.set(0, -1.8, 0.11);
    this.chloroGroup.add(label);

    btn.userData = { isChloroButton: true };
    this.interactiveObjects.push(btn);
    this.chloroGroup.add(btn);

    this.createFloatingLabel(this.chloroGroup, 'คลอโรพลาสต์ (Chloroplast)', 'กระบวนการสังเคราะห์ด้วยแสง (Photosynthesis)', new THREE.Vector3(0, 2.2, 0));

    this.group.add(this.chloroGroup);
  }

  initGolgiAndVesicles() {
    // Golgi Complex at Position (x: 4.5, y: -0.5, z: 2)
    this.golgiGroup = new THREE.Group();
    this.golgiGroup.position.set(4.5, 0, 2);

    // Curved Cisternae stacks
    for (let c = 0; c < 5; c++) {
      const cisGeo = new THREE.TorusGeometry(1.1 + c * 0.18, 0.1, 12, 32, Math.PI / 1.8);
      const cisMat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        roughness: 0.3,
        emissive: 0xbe185d,
        emissiveIntensity: 0.2
      });
      const cis = new THREE.Mesh(cisGeo, cisMat);
      cis.rotation.x = Math.PI / 2;
      cis.rotation.z = Math.PI / 8;
      cis.position.set(0, (c - 2) * 0.25, 0);
      this.golgiGroup.add(cis);
    }

    // Transport Vesicles budding off
    for (let v = 0; v < 6; v++) {
      const vesGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const vesMat = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
      const ves = new THREE.Mesh(vesGeo, vesMat);
      ves.position.set((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 1.2);
      this.golgiGroup.add(ves);
      this.vesicles.push(ves);
    }

    this.createFloatingLabel(this.golgiGroup, 'กอลจิคอมเพล็กซ์ (Golgi Apparatus)', 'บรรจุและขนส่งสารด้วยถุง Vesicles', new THREE.Vector3(0, 1.8, 0));

    this.group.add(this.golgiGroup);
  }

  initCellHUD() {
    // Floating HUD with educational overview of the cell
    const hudGroup = new THREE.Group();
    hudGroup.position.set(0, 1.2, -1.8);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(6, 19, 32, 0.9)';
    ctx.fillRect(0, 0, 1024, 400);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 1004, 380);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌌 โลกมหัศจรรย์ภายในเซลล์ (Inside Eukaryotic Cell)', 512, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText('ท่านกำลังอยู่ในโลกขนาดจิ๋วระดับ 1:1,000,000 เท่า', 512, 110);
    ctx.fillText('• ด้านซ้าย: ไมโทคอนเดรีย (โรงงานพลังงานเซลล์ ผลิต ATP)', 512, 160);
    ctx.fillText('• กึ่งกลาง: นิวเคลียส พร้อมเกลียวคู่รหัสพันธุกรรม DNA', 512, 205);
    ctx.fillText('• ด้านขวา: คลอโรพลาสต์ (สังเคราะห์ด้วยแสง ปลดปล่อย O2) และกอลจิคอมเพล็กซ์', 512, 250);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('💡 กดปุ่มที่แต่ละออร์แกเนลล์เพื่อเริ่มการทดลอง!', 512, 330);

    const tex = new THREE.CanvasTexture(canvas);
    const hudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.95),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    hudGroup.add(hudMesh);

    this.group.add(hudGroup);
  }

  initExitPortal() {
    // Exit Portal Button to return to the Laboratory
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0.2, 2.5);

    const ringGeo = new THREE.RingGeometry(0.8, 0.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    portalGroup.add(ring);

    const btnGeo = new THREE.BoxGeometry(1.6, 0.35, 0.15);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(0, 0.8, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚪 ออกจากเซลล์กลับสู่ห้องแล็บ', 256, 55);
    ctx.font = '22px sans-serif';
    ctx.fillText('(RETURN TO LAB)', 256, 95);

    const tex = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.32),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    label.position.set(0, 0.8, -0.08);
    label.rotation.y = Math.PI;
    portalGroup.add(label);

    btn.userData = { isExitPortal: true };
    this.interactiveObjects.push(btn);
    portalGroup.add(btn);

    this.group.add(portalGroup);
  }

  createFloatingLabel(parent, titleTh, subtitleTh, localPos) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleTh, 256, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(subtitleTh, 256, 90);

    const tex = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.4),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    mesh.position.copy(localPos);
    parent.add(mesh);
  }

  triggerMitochondriaATP() {
    sound.playAtpSparkle();
    this.mitochondriaPumping = true;

    // Spawn 12 glowing golden ATP particles floating away
    for (let i = 0; i < 12; i++) {
      const atpGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const atpMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.8
      });
      const atp = new THREE.Mesh(atpGeo, atpMat);
      atp.position.set(
        -5 + (Math.random() - 0.5) * 1.5,
        1.5 + (Math.random() - 0.5) * 1.5,
        -4 + (Math.random() - 0.5) * 1.5
      );
      this.group.add(atp);
      this.atpParticles.push({
        mesh: atp,
        vy: 0.02 + Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.02,
        life: 1.0
      });
    }
  }

  toggleSunlight() {
    this.sunlightActive = !this.sunlightActive;
    sound.playClick();

    // Spawn Oxygen bubbles
    if (this.sunlightActive) {
      for (let i = 0; i < 15; i++) {
        const o2Geo = new THREE.SphereGeometry(0.08, 12, 12);
        const o2Mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1
        });
        const bubble = new THREE.Mesh(o2Geo, o2Mat);
        bubble.position.set(
          5 + (Math.random() - 0.5) * 1.8,
          1.5 + (Math.random() - 0.5) * 1.2,
          -4 + (Math.random() - 0.5) * 1.8
        );
        this.group.add(bubble);
        this.oxygenBubbles.push({
          mesh: bubble,
          vy: 0.03 + Math.random() * 0.02,
          life: 1.0
        });
      }
    }
  }

  update(time) {
    if (!this.group.visible) return;

    // Rotate DNA Double Helix smoothly
    if (this.dnaGroup) {
      this.dnaGroup.rotation.y += 0.015;
    }

    // Slowly pulse mitochondria synthases
    if (this.synthaseKnobs) {
      this.synthaseKnobs.forEach((k, idx) => {
        k.rotation.y += 0.05;
        const s = 1.0 + Math.sin(time * 4 + idx) * 0.1;
        k.scale.set(s, s, s);
      });
    }

    // Update ATP particles
    for (let i = this.atpParticles.length - 1; i >= 0; i--) {
      const p = this.atpParticles[i];
      p.mesh.position.y += p.vy;
      p.mesh.position.x += p.vx;
      p.life -= 0.008;
      p.mesh.scale.set(p.life, p.life, p.life);

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        this.atpParticles.splice(i, 1);
      }
    }

    // Update Oxygen bubbles
    for (let i = this.oxygenBubbles.length - 1; i >= 0; i--) {
      const b = this.oxygenBubbles[i];
      b.mesh.position.y += b.vy;
      b.life -= 0.007;

      if (b.life <= 0) {
        this.group.remove(b.mesh);
        this.oxygenBubbles.splice(i, 1);
      }
    }

    // Move Vesicles
    this.vesicles.forEach((v, idx) => {
      v.position.z += Math.sin(time * 2 + idx) * 0.005;
      v.position.y += Math.cos(time * 2 + idx) * 0.003;
    });

    // Ribosomes drift
    if (this.ribosomes) {
      this.ribosomes.rotation.y += 0.0005;
    }
  }

  handleClick(intersectedObj) {
    const data = intersectedObj.userData;
    if (data.isMitoButton) {
      this.triggerMitochondriaATP();
      return true;
    }
    if (data.isChloroButton) {
      this.toggleSunlight();
      return true;
    }
    if (data.isExitPortal) {
      return 'exit_cell';
    }
    return false;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
