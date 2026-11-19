"use strict";
(function(M){
 const E=M.EndlessConfig,C=M.Config;
 Object.assign(M.DefenderArtProfiles,{
  yoshi:{height:78,width:82,frame:M.Art.frames.yoshi.crop},
  luigi:{height:85,width:73,pixel:true,frame:M.Art.frames.luigi.crop},
  junior:{height:92,width:96,frame:M.Art.frames.junior.crop}
 });
 const pose=M.DefenderAnimator.prototype.pose;
 M.DefenderAnimator.prototype.pose=function(d,t){const p=pose.call(this,d,t);if(['yoshi','luigi','junior'].includes(d.type)){p.angle=Math.sin(t*2+d.id)*2;p.y-=d.type==='junior'?5+Math.sin(t*3)*4:0;if(d.action>0){p.x-=Math.sin(d.action*8)*5;p.sx+=.07*Math.sin(d.action*8);}if(d.assist){const f=1-d.assist.time/.65,travel=Math.sin(f*Math.PI);p.x+=(d.assist.x-d.x)*travel;p.y+=(d.assist.y-d.y)*travel-70*travel;}}return p;};
 const burst=M.EffectsManager.prototype.burst,float=M.EffectsManager.prototype.float;
 M.EffectsManager.prototype.burst=function(x,y,color,n=12,power=120){if(this.scene.model?.mode==='endless')n=Math.min(n,Math.max(0,E.maxParticles-this.items.length));return burst.call(this,x,y,color,n,power);};
 M.EffectsManager.prototype.float=function(...args){if(this.labels.length<35)return float.apply(this,args);};
 const create=M.GameScene.prototype.create;
 M.GameScene.prototype.create=function(){if(M.mode==='endless'&&!M.progress?.data.completed.includes('world-1-1')){M.mode='campaign';this.scene.start('Menu');return;}create.call(this);if(this.model.mode==='endless'){this.endlessInk=this.add.graphics().setDepth(6);this.endlessOver=this.add.graphics().setDepth(56);this.endlessSounds={};this.saveOnLeave=()=>this.model.saveRecord();window.addEventListener('pagehide',this.saveOnLeave);this.events.once('shutdown',()=>{this.model.saveRecord();window.removeEventListener('pagehide',this.saveOnLeave);});}};
 const event=M.GameScene.prototype.event;
 M.GameScene.prototype.event=function(type,d){
  if(this.model?.mode!=='endless'){if(type==='victory')M.progress.complete(this.model.castle);return event.call(this,type,d);}
  if(['shoot','hammer','impact'].includes(type)){const previous=this.endlessSounds?.[type]||0;if(this.model.time-previous<.065)return;this.endlessSounds[type]=this.model.time;}
  switch(type){
   case 'wave':M.audio.play('wave');M.ui.warning(d.name,`WAVE ${d.index+1} · ${d.boss?C.enemies[d.boss].name.toUpperCase():d.challenge?'RESCUE CHALLENGE':'ENDLESS MEADOW'}`);if(d.challenge)M.ui.toast(d.challenge.description);return;
   case 'boss':M.audio.play('boss');this.cameras.main.shake(450,.006);M.ui.warning(C.enemies[d.type].name.toUpperCase(),'BOSS INCOMING');return;
   case 'phase':M.audio.play('explosion');this.cameras.main.shake(300,.007);this.fx.ring(d.x,d.y,0xffd261,130);M.ui.warning(d.type==='chomp'?'THE CHAIN HAS BROKEN!':'PHASE TWO',C.enemies[d.type].name.toUpperCase());return;
   case 'bossDefeated':M.audio.play('victory');this.fx.burst(d.x,d.y,0xffdc7b,85,210);this.fx.float(d.x,d.y-80,'BOSS DEFEATED!','#ffe191',27);M.ui.toast(d.type==='chomp'?'CHAIN CREST! +50 starting coins in future runs. +1 castle shield.':'Boss defeated! Bonus coins and +1 castle shield.');return;
   case 'telegraph':this.fx.float(1120,C.grid.y+d.row*C.grid.ch+20,d.name,'#fff2b8',15);return;
   case 'anchorHit':M.audio.play('block');this.fx.ring(d.anchorX,d.y,0xffe07b,75);this.fx.float(220,d.y-55,'ANCHOR STUNNED!','#ffe287',18);return;
   case 'unlock':M.audio.play('power');M.ui.warning(`${d.name.toUpperCase()} UNLOCKED!`,'AVAILABLE IN YOUR NEXT LOADOUT');this.fx.burst(720,370,0xffe17e,100,220);return;
   case 'waveClear':M.audio.play('collect');M.ui.toast(`Wave ${d.number} cleared · +${E.score.wave+d.number*15} score · Reinforce your defense`);return;
   case 'notice':M.ui.toast(d.text);return;
   case 'collapse':this.fx.float(d.x,d.y-45,'REVIVING…','#dbe4ee',13);return;
   case 'revive':this.fx.burst(d.x,d.y,0xe2ede6,12,80);return;
   case 'ward':this.fx.ring(d.x,d.y,0xc19cff,90);return;
   case 'summon':this.fx.burst(d.x,d.y,0xffffff,12,90);return;
   case 'eggHit':this.fx.burst(d.x,d.y,0xffe3b0,7,70);return;
   case 'tongue':M.audio.play('shoot');this.fx.float(d.x,d.y-50,d.swallow?'GULP!':'WHACK!','#c9ed9a',14);return;
   case 'defeat':
    this.finishing=true;M.audio.active=false;M.audio.play('defeat');this.time.delayedCall(1600,()=>this.scene.start('Result',{won:false,endless:true,wave:this.model.waveReached,score:this.model.score,startBest:this.model.startBest,newUnlocks:[...this.model.newUnlocks],stats:{...this.model.stats},castle:this.model.castle}));return;
  }
  return event.call(this,type,d);
 };
 const resultUpdate=M.VictoryScene.prototype.update;
 M.VictoryScene.prototype.update=function(time,delta){if(this.dataResult.endless&&this.dataResult.score>this.dataResult.startBest){this.clock+=delta;if(this.clock>260){this.clock=0;this.fx.burst(300+Math.random()*840,150,0xffd879,8,90);}this.fx.update(Math.min(.05,delta/1000));}else resultUpdate.call(this,time,delta);};
 const render=M.GameScene.prototype.renderState;
 M.GameScene.prototype.renderState=function(dt){render.call(this,dt);const g=this.model;if(g.mode!=='endless')return;const ink=this.endlessInk,over=this.endlessOver;ink.clear();over.clear();
  for(const h of g.hazards){const x=Math.max(C.grid.x,h.x-h.radius),width=Math.min(1330,h.x+h.radius)-x;ink.fillStyle(0xe65e32,.13+.12*(1-h.time/h.max));ink.fillRoundedRect(x,h.y-36,width,72,8);ink.lineStyle(3,0xffd675,.9);ink.strokeRoundedRect(x,h.y-36,width,72,8);ink.lineStyle(2,0xffd675,.45);for(let xx=x+10;xx<x+width-20;xx+=35)ink.lineBetween(xx,h.y+28,xx+20,h.y-28);}
  for(const e of g.enemies){const v=this.renderItems.get(e.id);if(!v)continue;v.sprite.setAlpha(e.ghost?.38:1);if(e.collapsed>0)v.sprite.setScale(v.sprite.scaleX,v.sprite.scaleY*.3);
   if(e.boss&&e.entrance>0){const p=Math.max(.05,1-e.entrance/2.5);v.sprite.setScale(v.sprite.scaleX*p,v.sprite.scaleY*p);v.sprite.y-=Math.sin(p*Math.PI)*60;}
   if(e.elite){over.lineStyle(2,0xe9b4ff,.8);over.strokeEllipse(e.x,e.y+17,65,22);}
   if(e.ward>0){over.lineStyle(2,0xc4a3ff,.6);over.strokeEllipse(e.x,e.y-14,72,90);}
   if(e.type==='chomp'){
    if(e.phase===1){const ax=e.anchorX+25;ink.lineStyle(4,0xd2dfde,.95);const length=Math.hypot(ax-e.x,16);for(let i=1;i<Math.ceil(length/17);i++){const f=i/Math.ceil(length/17);ink.strokeEllipse(e.x+(ax-e.x)*f,e.y+8+Math.sin(f*Math.PI)*15,16,9);}ink.fillStyle(0x926532);ink.fillRoundedRect(ax-7,e.y-19,15,45,4);ink.lineStyle(3,0xefd29a);ink.strokeEllipse(ax,e.y-19,24,10);this.drawHP(ax,e.y-35,e.anchorHP/e.anchorMax,50,0xffdd78);
     ink.fillStyle(e.relayCooldown>0?0x7b8d63:0xffd36b,.85);ink.fillEllipse(220,e.y+14,62,26);ink.lineStyle(3,0xfff3bc);ink.strokeEllipse(220,e.y+14,62,26);ink.lineBetween(210,e.y+14,230,e.y+14);ink.lineBetween(220,e.y+5,220,e.y+23);
    }
    if(e.bossState==='warning'){ink.fillStyle(0xf6ae40,.23);ink.fillRect(e.lungeTarget,e.y-36,e.x-e.lungeTarget,72);ink.lineStyle(3,0xffd57f);ink.strokeRect(e.lungeTarget,e.y-36,e.x-e.lungeTarget,72);}
   }
  }
  for(const d of g.defenders)if(d.type==='yoshi'&&d.action>0&&d.tongueX){over.lineStyle(6,0xf28d95,Math.min(1,d.action*5));over.lineBetween(d.x+20,d.y-30,d.tongueX,d.y-25);over.fillStyle(0xfaa4aa);over.fillCircle(d.tongueX,d.y-25,7);}
  if(g.challenge?.key==='yoshi'&&!g.challenge.failed){ink.fillStyle(0xfff9dd);ink.fillEllipse(440,575,43,57);ink.lineStyle(3,0x44854f);ink.strokeEllipse(440,575,43,57);ink.fillStyle(0x68b84c);ink.fillEllipse(432,561,12,15);ink.fillEllipse(450,581,13,16);this.drawHP(440,610,g.challenge.hp/420,55,0x95e673);}
  if(g.challenge?.key==='luigi'){ink.fillStyle(0x7ee978,.75);ink.fillEllipse(220,601,66,27);ink.lineStyle(3,0xf2ffcf);ink.strokeEllipse(220,601,66,27);}
 };
 const debug=M.GameScene.prototype.toggleDebug;
 M.GameScene.prototype.toggleDebug=function(){debug.call(this);if(!this.debug)return;const box=M.ui.root.querySelector('.debug');if(this.model.mode!=='endless'){const b=document.createElement('button');b.textContent='Complete campaign (debug)';box.append(b);b.onclick=()=>this.model.finish(true);return;}
  box.classList.add('endless-debug');const extra=document.createElement('div');extra.innerHTML=`<input id="jump-wave" type="number" value="20" min="1" max="1000000" aria-label="Wave number"><button id="jump-wave-go">Jump to wave</button><select id="boss-kind">${E.bosses.map(k=>`<option value="${k}">${C.enemies[k].name}</option>`).join('')}</select><button id="spawn-boss">Spawn boss</button><button id="phase-boss">Trigger boss phase 2</button><button id="defeat-enemies">Defeat active enemies</button><select id="unlock-kind">${Object.keys(E.unlocks).map(k=>`<option value="${k}">${C.defenders[k].name}</option>`).join('')}</select><button id="unlock-defender">Unlock defender</button><button id="simulate">Simulate 100 waves</button><button id="lose-run">End run (results)</button>`;box.append(extra);
  box.querySelector('#jump-wave-go').onclick=()=>this.model.wave.jump(Math.max(1,Math.min(1000000,Number(box.querySelector('#jump-wave').value)||1)));
  box.querySelector('#spawn-boss').onclick=()=>this.model.spawnEnemy(box.querySelector('#boss-kind').value,2);
  box.querySelector('#phase-boss').onclick=()=>this.model.enemies.filter(e=>e.boss).forEach(e=>M.BossCombat.phase(this.model,e));
  box.querySelector('#defeat-enemies').onclick=()=>this.model.enemies.forEach(e=>{e.entrance=0;this.model.hit(e,1e9,'fire');});
  box.querySelector('#unlock-defender').onclick=()=>this.model.unlock(box.querySelector('#unlock-kind').value);
  box.querySelector('#lose-run').onclick=()=>this.model.hurtCastle(5);
  box.querySelector('#simulate').onclick=()=>{const check=M.EndlessDiagnostics.run(100);M.ui.toast(`100-wave simulation · peak ${check.peak} enemies · ${check.ms}ms · ${check.ok?'PASS':'FAILED'}`);};
 };
 // Isolated deterministic diagnostic: never changes the live run or persistent progress.
 M.EndlessDiagnostics={run(waves=100){const g=new M.EndlessModel({seed:987,progress:new M.Progression()});g.events=()=>{};let peak=0;const start=performance.now();for(let wave=1;wave<=Math.min(1000,waves);wave++){g.wave.jump(wave);for(let i=0;i<2400&&!g.wave.cleared;i++){g.update(.05);peak=Math.max(peak,g.enemies.length);for(const e of g.enemies){e.entrance=0;g.hit(e,1e9,'fire');}for(const c of g.coins)if(c.alive)g.collect(c);}}return {peak,ms:Math.round(performance.now()-start),ok:peak<=E.maxEnemies&&g.wave.cleared,status:g.status};}};
})(Meadow);
