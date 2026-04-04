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
    brandType: "image",
    brandImage: "./brf.jpg",
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
    brandType: "flag",
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
    brandType: "flag",
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
    brandType: "flag",
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
  },
  {
    id: "fiscal-adjustment",
    title: "Anunciar um ajuste fiscal emergencial?",
    body: "A equipe econÃ´mica quer cortar despesas e rever contratos para segurar o caixa antes que a crise escale.",
    duration: 5600,
    tags: ["Fiscal", "Economia"],
    options: {
      approve: {
        label: "Ajustar",
        immediate: { cash: 24, popularity: -4, inflation: -0.5, gdp: -0.02 },
        overTime: { cash: 0.008, inflation: -0.00008, popularity: -0.00002 },
        approval: { economia: 3, saude: -1, educacao: -1 },
        mood: "neutral",
        impact: "O caixa ganha fÃ´lego, mas o custo polÃ­tico do aperto aparece rapidamente."
      },
      reject: {
        label: "Adiar",
        immediate: { popularity: 2, cash: -14, inflation: 0.6 },
        overTime: { cash: -0.008, inflation: 0.00008 },
        approval: { economia: -4 },
        mood: "bad",
        impact: "O alÃ­vio polÃ­tico Ã© curto, enquanto o risco fiscal aumenta."
      }
    },
    timeoutPenalty: {
      immediate: { cash: -10, inflation: 0.4, popularity: -2 },
      overTime: { inflation: 0.00005 },
      approval: { economia: -3 },
      mood: "bad",
      impact: "A demora em reagir ampliou a desconfianÃ§a sobre a capacidade de ajuste do governo."
    }
  },
  {
    id: "jobs-plan",
    title: "Lancar um programa nacional de empregos?",
    body: "Empresarios e governadores defendem um pacote de obras e credito para destravar contratacoes.",
    duration: 6100,
    tags: ["Emprego", "Economia"],
    options: {
      approve: {
        label: "Lancar",
        immediate: { gdp: 0.06, unemployment: -0.6, cash: -20, popularity: 3, inflation: 0.2 },
        overTime: { gdp: 0.00008, unemployment: -0.00008, cash: -0.005 },
        approval: { economia: 3, educacao: 1 },
        mood: "good",
        impact: "O mercado de trabalho reage, mas o Tesouro sente o custo do impulso."
      },
      reject: {
        label: "Esperar",
        immediate: { cash: 10, unemployment: 0.3, popularity: -3 },
        overTime: { unemployment: 0.00005, popularity: -0.00004 },
        approval: { economia: -3 },
        mood: "bad",
        impact: "A prudencia fiscal preserva caixa, mas a pressÃ£o por vagas aumenta."
      }
    },
    timeoutPenalty: {
      immediate: { unemployment: 0.4, popularity: -2 },
      overTime: { unemployment: 0.00004 },
      approval: { economia: -2 },
      mood: "bad",
      impact: "Sem resposta, a agenda de emprego perdeu forÃ§a e a cobranÃ§a cresceu."
    }
  },
  {
    id: "education-boost",
    title: "Acelerar um plano de modernizacao da educacao?",
    body: "Tecnicos defendem ampliar conectividade, formaÃ§Ã£o e escolas integrais para elevar produtividade futura.",
    duration: 6400,
    tags: ["Educacao", "Social"],
    options: {
      approve: {
        label: "Investir",
        immediate: { cash: -16, popularity: 2, gdp: 0.01 },
        overTime: { gdp: 0.0001, popularity: 0.00003 },
        approval: { educacao: 7, economia: 1 },
        mood: "good",
        impact: "A medida custa agora, mas melhora a perspectiva de crescimento e capital humano."
      },
      reject: {
        label: "Postergar",
        immediate: { cash: 9, popularity: -2 },
        overTime: { gdp: -0.00005, popularity: -0.00002 },
        approval: { educacao: -6 },
        mood: "bad",
        impact: "O caixa respira, mas a mensagem de curto prazo pesa contra o futuro do pais."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -1, gdp: -0.01 },
      overTime: { gdp: -0.00004 },
      approval: { educacao: -3 },
      mood: "bad",
      impact: "A falta de decisÃ£o travou uma agenda vista como central para o futuro."
    }
  },
  {
    id: "cabinet-crisis",
    title: "Fazer uma reforma ministerial para conter a crise politica?",
    body: "Aliados cobram troca de ministros e reorganizacao da base para reduzir desgaste e estancar vazamentos.",
    duration: 5200,
    tags: ["Politica", "Popularidade"],
    options: {
      approve: {
        label: "Reformar",
        immediate: { popularity: 2, cash: -6, gdp: 0.01 },
        overTime: { popularity: 0.00005, cash: -0.001 },
        approval: { seguranca: 1, economia: 1 },
        mood: "neutral",
        impact: "A troca de comando passa sensaÃ§Ã£o de reaÃ§Ã£o, mas abre novas disputas internas."
      },
      reject: {
        label: "Manter",
        immediate: { popularity: -4, cash: -4, gdp: -0.02 },
        overTime: { popularity: -0.00006 },
        approval: { economia: -1, seguranca: -2 },
        mood: "bad",
        impact: "A permanencia do time amplia a leitura de desgaste e paralisia."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -3, cash: -3 },
      overTime: { popularity: -0.00005 },
      approval: { economia: -1, seguranca: -2 },
      mood: "bad",
      impact: "A indefiniÃ§Ã£o alimentou rumores, vazamentos e a crise politica."
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
  countryTitle: document.getElementById("countryTitle"),
  brandEmblem: document.getElementById("brandEmblem"),
  brandImage: document.getElementById("brandImage"),
  brandFallback: document.getElementById("brandFallback"),
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
  confirmOverlay: document.getElementById("confirmOverlay"),
  confirmBadge: document.getElementById("confirmBadge"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmText: document.getElementById("confirmText"),
  confirmActions: document.getElementById("confirmActions"),
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
  queuedDecisions: [],
  pendingEffects: [],
  news: [],
  advisorNotes: [],
  events: [],
  audioContext: null,
  decisionClockMs: 0,
  lastDecisionHeartbeat: Date.now(),
  nextDecisionTick: 1800,
  nextNewsTick: 1200,
  nextAdvisorTick: 150,
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
  popupCooldowns: {},
  settings: {
    gameMode: "casual",
    soundOn: true,
    theme: "light"
  }
};

const GAME_MODES = {
  iniciante: { intervalBonus: 2200, inflationFactor: 0.8, popularityFactor: 1.15 },
  casual: { intervalBonus: 0, inflationFactor: 1, popularityFactor: 1 },
  veterano: { intervalBonus: -1800, inflationFactor: 1.18, popularityFactor: 0.88 }
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
  if (!state.settings.soundOn) {
    return;
  }
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
  jogoRodando = false;
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
  state.queuedDecisions = [];
  state.pendingEffects = [];
  state.news = [];
  state.advisorNotes = [];
  state.events = [];
  state.audioContext = null;
  state.decisionClockMs = 0;
  state.lastDecisionHeartbeat = Date.now();
  state.nextDecisionTick = 1800;
  state.nextNewsTick = 100;
  state.nextAdvisorTick = 150;
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
  document.body.classList.toggle("dark-theme", state.settings.theme === "dark");
  elements.alertStack.innerHTML = "";
  updateHeader();
  setActivePanel("economy");
  pushNews("Monitor", "Novo gabinete assume", "O país aguarda sua primeira sequência de decisões.");
  pushEvent("Início de mandato", "A equipe de governo toma posse sob observação constante.");
  pushAdvisorNote("Briefing inicial", "O governo comeca pausado. Assim que entrar em Play, acompanhe inflacao, caixa e a primeira leva de decisoes.", "stable");
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
    state.nextNewsTick = tickAtual + 100;
    if (state.currentPanel === "news") {
      renderNewsPanel();
    }
  }

  if (tickAtual >= state.nextAdvisorTick) {
    issueAdvisorBriefing();
    state.nextAdvisorTick = tickAtual + 150;
    if (state.currentPanel === "advisor") {
      renderAdvisorPanel();
    }
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
    refreshPassivePanel();
  }

  updateDecisionLivePanel();
  renderLiveUI();
}

function decisionHeartbeat() {
  if (state.gameOver) {
    return;
  }
  const mode = GAME_MODES[state.settings.gameMode];
  const now = Date.now();
  const elapsed = now - state.lastDecisionHeartbeat;
  state.lastDecisionHeartbeat = now;
  state.decisionClockMs += elapsed;
  const intervalMs = Math.max(5000, 15000 + crisisPressure() * 1800 + mode.intervalBonus);
  if (state.decisionClockMs >= intervalMs) {
    state.decisionClockMs = 0;
    spawnDecision();
    if (state.currentPanel === "decisions" || !panelNeedsStableDom()) {
      renderAll();
    } else {
      renderLiveUI();
    }
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
    state.stats.popularity -= 0.0012 * (state.stats.inflation - 10);
  }
  if (state.stats.taxRate > 30) {
    state.stats.gdp -= 0.00045 * (state.stats.taxRate - 30);
  }
  if (state.stats.gdp > country().start.gdp) {
    state.stats.popularity += 0.00045;
  }
  if (state.stats.unemployment > 11) {
    state.stats.popularity -= 0.001 * (state.stats.unemployment - 11);
  }
  if (state.stats.cash < 60) {
    state.stats.inflation += 0.00045 * ((60 - state.stats.cash) / 60);
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

function calculateEconomyForFinance(finance) {
  const f = finance;
  const mode = GAME_MODES[state.settings.gameMode];
  const pibBase = Math.max(state.stats.gdp, 0.1);
  const pibEscala = pibBase * 1000;
  const exportacao = ((f.comercioExterior + f.comercio + f.industria + f.tecnologia) / 4) * pibBase * 4;
  const recursosNaturais = f.recursosNaturais * pibBase * 3;
  const receita =
    (f.nivelImposto * pibEscala * 0.001) +
    (exportacao * 0.0012) +
    (recursosNaturais * 0.001);
  const gastoTotal =
    (f.gastoSaude + f.gastoEducacao + f.gastoSeguranca + f.gastoInfraestrutura +
      f.gastoDefesa + f.gastoSocial + (100 - f.eficienciaEstado)) * 0.14
    - (f.eficienciaEstado * 0.02);
  const saldo = receita - gastoTotal;

  let inflationDelta = 0;
  if (saldo < 0) {
    inflationDelta += Math.abs(saldo) * 0.015 * mode.inflationFactor;
  }
  if (f.nivelImposto > 60) {
    inflationDelta += 0.01 * mode.inflationFactor;
  }

  let gdpDelta = 0;
  gdpDelta += f.gastoInfraestrutura * 0.00045;
  gdpDelta += f.gastoEducacao * 0.00012;
  gdpDelta += f.tecnologia * 0.00016;
  gdpDelta += f.industria * 0.0001;
  gdpDelta += Math.max(0, 55 - f.nivelImposto) * 0.00008;
  gdpDelta -= Math.max(0, f.nivelImposto - 45) * 0.00022;
  gdpDelta -= Math.max(0, state.stats.inflation - 12) * 0.0014;

  let unemploymentDelta = 0;
  unemploymentDelta -= Math.max(0, gdpDelta) * 9;
  unemploymentDelta += Math.max(0, state.stats.inflation - 15) * 0.02;

  let popularityDelta = 0;
  popularityDelta += f.gastoSocial * 0.004 * mode.popularityFactor;
  popularityDelta += gdpDelta * 28 * mode.popularityFactor;
  popularityDelta -= Math.max(0, state.stats.inflation - 10) * 0.025 / mode.popularityFactor;
  popularityDelta -= Math.max(0, state.stats.unemployment - 12) * 0.035 / mode.popularityFactor;
  popularityDelta += (f.eficienciaEstado - 50) * 0.004 * mode.popularityFactor;

  return { receita, gastoTotal, saldo, exportacao, recursosNaturais, gdpDelta, inflationDelta, unemploymentDelta, popularityDelta };
}

function calculateEconomy() {
  return calculateEconomyForFinance(state.finance);
}

function sliderRow(key, label, value) {
  return `
    <label class="slider-row">
      <span>${label}</span>
      <input type="range" min="0" max="100" value="${Math.round(value)}" data-finance="${key}">
      <strong data-finance-value="${key}">${Math.round(value)}</strong>
    </label>
  `;
}

function bindEconomyControls() {
  elements.panelContent.querySelectorAll("input[data-finance]").forEach((input) => {
    input.style.setProperty("--range-progress", `${input.value}%`);
    input.addEventListener("input", () => {
      const key = input.dataset.finance;
      const nextValue = Number(input.value);
      input.style.setProperty("--range-progress", `${input.value}%`);
      if (key.startsWith("gasto") && key !== "eficienciaEstado") {
        const totalOtherSpending = Object.entries(state.finance)
          .filter(([entryKey]) => entryKey.startsWith("gasto") && entryKey !== "eficienciaEstado" && entryKey !== key)
          .reduce((sum, [, value]) => sum + value, 0);
        const budgetCap = Math.max(40, 400 - Math.floor(state.stats.cash * 0.45));
          if (totalOtherSpending + nextValue > budgetCap) {
            input.value = state.finance[key];
            input.style.setProperty("--range-progress", `${input.value}%`);
            showAlertPopup("deficit", "Déficit", "O orçamento disponível não comporta esse aumento agora.");
            return;
          }
        }
      state.finance[key] = nextValue;
      if (key === "nivelImposto") {
        state.stats.taxRate = nextValue;
      }
      const valueLabel = elements.panelContent.querySelector(`[data-finance-value="${key}"]`);
      if (valueLabel) {
        valueLabel.textContent = Math.round(nextValue);
      }
      playTone("click");
      renderStatsStrip();
      updateAlertState();
    });

    input.addEventListener("change", () => {
      if (state.currentPanel === "economy") {
        renderEconomyPanel();
      }
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

function decisionClassification(decision) {
  const stats = state.stats;
  const effectsApprove = decision.options.approve.immediate || {};
  const effectsReject = decision.options.reject.immediate || {};
  const remaining = Math.max(0, decision.deadline - tickAtual);

  const context = {
    inflationCritical: stats.inflation >= 18,
    cashCritical: stats.cash <= 20,
    popularityCritical: stats.popularity <= 32,
    unemploymentCritical: stats.unemployment >= 14,
    growthWeak: stats.gdp <= country().start.gdp,
    highPressure: crisisPressure() >= 3,
    expiring: remaining <= 1400
  };

  let category = "Equilíbrio";
  let priority = "média";
  let recommendation = "approve";
  let reason = "A medida abre alguma margem estratégica para o governo.";

  if ((effectsApprove.inflation || 0) < 0 || (effectsReject.inflation || 0) < 0 || decision.tags.includes("Inflação")) {
    category = "Controle de preços";
    if (context.inflationCritical) {
      priority = "crítica";
      recommendation = (effectsApprove.inflation || 0) <= (effectsReject.inflation || 0) ? "approve" : "reject";
      reason = "A inflação virou risco central e precisa ser atacada antes de corroer mais apoio.";
    } else {
      priority = "alta";
      recommendation = (effectsApprove.inflation || 0) < (effectsReject.inflation || 0) ? "approve" : "reject";
      reason = "Segurar preços agora evita pressão acumulada sobre aprovação e consumo.";
    }
  } else if ((effectsApprove.cash || 0) > 0 || (effectsReject.cash || 0) > 0 || decision.tags.includes("Economia") || decision.tags.includes("Fiscal")) {
    category = "Fiscal e crescimento";
    if (context.cashCritical) {
      priority = "crítica";
      recommendation = (effectsApprove.cash || 0) >= (effectsReject.cash || 0) ? "approve" : "reject";
      reason = "O caixa está apertado e a prioridade é preservar fôlego fiscal imediato.";
    } else if (context.growthWeak || context.unemploymentCritical) {
      priority = "alta";
      recommendation = (effectsApprove.gdp || 0) >= (effectsReject.gdp || 0) ? "approve" : "reject";
      reason = "Com crescimento fraco, a recomendação favorece a opção que reativa PIB e emprego.";
    } else {
      priority = "média";
      recommendation = (effectsApprove.cash || 0) + (effectsApprove.gdp || 0) >= (effectsReject.cash || 0) + (effectsReject.gdp || 0) ? "approve" : "reject";
      reason = "A leitura atual busca equilíbrio entre arrecadação e expansão econômica.";
    }
  } else if ((effectsApprove.popularity || 0) > 0 || (effectsReject.popularity || 0) > 0 || decision.tags.includes("Popularidade") || decision.tags.includes("Social") || decision.tags.includes("Politica")) {
    category = "Estabilidade social";
    if (context.popularityCritical) {
      priority = "crítica";
      recommendation = (effectsApprove.popularity || 0) >= (effectsReject.popularity || 0) ? "approve" : "reject";
      reason = "A base política está em risco e a prioridade é recuperar legitimidade nacional.";
    } else {
      priority = context.highPressure ? "alta" : "média";
      recommendation = (effectsApprove.popularity || 0) >= (effectsReject.popularity || 0) ? "approve" : "reject";
      reason = "A tensão social pede a resposta com melhor retorno político de curto prazo.";
    }
  } else if (decision.tags.includes("Segurança")) {
    category = "Ordem pública";
    priority = context.popularityCritical ? "alta" : "média";
    recommendation = (effectsApprove.popularity || 0) >= (effectsReject.popularity || 0) ? "approve" : "reject";
    reason = "A percepção de autoridade pesa diretamente sobre confiança e governabilidade.";
  }

  if (context.expiring && priority !== "crítica") {
    priority = priority === "alta" ? "crítica" : "alta";
    reason = `O prazo está acabando. ${reason}`;
  }

  return { category, priority, recommendation, reason };
}

function decisionMetaTone(priority) {
  if (priority === "crítica") return "critical";
  if (priority === "alta") return "warning";
  return "stable";
}

function recommendationLabel(option) {
  return option === "approve" ? "Recomendado: Aprovar" : "Recomendado: Recusar";
}

function topDecisionRecommendation() {
  if (!state.activeDecisions.length) {
    return null;
  }
  const priorityWeight = { "crítica": 3, "alta": 2, "média": 1 };
  return [...state.activeDecisions]
    .map((decision) => ({ decision, analysis: decisionClassification(decision) }))
    .sort((a, b) => {
      const priorityGap = (priorityWeight[b.analysis.priority] || 0) - (priorityWeight[a.analysis.priority] || 0);
      if (priorityGap !== 0) {
        return priorityGap;
      }
      return (a.decision.deadline - tickAtual) - (b.decision.deadline - tickAtual);
    })[0];
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

function decisionWeight(decision) {
  let weight = 1;
  const tags = decision.tags || [];

  if (tags.includes("Fiscal") || decision.id === "tax-cut") {
    if (state.stats.cash < 40) weight += 4;
    if (calculateEconomy().saldo < 0) weight += 4;
  }

  if (tags.includes("Social") || tags.includes("Popularidade")) {
    if (state.stats.popularity < 40) weight += 4;
    if (state.stats.popularity < 30) weight += 3;
  }

  if (tags.includes("InflaÃ§Ã£o") || decision.id === "fiscal-adjustment") {
    if (state.stats.inflation > 14) weight += 4;
    if (state.stats.inflation > 20) weight += 3;
  }

  if (tags.includes("Emprego") || tags.includes("Educacao") || decision.id === "tax-cut") {
    if (state.stats.unemployment > 12) weight += 4;
    if (state.stats.gdp <= country().start.gdp + 0.03) weight += 3;
  }

  if (tags.includes("Politica") || tags.includes("SeguranÃ§a")) {
    if (state.stats.popularity < 35) weight += 3;
    if (crisisPressure() >= 3) weight += 2;
  }

  if (state.activeDecisions.some((item) => item.id === decision.id)) {
    weight = 0;
  }

  return Math.max(weight, 0);
}

function pickDecisionTemplate() {
  const weightedPool = DECISION_LIBRARY
    .map((decision) => ({ decision, weight: decisionWeight(decision) }))
    .filter((entry) => entry.weight > 0);

  if (!weightedPool.length) {
    return null;
  }

  const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of weightedPool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.decision;
    }
  }

  return weightedPool[weightedPool.length - 1].decision;
}

function spawnDecision() {
  if (state.activeDecisions.length >= 3) {
    return;
  }
  const sourceDecision = pickDecisionTemplate();
  if (!sourceDecision) {
    return;
  }
  const template = JSON.parse(JSON.stringify(sourceDecision));
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
  if (state.currentPanel === "decisions") {
    renderDecisionsPanel();
  }
}

function getDecisionFinanceAdjustments(decisionId, optionKey) {
  const adjustments = {
    "tax-cut": {
      approve: { nivelImposto: -6, industria: 4, comercio: 2 },
      reject: { nivelImposto: 3, industria: -2 }
    },
    "social-pack": {
      approve: { gastoSocial: 8, gastoSaude: 2 },
      reject: { gastoSocial: -6 }
    },
    "imports": {
      approve: { comercioExterior: 8, comercio: 4, industria: -2 },
      reject: { comercioExterior: -5, industria: 3 }
    },
    "security-plan": {
      approve: { gastoSeguranca: 8, gastoDefesa: 2 },
      reject: { gastoSeguranca: -5, eficienciaEstado: 1 }
    },
    "fiscal-adjustment": {
      approve: { gastoSocial: -4, gastoInfraestrutura: -3, eficienciaEstado: 6 },
      reject: { gastoSocial: 2, eficienciaEstado: -3 }
    },
    "jobs-plan": {
      approve: { gastoInfraestrutura: 6, industria: 4, tecnologia: 2 },
      reject: { gastoInfraestrutura: -3, industria: -2 }
    },
    "education-boost": {
      approve: { gastoEducacao: 8, tecnologia: 4 },
      reject: { gastoEducacao: -5 }
    },
    "cabinet-crisis": {
      approve: { eficienciaEstado: 4, gastoSeguranca: 1 },
      reject: { eficienciaEstado: -4 }
    }
  };

  return adjustments[decisionId]?.[optionKey] || null;
}

function applyFinanceAdjustments(decisionId, optionKey) {
  const changes = getDecisionFinanceAdjustments(decisionId, optionKey);
  if (!changes) {
    return;
  }

  Object.entries(changes).forEach(([key, delta]) => {
    state.finance[key] = clamp((state.finance[key] || 0) + delta, 0, 100);
    if (key === "nivelImposto") {
      state.stats.taxRate = state.finance[key];
    }
  });
}

function applyDecisionEffect(effect, title, decisionId = null, optionKey = null) {
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
  if (decisionId && optionKey) {
    applyFinanceAdjustments(decisionId, optionKey);
  }
  normalizeStats();
  pushEvent(title, effect.impact, effect.mood);
  pushNews("Governo", title, effect.impact);
  issueAdvisorBriefing("decision", title);
  updateHeadline(title, effect.impact);
}

function flushQueuedDecisions() {
  if (!state.queuedDecisions.length) {
    return;
  }
  const queued = [...state.queuedDecisions];
  state.queuedDecisions = [];
  queued.forEach((entry) => {
    applyDecisionEffect(entry.effect, entry.title, entry.decisionId, entry.optionKey);
  });
  updateAlertState();
  renderAll();
}

function answerDecision(id, option) {
  if (state.gameOver) {
    return;
  }
  const decision = state.activeDecisions.find((item) => item.id === id);
  if (!decision) {
    return;
  }
  if (!jogoRodando) {
    const queuedTitle = `${decision.title} - ${decision.options[option].label}`;
    const severityWhenPaused = decisionSeverity(decision.options[option]);
    animateDecisionFeedback(decision.id, severityWhenPaused);
    playTone(option === "approve" ? "good" : "click");
    setTimeout(() => {
      state.activeDecisions = state.activeDecisions.filter((item) => item !== decision);
      state.queuedDecisions.push({
        effect: decision.options[option],
        title: queuedTitle,
        decisionId: decision.id,
        optionKey: option
      });
      pushEvent("Decisão aguardando execução", `${decision.title} foi definida e entrará em vigor quando o jogo voltar para Play.`, "neutral");
      pushNews("Gabinete", `${decision.title} foi registrada em espera`, "A medida só será aplicada quando o jogo voltar a rodar.");
      renderAll();
    }, severityWhenPaused === "critical" ? 420 : severityWhenPaused === "moderate" ? 320 : 240);
    return;
  }
  const severity = decisionSeverity(decision.options[option]);
  const decisionTitle = `${decision.title} - ${decision.options[option].label}`;
  animateDecisionFeedback(decision.id, severity);
  playTone(option === "approve" ? "good" : "click");
  state.activeDecisions = state.activeDecisions.filter((item) => item !== decision);
  applyDecisionEffect(decision.options[option], decisionTitle, decision.id, option);
  updateAlertState();
  renderAll();
  return;
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

function pushAdvisorNote(title, body, tone = "stable") {
  state.advisorNotes.unshift({ title, body, tone, tick: tickAtual });
  state.advisorNotes = state.advisorNotes.slice(0, 8);
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
  elements.countryTitle.textContent = country().title;
  if (country().brandType === "image") {
    elements.brandImage.classList.remove("hidden");
    elements.brandImage.src = country().brandImage;
    elements.brandImage.alt = country().name;
    elements.brandFallback.classList.add("hidden");
  } else {
    elements.brandImage.classList.add("hidden");
    elements.brandFallback.classList.remove("hidden");
    elements.brandFallback.textContent = country().flag;
  }
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
    const analysis = decisionClassification(decision);
    const tone = decisionMetaTone(analysis.priority);
    return `
      <article class="decision-card ${remaining < 1400 ? "expiring" : ""}" data-card-id="${decision.id}">
        <div class="decision-top">
          <strong>${decision.title}</strong>
          <span class="panel-chip" data-decision-remaining="${decision.id}">${remaining} ticks</span>
        </div>
        <div class="decision-meta-row">
          <span class="decision-meta-chip ${tone}">${analysis.category}</span>
          <span class="decision-meta-chip ${tone}">${analysis.priority}</span>
          <span class="decision-meta-chip recommended">${recommendationLabel(analysis.recommendation)}</span>
        </div>
        <p>${decision.body}</p>
        <p class="decision-reason">${analysis.reason}</p>
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
    <article class="catalog-card">
      <h4>Renunciar do cargo</h4>
      <p>Encerrar o governo atual e escolher outra nação em crise.</p>
      <button class="secondary-btn" id="resignButton">Renunciar</button>
    </article>
    <div class="decision-grid">${cards || `<article class="feed-card neutral"><strong>Sem decisões urgentes</strong><p>O gabinete está momentaneamente estável, mas novas demandas surgirão.</p></article>`}</div>
  `;
  const resignButton = elements.panelContent.querySelector("#resignButton");
  if (resignButton) {
    resignButton.addEventListener("click", confirmResignation);
  }
  elements.panelContent.querySelectorAll(".decision-btn").forEach((button) => {
    button.addEventListener("click", () => answerDecision(button.dataset.id, button.dataset.option));
  });
}

function updateDecisionLivePanel() {
  if (state.currentPanel !== "decisions") {
    return;
  }
  elements.panelChip.textContent = `${state.activeDecisions.length} abertas`;
  state.activeDecisions.forEach((decision) => {
    const chip = elements.panelContent.querySelector(`[data-decision-remaining="${decision.id}"]`);
    const card = elements.panelContent.querySelector(`[data-card-id="${decision.id}"]`);
    if (!chip || !card) {
      return;
    }
    const remaining = Math.max(0, decision.deadline - tickAtual);
    chip.textContent = `${remaining} ticks`;
    card.classList.toggle("expiring", remaining < 1400);
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
        <span class="mini-label">Modo de jogo</span>
        <strong>${state.settings.gameMode}</strong>
        <div class="mode-row">
          <button class="mode-btn ${state.settings.gameMode === "iniciante" ? "active" : ""}" data-mode="iniciante">Iniciante</button>
          <button class="mode-btn ${state.settings.gameMode === "casual" ? "active" : ""}" data-mode="casual">Casual</button>
          <button class="mode-btn ${state.settings.gameMode === "veterano" ? "active" : ""}" data-mode="veterano">Veterano</button>
        </div>
      </article>
      <article class="settings-card">
        <span class="mini-label">Modo de som</span>
        <strong>${state.settings.soundOn ? "Sim" : "Não"}</strong>
        <div class="toggle-row">
          <button class="toggle-btn ${state.settings.soundOn ? "active" : ""}" data-setting="sound" data-value="sim">Sim</button>
          <button class="toggle-btn ${!state.settings.soundOn ? "active" : ""}" data-setting="sound" data-value="nao">Não</button>
        </div>
      </article>
      <article class="settings-card">
        <span class="mini-label">Tema</span>
        <strong>${state.settings.theme === "dark" ? "Escuro" : "Claro"}</strong>
        <div class="toggle-row">
          <button class="toggle-btn ${state.settings.theme === "light" ? "active" : ""}" data-setting="theme" data-value="light">Claro</button>
          <button class="toggle-btn ${state.settings.theme === "dark" ? "active" : ""}" data-setting="theme" data-value="dark">Escuro</button>
        </div>
      </article>
    </div>
  `;
  bindSettingsControls();
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

function showConfirmDialog({ badge = "Confirmação", title, text, onYes, onNo }) {
  elements.confirmBadge.textContent = badge;
  elements.confirmTitle.textContent = title;
  elements.confirmText.textContent = text;
  elements.confirmActions.innerHTML = "";

  const yesButton = document.createElement("button");
  yesButton.className = "primary-btn";
  yesButton.textContent = "Sim";
  yesButton.addEventListener("click", () => {
    elements.confirmOverlay.classList.add("hidden");
    if (onYes) onYes();
  });

  const noButton = document.createElement("button");
  noButton.className = "secondary-btn";
  noButton.textContent = "Não";
  noButton.addEventListener("click", () => {
    elements.confirmOverlay.classList.add("hidden");
    if (onNo) onNo();
  });

  elements.confirmActions.append(yesButton, noButton);
  elements.confirmOverlay.classList.remove("hidden");
}

function confirmResignation() {
  showConfirmDialog({
    badge: "Renúncia",
    title: "Renunciar do cargo?",
    text: "Se confirmar, você deixa o país atual e escolhe outra nação para governar.",
    onYes: () => {
      jogoRodando = false;
      elements.endgameOverlay.classList.remove("hidden");
      renderCountrySelection();
    },
    onNo: () => {
      jogoRodando = jogoRodando;
    }
  });
}

function bindSettingsControls() {
  elements.panelContent.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.gameMode = button.dataset.mode;
      renderSettingsPanel();
    });
  });

  elements.panelContent.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const setting = button.dataset.setting;
      const value = button.dataset.value;
      if (setting === "sound") {
        state.settings.soundOn = value === "sim";
        if (state.settings.soundOn) playTone("click");
      }
      if (setting === "theme") {
        state.settings.theme = value;
        document.body.classList.toggle("dark-theme", value === "dark");
      }
      renderSettingsPanel();
      renderAll();
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

function renderLiveUI() {
  updateHeader();
  renderStatsStrip();
  drawApprovalEmoji();
}

function panelNeedsStableDom(panel = state.currentPanel) {
  return ["economy", "decisions", "settings"].includes(panel);
}

function refreshPassivePanel() {
  if (!panelNeedsStableDom()) {
    renderPanel();
  }
}

function bindEconomyControls() {
  elements.panelContent.querySelectorAll("input[data-finance]").forEach((input) => {
    input.style.setProperty("--range-progress", `${input.value}%`);
    input.addEventListener("input", () => {
      const key = input.dataset.finance;
      const nextValue = Number(input.value);
      input.style.setProperty("--range-progress", `${input.value}%`);

      if (key.startsWith("gasto") && key !== "eficienciaEstado" && nextValue > state.finance[key]) {
        const projectedFinance = { ...state.finance, [key]: nextValue };
        const projectedEconomy = calculateEconomyForFinance(projectedFinance);
        const allowedDeficit = Math.max(6, Math.min(32, state.stats.cash * 0.12 + 8));

        if (projectedEconomy.saldo < -allowedDeficit) {
          input.value = state.finance[key];
          input.style.setProperty("--range-progress", `${input.value}%`);
          showAlertPopup("deficit", "DÃ©ficit", `Esse aumento levaria o saldo para ${projectedEconomy.saldo.toFixed(2)} e pressionaria demais o caixa.`);
          return;
        }
      }

      state.finance[key] = nextValue;
      if (key === "nivelImposto") {
        state.stats.taxRate = nextValue;
      }

      const valueLabel = elements.panelContent.querySelector(`[data-finance-value="${key}"]`);
      if (valueLabel) {
        valueLabel.textContent = Math.round(nextValue);
      }
      playTone("click");
      renderStatsStrip();
      updateAlertState();
    });

    input.addEventListener("change", () => {
      if (state.currentPanel === "economy") {
        renderEconomyPanel();
      }
    });
  });
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
    const analysis = decisionClassification(decision);
    const tone = decisionMetaTone(analysis.priority);
    return `
      <article class="decision-card ${remaining < 1400 ? "expiring" : ""}" data-card-id="${decision.id}">
        <div class="decision-top">
          <strong>${decision.title}</strong>
          <span class="panel-chip" data-decision-remaining="${decision.id}">${remaining} ticks</span>
        </div>
        <div class="decision-meta-row">
          <span class="decision-meta-chip ${tone}">${analysis.category}</span>
          <span class="decision-meta-chip ${tone}">${analysis.priority}</span>
          <span class="decision-meta-chip recommended">${recommendationLabel(analysis.recommendation)}</span>
        </div>
        <p>${decision.body}</p>
        <p class="decision-reason">${analysis.reason}</p>
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
    <article class="catalog-card">
      <h4>Renunciar do cargo</h4>
      <p>Encerrar o governo atual e escolher outra nação em crise.</p>
      <button class="secondary-btn" id="resignButton">Renunciar</button>
    </article>
    <div class="decision-grid">${cards || `<article class="feed-card neutral"><strong>Sem decisões urgentes</strong><p>O gabinete está momentaneamente estável, mas novas demandas surgirão.</p></article>`}</div>
  `;

  const resignButton = elements.panelContent.querySelector("#resignButton");
  if (resignButton) {
    resignButton.addEventListener("click", confirmResignation);
  }
  elements.panelContent.querySelectorAll(".decision-btn").forEach((button) => {
    button.addEventListener("click", () => answerDecision(button.dataset.id, button.dataset.option));
  });
}

function renderAdvisorPanel() {
  setPanelHeader("Conselheiro", "Centro Estratégico", "IA interna");
  const recommended = topDecisionRecommendation();
  const advice = recommended
    ? `${recommended.analysis.reason} ${recommendationLabel(recommended.analysis.recommendation)} em "${recommended.decision.title}".`
    : crisisPressure() > 2
      ? "As crises estão acumulando camadas. Responda primeiro o que atinge inflação e caixa."
      : state.activeDecisions.length > 1
        ? "Há mais de uma frente aberta. Priorize a que está mais perto do prazo."
        : "Sua janela de controle ainda existe. Use decisões para ajustar setores específicos.";
  const focusLine = recommended
    ? `<div class="advisor-focus"><span class="decision-meta-chip ${decisionMetaTone(recommended.analysis.priority)}">${recommended.analysis.priority}</span><strong>${recommended.decision.title}</strong></div>`
    : `<div class="advisor-focus"><span class="decision-meta-chip stable">janela estável</span><strong>Sem decisão urgente no momento</strong></div>`;

  elements.panelContent.innerHTML = `
    <article class="advisor-card">
      <span class="mini-label">Helena Duarte</span>
      <strong>Leitura do gabinete</strong>
      ${focusLine}
      <p>${advice}</p>
    </article>
  `;
}

const SOCIAL_PROFILES = [
  { name: "Clara Nunes", handle: "@clarapolitica", stance: "pro-governo", badge: "base" },
  { name: "Mateus Lima", handle: "@mercadomateus", stance: "mercado", badge: "mercado" },
  { name: "Ana Costa", handle: "@anacivica", stance: "povo", badge: "rua" },
  { name: "Leo Barros", handle: "@leobarros", stance: "oposicao", badge: "oposicao" },
  { name: "Julia Ferraz", handle: "@juliaopina", stance: "jornalismo", badge: "midia" },
  { name: "Rafa Mendes", handle: "@rafamendes", stance: "povo", badge: "debate" }
];

function fiscalOutlook() {
  const economy = calculateEconomy();
  if (economy.saldo > 20) {
    return "Projecao: o caixa deve seguir respirando se o ritmo atual for mantido.";
  }
  if (economy.saldo > 0) {
    return "Projecao: ha superavit, mas qualquer choque relevante pode apertar o governo.";
  }
  if (economy.saldo > -12) {
    return "Projecao: o deficit ainda e reversivel, porem ja pressiona inflacao e confianca.";
  }
  return "Projecao: sem correcao fiscal, a tendencia e de crise mais frequente e desgaste acelerado.";
}

function governmentAdviceItems() {
  const items = [];
  const economy = calculateEconomy();

  if (state.stats.inflation >= 18) {
    items.push("Prioridade maxima: atacar inflacao. Sem isso, popularidade e consumo continuam caindo.");
  }
  if (state.stats.cash <= 20 || economy.saldo < 0) {
    items.push("Proteja o caixa. Elevar despesas agora sem compensacao aumenta a chance de colapso fiscal.");
  }
  if (state.stats.popularity <= 35) {
    items.push("A base politica esta fragil. Decisoes com ganho social e percepcao publica ficaram mais valiosas.");
  }
  if (state.stats.unemployment >= 14) {
    items.push("O desemprego ja virou crise de humor nacional. Crescimento e investimento precisam ganhar peso.");
  }
  if (state.finance.gastoEducacao < 40) {
    items.push("Educacao baixa reduz o crescimento futuro. Vale reforcar isso antes que a economia estanque.");
  }
  const recommended = topDecisionRecommendation();
  if (recommended) {
    items.push(`${recommendationLabel(recommended.analysis.recommendation)} em "${recommended.decision.title}" porque ${recommended.analysis.reason.toLowerCase()}`);
  }
  if (!items.length) {
    items.push("O governo esta relativamente estavel. Use essa janela para fortalecer caixa, emprego e aprovacao setorial.");
  }
  return items.slice(0, 4);
}

function issueAdvisorBriefing(source = "cycle", customTitle = "") {
  const items = governmentAdviceItems();
  const primary = items[0] || "O governo segue estavel, mas precisa manter margem de manobra.";
  const title = customTitle || (source === "decision" ? "Conselho apos decisao" : "Briefing do conselheiro");
  let tone = "stable";
  if (state.stats.inflation >= 18 || state.stats.cash < 0 || state.stats.popularity < 30) {
    tone = "critical";
  } else if (crisisPressure() >= 2 || state.activeDecisions.length > 1) {
    tone = "warning";
  }
  pushAdvisorNote(title, primary, tone);
}

function secondaryOutletName(index) {
  const outlets = ["JN Marca Economia", "Capital 24", "Radar Fiscal", "Voz Nacional", "Painel Central"];
  return outlets[index % outlets.length];
}

function socialCommentary(profile, index) {
  const latest = state.news[index % Math.max(state.news.length, 1)] || { title: "governo" };
  const openDecision = state.activeDecisions[0];

  if (profile.stance === "mercado") {
    if (state.stats.inflation > 18) {
      return `O mercado vai abrir pressionando. "${latest.title}" reforca leitura de risco e perda de ancora nos precos.`;
    }
    if (state.stats.cash < 20) {
      return `O caixa esta curto demais. Se o governo nao sinalizar ajuste, "${latest.title}" vai pesar nos ativos.`;
    }
    if (state.stats.gdp > country().start.gdp + 0.15) {
      return `Tem revisao positiva vindo ai. "${latest.title}" combina com um ciclo mais forte de crescimento.`;
    }
    return `O mercado ainda esta em compasso de espera. "${latest.title}" ajuda a medir se o governo tem rumo fiscal.`;
  }

  if (profile.stance === "oposicao") {
    if (state.stats.popularity < 35) {
      return `A popularidade caiu e "${latest.title}" so amplia o desgaste. A oposicao vai explorar isso o dia inteiro.`;
    }
    if (state.stats.inflation > 14) {
      return `Preco alto e governo confuso: "${latest.title}" entrega um prato cheio para o Congresso bater no Planalto.`;
    }
    return `Mesmo quando o governo acerta um pouco, "${latest.title}" mostra que ainda ha espaco para confronto politico.`;
  }

  if (profile.stance === "pro-governo") {
    if (state.stats.gdp > country().start.gdp + 0.1) {
      return `Tem resultado chegando. "${latest.title}" prova que as medidas do governo estao comecando a responder.`;
    }
    if (openDecision) {
      return `Se o governo fechar bem "${openDecision.title}", muda o humor politico e pode virar a narrativa do dia.`;
    }
    return `Ainda existe margem para reorganizar a comunicacao. "${latest.title}" nao encerra o jogo politico.`;
  }

  if (profile.stance === "jornalismo") {
    if (openDecision) {
      return `Bastidor: a equipe esta dividida sobre "${openDecision.title}". "${latest.title}" pode ganhar novas camadas nas proximas horas.`;
    }
    return `Nos bastidores, "${latest.title}" e tratado como teste de forca entre equipe economica, base e opiniao publica.`;
  }

  if (state.stats.unemployment > 14) {
    return `Na ponta, o que pesa e emprego. "${latest.title}" so vai convencer mesmo se a vida real melhorar.`;
  }
  if (state.stats.inflation > 16) {
    return `No fim, o povo sente no bolso. "${latest.title}" vira debate porque mercado e rua estao vendo inflacao todo dia.`;
  }
  if (state.stats.popularity > 58) {
    return `Tem gente reconhecendo melhora. "${latest.title}" aparece forte porque o humor social saiu do pior momento.`;
  }
  return `"${latest.title}" esta rendendo debate porque cada grupo le o governo de um jeito diferente.`;
}

function buildNewsExperience() {
  const latest = state.news[0] || { type: "Monitor", title: "Governo sob observacao", body: "O gabinete ainda tenta definir o tom do mandato.", priority: "neutral" };
  const lead = {
    brand: "JN Marca",
    kicker: latest.type,
    title: latest.title,
    body: latest.body,
    projection: fiscalOutlook(),
    tone: latest.priority === "priority" ? "priority" : latest.priority === "good" ? "good" : "neutral"
  };

  const secondary = state.news.slice(0, 3).map((item, index) => ({
    outlet: secondaryOutletName(index),
    title: item.title,
    body: item.body,
    tone: item.priority === "priority" ? "priority" : item.priority === "good" ? "good" : "neutral"
  }));

  while (secondary.length < 3) {
    secondary.push({
      outlet: secondaryOutletName(secondary.length),
      title: "Mercado acompanha o Planalto",
      body: fiscalOutlook(),
      tone: "neutral"
    });
  }

  const social = SOCIAL_PROFILES.slice(0, 5).map((profile, index) => ({
    ...profile,
    avatar: profile.name.split(" ").map((part) => part[0]).slice(0, 2).join(""),
    text: socialCommentary(profile, index),
    stamp: `${Math.max(1, 8 - index)} min`
  }));

  return { lead, secondary, social };
}

function renderNewsPanel() {
  setPanelHeader("Noticias", "Central de Midia", "tempo real");
  const media = buildNewsExperience();
  const leadCard = `
    <article class="lead-news-card ${media.lead.tone}">
      <div class="lead-news-top">
        <span class="news-brand">${media.lead.brand}</span>
        <span class="panel-chip">${media.lead.kicker}</span>
      </div>
      <strong>${media.lead.title}</strong>
      <p>${media.lead.body}</p>
      <div class="lead-news-projection">${media.lead.projection}</div>
    </article>
  `;
  const secondaryCards = media.secondary.map((item) => `
    <article class="feed-card ${item.tone}">
      <span class="mini-label">${item.outlet}</span>
      <strong>${item.title}</strong>
      <p>${item.body}</p>
    </article>
  `).join("");
  const socialCards = media.social.map((item) => `
    <article class="social-card ${item.stance}">
      <div class="social-top">
        <div class="social-avatar">${item.avatar}</div>
        <div>
          <strong>${item.name}</strong>
          <span class="mini-label">${item.handle} • ${item.stamp}</span>
        </div>
        <span class="social-badge ${item.stance}">${item.badge}</span>
      </div>
      <p>${item.text}</p>
    </article>
  `).join("");
  elements.panelContent.innerHTML = `
    <div class="media-layout">
      ${leadCard}
      <div class="feed-grid media-secondary">${secondaryCards}</div>
      <div class="social-grid">${socialCards}</div>
    </div>
  `;
}

function renderAdvisorPanel() {
  setPanelHeader("Conselheiro", "Centro Estrategico", "IA interna");
  const recommended = topDecisionRecommendation();
  const focusLine = recommended
    ? `<div class="advisor-focus"><span class="decision-meta-chip ${decisionMetaTone(recommended.analysis.priority)}">${recommended.analysis.priority}</span><strong>${recommended.decision.title}</strong></div>`
    : `<div class="advisor-focus"><span class="decision-meta-chip stable">janela estavel</span><strong>Sem decisao urgente no momento</strong></div>`;
  const adviceItems = governmentAdviceItems().map((item) => `<li>${item}</li>`).join("");
  const macroLine = fiscalOutlook();
  const noteCards = state.advisorNotes.map((note) => `
    <article class="advisor-note ${note.tone}">
      <span class="mini-label">${note.title} • tick ${note.tick}</span>
      <p>${note.body}</p>
    </article>
  `).join("");

  elements.panelContent.innerHTML = `
    <article class="advisor-card">
      <span class="mini-label">Helena Duarte</span>
      <strong>Leitura do gabinete</strong>
      ${focusLine}
      <p>${macroLine}</p>
      <ul class="advisor-list">${adviceItems}</ul>
    </article>
    <div class="advisor-notes">${noteCards}</div>
  `;
}

elements.playButton.addEventListener("click", () => {
  jogoRodando = true;
  flushQueuedDecisions();
});

elements.pauseButton.addEventListener("click", () => {
  jogoRodando = false;
});

elements.speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    velocidadeJogo = Number(button.dataset.speed);
    elements.speedButtons.forEach((item) => item.classList.toggle("active", item === button));
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
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  if (button.matches(".decision-btn")) {
    return;
  }
  playTone("click");
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
