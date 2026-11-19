"use strict";
(function(M){
  const E=M.EndlessConfig;
  class EndlessDirector {
    constructor(game){this.game=game;this.index=-1;this.elapsed=0;this.next=18;this.cursor=0;this.complete=false;this.current=null;this.cleared=false;}
    generate(number){
      const g=this.game, rand=()=>g.random();
      const pool=E.pools.filter(p=>p[1]<=number);
      const boss=number%10===0?E.bosses[(number/10-1)%5]:null;
      const challenge=E.challenges[number];
      const available=E.specials.filter(s=>s.min<=number);
      const special=!boss&&!challenge&&number%3===0?available[Math.floor(rand()*available.length)]:null;
      let weighted=(special?pool.filter(p=>special.types.includes(p[0])):pool).map(p=>[p[0],p[1],p[2]*(number>=20&&p[1]>=11?2.5:1)]);
      const count=boss?Math.min(22,6+Math.floor(number/5)):Math.min(90,4+Math.floor(number*1.5));
      const spacing=boss?2.7:Math.max(.5,2.8-number*.045);
      const schedule=[];let lane=Math.floor(rand()*5), clock=3;
      for(let i=0;i<count;i++){
        const total=weighted.reduce((a,p)=>a+p[2],0);let pick=rand()*total,type=weighted[0][0];
        for(const p of weighted){pick-=p[2];if(pick<=0){type=p[0];break;}}
        // Spread arrivals; no lane gets successive rush units without a gap.
        lane=(lane+1+Math.floor(rand()*3))%5;
        const elite=number>=24&&(special?.name==='ELITE WAVE'||rand()<Math.min(.48,(number-20)*.008));
        schedule.push({at:clock,type,row:lane,elite});
        const formation=number<20?1:Math.min(5,2+Math.floor((number-20)/20));
        if((i+1)%formation===0)clock+=spacing*(number>=20?1.8:1)*(.8+rand()*.4);
      }
      if(boss)schedule.push({at:5,type:boss,row:2,boss:true});
      if(boss&&number>=100)schedule.push({at:22,type:E.bosses[(number/10)%5],row:4,boss:true});
      schedule.sort((a,b)=>a.at-b.at);
      return {number,name:boss?'BOSS INCOMING':challenge?.name||special?.name||'HOLD THE MEADOW',boss,challenge,special:!!special,spawns:schedule,duration:clock+4};
    }
    start(){
      this.index++;this.elapsed=0;this.cursor=0;this.cleared=false;this.next=E.rest;
      this.current=this.generate(this.index+1);
      this.game.waveReached=this.index+1;
      this.game.beginChallenge(this.current.challenge);
      this.game.emit('wave',{index:this.index,...this.current});
      this.game.saveRecord();
    }
    jump(number){this.game.enemies.length=0;this.game.projectiles.length=0;this.game.hazards.length=0;this.index=Math.max(0,Math.floor(number)-1)-1;this.start();}
    update(dt){
      if(this.index<0){this.next-=dt;if(this.next<=0)this.start();return;}
      if(this.cleared){this.next-=dt;if(this.next<=0)this.start();return;}
      this.elapsed+=dt;
      const list=this.current.spawns;
      // Backpressure postpones spawns rather than deleting enemies or accumulating waves.
      while(this.cursor<list.length&&list[this.cursor].at<=this.elapsed&&this.game.enemies.length<E.maxEnemies){
        const s=list[this.cursor++];this.game.spawnEnemy(s.type,s.row,1404,s);
      }
      if(this.cursor===list.length&&!this.game.enemies.some(e=>e.alive)){
        this.cleared=true;this.game.clearWave(this.current);this.next=Math.max(3,E.rest-Math.floor(this.index/40));
      }
    }
  }
  M.EndlessDirector=EndlessDirector;
})(globalThis.Meadow);
