import * as THREE from "three";

/*
 * Procedural glass-shard geometry for HeroGlassScene. Each shard asset base
 * gets ONE shared, seeded geometry (shards that reuse an asset — e.g. the
 * two shard-mid-03 placements — reuse the same BufferGeometry object, only
 * their mesh transforms differ), mirroring how the image composition reuses
 * the same 8 source photos at different crops/scales/rotations.
 *
 * Geometry is normalized to width 1 and centered on the origin so the scene
 * can scale a mesh to its DOM wrapper's measured pixel width directly.
 *
 * Seeded (not Math.random): the silhouette must be stable across mounts,
 * HMR, and sessions — the composition was tuned against specific shapes.
 */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CrackSpec {
  /** Center of the crack line, in normalized (width=1, centered) space. */
  x: number;
  y: number;
  rotationZ: number;
  length: number;
}

export interface ShardGlassSpec {
  geometry: THREE.BufferGeometry;
  cracks: CrackSpec[];
}

/** Relative extrusion depth — thin slab, read as pane thickness. */
const EXTRUDE_DEPTH = 0.055;
const BEVEL = 0.03;

/** Deterministic per-position noise for facet displacement: coincident
 * (duplicated, non-indexed) vertices get identical offsets, so the surface
 * stays watertight while triangles tilt into distinct facets. */
function positionNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * The signature of the reference shards is a front face cut into angular
 * facets — some catching the key light silvery-bright, others falling to
 * near-black. A flat extrusion cap reflects uniformly and reads matte, so
 * the cap vertices are displaced in z by seeded noise; with non-indexed
 * geometry + computeVertexNormals this yields crisp per-triangle facet
 * normals, i.e. real cut-glass planes.
 */
function displaceFrontCap(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  const frontZ = EXTRUDE_DEPTH * 0.99;
  for (let i = 0; i < positions.count; i += 1) {
    const z = positions.getZ(i);
    if (z > frontZ) {
      const offset = (positionNoise(positions.getX(i), positions.getY(i)) - 0.5) * 0.14;
      positions.setZ(i, z + offset);
    }
  }
  positions.needsUpdate = true;
}

function buildOutline(random: () => number, aspect: number): THREE.Vector2[] {
  // Irregular fracture silhouette: 6-9 vertices around a jittered ellipse.
  const vertexCount = 6 + Math.floor(random() * 4);
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < vertexCount; i += 1) {
    const baseAngle = (i / vertexCount) * Math.PI * 2;
    const angle = baseAngle + ((random() - 0.5) * Math.PI) / vertexCount;
    const radius = 0.55 + random() * 0.45;
    points.push(new THREE.Vector2(Math.cos(angle) * 0.5 * radius, Math.sin(angle) * 0.5 * aspect * radius));
  }
  return points;
}

function pointInPolygon(x: number, y: number, polygon: THREE.Vector2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

interface NormalizedGeometry {
  geometry: THREE.BufferGeometry;
  /** Outline-space -> normalized-space transform, for the crack specs. */
  center: THREE.Vector3;
  scale: number;
}

function buildShardGeometry(points: THREE.Vector2[]): NormalizedGeometry {
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_DEPTH,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    // A single bevel segment keeps the edge a distinct angled cut face —
    // the luminous rim of the reference — instead of a rounded-off edge.
    bevelSegments: 1,
  });
  displaceFrontCap(geometry);
  // Non-indexed geometry -> computeVertexNormals is per-triangle (flat):
  // exactly the crisp facet shading cut glass needs.
  geometry.computeVertexNormals();

  // Normalize: center on origin, exact width 1.
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  const width = box.max.x - box.min.x;
  const scale = 1 / width;
  geometry.scale(scale, scale, scale);
  return { geometry, center, scale };
}

function buildCracks(
  random: () => number,
  aspect: number,
  outline: THREE.Vector2[],
  center: THREE.Vector3,
  normalizeScale: number,
): CrackSpec[] {
  // Restrained by design: 3 hairline cracks per shard, chords through the
  // interior, never a busy web. The crack meshes render with depthTest off
  // (the glass surface would otherwise occlude them), which means any part
  // extending past the silhouette would float in mid-air — so candidates
  // are rejection-sampled until BOTH endpoints land strictly inside the
  // outline polygon (with margin, via the 0.8 endpoint shrink).
  const cracks: CrackSpec[] = [];
  let attempts = 0;
  while (cracks.length < 3 && attempts < 60) {
    attempts += 1;
    const x = (random() - 0.5) * 0.25;
    const y = (random() - 0.5) * 0.25 * aspect;
    const rotationZ = random() * Math.PI;
    const length = 0.3 + random() * 0.25;
    const half = (length / 2) * 0.8;
    const dx = Math.cos(rotationZ) * half;
    const dy = Math.sin(rotationZ) * half;
    if (pointInPolygon(x + dx, y + dy, outline) && pointInPolygon(x - dx, y - dy, outline)) {
      // Same outline-space -> normalized-space transform the geometry got.
      cracks.push({
        x: (x - center.x) * normalizeScale,
        y: (y - center.y) * normalizeScale,
        rotationZ,
        length: length * normalizeScale,
      });
    }
  }
  return cracks;
}

const specCache = new Map<string, ShardGlassSpec>();

/**
 * Shared spec for a shard asset. `aspect` is the asset's h/w ratio so the
 * silhouette matches the DOM wrapper's layout box it will be scaled to.
 */
export function getShardGlassSpec(assetBase: string, aspect: number): ShardGlassSpec {
  const cached = specCache.get(assetBase);
  if (cached) return cached;
  const random = mulberry32(hashSeed(assetBase));
  const outline = buildOutline(random, aspect);
  const { geometry, center, scale } = buildShardGeometry(outline);
  const spec: ShardGlassSpec = {
    geometry,
    cracks: buildCracks(random, aspect, outline, center, scale),
  };
  specCache.set(assetBase, spec);
  return spec;
}
