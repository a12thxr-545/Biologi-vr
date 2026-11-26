import * as THREE from 'three';
import { BIOLOGY_DATA } from './quizData.js';
import { sound } from './audio.js';

export class MicroscopeStation {
  constructor(scene, basePosition = new THREE.Vector3(-2.2, 0.81, -2.4)) {
    this.scene = scene;
    this.basePosition = basePosition;
    this.group = new THREE.Group();
    this.group.position.copy(basePosition);
    this.scene.add(this.group);

    // State
    this.currentSpecimen = 'onion';
    this.currentStain = 'none';
    this.currentObjective = 10;
    this.focusValue = 48; // 50 is optimal focus
    this.lightOn = true;
    this.stagePanX = 0;
    this.stagePanY = 0;
    this.showMicrometer = false;
    this.diaphragm = 0.85;
    this.parameciumTime = 0;

    this.interactiveObjects = [];

    this.initDisplayCanvas();
    this.initMicroscopeModel();
    this.initSlideStation();
    this.initStainBottles();
    this.initLabNotebookOnDesk();
    this.updateMicroscopeDisplay();
  }

  initDisplayCanvas() {
    this.displayCanvas = document.createElement('canvas');
    this.displayCanvas.width = 1024;
    this.displayCanvas.height = 1024;
    this.displayCtx = this.displayCanvas.getContext('2d');
    this.displayTexture = new THREE.CanvasTexture(this.displayCanvas);
  }

  initMicroscopeModel() {
    this.microGroup = new THREE.Group();
    this.microGroup.position.set(0, 0, 0);

    // 1. Heavy Metal Base (Black cast iron with rubber feet)
    const baseGeo = new THREE.BoxGeometry(0.36, 0.05, 0.44);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.35, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.025;
    this.microGroup.add(base);

    // Power Toggle Switch on side of base
    const switchGeo = new THREE.BoxGeometry(0.04, 0.02, 0.03);
    const switchMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    this.powerSwitch = new THREE.Mesh(switchGeo, switchMat);
    this.powerSwitch.position.set(0.182, 0.03, 0.12);
    this.powerSwitch.userData = { isPowerSwitch: true, name: 'สวิตช์ไฟกล้องจุลทรรศน์ (คลิกเพื่อเปิด/ปิด)' };
    this.interactiveObjects.push(this.powerSwitch);
    this.microGroup.add(this.powerSwitch);

    // Illuminator Lamp Housing
    const lightSource = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.054, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x333b48, metalness: 0.7 })
    );
    lightSource.position.set(0, 0.065, 0.04);
    this.microGroup.add(lightSource);

    // Condenser lens glowing
    this.condenserMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.015, 24), this.condenserMat);
    condenser.position.set(0, 0.085, 0.04);
    this.microGroup.add(condenser);

    // 2. Curved Arm
    const armMat = new THREE.MeshStandardMaterial({ color: 0x2b333e, roughness: 0.3, metalness: 0.6 });
    this.arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.1), armMat);
    this.arm.position.set(0, 0.29, -0.14);
    this.arm.userData = { isEyepiece: true, name: 'กล้องจุลทรรศน์ (คลิกเพื่อก้มส่องเลนส์ใกล้ตา)' };
    this.interactiveObjects.push(this.arm);
    this.microGroup.add(this.arm);

    const overArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.26), armMat);
    overArm.position.set(0, 0.52, -0.04);
    overArm.userData = { isEyepiece: true, name: 'กล้องจุลทรรศน์ (คลิกเพื่อก้มส่องเลนส์ใกล้ตา)' };
    this.interactiveObjects.push(overArm);
    this.microGroup.add(overArm);

    // 3. Moveable Mechanical Stage Group
    this.stageGroup = new THREE.Group();
    this.baseStageY = 0.24;
    this.stageGroup.position.set(0, this.baseStageY, 0.04);

    const stageMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.4, metalness: 0.5 });
    this.stage = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.25), stageMat);
    this.stageGroup.add(this.stage);

    this.stageHoleMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
    const stageHole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.025, 16), this.stageHoleMat);
    this.stageGroup.add(stageHole);

    // Slide clips
    [-0.08, 0.08].forEach(cx => {
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.008, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9 })
      );
      clip.position.set(cx, 0.015, 0);
      this.stageGroup.add(clip);
    });

    // Active Slide on Stage
    const slideGeo = new THREE.BoxGeometry(0.12, 0.006, 0.045);
    const slideMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 });
    this.activeSlideMesh = new THREE.Mesh(slideGeo, slideMat);
    this.activeSlideMesh.position.set(0, 0.014, 0);
    this.activeSlideMesh.userData = { isEyepiece: true, name: 'สไลด์บนแท่นวาง (คลิกเพื่อก้มส่องเซลล์)' };
    this.interactiveObjects.push(this.activeSlideMesh);
    this.stageGroup.add(this.activeSlideMesh);

    // Specimen spot on slide
    this.spotMat = new THREE.MeshBasicMaterial({ color: 0xa3e635, side: THREE.DoubleSide });
    this.spotMesh = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), this.spotMat);
    this.spotMesh.rotation.x = -Math.PI / 2;
    this.spotMesh.position.set(0, 0.018, 0);
    this.stageGroup.add(this.spotMesh);

    this.microGroup.add(this.stageGroup);

    // 4. Focus Knobs (Coarse & Fine)
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.3, metalness: 0.7 });
    this.coarseKnobMeshes = [];
    this.fineKnobMeshes = [];

    [-0.065, 0.065].forEach(kx => {
      const knobCoarse = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 20), knobMat);
      knobCoarse.rotation.z = Math.PI / 2;
      knobCoarse.position.set(kx, 0.22, -0.14);
      knobCoarse.userData = { isKnob: true, type: 'coarse', name: 'ปุ่มปรับภาพหยาบ (Coarse Focus)' };
      this.microGroup.add(knobCoarse);
      this.interactiveObjects.push(knobCoarse);
      this.coarseKnobMeshes.push(knobCoarse);

      const knobFine = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.035, 20), knobMat);
      knobFine.rotation.z = Math.PI / 2;
      knobFine.position.set(kx * 1.35, 0.22, -0.14);
      knobFine.userData = { isKnob: true, type: 'fine', name: 'ปุ่มปรับภาพละเอียด (Fine Focus)' };
      this.microGroup.add(knobFine);
      this.interactiveObjects.push(knobFine);
      this.fineKnobMeshes.push(knobFine);
    });

    // 5. Revolving Nosepiece
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.9, roughness: 0.2 });
    this.nosepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.02, 24), noseMat);
    this.nosepiece.position.set(0, 0.39, 0.04);
    this.nosepiece.userData = { isNosepiece: true, name: 'แป้นเปลี่ยนเลนส์ใกล้วัตถุ (คลิกเพื่อหมุน 4x/10x/40x/100x)' };
    this.interactiveObjects.push(this.nosepiece);
    this.microGroup.add(this.nosepiece);

    // 4 Objectives
    this.objectives = [
      { mag: 4, color: 0xef4444, length: 0.042, angle: 0 },
      { mag: 10, color: 0xf59e0b, length: 0.058, angle: Math.PI / 2 },
      { mag: 40, color: 0x3b82f6, length: 0.078, angle: Math.PI },
      { mag: 100, color: 0xffffff, length: 0.095, angle: -Math.PI / 2 }
    ];

    this.objectives.forEach(obj => {
      const objGroup = new THREE.Group();
      const lensBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.016, obj.length, 16),
        new THREE.MeshStandardMaterial({ color: 0x2f3640, metalness: 0.85 })
      );
      lensBody.position.y = -obj.length / 2;
      objGroup.add(lensBody);

      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0165, 0.0165, 0.008, 16),
        new THREE.MeshBasicMaterial({ color: obj.color })
      );
      ring.position.y = -obj.length * 0.4;
      objGroup.add(ring);

      const rad = 0.038;
      objGroup.position.set(Math.cos(obj.angle) * rad, 0, Math.sin(obj.angle) * rad);
      this.nosepiece.add(objGroup);
    });

    // 6. Binocular Eyepiece Head (The actual ocular tubes where the player looks!)
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.08, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2f3640, metalness: 0.7 })
    );
    head.position.set(0, 0.58, 0.02);
    head.rotation.x = -Math.PI / 6;
    head.userData = { isEyepiece: true, name: 'เลนส์ใกล้ตา (คลิกเพื่อก้มส่องกล้อง)' };
    this.microGroup.add(head);
    this.interactiveObjects.push(head);

    [-0.035, 0.035].forEach(ox => {
      const ep = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.09, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e272e, metalness: 0.8 })
      );
      ep.position.set(ox, 0.65, 0.06);
      ep.rotation.x = -Math.PI / 6;
      ep.userData = { isEyepiece: true, name: 'เลนส์ใกล้ตา (คลิกเพื่อก้มส่องกล้อง)' };
      this.microGroup.add(ep);
      this.interactiveObjects.push(ep);

      // Real optical lens inside eyepiece reflecting live specimen projection
      const ocularLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.015, 24),
        new THREE.MeshBasicMaterial({ map: this.displayTexture, side: THREE.DoubleSide })
      );
      ocularLens.position.set(ox, 0.69, 0.082);
      ocularLens.rotation.x = -Math.PI / 6;
      ocularLens.userData = { isEyepiece: true, name: 'เลนส์ใกล้ตา (คลิกเพื่อก้มส่องกล้อง)' };
      this.microGroup.add(ocularLens);
      this.interactiveObjects.push(ocularLens);
    });

    this.group.add(this.microGroup);
  }

  initSlideStation() {
    // Wooden specimen slide box on the desk to the left
    const boxGeo = new THREE.BoxGeometry(0.38, 0.04, 0.26);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.5 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-0.55, 0.02, 0);
    this.group.add(box);

    const specimens = [
      { id: 'onion', name: 'สไลด์: เซลล์เยื่อหอม (Onion)', color: 0xa3e635, posZ: -0.08 },
      { id: 'cheek', name: 'สไลด์: เซลล์เยื่อบุแก้ม (Cheek)', color: 0x60a5fa, posZ: -0.025 },
      { id: 'blood', name: 'สไลด์: เลือดมนุษย์ (Blood)', color: 0xf87171, posZ: 0.025 },
      { id: 'paramecium', name: 'สไลด์: พารามีเซียม (Living)', color: 0x34d399, posZ: 0.08 }
    ];

    specimens.forEach(sp => {
      const sGroup = new THREE.Group();
      sGroup.position.set(-0.55, 0.045, sp.posZ);

      const sMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.008, 0.038),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, transparent: true, opacity: 0.85 })
      );
      sGroup.add(sMesh);

      // Label on slide
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sp.name.split(':')[1], 128, 40);

      const tex = new THREE.CanvasTexture(canvas);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), new THREE.MeshBasicMaterial({ map: tex }));
      label.rotation.x = -Math.PI / 2;
      label.position.set(-0.04, 0.005, 0);
      sGroup.add(label);

      // Dot
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: sp.color, side: THREE.DoubleSide }));
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(0.06, 0.006, 0);
      sGroup.add(dot);

      sMesh.userData = { isSlidePick: true, specimenId: sp.id, name: `${sp.name} (คลิกเพื่อวางบนแท่นกล้อง)` };
      this.interactiveObjects.push(sMesh);
      this.group.add(sGroup);
    });
  }

  initStainBottles() {
    // Dropper Bottles Stand to the right of the microscope
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.02, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 })
    );
    stand.position.set(0.5, 0.01, 0);
    this.group.add(stand);

    // Bottle 1: Iodine
    this.createStainBottle(new THREE.Vector3(0.44, 0.02, 0), 0x78350f, 'ไอโอดีน (Iodine)', 'iodine');

    // Bottle 2: Methylene Blue
    this.createStainBottle(new THREE.Vector3(0.56, 0.02, 0), 0x1e3a8a, 'เมทิลีนบลู (M. Blue)', 'methyleneBlue');
  }

  createStainBottle(pos, color, labelText, stainId) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.035, 0.09, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.2, transparent: true, opacity: 0.85 })
    );
    body.position.y = 0.045;
    group.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 16), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    cap.position.y = 0.1;
    group.add(cap);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    bulb.position.y = 0.12;
    group.add(bulb);

    const clickName = `ขวดสารย้อมสี: ${labelText} (คลิกเพื่อหยดใส่สไลด์)`;
    body.userData = { isStainBottle: true, stainId, name: clickName };
    bulb.userData = { isStainBottle: true, stainId, name: clickName };
    this.interactiveObjects.push(body);
    this.interactiveObjects.push(bulb);

    this.group.add(group);
  }

  initLabNotebookOnDesk() {
    // Open Student Lab Notebook sitting on the desk
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.02, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
    );
    book.position.set(-0.55, 0.01, 0.35);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 368);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('📖 สมุดปฏิบัติการชีววิทยา', 30, 45);

    ctx.fillStyle = '#334155';
    ctx.font = '18px sans-serif';
    ctx.fillText('• ขั้นที่ 1: คลิกสไลด์จากกล่องเพื่อวางบนแท่น', 30, 95);
    ctx.fillText('• ขั้นที่ 2: คลิกขวดสีย้อมเพื่อหยดลงบนสไลด์', 30, 135);
    ctx.fillText('• ขั้นที่ 3: คลิกที่เลนส์ใกล้ตาเพื่อก้มส่อง', 30, 175);
    ctx.fillText('• ขั้นที่ 4: หมุนลูกกลิ้งเมาส์ปรับโฟกัสให้ชัด', 30, 215);
    ctx.fillText('• ขั้นที่ 5: ลากเมาส์เลื่อนสไลด์สำรวจเซลล์', 30, 255);
    ctx.fillText('• กด [S] หรือ [Esc] เพื่อถอยกลับมายืนในห้องเรียน', 30, 315);

    const tex = new THREE.CanvasTexture(canvas);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), new THREE.MeshBasicMaterial({ map: tex }));
    page.rotation.x = -Math.PI / 2;
    page.position.y = 0.012;
    book.add(page);

    book.userData = { isNotebook: true, name: 'สมุดปฏิบัติการชีววิทยา' };
    this.interactiveObjects.push(book);

    this.group.add(book);
  }

  setSpecimen(specimenId) {
    if (!BIOLOGY_DATA.specimens[specimenId]) return;
    this.currentSpecimen = specimenId;
    this.currentStain = 'none';
    this.focusValue = 46 + (Math.random() * 8 - 4);
    sound.playClick();
    this.updateSpotColor();
    this.updateMicroscopeDisplay();
  }

  applyStain(stainId) {
    this.currentStain = stainId;
    sound.playLiquidDrop();
    this.updateSpotColor();
    this.updateMicroscopeDisplay();
  }

  cycleObjective() {
    const mags = [4, 10, 40, 100];
    const nextIdx = (mags.indexOf(this.currentObjective) + 1) % mags.length;
    this.currentObjective = mags[nextIdx];

    this.nosepiece.rotation.y = (nextIdx * Math.PI) / 2;
    sound.playMechanicalKnob();

    this.focusValue = 46 + (Math.random() * 8 - 4);
    this.updateMicroscopeDisplay();
    return this.currentObjective;
  }

  adjustFocus(delta) {
    this.focusValue = Math.max(0, Math.min(100, this.focusValue + delta));
    sound.playMechanicalKnob();

    const heightOffset = ((this.focusValue - 50) / 50) * 0.015;
    this.stageGroup.position.y = this.baseStageY + heightOffset;

    const knobRot = (delta / 10) * Math.PI;
    this.coarseKnobMeshes.forEach(k => (k.rotation.x += knobRot));
    this.fineKnobMeshes.forEach(k => (k.rotation.x += knobRot * 3));

    this.updateMicroscopeDisplay();
  }

  togglePower() {
    this.lightOn = !this.lightOn;
    sound.playClick();
    this.condenserMat.color.setHex(this.lightOn ? 0xffffff : 0x222222);
    this.stageHoleMat.color.setHex(this.lightOn ? 0xffeeaa : 0x222222);
    this.powerSwitch.material.color.setHex(this.lightOn ? 0x22c55e : 0xef4444);
    this.updateMicroscopeDisplay();
    return this.lightOn;
  }

  panStage(dx, dy) {
    this.stagePanX = Math.max(-280, Math.min(280, this.stagePanX + dx));
    this.stagePanY = Math.max(-280, Math.min(280, this.stagePanY + dy));
    this.updateMicroscopeDisplay();
  }

  toggleMicrometer() {
    this.showMicrometer = !this.showMicrometer;
    sound.playClick();
    this.updateMicroscopeDisplay();
    return this.showMicrometer;
  }

  setDiaphragm(val) {
    this.diaphragm = Math.max(0.2, Math.min(1.0, val));
    this.updateMicroscopeDisplay();
  }

  updateSpotColor() {
    let color = 0xa3e635;
    if (this.currentSpecimen === 'blood') color = 0xef4444;
    else if (this.currentSpecimen === 'cheek') color = 0x38bdf8;
    else if (this.currentSpecimen === 'paramecium') color = 0x10b981;

    if (this.currentStain === 'iodine') color = 0xd97706;
    else if (this.currentStain === 'methyleneBlue') color = 0x2563eb;

    this.spotMat.color.setHex(color);
  }

  renderMicroscopicView() {
    const ctx = this.displayCtx;
    const w = this.displayCanvas.width;
    const h = this.displayCanvas.height;

    if (!this.lightOn) {
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💡 ไฟส่องกล้องปิดอยู่ (คลิกที่สวิตช์ไฟที่ฐานกล้องเพื่อเปิดไฟ)', w / 2, h / 2);
      return;
    }

    const spData = BIOLOGY_DATA.specimens[this.currentSpecimen];
    const stainEffect = spData.stainEffects[this.currentStain] || spData.stainEffects.none;
    const focusError = Math.abs(this.focusValue - 50);
    const blurRadius = (focusError / 50) * 16;

    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.46, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = stainEffect.tint;
    ctx.fillRect(0, 0, w, h);

    const dimAlpha = Math.max(0, 1.0 - this.diaphragm);
    if (dimAlpha > 0.05) {
      ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.filter = blurRadius > 0.5 ? `blur(${blurRadius.toFixed(1)}px)` : 'none';

    // Mechanical Stage Translation
    ctx.save();
    ctx.translate(this.stagePanX, this.stagePanY);

    const mag = this.currentObjective;
    if (this.currentSpecimen === 'onion') {
      this.drawOnionCells(ctx, w, h, mag, stainEffect);
    } else if (this.currentSpecimen === 'cheek') {
      this.drawCheekCells(ctx, w, h, mag, stainEffect);
    } else if (this.currentSpecimen === 'blood') {
      this.drawBloodSmear(ctx, w, h, mag, stainEffect);
    } else if (this.currentSpecimen === 'paramecium') {
      this.drawParamecium(ctx, w, h, mag, stainEffect);
    }

    ctx.restore();

    if (this.showMicrometer) {
      this.drawMicrometerRuler(ctx, w, h, mag);
    }

    ctx.restore();
    ctx.filter = 'none';

    // Lens Outer Ring
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 40, h / 2);
    ctx.lineTo(w / 2 + 40, h / 2);
    ctx.moveTo(w / 2, h / 2 - 40);
    ctx.lineTo(w / 2, h / 2 + 40);
    ctx.stroke();
  }

  drawMicrometerRuler(ctx, w, h, mag) {
    const rx = w / 2 - 150;
    const ry = h / 2 + 130;
    ctx.strokeStyle = '#f8fafc';
    ctx.fillStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.font = 'bold 13px monospace';

    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 300, ry);
    ctx.stroke();

    const umTotal = mag === 4 ? 500 : mag === 10 ? 200 : mag === 40 ? 50 : 20;
    const ticks = 10;
    for (let t = 0; t <= ticks; t++) {
      const tx = rx + (t / ticks) * 300;
      const th = t % 5 === 0 ? 16 : 8;
      ctx.beginPath();
      ctx.moveTo(tx, ry - th);
      ctx.lineTo(tx, ry);
      ctx.stroke();

      if (t % 5 === 0) {
        ctx.textAlign = 'center';
        ctx.fillText(`${(t / ticks * umTotal).toFixed(0)}µm`, tx, ry + 18);
      }
    }
  }

  drawOnionCells(ctx, w, h, mag, stain) {
    const scale = (mag / 10) * 1.25;
    const cellW = 140 * scale;
    const cellH = 65 * scale;
    const cols = Math.ceil(w / cellW) + 4;
    const rows = Math.ceil(h / cellH) + 4;

    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = 4 * scale;

    for (let r = -2; r < rows; r++) {
      const offsetX = (r % 2) * (cellW * 0.4);
      for (let c = -2; c < cols; c++) {
        const cx = c * cellW - 100 + offsetX;
        const cy = r * cellH - 50;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.fillRect(cx, cy, cellW - 4, cellH - 4);
        ctx.strokeRect(cx, cy, cellW - 4, cellH - 4);

        ctx.strokeStyle = 'rgba(100, 150, 100, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy + 10);
        ctx.lineTo(cx + cellW - 15, cy + cellH - 15);
        ctx.stroke();

        const nucX = cx + cellW * 0.78;
        const nucY = cy + cellH * 0.35;
        const nucRadius = 12 * scale;

        ctx.fillStyle = this.currentStain === 'iodine'
          ? `rgba(180, 83, 9, ${stain.nucleusVisibility})`
          : `rgba(37, 99, 235, ${stain.nucleusVisibility})`;

        ctx.beginPath();
        ctx.arc(nucX, nucY, nucRadius, 0, Math.PI * 2);
        ctx.fill();

        if (mag >= 40) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(nucX + 2, nucY - 1, 3.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawCheekCells(ctx, w, h, mag, stain) {
    const scale = (mag / 10);
    const cells = [
      { x: w * 0.48, y: h * 0.46, r: 120 * scale },
      { x: w * 0.35, y: h * 0.58, r: 95 * scale },
      { x: w * 0.62, y: h * 0.40, r: 110 * scale },
      { x: w * 0.52, y: h * 0.68, r: 80 * scale }
    ];

    cells.forEach(cell => {
      ctx.beginPath();
      const points = 12;
      for (let i = 0; i < points; i++) {
        const ang = (i / points) * Math.PI * 2;
        const dist = cell.r * (0.85 + Math.sin(i * 3 + cell.x) * 0.15);
        const px = cell.x + Math.cos(ang) * dist;
        const py = cell.y + Math.sin(ang) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = 'rgba(190, 220, 250, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(50, 90, 160, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const nucR = 20 * scale;
      ctx.fillStyle = this.currentStain === 'methyleneBlue'
        ? `rgba(29, 78, 216, ${stain.nucleusVisibility})`
        : `rgba(100, 116, 139, ${stain.nucleusVisibility})`;

      ctx.beginPath();
      ctx.arc(cell.x, cell.y, nucR, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawBloodSmear(ctx, w, h, mag, stain) {
    const scale = (mag / 10);
    const rbcRadius = 18 * scale;
    const count = mag === 4 ? 400 : mag === 10 ? 150 : 50;

    for (let i = 0; i < count; i++) {
      const rx = (Math.sin(i * 99) * 0.5 + 0.5) * (w * 0.8) + w * 0.1;
      const ry = (Math.cos(i * 37) * 0.5 + 0.5) * (h * 0.8) + h * 0.1;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.beginPath();
      ctx.arc(rx, ry, rbcRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 202, 202, 0.85)';
      ctx.beginPath();
      ctx.arc(rx, ry, rbcRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    const wbcX = w * 0.5;
    const wbcY = h * 0.5;
    const wbcR = rbcRadius * 1.8;

    ctx.fillStyle = 'rgba(224, 231, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(wbcX, wbcY, wbcR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(109, 40, 217, ${stain.nucleusVisibility})`;
    [
      { x: -wbcR * 0.35, y: -wbcR * 0.25, r: wbcR * 0.35 },
      { x: wbcR * 0.25, y: -wbcR * 0.3, r: wbcR * 0.32 },
      { x: wbcR * 0.1, y: wbcR * 0.3, r: wbcR * 0.38 }
    ].forEach(l => {
      ctx.beginPath();
      ctx.arc(wbcX + l.x, wbcY + l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawParamecium(ctx, w, h, mag, stain) {
    this.parameciumTime += 0.05;
    const scale = (mag / 10);
    const px = w * 0.5 + Math.sin(this.parameciumTime * 0.5) * 40;
    const py = h * 0.5 + Math.cos(this.parameciumTime * 0.4) * 30;
    const len = 220 * scale;
    const wid = 70 * scale;
    const ang = Math.sin(this.parameciumTime * 0.3) * 0.4;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);

    ctx.strokeStyle = 'rgba(100, 200, 120, 0.6)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 60; c++) {
      const ca = (c / 60) * Math.PI * 2;
      const cdx = (Math.cos(ca) * len) / 2;
      const cdy = (Math.sin(ca) * wid) / 2;
      const wave = Math.sin(this.parameciumTime * 5 + c) * 6;
      ctx.beginPath();
      ctx.moveTo(cdx, cdy);
      ctx.lineTo(cdx + Math.cos(ca) * (8 + wave), cdy + Math.sin(ca) * (8 + wave));
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(187, 247, 208, 0.65)';
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = `rgba(30, 64, 175, ${stain.nucleusVisibility})`;
    ctx.beginPath();
    ctx.ellipse(-len * 0.05, -wid * 0.05, 26 * scale, 16 * scale, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  updateMicroscopeDisplay() {
    this.renderMicroscopicView();
    this.displayTexture.needsUpdate = true;
  }

  update(time) {
    if (this.currentSpecimen === 'paramecium' && this.lightOn) {
      this.updateMicroscopeDisplay();
    }
  }

  handleClick(intersectedObj) {
    const data = intersectedObj.userData;
    if (data.isEyepiece) {
      return 'toggle_eyepiece';
    }
    if (data.isPowerSwitch) {
      this.togglePower();
      return true;
    }
    if (data.isSlidePick) {
      this.setSpecimen(data.specimenId);
      return true;
    }
    if (data.isStainBottle) {
      this.applyStain(data.stainId);
      return true;
    }
    if (data.isNosepiece) {
      this.cycleObjective();
      return true;
    }
    if (data.isKnob) {
      const delta = data.type === 'coarse' ? 10 : 2;
      this.adjustFocus(this.focusValue > 50 ? -delta : delta);
      return true;
    }
    return false;
  }
}
