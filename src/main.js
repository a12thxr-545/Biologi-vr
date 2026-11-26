import * as THREE from 'three';
import { VRButton } from './vrButton.js';

import { ClassroomScene } from './labScene.js';
import { MicroscopeStation } from './microscopeStation.js';
import { OsmosisStation } from './osmosisStation.js';
import { PhotosynthesisStation } from './photosynthesisStation.js';
import { BloodTypingStation } from './bloodTypingStation.js';
import { VRControlsManager } from './vrControls.js';
import { sound } from './audio.js';
import { BIOLOGY_DATA } from './quizData.js';
import { labQuest } from './labQuest.js';

class BioVerseApp {
  constructor() {
    this.recordedObservations = [];

    // Human Player State (First-Person Perspective)
    this.playerEyeHeight = 1.65; // Average human eye level (1.65m)
    this.playerPosition = new THREE.Vector3(0, 0, 1.2); // Start standing in center aisle
    this.yaw = 0.0; // Horizontal head angle (0 faces -Z toward chalkboard)
    this.pitch = 0.0; // Vertical head tilt (-1.45 to +1.45 rad)
    this.walkCycle = 0.0;
    this.stepTriggered = false;

    this.isPointerLocked = false;
    this.isLookingThroughEyepiece = false;
    this.cameraAnimation = null;
    this.currentHoveredObject = null;

    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
    this.lastTime = performance.now() * 0.001;

    this.initEngine();
    this.initClassroom();
    this.initControls();
    this.initUI();
    this.animate(0);
  }

  initEngine() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1120);

    // 2. Camera Dolly for WebXR Locomotion
    this.cameraDolly = new THREE.Group();
    this.scene.add(this.cameraDolly);

    // Human Eyes Perspective Camera (FOV 70° natural human field of view)
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
    this.camera.rotation.order = 'YXZ';
    this.updateCameraTransform();
    this.cameraDolly.add(this.camera);

    // 3. Renderer with WebXR
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.xr.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // 4. VR Button
    const vrBtn = VRButton.createButton(this.renderer);
    vrBtn.id = 'vr-button';
    document.body.appendChild(vrBtn);

    // 5. Window resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  updateCameraTransform() {
    this.camera.position.set(this.playerPosition.x, this.playerEyeHeight, this.playerPosition.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  initClassroom() {
    // 1. School Biology Classroom Environment
    this.classroomScene = new ClassroomScene(this.scene);

    // 2. Station 1: Compound Microscope on Front-Left Pod (-2.2, 0.81, -2.4)
    this.microStation = new MicroscopeStation(this.scene, new THREE.Vector3(-2.2, 0.81, -2.4));

    // 3. Station 2: Tonicity & Osmosis Experiment on Front-Right Pod (2.2, 0.81, -2.4)
    this.osmosisStation = new OsmosisStation(this.scene, new THREE.Vector3(2.2, 0.81, -2.4));

    // 4. Station 3: Photosynthesis Rate & Light Spectrum on Middle-Left Pod (-2.2, 0.81, 1.8)
    this.photoStation = new PhotosynthesisStation(this.scene, new THREE.Vector3(-2.2, 0.81, 1.8));

    // 5. Station 4: ABO & Rh Blood Typing on Middle-Right Pod (2.2, 0.81, 1.8)
    this.bloodStation = new BloodTypingStation(this.scene, new THREE.Vector3(2.2, 0.81, 1.8));

    // Collect all in-world interactive objects
    this.interactiveObjects = [
      ...this.classroomScene.interactiveObjects,
      ...this.microStation.interactiveObjects,
      ...this.osmosisStation.interactiveObjects,
      ...this.photoStation.interactiveObjects,
      ...this.bloodStation.interactiveObjects
    ];
  }

  initControls() {
    // WebXR Controllers with locomotion and cameraDolly
    this.vrControls = new VRControlsManager(this.renderer, this.scene, this.camera, this.cameraDolly);
    this.vrControls.onSelectCallback = raycaster => this.handleRaycastSelect(raycaster);

    // Keyboard Walking Controls (W, A, S, D, Arrow keys, Shift)
    window.addEventListener('keydown', e => this.handleKeyEvent(e, true));
    window.addEventListener('keyup', e => this.handleKeyEvent(e, false));

    // Pointer Lock Listeners for authentic First-Person Human Mouse Look
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body || document.pointerLockElement === this.renderer.domElement;
      const walkHint = document.getElementById('walk-hint');
      if (walkHint) {
        walkHint.innerHTML = this.isPointerLocked
          ? `<div>🚶‍♂️ <span class="key-cap">W</span><span class="key-cap">A</span><span class="key-cap">S</span><span class="key-cap">D</span> เดิน | ขยับเมาส์เพื่อหันมอง | กด <span class="key-cap">Esc</span> เพื่อปลดล็อกเมาส์</div>`
          : `<div>🚶‍♂️ <span class="key-cap">W</span><span class="key-cap">A</span><span class="key-cap">S</span><span class="key-cap">D</span> เดิน | 🖱️ <strong>คลิกที่ห้องเรียนเพื่อเข้าสู่มุมมองคน</strong></div>`;
      }
    });

    // Mouse Look via Pointer Lock (FPS style)
    window.addEventListener('mousemove', e => {
      if (this.renderer.xr.isPresenting || this.isLookingThroughEyepiece) return;

      if (this.isPointerLocked) {
        const sensitivity = 0.0022;
        this.yaw -= e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;
        this.pitch = Math.max(-1.42, Math.min(1.42, this.pitch)); // Clamp look down/up ~82°
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
      }
    });

    // Drag-to-look support when pointer lock is not active (e.g. touch / laptop trackpad)
    let isDragging = false;
    let lastX = 0, lastY = 0;

    this.pointerRaycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer.domElement.addEventListener('pointerdown', e => {
      // Ignore if clicking on UI overlays
      if (
        e.target.closest('#classroom-header') ||
        e.target.closest('#quiz-modal') ||
        e.target.closest('#lab-notebook-modal') ||
        e.target.closest('#ocular-view-overlay') ||
        e.target.closest('#touch-dpad') ||
        e.target.closest('#vr-button')
      ) {
        return;
      }

      sound.ensureContext();

      // 1. If currently aiming crosshair at an interactable object, activate it
      if (this.currentHoveredObject) {
        this.activateInteractiveObject(this.currentHoveredObject);
        return;
      }

      // 2. Also raycast from clicked screen coordinates (allows direct clicking without locking)
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.pointerRaycaster.setFromCamera(this.pointer, this.camera);
      const clickedHits = this.pointerRaycaster.intersectObjects(this.interactiveObjects, true);
      for (const hit of clickedHits) {
        if (hit.distance <= 4.0) {
          const obj = this.findInteractiveAncestor(hit.object);
          if (obj) {
            this.activateInteractiveObject(obj);
            return;
          }
        }
      }

      // 3. If not looking through eyepiece and not pointer locked, request pointer lock for FPS human look
      if (!this.isLookingThroughEyepiece && !this.isPointerLocked && !('ontouchstart' in window)) {
        this.renderer.domElement.requestPointerLock();
      }

      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('pointermove', e => {
      if (this.isPointerLocked || !isDragging || this.isLookingThroughEyepiece) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const sensitivity = 0.003;
      this.yaw -= dx * sensitivity;
      this.pitch -= dy * sensitivity;
      this.pitch = Math.max(-1.42, Math.min(1.42, this.pitch));
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    });

    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointercancel', () => { isDragging = false; });

    // Center screen raycaster for first-person crosshair targeting
    this.centerRaycaster = new THREE.Raycaster();
    this.centerScreen = new THREE.Vector2(0, 0);
  }

  findInteractiveAncestor(obj) {
    while (obj && !obj.userData?.name) {
      obj = obj.parent;
    }
    return obj;
  }

  handleRaycastSelect(raycaster) {
    sound.ensureContext();
    const hits = raycaster.intersectObjects(this.interactiveObjects, true);
    if (hits.length === 0) return;

    for (const hit of hits) {
      const obj = this.findInteractiveAncestor(hit.object);
      if (obj) {
        this.activateInteractiveObject(obj);
        return;
      }
    }
  }

  activateInteractiveObject(obj) {
    sound.ensureContext();
    const data = obj.userData;
    if (!data) return;

    // 1. Chalkboard in front of classroom
    if (data.isChalkboard) {
      sound.playClick();
      this.classroomScene.nextChalkPage();
      return;
    }

    // 2. Human Skeleton anatomy model
    if (data.isSkeleton) {
      sound.playClick();
      return;
    }

    // 3. Microscope Station In-World Interactions
    const microRes = this.microStation.handleClick(obj);
    if (data.isSlidePick) labQuest.completeTask('slide');
    if (data.isStainBottle) labQuest.completeTask('stain');
    if (data.isPowerSwitch && this.microStation.lightOn) labQuest.completeTask('light');

    if (microRes === 'toggle_eyepiece') {
      this.toggleEyepieceView();
      return;
    }
    if (microRes) return;

    // 4. Osmosis Station In-World Interactions
    if (this.osmosisStation.handleClick(obj)) {
      return;
    }

    // 5. Photosynthesis Station In-World Interactions
    if (this.photoStation.handleClick(obj)) {
      return;
    }

    // 6. Blood Typing Station In-World Interactions
    if (this.bloodStation.handleClick(obj)) {
      return;
    }
  }

  toggleEyepieceView(forceState) {
    const targetState = forceState !== undefined ? forceState : !this.isLookingThroughEyepiece;
    this.isLookingThroughEyepiece = targetState;

    sound.playClick();

    // Release pointer lock when dipping into eyepiece so mouse controls optical stage & focus
    if (this.isLookingThroughEyepiece && document.pointerLockElement) {
      document.exitPointerLock();
    }

    const startPos = this.camera.position.clone();
    const startYaw = this.yaw;
    const startPitch = this.pitch;

    let targetPos, targetYaw, targetPitch;
    if (this.isLookingThroughEyepiece) {
      labQuest.completeTask('eyepiece');
      // Player physically bends forward and leans eyes right down into the binocular eyepieces
      targetPos = new THREE.Vector3(-2.2, 1.485, -2.26);
      targetPitch = -0.52; // Looking down at angle of ~30° into ocular tubes
      targetYaw = 0.0;
    } else {
      // Player stands naturally upright beside the desk
      targetPos = new THREE.Vector3(this.playerPosition.x, this.playerEyeHeight, this.playerPosition.z);
      targetPitch = 0.0;
      targetYaw = this.yaw;
    }

    this.cameraAnimation = {
      startPos,
      targetPos,
      startPitch,
      targetPitch,
      startYaw,
      targetYaw,
      progress: 0,
      duration: 0.85
    };

    const ocularMask = document.getElementById('ocular-view-overlay');
    if (ocularMask) {
      if (this.isLookingThroughEyepiece) {
        this.updateEyepieceHUD();
        setTimeout(() => ocularMask.classList.remove('hidden'), 500);
      } else {
        ocularMask.classList.add('hidden');
      }
    }
  }

  updateEyepieceHUD() {
    const spData = BIOLOGY_DATA.specimens[this.microStation.currentSpecimen];
    const titleEl = document.getElementById('eye-specimen-title');
    const metaEl = document.getElementById('eye-specimen-meta');
    const focusBadge = document.getElementById('eye-focus-status');

    if (titleEl && spData) {
      titleEl.textContent = `${spData.nameTh}`;
    }

    if (metaEl && spData) {
      const mag = this.microStation.currentObjective;
      const stainName = this.microStation.currentStain === 'none'
        ? 'ไม่ย้อมสี (None)'
        : this.microStation.currentStain === 'iodine'
        ? 'สารละลายไอโอดีน (Iodine)'
        : 'เมทิลีนบลู (Methylene Blue)';
      metaEl.textContent = `กำลังขยาย: ${mag * 10}x (เลนส์ใกล้ตา 10x × เลนส์ใกล้วัตถุ ${mag}x) | สีย้อม: ${stainName}`;
    }

    if (focusBadge) {
      const focusError = Math.abs(this.microStation.focusValue - 50);
      const isSharp = focusError < 3;
      focusBadge.textContent = isSharp
        ? '✓ โฟกัสคมชัดสมบูรณ์'
        : focusError < 8
        ? '⚡ ใกล้โฟกัสแล้ว'
        : '⚠️ ภาพเบลอ (หมุนปรับโฟกัส)';
      focusBadge.classList.toggle('blur', !isSharp);
    }
  }

  initUI() {
    // 1. Step Back Button in Ocular View
    const stepBackBtn = document.getElementById('ocular-step-back-btn');
    if (stepBackBtn) {
      stepBackBtn.addEventListener('click', () => {
        this.toggleEyepieceView(false);
      });
    }

    // 2. Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        sound.isMuted = !sound.isMuted;
        if (audioIcon) audioIcon.textContent = sound.isMuted ? '🔇' : '🔊';
        audioBtn.style.color = sound.isMuted ? '#ef4444' : '#e2e8f0';
      });
    }

    // 3. Touch D-Pad Walking for mobile
    const bindTouch = (btnId, keyName) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      const start = e => { e.preventDefault(); this.keys[keyName] = true; };
      const end = e => { e.preventDefault(); this.keys[keyName] = false; };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointerleave', end);
      el.addEventListener('pointercancel', end);
    };

    bindTouch('btn-forward', 'forward');
    bindTouch('btn-backward', 'backward');
    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');

    // 4. Lab Notebook Modal
    this.initLabNotebookUI();

    // 5. Quiz Modal
    this.initQuizSystem();

    // 6. Eyepiece Optical Controls
    this.initEyepieceOpticalControls();
  }

  initEyepieceOpticalControls() {
    // Stage Dragging on Eyepiece Canvas
    const oCanvas = document.getElementById('eyepiece-canvas');
    if (oCanvas) {
      let isDragging = false;
      let lastX = 0, lastY = 0;

      oCanvas.addEventListener('pointerdown', e => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });

      window.addEventListener('pointermove', e => {
        if (!isDragging || !this.isLookingThroughEyepiece) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        this.microStation.panStage(dx * 1.5, dy * 1.5);
      });

      window.addEventListener('pointerup', () => { isDragging = false; });
      window.addEventListener('pointercancel', () => { isDragging = false; });

      // Mouse Wheel for Fine Focus
      oCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -2 : 2;
        this.microStation.adjustFocus(delta);
        const slider = document.getElementById('eye-focus-slider');
        if (slider) slider.value = this.microStation.focusValue;
      }, { passive: false });
    }

    // Pan Buttons
    const panStep = 25;
    document.getElementById('eye-pan-up')?.addEventListener('click', () => this.microStation.panStage(0, -panStep));
    document.getElementById('eye-pan-down')?.addEventListener('click', () => this.microStation.panStage(0, panStep));
    document.getElementById('eye-pan-left')?.addEventListener('click', () => this.microStation.panStage(-panStep, 0));
    document.getElementById('eye-pan-right')?.addEventListener('click', () => this.microStation.panStage(panStep, 0));

    // Objective Buttons in Ocular Dock
    document.querySelectorAll('.mag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMag = parseInt(btn.dataset.mag);
        while (this.microStation.currentObjective !== targetMag) {
          this.microStation.cycleObjective();
        }
        document.querySelectorAll('.mag-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.mag) === targetMag));
        if (targetMag >= 40) labQuest.completeTask('magnify');
      });
    });

    // Focus Buttons & Slider in Ocular Dock
    document.getElementById('focus-coarse-minus')?.addEventListener('click', () => this.microStation.adjustFocus(-10));
    document.getElementById('focus-coarse-plus')?.addEventListener('click', () => this.microStation.adjustFocus(10));
    document.getElementById('focus-fine-minus')?.addEventListener('click', () => this.microStation.adjustFocus(-2));
    document.getElementById('focus-fine-plus')?.addEventListener('click', () => this.microStation.adjustFocus(2));

    const eyeFocusSlider = document.getElementById('eye-focus-slider');
    if (eyeFocusSlider) {
      eyeFocusSlider.addEventListener('input', e => {
        this.microStation.focusValue = parseFloat(e.target.value);
        this.microStation.updateMicroscopeDisplay();
      });
    }

    // Micrometer Toggle
    const microBtn = document.getElementById('toggle-micrometer-btn');
    if (microBtn) {
      microBtn.addEventListener('click', () => {
        const on = this.microStation.toggleMicrometer();
        microBtn.textContent = on ? '📏 ไมโครมิเตอร์: เปิด' : '📏 ไมโครมิเตอร์: ปิด';
        microBtn.style.color = on ? '#10b981' : '#38bdf8';
      });
    }

    // Diaphragm Slider
    const diaSlider = document.getElementById('eye-diaphragm-slider');
    if (diaSlider) {
      diaSlider.addEventListener('input', e => {
        this.microStation.setDiaphragm(parseFloat(e.target.value));
      });
    }

    // Snap Photo to Lab Notebook
    const snapBtn = document.getElementById('ocular-snap-btn');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        const dataUrl = this.microStation.displayCanvas.toDataURL('image/png');
        const spData = BIOLOGY_DATA.specimens[this.microStation.currentSpecimen];

        this.recordedObservations.push({
          specimenId: this.microStation.currentSpecimen,
          specimenName: spData.nameTh,
          mag: this.microStation.currentObjective * 10,
          stain: this.microStation.currentStain,
          dataUrl: dataUrl,
          timestamp: new Date().toLocaleTimeString('th-TH')
        });

        sound.playAtpSparkle();
        labQuest.completeTask('record');

        snapBtn.textContent = '✓ บันทึกภาพแล้ว!';
        setTimeout(() => { snapBtn.textContent = '📸 บันทึกภาพลงสมุด'; }, 1500);
      });
    }
  }

  initLabNotebookUI() {
    const modal = document.getElementById('lab-notebook-modal');
    const openBtns = [document.getElementById('open-notebook-btn'), document.getElementById('ocular-notebook-btn')];
    const closeBtn = document.getElementById('close-notebook-btn');

    openBtns.forEach(btn => {
      btn?.addEventListener('click', () => {
        this.renderLabNotebook();
        modal?.classList.remove('hidden');
      });
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });
  }

  renderLabNotebook() {
    const body = document.getElementById('notebook-body');
    if (!body) return;

    if (this.recordedObservations.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔬</div>
          <div style="font-size: 1.1rem; color: #ffffff; margin-bottom: 8px;">ยังไม่มีภาพบันทึกผลการทดลอง</div>
          <div>เมื่อเดินไปที่โต๊ะกล้องจุลทรรศน์แล้วก้มส่องกล้อง ให้กดปุ่ม <strong>"📸 บันทึกภาพลงสมุด"</strong> เพื่อเก็บภาพถ่ายเซลล์ลงในสมุดรายงาน</div>
        </div>
      `;
      return;
    }

    let html = `
      <div style="margin-bottom: 16px; color: #38bdf8; font-weight: bold;">
        📊 ตารางบันทึกผลการส่องกล้องจุลทรรศน์ (${this.recordedObservations.length} ตัวอย่าง):
      </div>
      <div class="obs-grid">
    `;

    this.recordedObservations.forEach(obs => {
      const stainName = obs.stain === 'none' ? 'ไม่ย้อมสี' : obs.stain === 'iodine' ? 'สารละลายไอโอดีน' : 'เมทิลีนบลู';
      html += `
        <div class="obs-card">
          <img src="${obs.dataUrl}" class="obs-img" alt="${obs.specimenName}">
          <div style="margin-top: 8px; font-weight: 700; color: #38bdf8; font-size: 0.95rem;">${obs.specimenName}</div>
          <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 4px;">กำลังขยาย: <strong>${obs.mag}x</strong></div>
          <div style="font-size: 0.8rem; color: #94a3b8;">สีย้อม: ${stainName}</div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 6px;">บันทึกเวลา: ${obs.timestamp}</div>
        </div>
      `;
    });

    html += `</div>`;
    body.innerHTML = html;
  }

  initQuizSystem() {
    const quizModal = document.getElementById('quiz-modal');
    const quizBtn = document.getElementById('open-quiz-btn');
    const closeBtn = document.getElementById('close-quiz-btn');

    if (quizBtn && quizModal) {
      quizBtn.addEventListener('click', () => {
        quizModal.classList.remove('hidden');
        this.renderQuizQuestion(0, 0);
      });
    }

    if (closeBtn && quizModal) {
      closeBtn.addEventListener('click', () => {
        quizModal.classList.add('hidden');
      });
    }
  }

  renderQuizQuestion(questionIdx, currentScore) {
    const container = document.getElementById('quiz-content');
    if (!container) return;

    if (questionIdx >= BIOLOGY_DATA.quiz.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: #10b981;">🎉 ทดสอบเสร็จสิ้น!</h2>
          <p style="font-size: 20px; color: #ffffff; margin-top: 10px;">คุณได้คะแนน: <strong>${currentScore} / ${BIOLOGY_DATA.quiz.length}</strong></p>
          <p style="color: #94a3b8; margin-top: 8px;">ยอดเยี่ยม! คุณได้ศึกษาและทดลองปฏิบัติการทางชีววิทยาเสมือนจริงเรียบร้อยแล้ว</p>
          <button id="quiz-restart-btn" class="minimal-btn" style="margin: 20px auto 0; background: #0284c7; color: #fff;">ทดสอบอีกครั้ง</button>
        </div>
      `;
      document.getElementById('quiz-restart-btn')?.addEventListener('click', () => {
        this.renderQuizQuestion(0, 0);
      });
      return;
    }

    const q = BIOLOGY_DATA.quiz[questionIdx];
    let html = `
      <div style="margin-bottom: 12px; color: #38bdf8; font-weight: bold;">คำถามข้อที่ ${questionIdx + 1} จาก ${BIOLOGY_DATA.quiz.length}</div>
      <div style="font-size: 17px; color: #ffffff; margin-bottom: 20px; line-height: 1.5;">${q.question}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    q.options.forEach((opt, idx) => {
      html += `<button class="quiz-option-btn" data-opt="${idx}">${opt}</button>`;
    });

    html += `</div><div id="quiz-feedback" style="margin-top: 15px; font-size: 15px; display: none;"></div>`;
    container.innerHTML = html;

    const feedbackEl = document.getElementById('quiz-feedback');
    container.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.dataset.opt);
        const isCorrect = chosen === q.correctIndex;
        if (isCorrect) sound.playAtpSparkle();
        else sound.playMechanicalKnob();

        container.querySelectorAll('.quiz-option-btn').forEach((b, i) => {
          b.disabled = true;
          if (i === q.correctIndex) b.style.borderColor = '#10b981';
          if (i === chosen && !isCorrect) b.style.borderColor = '#ef4444';
        });

        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `
          <div style="color: ${isCorrect ? '#10b981' : '#ef4444'}; font-weight: bold; margin-bottom: 6px;">
            ${isCorrect ? '✓ ถูกต้อง!' : '✗ ยังไม่ถูกต้อง'}
          </div>
          <div style="color: #e2e8f0; line-height: 1.4;">${q.explanation}</div>
          <button id="quiz-next-btn" class="minimal-btn" style="margin-top: 14px; width: 100%; justify-content: center; background: #0284c7; color: #fff;">ข้อถัดไป >>></button>
        `;

        document.getElementById('quiz-next-btn')?.addEventListener('click', () => {
          this.renderQuizQuestion(questionIdx + 1, currentScore + (isCorrect ? 1 : 0));
        });
      });
    });
  }

  handleKeyEvent(event, isKeyDown) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    const code = event.code;

    // Eyepiece Navigation while looking through the microscope
    if (this.isLookingThroughEyepiece) {
      if (!isKeyDown) return;
      if (code === 'KeyA' || code === 'ArrowLeft') { this.microStation.panStage(-20, 0); return; }
      if (code === 'KeyD' || code === 'ArrowRight') { this.microStation.panStage(20, 0); return; }
      if (code === 'KeyW' || code === 'ArrowUp') { this.microStation.panStage(0, -20); return; }
      if (code === 'KeyS' || code === 'ArrowDown') { this.microStation.panStage(0, 20); return; }
      if (code === 'BracketLeft' || code === 'Minus') { this.microStation.adjustFocus(-3); return; }
      if (code === 'BracketRight' || code === 'Equal') { this.microStation.adjustFocus(3); return; }
      if (code === 'Escape') { this.toggleEyepieceView(false); return; }
      return;
    }

    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = isKeyDown;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = isKeyDown;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = isKeyDown;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = isKeyDown;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = isKeyDown;
  }

  updateDesktopWalking(delta) {
    if (this.renderer.xr.isPresenting || this.isLookingThroughEyepiece) return;

    const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
    const speed = (this.keys.sprint ? 4.8 : 2.6) * delta;

    if (isMoving) {
      // Forward direction from head yaw (facing -Z when yaw = 0)
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);

      // Right direction (perpendicular)
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);

      let moveX = 0;
      let moveZ = 0;

      if (this.keys.forward) { moveX += forwardX; moveZ += forwardZ; }
      if (this.keys.backward) { moveX -= forwardX; moveZ -= forwardZ; }
      if (this.keys.left) { moveX -= rightX; moveZ -= rightZ; }
      if (this.keys.right) { moveX += rightX; moveZ += rightZ; }

      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (len > 0) {
        moveX = (moveX / len) * speed;
        moveZ = (moveZ / len) * speed;

        this.playerPosition.x += moveX;
        this.playerPosition.z += moveZ;

        // Keep inside classroom boundaries
        this.playerPosition.x = Math.max(-7.0, Math.min(7.0, this.playerPosition.x));
        this.playerPosition.z = Math.max(-7.0, Math.min(7.0, this.playerPosition.z));

        // Human Head Bobbing & Walking Step Simulation
        this.walkCycle += delta * (this.keys.sprint ? 12 : 8.5);
        const bobY = Math.sin(this.walkCycle) * 0.024;
        const swayX = Math.cos(this.walkCycle * 0.5) * 0.012;
        const rollZ = Math.cos(this.walkCycle * 0.5) * 0.005;

        this.camera.position.set(
          this.playerPosition.x + swayX,
          this.playerEyeHeight + bobY,
          this.playerPosition.z
        );
        this.camera.rotation.z = rollZ;

        // Play footstep sound periodically
        const stepPhase = Math.sin(this.walkCycle);
        if (stepPhase < -0.92 && !this.stepTriggered) {
          sound.playFootstep();
          this.stepTriggered = true;
        } else if (stepPhase > 0) {
          this.stepTriggered = false;
        }
      }
    } else {
      // Natural idle stance
      this.camera.position.set(this.playerPosition.x, this.playerEyeHeight, this.playerPosition.z);
      this.camera.rotation.z = 0;
    }
  }

  updateCrosshairRaycast() {
    if (this.isLookingThroughEyepiece || this.renderer.xr.isPresenting) {
      this.currentHoveredObject = null;
      document.getElementById('action-tooltip')?.classList.add('hidden');
      document.getElementById('crosshair')?.classList.remove('active');
      return;
    }

    this.centerRaycaster.setFromCamera(this.centerScreen, this.camera);
    const hits = this.centerRaycaster.intersectObjects(this.interactiveObjects, true);

    const tooltipEl = document.getElementById('action-tooltip');
    const actionTextEl = document.getElementById('action-text');
    const crosshairEl = document.getElementById('crosshair');

    let found = null;
    for (const hit of hits) {
      // Natural human reaching distance (<= 3.8 meters)
      if (hit.distance <= 3.8) {
        const obj = this.findInteractiveAncestor(hit.object);
        if (obj && obj.userData?.name) {
          found = obj;
          break;
        }
      }
    }

    if (found) {
      this.currentHoveredObject = found;
      if (tooltipEl && actionTextEl) {
        actionTextEl.textContent = found.userData.name;
        tooltipEl.classList.remove('hidden');
      }
      crosshairEl?.classList.add('active');
    } else {
      this.currentHoveredObject = null;
      tooltipEl?.classList.add('hidden');
      crosshairEl?.classList.remove('active');
    }
  }

  animate(timeMs) {
    this.renderer.setAnimationLoop(() => {
      const time = performance.now() * 0.001;
      const delta = Math.max(0.001, Math.min(0.1, time - this.lastTime));
      this.lastTime = time;

      // 0. Smooth Camera Eyepiece Lean-in / Stand-up Animation
      if (this.cameraAnimation) {
        this.cameraAnimation.progress += delta / this.cameraAnimation.duration;
        const p = Math.min(1.0, this.cameraAnimation.progress);
        const ease = p * p * (3 - 2 * p); // Cubic Hermite smoothstep

        this.camera.position.lerpVectors(this.cameraAnimation.startPos, this.cameraAnimation.targetPos, ease);
        this.pitch = THREE.MathUtils.lerp(this.cameraAnimation.startPitch, this.cameraAnimation.targetPitch, ease);
        this.yaw = THREE.MathUtils.lerp(this.cameraAnimation.startYaw, this.cameraAnimation.targetYaw, ease);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.z = 0;

        if (p >= 1.0) {
          this.cameraAnimation = null;
        }
      }

      // 1. Desktop Human Locomotion & Walking
      this.updateDesktopWalking(delta);

      // 2. Crosshair Raycast Context Prompt
      this.updateCrosshairRaycast();

      // 3. VR Locomotion (Thumbstick walk + snap turn)
      this.vrControls.update(delta, this.interactiveObjects, this.classroomScene?.floor);

      // 4. Update Classroom & Stations
      this.classroomScene.update(time);
      this.microStation.update(time);
      this.osmosisStation.update(time);
      this.photoStation.update(time);
      this.bloodStation.update(time);

      // Mirror live specimen projection into eyepiece view canvas
      if (this.isLookingThroughEyepiece) {
        this.updateEyepieceHUD();
        const oCanvas = document.getElementById('eyepiece-canvas');
        if (oCanvas && this.microStation.displayCanvas) {
          const octx = oCanvas.getContext('2d');
          octx.drawImage(this.microStation.displayCanvas, 0, 0, oCanvas.width, oCanvas.height);
        }
        if (Math.abs(this.microStation.focusValue - 50) < 3) {
          labQuest.completeTask('focus');
        }
        if (this.microStation.currentObjective >= 40) {
          labQuest.completeTask('magnify');
        }
      }

      this.renderer.render(this.scene, this.camera);
    });
  }
}

// Start Application on Load (handles both already loaded and pending DOM)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BioVerseApp();
  });
} else {
  new BioVerseApp();
}