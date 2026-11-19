"use strict";
(function(M){
 const C=M.Config,E=M.EndlessConfig,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class EndlessModel extends M.GameModel {
  constructor(options={}){
   super(options);this.mode='endless';this.progress=options.progress||new M.Progression();this.loadout=this.progress.validateLoadout(options.loadout||this.progress.data.loadout);
   this.wave=new M.EndlessDirector(this);this.score=0;this.waveReached=0;this.stats.bosses=0;this.newUnlocks=[];this.hazards=[];this.challenge=null;this.savedKills=0;this.nextSave=15;
   this.money=E.startingCoins+(this.progress.data.chompReward?50:0);this.startBest=this.progress.data.bestScore;this.damageKind='normal';
  }
  place(type,row,col){if(!this.loadout.includes(type))return{ok:false,reason:'That defender is not in this run’s loadout.'};return super.place(type,row,col);}
  saveRecord(){this.progress.record(this.waveReached,this.score,this.stats.kills-this.savedKills);this.savedKills=this.stats.kills;}
  finish(won){if(this.status!=='playing')return;this.saveRecord();super.finish(false);}
  spawnCoin(x,y,value,source){if(source===undefined)value=Math.max(5,Math.round(value/(1+Math.max(0,this.waveReached-10)*.06)));if(this.coins.length>=E.maxCoins){const c=this.coins.find(c=>c.alive&&c.source===source);if(c)c.value=Math.min(250,c.value+value);return c;}return super.spawnCoin(x,y,value,source);}
  collect(c){if(!c)return false;const result=super.collect(c);this.money=Math.min(E.maxMoney,this.money);return result;}
  fire(values){if(this.projectiles.length>=E.maxProjectiles)return;return super.fire(values);}
  unlock(key){if(this.progress.unlock(key)){this.newUnlocks.push(key);this.emit('unlock',{key,name:C.defenders[key].name});}}
  spawnEnemy(type,row,x=1404,options={}){
   if(this.enemies.filter(e=>e.alive).length>=E.maxEnemies)return null;
   const e=super.spawnEnemy(type,row,x);if(!e)return e;
   const wave=Math.max(1,this.waveReached),boss=!!E.bossRules[type];
   e.boss=boss;e.elite=!!options.elite&&!boss;e.speedScale=1+Math.min(.65,(wave-1)*.006);e.armor=e.elite?.18:0;
   const healthScale=boss?1+Math.min(1.2,Math.max(0,wave-50)*.012):1+Math.min(.65,(wave-1)*.008);
   e.hp=e.maxHP=Math.round(e.maxHP*healthScale*(e.elite?1.35:1));e.specialTimer=type==='lakitu'?3:5;e.stun=0;e.revived=false;e.collapsed=0;e.phase=1;
   if(type==='bullet'){e.entry=1.6;this.emit('telegraph',{row:e.row,name:'BULLET BILL · PIPE OR ICE!'});}
   if(boss){e.entrance=2.5;e.specialTimer=4;e.anchorX=1280;e.anchorHP=E.bossRules.chomp.anchorHP;e.anchorMax=e.anchorHP;e.relayCooldown=0;e.bossState='idle';e.x=1300;if(type!=='giant')this.emit('boss',e);}
   return e;
  }
  damageEnemy(e,damage){
   if(!e?.alive||e.entrance>0)return;
   if(e.collapsed>0){if(['fire','bomb','junior'].includes(this.damageKind)){e.collapsed=0;e.hp=1;}else return;}
   if(e.ghost&&this.damageKind!=='ice'&&this.damageKind!=='fire')damage*=.35;
   if(e.type==='spiny'&&['normal','piranha'].includes(this.damageKind))damage*=1-C.enemies.spiny.armor;
   damage*=1-(e.armor||0);if(e.ward>0)damage*=.7;if(e.stun>0&&e.boss)damage*=1.5;
   if(e.type==='drybones'&&!e.revived&&e.hp-damage<=0&&!['fire','bomb','junior'].includes(this.damageKind)){
    e.hp=1;e.collapsed=C.enemies.drybones.reviveDelay;e.revived=true;this.emit('collapse',e);return;
   }
   if(e.boss){e.stagger=(e.stagger||0)+damage*(this.damageKind==='ice'?E.iceStaggerMultiplier:1);if(e.stagger>=E.staggerThreshold&&this.hazards.some(h=>h.owner===e.id)){e.stagger=0;e.stun=E.staggerDuration;this.hazards=this.hazards.filter(h=>h.owner!==e.id);this.emit('notice',{text:C.enemies[e.type].name+' staggered! Attack interrupted.'});}}
   const alive=e.alive;super.damageEnemy(e,damage);
   if(alive&&!e.alive){this.score+=E.score.kill*(e.elite?2:1);if(e.boss){this.stats.bosses++;this.score+=E.score.boss;this.progress.boss(e.type);this.spawnCoin(e.x,e.y,E.bossRules[e.type].reward,'boss');this.castle=Math.min(C.castleHP,this.castle+1);this.emit('bossDefeated',e);if(E.bossRules[e.type].unlock)this.unlock(E.bossRules[e.type].unlock);this.hazards=this.hazards.filter(h=>h.owner!==e.id);this.saveRecord();}}
  }
  hit(e,damage,kind='normal'){const old=this.damageKind;this.damageKind=kind;this.damageEnemy(e,damage);this.damageKind=old;}
  updateDefender(d,dt){
   if(!['yoshi','luigi','junior'].includes(d.type)){
    const old=this.damageKind;this.damageKind=d.type==='bomb'?'bomb':'normal';super.updateDefender(d,dt);this.damageKind=old;
    if(d.type==='toad'&&d.action===.5){const count=this.defenders.filter(x=>x.type==='toad'&&x.alive).length;d.timer*=1+Math.max(0,count-E.incomeSoftCap)*.18;}return;
   }
   if(!d.alive)return;d.age+=dt;d.hit=Math.max(0,d.hit-dt);d.action=Math.max(0,d.action-dt);d.timer-=dt;
   if(d.type==='luigi'&&d.assist){d.assist.time-=dt;if(d.assist.time<=0){const target=this.enemies.find(e=>e.id===d.assist.id&&e.alive);if(target){this.hit(target,C.defenders.luigi.damage,'stomp');if(!target.boss){target.x=Math.min(1410,target.x+90);target.stun=1.1;}this.emit('stomp',target);}this.buff=Math.max(this.buff,2.5);d.assist=null;}return;}
   if(d.timer>0)return;
   const targets=this.enemies.filter(e=>e.alive&&!e.collapsed&&e.x>d.x-20&&Math.abs(e.row-d.row)<=(d.type==='yoshi'?0:1)).sort((a,b)=>a.x-b.x);
   const target=targets.find(e=>d.type==='junior'||e.x-d.x<C.defenders[d.type].range);if(!target)return;
   d.action=.4;d.timer=C.defenders[d.type].interval;
   if(d.type==='yoshi'){
    const swallow=!target.boss&&!target.elite&&!['spiny','thwomp','bullet','bombEnemy'].includes(target.type)&&target.hp<=210;
    this.hit(target,swallow?target.maxHP*5:C.defenders.yoshi.damage,swallow?'fire':'tongue');d.timer=swallow?C.defenders.yoshi.digestion:d.timer;d.tongueX=target.x;this.emit('tongue',{x:d.x,y:d.y,targetX:target.x,swallow});
   }else if(d.type==='luigi'){d.assist={time:.65,id:target.id,x:target.x,y:target.y};this.emit('jump',d);}
   else {d.shots=(d.shots||0)+1;this.fire({kind:'junior',x:d.x+25,y:target.y-10,row:target.row,vx:310,damage:70,splash:d.shots%4===0?110:0});}
  }
  updateEnemy(e,dt){
   if(!e.alive)return;
   if(e.boss){M.BossCombat.update(this,e,dt);return;}
   if(e.entry>0){e.entry-=dt;e.age+=dt;return;}
   if(e.collapsed>0){e.collapsed=Math.max(0,e.collapsed-dt);if(e.collapsed<=0){e.hp=e.maxHP*.55;this.emit('revive',e);}return;}
   e.stun=Math.max(0,e.stun-dt);e.ward=Math.max(0,(e.ward||0)-dt);if(e.stun>0){e.age+=dt;return;}
   e.specialTimer-=dt;
   if(e.type==='boo')e.ghost=Math.floor(e.age/3.5)%2===0&&e.slowTime<=0;
   if(e.type==='lakitu'&&e.specialTimer<=0){e.specialTimer=C.enemies.lakitu.summonInterval;this.spawnEnemy('spiny',e.row,Math.max(500,e.x-30));this.emit('summon',e);}
   if(e.type==='magikoopa'&&e.specialTimer<=0){e.specialTimer=9;for(const other of this.enemies)if(other!==e&&Math.abs(other.row-e.row)<=1&&Math.abs(other.x-e.x)<240)other.ward=5;this.emit('ward',e);}
   const target=this.defenders.filter(d=>d.alive&&d.row===e.row&&d.x<e.x+28).sort((a,b)=>b.x-a.x)[0];
   if(this.challenge?.key==='yoshi'&&!this.challenge.failed&&e.row===2&&e.x<480&&e.x>415){e.attackTimer-=dt;if(e.attackTimer<=0){e.attackTimer=1;this.challenge.hp-=C.enemies[e.type].damage;this.emit('eggHit',{x:440,y:e.y});if(this.challenge.hp<=0){this.challenge.failed=true;this.emit('notice',{text:'The egg cracked. Yoshi rescue failed this run.'});}}return;}
   if(e.type==='thwomp'&&target&&e.x-target.x<95){e.age+=dt;e.hit=Math.max(0,e.hit-dt);if(!e.crushing&&e.specialTimer<=0){e.crushing=true;e.specialTimer=5;this.hazard(e,'CRUSH',target.row,target.x,75,1.8,145);}if(e.specialTimer<2)e.crushing=false;return;}
   if(e.type==='bombEnemy'&&target&&e.x-target.x<115){if(!e.fuse){e.fuse=C.enemies.bombEnemy.fuse;this.emit('telegraph',{row:e.row,name:'BOB-OMB FUSE · DESTROY IT!'});}e.fuse-=dt;e.age+=dt;if(e.fuse<=0){for(const d of this.defenders)if(Math.abs(d.row-e.row)<=1&&Math.abs(d.x-e.x)<130)this.damageDefender(d,C.enemies.bombEnemy.blast);e.alive=false;this.emit('explosion',{x:e.x,y:e.y,radius:130});}return;}
   if(e.type==='magikoopa'&&target&&e.x-target.x<310){e.age+=dt;e.throwTimer-=dt;e.hit=Math.max(0,e.hit-dt);if(e.throwTimer<=0){e.throwTimer=3.5;this.fire({kind:'hammer',source:'enemy',x:e.x,y:e.y-25,row:e.row,vx:-230,damage:32,target:target.id,startX:e.x,targetX:target.x});}return;}
   if(e.ghost){e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.slowTime=Math.max(0,e.slowTime-dt);e.x-=C.enemies.boo.speed*e.speedScale*dt;if(e.x<135){e.alive=false;this.hurtCastle(1);}return;}
   const x=e.x;super.updateEnemy(e,dt);if(e.x<x)e.x-=(x-e.x)*(e.speedScale-1);
   if(e.type==='bullet'&&target&&e.x-target.x<55&&e.alive){this.damageDefender(target,65);e.alive=false;this.emit('impact',{x:e.x,y:e.y,kind:'fire'});}
  }
  updateProjectiles(dt){
   for(const p of this.projectiles){if(!p.alive)continue;const old=p.x;p.x+=p.vx*dt;p.age+=dt;
    if(p.source==='enemy'){const d=this.defenders.find(d=>d.alive&&d.id===p.target);if(!d)p.alive=false;else if(p.x<=d.x+22){this.damageDefender(d,p.damage);p.alive=false;this.emit('impact',{x:d.x,y:d.y,kind:p.kind});}}
    else {let target=null;for(const e of this.enemies)if(e.alive&&!(e.entrance>0)&&e.row===p.row&&e.x>=old-30&&e.x<=p.x+30&&(!e.collapsed||['fire','junior'].includes(p.kind))&&(!target||e.x<target.x))target=e;
     if(target){this.hit(target,p.damage,p.kind);if(p.slow)target.slowTime=p.slow;if(p.splash)for(const other of this.enemies)if(other!==target&&other.alive&&Math.abs(other.row-target.row)<=(p.kind==='junior'?1:0)&&Math.abs(other.x-target.x)<p.splash)this.hit(other,p.damage*.5,p.kind);p.alive=false;this.emit('impact',{x:target.x,y:target.y,kind:p.kind});}
    }
    if(p.x>1480||p.x<90||p.age>5)p.alive=false;
   }
  }
  hazard(owner,name,row,x,radius,delay,damage){if(this.hazards.length>=24)return;if(!this.hazards.some(h=>h.owner===owner.id))owner.stagger=0;this.hazards.push({id:++this.id,owner:owner.id,name,row,x,y:this.grid.position(row,0).y,radius,time:delay,max:delay,damage});this.emit('telegraph',{row,name});}
  beginChallenge(def){this.challenge=def?{...def,hp:def.hp||0,hits:0,failed:false,startCastle:this.castle}:null;}
  clearWave(w){
   this.score+=E.score.wave+w.number*15;this.spawnCoin(310,585,Math.min(100,25+Math.floor(w.number/5)*5),'wave');
   if(this.challenge){const c=this.challenge;const success=!c.failed&&(c.key==='yoshi'?c.hp>0:c.hits>=3&&this.castle===c.startCastle);if(success)this.unlock(c.key);else this.emit('notice',{text:'Rescue missed. Try the challenge again next run.'});this.challenge=null;}
   this.emit('waveClear',{number:w.number,score:this.score});this.saveRecord();
  }
  updateMario(dt,input){const jump=this.mario.jump;super.updateMario(dt,input);if(jump>0&&this.mario.jump<=0&&this.mario.respawn<=0){
   const m=this.mario;
   for(const e of this.enemies)if(e.type==='chomp'&&e.phase===1&&e.relayCooldown<=0&&Math.hypot(m.x-220,m.y-this.grid.position(e.row,0).y)<65){e.anchorHP=Math.max(0,e.anchorHP-E.bossRules.chomp.relayDamage);e.stun=3;e.relayCooldown=7;this.emit('anchorHit',e);}
   if(this.challenge?.key==='luigi'&&Math.hypot(m.x-220,m.y-585)<65){this.challenge.hits++;this.emit('notice',{text:`Luigi signal ${Math.min(3,this.challenge.hits)} / 3`});}
  }}
  hurtCastle(n){if(this.challenge)this.challenge.failed=true;super.hurtCastle(n);}
  update(dt,input={}){
   if(this.paused||this.status!=='playing')return;dt=Math.min(dt,.05);
   super.update(dt,input);
   if(this.status!=='playing')return;
   for(const h of this.hazards){h.time-=dt;if(h.time<=0&&!h.done){h.done=true;const owner=this.enemies.find(e=>e.id===h.owner&&e.alive);if(owner&&!owner.stun){for(const d of this.defenders)if(d.alive&&d.row===h.row&&Math.abs(d.x-h.x)<h.radius)this.damageDefender(d,h.damage);const m=this.mario;if(Math.abs(m.y-h.y)<42&&Math.abs(m.x-h.x)<h.radius&&m.jump<=0)this.damageMario();this.emit('explosion',{x:h.x,y:h.y,radius:Math.min(160,h.radius)});}}}
   this.hazards=this.hazards.filter(h=>!h.done);if(this.time>=this.nextSave){this.nextSave=this.time+15;this.saveRecord();}this.money=Math.min(E.maxMoney,this.money);
  }
 }
 M.EndlessModel=EndlessModel;
})(globalThis.Meadow);
