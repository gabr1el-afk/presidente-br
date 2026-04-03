const TICKS_PER_SECOND = 20;
const TICKS_PER_MINUTE = 1200;
const TICKS_PER_YEAR = 48000;
const START_DATE = new Date("2026-01-01T00:00:00");

let tickAtual = 0;
let jogoRodando = true;
let velocidadeJogo = 1;
let loopId = null;
let decisionTimerId = null;

const COUNTRIES = {
  brazil: {
    id: "brazil",
    name: "Brasil",
    flag: "🇧🇷",
    title: "Presidente do Brasil",
    difficultyName: "Mandato Inicial",
    start: { gdp: 2.3, inflation: 6.8, popularity: 57, cash: 170, unemployment: 10.4, taxRate: 28 },
    approval: { economia: 54, saude: 62, seguranca: 44, educacao: 58 },
    relations: [
      { name: "Estados Unidos", flag: "🇺🇸", status: "Acordos em negociação" },
      { name: "China", flag: "🇨🇳", status: "Comércio aquecido" },
      { name: "Mercosul", flag: "🌎", status: "Integração sensível" }
    ]
  },
  argentina: {
    id: "argentina",
    name: "Argentina",
    flag: "🇦🇷",
    title: "Presidente da Argentina",
    difficultyName: "Crise Cambial",
    start: { gdp: 0.74, inflation: 23.5, popularity: 48, cash: 42, unemployment: 12.6, taxRate: 32 },
    approval: { economia: 28, saude: 52, seguranca: 39, educacao: 49 },
    relations: [
      { name: "Brasil", flag: "🇧🇷", status: "Dependência comercial" },
      { name: "FMI", flag: "🏦", status: "Pressão por ajuste" },
      { name: "Mercosul", flag: "🌎", status: "Expectativa elevada" }
    ]
  },
  venezuela: {
    id: "venezuela",
    name: "Venezuela",
    flag: "🇻🇪",
    title: "Presidente da Venezuela",
    difficultyName: "Colapso Estrutural",
    start: { gdp: 0.39, inflation: 28.4, popularity: 41, cash: 18, unemployment: 16.4, taxRate: 34 },
    approval: { economia: 18, saude: 34, seguranca: 29, educacao: 31 },
    relations: [
      { name: "Colômbia", flag: "🇨🇴", status: "Tensão na fronteira" },
      { name: "OPEP", flag: "🛢️", status: "Receita estratégica" },
      { name: "Nações vizinhas", flag: "🌎", status: "Crise migratória" }
    ]
  },
  southafrica: {
    id: "southafrica",
    name: "África do Sul",
    flag: "🇿🇦",
    title: "Presidente da África do Sul",
    difficultyName: "Desemprego Crítico",
    start: { gdp: 0.86, inflation: 11.8, popularity: 46, cash: 74, unemployment: 24.2, taxRate: 27 },
    approval: { economia: 31, saude: 57, seguranca: 35, educacao: 46 },
    relations: [
      { name: "União Africana", flag: "🌍", status: "Liderança regional" },
      { name: "China", flag: "🇨🇳", status: "Investimentos pesados" },
      { name: "BRICS", flag: "🤝", status: "Coordenação estratégica" }
    ]
  }
};

const DECISION_LIBRARY = [
  {
    id: "tax-cut",
    title: "Reduzir imposto para empresas?",
    body: "O setor industrial promete novos investimentos se o governo aliviar a carga tributária.",
    duration: 5800,
    tags: ["Economia", "Emprego"],
    options: {
      approve: {
        label: "Aprovar",
        immediate: { gdp: 0.08, cash: -28, popularity: 2, unemployment: -0.5, inflation: 0.2 },
        overTime: { gdp: 0.00009, cash: -0.01, popularity: -0.00003 },
        approval: { economia: 4, educacao: -1 },
        mood: "good",
        impact: "O setor produtivo reage bem, mas a arrecadação perde fôlego."
      },
      reject: {
        label: "Recusar",
        immediate: { cash: 18, popularity: -2, gdp: -0.03, unemployment: 0.2 },
        overTime: { cash: 0.005, inflation: -0.00008 },
        approval: { economia: -3, saude: 1 },
        mood: "neutral",
        impact: "O caixa melhora, mas o mercado vê o governo como defensivo."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -4, cash: -12, gdp: -0.02 },
      overTime: { popularity: -0.00008 },
      approval: { economia: -4 },
      mood: "bad",
      impact: "A indecisão contaminou a confiança do mercado e do Congresso."
    }
  },
  {
    id: "social-pack",
    title: "Expandir programas sociais?",
    body: "Governadores e movimentos sociais cobram reforço de renda em regiões vulneráveis.",
    duration: 6200,
    tags: ["Popularidade", "Social"],
    options: {
      approve: {
        label: "Expandir",
        immediate: { popularity: 5, cash: -24, gdp: 0.03, inflation: 0.3, unemployment: -0.2 },
        overTime: { popularity: 0.00008, cash: -0.006, inflation: 0.00005 },
        approval: { saude: 4, educacao: 3, economia: -1 },
        mood: "good",
        impact: "O governo ganha calor popular, com custo fiscal visível."
      },
      reject: {
        label: "Segurar",
        immediate: { cash: 16, popularity: -5, inflation: -0.1 },
        overTime: { popularity: -0.00007, unemployment: 0.00004 },
        approval: { saude: -4, educacao: -3 },
        mood: "bad",
        impact: "A pressão nas ruas sobe e a imagem social do governo enfraquece."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -4, cash: -6 },
      overTime: { popularity: -0.00006 },
      approval: { saude: -2, educacao: -2 },
      mood: "bad",
      impact: "A omissão passou a sensação de governo perdido."
    }
  },
  {
    id: "imports",
    title: "Abrir importações para aliviar preços?",
    body: "A equipe econômica quer reduzir o custo de alimentos e insumos rapidamente.",
    duration: 5000,
    tags: ["Inflação", "Comércio"],
    options: {
      approve: {
        label: "Abrir",
        immediate: { inflation: -1.1, gdp: 0.04, popularity: 1, unemployment: 0.2 },
        overTime: { inflation: -0.00011, gdp: 0.00003, popularity: -0.00003 },
        approval: { economia: 3, seguranca: 1 },
        mood: "good",
        impact: "Os preços aliviam, mas setores protegidos reagem mal."
      },
      reject: {
        label: "Proteger",
        immediate: { popularity: 1, inflation: 0.5, cash: 8 },
        overTime: { inflation: 0.00009, gdp: -0.00003 },
        approval: { economia: -2 },
        mood: "neutral",
        impact: "A indústria respira, porém a inflação continua pressionando."
      }
    },
    timeoutPenalty: {
      immediate: { inflation: 0.6, popularity: -3 },
      overTime: { inflation: 0.00005 },
      approval: { economia: -3 },
      mood: "bad",
      impact: "A demora deixou o mercado sem direção e os preços subiram."
    }
  },
  {
    id: "security-plan",
    title: "Lançar um pacote de segurança urbana?",
    body: "Governadores pedem resposta rápida diante da alta sensação de insegurança.",
    duration: 5400,
    tags: ["Segurança", "Popularidade"],
    options: {
      approve: {
        label: "Lançar",
        immediate: { popularity: 3, cash: -18, gdp: 0.01 },
        overTime: { popularity: 0.00005, cash: -0.004 },
        approval: { seguranca: 8, economia: -1 },
        mood: "good",
        impact: "A agenda de segurança melhora a percepção pública rapidamente."
      },
      reject: {
        label: "Adiar",
        immediate: { cash: 10, popularity: -3 },
        overTime: { popularity: -0.00006 },
        approval: { seguranca: -7 },
        mood: "bad",
        impact: "A oposição explora a hesitação e domina o debate."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -2, cash: -4 },
      overTime: { popularity: -0.00004 },
      approval: { seguranca: -3 },
      mood: "bad",
      impact: "A sensação de vazio de liderança tomou conta do noticiário."
    }
  }
];

const EVENT_LIBRARY = [
  {
    title: "Choque global de crédito",
    priority: "high",
    effect: { gdp: -0.05, inflation: 0.7, popularity: -2, cash: -14, unemployment: 0.3 },
    approval: { economia: -4 },
    body: "Mercados internacionais fecham a torneira e os investidores recuam."
  },
  {
    title: "Safra recorde",
    priority: "good",
    effect: { gdp: 0.04, inflation: -0.6, popularity: 1.2, cash: 10 },
    approval: { economia: 3, saude: 1 },
    body: "A produção agrícola surpreende e alivia parte da pressão sobre preços."
  },
  {
    title: "Escândalo ministerial",
    priority: "high",
    effect: { popularity: -4.5, cash: -6, gdp: -0.02 },
    approval: { seguranca: -2, educacao: -2 },
    body: "A crise política volta a dominar manchetes e redes sociais."
  },
  {
    title: "Boom internacional de commodities",
    priority: "good",
    effect: { gdp: 0.06, cash: 18, popularity: 2, inflation: -0.3 },
    approval: { economia: 4 },
    body: "As exportações aceleram e devolvem confiança ao mercado."
  }
];

const elements = {
  title: document.querySelector(".title-row h1"),
  difficultyPill: document.getElementById("difficultyPill"),
  timeLabel: document.getElementById("timeLabel"),
  playButton: document.getElementById("playButton"),
  pauseButton: document.getElementById("pauseButton"),
  speedButtons: Array.from(document.querySelectorAll(".speed-btn")),
  headlineBadge: document.getElementById("headlineBadge"),
  headlineTitle: document.getElementById("headlineTitle"),
  headlineText: document.getElementById("headlineText"),
  approvalValue: document.getElementById("approvalValue"),
  approvalButton: document.getElementById("approvalButton"),
  approvalEmojis: Array.from(document.querySelectorAll(".emoji-btn")),
  alertTitle: document.getElementById("alertTitle"),
  alertText: document.getElementById("alertText"),
  dockItems: Array.from(document.querySelectorAll(".dock-item")),
  panelEyebrow: document.getElementById("panelEyebrow"),
  panelTitle: document.getElementById("panelTitle"),
  panelChip: document.getElementById("panelChip"),
  panelContent: document.getElementById("panelContent"),
  statCards: Array.from(document.querySelectorAll(".stat-card")),
  statValues: {
    gdp: document.getElementById("gdpValue"),
    inflation: document.getElementById("inflationValue"),
    popularity: document.getElementById("popularityValue"),
    cash: document.getElementById("cashValue"),
    unemployment: document.getElementById("unemploymentValue")
  },
  statBars: {
    gdp: document.getElementById("gdpBar"),
    inflation: document.getElementById("inflationBar"),
    popularity: document.getElementById("popularityBar"),
    cash: document.getElementById("cashBar"),
    unemployment: document.getElementById("unemploymentBar")
  },
  statDetails: {
    gdp: document.getElementById("gdpDetail"),
    inflation: document.getElementById("inflationDetail"),
    popularity: document.getElementById("popularityDetail"),
    cash: document.getElementById("cashDetail"),
    unemployment: document.getElementById("unemploymentDetail")
  },
  endgameOverlay: document.getElementById("endgameOverlay"),
  endgameBadge: document.getElementById("endgameBadge"),
  endgameTitle: document.getElementById("endgameTitle"),
  endgameText: document.getElementById("endgameText"),
  resultGrid: document.getElementById("resultGrid"),
  endgameActions: document.getElementById("endgameActions"),
  restartButton: document.getElementById("restartButton"),
  alertStack: document.getElementById("alertStack")
};

const state = {
  currentCountryId: "brazil",
  currentPanel: "economy",
  gameOver: false,
  termNumber: 1,
  difficultyLevel: 1,
  stats: {},
  previousStats: {},
  approval: {},
  history: { gdp: [], inflation: [], popularity: [] },
  activeDecisions: [],
  pendingEffects: [],
  news: [],
  events: [],
  audioContext: null,
  decisionClockMs: 0,
  lastDecisionHeartbeat: Date.now(),
  nextDecisionTick: 1800,
  nextNewsTick: 1200,
  nextCrisisTick: 1800,
  negativeCashTicks: 0,
  finance: {
    nivelImposto: 28,
    comercioExterior: 54,
    recursosNaturais: 62,
    comercio: 58,
    industria: 60,
    tecnologia: 52,
    gastoSaude: 58,
    gastoEducacao: 57,
    gastoSeguranca: 48,
    gastoInfraestrutura: 51,
    gastoDefesa: 36,
    gastoSocial: 55,
    eficienciaEstado: 46
  },
  lastDecisionFeedbackId: null,
  popupCooldowns: {}
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function country() {
  return COUNTRIES[state.currentCountryId];
}

function startDateForTerm() {
  const base = new Date(START_DATE);
  base.setFullYear(START_DATE.getFullYear() + (state.termNumber - 1) * 4);
  return base;
}

function currentDate() {
  const date = new Date(startDateForTerm());
  const progress = tickAtual / TICKS_PER_YEAR;
  date.setDate(date.getDate() + Math.floor(progress * 365));
  return date;
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR");
}

function shortMoney(value) {
  const abs = Math.abs(value);
  if (abs >= 1) {
    return `${value.toFixed(1)}T`;
  }
  return `${Math.round(value * 1000)}B`;
}

function shortPercent(value) {
  return `${value.toFixed(1)}%`;
}

function getAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audioContext;
}

function playTone(type = "click") {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = type === "alert" ? 190 : type === "good" ? 420 : 280;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (error) {
  }
}

function initSimulation() {
  tickAtual = 0;
  jogoRodando = true;
  velocidadeJogo = 1;
  state.gameOver = false;
  const baseCountry = country();
  state.stats = { ...baseCountry.start };
  state.previousStats = { ...baseCountry.start };
  state.approval = { ...baseCountry.approval };
  state.history = {
    gdp: [state.stats.gdp],
    inflation: [state.stats.inflation],
    popularity: [state.stats.popularity]
  };
  state.activeDecisions = [];
  state.pendingEffects = [];
  state.news = [];
  state.events = [];
  state.audioContext = null;
  state.decisionClockMs = 0;
  state.lastDecisionHeartbeat = Date.now();
  state.nextDecisionTick = 1800;
  state.nextNewsTick = 1200;
  state.nextCrisisTick = 1800;
  state.negativeCashTicks = 0;
  state.finance = {
    nivelImposto: clamp(baseCountry.start.taxRate, 0, 100),
    comercioExterior: 54,
    recursosNaturais: 62,
    comercio: 58,
    industria: 60,
    tecnologia: 52,
    gastoSaude: 58,
    gastoEducacao: 57,
    gastoSeguranca: 48,
    gastoInfraestrutura: 51,
    gastoDefesa: 36,
    gastoSocial: 55,
    eficienciaEstado: 46
  };
  state.lastDecisionFeedbackId = null;
  state.popupCooldowns = {};
  document.body.classList.remove("critical");
  elements.alertStack.innerHTML = "";
  updateHeader();
  setActivePanel("economy");
  pushNews("Monitor", "Novo gabinete assume", "O país aguarda sua primeira sequência de decisões.");
  pushEvent("Início de mandato", "A equipe de governo toma posse sob observação constante.");
  updateHeadline();
  renderAll();
}

function startLoop() {
  if (loopId) {
    clearInterval(loopId);
  }
  loopId = setInterval(runLoop, 50);
  if (decisionTimerId) {
    clearInterval(decisionTimerId);
  }
  decisionTimerId = setInterval(decisionHeartbeat, 750);
}

function runLoop() {
  if (!jogoRodando || state.gameOver) {
    return;
  }

  tickAtual += velocidadeJogo;
  applyContinuousEffects();
  processDecisionTimeouts();

  if (tickAtual % 120 === 0) {
    applyMacroDrift();
    updateApprovalFromState();
  }

  if (tickAtual % 420 === 0) {
    updateHistory();
  }

  if (tickAtual >= state.nextNewsTick) {
    injectIndicatorNews();
    state.nextNewsTick = tickAtual + 1350;
  }

  if (tickAtual >= state.nextCrisisTick) {
    maybeTriggerEvent();
    state.nextCrisisTick = tickAtual + crisisInterval();
  }

  if (tickAtual % 200 === 0) {
    updateHeadline();
    updateAlertState();
    triggerCriticalAlerts();
    checkGameOver();
  }

  renderAll();
}

function decisionHeartbeat() {
  if (state.gameOver) {
    return;
  }
  const now = Date.now();
  const elapsed = now - state.lastDecisionHeartbeat;
  state.lastDecisionHeartbeat = now;
  state.decisionClockMs += elapsed;
  const intervalMs = 9000 + crisisPressure() * 1200;
  if (state.decisionClockMs >= intervalMs) {
    state.decisionClockMs = 0;
    spawnDecision();
    renderAll();
  }
}

function decisionInterval() {
  const pressure = crisisPressure();
  return Math.max(2500, Math.floor(6200 - pressure * 1500 + Math.random() * 800));
}

function crisisInterval() {
  const pressure = crisisPressure();
  return Math.max(1200, Math.floor(2500 - pressure * 700));
}

function crisisPressure() {
  let pressure = 0;
  if (state.stats.inflation > 14) pressure += 1;
  if (state.stats.cash < 40) pressure += 1;
  if (state.stats.popularity < 35) pressure += 1;
  if (state.stats.unemployment > 14) pressure += 1;
  return pressure;
}

function applyContinuousEffects() {
  state.pendingEffects.forEach((effect) => {
    Object.entries(effect.delta).forEach(([key, value]) => {
      state.stats[key] += value;
    });
    effect.remaining -= 1;
  });
  state.pendingEffects = state.pendingEffects.filter((effect) => effect.remaining > 0);

  if (state.stats.inflation > 10) {
    state.stats.popularity -= 0.0022 * (state.stats.inflation - 10);
  }
  if (state.stats.taxRate > 30) {
    state.stats.gdp -= 0.0008 * (state.stats.taxRate - 30);
  }
  if (state.stats.gdp > country().start.gdp) {
    state.stats.popularity += 0.0006;
  }
  if (state.stats.unemployment > 11) {
    state.stats.popularity -= 0.0018 * (state.stats.unemployment - 11);
  }
  if (state.stats.cash < 60) {
    state.stats.inflation += 0.0009 * ((60 - state.stats.cash) / 60);
  }
  normalizeStats();
}

function applyMacroDrift() {
  state.previousStats = { ...state.stats };
  const economy = calculateEconomy();
  state.stats.cash += economy.saldo;
  state.stats.gdp += economy.gdpDelta;
  state.stats.inflation += economy.inflationDelta;
  state.stats.unemployment += economy.unemploymentDelta;
  state.stats.popularity += economy.popularityDelta;
  state.stats.taxRate = state.finance.nivelImposto;

  if (state.stats.cash < 0) {
    state.negativeCashTicks += 120;
  } else {
    state.negativeCashTicks = Math.max(0, state.negativeCashTicks - 240);
  }
  normalizeStats();
}

function calculateEconomy() {
  const f = state.finance;
  const pibBase = Math.max(state.stats.gdp, 0.1);
  const exportacao = ((f.comercioExterior + f.comercio + f.industria + f.tecnologia) / 4) * pibBase * 10;
  const recursosNaturais = f.recursosNaturais * pibBase * 10;
  const receita =
    (f.nivelImposto * pibBase * 0.00001) +
    (exportacao * 0.0005) +
    (recursosNaturais * 0.0003);
  const gastoTotal =
    (f.gastoSaude + f.gastoEducacao + f.gastoSeguranca + f.gastoInfraestrutura +
      f.gastoDefesa + f.gastoSocial + (100 - f.eficienciaEstado)) * 0.22;
  const saldo = receita - gastoTotal;

  let inflationDelta = 0;
  if (saldo < 0) {
    inflationDelta += Math.abs(saldo) * 0.04;
  }
  if (f.nivelImposto > 60) {
    inflationDelta += 0.03;
  }

  let gdpDelta = 0;
  gdpDelta += f.gastoInfraestrutura * 0.00045;
  gdpDelta += f.gastoEducacao * 0.00012;
  gdpDelta += f.tecnologia * 0.00016;
  gdpDelta += f.industria * 0.0001;
  gdpDelta -= Math.max(0, f.nivelImposto - 45) * 0.00022;
  gdpDelta -= Math.max(0, state.stats.inflation - 12) * 0.0014;

  let unemploymentDelta = 0;
  unemploymentDelta -= Math.max(0, gdpDelta) * 12;
  unemploymentDelta += Math.max(0, state.stats.inflation - 15) * 0.02;

  let popularityDelta = 0;
  popularityDelta += f.gastoSocial * 0.006;
  popularityDelta += gdpDelta * 40;
  popularityDelta -= Math.max(0, state.stats.inflation - 10) * 0.04;
  popularityDelta -= Math.max(0, state.stats.unemployment - 12) * 0.05;
  popularityDelta += (f.eficienciaEstado - 50) * 0.004;

  return { receita, gastoTotal, saldo, exportacao, recursosNaturais, gdpDelta, inflationDelta, unemploymentDelta, popularityDelta };
}

function sliderRow(key, label, value) {
  return `
    <label class="slider-row">
      <span>${label}</span>
      <input type="range" min="0" max="100" value="${Math.round(value)}" data-finance="${key}">
      <strong>${Math.round(value)}</strong>
    </label>
  `;
}

function bindEconomyControls() {
  elements.panelContent.querySelectorAll("input[data-finance]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.finance;
      const nextValue = Number(input.value);
      if (key.startsWith("gasto") && key !== "eficienciaEstado") {
        const totalOtherSpending = Object.entries(state.finance)
          .filter(([entryKey]) => entryKey.startsWith("gasto") && entryKey !== "eficienciaEstado" && entryKey !== key)
          .reduce((sum, [, value]) => sum + value, 0);
        const budgetCap = Math.max(40, 400 - Math.floor(state.stats.cash * 0.45));
        if (totalOtherSpending + nextValue > budgetCap) {
          input.value = state.finance[key];
          showAlertPopup("deficit", "Déficit", "O orçamento disponível não comporta esse aumento agora.");
          return;
        }
      }
      state.finance[key] = nextValue;
      if (key === "nivelImposto") {
        state.stats.taxRate = nextValue;
      }
      playTone("click");
      renderEconomyPanel();
      renderStatsStrip();
    });
  });
}

function keyForLabel(label) {
  const map = {
    "Impostos": "nivelImposto",
    "Comércio exterior": "comercioExterior",
    "Recursos naturais": "recursosNaturais",
    "Comércio": "comercio",
    "Indústria": "industria",
    "Tecnologia": "tecnologia",
    "Saúde": "gastoSaude",
    "Educação": "gastoEducacao",
    "Segurança": "gastoSeguranca",
    "Infraestrutura": "gastoInfraestrutura",
    "Defesa": "gastoDefesa",
    "Programas sociais": "gastoSocial",
    "Eficiência do estado": "eficienciaEstado"
  };
  return map[label];
}

function decisionSeverity(effect) {
  const score =
    Math.abs(effect.immediate.inflation || 0) * 1.4 +
    Math.abs(effect.immediate.popularity || 0) * 0.8 +
    Math.abs(effect.immediate.cash || 0) * 0.06;
  if (score > 5) return "critical";
  if (score > 2.5) return "moderate";
  return averageApproval() > 60 ? "light-blue" : "light-green";
}

function animateDecisionFeedback(decisionId, severity) {
  const card = elements.panelContent.querySelector(`[data-card-id="${decisionId}"]`) || elements.panelContent.querySelector(`.decision-card`);
  if (!card) {
    return;
  }
  card.classList.remove("feedback-light", "feedback-moderate", "feedback-critical");
  if (severity === "critical") card.classList.add("feedback-critical");
  else if (severity === "moderate") card.classList.add("feedback-moderate");
  else card.classList.add("feedback-light");
}

function showAlertPopup(type, title, text) {
  const now = Date.now();
  if (state.popupCooldowns[type] && now - state.popupCooldowns[type] < 5000) {
    return;
  }
  state.popupCooldowns[type] = now;
  const node = document.createElement("div");
  node.className = `alert-popup ${type}`;
  node.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
  elements.alertStack.appendChild(node);
  playSiren();
  setTimeout(() => node.remove(), 3600);
}

function playSiren() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.18);
    osc.frequency.linearRampToValueAtTime(520, now + 0.36);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch (error) {
  }
}

function normalizeStats() {
  state.stats.gdp = clamp(state.stats.gdp, 0.15, 8);
  state.stats.inflation = clamp(state.stats.inflation, 0, 45);
  state.stats.popularity = clamp(state.stats.popularity, 0, 100);
  state.stats.cash = clamp(state.stats.cash, -250, 600);
  state.stats.unemployment = clamp(state.stats.unemployment, 2, 35);
  state.stats.taxRate = clamp(state.stats.taxRate, 12, 44);
  Object.keys(state.approval).forEach((key) => {
    state.approval[key] = clamp(state.approval[key], 0, 100);
  });
}

function spawnDecision() {
  if (state.activeDecisions.length >= 3) {
    return;
  }
  const template = JSON.parse(JSON.stringify(DECISION_LIBRARY[Math.floor(Math.random() * DECISION_LIBRARY.length)]));
  template.deadline = tickAtual + template.duration;
  state.activeDecisions.unshift(template);
  state.activeDecisions = state.activeDecisions.slice(0, 3);
  pushNews("Decisão", template.title, "O gabinete exige uma resposta antes do prazo acabar.");
}

function processDecisionTimeouts() {
  const expired = state.activeDecisions.filter((decision) => tickAtual >= decision.deadline);
  if (!expired.length) {
    return;
  }
  expired.forEach((decision) => {
    applyDecisionEffect(decision.timeoutPenalty, `${decision.title} expirou`);
    playTone("alert");
  });
  state.activeDecisions = state.activeDecisions.filter((decision) => tickAtual < decision.deadline);
}

function applyDecisionEffect(effect, title) {
  state.previousStats = { ...state.stats };
  Object.entries(effect.immediate).forEach(([key, value]) => {
    state.stats[key] += value;
  });
  if (effect.overTime) {
    state.pendingEffects.push({ delta: effect.overTime, remaining: 3600 });
  }
  if (effect.approval) {
    Object.entries(effect.approval).forEach(([key, value]) => {
      state.approval[key] += value;
    });
  }
  normalizeStats();
  pushEvent(title, effect.impact, effect.mood);
  pushNews("Governo", title, effect.impact);
  updateHeadline(title, effect.impact);
}

function answerDecision(id, option) {
  if (state.gameOver) {
    return;
  }
  const decision = state.activeDecisions.find((item) => item.id === id);
  if (!decision) {
    return;
  }
  const severity = decisionSeverity(decision.options[option]);
  animateDecisionFeedback(decision.id, severity);
  playTone(option === "approve" ? "good" : "click");
  setTimeout(() => {
    applyDecisionEffect(decision.options[option], `${decision.title} — ${decision.options[option].label}`);
    state.activeDecisions = state.activeDecisions.filter((item) => item !== decision);
    updateAlertState();
    renderAll();
  }, severity === "critical" ? 420 : severity === "moderate" ? 320 : 240);
}

function maybeTriggerEvent() {
  const event = EVENT_LIBRARY[Math.floor(Math.random() * EVENT_LIBRARY.length)];
  const pressureBoost = crisisPressure() * 0.08;
  if (Math.random() > 0.16 + pressureBoost) {
    return;
  }
  state.previousStats = { ...state.stats };
  Object.entries(event.effect).forEach(([key, value]) => {
    state.stats[key] += value;
  });
  Object.entries(event.approval || {}).forEach(([key, value]) => {
    state.approval[key] += value;
  });
  normalizeStats();
  pushNews(event.priority === "high" ? "Alerta" : "Evento", event.title, event.body, event.priority);
  pushEvent(event.title, event.body, event.priority === "high" ? "bad" : "good");
  if (event.priority === "high") {
    playTone("alert");
  }
}

function injectIndicatorNews() {
  if (state.stats.inflation > 18) {
    pushNews("Urgente", "Inflação dispara", "Os preços voltam a pressionar o humor nacional.", "priority");
  } else if (state.stats.popularity < 30) {
    pushNews("Política", "Protestos crescem nas capitais", "A oposição amplia o discurso de desgaste do governo.", "priority");
  } else if (state.stats.gdp > country().start.gdp + 0.25) {
    pushNews("Economia", "Economia acelera acima do esperado", "O mercado começa a revisar projeções para cima.", "good");
  } else if (state.stats.cash < 0) {
    pushNews("Fiscal", "Caixa entra no vermelho", "O Tesouro perde margem e qualquer erro fica mais caro.", "priority");
  } else {
    pushNews("Monitor", "Mercado observa próximo movimento", "Ainda há espaço para corrigir rota antes da crise.");
  }
}

function pushNews(type, title, body, priority = "neutral") {
  state.news.unshift({ type, title, body, priority, tick: tickAtual });
  state.news = state.news.slice(0, 10);
}

function pushEvent(title, body, mood = "neutral") {
  state.events.unshift({ title, body, mood, tick: tickAtual });
  state.events = state.events.slice(0, 10);
}

function updateHistory() {
  state.history.gdp.push(state.stats.gdp);
  state.history.inflation.push(state.stats.inflation);
  state.history.popularity.push(state.stats.popularity);
  if (state.history.gdp.length > 32) {
    state.history.gdp.shift();
    state.history.inflation.shift();
    state.history.popularity.shift();
  }
}

function averageApproval() {
  const values = Object.values(state.approval);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function updateApprovalFromState() {
  const f = state.finance;
  state.approval.economia += (state.stats.gdp > country().start.gdp ? 0.16 : -0.14);
  state.approval.economia -= Math.max(0, state.stats.inflation - 10) * 0.03;
  state.approval.saude += f.gastoSaude > 55 ? 0.05 : -0.05;
  state.approval.seguranca += f.gastoSeguranca > 50 ? 0.05 : -0.06;
  state.approval.educacao += f.gastoEducacao > 52 ? 0.05 : -0.05;
  state.approval.economia -= Math.max(0, 45 - f.eficienciaEstado) * 0.01;
  if (f.gastoEducacao < 35) {
    state.stats.gdp -= 0.0025;
  }
  if (state.stats.inflation > 18) {
    state.stats.popularity -= 0.18;
  }
  if (state.stats.unemployment > 15) {
    state.stats.popularity -= 0.22;
  }
  state.stats.popularity = averageApproval();
  normalizeStats();
}

function statVisual(stat) {
  if (stat === "gdp") {
    return state.stats.gdp > country().start.gdp + 0.2 ? ["Crescendo", "--good"] : state.stats.gdp > country().start.gdp - 0.1 ? ["Estável", "--warn"] : ["Em queda", "--bad"];
  }
  if (stat === "inflation") {
    return state.stats.inflation < 8 ? ["Controlada", "--good"] : state.stats.inflation < 16 ? ["Em pressão", "--warn"] : ["Crítica", "--bad"];
  }
  if (stat === "popularity") {
    return state.stats.popularity > 60 ? ["Apoio firme", "--good"] : state.stats.popularity > 40 ? ["Oscilando", "--warn"] : ["Desgaste forte", "--bad"];
  }
  if (stat === "cash") {
    return state.stats.cash > 120 ? ["Folga fiscal", "--good"] : state.stats.cash > 0 ? ["Apertado", "--warn"] : ["No vermelho", "--bad"];
  }
  return state.stats.unemployment < 9 ? ["Respirando", "--good"] : state.stats.unemployment < 14 ? ["Pressão moderada", "--warn"] : ["Crítico", "--bad"];
}

function statRatio(stat) {
  const ranges = {
    gdp: [0.2, 5],
    inflation: [0, 35],
    popularity: [0, 100],
    cash: [-200, 600],
    unemployment: [2, 35]
  };
  const [min, max] = ranges[stat];
  return clamp(((state.stats[stat] - min) / (max - min)) * 100, 0, 100);
}

function updateHeader() {
  elements.title.textContent = `${country().title} ${country().flag}`;
  elements.difficultyPill.textContent = country().difficultyName;
}

function updateHeadline(title, body) {
  const latest = state.news[0];
  elements.headlineBadge.textContent = latest ? latest.type : "Radar Nacional";
  elements.headlineTitle.textContent = title || (latest ? latest.title : "O gabinete acompanha sinais mistos da economia");
  elements.headlineText.textContent = body || (latest ? latest.body : "O país ainda oferece espaço para corrigir a rota.");
}

function updateAlertState() {
  let title = "Sem alertas críticos";
  let text = "O governo segue com margem de manobra.";
  const critical = state.stats.inflation > 18 || state.stats.cash < 0 || state.stats.popularity < 28;
  document.body.classList.toggle("critical", critical);
  if (state.stats.inflation > 18) {
    title = "⚠️ Inflação em risco";
    text = "A sensação de perda de controle já aparece nas ruas.";
  } else if (state.stats.cash < 0) {
    title = "⚠️ Caixa em colapso";
    text = "O Tesouro opera no vermelho e aumenta a instabilidade.";
  } else if (state.stats.popularity < 28) {
    title = "⚠️ Aprovação desabando";
    text = "A base política entrou em zona de risco.";
  }
  elements.alertTitle.textContent = title;
  elements.alertText.textContent = text;
}

function triggerCriticalAlerts() {
  if (state.stats.cash < 0) {
    showAlertPopup("deficit", "Déficit", "O caixa entrou no vermelho e a inflação tende a piorar.");
  }
  if (state.stats.inflation > 18) {
    showAlertPopup("inflation", "Inflação alta", "Os preços estão corroendo a aprovação continuamente.");
  }
  if (state.stats.inflation > 24 || state.stats.gdp < country().start.gdp - 0.15) {
    showAlertPopup("crisis", "Crise econômica", "A atividade perdeu força e o governo está sob forte pressão.");
  }
  if (state.stats.popularity < 30) {
    showAlertPopup("rebellion", "Rebelião", "A insatisfação nacional entrou em zona crítica.");
  }
  if (state.stats.unemployment > 16) {
    showAlertPopup("strike", "Greve", "O desemprego elevou a tensão e movimentos paredistas ganham força.");
  }
}

function renderStatsStrip() {
  elements.timeLabel.textContent = `Ano ${Math.floor(tickAtual / TICKS_PER_YEAR) + 1} — ${formatDate(currentDate())}`;
  elements.approvalValue.textContent = `${Math.round(state.stats.popularity)}%`;

  const values = {
    gdp: shortMoney(state.stats.gdp),
    inflation: shortPercent(state.stats.inflation),
    popularity: shortPercent(state.stats.popularity),
    cash: shortMoney(state.stats.cash / 1000),
    unemployment: shortPercent(state.stats.unemployment)
  };

  Object.entries(values).forEach(([key, value]) => {
    elements.statValues[key].textContent = value;
    elements.statBars[key].style.width = `${statRatio(key)}%`;
    const [detail, variable] = statVisual(key);
    elements.statDetails[key].textContent = detail;
    elements.statBars[key].style.background = `linear-gradient(90deg, var(${variable}), var(${variable}))`;
    const card = elements.statCards.find((item) => item.dataset.stat === key);
    card.classList.toggle("alert", variable === "--bad");
  });
}

function drawApprovalEmoji() {
  const value = state.stats.popularity;
  const mood = value < 20 ? "rage" : value < 40 ? "bad" : value < 55 ? "neutral" : value < 75 ? "good" : "great";
  elements.approvalEmojis.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === mood);
  });
}

function lineChart(values, color) {
  const points = values.map((value, index) => `<span class="spark-point" style="left:${(index / Math.max(values.length - 1, 1)) * 100}%;bottom:${value}%;background:${color}"></span>`).join("");
  return `<div class="sparkline">${points}</div>`;
}

function renderPanel() {
  const panelMap = {
    economy: renderEconomyPanel,
    indicators: renderIndicatorsPanel,
    news: renderNewsPanel,
    decisions: renderDecisionsPanel,
    advisor: renderAdvisorPanel,
    world: renderWorldPanel,
    stats: renderStatsPanel,
    settings: renderSettingsPanel
  };
  panelMap[state.currentPanel]();
}

function setPanelHeader(eyebrow, title, chip) {
  elements.panelEyebrow.textContent = eyebrow;
  elements.panelTitle.textContent = title;
  elements.panelChip.textContent = chip;
}

function renderEconomyPanel() {
  const economy = calculateEconomy();
  setPanelHeader("Economia", "Painel Econômico", `${economy.saldo >= 0 ? "Superávit" : "Déficit"} ${economy.saldo.toFixed(2)}`);
  const receitaControls = [
    ["nivelImposto", "Impostos"],
    ["comercioExterior", "Comércio exterior"],
    ["recursosNaturais", "Recursos naturais"],
    ["comercio", "Comércio"],
    ["industria", "Indústria"],
    ["tecnologia", "Tecnologia"]
  ].map(([key, label]) => sliderRow(key, label, state.finance[key])).join("");
  const despesaControls = [
    ["gastoSaude", "Saúde"],
    ["gastoEducacao", "Educação"],
    ["gastoSeguranca", "Segurança"],
    ["gastoInfraestrutura", "Infraestrutura"],
    ["gastoDefesa", "Defesa"],
    ["gastoSocial", "Programas sociais"],
    ["eficienciaEstado", "Eficiência do estado"]
  ].map(([key, label]) => sliderRow(key, label, state.finance[key])).join("");

  elements.panelContent.innerHTML = `
    <div class="economy-layout">
      <div class="budget-section">
        <article class="budget-group">
          <h4>Receitas</h4>
          <div class="slider-grid">${receitaControls}</div>
        </article>
        <article class="budget-group">
          <h4>Despesas</h4>
          <div class="slider-grid">${despesaControls}</div>
        </article>
      </div>
      <div class="budget-section">
        <article class="metric-card">
          <span class="mini-label">Receita por ciclo</span>
          <strong>${economy.receita.toFixed(2)}</strong>
          <span class="detail-line">Impostos + exportação + recursos naturais</span>
        </article>
        <article class="metric-card">
          <span class="mini-label">Gasto total</span>
          <strong>${economy.gastoTotal.toFixed(2)}</strong>
          <span class="detail-line">Saúde, educação, segurança, defesa e Estado</span>
        </article>
        <article class="metric-card">
          <span class="mini-label">Saldo</span>
          <strong>${economy.saldo.toFixed(2)}</strong>
          <span class="detail-line">${economy.saldo < 0 ? "Saldo negativo aumenta inflação e corrói apoio." : "O caixa ainda sustenta o governo."}</span>
        </article>
      </div>
    </div>
  `;
  bindEconomyControls();
}

function renderIndicatorsPanel() {
  setPanelHeader("Indicadores", "Aprovação Nacional", `${Math.round(state.stats.popularity)}%`);
  const bars = Object.entries(state.approval).map(([label, value]) => `
    <div class="mini-bar-row">
      <span class="bar-label">${label[0].toUpperCase() + label.slice(1)}</span>
      <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${value}%;background:linear-gradient(90deg, ${value > 60 ? "var(--good)" : value > 40 ? "var(--warn)" : "var(--bad)"}, ${value > 60 ? "var(--good)" : value > 40 ? "var(--warn)" : "var(--bad)"})"></div></div>
      <strong>${Math.round(value)}%</strong>
    </div>
  `).join("");
  elements.panelContent.innerHTML = `<div class="approval-card-panel"><div class="mini-bars">${bars}</div></div>`;
}

function renderNewsPanel() {
  setPanelHeader("Notícias", "Feed Nacional", state.news[0] ? state.news[0].type : "Monitor");
  const cards = state.news.map((item) => `
    <article class="feed-card ${item.priority === "priority" ? "priority" : item.priority === "good" ? "good" : "neutral"}">
      <span class="mini-label">${item.type} • ${formatDate(currentDate())}</span>
      <strong>${item.title}</strong>
      <p>${item.body}</p>
    </article>
  `).join("");
  elements.panelContent.innerHTML = `<div class="feed-grid">${cards}</div>`;
}

function renderDecisionsPanel() {
  setPanelHeader("Decisões", "Gabinete", `${state.activeDecisions.length} abertas`);
  const receitaCatalog = [
    "Impostos",
    "Comércio exterior",
    "Recursos naturais",
    "Comércio",
    "Indústria",
    "Tecnologia"
  ].map((label) => `<div class="catalog-item"><span>${label}</span><strong>${Math.round(state.finance[keyForLabel(label)] || 0)}</strong></div>`).join("");
  const despesaCatalog = [
    "Saúde",
    "Educação",
    "Segurança",
    "Infraestrutura",
    "Defesa",
    "Programas sociais",
    "Eficiência do estado"
  ].map((label) => `<div class="catalog-item"><span>${label}</span><strong>${Math.round(state.finance[keyForLabel(label)] || 0)}</strong></div>`).join("");

  const cards = state.activeDecisions.map((decision) => {
    const remaining = Math.max(0, decision.deadline - tickAtual);
    return `
      <article class="decision-card ${remaining < 1400 ? "expiring" : ""}" data-card-id="${decision.id}">
        <div class="decision-top">
          <strong>${decision.title}</strong>
          <span class="panel-chip">${remaining} ticks</span>
        </div>
        <p>${decision.body}</p>
        <div class="decision-actions">
          <button class="decision-btn primary" data-id="${decision.id}" data-option="approve">${decision.options.approve.label}</button>
          <button class="decision-btn secondary" data-id="${decision.id}" data-option="reject">${decision.options.reject.label}</button>
        </div>
      </article>
    `;
  }).join("");
  elements.panelContent.innerHTML = `
    <div class="decision-columns">
      <article class="catalog-card">
        <h4>Receitas</h4>
        <div class="catalog-list">${receitaCatalog}</div>
      </article>
      <article class="catalog-card">
        <h4>Despesas</h4>
        <div class="catalog-list">${despesaCatalog}</div>
      </article>
    </div>
    <div class="decision-grid">${cards || `<article class="feed-card neutral"><strong>Sem decisões urgentes</strong><p>O gabinete está momentaneamente estável, mas novas demandas surgirão.</p></article>`}</div>
  `;
  elements.panelContent.querySelectorAll(".decision-btn").forEach((button) => {
    button.addEventListener("click", () => answerDecision(button.dataset.id, button.dataset.option));
  });
}

function renderAdvisorPanel() {
  setPanelHeader("Conselheiro", "Centro Estratégico", "IA interna");
  const advice = crisisPressure() > 2
    ? "As crises estão acumulando camadas. Responda primeiro o que atinge inflação e caixa."
    : state.activeDecisions.length > 1
      ? "Há mais de uma frente aberta. Priorize a que está mais perto do prazo."
      : "Sua janela de controle ainda existe. Use decisões para ajustar setores específicos.";
  elements.panelContent.innerHTML = `
    <article class="advisor-card">
      <span class="mini-label">Helena Duarte</span>
      <strong>Leitura do gabinete</strong>
      <p>${advice}</p>
    </article>
  `;
}

function renderWorldPanel() {
  setPanelHeader("Relações", "Relações Internacionais", country().name);
  const cards = country().relations.map((item) => `
    <article class="country-card">
      <div class="country-row">
        <strong>${item.flag} ${item.name}</strong>
        <span class="country-meta">${item.status}</span>
      </div>
    </article>
  `).join("");
  elements.panelContent.innerHTML = `<div class="world-grid">${cards}</div>`;
}

function renderStatsPanel() {
  setPanelHeader("Estatísticas", "Histórico do Mandato", "Tempo real");
  const gdpPoints = state.history.gdp.map((value) => clamp((value / 4) * 100, 4, 96));
  const inflationPoints = state.history.inflation.map((value) => clamp((value / 35) * 100, 4, 96));
  const popPoints = state.history.popularity.map((value) => clamp(value, 4, 96));
  elements.panelContent.innerHTML = `
    <div class="stats-grid">
      <article class="metric-card">
        <span class="mini-label">PIB</span>
        ${lineChart(gdpPoints, "var(--good)")}
      </article>
      <article class="metric-card">
        <span class="mini-label">Inflação</span>
        ${lineChart(inflationPoints, "var(--warn)")}
      </article>
      <article class="metric-card">
        <span class="mini-label">Popularidade</span>
        ${lineChart(popPoints, "var(--accent)")}
      </article>
    </div>
  `;
}

function renderSettingsPanel() {
  setPanelHeader("Ajustes", "Configurações", jogoRodando ? `${velocidadeJogo}x` : "Pausado");
  elements.panelContent.innerHTML = `
    <div class="settings-grid">
      <article class="settings-card">
        <span class="mini-label">Velocidade</span>
        <strong>${velocidadeJogo}x</strong>
        <span class="settings-line">Use os ícones do topo para acelerar ou pausar.</span>
      </article>
      <article class="settings-card">
        <span class="mini-label">País</span>
        <strong>${country().flag} ${country().name}</strong>
        <span class="settings-line">O cenário atual muda a tensão econômica e política.</span>
      </article>
    </div>
  `;
}

function renderEndgame(reason, allowReelection = false) {
  state.gameOver = true;
  jogoRodando = false;
  elements.endgameOverlay.classList.remove("hidden");
  elements.endgameBadge.textContent = reason.badge;
  elements.endgameTitle.textContent = reason.title;
  elements.endgameText.textContent = reason.text;
  elements.resultGrid.innerHTML = `
    <article class="result-item"><span>Popularidade</span><strong>${Math.round(state.stats.popularity)}%</strong></article>
    <article class="result-item"><span>PIB</span><strong>${shortMoney(state.stats.gdp)}</strong></article>
    <article class="result-item"><span>Inflação</span><strong>${shortPercent(state.stats.inflation)}</strong></article>
  `;
  elements.endgameActions.innerHTML = "";

  if (allowReelection) {
    const reelect = document.createElement("button");
    reelect.className = "primary-btn";
    reelect.textContent = "Reeleição";
    reelect.addEventListener("click", handleReelection);

    const endGov = document.createElement("button");
    endGov.className = "secondary-btn";
    endGov.textContent = "Encerrar governo";
    endGov.addEventListener("click", renderCountrySelection);
    elements.endgameActions.append(reelect, endGov);
    return;
  }

  const restart = document.createElement("button");
  restart.className = "primary-btn";
  restart.textContent = "Reiniciar";
  restart.addEventListener("click", () => {
    elements.endgameOverlay.classList.add("hidden");
    initSimulation();
  });
  elements.endgameActions.appendChild(restart);
}

function handleReelection() {
  playTone("good");
  state.termNumber += 1;
  state.difficultyLevel += 1;
  document.body.classList.add("reelection-mode");
  const base = country();
  base.start.inflation = clamp(base.start.inflation + 1.4, 0, 32);
  base.start.unemployment = clamp(base.start.unemployment + 1.5, 2, 30);
  base.start.cash = clamp(base.start.cash - 24, -150, 500);
  base.difficultyName = "Mandato sob Fogo";
  elements.endgameOverlay.classList.add("hidden");
  initSimulation();
}

function renderCountrySelection() {
  const countries = ["argentina", "venezuela", "southafrica"].map((id) => {
    const item = COUNTRIES[id];
    return `
      <article class="country-card">
        <div class="country-row">
          <strong>${item.flag} ${item.name}</strong>
          <span class="country-chip">${item.difficultyName}</span>
        </div>
        <p>Inflação alta, caixa frágil e pressão social elevada.</p>
        <button class="country-btn" data-country="${id}">Governar</button>
      </article>
    `;
  }).join("");
  elements.endgameTitle.textContent = "Escolha o próximo país";
  elements.endgameText.textContent = "Outros governos em crise também procuram uma liderança capaz de sobreviver ao caos.";
  elements.endgameActions.innerHTML = "";
  elements.resultGrid.innerHTML = `<div class="country-list">${countries}</div>`;
  elements.resultGrid.querySelectorAll(".country-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentCountryId = button.dataset.country;
      state.termNumber = 1;
      state.difficultyLevel = 1;
      document.body.classList.remove("reelection-mode");
      elements.endgameOverlay.classList.add("hidden");
      initSimulation();
    });
  });
}

function checkGameOver() {
  if (state.stats.popularity < 20) {
    renderEndgame({
      badge: "Impeachment",
      title: "O Congresso derrubou o governo",
      text: "A aprovação desmoronou e a base política abandonou seu mandato."
    });
    return;
  }
  if (state.stats.inflation > 30) {
    renderEndgame({
      badge: "Colapso econômico",
      title: "A inflação fugiu ao controle",
      text: "O país entrou em pânico de preços e sua gestão perdeu credibilidade."
    });
    return;
  }
  if (state.negativeCashTicks >= 9600) {
    renderEndgame({
      badge: "Falência fiscal",
      title: "O Tesouro entrou em colapso",
      text: "O caixa negativo por tempo demais travou sua capacidade de governar."
    });
    return;
  }
  if (tickAtual >= TICKS_PER_YEAR * 4) {
    renderEndgame({
      badge: "Fim de mandato",
      title: "O mandato chegou ao fim",
      text: "A população avalia se você merece continuar no poder."
    }, state.stats.popularity > 65);
  }
}

function setActivePanel(panel) {
  state.currentPanel = panel;
  elements.dockItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.panel === panel);
  });
  renderPanel();
}

function renderAll() {
  updateHeader();
  renderStatsStrip();
  drawApprovalEmoji();
  renderPanel();
}

elements.playButton.addEventListener("click", () => {
  jogoRodando = true;
  playTone("click");
});

elements.pauseButton.addEventListener("click", () => {
  jogoRodando = false;
  playTone("click");
});

elements.speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    velocidadeJogo = Number(button.dataset.speed);
    elements.speedButtons.forEach((item) => item.classList.toggle("active", item === button));
    playTone("click");
  });
});

elements.dockItems.forEach((item) => {
  item.addEventListener("click", () => setActivePanel(item.dataset.panel));
});

elements.approvalButton.addEventListener("click", () => setActivePanel("indicators"));
elements.approvalEmojis.forEach((button) => {
  button.addEventListener("click", () => {
    setActivePanel("indicators");
    elements.approvalEmojis.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    playTone("click");
  });
});

elements.restartButton.addEventListener("click", () => {
  elements.endgameOverlay.classList.add("hidden");
  state.currentCountryId = "brazil";
  state.termNumber = 1;
  state.difficultyLevel = 1;
  document.body.classList.remove("reelection-mode");
  initSimulation();
});

initSimulation();
startLoop();
