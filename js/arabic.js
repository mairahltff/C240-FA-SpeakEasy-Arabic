console.log("✅ arabic.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  function qs(id){ return document.getElementById(id); }

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

  const STORAGE_KEY = "speakeasy_arabic_setup_v3";

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

  function saveState(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed === "object"){
        if(parsed.goal)  state.goal  = parsed.goal;
        if(parsed.level) state.level = parsed.level;
        if(parsed.style) state.style = parsed.style;
      }
    }catch(e){}
  }

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
        saveState();
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

  /* ==========================
     ✅ FLOWISE OPEN ONLY
     (No setup paste/copy UI)
     ========================== */

  function findFlowiseToggleButtonBestEffort(){
    const selectors = [
      ".flowise-chatbot-button",
      ".flowise-chatbot-icon",
      ".flowise-chatbot-container .flowise-chatbot-button",
      "button[aria-label*='chat' i]",
      "button[title*='chat' i]",
      "button[class*='flowise' i]",
      "[class*='flowise-chatbot-button']",
      "[id*='flowise' i] button",
      "flowise-chatbot button",
      "flowise-chatbot-widget button",
      "flowise-embed button"
    ];

    for(const sel of selectors){
      const el = document.querySelector(sel);
      if(el) return el;
    }

    const hosts = [
      document.querySelector("flowise-chatbot"),
      document.querySelector("flowise-chatbot-widget"),
      document.querySelector("flowise-embed"),
    ].filter(Boolean);

    for(const host of hosts){
      if(host.shadowRoot){
        const btn =
          host.shadowRoot.querySelector(".flowise-chatbot-button") ||
          host.shadowRoot.querySelector("button") ||
          host.shadowRoot.querySelector("[role='button']");
        if(btn) return btn;
      }
    }

    return null;
  }

  async function openFlowiseBubbleBestEffort(timeoutMs = 2500){
    const start = Date.now();
    return await new Promise((resolve) => {
      const tick = () => {
        const btn = findFlowiseToggleButtonBestEffort();
        if(btn){
          btn.click();
          return resolve(true);
        }
        if(Date.now() - start > timeoutMs){
          return resolve(false);
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  let opening = false;

  async function startChatFlow(){
    if(opening) return;
    opening = true;
    await openFlowiseBubbleBestEffort();
    opening = false;
  }

  /* ==========================
     BUTTONS
     ========================== */

  startSetupBtn.addEventListener("click", () => {
    setupCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  jumpChatBtn.addEventListener("click", () => {
    startChatFlow();
  });

  startChatBtn.addEventListener("click", () => {
    startChatFlow();
  });

  backBtn.addEventListener("click", () => {
    if(stepIndex === 0) return;
    stepIndex -= 1;
    nextBtn.textContent = "Continue";
    renderStep();
  });

  nextBtn.addEventListener("click", () => {
    const step = steps[stepIndex];
    if(!step || !state[step.key]) return;

    stepIndex += 1;
    if(stepIndex >= steps.length){
      startChatFlow();
      return;
    }
    renderStep();
  });

  (function init(){
    loadState();
    stepIndex = 0;
    renderStep();
  })();

});
