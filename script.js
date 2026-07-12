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

  const cubeletGeometry = new THREE.BoxGeometry(.955, .955, .955);
  const innerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x010308, roughness: .2, metalness: .7, clearcoat: .9, clearcoatRoughness: .18 });
  const faceMaterials = {
    right: new THREE.MeshPhysicalMaterial({ color: 0x102b50, roughness: .16, metalness: .72, clearcoat: 1, clearcoatRoughness: .12 }),
    left: new THREE.MeshPhysicalMaterial({ color: 0x071426, roughness: .18, metalness: .76, clearcoat: 1, clearcoatRoughness: .14 }),
    top: new THREE.MeshPhysicalMaterial({ color: 0x1b3557, roughness: .14, metalness: .72, clearcoat: 1, clearcoatRoughness: .1 }),
    bottom: innerMaterial,
    front: new THREE.MeshPhysicalMaterial({ color: 0x0b203c, roughness: .16, metalness: .75, clearcoat: 1, clearcoatRoughness: .12 }),
    back: innerMaterial
  };

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const cubelet = new THREE.Mesh(cubeletGeometry, [
          x === 1 ? faceMaterials.right : innerMaterial,
          x === -1 ? faceMaterials.left : innerMaterial,
          y === 1 ? faceMaterials.top : innerMaterial,
          y === -1 ? faceMaterials.bottom : innerMaterial,
          z === 1 ? faceMaterials.front : innerMaterial,
          z === -1 ? faceMaterials.back : innerMaterial
        ]);
        cubelet.position.set(x, y, z);
        cube.add(cubelet);
      }
    }
  }

  cube.rotation.set(-.5, .67, .12);
  scene.add(new THREE.HemisphereLight(0x7792b9, 0x010307, .75));
  const keyLight = new THREE.DirectionalLight(0xb9cee9, 1.65);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);
  const blueLight = new THREE.PointLight(0x174d91, 1.8, 18);
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
