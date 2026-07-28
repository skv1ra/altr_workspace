"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, SMAA } from "@react-three/postprocessing";
import { SHARDS } from "../HeroLayers";
import { getShardGlassSpec } from "./glassGeometry";

/*
 * Photoreal glass rendering layer (WebGL) for the hero shard field.
 *
 * This is deliberately a pure RENDERER, not a second animation system: every
 * frame, each glass mesh reads its existing DOM shard wrapper's live
 * geometry (getBoundingClientRect center + computed-transform rotation) and
 * mirrors it in world space. Drift keyframes, pointer parallax, scroll
 * separation, and layout all keep running exactly where they already run
 * (CSS + useHeroShardMotion) — the glass follows whatever the DOM does, so
 * trajectories/timing/easing are preserved by construction, not by
 * reimplementation.
 *
 * Performance posture (60fps budget):
 *  - MeshTransmissionMaterial gets a BAKED background `buffer` texture, so
 *    drei skips its per-frame transmission scene re-render entirely (its
 *    useFrame pass only runs when buffer === its own FBO — verified against
 *    the installed drei source).
 *  - Environment is baked once (frames={1}) from Lightformers — no live
 *    reflection probes, no HDR network fetch, palette fully controlled
 *    (cool white / silver-blue, no neon).
 *  - Geometry is shared per shard asset (shards reusing an asset reuse one
 *    BufferGeometry).
 *  - DoF/Bloom run at reduced resolution (resolutionScale well under 1).
 *  - The frameloop suspends when the hero is offscreen or the tab hidden
 *    (same discipline as useHeroPointer/useHeroShardMotion), and drops to
 *    demand-rendering under reduced motion (nothing moves — no reason to
 *    burn GPU frames).
 */

interface HeroGlassSceneProps {
  sceneRef: RefObject<HTMLDivElement | null>;
  shardElsRef: RefObject<Map<string, HTMLDivElement>>;
  reducedMotion: boolean;
  /** Called once the first WebGL frame has actually been presented — the
   * caller then hides the fallback shard images (seamless swap). */
  onFirstFrame: () => void;
  /** Called on WebGL context loss — the caller restores the image layer. */
  onFailure: () => void;
}

const CAMERA_Z = 10;
const CAMERA_FOV = 35;

/**
 * Depth (world z) per shard, derived from the composition's own DOF story:
 * pre-blurred foreground tier sits near the camera, sharp shards on the
 * focus plane (z=0), background blur maps to distance behind it. DoF then
 * reproduces the current blur hierarchy optically instead of via filter().
 */
function depthFor(shard: (typeof SHARDS)[number]): number {
  if (shard.tier === "front") return 2.9 + (shard.blur - 18) * 0.1;
  if (shard.blur <= 0) return 0;
  if (shard.blur <= 3) return -0.35 * shard.blur;
  return -1.6 - (shard.blur - 6) * 0.35;
}

/**
 * Per-fragment material tuning (large hero shard vs small background
 * shards), all within the premium-glass envelope: transmission 0.9-1,
 * thickness 0.4-2 by size, roughness 0.06-0.14, ior 1.5-1.7.
 *
 * The graphite-to-black body tint (#0a0a0d..#16161a territory) is produced
 * by VOLUME ATTENUATION, not by darkening `color`: `color` multiplies the
 * transmitted light, so a near-black value collapses every facet to a flat
 * silhouette (measured — exactly the matte look this layer replaces).
 * A light base color + dark attenuationColor over a short
 * attenuationDistance gives thick regions the deep graphite body while
 * edges and thin bevels stay luminous — how real smoked glass behaves.
 */
function tuningFor(shard: (typeof SHARDS)[number]) {
  const large = shard.sizeValue >= 20;
  const small = shard.sizeValue < 10;
  const distant = shard.blur >= 6;
  return {
    transmission: distant ? 0.92 : 1,
    thickness: large ? 1.6 : small ? 0.45 : 1,
    roughness: distant ? 0.14 : large ? 0.06 : 0.09,
    ior: large ? 1.62 : 1.52,
    chromaticAberration: large ? 0.028 : 0.02,
    envMapIntensity: large ? 3.1 : distant ? 1.6 : 2.1,
    color: large ? "#c7ccd3" : "#c2c7cf",
    attenuationColor: "#101218",
    attenuationDistance: large ? 2.4 : 0.85,
    /** The image composition's own depth cue: far shards sit at 0.4
     * opacity, atmospheric. The glass keeps that exact hierarchy. */
    opacity: shard.opacity,
  };
}

/** Key light direction (world) — shared by the light rig and crack glints. */
const KEY_LIGHT_POSITION = new THREE.Vector3(-6, 7, 6);

const CRACK_VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Hairline internal fracture: additive white line whose intensity follows
// the view/key-light alignment, so cracks "catch" the key light rather than
// glowing uniformly.
const CRACK_FRAGMENT = /* glsl */ `
  uniform vec3 uLightDir;
  uniform float uOpacity;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float glint = pow(max(dot(viewDir, normalize(uLightDir)), 0.0), 3.0);
    float alpha = uOpacity * (0.3 + 0.7 * glint);
    gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), alpha);
  }
`;

/**
 * Baked "what the glass refracts" texture: the void-black hero canvas with
 * the same barely-there (<= 6%) light breaths as .fogBase.
 * MeshTransmissionMaterial samples this in screen space, so refracting it
 * reads as refracting the hero's own background — without ever
 * re-rendering the scene into an FBO per frame.
 */
function createBackgroundBuffer(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);
  const bright = ctx.createRadialGradient(size * 0.24, size * 0.42, 0, size * 0.24, size * 0.42, size * 0.6);
  bright.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  bright.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bright;
  ctx.fillRect(0, 0, size, size);
  const haze = ctx.createRadialGradient(size * 0.62, size * 0.5, 0, size * 0.62, size * 0.5, size * 0.7);
  haze.addColorStop(0, "rgba(217, 221, 225, 0.05)");
  haze.addColorStop(1, "rgba(185, 192, 199, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ShardField({
  sceneRef,
  shardElsRef,
  onFirstFrame,
}: Pick<HeroGlassSceneProps, "sceneRef" | "shardElsRef" | "onFirstFrame">) {
  const groupRefs = useRef(new Map<string, THREE.Group>());
  const firstFrameSent = useRef(false);

  const backgroundBuffer = useMemo(createBackgroundBuffer, []);
  useEffect(() => () => backgroundBuffer.dispose(), [backgroundBuffer]);

  const crackMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CRACK_VERTEX,
        fragmentShader: CRACK_FRAGMENT,
        uniforms: {
          uLightDir: { value: KEY_LIGHT_POSITION.clone().normalize() },
          uOpacity: { value: 0.26 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        // The lines sit inside the slab; the glass surface would otherwise
        // depth-occlude them. Rendered after the glass instead (renderOrder
        // on the crack meshes) so they read as internal fracture light.
        depthTest: false,
      }),
    [],
  );
  useEffect(() => () => crackMaterial.dispose(), [crackMaterial]);

  const shards = useMemo(
    () =>
      SHARDS.map((shard) => {
        // Static 3D presentation tilt (seeded per shard id): the reference
        // shards are photographed at an angle, so their facet planes catch
        // distinct env regions. Facing the camera dead-on flattens every
        // facet into one reflection. Screen POSITION still comes 1:1 from
        // the DOM each frame — this tilt is orientation only, constant in
        // time, so trajectories/timing are untouched.
        let hash = 0;
        for (const char of shard.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
        const tiltX = -0.06 - (Math.abs(hash % 97) / 97) * 0.14;
        const tiltY = (((Math.abs(hash % 89) / 89) * 2 - 1) > 0 ? 1 : -1) * (0.18 + (Math.abs(hash % 83) / 83) * 0.22);
        return {
          shard,
          depth: depthFor(shard),
          tuning: tuningFor(shard),
          spec: getShardGlassSpec(shard.base, shard.h / shard.w),
          tiltX,
          tiltY,
        };
      }),
    [],
  );

  useFrame(({ camera, size }) => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;
    const sceneRect = sceneEl.getBoundingClientRect();
    if (sceneRect.width === 0 || sceneRect.height === 0) return;
    const halfFovTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    for (const { shard, depth, tuning, tiltX, tiltY } of shards) {
      const group = groupRefs.current.get(shard.id);
      const el = shardElsRef.current?.get(shard.id);
      if (!group || !el) continue;

      const rect = el.getBoundingClientRect();
      const widthPx = el.offsetWidth;
      if (widthPx === 0) {
        group.visible = false;
        continue;
      }
      group.visible = true;

      // World-units-per-CSS-pixel at this shard's depth plane.
      const distance = camera.position.z - depth;
      const worldPerPx = (2 * distance * halfFovTan) / size.height;

      const centerX = rect.left + rect.width / 2 - sceneRect.left;
      const centerY = rect.top + rect.height / 2 - sceneRect.top;
      group.position.set((centerX - size.width / 2) * worldPerPx, (size.height / 2 - centerY) * worldPerPx, depth);
      const meshScale = widthPx * worldPerPx;
      group.scale.setScalar(meshScale);

      // three's transmission volume ray scales `thickness` by the model
      // matrix scale — without this correction the biggest shards absorb
      // over a path several world units long and collapse to black slabs
      // (measured). Normalizing keeps each shard's absorption at its tuned
      // value regardless of mesh scale or viewport size.
      const glassMesh = group.children[0] as THREE.Mesh | undefined;
      const material = glassMesh?.material as (THREE.Material & { thickness?: number }) | undefined;
      if (material && meshScale > 0) {
        material.thickness = tuning.thickness / meshScale;
      }

      // True current rotation (static tilt AND any live drift keyframe),
      // read from the computed transform. CSS rotates clockwise in a y-down
      // space; three.js z-rotation is counterclockwise in y-up — negate.
      const transform = getComputedStyle(el).transform;
      let rotationZ = -THREE.MathUtils.degToRad(shard.rotate);
      if (transform && transform !== "none") {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const [a, b] = matrix[1].split(",").map(Number);
          rotationZ = -Math.atan2(b, a);
        }
      }
      group.rotation.set(tiltX, tiltY, rotationZ);
    }

    if (!firstFrameSent.current) {
      firstFrameSent.current = true;
      // Two rAFs: this callback runs before the first render is presented;
      // by the second frame the swap is guaranteed seamless.
      requestAnimationFrame(() => requestAnimationFrame(onFirstFrame));
    }
  });

  return (
    <>
      {shards.map(({ shard, tuning, spec }) => (
        <group
          key={shard.id}
          ref={(group) => {
            if (group) groupRefs.current.set(shard.id, group);
            else groupRefs.current.delete(shard.id);
          }}
        >
          <mesh geometry={spec.geometry}>
            <MeshTransmissionMaterial
              buffer={backgroundBuffer}
              transmissionSampler={false}
              samples={3}
              transmission={tuning.transmission}
              thickness={tuning.thickness}
              roughness={tuning.roughness}
              ior={tuning.ior}
              chromaticAberration={tuning.chromaticAberration}
              anisotropy={0.1}
              clearcoat={0.3}
              clearcoatRoughness={0.1}
              envMapIntensity={tuning.envMapIntensity}
              color={tuning.color}
              attenuationColor={tuning.attenuationColor}
              attenuationDistance={tuning.attenuationDistance}
              transparent
              opacity={tuning.opacity}
              distortion={0.12}
              distortionScale={0.4}
              temporalDistortion={0}
            />
          </mesh>
          {spec.cracks.map((crack, index) => (
            <mesh
              key={index}
              material={crackMaterial}
              renderOrder={2}
              position={[crack.x, crack.y, 0]}
              rotation={[0, 0, crack.rotationZ]}
            >
              <planeGeometry args={[crack.length, 0.0028]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * Three-point rig per the brief: cool white directional key (~45°, drives
 * the linear specular streak along fragment edges), subtle silver-blue rim
 * from behind for edge separation, and fill from the baked environment map
 * only (no ambient light).
 */
function LightRig() {
  return (
    <>
      <directionalLight position={KEY_LIGHT_POSITION.toArray()} intensity={2.4} color="#f4f7fb" />
      <directionalLight position={[5, -2, -6]} intensity={1.1} color="#aebfd4" />
      <Environment frames={1} resolution={256} background={false}>
        {/* Long key strip — the linear studio streak on beveled edges. */}
        <Lightformer form="rect" intensity={6} color="#ffffff" position={[-4, 5, 4]} scale={[9, 1.2, 1]} target={[0, 0, 0]} />
        {/* Silver-blue rim card behind camera-right. */}
        <Lightformer form="rect" intensity={2.5} color="#b9c6d6" position={[6, 2, -5]} scale={[6, 1, 1]} target={[0, 0, 0]} />
        {/* Broad, dim floor fill so lower facets never go dead black. */}
        <Lightformer form="rect" intensity={0.4} color="#e2e6ea" position={[0, -5, 2]} scale={[10, 3, 1]} target={[0, 0, 0]} />
        {/* Large soft overhead panel: upward-tilted facets pick up the
            silvery sheen the reference shards show, instead of reflecting
            pure black env background. */}
        <Lightformer form="rect" intensity={1.3} color="#dfe4ea" position={[0, 6, 1]} scale={[12, 4, 1]} target={[0, 0, 0]} />
        {/* Dim silver "room" behind the camera — camera-facing facets
            otherwise reflect the env's black void and read matte. */}
        <Lightformer form="rect" intensity={0.55} color="#c9d0d8" position={[0, 0, 9]} scale={[16, 10, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

/** Suspends/demand-gates the frameloop exactly like the DOM motion hooks. */
function useFrameloop(sceneRef: HeroGlassSceneProps["sceneRef"], reducedMotion: boolean) {
  const [frameloop, setFrameloop] = useState<"always" | "demand" | "never">(reducedMotion ? "demand" : "always");

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;
    let intersecting = true;

    function resolve() {
      const active = intersecting && document.visibilityState === "visible";
      setFrameloop(active ? (reducedMotion ? "demand" : "always") : "never");
    }

    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      resolve();
    });
    observer.observe(sceneEl);
    document.addEventListener("visibilitychange", resolve);
    resolve();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", resolve);
    };
  }, [sceneRef, reducedMotion]);

  return frameloop;
}

/** Under demand rendering, kick a few frames on mount/resize so the static
 * scene settles (mesh transforms are applied inside useFrame). */
function DemandInvalidator({ enabled }: { enabled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!enabled) return;
    const kick = () => invalidate(4);
    kick();
    window.addEventListener("resize", kick);
    return () => window.removeEventListener("resize", kick);
  }, [enabled, invalidate]);
  return null;
}

export default function HeroGlassScene({
  sceneRef,
  shardElsRef,
  reducedMotion,
  onFirstFrame,
  onFailure,
}: HeroGlassSceneProps) {
  const frameloop = useFrameloop(sceneRef, reducedMotion);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={0.85}
      camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 40 }}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onFailure();
        });
      }}
    >
      <LightRig />
      <ShardField sceneRef={sceneRef} shardElsRef={shardElsRef} onFirstFrame={onFirstFrame} />
      <DemandInvalidator enabled={frameloop === "demand"} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/* Reduced-resolution DoF: real optical blur replaces the flat
            filter:blur() silhouettes; focus locked on the sharp mid plane. */}
        <DepthOfField target={[0, 0, 0]} focalLength={0.06} bokehScale={5.5} resolutionScale={0.4} />
        {/* Specular-hotspot-only bloom — high threshold, low intensity. */}
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.28} radius={0.7} resolutionScale={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
