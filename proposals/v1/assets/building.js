/* Besuch planen: das Gebäude als 3D-Modell (aus dem Repo leopold/museum), ohne Bild-Mapping.
   Lädt erst in der Nähe und rendert nur, solange es sichtbar ist. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.querySelector("[data-building]");
if (stage) {
  let started = false;
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting) && !started) { started = true; obs.disconnect(); init(); }
  }, { rootMargin: "500px 0px" }).observe(stage);
}

function init() {
  const box = stage.querySelector("[data-building-canvas]");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { stage.classList.add("is-nogl"); return; }
  const size = () => [box.clientWidth, box.clientHeight];
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(...size());
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  box.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;
  // Hauptlicht von links oben, weiches Himmelslicht, leichtes Gegenlicht für die Kanten
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const rim = new THREE.DirectionalLight(0xfff3e6, 0.9);
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0xd6d1c7, 0.35));

  const [w0, h0] = size();
  const camera = new THREE.PerspectiveCamera(28, w0 / h0, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.5;
  let resumeT;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(resumeT); stage.classList.add("is-grabbed"); });
  controls.addEventListener("end", () => { stage.classList.remove("is-grabbed"); if (!reduced) resumeT = setTimeout(() => (controls.autoRotate = true), 2500); });

  let corners = null;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("assets/building/museum.glb", gltf => {
    const model = gltf.scene;
    const mat = new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    model.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = o.receiveShadow = true; if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); } });
    const bb = new THREE.Box3().setFromObject(model);
    const s = bb.getSize(new THREE.Vector3());
    model.position.sub(bb.getCenter(new THREE.Vector3()));
    scene.add(model);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(s.length() * 4, s.length() * 4), new THREE.ShadowMaterial({ opacity: 0.26, transparent: true }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -s.y / 2 - 0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    corners = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(new THREE.Vector3(x * s.x / 2, y * s.y / 2, z * s.z / 2));

    const r = s.length() / 2;
    key.position.set(-5, 6, 3).normalize().multiplyScalar(r * 3);
    rim.position.set(5, 3, -6).normalize().multiplyScalar(r * 3);
    Object.assign(key.shadow.camera, { left: -r * 1.5, right: r * 1.5, top: r * 1.5, bottom: -r * 1.5, near: r * 0.2, far: r * 8 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0002; key.shadow.normalBias = r * 0.002;

    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(s.y / 2 / 0.6, s.x / 2 / 0.75 / camera.aspect) / Math.tan(halfFov) + s.z / 2;
    const az = THREE.MathUtils.degToRad(-38), el = THREE.MathUtils.degToRad(14);
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
    controls.update();
    stage.classList.add("is-ready");
  });

  // optisch zentrieren: Mitte der Gebäude-Ecken im Bild sanft in die Bühnenmitte schieben
  const v = new THREE.Vector3(), off = { x: 0, y: 0 };
  function centre() {
    if (!corners) return;
    let minX = 1, maxX = -1, minY = 1, maxY = -1;
    corners.forEach(c => {
      v.copy(c).project(camera);
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    });
    const [w, h] = size();
    off.x += ((minX + maxX) / 2) * (w / 2) * 0.2;
    off.y -= ((minY + maxY) / 2) * (h / 2) * 0.2;
    camera.setViewOffset(w, h, off.x, off.y, w, h);
  }

  addEventListener("resize", () => {
    const [w, h] = size();
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    controls.update();
    centre();
    renderer.render(scene, camera);
  });
}
