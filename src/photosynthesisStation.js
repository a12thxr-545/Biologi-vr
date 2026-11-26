import * as THREE from 'three';
import { sound } from './audio.js';

export class PhotosynthesisStation {
  constructor(scene, basePosition = new THREE.Vector3(-2.2, 0.81, 1.8)) {
    this.scene = scene;
    this.basePosition = basePosition;
    this.group = new THREE.Group();
    this.group.position.copy(basePosition);
    this.scene.add(this.group);

    // Experiment State
    this.lampOn = true;
    this.filterIndex = 0; // 0: White, 1: Red (660nm), 2: Blue (430nm), 3: Green (520nm)
    this.filters = [
      { id: 'white', name: 'แสงสีขาว (Full Spectrum)', color: 0xffffff, lightHex: 0xfff8ee, rate: 38, desc: 'แสงแดด/หลอดไฟปกติ คลอโรฟิลล์ดูดกลืนได้ทุกช่วงแสง' },
      { id: 'red', name: 'แสงสีแดง (Red 660 nm)', color: 0xef4444, lightHex: 0xff4444, rate: 52, desc: 'จุดดูดกลืนสูงสุดของ Chlorophyll a & b (เกิดสังเคราะห์แสงสูงที่สุด)' },
      { id: 'blue', name: 'แสงสีน้ำเงิน (Blue 430 nm)', color: 0x3b82f6, lightHex: 0x3b82f6, rate: 44, desc: 'พลังงานโฟตอนสูง กระตุ้นปฏิกิริยาแสง (Light Reaction) ได้อย่างมีประสิทธิภาพ' },
      { id: 'green', name: 'แสงสีเขียว (Green 520 nm)', color: 0x22c55e, lightHex: 0x22c55e, rate: 4, desc: 'คลอโรฟิลล์สะท้อนแสงสีเขียว ไม่ดูดกลืน ทำให้การสังเคราะห์แสงเกือบหยุดนิ่ง!' }
    ];

    this.distanceIndex = 1; // 0: 10cm (High), 1: 25cm (Med), 2: 50cm (Low)
    this.distances = [
      { label: 'ใกล้ (10 cm)', factor: 1.35, lampX: -0.42 },
      { label: 'ปานกลาง (25 cm)', factor: 1.0, lampX: -0.58 },
      { label: 'ไกล (50 cm)', factor: 0.55, lampX: -0.78 }
    ];

    this.accumulatedGas = 0.2; // mL of O2 gas (0.0 to 3.0)
    this.bubbleTimer = 0;
    this.totalBubblesCount = 0;
    this.bubbles = [];

    this.interactiveObjects = [];

    this.initStation();
  }

  initStation() {
    // 1. Waterproof Lab Tray Stand
    const trayGeo = new THREE.BoxGeometry(2.1, 0.03, 0.92);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.y = 0.015;
    this.group.add(tray);

    // 2. Glass Beaker with Funnel, Live Hydrilla & Collection Tube
    this.createApparatus();

    // 3. Adjustable Lab Desk Lamp
    this.createLamp();

    // 4. Glowing Wooden Splint (Gas Identification Test)
    this.createSplintTester();

    // 5. Digital Lab Monitor Screen
    this.createMonitor();
  }

  createApparatus() {
    this.appGroup = new THREE.Group();
    this.appGroup.position.set(0, 0.03, 0);

    // Glass Beaker (Transparent Cylinder)
    const beakerGeo = new THREE.CylinderGeometry(0.18, 0.17, 0.36, 32, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.08,
      transmission: 0.85,
      side: THREE.DoubleSide
    });
    const beaker = new THREE.Mesh(beakerGeo, glassMat);
    beaker.position.y = 0.18;
    beaker.userData = { isBeakerApp: true, name: 'บีกเกอร์สารละลาย 0.5% NaHCO3 (คาร์บอนไดออกไซด์สำหรับพืช)' };
    this.interactiveObjects.push(beaker);
    this.appGroup.add(beaker);

    // Beaker Bottom
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), glassMat);
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = 0.005;
    this.appGroup.add(bot);

    // Water Solution inside Beaker
    const waterGeo = new THREE.CylinderGeometry(0.168, 0.165, 0.32, 32);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    });
    const water = new THREE.Mesh(waterGeo, this.waterMat);
    water.position.y = 0.16;
    this.appGroup.add(water);

    // Inverted Glass Funnel
    const funnelCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.12, 24, 1, true),
      glassMat
    );
    funnelCone.rotation.x = Math.PI;
    funnelCone.position.set(0, 0.08, 0);
    this.appGroup.add(funnelCone);

    // Funnel Stem
    const funnelStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.1, 16, 1, true),
      glassMat
    );
    funnelStem.position.set(0, 0.19, 0);
    this.appGroup.add(funnelStem);

    // Live Hydrilla Verticillata Plant sprigs inside the funnel
    const plantGroup = new THREE.Group();
    plantGroup.position.set(0, 0.04, 0);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4, side: THREE.DoubleSide });

    // Main stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.14, 8), stemMat);
    stem.position.y = 0.07;
    plantGroup.add(stem);

    // Leaves arranged in whorls of 4-5
    for (let h = 0.02; h <= 0.12; h += 0.02) {
      for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI * 2 + (h * 5);
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.012), leafMat);
        leaf.position.set(Math.cos(ang) * 0.02, h, Math.sin(ang) * 0.02);
        leaf.rotation.y = ang;
        leaf.rotation.z = 0.3;
        plantGroup.add(leaf);
      }
    }
    plantGroup.userData = { isPlant: true, name: 'สาหร่ายหางกระรอก (Hydrilla Verticillata) พืชสังเคราะห์ด้วยแสง' };
    this.interactiveObjects.push(plantGroup);
    this.appGroup.add(plantGroup);

    // Inverted Test Tube over the funnel stem (Collects O2 gas)
    const tubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 16, 1, true);
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.position.set(0, 0.3, 0);
    tube.userData = { isTestTube: true, name: 'หลอดทดลองดักเก็บก๊าซออกซิเจน (O2) - คลิกเพื่อทดสอบก๊าซ' };
    this.interactiveObjects.push(tube);
    this.appGroup.add(tube);

    // Gas pocket mesh in top of tube
    this.gasPocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.05, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    this.gasPocket.position.set(0, 0.38, 0);
    this.appGroup.add(this.gasPocket);

    // Pre-create Oxygen Bubble Mesh Pool
    const bubbleGeo = new THREE.SphereGeometry(0.006, 8, 8);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1
    });

    for (let b = 0; b < 25; b++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.visible = false;
      this.appGroup.add(bubble);
      this.bubbles.push(bubble);
    }

    this.group.add(this.appGroup);
  }

  createLamp() {
    this.lampGroup = new THREE.Group();
    this.updateLampPosition();

    // Heavy Metal Base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.1, 0.03, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    base.position.y = 0.015;
    this.lampGroup.add(base);

    // Power Toggle Switch on base
    this.lampSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.02, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    this.lampSwitch.position.set(0, 0.035, 0.06);
    this.lampSwitch.userData = { isLampSwitch: true, name: 'สวิตช์ไฟตะเกียง (คลิกเพื่อเปิด/ปิดไฟ)' };
    this.interactiveObjects.push(this.lampSwitch);
    this.lampGroup.add(this.lampSwitch);

    // Gooseneck Flexible Arm
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
    );
    arm.position.set(0, 0.18, 0);
    this.lampGroup.add(arm);

    // Lamp Shade & Bulb Housing (Angled toward the beaker)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.34, 0);
    headGroup.rotation.z = -Math.PI / 4; // Angle toward apparatus

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.14, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, side: THREE.DoubleSide })
    );
    shade.rotation.x = Math.PI;
    headGroup.add(shade);

    // Colored Filter Disc on front of shade
    this.filterDiscMat = new THREE.MeshBasicMaterial({
      color: this.filters[this.filterIndex].color,
      transparent: true,
      opacity: 0.8
    });
    this.filterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), this.filterDiscMat);
    this.filterDisc.position.y = 0.07;
    this.filterDisc.rotation.x = Math.PI / 2;
    this.filterDisc.userData = { isFilterDisc: true, name: 'แผ่นกรองแสงสี (คลิกเพื่อเปลี่ยน ขาว/แดง/น้ำเงิน/เขียว)' };
    this.interactiveObjects.push(this.filterDisc);
    headGroup.add(this.filterDisc);

    // Light Source (PointLight illuminates apparatus cleanly without target binding issues)
    this.spotLight = new THREE.PointLight(this.filters[this.filterIndex].lightHex, 1.8, 3.0);
    this.spotLight.position.set(0, 0.05, 0);
    headGroup.add(this.spotLight);

    // Light Beam Cone Effect
    this.beamMat = new THREE.MeshBasicMaterial({
      color: this.filters[this.filterIndex].color,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    this.beam = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 20, 1, true), this.beamMat);
    this.beam.position.y = 0.35;
    this.beam.rotation.x = Math.PI;
    headGroup.add(this.beam);

    this.lampGroup.add(headGroup);

    // Distance Toggle Stand Peg
    const distPeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.03, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    distPeg.position.set(0, 0.02, -0.09);
    distPeg.userData = { isDistanceToggle: true, name: 'ปรับระยะห่างหลอดไฟ (คลิกเพื่อเปลี่ยน ใกล้ 10cm / กลาง 25cm / ไกล 50cm)' };
    this.interactiveObjects.push(distPeg);
    this.lampGroup.add(distPeg);

    this.group.add(this.lampGroup);
  }

  updateLampPosition() {
    const d = this.distances[this.distanceIndex];
    this.lampGroup.position.set(d.lampX, 0.03, 0);
  }

  createSplintTester() {
    // Rack for wood splints
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    rack.position.set(0.48, 0.02, -0.2);
    this.group.add(rack);

    // Glowing Wood Splint
    this.splintGroup = new THREE.Group();
    this.splintGroup.position.set(0.48, 0.05, -0.2);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    stick.rotation.z = Math.PI / 4;
    this.splintGroup.add(stick);

    // Glowing Ember Tip
    this.emberMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.emberTip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), this.emberMat);
    this.emberTip.position.set(-0.08, 0.08, 0);
    this.splintGroup.add(this.emberTip);

    // Flame (hidden initially)
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.9 });
    this.flame = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 12), this.flameMat);
    this.flame.position.set(-0.08, 0.11, 0);
    this.flame.visible = false;
    this.splintGroup.add(this.flame);

    stick.userData = { isSplint: true, name: 'ธูป/ก้านไม้ขีดติดไฟคุ (คลิกเพื่อทดสอบก๊าซออกซิเจน O2 ในหลอด)' };
    this.interactiveObjects.push(stick);

    this.group.add(this.splintGroup);
  }

  createMonitor() {
    this.infoCanvas = document.createElement('canvas');
    this.infoCanvas.width = 1024;
    this.infoCanvas.height = 512;
    this.infoCtx = this.infoCanvas.getContext('2d');
    this.infoTex = new THREE.CanvasTexture(this.infoCanvas);

    const screenMat = new THREE.MeshBasicMaterial({ map: this.infoTex });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), screenMat);
    screen.position.set(0.46, 0.45, 0.12);
    screen.rotation.y = -Math.PI / 8;
    this.group.add(screen);

    // Monitor stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    stand.position.set(0.46, 0.2, 0.12);
    this.group.add(stand);

    this.updateMonitor();
  }

  getCurrentRate() {
    if (!this.lampOn) return 0;
    const curFilter = this.filters[this.filterIndex];
    const curDist = this.distances[this.distanceIndex];
    return Math.round(curFilter.rate * curDist.factor);
  }

  cycleFilter() {
    this.filterIndex = (this.filterIndex + 1) % this.filters.length;
    const f = this.filters[this.filterIndex];
    sound.playClick();

    this.filterDiscMat.color.setHex(f.color);
    this.spotLight.color.setHex(f.lightHex);
    this.beamMat.color.setHex(f.color);

    this.updateMonitor();
  }

  cycleDistance() {
    this.distanceIndex = (this.distanceIndex + 1) % this.distances.length;
    sound.playMechanicalKnob();
    this.updateLampPosition();
    this.updateMonitor();
  }

  toggleLamp() {
    this.lampOn = !this.lampOn;
    sound.playClick();
    this.spotLight.intensity = this.lampOn ? 1.8 : 0;
    this.beam.visible = this.lampOn;
    this.lampSwitch.material.color.setHex(this.lampOn ? 0x22c55e : 0xef4444);
    this.updateMonitor();
  }

  testGasWithSplint() {
    // Flare flame with whoosh sound proving O2 supports combustion
    sound.playFlameFlare();
    this.flame.visible = true;
    this.emberMat.color.setHex(0xffff00);

    // Consume gas and reset
    this.accumulatedGas = 0.1;

    setTimeout(() => {
      this.flame.visible = false;
      this.emberMat.color.setHex(0xff3b30);
      this.updateMonitor();
    }, 1800);

    this.updateMonitor();
  }

  updateMonitor() {
    const ctx = this.infoCtx;
    const w = this.infoCanvas.width;
    const h = this.infoCanvas.height;
    const f = this.filters[this.filterIndex];
    const d = this.distances[this.distanceIndex];
    const rate = this.getCurrentRate();

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Glowing border
    ctx.strokeStyle = f.id === 'green' ? '#22c55e' : f.id === 'red' ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🌿 อัตราการสังเคราะห์ด้วยแสง (Photosynthesis Rate)', 35, 55);

    // Status Indicator
    ctx.fillStyle = this.lampOn ? '#10b981' : '#ef4444';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`สถานะโคมไฟ: ${this.lampOn ? '💡 เปิดทำงาน' : '⚫ ปิด'} | ความสว่าง: ${d.label}`, 35, 95);

    // Filter Spectrum
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`สเปกตรัมแสง: ${f.name}`, 35, 145);

    // Real-Time Bubble Rate
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`⚡ อัตราการเกิดฟอง O2: ${rate} ฟอง/นาที`, 35, 215);

    // Gas Collected
    ctx.fillStyle = '#38bdf8';
    ctx.font = '24px sans-serif';
    ctx.fillText(`ปริมาตรก๊าซ O2 สะสม: ${this.accumulatedGas.toFixed(2)} mL (รวมฟองทั้งหมด: ${this.totalBubblesCount})`, 35, 265);

    // Explanation Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(35, 290, w - 70, 150);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 290, w - 70, 150);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '22px sans-serif';
    ctx.fillText(`🔬 ผลการทดลอง: ${f.desc}`, 50, 335);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('สมการ: 6CO2 + 12H2O --(แสง & คลอโรฟิลล์)--> C6H12O6 + 6H2O + 6O2 ↑', 50, 380);
    ctx.fillText('🔥 คลิกที่ "ก้านไม้ขีดติดไฟคุ" เพื่อทดสอบก๊าซออกซิเจน (เปลวไฟจะลุกวาบขึ้นทันที)', 50, 415);

    this.infoTex.needsUpdate = true;
  }

  update(time) {
    const rate = this.getCurrentRate();
    if (rate > 0) {
      // Spawn bubbles based on rate (bubbles/min -> per sec)
      const interval = 60 / rate;
      this.bubbleTimer += 0.016;

      if (this.bubbleTimer >= interval) {
        this.bubbleTimer = 0;
        this.spawnBubble();
        this.totalBubblesCount++;
        this.accumulatedGas = Math.min(2.5, this.accumulatedGas + 0.01);
        if (Math.random() < 0.3) sound.playBubble();
        this.updateMonitor();
      }
    }

    // Animate active bubbles
    this.bubbles.forEach(b => {
      if (b.visible) {
        b.position.y += 0.003;
        b.position.x += Math.sin(time * 10 + b.id) * 0.0003;
        // Reach top of test tube -> pop
        if (b.position.y > 0.36) {
          b.visible = false;
        }
      }
    });

    // Gas pocket height reflects accumulated O2
    const gasScale = 0.5 + (this.accumulatedGas / 2.5) * 1.5;
    this.gasPocket.scale.set(1, gasScale, 1);
  }

  spawnBubble() {
    const inactive = this.bubbles.find(b => !b.visible);
    if (inactive) {
      inactive.position.set((Math.random() - 0.5) * 0.012, 0.14, (Math.random() - 0.5) * 0.012);
      inactive.visible = true;
    }
  }

  handleClick(obj) {
    const data = obj.userData;
    if (data.isFilterDisc) {
      this.cycleFilter();
      return true;
    }
    if (data.isDistanceToggle) {
      this.cycleDistance();
      return true;
    }
    if (data.isLampSwitch) {
      this.toggleLamp();
      return true;
    }
    if (data.isSplint || data.isTestTube) {
      this.testGasWithSplint();
      return true;
    }
    if (data.isPlant || data.isBeakerApp) {
      this.cycleFilter();
      return true;
    }
    return false;
  }
}