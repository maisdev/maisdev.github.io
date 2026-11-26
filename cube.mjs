// Positions and sticker normals are integer vectors at the end of each legal turn.
const HALF_PI = Math.PI / 2;
const faces = [
  { normal: [1,0,0], color: '#f05a26' }, { normal: [-1,0,0], color: '#cf3231' },
  { normal: [0,1,0], color: '#f4cd39' }, { normal: [0,-1,0], color: '#ecebe2' },
  { normal: [0,0,1], color: '#25875b' }, { normal: [0,0,-1], color: '#3164b7' }
];
const add = (a,b) => a.map((v,i) => v+b[i]);
const scale = (v,n) => v.map(x => x*n);
const dot = (a,b) => a.reduce((sum,x,i) => sum+x*b[i],0);
const cross = ([a,b,c],[d,e,f]) => [b*f-c*e,c*d-a*f,a*e-b*d];

function rotate(vector,axis,angle) {
  const [x,y,z] = vector;
  const c = Math.cos(angle), s = Math.sin(angle);
  if (axis === 0) return [x,c*y-s*z,s*y+c*z];
  if (axis === 1) return [c*x+s*z,y,-s*x+c*z];
  return [c*x-s*y,s*x+c*y,z];
}

export function turn(pieces, axis, layer, direction) {
  const snap = vector => rotate(vector,axis,direction*HALF_PI).map(Math.round);
  for (const piece of pieces.filter(p => p.center[axis] === layer)) {
    piece.center = snap(piece.center);
    for (const face of piece.faces) face.normal = snap(face.normal);
  }
}

export function makeCube() {
  const pieces = [];
  for (const x of [-1,0,1]) for (const y of [-1,0,1]) for (const z of [-1,0,1]) {
    if (!x && !y && !z) continue;
    const center = [x,y,z];
    pieces.push({center, faces:faces.map(({normal,color}) => ({
      normal:[...normal], color:dot(center,normal) === 1 ? color : null
    }))});
  }
  turn(pieces,0,1,1);
  turn(pieces,1,1,-1);
  turn(pieces,2,-1,1);
  return pieces;
}

function camera(v) {
  return rotate(rotate(rotate(v,1,-.59),0,.46),2,-.055);
}
function project(v) {
  const k = 94 * 11.5 / (11.5-v[2]);
  return [256+v[0]*k,246-v[1]*k];
}
function rounded(points, radius) {
  const towards = (from,to) => from.map((v,i) => v+(to[i]-v)*radius);
  const xy = p => p.map(n => n.toFixed(2)).join(' ');
  return points.map((pt,i) => {
    const before = towards(pt,points[(i+3)%4]);
    const after = towards(pt,points[(i+1)%4]);
    return (i ? 'L' : 'M')+xy(before)+'Q'+xy(pt)+' '+xy(after);
  }).join('')+'Z';
}
function tone(hex, gain, lift=0) {
  const n=parseInt(hex.slice(1),16);
  return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*gain+lift))).toString(16).padStart(2,'0')).join('');
}

// The still image and the animated canvas share the same projection and materials.
export function geometry(pieces, move=null) {
  const visible=[];
  for (const piece of pieces) {
    const turning = move && piece.center[move.axis] === move.layer;
    const view = v => camera(turning ? rotate(v,move.axis,move.angle) : v);
    const center = view(piece.center);
    for (const face of piece.faces) {
      const n=view(face.normal);
      const position=add(center,scale(n,.492));
      if (dot(n,[-position[0],-position[1],11.5-position[2]]) <= 0) continue;
      const across = face.normal[0] ? [0,0,1] : [1,0,0];
      const u=view(across), v=view(cross(face.normal,across));
      const square = size => [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b]) =>
        project(add(position,add(scale(u,a*size),scale(v,b*size)))));
      const light=.80+.18*n[1]+.11*n[2]-.08*n[0];
      visible.push({
        depth:position[2], body:rounded(square(.498),.105), plastic:tone('#26272a',light),
        sticker:face.color && rounded(square(.446),.16),
        light:face.color && tone(face.color,light*1.04,5),
        dark:face.color && tone(face.color,light*.88)
      });
    }
  }
  return visible.sort((a,b)=>a.depth-b.depth);
}

export function mountCube(canvas) {
  const ctx=canvas.getContext('2d');
  if (!ctx) return;
  const pieces=makeCube(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let move=null, frame=0, timer=0, onScreen=false, sequence=0;
  const moves=[[2,1,1],[1,1,-1],[0,1,1],[2,1,-1],[0,-1,-1]];
  function draw() {
    const size=Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,2)));
    if (canvas.width!==size || canvas.height!==size) canvas.width=canvas.height=size;
    ctx.setTransform(size/512,0,0,size/512,0,0);
    ctx.clearRect(0,0,512,512);
    for (const f of geometry(pieces,move)) {
      const body=new Path2D(f.body);
      ctx.fillStyle=f.plastic; ctx.fill(body);
      ctx.strokeStyle='#151618';ctx.lineWidth=1.3;ctx.stroke(body);
      if (!f.sticker) continue;
      const tile=new Path2D(f.sticker);
      const glaze=ctx.createLinearGradient(60,70,410,435);
      glaze.addColorStop(0,f.light);glaze.addColorStop(1,f.dark);
      ctx.fillStyle=glaze;ctx.fill(tile);
      ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1.1;ctx.stroke(tile);
    }
    canvas.parentElement.classList.add('is-drawn');
  }
  function stop() {
    cancelAnimationFrame(frame);clearTimeout(timer);
    if (move) { move=null;draw(); }
  }
  function play() {
    if (move || !onScreen || reduced.matches || document.hidden) return;
    clearTimeout(timer);
    const [axis,layer,direction]=moves[sequence++%moves.length];
    const start=performance.now();
    move={axis,layer,angle:0};
    function tick(now) {
      const t=Math.min(1,(now-start)/760);
      move.angle=direction*HALF_PI*t*t*(3-2*t);
      if (t===1) { turn(pieces,axis,layer,direction);move=null; }
      draw();
      if (move) frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  const scene=canvas.parentElement;
  new ResizeObserver(draw).observe(scene);
  new IntersectionObserver(entries=>{
    onScreen=entries[0].isIntersecting;
    if (!onScreen) stop();
    else if (sequence===0 && !reduced.matches) timer=setTimeout(play,600);
  }).observe(scene);
  scene.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse') play();});
  scene.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse') play();});
  reduced.addEventListener('change',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) stop();});
  draw();
}
