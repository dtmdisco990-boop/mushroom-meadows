"use strict";
(function(M){
 const defaults=()=>({version:2,completed:[],unlocks:[],unlockedDefenders:[...M.CoreRoster],bossesDefeated:[],bestWave:0,bestScore:0,totalKills:0,endlessUnlocked:false,loadout:[...M.CoreRoster],chompReward:false});
 class Progression {
  constructor(storage){this.storage=storage;this.data=defaults();this.available=true;try{const raw=JSON.parse(storage?.getItem('meadow-progress')||'{}');this.data={...this.data,...raw};}catch{this.available=false;}
   for(const k of ['completed','unlocks','bossesDefeated'])if(!Array.isArray(this.data[k]))this.data[k]=[];
   this.data.unlockedDefenders=[...new Set([...M.CoreRoster,...(Array.isArray(this.data.unlockedDefenders)?this.data.unlockedDefenders:[]).filter(k=>M.Config.defenders[k])])];
   this.data.endlessUnlocked=this.data.completed.includes('world-1-1');
   for(const k of ['bestWave','bestScore','totalKills'])this.data[k]=Math.max(0,Number.isFinite(this.data[k])?this.data[k]:0);
   this.data.loadout=this.validateLoadout(this.data.loadout);this.save();
  }
  validateLoadout(keys){const valid=[...new Set(Array.isArray(keys)?keys:[])].filter(k=>this.data.unlockedDefenders.includes(k)).slice(0,6);return valid.length===6?valid:[...M.CoreRoster];}
  save(){try{this.storage?.setItem('meadow-progress',JSON.stringify(this.data));}catch{this.available=false;}}
  complete(castle){this.data.completed=[...new Set([...this.data.completed,'world-1-1'])];this.data.unlocks=[...new Set([...this.data.unlocks,M.Config.level.unlock])];this.data.bestCastle=Math.max(this.data.bestCastle||0,castle);this.data.endlessUnlocked=true;this.save();}
  unlock(key){if(!M.EndlessConfig.unlocks[key]||this.data.unlockedDefenders.includes(key))return false;this.data.unlockedDefenders.push(key);this.save();return true;}
  boss(key){this.data.bossesDefeated=[...new Set([...this.data.bossesDefeated,key])];if(key==='chomp')this.data.chompReward=true;this.save();}
  record(wave,score,kills=0){this.data.bestWave=Math.max(this.data.bestWave,wave);this.data.bestScore=Math.max(this.data.bestScore,score);this.data.totalKills+=kills;this.save();}
  reset(){this.data=defaults();this.save();}
 }
 M.Progression=Progression;
})(globalThis.Meadow);
