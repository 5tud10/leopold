/* V9 · Kopf: der Raum aus Werken (nach https://5tud10.github.io/leopold/room/), in den Kopfbereich eingepasst */
import * as THREE from 'three';

const CELL = 1.6;                    // grid cell, world units
const COLS = 10, ROWS = 6, DEPTH = 9; // back wall COLS×ROWS cells, side walls DEPTH cells deep
const W = COLS * CELL, H = ROWS * CELL, D = DEPTH * CELL;
const FILL = 0.5;                    // share of cells covered by a picture
const SLIDES = 0.22;                 // share of pictures that run a slideshow
const SIZES = [[2, 2], [2, 1], [1, 2], [1, 1], [1, 1], [1, 1]];
const DIST = H * 1.45;               // camera to back wall
const LOOK = 0.1;                    // look-around: max camera turn in radians
const DOLLY = 0.5 / 18.5 * DIST;     // look-around: camera moves back when looking up
const SCATTER = CELL / 2.9;          // intro offsets

const works = await (await fetch('room/works.json')).json();
const canvas = document.querySelector('#room'), head = document.querySelector('#kopf');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xffffff);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
const BASE_Z = DIST - D;

const loader = new THREE.TextureLoader();
const textures = await Promise.all(works.map(w => loader.loadAsync('room/' + w.src).then(t => {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
})));

// Cover-crop: scale/offset the uv so the work fills the tile without stretching.
function crop(work, aspect) {
  const a = work.w / work.h;
  return a > aspect ? new THREE.Vector4(aspect / a, 1, (1 - aspect / a) / 2, 0)
                    : new THREE.Vector4(1, a / aspect, 0, (1 - a / aspect) / 2);
}
// uShow: 0 = white, 1 = the work — every appearance and change passes through white.
const material = (i, aspect) => new THREE.ShaderMaterial({
  uniforms: { uMap: { value: textures[i] }, uCrop: { value: crop(works[i], aspect) }, uShow: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D uMap; uniform vec4 uCrop; uniform float uShow; varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(uMap, vUv * uCrop.xy + uCrop.zw);
      #include <colorspace_fragment>
      gl_FragColor.rgb = mix(vec3(1.0), gl_FragColor.rgb, uShow);
    }`,
});

// Walls hinge on the back wall's edges: built flat (open), then folded shut.
// x0/y0: where the wall's grid starts in its own plane, relative to the hinge.
const walls = [
  { pivot: [0, 0, -D], fold: [0, 0, 0], x0: -W / 2, y0: -H / 2, cols: COLS, rows: ROWS },           // back
  { pivot: [-W / 2, 0, -D], fold: [0, Math.PI / 2, 0], x0: -D, y0: -H / 2, cols: DEPTH, rows: ROWS }, // left
  { pivot: [W / 2, 0, -D], fold: [0, -Math.PI / 2, 0], x0: 0, y0: -H / 2, cols: DEPTH, rows: ROWS },  // right
  { pivot: [0, H / 2, -D], fold: [Math.PI / 2, 0, 0], x0: -W / 2, y0: 0, cols: COLS, rows: DEPTH },   // ceiling
  { pivot: [0, -H / 2, -D], fold: [-Math.PI / 2, 0, 0], x0: -W / 2, y0: -D, cols: COLS, rows: DEPTH }, // floor
];

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let deck = [];
const draw = () => (deck.length ? deck : (deck = shuffle(works.map((_, i) => i)))).pop();

const plane = new THREE.PlaneGeometry(1, 1);
const tiles = [];
for (const wall of walls) {
  wall.group = new THREE.Group();
  wall.group.position.set(...wall.pivot);
  scene.add(wall.group);
  const used = new Set(), key = (c, r) => c + ',' + r;
  let covered = 0;
  const cells = shuffle([...Array(wall.cols * wall.rows)].map((_, i) => [i % wall.cols, i / wall.cols | 0]));
  for (const [c, r] of cells) {
    if (covered >= FILL * wall.cols * wall.rows) break;
    const [sc, sr] = SIZES[Math.random() * SIZES.length | 0];
    const span = [];
    for (let dc = 0; dc < sc; dc++) for (let dr = 0; dr < sr; dr++) span.push([c + dc, r + dr]);
    if (span.some(([x, y]) => x >= wall.cols || y >= wall.rows || used.has(key(x, y)))) continue;
    span.forEach(([x, y]) => used.add(key(x, y)));
    covered += sc * sr;

    const mesh = new THREE.Mesh(plane);
    const home = new THREE.Vector3(wall.x0 + (c + sc / 2) * CELL, wall.y0 + (r + sr / 2) * CELL, 0);
    const size = new THREE.Vector3(sc * CELL, sr * CELL, 1);
    mesh.position.copy(home);
    mesh.scale.copy(size);
    const n = Math.random() < SLIDES ? 4 : 1;
    const tile = { mesh, home, size, aspect: sc / sr, list: [...Array(n)].map(draw), at: 0,
      period: 1.4 + Math.random() * 1.6, next: 0, fade: 'idle', show: 0 };
    mesh.material = material(tile.list[0], tile.aspect);
    mesh.userData.tile = tile;
    wall.group.add(mesh);
    tiles.push(tile);
  }
}

// A change fades the picture out to white, swaps it, fades it back in.
const FADE = 3;
function change(t, i) {
  if (t.fade !== 'idle') return;
  t.fade = 'out';
  t.swap = i;
}
function show(t, i) {
  const m = t.mesh.material.uniforms;
  m.uMap.value = textures[i];
  m.uCrop.value = crop(works[i], t.aspect);
}
function fadeStep(t, dt) {
  if (t.fade === 'out' && (t.show -= FADE * dt) <= 0) { t.show = 0; t.swap(); t.fade = 'in'; }
  else if (t.fade === 'in' && (t.show += FADE * dt) >= 1) { t.show = 1; t.fade = 'idle'; }
  t.mesh.material.uniforms.uShow.value = t.show;
}
// Slideshows cut hard, without the white fade.
function slide(t) {
  if (t.fade !== 'idle') return;
  t.at = (t.at + 1) % t.list.length;
  show(t, t.list[t.at]);
}
function replace(t) {
  // A fresh work that isn't on this tile's list; the slideshow continues from it.
  change(t, () => {
    let i; do i = draw(); while (t.list.includes(i) && works.length > t.list.length);
    t.list[t.at] = i;
    show(t, i);
  });
}

// Intro: walls start unfolded, pictures pop out of white from scattered spots,
// the walls fold shut and the camera pulls back. Times in seconds.
const ease = {
  p2out: x => 1 - (1 - x) ** 3, p3out: x => 1 - (1 - x) ** 4, sineInOut: x => (1 - Math.cos(Math.PI * x)) / 2,
  p2inOut: x => x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2,
};
const tween = (time, start, dur, e) => e(Math.min(Math.max((time - start) / dur, 0), 1));
for (const t of tiles) {
  t.delay = Math.random() * 2;
  t.from = t.home.clone().add(new THREE.Vector3((Math.random() - .5) * 4, (Math.random() - .5) * 4, (Math.random() - .5) * 5).multiplyScalar(SCATTER));
}
const INTRO = 4.5, START_Z = -D + DIST * 13 / 18.5;
function intro(time) {
  for (const t of tiles) {
    const s = time < t.delay + 0.8 ? 1.2 * tween(time, t.delay, 0.8, ease.p2out)
                                   : 1.2 - 0.2 * tween(time, t.delay + 0.8, 1, ease.sineInOut);
    t.mesh.scale.set(t.size.x * s, t.size.y * s, 1);
    t.mesh.position.lerpVectors(t.from, t.home, tween(time, t.delay, 2, ease.p3out));
    t.show = tween(time, t.delay + 0.2, 1, ease.p2out);
    t.mesh.material.uniforms.uShow.value = t.show;
  }
  const k = tween(time, 2, 2.5, ease.p2out);
  for (const w of walls) w.group.rotation.set(w.fold[0] * k, w.fold[1] * k, w.fold[2] * k);
  camera.position.z = START_Z + (BASE_Z - START_Z) * tween(time, 1, 3, ease.p2inOut);
}

function resize() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const mouse = new THREE.Vector2(), ray = new THREE.Raycaster();
let moved = false, over = null;
// Zeiger relativ zum Kopfbereich; außerhalb ruht der Raum
addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !(e.target.closest && e.target.closest('.card, .map'));
  moved = inside;
  if (inside) {
    mouse.set((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2);
    // die Textflächen folgen dem Zeiger und weichen am rechten und unteren Rand aus
    head.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    head.style.setProperty('--my', (e.clientY - r.top) + 'px');
    head.classList.toggle('is-right', e.clientX - r.left > r.width * 0.62);
    head.classList.toggle('is-low', e.clientY - r.top > r.height * 0.78);
  }
});
canvas.addEventListener('click', () => over && open(works[over.list[over.at]].url, '_blank'));
const cap = ['t', 'a', 'd'].map(c => document.querySelector('#roomCap .' + c));
const meshes = tiles.map(t => t.mesh);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), time = clock.elapsedTime + (calm ? INTRO : 0);
  if (scrollY > innerHeight * 1.05) return; // nicht zu sehen: nichts zeichnen
  if (time < INTRO) { intro(time); renderer.render(scene, camera); return; }

  // Look around: the camera turns towards the cursor and moves back as it looks up.
  const k = 1 - 0.95 ** (dt * 60);
  camera.rotation.y += (-mouse.x * LOOK - camera.rotation.y) * k;
  camera.rotation.x += (mouse.y * LOOK - camera.rotation.x) * k;
  camera.position.z += (BASE_Z + DOLLY * mouse.y - camera.position.z) * k;

  for (const t of tiles) {
    if (t.list.length > 1 && time >= t.next) { slide(t); t.next = time + t.period; }
    fadeStep(t, dt);
  }

  // Moving onto a picture swaps it for another work.
  let hit = null;
  if (moved) {
    ray.setFromCamera(mouse, camera);
    hit = ray.intersectObjects(meshes)[0]?.object.userData.tile ?? null;
    if (hit && hit !== over) replace(hit);
  }
  over = hit;
  head.classList.toggle('is-over', !!over);
  if (over) {
    const w = works[over.list[over.at]];
    [w.title, w.artist, w.date].forEach((s, i) => cap[i].textContent = s);
  }
  renderer.render(scene, camera);
});
