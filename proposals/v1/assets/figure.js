/* Footer: Figur aus dem Logo als 3D-Skulptur (aus dem Repo leopold/figure), angepasst für den Footer.
   Unterschiede zum Original: kein Zoom und kein Verschieben (sonst blockiert sie das Seitenscrollen),
   langsame Eigendrehung, lädt erst in Footer-Nähe und rendert nur, solange sie sichtbar ist. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.querySelector("[data-figure]");
const BASE = "assets/figure/";
const WORKS = [
  { src: "web-lm-00454", de: ["Selbstbildnis mit Lampionfrüchten", "1912"], en: ["Self-Portrait with Chinese Lantern Plant", "1912"], artist: "Egon Schiele" },
  { src: "web-lm-00453", de: ["Bildnis Wally Neuzil", "1912"], en: ["Portrait of Wally Neuzil", "1912"], artist: "Egon Schiele" },
  { src: "web-lm-00630", de: ["Tod und Leben", "1910/11"], en: ["Death and Life", "1910/11"], artist: "Gustav Klimt" },
  { src: "web-lm-00466", de: ["„Eremiten“", "1912"], en: ["Hermits", "1912"], artist: "Egon Schiele" },
  { src: "web-lm-00456", de: ["Der Häuserbogen II („Inselstadt“)", "1915"], en: ["Crescent of Houses II (Island Town)", "1915"], artist: "Egon Schiele" },
  { src: "web-lm-04148", de: ["Am Attersee", "1900"], en: ["On Lake Attersee", "1900"], artist: "Gustav Klimt" },
  { src: "web-lm-02008", de: ["Die große Pappel II", "1902/03"], en: ["The Large Poplar II", "1902/03"], artist: "Gustav Klimt" }
];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const caption = stage.querySelector("[data-figure-caption]");

let started = false;
new IntersectionObserver((entries, obs) => {
  if (entries.some(e => e.isIntersecting) && !started) { started = true; obs.disconnect(); init(); }
}, { rootMargin: "600px 0px" }).observe(stage);

async function init() {
  const canvasBox = stage.querySelector("[data-figure-canvas]");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    stage.classList.add("is-nogl");                       // ohne WebGL bleibt der ruhige Hintergrund
    return;
  }
  const size = () => [canvasBox.clientWidth, canvasBox.clientHeight];
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(...size());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  canvasBox.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(3, 1, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.6));

  const [w0, h0] = size();
  const camera = new THREE.PerspectiveCamera(30, w0 / h0, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;                            // Mausrad scrollt die Seite, nicht die Figur
  controls.enablePan = false;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  let resumeT;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(resumeT); stage.classList.add("is-grabbed"); });
  controls.addEventListener("end", () => { stage.classList.remove("is-grabbed"); if (!reduced) resumeT = setTimeout(() => (controls.autoRotate = true), 2500); });

  // Triplanare Projektion wie im Original: das Werk wird entlang x, y, z auf die Figur gelegt
  const tri = { triMap: { value: null }, triScale: { value: 1 }, triAspect: { value: 1 } };
  const material = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, tri);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTriPos;\nvarying vec3 vTriNormal;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vTriPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTriNormal = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform sampler2D triMap; uniform float triScale; uniform float triAspect;
        varying vec3 vTriPos; varying vec3 vTriNormal;
        vec4 triSample(vec2 p) { return texture2D(triMap, p * triScale * vec2(1.0 / triAspect, 1.0) + 0.5); }`)
      .replace("#include <map_fragment>", `
        vec3 tw = pow(abs(normalize(vTriNormal)), vec3(4.0));
        tw /= tw.x + tw.y + tw.z;
        diffuseColor *= triSample(vTriPos.zy) * tw.x + triSample(vTriPos.xz) * tw.y + triSample(vTriPos.xy) * tw.z;`);
  };

  const textures = new Map();
  const loadTexture = src => {
    if (!textures.has(src)) textures.set(src, new THREE.TextureLoader().loadAsync(`${BASE}textures/${src}-default.jpg`).then(t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }));
    return textures.get(src);
  };

  let current = 0;
  const lang = () => (document.documentElement.lang === "en" ? "en" : "de");
  function writeCaption() {
    const w = WORKS[current];
    const [title, date] = w[lang()];
    caption.innerHTML = `<b>${title}</b> <span>${w.artist}, ${date}</span>`;
  }
  async function show(i) {
    current = (i + WORKS.length) % WORKS.length;
    const w = WORKS[current];
    caption.classList.add("is-swap");
    const t = await loadTexture(w.src);
    if (WORKS[current] !== w) return;                     // ein späterer Klick hat gewonnen
    tri.triMap.value = t;
    tri.triAspect.value = t.image.width / t.image.height;
    writeCaption();
    caption.classList.remove("is-swap");
    loadTexture(WORKS[(current + 1) % WORKS.length].src);
  }
  stage.querySelector("[data-figure-prev]").addEventListener("click", () => show(current - 1));
  stage.querySelector("[data-figure-next]").addEventListener("click", () => show(current + 1));
  // Sprache wechselt: Bildunterschrift nachziehen
  new MutationObserver(writeCaption).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  await show(0);

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(`${BASE}figure.glb`, gltf => {
    const model = gltf.scene;
    model.traverse(o => { if (o.isMesh) { o.material = material; o.geometry.computeVertexNormals(); } });
    const box = new THREE.Box3().setFromObject(model);
    const s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    model.position.sub(c);
    scene.add(model);
    tri.triScale.value = 1 / s.y;
    // Figur füllt etwa 62 % der Höhe, damit oben und unten Luft für Logo und Spalten bleibt
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(s.y / 2 / 0.62, s.x / 2 / 0.62 / camera.aspect) / Math.tan(halfFov) + s.z / 2;
    camera.position.set(0, 0, dist);
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
    controls.update();
    stage.classList.add("is-ready");
  });

  addEventListener("resize", () => {
    const [w, h] = size();
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // nur rendern, solange der Footer sichtbar ist
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  renderer.setAnimationLoop(() => { if (!visible) return; controls.update(); renderer.render(scene, camera); });
}
