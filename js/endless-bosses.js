"use strict";
(function(M){
 const C=M.Config,E=M.EndlessConfig;
 const targets=(g,e)=>g.defenders.filter(d=>d.alive&&Math.abs(d.row-e.row)<=1);
 const chooseLane=(g,e)=>{const occupied=[...new Set(g.defenders.filter(d=>d.alive).map(d=>d.row))];return occupied.length?occupied[Math.floor(g.random()*occupied.length)]:Math.floor(g.random()*5);};
 const setLane=(g,e,row)=>{e.row=row;e.y=g.grid.position(row,0).y;};
 M.BossCombat={
  phase(g,e){if(e.phase===2)return;e.phase=2;e.bossState='idle';e.specialTimer=3;e.stun=1.5;e.ghost=false;g.hazards=g.hazards.filter(h=>h.owner!==e.id);g.emit('phase',e);},
  update(g,e,dt){
   const rule=E.bossRules[e.type];e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.action=Math.max(0,e.action-dt);e.slowTime=Math.max(0,e.slowTime-dt);e.relayCooldown=Math.max(0,e.relayCooldown-dt);
   if(e.entrance>0){e.entrance-=dt;return;}
   if(e.phase===1&&(e.hp<e.maxHP*(rule.phaseAt||.4)||(e.type==='chomp'&&e.anchorHP<=0)))this.phase(g,e);
   e.stun=Math.max(0,e.stun-dt);if(e.stun>0)return;
   e.specialTimer-=dt;e.attackTimer-=dt;
   if(e.type==='chomp'){this.chomp(g,e,dt,rule);return;}
   if(e.type==='kingboo')e.ghost=e.specialTimer>3&&e.slowTime<=0;
   if(e.specialTimer<=0){
    e.specialTimer=rule.period*(e.phase===2?.8:1);
    if(e.type==='giant'){
     for(let row=Math.max(0,e.row-1);row<=Math.min(4,e.row+1);row++)g.hazard(e,'GIANT STOMP',row,e.x-70,170,rule.warning,rule.damage);
    }else if(e.type==='juniorBoss'){
     const row=chooseLane(g,e);setLane(g,e,row);const options=g.defenders.filter(d=>d.alive&&d.row===row);const front=options[Math.floor(g.random()*options.length)];
     g.hazard(e,'CLOWN CAR BOMBS',row,front?.x||600,130,rule.warning,rule.damage);
     if(e.phase===2)g.hazard(e,'SECOND BOMB',Math.min(4,row+1),front?.x||600,100,rule.warning+.6,rule.damage*.8);
    }else if(e.type==='kingboo'){
     e.ghost=false;setLane(g,e,chooseLane(g,e));g.hazard(e,'HAUNTED LANE',e.row,720,550,rule.warning,rule.damage);
     for(let i=0;i<(e.phase===2?2:1);i++)g.spawnEnemy('boo',(e.row+i+1)%5,1250);
    }else if(e.type==='bowser'){
     const row=chooseLane(g,e);setLane(g,e,row);g.hazard(e,'FIRE BREATH',row,800,490,rule.warning,rule.damage);
     if(e.phase===2){g.hazard(e,'GROUND SHOCK',Math.max(0,row-1),650,350,rule.warning+.6,100);g.spawnEnemy('spiny',(row+1)%5,1330);}
    }
    e.action=.4;
   }
   const d=g.defenders.filter(d=>d.alive&&d.row===e.row&&d.x<e.x+28).sort((a,b)=>b.x-a.x)[0];
   if(d&&e.x-d.x<75){if(e.attackTimer<=0){e.attackTimer=C.enemies[e.type].interval;g.damageDefender(d,C.enemies[e.type].damage);g.emit('bite',e);}}
   else e.x-=C.enemies[e.type].speed*(e.slowTime>0?.48:1)*(e.phase===2?1.2:1)*dt;
   if(e.x<135){e.alive=false;g.hurtCastle(C.enemies[e.type].breach||3);}
  },
  chomp(g,e,dt,rule){
   const speed=e.slowTime>0?.6:1;
   if(e.bossState==='idle'&&e.specialTimer<=0){
    const row=chooseLane(g,e);setLane(g,e,row);e.bossState='warning';e.stateTime=rule.warning;
    const d=g.defenders.filter(d=>d.alive&&d.row===row).sort((a,b)=>b.x-a.x)[0];
    e.lungeTarget=e.phase===1?Math.max(620,(d?.x||800)+35):Math.max(160,(d?.x||220)+35);e.lungeStart=e.x;
    g.emit('telegraph',{row,name:e.phase===1?'CHAIN LUNGE · STOMP THE RELAY!':'FREE CHOMP · CHARGE!'});return;
   }
   if(e.bossState==='warning'){e.stateTime-=dt;if(e.stateTime<=0){e.bossState='lunge';e.struck=false;}return;}
   if(e.bossState==='lunge'){
    const old=e.x;e.x=Math.max(e.lungeTarget,e.x-(e.phase===1?410:520)*speed*dt);
    for(const d of g.defenders)if(d.alive&&d.row===e.row&&d.x>=e.x-45&&d.x<old+30&&!e.struck){g.damageDefender(d,rule.damage*(e.phase===2?1.2:1));e.struck=true;g.emit('bite',e);}
    const m=g.mario;if(Math.abs(m.y-e.y)<40&&Math.abs(m.x-e.x)<65&&m.jump<=0)g.damageMario();
    if(e.x<=e.lungeTarget){e.bossState='retract';e.stateTime=.6;if(e.x<200)g.hurtCastle(1);}return;
   }
   if(e.bossState==='retract'){
    e.stateTime-=dt;if(e.stateTime>0)return;e.x=Math.min(e.anchorX,e.x+310*dt);
    if(e.x>=e.anchorX){e.bossState='idle';e.specialTimer=e.phase===1?4.2:2.8;}return;
   }
  }
 };
})(globalThis.Meadow);
