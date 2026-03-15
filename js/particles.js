// ============================================================
// particles.js — VFX / particle system for Crimson Lane
// All effects use Three.js geometry (no textures required).
// THREE is a global loaded via CDN script tag.
// ============================================================

import { scene } from './scene.js';

// ── Internal particle registry ────────────────────────────────
// Each entry: { type, group|mesh, age, maxAge, update(dt) }
const _particles = [];

// ── Shared geometries (reused across effects) ─────────────────
const _sphereGeo  = new THREE.SphereGeometry(0.18, 6, 5);
const _ringGeoCache = {};   // keyed by radius string

function _getRingGeo(radius) {
  const key = radius.toFixed(2);
  if (!_ringGeoCache[key]) {
    _ringGeoCache[key] = new THREE.TorusGeometry(radius, 0.18, 6, 32);
  }
  return _ringGeoCache[key];
}

// ── Material helpers ──────────────────────────────────────────
function _emissiveMat(color, opacity = 1.0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.0,
    transparent: opacity < 1.0,
    opacity,
    roughness: 0.2,
    depthWrite: false,
  });
}

// ── Internal helpers ──────────────────────────────────────────
function _addParticle(entry) {
  _particles.push(entry);
}

// ── spawnRing ─────────────────────────────────────────────────
// Expanding/fading torus ring at position (flat, horizontal).
export function spawnRing(position, color, radius = 3, duration = 0.8) {
  const mat = _emissiveMat(color, 1.0);
  const geo = _getRingGeo(radius);
  const mesh = new THREE.Mesh(geo, mat.clone());
  mesh.rotation.x = Math.PI / 2; // lay flat
  mesh.position.set(position.x, position.y + 0.1, position.z);
  scene.add(mesh);

  const startScale = 0.1;
  mesh.scale.setScalar(startScale);

  _addParticle({
    type: 'ring',
    mesh,
    age: 0,
    maxAge: duration,
    update(dt) {
      this.age += dt;
      const t = this.age / this.maxAge;
      const scale = startScale + t * 1.0;
      mesh.scale.setScalar(scale);
      mesh.material.opacity = 1.0 - t;
      if (this.age >= this.maxAge) {
        scene.remove(mesh);
        mesh.material.dispose();
        return true; // done
      }
      return false;
    },
  });
}

// ── spawnBurst ────────────────────────────────────────────────
// Small spheres burst outward from position, then fade and shrink.
export function spawnBurst(position, color, count = 6, speed = 5) {
  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  scene.add(group);

  const particles = [];
  for (let i = 0; i < count; i++) {
    const mat = _emissiveMat(color, 1.0);
    const mesh = new THREE.Mesh(_sphereGeo, mat);

    // Random spherical direction
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI;
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi) * 0.6 + 0.4,
      Math.sin(phi) * Math.sin(theta),
    ).multiplyScalar(speed * (0.6 + Math.random() * 0.8));

    mesh.position.set(0, 0, 0);
    group.add(mesh);
    particles.push({ mesh, vel, mat });
  }

  const maxAge = 0.55;

  _addParticle({
    type: 'burst',
    group,
    age: 0,
    maxAge,
    update(dt) {
      this.age += dt;
      const t = this.age / maxAge;

      for (const p of particles) {
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.y -= 9.8 * dt * 0.6; // mild gravity
        const scale = 1.0 - t * 0.8;
        p.mesh.scale.setScalar(Math.max(scale, 0.05));
        p.mat.opacity = 1.0 - t;
      }

      if (this.age >= maxAge) {
        for (const p of particles) p.mat.dispose();
        scene.remove(group);
        return true;
      }
      return false;
    },
  });
}

// ── spawnDamageFloat ──────────────────────────────────────────
// Rising flat box indicator that represents floating damage numbers.
// (No canvas textures — uses a colored emissive slab that rises and fades.)
export function spawnDamageFloat(position, amount, color = '#ff4444') {
  const col = new THREE.Color(color);

  // Scale width by digit count to give a rough "larger number = wider" feel
  const digits = String(Math.round(amount)).length;
  const w = 0.25 + digits * 0.15;

  const geo = new THREE.BoxGeometry(w, 0.22, 0.04);
  const mat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    position.x + (Math.random() - 0.5) * 0.6,
    position.y + 1.8,
    position.z + (Math.random() - 0.5) * 0.3,
  );
  // Always face +Z (toward typical camera direction)
  mesh.rotation.y = 0;
  scene.add(mesh);

  const riseSpeed = 1.4;
  const maxAge = 0.9;

  _addParticle({
    type: 'damageFloat',
    mesh,
    age: 0,
    maxAge,
    update(dt) {
      this.age += dt;
      const t = this.age / maxAge;
      mesh.position.y += riseSpeed * dt;
      mat.opacity = t < 0.5 ? 1.0 : 1.0 - (t - 0.5) * 2.0;
      if (this.age >= maxAge) {
        scene.remove(mesh);
        mat.dispose();
        geo.dispose();
        return true;
      }
      return false;
    },
  });
}

// ── spawnDeathFlash ───────────────────────────────────────────
// Sets emissive white on all meshes in the hero group, fades out.
export function spawnDeathFlash(heroGroup) {
  if (!heroGroup) return;

  const affectedMats = [];

  heroGroup.traverse(child => {
    if (child.isMesh && child.material) {
      // Clone material so we don't permanently alter the shared one
      const origMat = child.material;
      const flashMat = origMat.clone();
      flashMat.emissive = new THREE.Color(0xffffff);
      flashMat.emissiveIntensity = 1.5;
      child.material = flashMat;
      affectedMats.push({ child, origMat, flashMat });
    }
  });

  const maxAge = 0.25;

  _addParticle({
    type: 'deathFlash',
    age: 0,
    maxAge,
    update(dt) {
      this.age += dt;
      const t = this.age / maxAge;
      for (const { flashMat } of affectedMats) {
        flashMat.emissiveIntensity = 1.5 * (1.0 - t);
      }
      if (this.age >= maxAge) {
        // Restore originals
        for (const { child, origMat, flashMat } of affectedMats) {
          if (child.parent) child.material = origMat;
          flashMat.dispose();
        }
        return true;
      }
      return false;
    },
  });
}

// ── spawnProjectile ───────────────────────────────────────────
// Moving glowing sphere from `from` to `to`, calls onHit when arrived.
export function spawnProjectile(from, to, color, speed = 30, onHit = null) {
  const mat = _emissiveMat(color, 1.0);
  const geo = new THREE.SphereGeometry(0.22, 7, 6);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(from.x, from.y + 0.5, from.z);

  // Trail group containing a few smaller spheres behind the main one
  const trailGroup = new THREE.Group();
  const trailCount = 4;
  const trailMeshes = [];
  for (let i = 0; i < trailCount; i++) {
    const tGeo = new THREE.SphereGeometry(0.14 - i * 0.025, 5, 4);
    const tMat = _emissiveMat(color, 0.7 - i * 0.15);
    const tm = new THREE.Mesh(tGeo, tMat);
    trailGroup.add(tm);
    trailMeshes.push({ mesh: tm, mat: tMat, offset: (i + 1) * 0.18 });
  }

  scene.add(mesh);
  scene.add(trailGroup);

  const target = new THREE.Vector3(to.x, to.y !== undefined ? to.y + 0.5 : 0.5, to.z);
  const dir = new THREE.Vector3().subVectors(target, mesh.position).normalize();
  const distance = new THREE.Vector3().subVectors(target, mesh.position).length();
  let travelled = 0;

  const projObj = {
    type: 'projectile',
    mesh,
    trailGroup,
    age: 0,
    maxAge: (distance / speed) + 0.5, // safety margin
    done: false,
    update(dt) {
      if (this.done) return true;

      const step = speed * dt;
      mesh.position.addScaledVector(dir, step);
      travelled += step;

      // Update trail positions (lag behind)
      for (let i = 0; i < trailMeshes.length; i++) {
        const { mesh: tm, offset } = trailMeshes[i];
        tm.position.copy(mesh.position).addScaledVector(dir, -offset);
      }

      this.age += dt;

      // Check arrival
      const remaining = new THREE.Vector3().subVectors(target, mesh.position).length();
      if (remaining < 0.5 || travelled >= distance) {
        this.done = true;
        scene.remove(mesh);
        scene.remove(trailGroup);
        mat.dispose();
        for (const t of trailMeshes) t.mat.dispose();
        if (onHit) onHit();
        return true;
      }
      return false;
    },
  };

  _addParticle(projObj);
  return projObj;
}

// ── spawnShockwave ────────────────────────────────────────────
// Expanding flat ring on the ground (for area abilities).
export function spawnShockwave(position, color, maxRadius = 5, duration = 0.5) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Use ring geometry that we'll rebuild each frame via scale
  const geo = new THREE.RingGeometry(0.8, 1.0, 36);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(position.x, 0.05, position.z);
  scene.add(mesh);

  _addParticle({
    type: 'shockwave',
    mesh,
    age: 0,
    maxAge: duration,
    update(dt) {
      this.age += dt;
      const t = this.age / this.maxAge;
      const scale = maxRadius * t;
      mesh.scale.setScalar(scale);
      mat.opacity = 0.8 * (1 - t);
      if (this.age >= this.maxAge) {
        scene.remove(mesh);
        mat.dispose();
        geo.dispose();
        return true;
      }
      return false;
    },
  });
}

// ── spawnLightningBolt ────────────────────────────────────────
// Jagged line from one point to another using small box segments.
export function spawnLightningBolt(from, to, color = 0xffff44, duration = 0.15) {
  const group = new THREE.Group();
  scene.add(group);

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });

  const segments = 8;
  const start = new THREE.Vector3(from.x, from.y + 0.5, from.z);
  const end   = new THREE.Vector3(to.x,   to.y + 0.5,   to.z);
  const total = new THREE.Vector3().subVectors(end, start);
  const segLen = total.length() / segments;

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;

    const p0 = new THREE.Vector3().lerpVectors(start, end, t0);
    const p1 = new THREE.Vector3().lerpVectors(start, end, t1);

    // Add random lateral jitter
    if (i > 0 && i < segments - 1) {
      const perp = new THREE.Vector3(-total.z, 0, total.x).normalize();
      const jitter = (Math.random() - 0.5) * segLen * 0.6;
      p0.addScaledVector(perp, jitter);
    }

    const mid = new THREE.Vector3().lerpVectors(p0, p1, 0.5);
    const segVec = new THREE.Vector3().subVectors(p1, p0);
    const len = segVec.length();

    const geo = new THREE.BoxGeometry(0.08, 0.08, len);
    const seg = new THREE.Mesh(geo, mat);
    seg.position.copy(mid);
    seg.lookAt(p1);
    group.add(seg);
  }

  _addParticle({
    type: 'lightning',
    group,
    age: 0,
    maxAge: duration,
    update(dt) {
      this.age += dt;
      const t = this.age / this.maxAge;
      mat.opacity = 1.0 - t;
      if (this.age >= this.maxAge) {
        scene.remove(group);
        mat.dispose();
        return true;
      }
      return false;
    },
  });
}

// ── spawnHealOrb ─────────────────────────────────────────────
// Rising, fading green orb for heal/regeneration feedback.
export function spawnHealOrb(position, amount = 0) {
  const col = 0x44ff88;
  const mat = _emissiveMat(col, 1.0);
  const geo = new THREE.SphereGeometry(0.35 + Math.min(amount / 200, 0.3), 8, 7);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(position.x, position.y + 0.6, position.z);
  scene.add(mesh);

  const maxAge = 0.7;

  _addParticle({
    type: 'healOrb',
    mesh,
    age: 0,
    maxAge,
    update(dt) {
      this.age += dt;
      const t = this.age / maxAge;
      mesh.position.y += 1.0 * dt;
      mat.opacity = 1.0 - t;
      mesh.scale.setScalar(1.0 + t * 0.5);
      if (this.age >= maxAge) {
        scene.remove(mesh);
        mat.dispose();
        geo.dispose();
        return true;
      }
      return false;
    },
  });
}

// ── updateParticles ───────────────────────────────────────────
// Call once per frame with elapsed delta time.
export function updateParticles(dt) {
  for (let i = _particles.length - 1; i >= 0; i--) {
    const done = _particles[i].update(dt);
    if (done) {
      _particles.splice(i, 1);
    }
  }
}

// ── clearAllParticles ─────────────────────────────────────────
// Force-remove all active particles (use on match reset).
export function clearAllParticles() {
  for (const p of _particles) {
    if (p.mesh  && p.mesh.parent)  scene.remove(p.mesh);
    if (p.group && p.group.parent) scene.remove(p.group);
    if (p.trailGroup && p.trailGroup.parent) scene.remove(p.trailGroup);
  }
  _particles.length = 0;
}

// ── Spell-specific convenience effects ────────────────────────

export function fxFrostNova(position) {
  spawnRing(position, 0x00ffcc, 4, 0.7);
  spawnBurst(position, 0x00eeff, 8, 4);
  spawnShockwave(position, 0x00ccff, 4.5, 0.6);
}

export function fxChainFrost(from, to) {
  spawnProjectile(from, to, 0x00ffcc, 40, null);
  spawnRing(from, 0x00ddff, 1.5, 0.3);
}

export function fxFireball(position) {
  spawnBurst(position, 0xff6600, 10, 7);
  spawnBurst(position, 0xffaa00, 6, 4);
  spawnShockwave(position, 0xff4400, 4, 0.5);
  spawnRing(position, 0xff2200, 3, 0.4);
}

export function fxLightning(position) {
  spawnBurst(position, 0xffff44, 6, 6);
  spawnRing(position, 0xffee00, 2, 0.3);
}

export function fxBloodSplat(position) {
  spawnBurst(position, 0x880000, 5, 3.5);
  spawnBurst(position, 0xcc2200, 3, 2.0);
}

export function fxBlink(fromPos, toPos) {
  // Vanish burst at origin
  spawnBurst(fromPos, 0x9944ff, 6, 5);
  spawnRing(fromPos, 0x6622cc, 2, 0.35);
  // Appear burst at destination
  spawnBurst(toPos, 0xcc88ff, 8, 6);
  spawnRing(toPos, 0xaa44ff, 3, 0.5);
}

export function fxTeleport(position) {
  spawnRing(position, 0x4488ff, 5, 1.0);
  spawnBurst(position, 0x2266ff, 8, 4);
  spawnShockwave(position, 0x2244cc, 5.5, 0.9);
}

export function fxArrowShot(from, to, onHit) {
  return spawnProjectile(from, to, 0xffdd88, 38, onHit);
}

export function fxTowerShot(from, to, onHit) {
  return spawnProjectile(from, to, 0xffffff, 28, onHit);
}

export function fxMeleeHit(position) {
  spawnBurst(position, 0xffcc44, 4, 4);
}

export function fxLevelUp(position) {
  spawnRing(position, 0xffdd00, 3, 0.9);
  spawnBurst(position, 0xffff88, 10, 5);
  spawnShockwave(position, 0xffcc00, 4, 0.8);
}
