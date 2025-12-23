const COLORS = ["red", "blue", "green", "yellow"];

const state = {
  land: { red:25, blue:25, green:25, yellow:25 },
  stats: {
    red:{atk:1,int:1,rep:1,env:1},
    blue:{atk:1,int:1,rep:1,env:1},
    green:{atk:1,int:1,rep:1,env:1},
    yellow:{atk:1,int:1,rep:1,env:1},
  },
  monsters: [],
  lastBattle: Date.now()
};

const field = document.getElementById("field");
COLORS.forEach(c=>{
  const z=document.createElement("div");
  z.className=`zone ${c}`;
  z.dataset.color=c;
  field.appendChild(z);
});

function spawn(color){
  const zone=document.querySelector(`.zone.${color}`);
  const m=document.createElement("div");
  m.className=`monster ${color}`;
  m.style.background=color;
  m.style.left=Math.random()*90+"%";
  m.style.top=Math.random()*90+"%";
  if(Math.random()<0.1) m.classList.add("mutant");
  m.onclick=()=>jump(m);
  zone.appendChild(m);
  state.monsters.push({el:m,color});
}

function jump(el){
  el.animate([
    {transform:"translateY(0)"},
    {transform:"translateY(-8px)"},
    {transform:"translateY(0)"}
  ],{duration:300});
}

COLORS.forEach(c=>{for(let i=0;i<5;i++)spawn(c)});

setInterval(()=>{
  const now=Date.now();
  if(now-state.lastBattle>20*60*1000){
    logAll("⚠ 近々争いが起こりそう");
  }
  if(now-state.lastBattle>30*60*1000){
    battle();
    state.lastBattle=now;
  }
},60000);

function battle(){
  const sorted=[...COLORS].sort((a,b)=>state.land[b]-state.land[a]);
  const atk=sorted[0], def=sorted[3];
  state.land[def]-=5;
  state.land[atk]+=5;
  log(atk,`⚔ ${def}に勝利`);
  log(def,`💥 土地を失った`);
  sound(atk);
}

function log(color,msg){
  const el=document.querySelector(`.log.${color}`);
  el.innerHTML=msg;
}

function logAll(msg){
  COLORS.forEach(c=>log(c,msg));
}

document.querySelectorAll("#buttons button").forEach(b=>{
  b.onclick=()=>{
    const stat=b.dataset.stat;
    COLORS.forEach(c=>state.stats[c][stat]++);
    logAll(`📈 ${stat}上昇`);
  };
});

function sound(color){
  const ctx=new AudioContext();
  const o=ctx.createOscillator();
  o.frequency.value={red:220,blue:330,green:440,yellow:550}[color];
  o.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime+0.2);
}
