import * as THREE from 'three';
import { sound } from './audio.js';

export class BloodTypingStation {
  constructor(scene, basePosition = new THREE.Vector3(2.2, 0.81, 1.8)) {
    this.scene = scene;
    this.basePosition = basePosition;
    this.group = new THREE.Group();
    this.group.position.copy(basePosition);
    this.scene.add(this.group);

    // Patient blood samples
    this.samples = [
      { id: 'sample1', name: 'ตัวอย่าง 1: นายสมชาย', type: 'A+', agA: true, agB: false, agRh: true, antigens: 'Antigen A, Rh', antibodies: 'Anti-B', giveTo: 'A+, AB+', getFrom: 'A+, A-, O+, O-' },
      { id: 'sample2', name: 'ตัวอย่าง 2: น.ส.มาลี', type: 'B-', agA: false, agB: true, agRh: false, antigens: 'Antigen B', antibodies: 'Anti-A, Anti-Rh (เมื่อถูกกระตุ้น)', giveTo: 'B+, B-, AB+, AB-', getFrom: 'B-, O-' },
      { id: 'sample3', name: 'ตัวอย่าง 3: นายอนันต์', type: 'AB+', agA: true, agB: true, agRh: true, antigens: 'Antigen A, B, Rh', antibodies: 'ไม่มี (Universal Recipient)', giveTo: 'AB+ เท่านั้น', getFrom: 'ทุกหมู่เลือด (A, B, AB, O ทั้ง + และ -)' },
      { id: 'sample4', name: 'ตัวอย่าง 4: ด.ญ.กานดา', type: 'O-', agA: false, agB: false, agRh: false, antigens: 'ไม่มี (Universal Donor)', antibodies: 'Anti-A, Anti-B', giveTo: 'ทุกหมู่เลือด (ผู้ให้สากล)', getFrom: 'O- เท่านั้น' }
    ];

    this.currentSampleIndex = 0;
    this.plateState = {
      bloodAdded: false,
      antiAAdded: false,
      antiBAdded: false,
      antiRhAdded: false
    };

    this.interactiveObjects = [];

    this.initStation();
  }

  initStation() {
    // 1. Waterproof Lab Tray Stand
    const trayGeo = new THREE.BoxGeometry(2.1, 0.03, 0.92);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.y = 0.015;
    this.group.add(tray);

    // 2. White Porcelain 3-Well Reaction Plate
    this.createWellPlate();

    // 3. Patient Blood Sample Vials (Rack on left)
    this.createSampleRack();

    // 4. Anti-Sera Dropper Bottles (Rack on right)
    this.createAntiSeraBottles();

    // 5. Clinical Analysis Monitor Screen
    this.createMonitor();
  }

  createWellPlate() {
    this.plateGroup = new THREE.Group();
    this.plateGroup.position.set(0, 0.035, -0.05);

    // Porcelain Plate Base
    const plateGeo = new THREE.BoxGeometry(0.85, 0.025, 0.38);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    this.plateGroup.add(plate);

    // 3 Wells: A (left), B (center), Rh (right)
    this.wells = [
      { id: 'wellA', label: 'หลุม A (Anti-A)', x: -0.26 },
      { id: 'wellB', label: 'หลุม B (Anti-B)', x: 0.0 },
      { id: 'wellRh', label: 'หลุม Rh (Anti-D)', x: 0.26 }
    ];

    this.wellMeshes = {};

    this.wells.forEach(w => {
      // Cavity rim
      const rim = new THREE.Mesh(
        new THREE.RingGeometry(0.09, 0.105, 32),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3 })
      );
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(w.x, 0.014, 0);
      this.plateGroup.add(rim);

      // Well Liquid Mesh
      const liqMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        transparent: true,
        opacity: 0.15
      });
      const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.09, 32), liqMat);
      liquid.rotation.x = -Math.PI / 2;
      liquid.position.set(w.x, 0.014, 0);
      this.plateGroup.add(liquid);

      // Granular agglutination particles (speckles that appear on positive reaction)
      const speckleGroup = new THREE.Group();
      speckleGroup.position.set(w.x, 0.015, 0);
      for (let s = 0; s < 30; s++) {
        const speck = new THREE.Mesh(
          new THREE.SphereGeometry(0.005, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x7f1d1d })
        );
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * 0.065;
        speck.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
        speck.visible = false;
        speckleGroup.add(speck);
      }
      this.plateGroup.add(speckleGroup);

      // Label below well
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.label.split(' ')[1], 128, 42);

      const tex = new THREE.CanvasTexture(canvas);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshBasicMaterial({ map: tex }));
      label.rotation.x = -Math.PI / 2;
      label.position.set(w.x, 0.014, 0.13);
      this.plateGroup.add(label);

      this.wellMeshes[w.id] = { liquid, liqMat, speckleGroup };
    });

    // Reset Well Plate Button on plate
    const resetBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.02, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    resetBtn.position.set(0, 0.018, -0.14);
    resetBtn.userData = { isResetPlate: true, name: 'ล้างถาดหลุมตรวจ (Reset Plate เพื่อตรวจคนใหม่)' };
    this.interactiveObjects.push(resetBtn);
    this.plateGroup.add(resetBtn);

    plate.userData = { isWellPlate: true, name: 'ถาดหลุมทดสอบหมู่เลือด (Porcelain Reaction Plate)' };
    this.interactiveObjects.push(plate);

    this.group.add(this.plateGroup);
  }

  createSampleRack() {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-0.65, 0.03, -0.05);

    // Wooden Vial Rack
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.06, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
    );
    stand.position.y = 0.03;
    rackGroup.add(stand);

    // 4 Sample Vials
    [-0.14, -0.045, 0.045, 0.14].forEach((vx, idx) => {
      const vialGroup = new THREE.Group();
      vialGroup.position.set(vx, 0.06, 0);

      // Glass tube
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.11, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.1 })
      );
      tube.position.y = 0.055;
      vialGroup.add(tube);

      // Blood liquid inside
      const blood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.2 })
      );
      blood.position.y = 0.042;
      vialGroup.add(blood);

      // Cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.019, 0.02, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      cap.position.y = 0.115;
      vialGroup.add(cap);

      tube.userData = { isBloodSample: true, sampleIndex: idx, name: `${this.samples[idx].name} (คลิกเพื่อหยดเลือดลงถาด)` };
      blood.userData = tube.userData;
      this.interactiveObjects.push(tube);
      this.interactiveObjects.push(blood);

      rackGroup.add(vialGroup);
    });

    this.group.add(rackGroup);
  }

  createAntiSeraBottles() {
    const seraGroup = new THREE.Group();
    seraGroup.position.set(0.65, 0.03, -0.05);

    // Plastic Stand
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.02, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    stand.position.y = 0.01;
    seraGroup.add(stand);

    // 3 Standard Anti-Sera Bottles
    const sera = [
      { id: 'antiA', name: 'ขวด Anti-A (เซรั่มสีน้ำเงิน)', color: 0x2563eb, x: -0.13 },
      { id: 'antiB', name: 'ขวด Anti-B (เซรั่มสีเหลือง)', color: 0xeab308, x: 0.0 },
      { id: 'antiRh', name: 'ขวด Anti-Rh / Anti-D (เซรั่มใส)', color: 0xe2e8f0, x: 0.13 }
    ];

    sera.forEach(s => {
      const bGroup = new THREE.Group();
      bGroup.position.set(s.x, 0.02, 0);

      // Bottle body
      const bot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.09, 16),
        new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.2, transparent: true, opacity: 0.85 })
      );
      bot.position.y = 0.045;
      bGroup.add(bot);

      // Dropper Cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.018, 0.03, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      cap.position.y = 0.1;
      bGroup.add(cap);

      // Rubber bulb
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 12),
        new THREE.MeshStandardMaterial({ color: s.color })
      );
      bulb.position.y = 0.125;
      bGroup.add(bulb);

      bot.userData = { isAntiSerum: true, serumType: s.id, name: `${s.name} (คลิกเพื่อหยดลงหลุม)` };
      bulb.userData = bot.userData;
      this.interactiveObjects.push(bot);
      this.interactiveObjects.push(bulb);

      seraGroup.add(bGroup);
    });

    this.group.add(seraGroup);
  }

  createMonitor() {
    this.infoCanvas = document.createElement('canvas');
    this.infoCanvas.width = 1024;
    this.infoCanvas.height = 512;
    this.infoCtx = this.infoCanvas.getContext('2d');
    this.infoTex = new THREE.CanvasTexture(this.infoCanvas);

    const screenMat = new THREE.MeshBasicMaterial({ map: this.infoTex });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), screenMat);
    screen.position.set(0, 0.48, -0.32);
    this.group.add(screen);

    // Frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.54, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    frame.position.set(0, 0.48, -0.34);
    this.group.add(frame);

    this.updateMonitor();
  }

  addBloodSample(sampleIdx) {
    this.currentSampleIndex = sampleIdx;
    this.plateState.bloodAdded = true;
    sound.playLiquidDrop();

    // Fill all 3 wells with red blood droplet
    Object.keys(this.wellMeshes).forEach(wId => {
      const w = this.wellMeshes[wId];
      w.liqMat.color.setHex(0xb91c1c);
      w.liqMat.opacity = 0.85;
      w.speckleGroup.children.forEach(s => (s.visible = false));
    });

    this.plateState.antiAAdded = false;
    this.plateState.antiBAdded = false;
    this.plateState.antiRhAdded = false;

    this.updateMonitor();
  }

  addSerum(serumType) {
    if (!this.plateState.bloodAdded) {
      sound.playClick();
      return;
    }

    sound.playLiquidDrop();
    setTimeout(() => sound.playStir(), 200);

    const s = this.samples[this.currentSampleIndex];

    if (serumType === 'antiA') {
      this.plateState.antiAAdded = true;
      this.renderReaction('wellA', s.agA);
    } else if (serumType === 'antiB') {
      this.plateState.antiBAdded = true;
      this.renderReaction('wellB', s.agB);
    } else if (serumType === 'antiRh') {
      this.plateState.antiRhAdded = true;
      this.renderReaction('wellRh', s.agRh);
    }

    this.updateMonitor();
  }

  renderReaction(wellId, isAgglutinated) {
    const w = this.wellMeshes[wellId];
    if (isAgglutinated) {
      // Agglutination: Red clumps with clear serum
      w.liqMat.color.setHex(0xf87171);
      w.liqMat.opacity = 0.45;
      w.speckleGroup.children.forEach(speck => (speck.visible = true));
    } else {
      // Smooth homogeneous non-agglutinated blood
      w.liqMat.color.setHex(0xb91c1c);
      w.liqMat.opacity = 0.85;
      w.speckleGroup.children.forEach(speck => (speck.visible = false));
    }
  }

  resetPlate() {
    this.plateState = {
      bloodAdded: false,
      antiAAdded: false,
      antiBAdded: false,
      antiRhAdded: false
    };
    sound.playClick();

    Object.keys(this.wellMeshes).forEach(wId => {
      const w = this.wellMeshes[wId];
      w.liqMat.color.setHex(0xffffff);
      w.liqMat.opacity = 0.15;
      w.speckleGroup.children.forEach(s => (s.visible = false));
    });

    this.updateMonitor();
  }

  updateMonitor() {
    const ctx = this.infoCtx;
    const w = this.infoCanvas.width;
    const h = this.infoCanvas.height;
    const s = this.samples[this.currentSampleIndex];

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🩸 การตรวจวิเคราะห์หมู่เลือด ABO & Rh (Blood Typing Lab)', 35, 55);

    if (!this.plateState.bloodAdded) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '26px sans-serif';
      ctx.fillText('👉 ขั้นตอนที่ 1: คลิกเลือก "ขวดตัวอย่างเลือด" ทางซ้าย เพื่อหยดเลือดลงถาดทดสอบ', 35, 120);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px sans-serif';
      ctx.fillText('มีตัวอย่างเลือดผู้ป่วย 4 ท่าน พร้อมให้ทดสอบการทำปฏิกิริยากับ Anti-Sera', 35, 165);
      ctx.fillText('หลักการ: แอนติเจน (บนเม็ดเลือดแดง) + แอนติบอดีจำเพาะ -> ตกตะกอนเกาะกลุ่ม (Agglutination)', 35, 205);
      this.infoTex.needsUpdate = true;
      return;
    }

    // Patient info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`ผู้ป่วย: ${s.name}`, 35, 105);

    // Status of wells
    const aText = this.plateState.antiAAdded ? (s.agA ? '🔴 ตกตะกอน (+)' : '⚪ ไม่ตกตะกอน (-)') : 'ยังไม่หยดเซรั่ม';
    const bText = this.plateState.antiBAdded ? (s.agB ? '🔴 ตกตะกอน (+)' : '⚪ ไม่ตกตะกอน (-)') : 'ยังไม่หยดเซรั่ม';
    const rhText = this.plateState.antiRhAdded ? (s.agRh ? '🔴 ตกตะกอน (+)' : '⚪ ไม่ตกตะกอน (-)') : 'ยังไม่หยดเซรั่ม';

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '22px sans-serif';
    ctx.fillText(`ผลหลุม A (Anti-A): ${aText}`, 35, 150);
    ctx.fillText(`ผลหลุม B (Anti-B): ${bText}`, 35, 185);
    ctx.fillText(`ผลหลุม Rh (Anti-D): ${rhText}`, 35, 220);

    const isAllTested = this.plateState.antiAAdded && this.plateState.antiBAdded && this.plateState.antiRhAdded;

    if (isAllTested) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(35, 255, w - 70, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`🎉 วินิจฉัย: หมู่เลือด ${s.type}`, 55, 305);

      // Transfusion details
      ctx.fillStyle = '#f8fafc';
      ctx.font = '22px sans-serif';
      ctx.fillText(`• แอนติเจนบนเซลล์: ${s.antigens} | แอนติบอดีในน้ำเลือด: ${s.antibodies}`, 35, 365);
      ctx.fillText(`• สามารถให้เลือดแก่: ${s.giveTo}`, 35, 405);
      ctx.fillText(`• สามารถรับเลือดจาก: ${s.getFrom}`, 35, 445);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('👉 ขั้นตอนที่ 2: คลิก "ขวด Anti-A, Anti-B, Anti-Rh" ทางขวา เพื่อหยดเซรั่มลงแต่ละหลุมให้ครบ', 35, 280);
    }

    this.infoTex.needsUpdate = true;
  }

  update(time) {
    // Subtle idle animation
  }

  handleClick(obj) {
    const data = obj.userData;
    if (data.isBloodSample) {
      this.addBloodSample(data.sampleIndex);
      return true;
    }
    if (data.isAntiSerum) {
      this.addSerum(data.serumType);
      return true;
    }
    if (data.isResetPlate) {
      this.resetPlate();
      return true;
    }
    if (data.isWellPlate) {
      if (!this.plateState.bloodAdded) {
        this.addBloodSample(this.currentSampleIndex);
      } else if (!this.plateState.antiAAdded) {
        this.addSerum('antiA');
      } else if (!this.plateState.antiBAdded) {
        this.addSerum('antiB');
      } else if (!this.plateState.antiRhAdded) {
        this.addSerum('antiRh');
      } else {
        this.resetPlate();
      }
      return true;
    }
    return false;
  }
}