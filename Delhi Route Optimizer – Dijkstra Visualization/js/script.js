/************** DATA: 20 DELHI LOCATIONS **************/
const LOCATIONS = [
  'Connaught Place','Karol Bagh','Rajouri Garden','Janakpuri','Dwarka',
  'Punjabi Bagh','Patel Nagar','New Delhi Station','Chandni Chowk','Red Fort',
  'Kashmiri Gate','Lajpat Nagar','AIIMS','Hauz Khas','Saket','Vasant Kunj',
  'IGI Airport','Noida','Gurugram','Ghaziabad'
];

const RAW_COORD = {
  'Connaught Place':{x:480,y:300}, 'Karol Bagh':{x:380,y:260},
  'Rajouri Garden':{x:260,y:360}, 'Janakpuri':{x:220,y:420},
  'Dwarka':{x:120,y:520}, 'Punjabi Bagh':{x:300,y:300},
  'Patel Nagar':{x:360,y:340}, 'New Delhi Station':{x:500,y:320},
  'Chandni Chowk':{x:560,y:230}, 'Red Fort':{x:630,y:250},
  'Kashmiri Gate':{x:560,y:190}, 'Lajpat Nagar':{x:520,y:380},
  'AIIMS':{x:470,y:360}, 'Hauz Khas':{x:470,y:420},
  'Saket':{x:520,y:480}, 'Vasant Kunj':{x:420,y:520},
  'IGI Airport':{x:280,y:560}, 'Noida':{x:720,y:370},
  'Gurugram':{x:360,y:600}, 'Ghaziabad':{x:780,y:260}
};

const EDGES = [
  ['Connaught Place','Karol Bagh',4], ['Connaught Place','New Delhi Station',2],
  ['New Delhi Station','Chandni Chowk',4], ['Chandni Chowk','Red Fort',3],
  ['Chandni Chowk','Kashmiri Gate',5], ['Karol Bagh','Patel Nagar',3],
  ['Patel Nagar','Rajouri Garden',6], ['Rajouri Garden','Janakpuri',5],
  ['Janakpuri','Dwarka',7], ['Punjabi Bagh','Karol Bagh',4],
  ['Punjabi Bagh','Rajouri Garden',6], ['AIIMS','Lajpat Nagar',4],
  ['Lajpat Nagar','Saket',7], ['Hauz Khas','AIIMS',5],
  ['Hauz Khas','Vasant Kunj',9], ['Vasant Kunj','IGI Airport',8],
  ['Dwarka','IGI Airport',12], ['Saket','Noida',22],
  ['Red Fort','Noida',25], ['Gurugram','Vasant Kunj',18],
  ['Gurugram','IGI Airport',20], ['Ghaziabad','Noida',14]
];

/******** CANVAS SETUP ********/
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
let DPR = window.devicePixelRatio || 1;

function resizeCanvas(){
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth * DPR;
  canvas.height = wrap.clientHeight * DPR;
  canvas.style.width = wrap.clientWidth + "px";
  canvas.style.height = wrap.clientHeight + "px";
  ctx.setTransform(DPR,0,0,DPR,0,0);
  drawAll();
}
window.addEventListener("resize", resizeCanvas);

/******** AUTO-FIT + CENTER ********/
function computeCoords(){
  let minx=9999,maxx=-9999,miny=9999,maxy=-9999;
  for(let k in RAW_COORD){
    let p = RAW_COORD[k];
    minx = Math.min(minx,p.x);
    maxx = Math.max(maxx,p.x);
    miny = Math.min(miny,p.y);
    maxy = Math.max(maxy,p.y);
  }

  const rawW = maxx - minx;
  const rawH = maxy - miny;

  const PADDING = 50;
  const cw = canvas.width/DPR - PADDING*2;
  const ch = canvas.height/DPR - PADDING*2;

  const scale = Math.min(cw/rawW, ch/rawH);

  let coords = {};
  for(let k in RAW_COORD){
    const p = RAW_COORD[k];
    coords[k] = {
      x: (canvas.width/DPR)/2 + ((p.x - (minx+rawW/2)) * scale),
      y: (canvas.height/DPR)/2 + ((p.y - (miny+rawH/2)) * scale)
    };
  }
  return coords;
}

/******** DIJKSTRA ********/
function buildAdj(){
  const adj = {};
  LOCATIONS.forEach(n=>adj[n]=[]);
  EDGES.forEach(([a,b,w])=>{
    adj[a].push({node:b,weight:w});
    adj[b].push({node:a,weight:w});
  });
  return adj;
}

function dijkstra(start,end){
  const adj = buildAdj();
  const dist={}, prev={};
  LOCATIONS.forEach(n=>{dist[n]=Infinity; prev[n]=null;});
  dist[start]=0;

  const Q = new Set(LOCATIONS);
  while(Q.size){
    let u=[...Q].reduce((a,b)=>dist[a]<dist[b]?a:b);
    Q.delete(u);
    if(u===end) break;

    for(let {node:v,weight:w} of adj[u]){
      if(dist[u]+w < dist[v]){
        dist[v]=dist[u]+w;
        prev[v]=u;
      }
    }
  }

  let edges=[];
  let cur=end;
  while(prev[cur]){
    edges.unshift(prev[cur]+"_"+cur);
    cur=prev[cur];
  }
  return {distance:dist[end], edges};
}

/******** DRAWING ********/
let COORDS = {};
let highlighted = [];

function drawAll(){
  COORDS = computeCoords();
  ctx.clearRect(0,0,canvas.width/DPR,canvas.height/DPR);

  // Edges  
  EDGES.forEach(([a,b,w])=>{
    const p1 = COORDS[a], p2 = COORDS[b];
    const key=a+"_"+b;
    const HL = highlighted.includes(key) || highlighted.includes(b+"_"+a);

    ctx.beginPath();
    ctx.moveTo(p1.x,p1.y);
    ctx.lineTo(p2.x,p2.y);
    ctx.lineWidth = HL ? 4 : 2;
    ctx.strokeStyle = HL ? "cyan" : "rgba(0,229,255,0.18)";
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.font="14px Arial";
    ctx.fillText(w+" km",(p1.x+p2.x)/2,(p1.y+p2.y)/2-8);
  });

  // Nodes
  LOCATIONS.forEach(n=>{
    const p=COORDS[n];
    ctx.beginPath();
    ctx.arc(p.x,p.y,6,0,Math.PI*2);
    ctx.fillStyle="#7fffd4";
    ctx.fill();

    ctx.fillStyle="white";
    ctx.font="13px Arial";
    ctx.textAlign="left";
    ctx.fillText(n,p.x+10,p.y-10);
  });
}

/******** UI ********/
const sSel = document.getElementById("start-city");
const eSel = document.getElementById("end-city");

LOCATIONS.forEach(n=>{
  sSel.innerHTML += `<option>${n}</option>`;
  eSel.innerHTML += `<option>${n}</option>`;
});

document.getElementById("visualize").onclick=function(){
  const s=sSel.value, e=eSel.value;
  const {distance,edges} = dijkstra(s,e);

  highlighted = edges;
  drawAll();

  let pts = edges.map(e=>e.split("_")).flat();
  let seq=[s];
  pts.forEach(p=>{ if(!seq.includes(p)) seq.push(p); });

  document.getElementById("pathList").innerText =
    `Path: ${seq.join(" → ")}`;

  document.getElementById("totalDistance").innerText =
    `Shortest distance between ${s} and ${e} = ${distance} km`;
};

document.getElementById("clear").onclick=function(){
  highlighted=[];
  drawAll();
  document.getElementById("pathList").innerText="No path selected";
  document.getElementById("totalDistance").innerText="Distance traveled: 0 km";
};

resizeCanvas();
