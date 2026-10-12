/* Slider: Leopold Card als echtes 3D-Objekt (three.js) – Kartenkörper mit Materialstärke und runden Ecken,
   glänzender Kunststoff mit Klarlack, Umgebungslicht für Reflexe, gestaltete Vorder- und Rückseite.
   Dreht sich langsam, nur solange die Folie aktiv ist; der Schatten darunter wird mit der Drehung schmaler.
   Ohne WebGL bleibt die CSS-Karte als Ersatz stehen. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const box = document.querySelector("[data-pass3d]");

async function init() {
  const wrap = box.closest(".pass");
  const slide = box.closest(".card");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  box.appendChild(renderer.domElement);

  // Maße einer echten Scheckkarte (85,6 × 54 mm, Radius 3,18 mm), Stärke leicht betont
  const W = 8.56, H = 5.4, D = 0.09, R = 0.318;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(-4, 6, 8);
  const rim = new THREE.DirectionalLight(0xfff1df, 1.1);
  rim.position.set(6, 2, -6);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0.4, 24);

  // Kartenkörper: abgerundetes Rechteck, extrudiert, weiche Kante
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2); shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R); shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  shape.lineTo(-W / 2 + R, H / 2); shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  shape.lineTo(-W / 2, -H / 2 + R); shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  const bevel = 0.02;
  const body = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 12 });
  body.translate(0, 0, -D / 2);
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.18 });
  const card = new THREE.Group();
  card.add(new THREE.Mesh(body, plastic));

  // Vorder- und Rückseite als bemalte Flächen knapp über dem Körper
  const [front, back] = await Promise.all([drawFront(), drawBack()]);
  const face = tex => new THREE.MeshPhysicalMaterial({
    map: tex, transparent: true, alphaTest: 0.5, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.12
  });
  const prep = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const z = D / 2 + bevel + 0.002;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(W + bevel * 2, H + bevel * 2), face(prep(front)));
  f.position.z = z;
  const b = new THREE.Mesh(new THREE.PlaneGeometry(W + bevel * 2, H + bevel * 2), face(prep(back)));
  b.position.z = -z; b.rotation.y = Math.PI;
  card.add(f, b);
  scene.add(card);

  const shadow = wrap.querySelector(".pass__shadow");
  function size() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Karte füllt etwa 72 % der Breite
    const dist = (W * 1.02 / 0.72) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.z = Math.max(dist, (H * 1.6) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    camera.updateProjectionMatrix();
  }
  size();
  addEventListener("resize", size);
  wrap.classList.add("is-gl");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let angle = -0.45, last = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const active = slide ? slide.classList.contains("is-active") : true;
    if (active && !reduced) angle += dt * (Math.PI * 2 / 13);           // eine Umdrehung in 13 s
    card.rotation.y = angle;
    card.rotation.x = 0.16 + Math.sin(now / 1900) * 0.04;
    card.rotation.z = Math.sin(now / 2600) * 0.025;
    card.position.y = Math.sin(now / 1500) * 0.08;
    if (shadow) {
      const k = Math.abs(Math.cos(angle));
      shadow.style.transform = `translateX(-50%) scaleX(${(0.18 + 0.82 * k).toFixed(3)})`;
      shadow.style.opacity = (0.55 + 0.45 * k).toFixed(3);
    }
    renderer.render(scene, camera);
  });
}

/* ───────── Kartenmotive auf Canvas ───────── */

const CW = 2048, CH = Math.round(2048 * 54 / 85.6), CR = Math.round(CW * 3.18 / 85.6);
const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const fontsReady = () => (document.fonts ? document.fonts.ready : Promise.resolve());
function canvas() {
  const c = document.createElement("canvas");
  c.width = CW; c.height = CH;
  const ctx = c.getContext("2d");
  ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, CR); ctx.clip();       // runde Ecken, außen durchsichtig
  return [c, ctx];
}

async function drawFront() {
  await fontsReady();
  const [art, logo] = await Promise.all([load("assets/img/pass-schiele.jpg"), load("assets/logo-white.svg")]);
  const [c, ctx] = canvas();
  ctx.fillStyle = "#fbfaf7"; ctx.fillRect(0, 0, CW, CH);
  // Schiele, Selbstbildnis mit gestreiftem Hemd (1910): Kopf links, läuft ins Weiß aus
  const rw = CW * 0.62, rh = CH;
  const sw = art.width * 0.84, sh = sw * rh / rw;
  ctx.save();
  ctx.filter = "brightness(1.12) contrast(1.06) saturate(1.08)";
  ctx.drawImage(art, art.width * 0.02, art.height * 0.03, sw, sh, 0, 0, rw, rh);
  ctx.restore();
  const fade = ctx.createLinearGradient(CW * 0.42, 0, CW * 0.62, 0);
  fade.addColorStop(0, "rgba(251,250,247,0)"); fade.addColorStop(1, "rgba(251,250,247,1)");
  ctx.fillStyle = fade; ctx.fillRect(CW * 0.42, 0, CW * 0.2, CH);
  ctx.fillStyle = "#fbfaf7"; ctx.fillRect(CW * 0.62, 0, CW * 0.38, CH);
  // Logo-Feld oben rechts
  ctx.fillStyle = "#7a5a35"; ctx.fillRect(CW * 0.6, 0, CW * 0.4, CH * 0.26);
  const lw = CW * 0.3, lh = lw * 76 / 285;
  ctx.drawImage(logo, CW * 0.8 - lw / 2, CH * 0.13 - lh / 2, lw, lh);
  // Schriftzug
  ctx.fillStyle = "#6d5030"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${Math.round(CH * 0.088)}px Bureau, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(CH * 0.006)}px`;
  ctx.fillText("LEOPOLD CARD", CW * 0.94, CH * 0.63);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.fillStyle = "#7a6a58"; ctx.font = `400 ${Math.round(CH * 0.036)}px Bureau, sans-serif`;
  ctx.fillText("Nur gültig mit Lichtbildausweis", CW * 0.94, CH * 0.71);
  return c;
}

async function drawBack() {
  await fontsReady();
  const logo = await load("assets/logo-white.svg");
  const [c, ctx] = canvas();
  ctx.textAlign = "left";
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, CW, CH);
  // Magnetstreifen mit leichtem Glanz
  const g = ctx.createLinearGradient(0, CH * 0.1, 0, CH * 0.29);
  g.addColorStop(0, "#26231f"); g.addColorStop(0.5, "#14120f"); g.addColorStop(1, "#1f1c18");
  ctx.fillStyle = g; ctx.fillRect(0, CH * 0.1, CW, CH * 0.19);
  // Unterschriftsfeld
  const sx = CW * 0.07, sy = CH * 0.39, sw = CW * 0.56, sh = CH * 0.13;
  ctx.fillStyle = "#fff"; ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeStyle = "#e6dfd2"; ctx.lineWidth = 4;
  for (let x = sx; x < sx + sw; x += 18) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + 26, sy + sh); ctx.stroke(); }
  ctx.fillStyle = "#8d8476"; ctx.font = `400 ${Math.round(CH * 0.028)}px Bureau, sans-serif`;
  ctx.fillText("Unterschrift", sx, sy + sh + CH * 0.045);
  // Text
  ctx.fillStyle = "#4a4239"; ctx.font = `400 ${Math.round(CH * 0.034)}px Bureau, sans-serif`;
  ctx.fillText("Diese Karte ist persönlich und nicht übertragbar.", sx, CH * 0.69);
  ctx.fillText("Leopold Museum · Museumsplatz 1 · 1070 Wien", sx, CH * 0.745);
  ctx.fillStyle = "#6d5030"; ctx.font = `600 ${Math.round(CH * 0.042)}px Bureau, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(CH * 0.008)}px`;
  ctx.fillText("LC 2026  0418  2207", sx, CH * 0.87);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  // Logo-Feld unten rechts
  ctx.fillStyle = "#7a5a35"; ctx.fillRect(CW * 0.69, CH * 0.72, CW * 0.24, CH * 0.18);
  const lw = CW * 0.19, lh = lw * 76 / 285;
  ctx.drawImage(logo, CW * 0.81 - lw / 2, CH * 0.81 - lh / 2, lw, lh);
  return c;
}

// erst hier starten: die Hilfsfunktionen oben müssen schon angelegt sein
if (box) init().catch(e => { window.__passErr = String(e && e.stack || e); });
