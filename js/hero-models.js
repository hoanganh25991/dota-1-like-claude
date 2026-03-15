// hero-models.js — Shared material and geometry helpers for all hero modules
// THREE is assumed to be a global (loaded via script tag)

export function stdMat(color, roughness = 0.7, metalness = 0.0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function glowMat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
}

export function metalMat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.9 });
}

export function transMat(color, opacity = 0.5) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity });
}

// Helper: box mesh
export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// Helper: cylinder mesh
export function cyl(rt, rb, h, seg, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// Helper: sphere mesh
export function sph(r, seg, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
