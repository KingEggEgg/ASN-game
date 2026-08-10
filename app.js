const CORRECT={invoice:'INV-001',awb:'1903099900',part:'1267370881',description:'Plastic Moulding; 538X354X28',qty:'200'};
const LABELS={invoice:'Invoice No',awb:'AWB',part:'Part Number',description:'Description',qty:'Qty'};
const ORDER=['invoice','awb','part','description','qty'];
const OPTIONS={invoice:['INV-001','INV-002','INV-003'],awb:['1903099900','1903099901','1903099902'],part:['1267370881','1267370882','1267370883'],description:['Plastic Moulding; 538X354X28','Thermal Conduction Compound','Lc Display; TFT 7inch'],qty:['200','240','120']};
const PALLETS={'6000.115.761':['📦 Pallet A','1200 × 800 × 500 mm','HU E105'],'6000.115.762':['📦 Pallet B','1200 × 800 × 1000 mm','HU E112'],'6000.115.763':['📦 Pallet C','1200 × 800 × 1500 mm','HU E119']};
const CAPTIONS=[
  ['Scene 1','A truck arrives at Receiving.'],
  ['Scene 2','The team is ready, but the ASN is missing.'],
  ['Scene 3','Use the printed Dummy Invoice to match the shipment data.'],
  ['Scene 4','Create the ASN, choose the pallet, and help Receiving move again.']
];
const $=id=>document.getElementById(id);
const state={scene:0,selectedChip:null,selectedPallet:null,start:null,secs:0,timer:null,pending:null};
const scenes=[...document.querySelectorAll('.scene')];

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(v){return String(v||'').trim().replace(/\s+/g,' ').toUpperCase()}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0)}
function setTheme(mode){const light=mode==='light';document.body.classList.toggle('light',light);$('themeIcon').textContent=light?'🌙':'☀️';$('themeLabel').textContent=light?'Dark':'Light';try{localStorage.setItem('asnTheme',light?'light':'dark')}catch{}}
function toggleTheme(){setTheme(document.body.classList.contains('light')?'dark':'light')}

function replaySceneAnimation(scene){
  const active=scenes[scene];
  active.querySelectorAll('*').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation=''})
}
function updateScene(i){
  state.scene=i;
  scenes.forEach((s,n)=>s.classList.toggle('active',n===i));
  $('storyStep').textContent=`Scene ${i+1} / ${scenes.length}`;
  $('storyBack').disabled=i===0;
  $('storyNext').textContent=i===scenes.length-1?'Replay Scene':'Next';
  const [title,text]=CAPTIONS[i];
  $('storyCaption').innerHTML=`<strong>${title}</strong><span>${text}</span>`;
  replaySceneAnimation(i)
}
function nextScene(){if(state.scene===scenes.length-1)replaySceneAnimation(state.scene);else updateScene(state.scene+1)}
function prevScene(){if(state.scene>0)updateScene(state.scene-1)}

function tick(){state.secs=state.start?Math.floor((Date.now()-state.start)/1000):0;const t=fmt(state.secs);['timer1','timer2'].forEach(id=>{$(id).textContent=t;$(id).classList.toggle('hot',state.secs>=50)})}
function startTimer(){clearInterval(state.timer);state.start=Date.now();state.secs=0;tick();state.timer=setInterval(tick,250)}
function stopTimer(){tick();clearInterval(state.timer);state.timer=null;$('finalTime').textContent=fmt(state.secs)}
function resetTimer(){clearInterval(state.timer);state.timer=null;state.start=null;state.secs=0;['timer1','timer2','finalTime'].forEach(id=>$(id).textContent='00:00')}

function message(id,text){$(id).textContent=text;$(id).classList.add('show')}
function clearMessages(){['asnMessage','huMessage'].forEach(id=>{$(id).textContent='';$(id).classList.remove('show')})}
function overlay(icon,title,text,callback){state.pending=callback;$('transitionIcon').textContent=icon;$('transitionTitle').textContent=title;$('transitionText').textContent=text;$('overlay').classList.add('show');$('overlay').setAttribute('aria-hidden','false')}
function continueOverlay(){$('overlay').classList.remove('show');$('overlay').setAttribute('aria-hidden','true');const cb=state.pending;state.pending=null;if(cb)cb()}

function renderFields(){
  const host=$('fieldList');host.innerHTML='';
  ORDER.forEach(field=>{
    const el=document.createElement('div');el.className='field-card';
    el.innerHTML=`<div class="field-head"><span>${LABELS[field]}</span><button class="clear-btn" data-clear="${field}">Clear</button></div><button class="answer-slot" data-field="${field}">Tap here after selecting ${LABELS[field]}</button>`;
    host.appendChild(el)
  })
}
function renderOptions(){
  const host=$('optionGroups');host.innerHTML='';
  ORDER.forEach(field=>{
    const g=document.createElement('section');g.className='option-group';g.innerHTML=`<div class="option-title">${LABELS[field]}</div>`;
    const chips=document.createElement('div');chips.className='chips';
    shuffle(OPTIONS[field]).forEach(value=>{const b=document.createElement('button');b.className='chip';b.dataset.field=field;b.dataset.value=value;b.textContent=value;chips.appendChild(b)});
    g.appendChild(chips);host.appendChild(g)
  })
}
function renderPallets(){
  const host=$('palletChoices');host.innerHTML='';
  shuffle(Object.keys(PALLETS)).forEach(key=>{
    const b=document.createElement('button');b.className='pallet-choice';b.dataset.value=key;
    const [name,size,hu]=PALLETS[key];b.innerHTML=`<strong>${name}</strong><small>${size}</small><small>${hu}</small>`;
    b.onclick=()=>{host.querySelectorAll('.pallet-choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.selectedPallet=key};host.appendChild(b)
  })
}
function clearField(field){
  const slot=document.querySelector(`.answer-slot[data-field="${field}"]`);if(!slot)return;
  const old=slot.dataset.value;
  if(old)document.querySelectorAll(`.chip[data-field="${field}"]`).forEach(c=>{if(c.dataset.value===old)c.classList.remove('used','selected')});
  slot.textContent=`Tap here after selecting ${LABELS[field]}`;slot.dataset.value='';slot.classList.remove('filled','correct','wrong')
}
function resetGame(){state.selectedChip=null;state.selectedPallet=null;clearMessages();renderFields();renderOptions();renderPallets();resetTimer()}

function checkAsn(){
  clearMessages();let wrong=0;
  document.querySelectorAll('.answer-slot').forEach(slot=>{const field=slot.dataset.field;if(norm(slot.dataset.value)===norm(CORRECT[field])){slot.classList.add('correct');slot.classList.remove('wrong')}else{wrong++;clearField(field);slot.classList.add('wrong')}});
  if(wrong){message('asnMessage',`Almost there! ${wrong} field(s) do not match the Dummy Invoice. Check those fields and try again.`);return}
  overlay('📦','Step 1 Complete','Great! Now choose the pallet that fits the rack.',()=>showPage('huPage'))
}
function checkHu(){
  clearMessages();if(!state.selectedPallet){message('huMessage','Choose one pallet first.');return}
  if(state.selectedPallet!=='6000.115.761'){message('huMessage','Not quite — this pallet is too tall for the rack. Try another one.');return}
  stopTimer();overlay('✅','ASN Created','Receiving can continue. Nice work!',()=>showPage('donePage'))
}

$('themeToggle').onclick=toggleTheme;$('storyBack').onclick=prevScene;$('storyNext').onclick=nextScene;
$('startMission').onclick=()=>{resetGame();showPage('asnPage');startTimer()};$('checkAsn').onclick=checkAsn;$('checkHu').onclick=checkHu;
$('restartAsn').onclick=$('restartHu').onclick=$('playAgain').onclick=()=>{resetGame();showPage('startPage');updateScene(0)};$('transitionContinue').onclick=continueOverlay;
$('optionGroups').addEventListener('click',e=>{const chip=e.target.closest('.chip');if(!chip||chip.classList.contains('used'))return;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));chip.classList.add('selected');state.selectedChip=chip});
document.addEventListener('click',e=>{const slot=e.target.closest('.answer-slot');if(slot&&state.selectedChip){const field=slot.dataset.field;if(state.selectedChip.dataset.field!==field){message('asnMessage',`This value belongs to ${LABELS[state.selectedChip.dataset.field]}, not ${LABELS[field]}.`);return}clearField(field);slot.textContent=state.selectedChip.dataset.value;slot.dataset.value=state.selectedChip.dataset.value;slot.classList.add('filled');state.selectedChip.classList.add('used');state.selectedChip.classList.remove('selected');state.selectedChip=null}const clr=e.target.closest('.clear-btn');if(clr)clearField(clr.dataset.clear)});
try{setTheme(localStorage.getItem('asnTheme')||'dark')}catch{setTheme('dark')}resetGame();updateScene(0);showPage('startPage');
