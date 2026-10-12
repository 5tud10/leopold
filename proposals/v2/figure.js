/* V2 · Fuß: die Figur aus dem Logo als 3D-Skulptur (Modell aus V1), flach und einfarbig, ohne Licht und Schatten.
   Steht ruhig von vorn; dreht sich, solange die Maus darüber ist, und kehrt danach weich in die Frontansicht zurück.
   Ohne WebGL bleibt die flache Figur stehen. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const box = document.querySelector("[data-fig3d]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let started = false;
if (box) new IntersectionObserver((es, obs) => {
  if (es.some(e => e.isIntersecting) && !started) { started = true; obs.disconnect(); init(); }
}, { rootMargin: "600px 0px" }).observe(box);

function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  const size = () => [box.clientWidth, box.clientHeight];
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(...size());
  box.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const [w0, h0] = size();
  const camera = new THREE.PerspectiveCamera(26, w0 / h0, 0.01, 100);
  const material = new THREE.MeshBasicMaterial({ color: 0xf4eacd });   // reine Fläche in der Schriftfarbe des Fußes
  const pivot = new THREE.Group(); scene.add(pivot);

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("../v1/assets/figure/figure.glb", gltf => {
    const model = gltf.scene;
    model.traverse(o => { if (o.isMesh) { o.material = material; o.geometry.computeVertexNormals(); } });
    const b = new THREE.Box3().setFromObject(model);
    const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    model.position.sub(c);
    pivot.add(model);
    const r = Math.max(s.x, s.z) / 2;                       // beim Drehen darf nichts aus dem Bild laufen
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(s.y / 2 / 0.92, r / 0.92 / camera.aspect) / Math.tan(halfFov) + r;
    camera.position.set(0, 0, dist);
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
    box.parentElement.classList.add("is-3d");
  });

  // Drehen bei Mouseover, danach zurück in die Frontansicht
  let hover = false, vel = 0, prev = performance.now();
  const SPEED = 1.5;                                        // Radiant pro Sekunde
  box.addEventListener("pointerenter", () => { hover = !reduced; });
  box.addEventListener("pointerleave", () => { hover = false; });
  addEventListener("resize", () => { const [w, h] = size(); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
  renderer.setAnimationLoop(t => {
    const dt = Math.min(.05, (t - prev) / 1000); prev = t;
    if (!visible) return;
    if (hover) {
      vel += (SPEED - vel) * Math.min(1, dt * 4);
      pivot.rotation.y += vel * dt;
    } else {
      vel += (0 - vel) * Math.min(1, dt * 4);
      const TAU = Math.PI * 2, rest = Math.round(pivot.rotation.y / TAU) * TAU;
      const target = pivot.rotation.y % TAU > Math.PI ? Math.ceil(pivot.rotation.y / TAU) * TAU : rest;   // in Drehrichtung weiter, wenn schon über die Hälfte
      pivot.rotation.y += vel * dt + (target - pivot.rotation.y) * Math.min(1, dt * 2.4);
    }
    renderer.render(scene, camera);
  });
}
