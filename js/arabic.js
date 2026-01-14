console.log("✅ arabic.js loaded");

function qs(id){ return document.getElementById(id); }
function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const startSetupBtn = qs("startSetupBtn");
const startChatBtn  = qs("startChatBtn");
const jumpChatBtn   = qs("jumpChatBtn");
const setupCard     = qs("setupCard");

const step1 = qs("step1");
const step2 = qs("step2");
const step3 = qs("step3");

const progressBar = qs("progressBar");
const qTitle   = qs("qTitle");
const qHint    = qs("qHint");
const choicesEl = qs("choices");

const backBtn = qs("backBtn");
const nextBtn = qs("nextBtn");
const stepMini = qs("stepMini");

const state = {
  goal: "Conversation",
  level: null,
  style: null
};

let stepIndex = 0;

const steps = [
  {
    key: "goal",
    title: "What do you want to practice?",
    hint: "Choose one to continue.",
    options: [
      { title: "Conversation", sub: "Speak naturally with gentle corrections", tag: "⭐ Most popular" },
      { title: "Vocabulary", sub: "Build daily words and phrases", tag: "📘" },
      { title: "Grammar", sub: "Fix mistakes and learn patterns", tag: "✅" },
      { title: "Travel Arabic", sub: "Useful phrases for common situations", tag: "✈️" },
    ]
  },
  {
    key: "level",
    title: "Choose your level",
    hint: "This helps the AI adjust difficulty.",
    options: [
      { title: "Beginner", sub: "Basic words + simple sentences", tag: "A1" },
      { title: "Intermediate", sub: "Daily chats + corrections", tag: "B1" },
      { title: "Advanced", sub: "Fluency + roleplay scenarios", tag: "C1" },
    ]
  },
  {
    key: "style",
    title: "How do you prefer to learn?",
    hint: "Pick a chat style.",
    options: [
      { title: "Roleplay", sub: "Act out real situations", tag: "🎭" },
      { title: "Tutor mode", sub: "Explain, then practice", tag: "🧑‍🏫" },
      { title: "Quick drills", sub: "Short, fast exercises", tag: "⚡" },
      { title: "Gentle corrections", sub: "Fix mistakes kindly", tag: "🌿" },
    ]
  }
];

function setActiveStep(n){
  [step1, step2, step3].forEach(x => x.classList.remove("active"));
  if(n === 0) step1.classList.add("active");
  if(n === 1) step2.classList.add("active");
  if(n >= 2) step3.classList.add("active");
}

function updateProgress(){
  const pct = Math.round(((Math.min(stepIndex, steps.length)) / steps.length) * 100);
  progressBar.style.width = `${pct}%`;
}

function clearChoiceSelected(){
  choicesEl.querySelectorAll(".choice").forEach(el => el.classList.remove("selected"));
}

function renderStep(){
  const step = steps[stepIndex];

  qTitle.textContent = step.title;
  qHint.textContent  = step.hint;

  if(stepMini){
    stepMini.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
  }

  choicesEl.innerHTML = "";

  step.options.forEach(opt => {
    const div = document.createElement("div");
    div.className = "choice";

    const left = document.createElement("div");
    left.className = "choiceMain";
    left.innerHTML = `
      <div class="choiceTitle">${opt.title}</div>
      <div class="choiceSub">${opt.sub}</div>
    `;

    const tag = document.createElement("div");
    tag.className = "choiceTag";
    tag.textContent = opt.tag;

    div.appendChild(left);
    div.appendChild(tag);

    if(state[step.key] === opt.title){
      div.classList.add("selected");
    }

    div.addEventListener("click", () => {
      state[step.key] = opt.title;
      clearChoiceSelected();
      div.classList.add("selected");
      nextBtn.disabled = false;
    });

    choicesEl.appendChild(div);
  });

  backBtn.disabled = stepIndex === 0;
  nextBtn.disabled = !state[step.key];

  setActiveStep(stepIndex);
  updateProgress();
}

function buildSetupMessage(){
  const mode  = String(state.goal || "Conversation").trim();
  const level = String(state.level || "Beginner").trim();
  const style = String(state.style || "Gentle corrections").trim();

  return `Mode: ${mode}\nLevel: ${level}\nStyle: ${style}\nStart the session now. Begin with a short Arabic greeting and ask me one question to answer.`;
}

/* ===========================
   FLOWISE OPEN (SHADOW DOM SAFE)
   =========================== */

function findFlowiseToggleButton(){
  // direct DOM (sometimes)
  const direct =
    document.querySelector(".flowise-chatbot-button") ||
    document.querySelector("[class*='flowise'][class*='button']") ||
    document.querySelector("button[aria-label*='chat' i]") ||
    document.querySelector("button[title*='chat' i]");
  if (direct) return direct;

  // shadow DOM (common)
  const hosts = [
    document.querySelector("flowise-chatbot"),
    document.querySelector("flowise-chatbot-widget"),
    document.querySelector("flowise-embed"),
    document.querySelector("[id*='flowise']"),
    document.querySelector("[class*='flowise']"),
  ].filter(Boolean);

  for (const host of hosts){
    if (host.shadowRoot){
      const btn =
        host.shadowRoot.querySelector(".flowise-chatbot-button") ||
        host.shadowRoot.querySelector("button") ||
        host.shadowRoot.querySelector("[role='button']");
      if (btn) return btn;
    }
  }
  return null;
}

async function openFlowiseBubble({ timeoutMs = 7000, intervalMs = 120 } = {}){
  const start = Date.now();

  while (Date.now() - start < timeoutMs){
    const btn = findFlowiseToggleButton();
    if (btn){
      btn.click();
      return true;
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  console.warn("Flowise bubble not found yet. (Maybe still loading)");
  return false;
}

function trySendToFlowise(msg){
  // Some Flowise embeds expose an API. If yours doesn’t, this just no-ops.
  const api = window.flowiseChatbot;
  if (api && typeof api.sendMessage === "function"){
    api.sendMessage(msg);
    return true;
  }
  return false;
}

async function openFlowiseAndSendSetup(){
  const opened = await openFlowiseBubble();
  if (!opened) return;

  // give widget a moment to mount, then try send
  const msg = buildSetupMessage();
  setTimeout(() => {
    trySendToFlowise(msg);
  }, 600);
}

function showReadyScreen(){
  progressBar.style.width = "100%";
  setActiveStep(99);

  qTitle.textContent = "You're ready ✅";
  qHint.textContent  = "Click below to open your personalised Arabic chat.";

  if(stepMini){
    stepMini.textContent = `Step ${steps.length} of ${steps.length}`;
  }

  choicesEl.innerHTML = `
    <div class="choice selected" style="cursor:default;">
      <div class="choiceMain">
        <div class="choiceTitle">Start Arabic Chat</div>
        <div class="choiceSub">Goal, level and style are set.</div>
      </div>
      <div class="choiceTag">🚀</div>
    </div>
  `;

  nextBtn.textContent = "Start Chat";
  nextBtn.disabled = false;
}

/* ===========================
   BUTTONS
   =========================== */

startSetupBtn.addEventListener("click", () => {
  setupCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

jumpChatBtn.addEventListener("click", () => {
  openFlowiseAndSendSetup();
});

startChatBtn.addEventListener("click", () => {
  if(!state.level || !state.style){
    setupCard.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  openFlowiseAndSendSetup();
});

backBtn.addEventListener("click", () => {
  if(stepIndex === 0) return;
  stepIndex -= 1;
  nextBtn.textContent = "Continue";
  renderStep();
});

nextBtn.addEventListener("click", () => {
  // if already at end, clicking opens chat
  if(stepIndex >= steps.length){
    openFlowiseAndSendSetup();
    return;
  }

  const step = steps[stepIndex];
  if(!step || !state[step.key]) return;

  stepIndex += 1;

  if(stepIndex >= steps.length){
    showReadyScreen();
    return;
  }

  renderStep();
});

(function init(){
  const urlLevel = getQueryParam("level");
  const allowed = ["Beginner","Intermediate","Advanced"];
  if(urlLevel && allowed.includes(String(urlLevel).trim())){
    state.level = String(urlLevel).trim();
  }

  stepIndex = 0;
  renderStep();
})();
