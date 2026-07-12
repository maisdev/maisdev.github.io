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
document.querySelectorAll(".project.reveal").forEach((item, index) => {
  item.style.transitionDelay = `${index * 110}ms`;
});

const canvas = document.querySelector("[data-grid]");
const ctx = canvas.getContext("2d");
let pointer = { x: window.innerWidth * .72, y: window.innerHeight * .45 };
let gridWidth = 0;
let gridHeight = 0;
let gridRatio = 1;
let gridFrame = 0;

function drawGrid() {
  gridFrame = 0;
  ctx.setTransform(gridRatio, 0, 0, gridRatio, 0, 0);
  ctx.clearRect(0, 0, gridWidth, gridHeight);
  const gap = gridWidth < 700 ? 42 : 64;
  ctx.lineWidth = 1;
  for (let x = 0; x <= gridWidth; x += gap) {
    const distance = Math.abs(pointer.x - x);
    ctx.strokeStyle = `rgba(102, 145, 225, ${Math.max(.035, .13 - distance / 5000)})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gridHeight); ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y += gap) {
    const distance = Math.abs(pointer.y - y);
    ctx.strokeStyle = `rgba(102, 145, 225, ${Math.max(.035, .13 - distance / 5000)})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(gridWidth, y); ctx.stroke();
  }
}

function resizeGrid() {
  gridRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  gridWidth = canvas.clientWidth;
  gridHeight = canvas.clientHeight;
  canvas.width = Math.round(gridWidth * gridRatio);
  canvas.height = Math.round(gridHeight * gridRatio);
  drawGrid();
}

resizeGrid();
window.addEventListener("resize", resizeGrid);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  if (!reducedMotion && !gridFrame) gridFrame = requestAnimationFrame(drawGrid);
}, { passive: true });


function initCube() {
  const cubeCanvas = document.querySelector("[data-cube]");
  if (!cubeCanvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas: cubeCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
  camera.position.set(0, 0, 13);

  const rig = new THREE.Group();
  const cube = new THREE.Group();
  rig.add(cube);
  scene.add(rig);

  const cubeletGeometry = THREE.RoundedBoxGeometry
    ? new THREE.RoundedBoxGeometry(.97, .97, .97, 5, .085)
    : new THREE.BoxGeometry(.97, .97, .97);
  const innerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x010307, roughness: .28, metalness: .72, clearcoat: .75, clearcoatRoughness: .2 });
  const materialCache = new Map();

  function createSurfaceTexture(pattern, tone) {
    const surface = document.createElement("canvas");
    surface.width = 128;
    surface.height = 128;
    const surfaceCtx = surface.getContext("2d");
    const tones = ["#03070c", "#050b13", "#07101b", "#091525"];
    surfaceCtx.fillStyle = tones[tone % tones.length];
    surfaceCtx.fillRect(0, 0, 128, 128);
    surfaceCtx.strokeStyle = "rgba(111, 136, 168, .16)";
    surfaceCtx.fillStyle = "rgba(125, 148, 178, .15)";
    surfaceCtx.lineWidth = 1;

    if (pattern === 1) {
      for (let y = 7; y < 128; y += 9) for (let x = 7; x < 128; x += 9) {
        surfaceCtx.beginPath(); surfaceCtx.arc(x, y, 1.35, 0, Math.PI * 2); surfaceCtx.fill();
      }
    } else if (pattern === 2) {
      for (let x = 4; x < 128; x += 8) { surfaceCtx.beginPath(); surfaceCtx.moveTo(x, 0); surfaceCtx.lineTo(x, 128); surfaceCtx.stroke(); }
    } else if (pattern === 3) {
      for (let y = 5; y < 128; y += 7) { surfaceCtx.beginPath(); surfaceCtx.moveTo(0, y); surfaceCtx.lineTo(128, y); surfaceCtx.stroke(); }
    } else if (pattern === 4) {
      for (let offset = -128; offset < 256; offset += 12) { surfaceCtx.beginPath(); surfaceCtx.moveTo(offset, 0); surfaceCtx.lineTo(offset - 128, 128); surfaceCtx.stroke(); }
    } else if (pattern === 5) {
      for (let y = 0; y < 128; y += 10) for (let x = 0; x < 128; x += 10) surfaceCtx.strokeRect(x + .5, y + .5, 9, 9);
    } else if (pattern === 6) {
      for (let index = 0; index < 900; index += 1) {
        const shade = 45 + Math.floor(Math.random() * 45);
        surfaceCtx.fillStyle = `rgba(${shade}, ${shade + 8}, ${shade + 18}, ${Math.random() * .12})`;
        surfaceCtx.fillRect(Math.random() * 128, Math.random() * 128, 1.4, 1.4);
      }
    } else {
      const sheen = surfaceCtx.createLinearGradient(0, 0, 128, 128);
      sheen.addColorStop(0, "rgba(116, 142, 177, .08)");
      sheen.addColorStop(.48, "rgba(0, 0, 0, 0)");
      sheen.addColorStop(1, "rgba(117, 147, 186, .035)");
      surfaceCtx.fillStyle = sheen;
      surfaceCtx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(surface);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  }

  function surfaceMaterial(side, first, second) {
    const sideIndex = ["right", "left", "top", "bottom", "front", "back"].indexOf(side);
    const pattern = Math.abs(sideIndex * 5 + first * 3 + second * 7 + 11) % 7;
    const tone = Math.abs(sideIndex + first * 2 + second * 3 + 8) % 4;
    const key = `${side}:${first}:${second}`;
    if (!materialCache.has(key)) {
      const finishes = [
        { roughness: .12, metalness: .72, clearcoat: 1, clearcoatRoughness: .06 },
        { roughness: .38, metalness: .46, clearcoat: .38, clearcoatRoughness: .28 },
        { roughness: .82, metalness: .1, clearcoat: 0, clearcoatRoughness: 1 },
        { roughness: .7, metalness: .18, clearcoat: .04, clearcoatRoughness: .75 },
        { roughness: .18, metalness: .66, clearcoat: .88, clearcoatRoughness: .1 },
        { roughness: .46, metalness: .38, clearcoat: .24, clearcoatRoughness: .36 },
        { roughness: .88, metalness: .06, clearcoat: 0, clearcoatRoughness: 1 }
      ];
      materialCache.set(key, new THREE.MeshPhysicalMaterial({
        map: createSurfaceTexture(pattern, tone),
        ...finishes[pattern]
      }));
    }
    return materialCache.get(key);
  }

  const cubelets = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const cubelet = new THREE.Mesh(cubeletGeometry, [
          x === 1 ? surfaceMaterial("right", y, z) : innerMaterial,
          x === -1 ? surfaceMaterial("left", y, z) : innerMaterial,
          y === 1 ? surfaceMaterial("top", x, z) : innerMaterial,
          y === -1 ? surfaceMaterial("bottom", x, z) : innerMaterial,
          z === 1 ? surfaceMaterial("front", x, y) : innerMaterial,
          z === -1 ? surfaceMaterial("back", x, y) : innerMaterial
        ]);
        cubelet.position.set(x, y, z);
        cubelet.userData.gridPosition = cubelet.position.clone();
        cube.add(cubelet);
        cubelets.push(cubelet);
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
  let dragging = false;
  let dragX = 0;
  let dragY = 0;
  let isTurning = false;
  let baseRigY = .1;
  let previousFrame = performance.now();
  const spin = { x: .017, y: .16 };

  function resizeCube() {
    const width = cubeCanvas.clientWidth;
    const height = cubeCanvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    rig.position.x = width < 500 ? 1.05 : width < 800 ? 1.15 : 2.8;
    baseRigY = width < 800 ? 1.05 : .1;
    rig.position.y = baseRigY;
    rig.scale.setScalar(width < 500 ? .66 : width < 800 ? .8 : .9);
  }
  resizeCube();
  window.addEventListener("resize", resizeCube);
  window.addEventListener("pointermove", (event) => {
    if (dragging) {
      cube.rotation.y += (event.clientX - dragX) * .008;
      cube.rotation.x += (event.clientY - dragY) * .008;
      dragX = event.clientX;
      dragY = event.clientY;
    }
    targetX = (event.clientY / window.innerHeight - .5) * .22;
    targetY = (event.clientX / window.innerWidth - .5) * .25;
  }, { passive: true });

  cubeCanvas.addEventListener("pointerdown", (event) => {
    if (event.clientX < window.innerWidth * .42) return;
    dragging = true;
    dragX = event.clientX;
    dragY = event.clientY;
    cubeCanvas.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener("pointerup", () => { dragging = false; });
  window.addEventListener("pointercancel", () => { dragging = false; });

  function animateEntrance() {
    if (reducedMotion || !window.gsap) return;
    cubelets.forEach((cubelet) => {
      const home = cubelet.userData.gridPosition;
      const delay = Math.random() * .24;
      window.gsap.from(cubelet.position, {
        x: home.x * 1.14 + (Math.random() - .5) * .12,
        y: home.y * 1.14 + (Math.random() - .5) * .12,
        z: home.z * 1.14 + (Math.random() - .5) * .12,
        duration: 1.18 + Math.random() * .18,
        delay,
        ease: "power3.out"
      });
      window.gsap.from(cubelet.scale, {
        x: .78,
        y: .78,
        z: .78,
        duration: .9,
        delay,
        ease: "back.out(1.6)"
      });
    });
  }

  function turnRandomFaces() {
    if (reducedMotion || dragging || isTurning || !window.gsap) return;
    isTurning = true;
    const axes = ["x", "y", "z"];
    const axis = axes[Math.floor(Math.random() * axes.length)];
    const twoFaces = Math.random() < .46;
    const layers = twoFaces ? [-1, 1] : [Math.random() > .5 ? 1 : -1];
    const halfTurn = Math.random() < .32;
    const angle = Math.PI / 2 * (halfTurn ? 2 : 1);
    let remaining = layers.length;

    layers.forEach((layer) => {
      const selected = cubelets.filter((cubelet) => Math.round(cubelet.position[axis]) === layer);
      const turnGroup = new THREE.Group();
      cube.add(turnGroup);
      selected.forEach((cubelet) => turnGroup.add(cubelet));
      const direction = Math.random() > .5 ? 1 : -1;

      window.gsap.to(turnGroup.rotation, {
        [axis]: direction * angle,
        duration: halfTurn ? 1.35 + Math.random() * .18 : .92 + Math.random() * .16,
        ease: "sine.inOut",
        onComplete: () => {
          turnGroup.updateMatrixWorld(true);
          selected.forEach((cubelet) => {
            cube.attach(cubelet);
            cubelet.position.set(
              Math.round(cubelet.position.x),
              Math.round(cubelet.position.y),
              Math.round(cubelet.position.z)
            );
            const quarterTurn = Math.PI / 2;
            cubelet.rotation.set(
              Math.round(cubelet.rotation.x / quarterTurn) * quarterTurn,
              Math.round(cubelet.rotation.y / quarterTurn) * quarterTurn,
              Math.round(cubelet.rotation.z / quarterTurn) * quarterTurn
            );
          });
          cube.remove(turnGroup);
          remaining -= 1;
          if (!remaining) isTurning = false;
        }
      });
    });
  }

  function scheduleFaceTurn(delay = 1050 + Math.random() * 1450) {
    window.setTimeout(() => {
      turnRandomFaces();
      scheduleFaceTurn();
    }, delay);
  }

  animateEntrance();
  if (!reducedMotion) scheduleFaceTurn(1650);

  function renderCube(time = 0) {
    const now = time || performance.now();
    const delta = Math.min((now - previousFrame) / 1000, .05);
    previousFrame = now;
    if (!reducedMotion) {
      if (!dragging) {
        cube.rotation.x += spin.x * delta;
        cube.rotation.y += spin.y * delta;
      }
      rig.rotation.x += (targetX - rig.rotation.x) * .035;
      rig.rotation.y += (targetY - rig.rotation.y) * .035;
      rig.position.y = baseRigY + Math.sin(time * .0008) * .035;
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
    const animation = window.lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: !reducedMotion,
      autoplay: !reducedMotion,
      animationData,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    });
    if (!reducedMotion) {
      const animationObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !document.hidden) animation.play();
        else animation.pause();
      }, { threshold: .05 });
      animationObserver.observe(container);
    }
    document.querySelector(".tgs-fallback")?.remove();
  } catch (error) {
    console.warn("TGS animation fallback is active.", error);
  }
}
window.addEventListener("load", loadTgs);
