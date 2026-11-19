"use strict";
(function(M){
  M.CoreRoster = Object.keys(M.Config.defenders);
  const enemy=(name,hp,speed,damage,reward,size,extra={})=>({name,hp,speed,damage,reward,size,interval:1.3,...extra});
  M.EndlessConfig={
    slots:6, maxEnemies:48, maxProjectiles:160, maxCoins:90, maxParticles:360, maxMoney:5000,
    rest:7, startingCoins:650, incomeSoftCap:5, bossEvery:10, staggerThreshold:500, staggerDuration:1.2, iceStaggerMultiplier:3,
    score:{kill:35,boss:1500,wave:200},
    pools:[['goomba',1,8],['koopa',3,4],['shy',4,3],['para',6,3],['hammer',8,2],['spiny',11,3],['drybones',13,3],['boo',16,2],['bullet',18,2],['lakitu',23,1],['bombEnemy',25,2],['magikoopa',33,2],['thwomp',38,2]],
    specials:[{name:'GOOMBA RUSH',min:3,types:['goomba']},{name:'ARMORED ASSAULT',min:11,types:['koopa','spiny','drybones']},{name:'AIR ATTACK',min:6,types:['para','boo','lakitu']},{name:'SPEED WAVE',min:8,types:['shy','bullet']},{name:'HAMMER TIME',min:12,types:['hammer','koopa']},{name:'SWARM WAVE',min:15,types:['goomba','shy','bombEnemy']},{name:'ELITE WAVE',min:24,types:['spiny','hammer','magikoopa']}],
    bosses:['giant','chomp','juniorBoss','kingboo','bowser'],
    bossRules:{
      giant:{name:'Giant Goomba',period:8,warning:1.6,damage:95,reward:200},
      chomp:{name:'Chain Chomp',period:6,warning:1.8,damage:150,reward:275,anchorHP:600,phaseAt:.45,relayDamage:160},
      juniorBoss:{name:'Bowser Jr.',period:6,warning:1.8,damage:110,reward:300,unlock:'junior'},
      kingboo:{name:'King Boo',period:7,warning:2,damage:110,reward:300},
      bowser:{name:'Bowser',period:7,warning:2.2,damage:150,reward:400}
    },
    challenges:{15:{key:'yoshi',name:'YOSHI RESCUE',description:'Protect the egg in lane 3 and prevent castle breaches.',hp:420},25:{key:'luigi',name:'LUIGI’S LAST STAND',description:'Hold the castle without a breach. Mario must stomp the green signal 3 times.',hits:3}},
    unlocks:{yoshi:'Rescue Yoshi’s egg on wave 15.',luigi:'Clear Luigi’s wave-25 rescue: no breaches and 3 signal stomps.',junior:'Defeat Bowser Jr. on wave 30.'}
  };
  Object.assign(M.Config.defenders,{
    yoshi:{name:'Yoshi',role:'CLOSE-RANGE CONTROL',description:'Swallows weak foes within 155px. Digests for 6s. Elites and bosses take damage instead.',cost:225,hp:250,cooldown:14,interval:2.5,damage:65,range:155,digestion:6,color:0x72dc57},
    luigi:{name:'Luigi',role:'LANE RESCUE SUPPORT',description:'Leaps to nearby intruders in adjacent lanes, knocks them back and shields the team briefly.',cost:250,hp:210,cooldown:18,interval:6,damage:80,range:245,color:0x69cb65},
    junior:{name:'Bowser Jr.',role:'CLOWN CAR ARTILLERY',description:'Covers three lanes. Every fourth shell explodes. Powerful, expensive and vulnerable.',cost:400,hp:230,cooldown:25,interval:2.4,damage:70,projectileSpeed:310,color:0xffbf56}
  });
  Object.assign(M.Config.enemies,{
    spiny:enemy('Spiny',210,19,24,20,62,{armor:.45}),
    drybones:enemy('Dry Bones',180,18,22,25,70,{reviveDelay:4}),
    boo:enemy('Boo',160,23,20,25,64),
    bullet:enemy('Bullet Bill',120,76,65,20,65,{interval:2}),
    lakitu:enemy('Lakitu',240,13,15,35,80,{summonInterval:14}),
    bombEnemy:enemy('Walking Bob-omb',150,25,30,25,60,{fuse:2.2,blast:175}),
    magikoopa:enemy('Magikoopa',240,14,25,40,76,{range:310,rangedDamage:32,throwInterval:3.5}),
    thwomp:enemy('Thwomp',480,11,85,40,82,{crushDelay:1.8}),
    chomp:enemy('Chain Chomp',4200,28,100,275,125,{breach:3}),
    juniorBoss:enemy('Bowser Jr.',4600,12,50,300,115,{breach:3}),
    kingboo:enemy('King Boo',5000,11,50,300,124,{breach:3}),
    bowser:enemy('Bowser',6500,9,100,400,142,{breach:4})
  });
})(globalThis.Meadow);
