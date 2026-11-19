"use strict";
(function(M){
 const C=M.Config,E=M.EndlessConfig;
 const picture=k=>{
  const frame=M.Art.frames[k];
  return frame?`<svg class="art-${k}" viewBox="${frame.crop.join(' ')}" aria-hidden="true"><image href="${M.Art.uri(k)}" width="${frame.size[0]}" height="${frame.size[1]}"/></svg>`:`<img src="${M.Art.uri(k)}" alt="" class="art-${k}">`;
 };
 class EndlessUI extends M.UI {
  menu(scene){
   M.progress=new M.Progression(globalThis.localStorage);super.menu(scene);
   this.root.querySelector('a[download]').href='downloads/Mushroom-Meadow-Endless.zip';
   const p=M.progress.data,actions=this.root.querySelector('.menu-copy .actions');
   actions.classList.add('mode-actions');actions.querySelector('#play').textContent='World 1-1 · Mushroom Meadow';
   actions.querySelector('#play').onclick=()=>{M.mode='campaign';};
   const button=document.createElement('button');button.id='endless';button.className='primary endless-button';button.disabled=!p.endlessUnlocked;
   button.innerHTML=`World 1-2 · Endless <small>${p.endlessUnlocked?`BEST WAVE ${p.bestWave} · BEST SCORE ${p.bestScore.toLocaleString()}`:'MUST BEAT WORLD 1-1 FIRST'}</small>`;
   actions.insertBefore(button,actions.querySelector('#how'));button.onclick=()=>{if(!M.progress.data.completed.includes('world-1-1'))return;M.mode='endless';M.audio.unlock();scene.scene.start('Loadout');};
   // Reset the mode before the inherited campaign listener starts its scene.
   actions.querySelector('#play').addEventListener('click',()=>{M.mode='campaign';},{capture:true});
   const reset=document.createElement('button');reset.className='small-link reset-progress';reset.textContent='Reset progress';this.root.querySelector('.menu-footer').append(reset);
   reset.onclick=()=>{const box=this.modal('<div class="panel pause-panel"><h2>Reset your adventure?</h2><p>This erases unlocked characters, World 1-1 completion and Endless records on this browser.</p><div class="actions"><button class="secondary" id="cancel-reset">Keep progress</button><button class="primary" id="confirm-reset">Erase progress</button></div></div>');box.querySelector('#cancel-reset').onclick=()=>box.remove();box.querySelector('#confirm-reset').onclick=()=>{M.progress.reset();this.menu(scene);};};
   if(!M.progress.available)this.toast('Browser storage is unavailable. Progress will last for this session only.');
  }
  loadout(scene){
   if(M.mode!=='endless')return super.loadout(scene);
   if(!M.progress.data.completed.includes('world-1-1')){M.mode='campaign';scene.scene.start('Menu');return;}
   this.clear();let selected=[...M.progress.data.loadout];const unlocked=M.progress.data.unlockedDefenders;
   const draw=()=>{
    this.root.innerHTML=`<div class="overlay"><div class="panel loadout endless-loadout"><button class="close" aria-label="Back to menu">×</button><div class="loadout-head"><div><div class="eyebrow">WORLD 1-2 / YOUR ENDLESS TEAM</div><h2>Six slots. Endless possibilities.</h2><p>Click a selected card to free a slot, then choose its replacement.</p></div><div class="loadout-info">${selected.length} / 6 EQUIPPED<br><br>${650+(M.progress.data.chompReward?50:0)} starting coins</div></div><div class="endless-roster">${Object.entries(C.defenders).map(([k,d])=>`<button class="roster-card ${selected.includes(k)?'chosen':''} ${unlocked.includes(k)?'':'locked'}" data-pick="${k}" ${unlocked.includes(k)?'':'disabled'} aria-pressed="${selected.includes(k)}">${picture(k)}<div><div class="role">${unlocked.includes(k)?d.role:'LOCKED CHARACTER'}</div><h3>${d.name} <span class="cost">${d.cost}</span></h3><p>${unlocked.includes(k)?d.description:E.unlocks[k]}</p></div><span class="equipped">${selected.includes(k)?selected.indexOf(k)+1:unlocked.includes(k)?'+':'–'}</span></button>`).join('')}</div><div class="loadout-bottom"><div class="hint"><strong>Keep an economy unit and a reliable attacker.</strong><br>Bosses every 10 waves · Yoshi rescue 15 · Luigi challenge 25<br>Spare slot? Keep Bob-omb ready for a bad afternoon.</div><button class="primary" id="begin" ${selected.length===6?'':'disabled'}>Begin Endless Run</button></div></div></div>`;
    this.bind('.close',()=>scene.scene.start('Menu'));
    this.root.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const key=b.dataset.pick;if(selected.includes(key))selected=selected.filter(k=>k!==key);else if(selected.length<6)selected.push(key);else{this.toast('Remove one selected defender first.');return;}draw();});
    this.bind('#begin',()=>{M.progress.data.loadout=[...selected];M.progress.save();scene.scene.start('Battle');});
   };draw();
  }
  battle(scene){super.battle(scene);if(scene.model.mode!=='endless')return;this.root.querySelector('.world-label').innerHTML='<div class="eyebrow">WORLD 1-2</div><h2>Endless Meadow</h2><div class="weather">BUILD · SURVIVE · RESCUE · REPEAT</div>';
   const panel=document.createElement('div');panel.className='endless-records';panel.innerHTML='<div><span>CURRENT SCORE</span><b id="run-score">0</b></div><div><span>BEST WAVE</span><b id="best-wave">0</b></div><div><span>BEST SCORE</span><b id="best-score">0</b></div>';this.root.append(panel);
   const challenge=document.createElement('div');challenge.className='challenge-status';this.root.append(challenge);
  }
  updateBattle(scene){super.updateBattle(scene);const g=scene.model;if(g.mode!=='endless')return;
   this.root.querySelector('#run-score').textContent=g.score.toLocaleString();this.root.querySelector('#best-wave').textContent=g.progress.data.bestWave;this.root.querySelector('#best-score').textContent=Math.max(g.score,g.progress.data.bestScore).toLocaleString();
   const boss=g.enemies.find(e=>e.boss&&e.alive);if(boss){const bosses=g.enemies.filter(e=>e.boss&&e.alive);this.root.querySelector('.boss-title span').textContent=bosses.length>1?bosses.map(e=>C.enemies[e.type].name.toUpperCase()).join(' + '):`${C.enemies[boss.type].name.toUpperCase()} · PHASE ${boss.phase}`;const hp=bosses.reduce((a,e)=>a+Math.max(0,e.hp),0),max=bosses.reduce((a,e)=>a+e.maxHP,0);this.cache['boss-number'].textContent=`${Math.ceil(hp)} / ${max}`;this.root.querySelector('.boss-fill').style.width=(hp/max*100)+'%';}
   const c=g.challenge, chomp=g.enemies.find(e=>e.type==='chomp'&&e.phase===1&&e.alive),status=this.root.querySelector('.challenge-status');
   status.textContent=c?(c.key==='yoshi'?(c.failed?'YOSHI RESCUE · Failed this run':`YOSHI RESCUE · Egg ${Math.max(0,Math.ceil(c.hp))} / 420 · Protect lane 3 · No breaches`):`LUIGI RESCUE · Signal ${Math.min(3,c.hits)} / 3 · ${c.failed?'Breach — challenge failed':'Keep castle intact'} · Stomp green signal`):chomp?`CHAIN RELEASE · Stomp the gold relay in lane ${chomp.row+1} · Anchor ${chomp.anchorHP} / ${chomp.anchorMax}`:'';
   status.style.display=status.textContent?'block':'none';
   if(boss)this.cache.prep.style.display='none';
   if(g.wave.cleared){this.cache.prep.style.display='block';this.cache.prep.textContent=`Wave cleared · Next attack in ${Math.ceil(g.wave.next)}s`;}else if(g.wave.index>=0)this.cache.prep.style.display='none';
   this.cache.tip.textContent=g.wave.index<9?'Keep Toads safe. Bosses arrive every 10 waves.':g.wave.index<19?'Fire finishes Dry Bones. Ice reveals Boos.':g.wave.index<29?'Stomp Chain Chomp’s relay. Watch the highlighted attack lanes.':'Elite enemies resist devouring. Save bombs for the biggest threats.';
  }
  intro(onStart){if(M.mode!=='endless')return super.intro(onStart);const box=this.modal(`<div class="panel intro-panel"><div class="eyebrow">WORLD 1-2 · ENDLESS</div><h2>How long can you hold?</h2><div class="intro-icons">${picture('yoshi')}${picture('chomp')}${picture('junior')}</div><p>Build your economy, hold five lanes and chase your record.<br>Bosses arrive every 10 waves. Rescue characters to unlock them.</p><p class="small">Yoshi rescue: wave 15 · Luigi signal challenge: wave 25<br>Watch attack markings. Ice and focused damage can interrupt boss attacks.<br>Mario can stomp glowing rescue signals.<br>Coins cap at 5,000. Beyond 5 Toads, generation becomes slower.</p><button class="primary">Ready, set, defend!</button></div>`);box.querySelector('button').onclick=()=>{box.remove();onStart();};}
  result(scene,data){if(!data.endless){super.result(scene,data);if(data.won)this.root.querySelector('.reward').textContent='WORLD 1-2 UNLOCKED · Endless Mode is ready in the main menu';return;}
   this.clear();const p=M.progress.data;this.root.innerHTML=`<div class="overlay"><div class="panel result endless-result"><div class="eyebrow">WORLD 1-2 · RUN COMPLETE</div>${picture(data.score>data.startBest?'star':'chomp')}<h2>${data.score>data.startBest?'A new personal best!':'A brave last stand.'}</h2><p>The meadow remembers. Come back with a better plan.</p><div class="result-stats">${[['WAVE REACHED',data.wave],['SCORE',data.score.toLocaleString()],['ENEMIES DEFEATED',data.stats.kills],['BOSSES DEFEATED',data.stats.bosses],['BEST WAVE',p.bestWave],['BEST SCORE',p.bestScore.toLocaleString()]].map(([k,v])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('')}</div><div class="reward">NEW UNLOCKS · ${data.newUnlocks.length?data.newUnlocks.map(k=>C.defenders[k].name).join(' · '):'None this run'}${p.chompReward?' · Chain Crest: +50 starting coins':''}</div><div class="actions"><button class="primary" id="again">Try again</button><button class="secondary" id="loadout">Loadout</button><button class="secondary" id="home">Main menu</button></div></div></div>`;
   this.bind('#again',()=>scene.scene.start('Battle'));this.bind('#loadout',()=>scene.scene.start('Loadout'));this.bind('#home',()=>scene.scene.start('Menu'));
  }
 }
 M.UI=EndlessUI;
})(Meadow);
