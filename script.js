const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelector("[data-year]").textContent = new Date().getFullYear();

const header = document.querySelector("[data-header]");
const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 30);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 4, 2) * 90}ms`;
  revealObserver.observe(item);
});

const canvas = document.querySelector("[data-grid]");
const ctx = canvas.getContext("2d");
let pointer = { x: window.innerWidth * .72, y: window.innerHeight * .45 };

function drawGrid() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const gap = width < 700 ? 42 : 64;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += gap) {
    const distance = Math.abs(pointer.x - x);
    ctx.strokeStyle = `rgba(102, 145, 225, ${Math.max(.035, .13 - distance / 5000)})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += gap) {
    const distance = Math.abs(pointer.y - y);
    ctx.strokeStyle = `rgba(102, 145, 225, ${Math.max(.035, .13 - distance / 5000)})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}
drawGrid();
window.addEventListener("resize", drawGrid);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  if (!reducedMotion) drawGrid();
}, { passive: true });

function initCube() {
  const cubeCanvas = document.querySelector("[data-cube]");
  if (!cubeCanvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas: cubeCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
  camera.position.set(0, 0, 13);

  const rig = new THREE.Group();
  const cube = new THREE.Group();
  rig.add(cube);
  scene.add(rig);

  const plastic = new THREE.MeshStandardMaterial({ color: 0x050b16, roughness: .3, metalness: .42 });
  const stickerColors = {
    right: 0x4d82ff,
    left: 0x2553c7,
    top: 0xf3f7ff,
    bottom: 0x13274a,
    front: 0x55d6d0,
    back: 0x1c3470
  };
  const stickerGeometry = new THREE.PlaneGeometry(.77, .77);
  const cubeletGeometry = new THREE.BoxGeometry(.91, .91, .91, 2, 2, 2);

  function addSticker(parent, side, color) {
    const sticker = new THREE.Mesh(stickerGeometry, new THREE.MeshStandardMaterial({ color, roughness: .26, metalness: .12 }));
    const offset = .461;
    if (side === "right") { sticker.position.x = offset; sticker.rotation.y = Math.PI / 2; }
    if (side === "left") { sticker.position.x = -offset; sticker.rotation.y = -Math.PI / 2; }
    if (side === "top") { sticker.position.y = offset; sticker.rotation.x = -Math.PI / 2; }
    if (side === "bottom") { sticker.position.y = -offset; sticker.rotation.x = Math.PI / 2; }
    if (side === "front") sticker.position.z = offset;
    if (side === "back") { sticker.position.z = -offset; sticker.rotation.y = Math.PI; }
    parent.add(sticker);
  }

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const cubelet = new THREE.Mesh(cubeletGeometry, plastic);
        cubelet.position.set(x, y, z);
        if (x === 1) addSticker(cubelet, "right", stickerColors.right);
        if (x === -1) addSticker(cubelet, "left", stickerColors.left);
        if (y === 1) addSticker(cubelet, "top", stickerColors.top);
        if (y === -1) addSticker(cubelet, "bottom", stickerColors.bottom);
        if (z === 1) addSticker(cubelet, "front", stickerColors.front);
        if (z === -1) addSticker(cubelet, "back", stickerColors.back);
        cube.add(cubelet);
      }
    }
  }

  cube.rotation.set(-.5, .67, .12);
  scene.add(new THREE.HemisphereLight(0xcbdcff, 0x071127, 1.45));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);
  const blueLight = new THREE.PointLight(0x3d78ff, 2.8, 18);
  blueLight.position.set(-5, -2, 5);
  scene.add(blueLight);

  let targetX = 0;
  let targetY = 0;
  function resizeCube() {
    const width = cubeCanvas.clientWidth;
    const height = cubeCanvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    rig.position.x = width < 800 ? 1.55 : 3.15;
    rig.position.y = width < 800 ? 1.05 : .1;
    rig.scale.setScalar(width < 500 ? .72 : width < 800 ? .88 : 1);
  }
  resizeCube();
  window.addEventListener("resize", resizeCube);
  window.addEventListener("pointermove", (event) => {
    targetX = (event.clientY / window.innerHeight - .5) * .22;
    targetY = (event.clientX / window.innerWidth - .5) * .25;
  }, { passive: true });

  function renderCube(time = 0) {
    if (!reducedMotion) {
      cube.rotation.y += .0016;
      rig.rotation.x += (targetX - rig.rotation.x) * .035;
      rig.rotation.y += (targetY - rig.rotation.y) * .035;
      rig.position.y += Math.sin(time * .0008) * .0015;
    }
    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(renderCube);
  }
  renderCube();
}
window.addEventListener("load", initCube);

const cursor = document.querySelector(".cursor");
if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.transform = `translate(${event.clientX - cursor.offsetWidth / 2}px, ${event.clientY - cursor.offsetWidth / 2}px)`;
  }, { passive: true });
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("mouseenter", () => cursor.classList.add("active"));
    link.addEventListener("mouseleave", () => cursor.classList.remove("active"));
  });
}

async function loadTgs() {
  const container = document.querySelector("[data-tgs]");
  if (!container || !window.pako || !window.lottie) return;
  try {
    const response = await fetch("assets/maisdev.tgs");
    if (!response.ok) throw new Error("TGS request failed");
    const compressed = new Uint8Array(await response.arrayBuffer());
    const animationData = JSON.parse(window.pako.ungzip(compressed, { to: "string" }));
    window.lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: !reducedMotion,
      autoplay: !reducedMotion,
      animationData,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    });
    document.querySelector(".tgs-fallback")?.remove();
  } catch (error) {
    console.warn("TGS animation fallback is active.", error);
  }
}
window.addEventListener("load", loadTgs);

if (!reducedMotion) {
  const chars = "01<>/{}";
  document.querySelectorAll("[data-scramble]").forEach((element, elementIndex) => {
    const target = element.dataset.scramble;
    let frame = 0;
    const start = 180 + elementIndex * 180;
    setTimeout(() => {
      const timer = setInterval(() => {
        element.textContent = target.split("").map((char, index) => index < frame / 3 ? char : chars[Math.floor(Math.random() * chars.length)]).join("");
        frame += 1;
        if (frame >= target.length * 3) {
          element.textContent = target;
          clearInterval(timer);
        }
      }, 55);
    }, start);
  });
}
