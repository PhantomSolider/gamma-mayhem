// Prepared for OpenAI Build Week, July 2026.
(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  const $ = (id) => document.getElementById(id);
  const ui = { score:$("score"), lives:$("lives"), charge:$("charge"), wave:$("wave"), high:$("high"), mode:$("mode"), overlay:$("overlay"), title:$("title"), brief:$("brief"), start:$("start") };
  if (!canvas || !ctx) { if (ui.title) ui.title.textContent = "Canvas unavailable"; return; }

  const W = canvas.width, H = canvas.height, TAU = Math.PI * 2, SAFE_TOP = 82, MAX_PARTS = 280;
  const clamp = (v,a,b) => Math.min(Math.max(v,a),b);
  const rand = (a,b) => Math.random()*(b-a)+a;
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const store = { get(k,f){try{return localStorage.getItem(k) ?? f}catch{return f}}, set(k,v){try{localStorage.setItem(k,String(v))}catch{}} };

  const keys = Object.create(null), touch = {up:false,down:false,left:false,right:false};
  let state = "menu", last = performance.now(), high = Number(store.get("gammaHigh","0")) || 0, raf = 0;

  const p = {x:W*.22,y:H*.5,vx:0,vy:0,r:14,lives:3,score:0,charge:10,inv:0,pulse:0,cool:0,flow:0};
  const g = {t:0,wave:1,diff:1,gamma:4.2,shard:3.1,orb:2.4,well:15.5,hole:36,edge:0,edgeCd:0,edgeActive:0,shake:0,pull:0,black:0,msg:"Stable"};
  const stars=[], rays=[], shards=[], orbs=[], wells=[], holes=[], parts=[];

  function resetStars(){stars.length=0; for(let i=0;i<150;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:rand(.25,1),tw:rand(0,TAU)});}
  function reset(){
    Object.assign(p,{x:W*.22,y:H*.5,vx:0,vy:0,r:14,lives:3,score:0,charge:10,inv:2.4,pulse:0,cool:0,flow:0});
    Object.assign(g,{t:0,wave:1,diff:1,gamma:4.2,shard:3.1,orb:2.4,well:15.5,hole:36,edge:0,edgeCd:0,edgeActive:0,shake:0,pull:0,black:0,msg:"Stable"});
    rays.length=shards.length=orbs.length=wells.length=holes.length=parts.length=0;
    resetStars(); hud();
  }
  function start(){reset();state="playing";ui.overlay?.classList.add("hidden");last=performance.now();}
  function show(title,brief,button){ if(ui.title)ui.title.textContent=title; if(ui.brief)ui.brief.textContent=brief; if(ui.start)ui.start.textContent=button; ui.overlay?.classList.remove("hidden"); }
  function pause(){ if(state==="playing"){state="paused";show("Paused","The run is held in place. Press P or click Resume when you are ready.","Resume");} else if(state==="paused"){state="playing";ui.overlay?.classList.add("hidden");last=performance.now();}}
  function over(){state="gameover"; high=Math.max(high,Math.floor(p.score)); store.set("gammaHigh",high); hud(); show("Run Collapsed",`Final score: ${Math.floor(p.score)}. Best signal: ${Math.floor(high)}. Re-center, read the warnings, and launch again.`,"Run Again");}
  function hud(){ if(ui.score)ui.score.textContent=Math.floor(p.score).toLocaleString(); if(ui.lives)ui.lives.textContent=p.lives; if(ui.charge)ui.charge.textContent=`${Math.floor(p.charge)}%`; if(ui.wave)ui.wave.textContent=g.wave; if(ui.high)ui.high.textContent=Math.floor(high).toLocaleString(); if(ui.mode)ui.mode.textContent=g.msg; }

  function burst(x,y,n,color,s=130){ for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(s*.35,s);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.35,.9),color,size:rand(1.5,4)});} if(parts.length>MAX_PARTS)parts.splice(0,parts.length-MAX_PARTS);}
  function lateRamp(){return clamp((g.t-45)/140,0,1)}
  function spawnRay(targetY){const warn=1.45,late=lateRamp();rays.push({x:W+80,y:clamp(targetY ?? rand(104,H-52),104,H-52),w:rand(180,270),h:rand(10,17),speed:(rand(230,310)+g.diff*12)*(1+late*.18),warn,totalWarn:warn,alive:true});}
  function spawnShard(targetX){const late=lateRamp();shards.push({x:clamp(targetX ?? rand(28,W-28),28,W-28),y:-24,vx:rand(-18,18),vy:(rand(72,124)+g.diff*7)*(1+late*.2),r:rand(7,13),a:rand(0,TAU),spin:rand(-2.2,2.2),alive:true});}
  function spawnOrb(){const guided=g.t<7;orbs.push({x:guided?W*.36:rand(W*.3,W-70),y:guided?clamp(p.y+rand(-48,48),112,H-64):rand(112,H-64),r:12,p:rand(0,TAU),alive:true});}
  function wellInfluence(w){return w.r*(3.05+lateRamp()*.38)}
  function wellStrengthScale(){return (1.24+clamp((g.diff-1)*.1,0,.22))*(1+lateRamp()*.42)}
  function blackHoleInfluence(h){return h.r*(8.45+lateRamp()*.85)}
  function blackHoleStrengthScale(){return (1.24+clamp((g.diff-1)*.14,0,.32))*(1+lateRamp()*.46)}
  function spawnWell(target){
    const guided=g.t<32&&!target;
    wells.push({
      x:target?.x ?? (guided?clamp(p.x+rand(145,220),W*.36,W-90):rand(W*.34,W-80)),
      y:target?.y ?? (guided?clamp(p.y+rand(-72,72),124,H-84):rand(120,H-80)),
      r:rand(60,78),s:rand(54,70)*wellStrengthScale(),life:rand(7,9),p:0
    });
  }
  function spawnHole(){
    const guided=g.t<72;
    holes.push({x:W+90,y:guided?clamp(p.y+rand(-78,78),136,H-96):rand(136,H-96),r:28,pull:(72+g.diff*6)*blackHoleStrengthScale(),vx:-(22+g.diff*1.5)*(1+lateRamp()*.1),life:16,spin:0});
    g.shake=Math.max(g.shake,5);
  }
  function edgePressure(dt){
    const nearX=p.x<72||p.x>W-72,nearY=p.y<SAFE_TOP+54||p.y>H-72,corner=nearX&&nearY,edge=nearX||nearY;
    g.edge=edge?clamp(g.edge+dt*(corner?1.75:1),0,3.4):Math.max(0,g.edge-dt*2.1);
    g.edgeCd=Math.max(0,g.edgeCd-dt); g.edgeActive=Math.max(0,g.edgeActive-dt*2.5);
    if(g.t<8||g.edge<1.15||g.edgeCd>0)return;
    const late=lateRamp();
    if(corner||Math.random()<.58)spawnRay(p.y+rand(-18,18)); else spawnShard(p.x+rand(-38,38));
    if(g.t>20&&wells.length<3&&Math.random()<.34+late*.28){
      const side=p.x<W*.5?1:-1;
      spawnWell({x:clamp(p.x+rand(118,190)*side,92,W-92),y:clamp(p.y+rand(-72,72),124,H-84)});
    }
    g.edgeActive=.65; g.edgeCd=Math.max(1.35,2.65-late*.95);
  }

  function axis(){const l=keys.ArrowLeft||keys.KeyA||touch.left,r=keys.ArrowRight||keys.KeyD||touch.right,u=keys.ArrowUp||keys.KeyW||touch.up,d=keys.ArrowDown||keys.KeyS||touch.down;return {x:(r?1:0)-(l?1:0),y:(d?1:0)-(u?1:0)}}
  function phiPulse(){
    if(state!=="playing"||p.charge<35||p.cool>0)return;
    p.charge-=35;p.cool=.75;p.pulse=.01;p.flow=1.1;g.msg="Phi Shield";g.shake=Math.max(g.shake,5);
    let cleared=0, R=118;
    for(const ray of rays){const cx=clamp(p.x,ray.x,ray.x+ray.w),cy=clamp(p.y,ray.y-ray.h,ray.y+ray.h); if(Math.hypot(p.x-cx,p.y-cy)<R){ray.alive=false;cleared++;}}
    for(const s of shards) if(distance(p,{x:s.x,y:s.y})<R){s.alive=false;cleared++;}
    for(const w of wells) if(distance(p,w)<R){w.life=Math.min(w.life,.8);cleared++;}
    burst(p.x,p.y,42,"rgba(255,209,92,.95)",240); p.score+=90+cleared*110;
  }
  function damage(){ if(p.inv>0||p.flow>0)return; p.lives--; p.inv=1.7; p.charge=clamp(p.charge+14,0,100); g.shake=9; g.msg="Integrity hit"; burst(p.x,p.y,30,"rgba(255,115,115,.95)",170); if(p.lives<=0)over();}

  function update(dt){
    if(state!=="playing")return;
    const slow=p.flow>0?dt*.72:dt; g.t+=dt; const pressure=Math.max(0,g.t-8),late=lateRamp(); g.diff=1+pressure/58+late*late*1.05; g.wave=1+Math.floor(g.t/24);
    p.score+=dt*(12+g.wave*4); p.inv=Math.max(0,p.inv-dt); p.cool=Math.max(0,p.cool-dt); p.flow=Math.max(0,p.flow-dt); g.shake=Math.max(0,g.shake-dt*18); g.pull=Math.max(0,g.pull-dt*2.8); g.black=Math.max(0,g.black-dt*3.2);
    if(p.pulse>0){p.pulse+=dt*360;if(p.pulse>150)p.pulse=0;}
    const a=axis(), len=Math.hypot(a.x,a.y)||1; p.vx+=(a.x/len)*720*dt; p.vy+=(a.y/len)*720*dt; p.vx*=Math.pow(.028,dt); p.vy*=Math.pow(.028,dt);
    let pullNow=0;
    for(const w of wells){
      const dx=w.x-p.x,dy=w.y-p.y,rawD=Math.hypot(dx,dy),range=wellInfluence(w);
      if(rawD<range){
        const d=Math.max(34,rawD),influence=1-rawD/range,pull=w.s*(.18+influence*1.45)*dt;
        p.vx+=(dx/d)*pull;p.vy+=(dy/d)*pull;
        pullNow=Math.max(pullNow,influence);
      }
    }
    if(pullNow>0)g.pull=.42;
    let blackNow=0;
    for(const h of holes){
      const dx=h.x-p.x,dy=h.y-p.y,rawD=Math.hypot(dx,dy),range=blackHoleInfluence(h);
      if(rawD<range){
        const d=Math.max(42,rawD),influence=1-rawD/range,pull=h.pull*(.22+influence*1.5)*dt;
        p.vx+=(dx/d)*pull;p.vy+=(dy/d)*pull;
        blackNow=Math.max(blackNow,influence);
      }
    }
    if(blackNow>0)g.black=.5;
    g.msg=p.flow>0?"Phi Shield":g.edgeActive>0?"Edge Pressure":g.black>0?"Black Hole Pull":g.pull>0?"Gravity Pull":p.inv>0&&p.lives<3?"Recovering":g.wave>=5?"Mayhem":"Stable";
    const speed=Math.hypot(p.vx,p.vy), maxSpeed=p.flow>0?300:260; if(speed>maxSpeed){p.vx=p.vx/speed*maxSpeed;p.vy=p.vy/speed*maxSpeed;}
    p.x=clamp(p.x+p.vx*dt,p.r,W-p.r); p.y=clamp(p.y+p.vy*dt,SAFE_TOP,H-p.r);
    edgePressure(dt);
    g.gamma-=slow;g.shard-=slow;g.orb-=slow;g.well-=slow;g.hole-=slow;
    if(g.gamma<=0){spawnRay();g.gamma=Math.max(.58,rand(1.35,2.15)-Math.max(0,g.diff-1)*.12-late*.24)}
    if(g.shard<=0){spawnShard();if(g.wave>3&&Math.random()<.22+late*.28)spawnShard();g.shard=Math.max(.29,rand(.85,1.35)-Math.max(0,g.diff-1)*.08-late*.15)}
    if(g.orb<=0){spawnOrb();g.orb=rand(4.2,5.6)}
    if(g.well<=0&&g.t>15){spawnWell();g.well=Math.max(6.2,rand(10,13.5)-late*3.8)}
    if(g.hole<=0&&g.t>34){spawnHole();g.hole=Math.max(14.5,rand(24,32)-late*8.5)}
    entities(slow); collide(); hud();
  }
  function entities(dt){
    for(const s of stars){s.x-=(24+s.z*60)*dt;s.tw+=dt*(1+s.z);if(s.x<-5){s.x=W+5;s.y=Math.random()*H}}
    for(const r of rays){r.warn-=dt;if(r.warn<=0)r.x-=r.speed*dt;if(r.x+r.w<-80)r.alive=false}
    for(const s of shards){s.x+=s.vx*dt;s.y+=s.vy*dt;s.a+=s.spin*dt;if(s.y>H+40||s.x<-40||s.x>W+40)s.alive=false}
    for(const o of orbs){o.p+=dt*5;o.x-=22*dt;if(o.x<-20)o.alive=false}
    for(const w of wells){w.life-=dt;w.p+=dt*3}
    for(const h of holes){h.x+=h.vx*dt;h.life-=dt;h.spin+=dt*1.6}
    for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.08,dt);q.vy*=Math.pow(.08,dt);q.life-=dt}
    prune(rays,x=>x.alive);prune(shards,x=>x.alive);prune(orbs,x=>x.alive);prune(wells,x=>x.life>0);prune(holes,x=>x.life>0&&x.x>-140);prune(parts,x=>x.life>0);
  }
  function prune(arr,keep){for(let i=arr.length-1;i>=0;i--)if(!keep(arr[i]))arr.splice(i,1)}
  function collide(){
    for(const o of orbs) if(o.alive&&distance(p,o)<p.r+o.r+5){o.alive=false;p.charge=clamp(p.charge+28,0,100);p.score+=160;burst(o.x,o.y,18,"rgba(255,209,92,.9)",140)}
    for(const r of rays){if(r.warn>0||!r.alive)continue;const cx=clamp(p.x,r.x,r.x+r.w),cy=clamp(p.y,r.y-r.h*.78,r.y+r.h*.78);if(Math.hypot(p.x-cx,p.y-cy)<p.r*.78){r.alive=false;damage()}}
    for(const s of shards) if(s.alive&&distance(p,{x:s.x,y:s.y})<p.r*.72+s.r*.62){s.alive=false;damage()}
    for(const h of holes) if(distance(p,h)<p.r*.72+h.r*.52){damage();p.vx-=160;p.vy+=rand(-60,60)}
  }

  function draw(){
    ctx.save();ctx.clearRect(0,0,W,H); if(g.shake>0)ctx.translate(rand(-g.shake,g.shake),rand(-g.shake,g.shake));
    background(); wells.forEach(drawWell); orbs.forEach(drawOrb); rays.forEach(drawRay); shards.forEach(drawShard); holes.forEach(drawHole); parts.forEach(drawPart); drawPlayer(); vignette(); ctx.restore();
  }
  function background(){const gr=ctx.createLinearGradient(0,0,W,H);gr.addColorStop(0,"#03040d");gr.addColorStop(.48,"#070a1e");gr.addColorStop(1,"#100516");ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);for(const s of stars){const f=clamp(.45+Math.sin(s.tw)*.25+s.z*.3,.2,.95);ctx.fillStyle=`rgba(255,255,255,${f})`;ctx.fillRect(s.x,s.y,1+s.z*2.2,1+s.z*2.2)}ctx.strokeStyle="rgba(98,233,255,.08)";for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-130,H);ctx.stroke()}ctx.fillStyle="rgba(255,255,255,.035)";for(let y=0;y<H;y+=5)ctx.fillRect(0,y,W,1)}
  function drawPlayer(){ctx.save();if(p.inv>0)ctx.globalAlpha=.58+Math.sin(performance.now()/65)*.18;ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,Math.abs(p.vx)+80)*.25);ctx.shadowColor=p.flow>0?"#ffd15c":"#62e9ff";ctx.shadowBlur=p.flow>0?34:20;ctx.fillStyle=p.flow>0?"#ffd15c":"#62e9ff";ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-12,-13);ctx.lineTo(-7,0);ctx.lineTo(-12,13);ctx.closePath();ctx.fill();ctx.fillStyle="#f8fbff";ctx.beginPath();ctx.arc(1,0,5,0,TAU);ctx.fill();ctx.fillStyle="rgba(255,79,216,.85)";ctx.fillRect(-23,-4,10,8);if(p.charge>=35||p.flow>0||p.inv>0){ctx.strokeStyle=p.flow>0?"rgba(255,209,92,.95)":p.inv>0?"rgba(98,233,255,.58)":"rgba(255,255,255,.42)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24+Math.sin(performance.now()/120)*2,0,TAU);ctx.stroke()}ctx.restore();if(p.pulse>0){ctx.strokeStyle=`rgba(255,209,92,${1-p.pulse/150})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,p.pulse,0,TAU);ctx.stroke()}}
  function drawRay(r){if(r.warn>0){const progress=1-r.warn/r.totalWarn,a=.22+Math.sin(performance.now()/70)*.12+progress*.18,laneH=r.h*2+24;ctx.fillStyle=`rgba(255,79,216,${a})`;ctx.fillRect(0,r.y-laneH/2,W,laneH);ctx.strokeStyle="rgba(255,209,92,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,r.y-laneH/2);ctx.lineTo(W,r.y-laneH/2);ctx.moveTo(0,r.y+laneH/2);ctx.lineTo(W,r.y+laneH/2);ctx.stroke();ctx.fillStyle="rgba(255,255,255,.85)";for(let x=20+(performance.now()/18%44);x<W;x+=44){ctx.fillRect(x,r.y-3,22,6)}ctx.font="bold 14px system-ui";ctx.textAlign="right";ctx.textBaseline="middle";ctx.fillText("GAMMA WARNING",W-24,r.y-18)}else{const b=ctx.createLinearGradient(r.x,r.y,r.x+r.w,r.y);b.addColorStop(0,"rgba(255,79,216,0)");b.addColorStop(.18,"rgba(255,79,216,.9)");b.addColorStop(.55,"rgba(98,233,255,.95)");b.addColorStop(1,"rgba(255,209,92,0)");ctx.fillStyle=b;ctx.fillRect(r.x,r.y-r.h,r.w,r.h*2);ctx.fillStyle="rgba(255,255,255,.92)";ctx.fillRect(r.x+12,r.y-2,Math.max(30,r.w-24),4)}}
  function drawShard(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.shadowColor="#ff7373";ctx.shadowBlur=14;ctx.fillStyle="rgba(255,115,115,.92)";ctx.beginPath();ctx.moveTo(0,-s.r);ctx.lineTo(s.r*.72,0);ctx.lineTo(0,s.r);ctx.lineTo(-s.r*.72,0);ctx.closePath();ctx.fill();ctx.restore()}
  function drawOrb(o){const r=o.r+Math.sin(o.p)*2.5;ctx.shadowColor="#ffd15c";ctx.shadowBlur=22;ctx.fillStyle="rgba(255,209,92,.94)";ctx.beginPath();ctx.arc(o.x,o.y,r,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="rgba(3,4,13,.9)";ctx.font="bold 16px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Φ",o.x,o.y+1)}
  function drawWell(w){
    const a=clamp(w.life/4,.15,.55),r=w.r+Math.sin(w.p)*6,range=wellInfluence(w),pulse=Math.sin(w.p*1.7)*5;
    ctx.save();ctx.globalCompositeOperation="screen";
    const glow=ctx.createRadialGradient(w.x,w.y,w.r*.55,w.x,w.y,range);
    glow.addColorStop(0,`rgba(168,139,255,${a*.18})`);
    glow.addColorStop(.62,`rgba(98,233,255,${a*.075})`);
    glow.addColorStop(1,"rgba(168,139,255,0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(w.x,w.y,range,0,TAU);ctx.fill();
    ctx.setLineDash([12,9]);ctx.strokeStyle=`rgba(168,139,255,${a*.55})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(w.x,w.y,range+pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=`rgba(98,233,255,${a*.42})`;ctx.lineWidth=1.5;
    for(let i=0;i<8;i++){const t=w.p*.55+i*TAU/8,inner=r*(.55+.08*Math.sin(w.p+i)),outer=range*.82;ctx.beginPath();ctx.moveTo(w.x+Math.cos(t)*outer,w.y+Math.sin(t)*outer);ctx.lineTo(w.x+Math.cos(t+.28)*inner,w.y+Math.sin(t+.28)*inner);ctx.stroke()}
    ctx.restore();
    ctx.strokeStyle=`rgba(168,139,255,${a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,r,0,TAU);ctx.stroke();ctx.strokeStyle=`rgba(98,233,255,${a*.6})`;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(w.x,w.y,r*(.45+i*.22),0,TAU);ctx.stroke()}
  }
  function drawHole(h){
    const range=blackHoleInfluence(h),pulse=Math.sin(h.spin*2)*6;
    ctx.save();ctx.globalCompositeOperation="screen";
    const field=ctx.createRadialGradient(h.x,h.y,h.r*.75,h.x,h.y,range);
    field.addColorStop(0,"rgba(255,209,92,.18)");
    field.addColorStop(.48,"rgba(168,139,255,.12)");
    field.addColorStop(1,"rgba(255,79,216,0)");
    ctx.fillStyle=field;ctx.beginPath();ctx.arc(h.x,h.y,range,0,TAU);ctx.fill();
    ctx.setLineDash([16,11]);ctx.strokeStyle="rgba(255,209,92,.5)";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(h.x,h.y,range+pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle="rgba(255,79,216,.42)";ctx.lineWidth=1.5;
    for(let i=0;i<10;i++){const t=h.spin+i*TAU/10,outer=range*.86,inner=h.r*(1.7+.25*Math.sin(h.spin+i));ctx.beginPath();ctx.moveTo(h.x+Math.cos(t)*outer,h.y+Math.sin(t)*outer);ctx.lineTo(h.x+Math.cos(t+.42)*inner,h.y+Math.sin(t+.42)*inner);ctx.stroke()}
    ctx.restore();
    ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.spin);ctx.strokeStyle="rgba(255,209,92,.9)";ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(0,0,h.r*2.1,h.r*.68,0,0,TAU);ctx.stroke();ctx.strokeStyle="rgba(255,79,216,.72)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,h.r*1.55,0,TAU);ctx.stroke();ctx.fillStyle="#000";ctx.shadowColor="#a88bff";ctx.shadowBlur=40;ctx.beginPath();ctx.arc(0,0,h.r,0,TAU);ctx.fill();ctx.restore()
  }
  function drawPart(q){const a=clamp(q.life,.05,1);ctx.fillStyle=q.color.replace(".95",String(a)).replace(".9",String(a));ctx.fillRect(q.x,q.y,q.size,q.size)}
  function vignette(){const v=ctx.createRadialGradient(W/2,H/2,120,W/2,H/2,W*.72);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.48)");ctx.fillStyle=v;ctx.fillRect(0,0,W,H)}
  function loop(now){const dt=clamp((now-last)/1000,0,.033);last=now;update(dt);draw();raf=requestAnimationFrame(loop)}
  function down(e){
    const interactive=e.target?.closest?.("button");
    if(interactive&&["Enter","Space"].includes(e.code))return;
    if(e.repeat&&["Enter","KeyP","Space"].includes(e.code))return;
    keys[e.code]=true;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
    if(e.code==="Space")phiPulse();
    if(e.code==="KeyP")pause();
    if(e.code==="Enter"){if(state==="menu"||state==="gameover"||state==="playing")start();else if(state==="paused")pause()}
  }
  function up(e){keys[e.code]=false}
  function bindTouch(){document.querySelectorAll("[data-touch]").forEach(btn=>{const set=v=>{const k=btn.dataset.touch;if(k==="pulse"){if(v)phiPulse()}else if(k in touch)touch[k]=v};btn.addEventListener("pointerdown",e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);set(true)});btn.addEventListener("pointerup",e=>{e.preventDefault();set(false)});btn.addEventListener("pointercancel",()=>set(false));btn.addEventListener("pointerleave",()=>set(false));btn.addEventListener("lostpointercapture",()=>set(false))})}
  ui.start?.addEventListener("click",()=>state==="paused"?pause():start());
  window.addEventListener("keydown",down,{passive:false}); window.addEventListener("keyup",up);
  window.addEventListener("blur",()=>{Object.keys(keys).forEach(k=>keys[k]=false);Object.keys(touch).forEach(k=>touch[k]=false);if(state==="playing")pause()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="playing")pause()});
  bindTouch(); reset(); draw(); raf=requestAnimationFrame(loop);
  window.GammaMayhem={start,pause,restart:start,stop:()=>cancelAnimationFrame(raf),state:()=>({state,score:Math.floor(p.score),high,wave:g.wave,lives:p.lives,charge:Math.floor(p.charge),mode:g.msg})};
})();
