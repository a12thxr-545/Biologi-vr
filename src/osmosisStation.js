import * as THREE from 'three';
import { BIOLOGY_DATA } from './quizData.js';
import { sound } from './audio.js';

export class OsmosisStation {
  constructor(scene, basePosition = new THREE.Vector3(2.2, 0.81, -2.4)) {
    this.scene = scene;
    this.basePosition = basePosition;
    this.group = new THREE.Group();
    this.group.position.copy(basePosition);
    this.scene.add(this.group);

    this.cellType = 'animal'; // 'animal' (RBC) or 'plant' (Onion/Elodea)
    this.activeTonicity = 'hypotonic';
    this.solutePercent = 0.0; // 0.0% to 15.0% NaCl
    this.cellProgress = 1.0; // Osmotic reaction progress (0.0 to 1.0)

    this.interactiveObjects = [];
    this.waterParticles = [];

    this.initStation();
  }

  initStation() {
    // 1. Station Tray Platform
    const standGeo = new THREE.BoxGeometry(2.1, 0.03, 0.92);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x223042, metalness: 0.3, roughness: 0.4 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.015;
    this.group.add(stand);

    // 2. Control Bar (Animal vs Plant switch)
    this.createModeSelector();

    // 3. Three Realistic Glass Beakers
    this.createBeakers();

    // 4. Central 3D Observation Stage
    this.createCellStage();

    // 5. Aquaporin Molecular Lipid Bilayer Inset
    this.createAquaporinSimulation();

    // 6. Student Lab Pipette Rack & Reagent Bottles
    this.createPipetteRack();
  }

  createModeSelector() {
    const selGroup = new THREE.Group();
    selGroup.position.set(0, 0.08, 0.38);

    this.btnAnimal = this.createButton(
      new THREE.Vector3(-0.38, 0, 0),
      'เซลล์สัตว์ (RBC)',
      0xef4444,
      () => this.setCellType('animal')
    );
    selGroup.add(this.btnAnimal);

    this.btnPlant = this.createButton(
      new THREE.Vector3(0.38, 0, 0),
      'เซลล์พืช (Plant)',
      0x10b981,
      () => this.setCellType('plant')
    );
    selGroup.add(this.btnPlant);

    this.group.add(selGroup);
  }

  createButton(pos, label, colorHex, onClick) {
    const btnGroup = new THREE.Group();
    btnGroup.position.copy(pos);

    const geo = new THREE.BoxGeometry(0.52, 0.04, 0.12);
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.4, roughness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    btnGroup.add(mesh);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.1), new THREE.MeshBasicMaterial({ map: tex }));
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.y = 0.022;
    btnGroup.add(labelMesh);

    mesh.userData = { isOsmosisButton: true, action: onClick, name: `เปลี่ยนเซลล์ตัวอย่าง: ${label}` };
    this.interactiveObjects.push(mesh);
    return btnGroup;
  }

  createBeakers() {
    this.beakers = [
      { id: 'hypotonic', title: 'HYPOTONIC', sub: 'น้ำกลั่นบริสุทธิ์ (<300 mOsm)', x: -0.75, color: 0x38bdf8 },
      { id: 'isotonic', title: 'ISOTONIC', sub: '0.9% NaCl (~300 mOsm)', x: 0, color: 0x818cf8 },
      { id: 'hypertonic', title: 'HYPERTONIC', sub: '10% NaCl (>300 mOsm)', x: 0.75, color: 0xf59e0b }
    ];

    this.beakerMeshes = {};

    this.beakers.forEach(b => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0.04, -0.2);

      // Glass Beaker with graduation markings
      const beaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.17, 0.32, 24, 1, true),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.1, transmission: 0.75, side: THREE.DoubleSide })
      );
      beaker.position.y = 0.16;
      bGroup.add(beaker);

      const bot = new THREE.Mesh(
        new THREE.CircleGeometry(0.17, 24),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      bot.rotation.x = -Math.PI / 2;
      bot.position.y = 0.005;
      bGroup.add(bot);

      // Solution liquid inside
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.16, 0.24, 24),
        new THREE.MeshStandardMaterial({ color: b.color, transparent: true, opacity: 0.5, roughness: 0.1 })
      );
      liquid.position.y = 0.12;
      bGroup.add(liquid);

      // Indicator ring around base
      const ringMat = new THREE.MeshBasicMaterial({
        color: b.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: b.id === this.activeTonicity ? 1.0 : 0.25
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 32), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.008;
      bGroup.add(ring);

      // Beaker Label
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(4, 4, 248, 120);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.title, 128, 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = '17px sans-serif';
      ctx.fillText(b.sub, 128, 85);

      const tex = new THREE.CanvasTexture(canvas);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.16), new THREE.MeshBasicMaterial({ map: tex }));
      label.position.set(0, 0.08, 0.22);
      label.rotation.x = -Math.PI / 10;
      bGroup.add(label);

      beaker.userData = { isBeaker: true, tonicityId: b.id, name: `บีกเกอร์ ${b.title} (${b.sub}) - คลิกเพื่อทดลองสารละลายนี้` };
      liquid.userData = { isBeaker: true, tonicityId: b.id, name: `บีกเกอร์ ${b.title} (${b.sub}) - คลิกเพื่อทดลองสารละลายนี้` };
      this.interactiveObjects.push(beaker);
      this.interactiveObjects.push(liquid);

      this.beakerMeshes[b.id] = { group: bGroup, ring, ringMat };
      this.group.add(bGroup);
    });
  }

  createCellStage() {
    this.cellStageGroup = new THREE.Group();
    this.cellStageGroup.position.set(0, 0.65, -0.2);

    // Animal Cell Group
    this.animalCellGroup = new THREE.Group();
    const rbcGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 32);
    const pos = rbcGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 0.12 && Math.abs(y) > 0.01) {
        pos.setY(i, y * 0.35);
      }
    }
    rbcGeo.computeVertexNormals();

    this.animalCellMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.1 });
    this.animalCellMesh = new THREE.Mesh(rbcGeo, this.animalCellMat);
    this.animalCellGroup.add(this.animalCellMesh);

    // Lysis fragments
    this.fragments = [];
    for (let f = 0; f < 8; f++) {
      const frag = new THREE.Mesh(new THREE.TetrahedronGeometry(0.04), this.animalCellMat);
      frag.visible = false;
      this.animalCellGroup.add(frag);
      this.fragments.push(frag);
    }

    this.cellStageGroup.add(this.animalCellGroup);

    // Plant Cell Group
    this.plantCellGroup = new THREE.Group();
    const wallGeo = new THREE.BoxGeometry(0.36, 0.28, 0.28);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x15803d, wireframe: true, roughness: 0.4 });
    this.plantWallMesh = new THREE.Mesh(wallGeo, wallMat);
    this.plantCellGroup.add(this.plantWallMesh);

    const protoGeo = new THREE.BoxGeometry(0.34, 0.26, 0.26);
    this.plantProtoMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.3, transparent: true, opacity: 0.8 });
    this.plantProtoMesh = new THREE.Mesh(protoGeo, this.plantProtoMat);
    this.plantCellGroup.add(this.plantProtoMesh);

    const vacGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const vacMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    this.vacuoleMesh = new THREE.Mesh(vacGeo, vacMat);
    this.plantCellGroup.add(this.vacuoleMesh);

    this.plantCellGroup.visible = false;
    this.cellStageGroup.add(this.plantCellGroup);

    this.group.add(this.cellStageGroup);

    // Observation Board
    this.createObservationBoard();
  }

  createObservationBoard() {
    this.infoCanvas = document.createElement('canvas');
    this.infoCanvas.width = 1024;
    this.infoCanvas.height = 512;
    this.infoCtx = this.infoCanvas.getContext('2d');

    this.infoTex = new THREE.CanvasTexture(this.infoCanvas);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: this.infoTex }));
    board.position.set(0, 1.3, -0.5);
    this.group.add(board);

    this.updateObservationBoard();
  }

  createAquaporinSimulation() {
    this.aquaporinGroup = new THREE.Group();
    this.aquaporinGroup.position.set(0, 0.95, -0.15);

    const headGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });

    for (let x = -0.15; x <= 0.15; x += 0.035) {
      if (Math.abs(x) < 0.04) continue;
      const topHead = new THREE.Mesh(headGeo, headMat);
      topHead.position.set(x, 0.045, 0);
      this.aquaporinGroup.add(topHead);

      const botHead = new THREE.Mesh(headGeo, headMat);
      botHead.position.set(x, -0.045, 0);
      this.aquaporinGroup.add(botHead);
    }

    const channel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.11, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.2, side: THREE.DoubleSide })
    );
    this.aquaporinGroup.add(channel);

    for (let p = 0; p < 30; p++) {
      const part = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      part.position.set((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.14, 0);
      this.aquaporinGroup.add(part);
      this.waterParticles.push(part);
    }

    this.group.add(this.aquaporinGroup);
  }

  createPipetteRack() {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0.65, 0.02, 0.3);

    // Stand
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    rackGroup.add(stand);

    // 2 Pipettes resting on stand
    [-0.04, 0.04].forEach(px => {
      const pip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.003, 0.16, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
      );
      pip.position.set(px, 0.09, 0);
      pip.rotation.z = 0.1;
      rackGroup.add(pip);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      bulb.position.set(px - 0.01, 0.17, 0);
      rackGroup.add(bulb);

      pip.userData = { isPipette: true, name: 'หลอดหยดสารละลาย (คลิกเพื่อเปลี่ยนสารทดสอบ)' };
      bulb.userData = pip.userData;
      this.interactiveObjects.push(pip);
      this.interactiveObjects.push(bulb);
    });

    this.group.add(rackGroup);
  }

  setTonicity(tonicityId) {
    if (!BIOLOGY_DATA.tonicity[tonicityId]) return;
    this.activeTonicity = tonicityId;
    this.cellProgress = 0.0; // Reset progressive animation
    sound.playLiquidDrop();

    Object.keys(this.beakerMeshes).forEach(id => {
      this.beakerMeshes[id].ringMat.opacity = id === tonicityId ? 1.0 : 0.25;
    });

    this.updateObservationBoard();
  }

  setCellType(type) {
    this.cellType = type;
    this.cellProgress = 0.0;
    sound.playClick();
    if (type === 'animal') {
      this.animalCellGroup.visible = true;
      this.plantCellGroup.visible = false;
    } else {
      this.animalCellGroup.visible = false;
      this.plantCellGroup.visible = true;
    }
    this.updateObservationBoard();
  }

  updateObservationBoard() {
    const ctx = this.infoCtx;
    const w = this.infoCanvas.width;
    const h = this.infoCanvas.height;
    const tData = BIOLOGY_DATA.tonicity[this.activeTonicity];
    const isAnimal = this.cellType === 'animal';
    const cData = isAnimal ? tData.animalCell : tData.plantCell;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`${tData.titleTh} - ${tData.titleEn}`, 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText(`ความเข้มข้นสารละลาย: ${tData.osmolarity}`, 40, 95);
    ctx.fillText(`ทิศทางการแพร่: ${tData.waterFlow}`, 40, 130);

    ctx.fillStyle = isAnimal ? '#ef4444' : '#10b981';
    ctx.fillRect(40, 155, 300, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(isAnimal ? 'ชนิดตัวอย่าง: เซลล์สัตว์ (RBC)' : 'ชนิดตัวอย่าง: เซลล์พืช (Plant Cell)', 55, 185);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`ผลลัพธ์: ${cData.status}`, 40, 250);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '24px sans-serif';
    this.wrapText(ctx, cData.desc, 40, 295, w - 80, 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 20px sans-serif';
    ctx.fillText('💡 ทฤษฎี: ชลศักย์ (Water Potential Ψ) กำหนดทิศทางของน้ำจาก Ψ สูง -> Ψ ต่ำ', 40, 460);

    this.infoTex.needsUpdate = true;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  update(time) {
    const tData = BIOLOGY_DATA.tonicity[this.activeTonicity];

    // Smooth progressive kinetics
    if (this.cellProgress < 1.0) {
      this.cellProgress = Math.min(1.0, this.cellProgress + 0.02);
    }

    if (this.cellType === 'animal') {
      const targetScale = tData.animalCell.scale;
      const isBurst = tData.animalCell.burst;

      if (isBurst && this.cellProgress > 0.6) {
        this.animalCellMesh.visible = false;
        this.fragments.forEach((frag, idx) => {
          frag.visible = true;
          const ang = (idx / 8) * Math.PI * 2;
          const dist = 0.18 + Math.sin(time * 3 + idx) * 0.04;
          frag.position.set(Math.cos(ang) * dist, Math.sin(time * 2 + idx) * 0.03, Math.sin(ang) * dist);
          frag.rotation.x += 0.05;
        });
      } else {
        this.animalCellMesh.visible = true;
        this.fragments.forEach(f => (f.visible = false));
        const curScale = 1.0 + (targetScale - 1.0) * this.cellProgress;
        this.animalCellMesh.scale.lerp(new THREE.Vector3(curScale, curScale, curScale), 0.08);
        this.animalCellMesh.rotation.y += 0.01;
      }
    } else {
      const targetScale = tData.plantCell.scale;
      const curScale = 1.0 + (targetScale - 1.0) * this.cellProgress;
      this.plantProtoMesh.scale.lerp(new THREE.Vector3(curScale, curScale, curScale), 0.08);
      this.vacuoleMesh.scale.lerp(new THREE.Vector3(curScale * 1.2, curScale * 1.2, curScale * 1.2), 0.08);
      this.plantCellGroup.rotation.y += 0.008;
    }

    // Aquaporin particle flow
    const flowDirection = this.activeTonicity === 'hypotonic' ? -1 : this.activeTonicity === 'hypertonic' ? 1 : 0;
    this.waterParticles.forEach((part, i) => {
      if (flowDirection === 0) {
        part.position.y += Math.sin(time * 4 + i) * 0.001;
      } else {
        part.position.y += flowDirection * 0.002;
        if (part.position.y > 0.07) part.position.y = -0.07;
        if (part.position.y < -0.07) part.position.y = 0.07;
      }
    });
  }

  handleClick(intersectedObj) {
    const data = intersectedObj.userData;
    if (data.isOsmosisButton && data.action) {
      data.action();
      return true;
    }
    if (data.isBeaker && data.tonicityId) {
      this.setTonicity(data.tonicityId);
      return true;
    }
    if (data.isPipette) {
      const cycle = ['hypotonic', 'isotonic', 'hypertonic'];
      const nextIdx = (cycle.indexOf(this.activeTonicity) + 1) % cycle.length;
      this.setTonicity(cycle[nextIdx]);
      return true;
    }
    return false;
  }
}
