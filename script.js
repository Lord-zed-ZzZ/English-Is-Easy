const TOTAL_SETS=100;
const QUESTIONS_PER_SET=20;
const ACHIEVEMENTS=[
{id:"firstWin",name:"First Win",icon:"🎉",desc:"Complete Set 1"},
{id:"rookie",name:"Grammar Rookie",icon:"📗",desc:"Complete 5 sets"},
{id:"hero",name:"Grammar Hero",icon:"🦸",desc:"Complete 20 sets"},
{id:"perfect",name:"Perfect Score",icon:"💯",desc:"Score 20/20"},
{id:"q100",name:"100 Questions Completed",icon:"❓",desc:"Answer 100 questions"},
{id:"q500",name:"500 Questions Completed",icon:"🔥",desc:"Answer 500 questions"},
{id:"master",name:"Grammar Master",icon:"🏆",desc:"Complete 100 sets"}
];
const AVATARS=[
{id:"boy",name:"Boy",icon:"👦",cost:0},
{id:"girl",name:"Girl",icon:"👧",cost:0},
{id:"robot",name:"Robot",icon:"🤖",cost:150},
{id:"cat",name:"Cat",icon:"🐱",cost:200},
{id:"fox",name:"Fox",icon:"🦊",cost:250},
{id:"panda",name:"Panda",icon:"🐼",cost:300},
{id:"wizard",name:"Wizard",icon:"🧙",cost:400}
];
const THEMES=[
{id:"school",name:"School",icon:"🏫",cost:0},
{id:"space",name:"Space",icon:"🚀",cost:200},
{id:"jungle",name:"Jungle",icon:"🌿",cost:250},
{id:"ocean",name:"Ocean",icon:"🌊",cost:300},
{id:"castle",name:"Castle",icon:"🏰",cost:350},
{id:"candy",name:"Candy",icon:"🍬",cost:400}
];
const DEFAULT_DATA={unlockedSet:1,completedSets:[],scores:{},coins:0,totalQuestions:0,totalCorrect:0,totalStars:0,achievements:[],avatar:"boy",theme:"school",ownedAvatars:["boy","girl"],ownedThemes:["school"]};
let data=loadData();
let activeMin=1;
let activeMax=20;
let game=null;
const $=id=>document.getElementById(id);
function clone(obj){return JSON.parse(JSON.stringify(obj))}
function loadData(){
const saved=localStorage.getItem("egcSave");
return saved?{...clone(DEFAULT_DATA),...JSON.parse(saved)}:clone(DEFAULT_DATA);
}
function saveData(){
localStorage.setItem("egcSave",JSON.stringify(data));
refreshTop();
}
function refreshTop(){
const avatar=AVATARS.find(a=>a.id===data.avatar)||AVATARS[0];
$("topAvatar").textContent=avatar.icon;
$("topCoins").textContent=data.coins;
document.body.className=data.theme;
}
function showScreen(id){
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
$(id).classList.add("active");
if(id==="setsScreen")renderSets();
if(id==="progressScreen")renderProgress();
if(id==="achievementScreen")renderAchievements();
if(id==="settingsScreen")renderSettings();
}
function toast(msg){
const box=$("toast");
box.textContent=msg;
box.classList.add("show");
setTimeout(()=>box.classList.remove("show"),1600);
}
function sound(type){
const Ctx=window.AudioContext||window.webkitAudioContext;
if(!Ctx)return;
const ctx=new Ctx();
const osc=ctx.createOscillator();
const gain=ctx.createGain();
const sounds={correct:[880,.12,"sine"],wrong:[160,.18,"square"],level:[660,.14,"triangle"],achieve:[990,.24,"sine"]};
const s=sounds[type]||sounds.correct;
osc.frequency.value=s[0];
osc.type=s[2];
gain.gain.setValueAtTime(.06,ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+s[1]);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime+s[1]);
}
function shuffle(arr){
return arr.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
}
function levelKey(setNo){
if(setNo<=20)return"level1";
if(setNo<=40)return"level2";
if(setNo<=60)return"level3";
return"mixed";
}
function levelName(setNo){
if(setNo<=20)return"Level 1";
if(setNo<=40)return"Level 2";
if(setNo<=60)return"Level 3";
return"Level 4";
}
function pickQuestions(setNo){
const bank=QUESTION_BANK[levelKey(setNo)];
const selected=shuffle(bank).slice(0,QUESTIONS_PER_SET).map(q=>({...q,options:shuffle(q.options)}));
while(selected.length<QUESTIONS_PER_SET){
const q=bank[Math.floor(Math.random()bank.length)];
selected.push({...q,options:shuffle(q.options)});
}
return selected;
}
function renderSets(){
const grid=$("setGrid");
grid.innerHTML="";
for(let i=activeMin;i<=activeMax;i++){
const unlocked=i<=data.unlockedSet;
const done=data.completedSets.includes(i);
const best=data.scores[i]?.stars||0;
const card=document.createElement("div");
card.className=set-card ${unlocked?"unlocked":"locked"} ${done?"done":""};
card.innerHTML=<span>${done?"✓":unlocked?"📘":"🔒"}</span>Set ${i}<br><small>${levelName(i)} ${best?"· "+"★".repeat(best):""}</small>;
if(unlocked)card.onclick=()=>startSet(i);
grid.appendChild(card);
}
}
function startSet(setNo){
game={setNo,questions:pickQuestions(setNo),index:0,selected:null,score:0,correct:0,wrong:0,lives:3,coins:0,answered:false};
showScreen("gameScreen");
renderQuestion();
}
function renderQuestion(){
const q=game.questions[game.index];
game.selected=null;
game.answered=false;
$("qCount").textContent=Question ${game.index+1} / ${QUESTIONS_PER_SET};
$("scoreHud").textContent=Score: ${game.score};
$("lifeHud").textContent="❤️".repeat(game.lives)+"♡".repeat(3-game.lives);
$("coinHud").textContent=${data.coins+game.coins} 🪙;
$("questionBar").style.width=${(game.index/QUESTIONS_PER_SET)*100}%;
$("typeTag").textContent=q.type;
$("questionText").textContent=q.q;
$("feedback").textContent="";
$("submitBtn").classList.remove("hidden");
$("nextBtn").classList.add("hidden");
const area=$("answerArea");
area.innerHTML="";
q.options.forEach(opt=>{
const btn=document.createElement("button");
btn.className="answer";
btn.textContent=opt;
btn.onclick=()=>{
if(game.answered)return;
document.querySelectorAll(".answer").forEach(b=>b.classList.remove("selected"));
btn.classList.add("selected");
game.selected=opt;
};
area.appendChild(btn);
});
}
function submitAnswer(){
if(!game||game.answered)return;
if(!game.selected){toast("Pick one answer");return}
const q=game.questions[game.index];
const correct=game.selected===q.answer;
game.answered=true;
document.querySelectorAll(".answer").forEach(btn=>{
if(btn.textContent===q.answer)btn.classList.add("correct");
if(btn.textContent===game.selected&&!correct)btn.classList.add("wrong");
});
if(correct){
game.score+=5;
game.correct++;
game.coins+=10;
$("feedback").textContent="✔ Correct! +5 marks, +10 coins";
sound("correct");
}else{
game.wrong++;
game.lives--;
$("feedback").textContent=✘ Wrong. Answer: ${q.answer};
sound("wrong");
}
$("scoreHud").textContent=Score: ${game.score};
$("lifeHud").textContent="❤️".repeat(game.lives)+"♡".repeat(3-game.lives);
$("coinHud").textContent=${data.coins+game.coins} 🪙;
$("submitBtn").classList.add("hidden");
$("nextBtn").classList.remove("hidden");
$("nextBtn").textContent=game.lives<=0||game.index===QUESTIONS_PER_SET-1?"Finish":"Next";
}
function nextQuestion(){
if(game.lives<=0||game.index===QUESTIONS_PER_SET-1){endSet();return}
game.index++;
renderQuestion();
}
function starCount(correct){
if(correct===20)return 3;
if(correct>=18)return 2;
if(correct>=15)return 1;
return 0;
}
function endSet(){
const setNo=game.setNo;
const answered=game.correct+game.wrong;
const complete=answered===QUESTIONS_PER_SET;
const stars=complete?starCount(game.correct):0;
const percent=Math.round(game.correct/QUESTIONS_PER_SET100);
data.coins+=game.coins;
data.totalQuestions+=answered;
data.totalCorrect+=game.correct;
const oldStars=data.scores[setNo]?.stars||0;
data.scores[setNo]={score:game.score,correct:game.correct,wrong:game.wrong,percent,stars,complete};
if(complete&&!data.completedSets.includes(setNo))data.completedSets.push(setNo);
if(complete&&setNo===data.unlockedSet&&setNo<TOTAL_SETS){data.unlockedSet++;sound("level")}
if(stars>oldStars)data.totalStars+=stars-oldStars;
saveData();
checkAchievements(game.correct,complete);
$("endHeading").textContent=complete?"Congratulations!":"Game Over";
$("starDisplay").textContent=stars?"★".repeat(stars)+"☆".repeat(3-stars):"Try Again";
$("finalScore").textContent=game.score;
$("finalCorrect").textContent=${game.correct}/20;
$("finalWrong").textContent=game.wrong;
$("finalPercent").textContent=${percent}%;
$("nextSetBtn").style.display=complete&&setNo<TOTAL_SETS?"inline-block":"none";
showScreen("endScreen");
}
function checkAchievements(lastCorrect,complete){
const before=data.achievements.length;
const completed=data.completedSets.length;
const unlock=id=>{if(!data.achievements.includes(id))data.achievements.push(id)};
if(completed>=1)unlock("firstWin");
if(completed>=5)unlock("rookie");
if(completed>=20)unlock("hero");
if(complete&&lastCorrect===20)unlock("perfect");
if(data.totalQuestions>=100)unlock("q100");
if(data.totalQuestions>=500)unlock("q500");
if(completed>=100)unlock("master");
if(data.achievements.length>before){sound("achieve");toast("🏆 Achievement unlocked!")}
saveData();
}
function renderProgress(){
const accuracy=data.totalQuestions?Math.round(data.totalCorrect/data.totalQuestions*100):0;
$("statSets").textContent=data.completedSets.length;
$("statQuestions").textContent=data.totalQuestions;
$("statAccuracy").textContent=${accuracy}%;
$("statLevel").textContent=levelName(data.unlockedSet);
$("statCoins").textContent=data.coins;
$("statStars").textContent=data.totalStars;
$("statAchievements").textContent=${data.achievements.length}/${ACHIEVEMENTS.length};
}
function renderAchievements(){
const grid=$("achievementGrid");
grid.innerHTML="";
ACHIEVEMENTS.forEach(a=>{
const unlocked=data.achievements.includes(a.id);
const card=document.createElement("div");
card.className=badge ${unlocked?"unlocked":""};
card.innerHTML=<span class="icon">${unlocked?a.icon:"🔒"}</span><h3>${a.name}</h3><p>${a.desc}</p>;
grid.appendChild(card);
});
}
function renderSettings(){
renderShop("avatarGrid",AVATARS,"ownedAvatars","avatar");
renderShop("themeGrid",THEMES,"ownedThemes","theme");
}
function renderShop(gridId,items,ownedKey,selectedKey){
const grid=$(gridId);
grid.innerHTML="";
items.forEach(item=>{
const owned=data[ownedKey].includes(item.id);
const selected=data[selectedKey]===item.id;
const card=document.createElement("div");
card.className=shop-item ${selected?"selected":""} ${owned?"":"locked"};
const label=selected?"Selected":owned?"Select":Unlock ${item.cost} 🪙;
card.innerHTML=<span class="icon">${item.icon}</span><h3>${item.name}</h3><p>${owned?"Unlocked":${item.cost} coins}</p><button ${selected?"disabled":""}>${label}</button>;
card.querySelector("button").onclick=()=>{
if(owned){
data[selectedKey]=item.id;
saveData();
renderSettings();
toast(${item.name} selected);
return;
}
if(data.coins>=item.cost){
data.coins-=item.cost;
data[ownedKey].push(item.id);
data[selectedKey]=item.id;
saveData();
renderSettings();
sound("level");
toast(${item.name} unlocked);
}else{
toast("Not enough coins");
}
};
grid.appendChild(card);
});
}
document.addEventListener("click",e=>{
const target=e.target.dataset.screen;
if(target)showScreen(target);
});
$("startBtn").onclick=()=>showScreen("setsScreen");
$("progressBtn").onclick=()=>showScreen("progressScreen");
$("achievementBtn").onclick=()=>showScreen("achievementScreen");
$("settingsBtn").onclick=()=>showScreen("settingsScreen");
$("gameHomeBtn").onclick=()=>showScreen("menuScreen");
$("submitBtn").onclick=submitAnswer;
$("nextBtn").onclick=nextQuestion;
$("retryBtn").onclick=()=>startSet(game.setNo);
$("nextSetBtn").onclick=()=>startSet(game.setNo+1);
document.querySelectorAll(".tab").forEach(tab=>{
tab.onclick=()=>{
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
tab.classList.add("active");
activeMin=Number(tab.dataset.min);
activeMax=Number(tab.dataset.max);
renderSets();
};
});
refreshTop();
renderSets();