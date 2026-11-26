import * as THREE from 'three';
import { sound } from './audio.js';

export class VRControlsManager {
  constructor(renderer, scene, camera, cameraDolly) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.cameraDolly = cameraDolly;

    this.controllers = [];
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.forwardDir = new THREE.Vector3();
    this.sideDir = new THREE.Vector3();

    this.onSelectCallback = null;

    // Locomotion settings
    this.moveSpeed = 2.8; // m/s
    this.snapTurnAngle = Math.PI / 4; // 45 degrees
    this.canSnapTurn = true;

    // Floor Teleport Reticle
    this.initTeleportReticle();
    this.initVRControllers();
  }

  initTeleportReticle() {
    const ringGeo = new THREE.RingGeometry(0.2, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.teleportReticle = new THREE.Mesh(ringGeo, ringMat);
    this.teleportReticle.rotation.x = -Math.PI / 2;
    this.teleportReticle.visible = false;
    this.scene.add(this.teleportReticle);

    // Inner glowing dot
    const dotGeo = new THREE.CircleGeometry(0.08, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.z = 0.001;
    this.teleportReticle.add(dot);
  }

  initVRControllers() {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -4)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7
    });

    const dotGeo = new THREE.RingGeometry(0.015, 0.025, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide });

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);

      controller.addEventListener('selectstart', e => this.onSelectStart(e));
      controller.addEventListener('selectend', e => this.onSelectEnd(e));
      controller.addEventListener('select', e => this.onSelect(e));

      // Visual laser line
      const line = new THREE.Line(lineGeo, lineMat.clone());
      line.name = 'laser';
      controller.add(line);

      // Dot marker
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.position.set(0, 0, -3.99);
      dot.name = 'reticle';
      controller.add(dot);

      // Add controllers directly into cameraDolly so they move with the player!
      this.cameraDolly.add(controller);
      this.controllers.push(controller);
    }
  }

  onSelectStart(event) {
    const controller = event.target;
    const laser = controller.getObjectByName('laser');
    if (laser) {
      laser.material.color.setHex(0x00ffcc);
      laser.material.opacity = 1.0;
    }
  }

  onSelectEnd(event) {
    const controller = event.target;
    const laser = controller.getObjectByName('laser');
    if (laser) {
      laser.material.color.setHex(0x38bdf8);
      laser.material.opacity = 0.7;
    }
  }

  onSelect(event) {
    const controller = event.target;
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

    // If pointing at floor, teleport directly!
    if (this.teleportReticle.visible) {
      this.cameraDolly.position.x = this.teleportReticle.position.x;
      this.cameraDolly.position.z = this.teleportReticle.position.z;
      sound.playWarpTransition();
      this.teleportReticle.visible = false;
      return;
    }

    if (this.onSelectCallback) {
      this.onSelectCallback(this.raycaster);
    }

    // Haptic feedback
    try {
      const session = this.renderer.xr.getSession();
      if (session && session.inputSources) {
        session.inputSources.forEach(source => {
          if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
            source.gamepad.hapticActuators[0].pulse(0.4, 50);
          }
        });
      }
    } catch (e) {}
  }

  update(delta, interactiveObjects, floorMesh) {
    if (!this.renderer.xr.isPresenting) {
      this.teleportReticle.visible = false;
      return;
    }

    // 1. Process VR Thumbstick Locomotion
    this.handleThumbstickLocomotion(delta);

    // 2. Raycast Laser and Floor Teleport Target
    let floorHitFound = false;

    this.controllers.forEach(controller => {
      this.tempMatrix.identity().extractRotation(controller.matrixWorld);
      this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

      const laser = controller.getObjectByName('laser');
      const reticle = controller.getObjectByName('reticle');

      // Check interactive equipment first
      const itemHits = this.raycaster.intersectObjects(interactiveObjects, true);
      if (itemHits.length > 0) {
        const dist = itemHits[0].distance;
        if (laser) laser.scale.z = dist / 4;
        if (reticle) reticle.position.z = -dist + 0.01;
        return;
      }

      // Check floor for teleportation
      if (floorMesh) {
        const floorHits = this.raycaster.intersectObject(floorMesh, false);
        if (floorHits.length > 0 && floorHits[0].distance < 12) {
          const hit = floorHits[0];
          this.teleportReticle.position.set(hit.point.x, hit.point.y + 0.01, hit.point.z);
          this.teleportReticle.visible = true;
          floorHitFound = true;

          if (laser) laser.scale.z = hit.distance / 4;
          if (reticle) reticle.position.z = -hit.distance + 0.01;
          return;
        }
      }

      if (laser) laser.scale.z = 1.0;
      if (reticle) reticle.position.z = -3.99;
    });

    if (!floorHitFound) {
      this.teleportReticle.visible = false;
    }
  }

  handleThumbstickLocomotion(delta) {
    const session = this.renderer.xr.getSession();
    if (!session || !session.inputSources) return;

    // Get Headset horizontal forward vector
    this.camera.getWorldDirection(this.forwardDir);
    this.forwardDir.y = 0;
    this.forwardDir.normalize();

    // Get right horizontal vector
    this.sideDir.crossVectors(this.forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

    session.inputSources.forEach(source => {
      if (!source.gamepad) return;

      const axes = source.gamepad.axes;
      if (!axes || axes.length < 2) return;

      // Handle Left Hand: Smooth Walking
      if (source.handedness === 'left' || (axes.length >= 4 && axes[2] !== 0)) {
        const stickX = axes.length >= 4 ? axes[2] : axes[0];
        const stickY = axes.length >= 4 ? axes[3] : axes[1];

        const deadzone = 0.15;
        if (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone) {
          const speed = this.moveSpeed * delta;
          const moveZ = stickY * speed;
          const moveX = stickX * speed;

          this.cameraDolly.position.addScaledVector(this.forwardDir, -moveZ);
          this.cameraDolly.position.addScaledVector(this.sideDir, moveX);

          // Constrain within lab walls
          this.cameraDolly.position.x = Math.max(-7.0, Math.min(7.0, this.cameraDolly.position.x));
          this.cameraDolly.position.z = Math.max(-7.0, Math.min(7.0, this.cameraDolly.position.z));
        }
      }

      // Handle Right Hand: Snap Turn
      if (source.handedness === 'right') {
        const turnAxis = axes.length >= 4 ? axes[2] : axes[0];
        const threshold = 0.6;

        if (Math.abs(turnAxis) > threshold) {
          if (this.canSnapTurn) {
            const dir = turnAxis > 0 ? -1 : 1;
            this.cameraDolly.rotation.y += dir * this.snapTurnAngle;
            this.canSnapTurn = false;
          }
        } else if (Math.abs(turnAxis) < 0.2) {
          this.canSnapTurn = true;
        }
      }
    });
  }
}
