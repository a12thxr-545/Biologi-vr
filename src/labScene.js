import * as THREE from 'three';

export class ClassroomScene {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = [];

    this.chalkboardPages = [
      {
        title: 'ปฏิบัติการชีววิทยา: เซลล์และกล้องจุลทรรศน์',
        sub: 'ห้องเรียน ม.ปลาย - ชีววิทยา 1 | ครูประจำวิชา: ดร.ชีววิทยา',
        notes: [
          '• เซลล์พืช: มีผนังเซลล์ (Cell Wall), ไซโทพลาซึม, นิวเคลียส, แวคิวโอล',
          '• เซลล์สัตว์: ไม่มีผนังเซลล์ รูปร่างยืดหยุ่น นิวเคลียสเด่นชัด',
          '• การเตรียมสไลด์สด: วางตัวอย่าง -> หยดสีไอโอดีน/เมทิลีนบลู -> ปิด Coverslip 45°',
          '• ลำดับการส่อง: เริ่มต้นด้วยเลนส์ 4x -> 10x -> 40x เสมอ!'
        ]
      },
      {
        title: 'ทฤษฎีออสโมซิส (Osmosis & Tonicity)',
        sub: 'การแพร่ของน้ำผ่านเยื่อเลือกผ่านตามชลศักย์ (Ψ)',
        notes: [
          '• สารละลายไฮโพโทนิก (น้ำกลั่น): น้ำเข้าเซลล์ -> สัตว์แตก (Lysis) / พืชเต่ง (Turgid)',
          '• สารละลายไอโซโทนิก (0.9% NaCl): สภาวะสมดุล รักษาสภาพเซลล์ปกติ',
          '• สารละลายไฮเพอร์โทนิก (10% NaCl): น้ำออกเซลล์ -> สัตว์เหี่ยว (Crenation) / พืช Plasmolysis',
          '• ช่องทางน้ำหลัก: Aquaporin channel protein บนเยื่อหุ้มเซลล์'
        ]
      }
    ];
    this.currentChalkPage = 0;

    this.buildClassroom();
  }

  buildClassroom() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 1. Room Architecture (Classroom: 14m wide, 3.8m high, 13m deep)
    this.createRoomGeometry();

    // 2. Large Classroom Chalkboard at Front
    this.createFrontChalkboard();

    // 3. Teacher Podium Desk
    this.createTeacherDesk();

    // 4. Student Desks & Chairs arranged in pods
    this.createStudentPods();

    // 5. Classroom Windows & Campus View on Left
    this.createWindows();

    // 6. Biology Display Cabinet, Skeleton & Specimen Jars
    this.createClassroomDecor();

    // 7. Classroom Lighting (Warm Natural Daylight from windows + Soft Ceiling Tubes)
    this.setupLighting();
  }

  createWoodDeskTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm school desk wood color
    ctx.fillStyle = '#b47b48';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#8d5b30';
    ctx.lineWidth = 4;
    for (let i = 0; i < 512; i += 18) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.08) * 10);
      ctx.bezierCurveTo(160, i + 8, 320, i - 12, 512, i + 4);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Real school parquet/tile floor
    ctx.fillStyle = '#cbb89d';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#a49177';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 504);

    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#bda88d' : '#dac9af';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }

  createRoomGeometry() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createFloorTexture(),
      roughness: 0.45,
      metalness: 0.05
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.floor.userData = { isFloor: true, name: 'พื้นห้องเรียน' };
    this.group.add(this.floor);

    // Ceiling (White acoustic tiles)
    const ceilGeo = new THREE.PlaneGeometry(16, 16);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.y = 3.8;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Walls (Soft warm cream classroom paint with wood baseboard)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xeae6df, roughness: 0.75 });

    // Front Wall (Z = -7.5)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), wallMat);
    frontWall.position.set(0, 1.9, -7.5);
    this.group.add(frontWall);

    // Back Wall (Z = 7.5)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), wallMat);
    backWall.position.set(0, 1.9, 7.5);
    backWall.rotation.y = Math.PI;
    this.group.add(backWall);

    // Left Wall with Windows (X = -7.5)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), wallMat);
    leftWall.position.set(-7.5, 1.9, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    // Right Wall (X = 7.5)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), wallMat);
    rightWall.position.set(7.5, 1.9, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);

    // Wooden baseboards along bottom of walls
    const bbMat = new THREE.MeshStandardMaterial({ color: 0x5c4028, roughness: 0.4 });
    const bbFront = new THREE.Mesh(new THREE.BoxGeometry(16, 0.14, 0.04), bbMat);
    bbFront.position.set(0, 0.07, -7.48);
    this.group.add(bbFront);
  }

  createFrontChalkboard() {
    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 2.0, -7.42);

    // Wooden Chalkboard Frame
    const frameGeo = new THREE.BoxGeometry(6.2, 2.1, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.4 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    boardGroup.add(frame);

    // Chalk tray at bottom with chalk sticks and eraser
    const trayGeo = new THREE.BoxGeometry(6.2, 0.04, 0.12);
    const tray = new THREE.Mesh(trayGeo, frameMat);
    tray.position.set(0, -1.05, 0.04);
    boardGroup.add(tray);

    // White & Yellow Chalk sticks on tray
    [ -0.4, -0.2, 0.1, 0.3 ].forEach((cx, idx) => {
      const chalkGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.06, 8);
      const chalkMat = new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xffffff : 0xfef08a });
      const chalk = new THREE.Mesh(chalkGeo, chalkMat);
      chalk.rotation.z = Math.PI / 2;
      chalk.position.set(cx, -1.03, 0.04);
      boardGroup.add(chalk);
    });

    // Board Eraser
    const eraserGeo = new THREE.BoxGeometry(0.12, 0.035, 0.06);
    const eraserMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const eraser = new THREE.Mesh(eraserGeo, eraserMat);
    eraser.position.set(-0.7, -1.03, 0.04);
    boardGroup.add(eraser);

    // Chalkboard Canvas Surface
    this.chalkCanvas = document.createElement('canvas');
    this.chalkCanvas.width = 2048;
    this.chalkCanvas.height = 768;
    this.chalkCtx = this.chalkCanvas.getContext('2d');
    this.chalkTex = new THREE.CanvasTexture(this.chalkCanvas);

    const surfaceGeo = new THREE.PlaneGeometry(6.0, 1.95);
    const surfaceMat = new THREE.MeshStandardMaterial({ map: this.chalkTex, roughness: 0.8 });
    this.chalkSurface = new THREE.Mesh(surfaceGeo, surfaceMat);
    this.chalkSurface.position.z = 0.028;
    this.chalkSurface.userData = { isChalkboard: true, name: 'กระดานดำ (คลิกเพื่อเปลี่ยนหน้าเนื้อหา)' };
    this.interactiveObjects.push(this.chalkSurface);
    boardGroup.add(this.chalkSurface);

    // Wall Clock above Chalkboard
    this.createWallClock(boardGroup);

    this.group.add(boardGroup);
    this.renderChalkboard();
  }

  renderChalkboard() {
    const ctx = this.chalkCtx;
    const w = this.chalkCanvas.width;
    const h = this.chalkCanvas.height;
    const page = this.chalkboardPages[this.currentChalkPage];

    // Dark slate green chalkboard paint
    ctx.fillStyle = '#1b3426';
    ctx.fillRect(0, 0, w, h);

    // Chalk texture dust
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Title in bright chalk yellow
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(page.title, 50, 75);

    // Subtitle in chalk green
    ctx.fillStyle = '#86efac';
    ctx.font = '26px sans-serif';
    ctx.fillText(page.sub, 50, 125);

    // Chalk line separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 150);
    ctx.lineTo(w - 50, 150);
    ctx.stroke();

    // Notes written in white chalk
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    page.notes.forEach((line, idx) => {
      ctx.fillText(line, 60, 225 + idx * 65);
    });

    // Page indicator at bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText(`[คลิกที่กระดานเพื่อเปลี่ยนหน้าเนื้อหา | หน้า ${this.currentChalkPage + 1} / ${this.chalkboardPages.length}]`, 60, h - 40);

    this.chalkTex.needsUpdate = true;
  }

  nextChalkPage() {
    this.currentChalkPage = (this.currentChalkPage + 1) % this.chalkboardPages.length;
    this.renderChalkboard();
  }

  createWallClock(parent) {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 1.45, 0.05);

    // Frame
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    rim.rotation.x = Math.PI / 2;
    clockGroup.add(rim);

    // Face
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 128, 122, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillText(n.toString(), 128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95);
    });

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(190, 128);
    ctx.stroke();

    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(85, 90);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.z = 0.022;
    clockGroup.add(face);

    parent.add(clockGroup);
  }

  createTeacherDesk() {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-2.6, 0.75, -5.8);

    const woodTex = this.createWoodDeskTexture();

    // Tabletop
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.06, 0.9),
      new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.3 })
    );
    deskGroup.add(top);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.72, 0.06);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, -0.36, lz);
      deskGroup.add(leg);
    });

    // Teacher's chair
    this.createStudentChair(deskGroup, 0, -0.75, -0.6);

    // Books & Teacher attendance folder on desk
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.04, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    book.position.set(-0.35, 0.05, 0.1);
    book.rotation.y = 0.15;
    deskGroup.add(book);

    // Pen cup
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    cup.position.set(0.45, 0.08, -0.2);
    deskGroup.add(cup);

    this.group.add(deskGroup);
  }

  createStudentPods() {
    const woodTex = this.createWoodDeskTexture();

    // 1. Front Left Pod: Station 1 - Compound Microscope Lab Bench
    this.benchMicroscope = this.createSchoolLabDesk(
      new THREE.Vector3(-2.2, 0.78, -2.4),
      woodTex
    );

    // 2. Front Right Pod: Station 2 - Osmosis Lab Bench
    this.benchOsmosis = this.createSchoolLabDesk(
      new THREE.Vector3(2.2, 0.78, -2.4),
      woodTex
    );

    // 3. Middle Left Pod: Station 3 - Photosynthesis Lab Bench
    this.benchPhotosynthesis = this.createSchoolLabDesk(new THREE.Vector3(-2.2, 0.78, 1.8), woodTex, false);

    // 4. Middle Right Pod: Station 4 - Blood Typing Lab Bench
    this.benchBloodTyping = this.createSchoolLabDesk(new THREE.Vector3(2.2, 0.78, 1.8), woodTex, false);

    // 5. Back Student Pods (authentic school classroom atmosphere)
    this.createSchoolLabDesk(new THREE.Vector3(-2.2, 0.78, 5.2), woodTex, true);
    this.createSchoolLabDesk(new THREE.Vector3(2.2, 0.78, 5.2), woodTex, true);
  }

  createSchoolLabDesk(pos, woodTex, isBackground = false) {
    const pod = new THREE.Group();
    pod.position.copy(pos);

    // Wooden tabletop (standard school lab desk: 2.4m wide, 1.0m deep)
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, 1.05),
      new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.35 })
    );
    top.receiveShadow = true;
    top.castShadow = true;
    pod.add(top);

    // Steel leg frame
    const legGeo = new THREE.BoxGeometry(0.06, pos.y, 0.06);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    [[-1.15, -0.48], [1.15, -0.48], [-1.15, 0.48], [1.15, 0.48]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, -pos.y / 2, lz);
      pod.add(leg);
    });

    // 2 Student Chairs at each desk
    this.createStudentChair(pod, -0.6, -pos.y, 0.75);
    this.createStudentChair(pod, 0.6, -pos.y, 0.75);

    // Student notebooks and pencil case on background desks
    if (isBackground) {
      const nb1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.02, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x10b981 })
      );
      nb1.position.set(-0.6, 0.04, 0);
      pod.add(nb1);

      const nb2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.02, 0.32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      nb2.position.set(0.6, 0.04, 0.05);
      nb2.rotation.y = 0.1;
      pod.add(nb2);
    }

    this.group.add(pod);
    return pod;
  }

  createStudentChair(parent, x, floorY, z) {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa87140, roughness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.4), woodMat);
    seat.position.y = floorY + 0.46;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.025), woodMat);
    back.position.set(0, floorY + 0.75, 0.18);
    chair.add(back);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.46, 12);
    [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(lx, floorY + 0.23, lz);
      chair.add(leg);
    });

    parent.add(chair);
  }

  createWindows() {
    const winGroup = new THREE.Group();
    winGroup.position.set(-7.48, 2.1, 0);

    [-4.2, 0, 4.2].forEach(z => {
      // Large classroom window frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 2.2, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
      );
      frame.position.set(0, 0, z);
      winGroup.add(frame);

      // Glass pane
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.0),
        new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.3, roughness: 0.1, transmission: 0.85 })
      );
      glass.rotation.y = Math.PI / 2;
      glass.position.set(0.01, 0, z);
      winGroup.add(glass);

      // Outdoor sunny schoolyard canvas
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      // Blue sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, 160);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 256, 160);

      // Green grass and trees
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 160, 256, 96);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(80, 175, 65, 0, Math.PI * 2);
      ctx.arc(180, 170, 75, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      const outdoor = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.95), new THREE.MeshBasicMaterial({ map: tex }));
      outdoor.rotation.y = Math.PI / 2;
      outdoor.position.set(-0.04, 0, z);
      winGroup.add(outdoor);
    });

    this.group.add(winGroup);
  }

  createClassroomDecor() {
    // 1. Biology Specimen Bookshelf on right wall
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(7.1, 1.6, -3.5);

    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 2.6, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 })
    );
    shelfGroup.add(shelf);

    // Specimen Jars
    const jarColors = [0x10b981, 0xf59e0b, 0x06b6d4, 0xef4444];
    [-0.7, 0, 0.7].forEach((sy, sidx) => {
      for (let j = 0; j < 3; j++) {
        const jar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16),
          new THREE.MeshPhysicalMaterial({ color: jarColors[(sidx + j) % 4], transparent: true, opacity: 0.75, roughness: 0.1 })
        );
        jar.position.set(-0.15, sy, -0.6 + j * 0.6);
        shelfGroup.add(jar);
      }
    });

    this.group.add(shelfGroup);

    // 2. Human Skeleton Stand in front right corner
    const skelGroup = new THREE.Group();
    skelGroup.position.set(6.2, 0, -6.2);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.06, 24), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    base.position.y = 0.03;
    skelGroup.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
    pole.position.y = 0.9;
    skelGroup.add(pole);

    // Skeleton Skull & Spine
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }));
    skull.position.set(0, 1.65, 0.08);
    skull.userData = { isSkeleton: true, name: 'หุ่นจำลองโครงกระดูกมนุษย์ (คลิกเพื่อศึกษา)' };
    this.interactiveObjects.push(skull);
    skelGroup.add(skull);

    const ribcage = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.32, 8, 16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, wireframe: true }));
    ribcage.position.set(0, 1.3, 0.08);
    ribcage.userData = { isSkeleton: true, name: 'หุ่นจำลองโครงกระดูกมนุษย์ (คลิกเพื่อศึกษา)' };
    this.interactiveObjects.push(ribcage);
    skelGroup.add(ribcage);

    this.group.add(skelGroup);

    // 3. Educational Posters on walls
    this.createPoster(new THREE.Vector3(7.48, 2.2, 2.0), -Math.PI / 2, 'ตารางธาตุและสารชีวโมเลกุล (Biomolecules)');
    this.createPoster(new THREE.Vector3(-2.8, 2.2, 7.48), Math.PI, 'โครงสร้างเซลล์พืชและสัตว์ (Cell Anatomy)');
  }

  createPoster(pos, rotY, title) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 768);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 752);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(16, 16, 480, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 65);

    // Simple educational illustration
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(256, 320, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(256, 320, 50, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), new THREE.MeshBasicMaterial({ map: tex }));
    poster.position.copy(pos);
    poster.rotation.y = rotY;
    this.group.add(poster);
  }

  setupLighting() {
    // Warm daylight ambient
    const ambient = new THREE.AmbientLight(0xfffbeb, 0.9);
    this.group.add(ambient);

    // Sunlight through the left windows
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(-10, 7, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.group.add(sunLight);

    // Fluorescent ceiling fixtures
    [-3, 0, 3].forEach(x => {
      [-2, 2, 5].forEach(z => {
        const fix = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        fix.position.set(x, 3.78, z);
        this.group.add(fix);

        const pl = new THREE.PointLight(0xffffff, 0.35, 6);
        pl.position.set(x, 3.5, z);
        this.group.add(pl);
      });
    });
  }

  update(time) {
    // Subtle animations
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
