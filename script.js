const DIFFICULTY_SETTINGS = {
  easy: {
    label: "Fácil",
    start: { gdp: 2450, inflation: 5.4, popularity: 63, cash: 220, unemployment: 9.3 },
    shockMultiplier: 0.8,
    driftMultiplier: 0.85,
    badAdviceChance: 0.12
  },
  normal: {
    label: "Médio",
    start: { gdp: 2300, inflation: 6.2, popularity: 58, cash: 150, unemployment: 10.4 },
    shockMultiplier: 1,
    driftMultiplier: 1,
    badAdviceChance: 0.22
  },
  hard: {
    label: "Difícil",
    start: { gdp: 2140, inflation: 7.1, popularity: 54, cash: 90, unemployment: 11.4 },
    shockMultiplier: 1.2,
    driftMultiplier: 1.15,
    badAdviceChance: 0.35
  }
};

const DECISION_POOL = [
  {
    id: "corp-tax",
    title: "Reduzir impostos para empresas?",
    summary: "O mercado pressiona por um corte para acelerar investimentos privados.",
    tags: ["PIB", "Caixa", "Popularidade"],
    options: {
      yes: {
        label: "Sim, cortar",
        immediate: { gdp: 110, cash: -90, popularity: 3, unemployment: -0.8, inflation: 0.3 },
        delayed: { gdp: 50, cash: -20, popularity: -1 },
        news: "Empresários celebram um pacote de alívio tributário.",
        adviceBias: "growth"
      },
      no: {
        label: "Não, manter",
        immediate: { cash: 65, popularity: -2, gdp: -25, unemployment: 0.3 },
        delayed: { cash: 35, inflation: -0.2 },
        news: "O governo preserva receitas e adia cortes tributários.",
        adviceBias: "fiscal"
      }
    }
  },
  {
    id: "social-program",
    title: "Expandir programas sociais?",
    summary: "Governadores pedem reforço de renda para famílias vulneráveis.",
    tags: ["Popularidade", "Caixa", "Desemprego"],
    options: {
      yes: {
        label: "Sim, expandir",
        immediate: { popularity: 8, cash: -95, unemployment: -0.6, inflation: 0.5, gdp: 40 },
        delayed: { popularity: 3, cash: -30, inflation: 0.3 },
        news: "Prefeituras relatam maior consumo nas periferias.",
        adviceBias: "social"
      },
      no: {
        label: "Não, segurar gasto",
        immediate: { cash: 45, popularity: -7, inflation: -0.2 },
        delayed: { popularity: -2, unemployment: 0.4 },
        news: "Movimentos sociais criticam a falta de expansão da rede de apoio.",
        adviceBias: "fiscal"
      }
    }
  },
  {
    id: "infrastructure",
    title: "Lançar um pacote de infraestrutura?",
    summary: "Estradas, portos e energia estão travando a produtividade.",
    tags: ["PIB", "Desemprego", "Caixa"],
    options: {
      yes: {
        label: "Sim, investir",
        immediate: { gdp: 75, cash: -110, unemployment: -1.2, popularity: 4, inflation: 0.4 },
        delayed: { gdp: 95, cash: 15, unemployment: -0.6 },
        news: "Obras federais reacendem o setor de construção.",
        adviceBias: "jobs"
      },
      no: {
        label: "Não, adiar",
        immediate: { cash: 40, popularity: -3, gdp: -20 },
        delayed: { unemployment: 0.7, gdp: -30 },
        news: "Empresários reclamam do gargalo logístico persistente.",
        adviceBias: "fiscal"
      }
    }
  },
  {
    id: "imports",
    title: "Abrir mais importações de alimentos e insumos?",
    summary: "A medida pode aliviar preços, mas setores nacionais prometem reação.",
    tags: ["Inflação", "PIB", "Popularidade"],
    options: {
      yes: {
        label: "Sim, abrir",
        immediate: { inflation: -1.2, gdp: 55, popularity: 1, unemployment: 0.4 },
        delayed: { inflation: -0.4, popularity: -2, gdp: 20 },
        news: "Supermercados registram recuo de preços em itens sensíveis.",
        adviceBias: "inflation"
      },
      no: {
        label: "Não, proteger indústria",
        immediate: { popularity: 2, inflation: 0.6, cash: 20 },
        delayed: { gdp: -15, inflation: 0.4 },
        news: "Setores industriais comemoram a proteção do mercado interno.",
        adviceBias: "industry"
      }
    }
  },
  {
    id: "innovation",
    title: "Criar um fundo nacional de tecnologia?",
    summary: "Universidades e startups pedem crédito para inovação e produtividade.",
    tags: ["PIB", "Caixa", "Desemprego"],
    options: {
      yes: {
        label: "Sim, criar",
        immediate: { cash: -70, gdp: 35, unemployment: -0.4, popularity: 2 },
        delayed: { gdp: 105, unemployment: -0.8, inflation: -0.2 },
        news: "Ecossistema de inovação reage com otimismo ao novo fundo.",
        adviceBias: "growth"
      },
      no: {
        label: "Não, congelar",
        immediate: { cash: 30, popularity: -2 },
        delayed: { gdp: -45, unemployment: 0.4 },
        news: "Startups alertam para fuga de talentos e capital de risco.",
        adviceBias: "fiscal"
      }
    }
  },
  {
    id: "fuel-subsidy",
    title: "Subsidiar combustíveis para segurar preços?",
    summary: "A pressão inflacionária cresce e transportadores ameaçam parar.",
    tags: ["Inflação", "Caixa", "Popularidade"],
    options: {
      yes: {
        label: "Sim, subsidiar",
        immediate: { inflation: -1.5, popularity: 5, cash: -100, gdp: 25 },
        delayed: { cash: -50, inflation: 0.8, popularity: -1 },
        news: "Governo segura preços na bomba, mas o custo fiscal preocupa.",
        adviceBias: "inflation"
      },
      no: {
        label: "Não, segurar caixa",
        immediate: { cash: 35, popularity: -5, inflation: 0.9 },
        delayed: { inflation: 0.3, popularity: -2 },
        news: "Caminhoneiros elevam o tom após negativa de subsídio.",
        adviceBias: "fiscal"
      }
    }
  },
  {
    id: "labor-reform",
    title: "Flexibilizar regras trabalhistas?",
    summary: "A equipe econômica diz que a medida pode acelerar contratações.",
    tags: ["Desemprego", "Popularidade", "PIB"],
    options: {
      yes: {
        label: "Sim, flexibilizar",
        immediate: { unemployment: -0.9, gdp: 60, popularity: -3 },
        delayed: { unemployment: -0.5, popularity: -2, gdp: 25 },
        news: "Empresários enxergam espaço para contratar mais rapidamente.",
        adviceBias: "jobs"
      },
      no: {
        label: "Não, preservar",
        immediate: { popularity: 3, gdp: -15 },
        delayed: { unemployment: 0.5, popularity: 1 },
        news: "Centrais sindicais comemoram a preservação das regras atuais.",
        adviceBias: "social"
      }
    }
  }
];

const RANDOM_EVENTS = [
  {
    title: "Crise global",
    rarity: "rare",
    chance: 0.12,
    effect: { gdp: -150, inflation: 1.4, popularity: -5, cash: -35, unemployment: 1.2 },
    text: "Turbulência internacional derruba demanda externa e assusta investidores."
  },
  {
    title: "Pandemia localizada",
    rarity: "rare",
    chance: 0.08,
    effect: { gdp: -180, inflation: 2.1, popularity: -6, cash: -85, unemployment: 1.7 },
    text: "Uma crise sanitária pressiona hospitais, atividade e orçamento."
  },
  {
    title: "Boom de commodities",
    rarity: "rare",
    chance: 0.12,
    effect: { gdp: 140, inflation: -0.5, popularity: 4, cash: 45, unemployment: -0.8 },
    text: "Exportações disparam e o país ganha fôlego fiscal inesperado."
  },
  {
    title: "Escândalo político",
    rarity: "common",
    chance: 0.22,
    effect: { popularity: -10, cash: -15, gdp: -25 },
    text: "Uma denúncia atinge aliados e desgasta sua coalizão."
  },
  {
    title: "Safra recorde",
    rarity: "common",
    chance: 0.24,
    effect: { gdp: 80, inflation: -0.8, popularity: 2, cash: 20 },
    text: "A produção agrícola surpreende e ajuda a reduzir preços."
  },
  {
    title: "Crise energética",
    rarity: "common",
    chance: 0.18,
    effect: { inflation: 1.7, gdp: -55, popularity: -3, cash: -20, unemployment: 0.5 },
    text: "A conta de luz sobe e empresas reduzem ritmo de produção."
  }
];

const SOUND_IDS = {
  positive: "goodSound",
  negative: "badSound"
};

const state = {
  year: 1,
  maxYears: 4,
  difficulty: "normal",
  gameOver: false,
  stats: {},
  previousStats: {},
  currentDecisions: [],
  selectedAnswers: {},
  pendingEffects: [],
  negativeCashStreak: 0,
  timeline: [],
  news: [],
  history: {
    gdp: [],
    inflation: [],
    popularity: []
  }
};

const elements = {
  difficultySelect: document.getElementById("difficultySelect"),
  yearLabel: document.getElementById("yearLabel"),
  termProgress: document.getElementById("termProgress"),
  missionText: document.getElementById("missionText"),
  advisorTitle: document.getElementById("advisorTitle"),
  advisorText: document.getElementById("advisorText"),
  advisorMeta: document.getElementById("advisorMeta"),
  advanceYearButton: document.getElementById("advanceYearButton"),
  decisionStatus: document.getElementById("decisionStatus"),
  decisionList: document.getElementById("decisionList"),
  impactSummary: document.getElementById("impactSummary"),
  impactList: document.getElementById("impactList"),
  newsFeed: document.getElementById("newsFeed"),
  latestHeadline: document.getElementById("latestHeadline"),
  timeline: document.getElementById("timeline"),
  endgameOverlay: document.getElementById("endgameOverlay"),
  endgameBadge: document.getElementById("endgameBadge"),
  endgameTitle: document.getElementById("endgameTitle"),
  endgameText: document.getElementById("endgameText"),
  resultGrid: document.getElementById("resultGrid"),
  restartButton: document.getElementById("restartButton"),
  statValues: {
    gdp: document.getElementById("gdpValue"),
    inflation: document.getElementById("inflationValue"),
    popularity: document.getElementById("popularityValue"),
    cash: document.getElementById("cashValue"),
    unemployment: document.getElementById("unemploymentValue")
  },
  statDeltas: {
    gdp: document.getElementById("gdpDelta"),
    inflation: document.getElementById("inflationDelta"),
    popularity: document.getElementById("popularityDelta"),
    cash: document.getElementById("cashDelta"),
    unemployment: document.getElementById("unemploymentDelta")
  },
  hudCards: Array.from(document.querySelectorAll(".hud-card")),
  charts: {
    gdp: document.getElementById("gdpChart"),
    inflation: document.getElementById("inflationChart"),
    popularity: document.getElementById("popularityChart")
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value * 1000000000);
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getCurrentConfig() {
  return DIFFICULTY_SETTINGS[state.difficulty];
}

function playSound(type) {
  const audio = document.getElementById(SOUND_IDS[type]);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function weightedSample(pool, count) {
  const clone = [...pool];
  const selected = [];
  while (clone.length && selected.length < count) {
    const index = Math.floor(Math.random() * clone.length);
    selected.push(clone.splice(index, 1)[0]);
  }
  return selected;
}

function resetState() {
  const config = getCurrentConfig();
  state.year = 1;
  state.gameOver = false;
  state.stats = deepCopy(config.start);
  state.previousStats = deepCopy(config.start);
  state.currentDecisions = [];
  state.selectedAnswers = {};
  state.pendingEffects = [];
  state.negativeCashStreak = 0;
  state.timeline = [];
  state.news = [];
  state.history = {
    gdp: [config.start.gdp],
    inflation: [config.start.inflation],
    popularity: [config.start.popularity]
  };
}

function generateDecisions() {
  const config = getCurrentConfig();
  const amount = config.label === "Fácil" ? 2 : Math.floor(Math.random() * 3) + 1;
  state.currentDecisions = weightedSample(DECISION_POOL, amount);
  state.selectedAnswers = {};
}

function summariseEffects(effect) {
  return Object.entries(effect)
    .filter(([, value]) => Math.abs(value) > 0.01)
    .map(([key, value]) => {
      const labelMap = {
        gdp: "PIB",
        inflation: "Inflação",
        popularity: "Popularidade",
        cash: "Caixa",
        unemployment: "Desemprego"
      };
      const prefix = value > 0 ? "+" : "";
      const suffix = key === "gdp" || key === "cash" ? " bi" : "%";
      return `${labelMap[key]} ${prefix}${value.toFixed(1)}${suffix}`;
    });
}

function buildAdvice(decisions) {
  const stats = state.stats;
  const config = getCurrentConfig();
  const badAdvice = Math.random() < config.badAdviceChance;
  const candidate = decisions[0];
  const options = candidate.options;
  let preferredKey = "yes";

  if (stats.inflation > 10 && options.yes.adviceBias === "growth") {
    preferredKey = "no";
  } else if (stats.cash < 40) {
    preferredKey = options.no.adviceBias === "fiscal" ? "no" : "yes";
  } else if (stats.popularity < 35) {
    preferredKey = options.yes.adviceBias === "social" ? "yes" : preferredKey;
  } else if (stats.unemployment > 11) {
    preferredKey = options.yes.adviceBias === "jobs" || options.yes.adviceBias === "growth" ? "yes" : preferredKey;
  }

  if (badAdvice) preferredKey = preferredKey === "yes" ? "no" : "yes";

  const option = options[preferredKey];
  const trust = badAdvice ? "Confiabilidade política: instável" : "Confiabilidade política: alta";
  const openers = [
    "Minha leitura do momento é direta:",
    "Se eu estivesse na sala de crise agora, diria o seguinte:",
    "O cenário está sensível, então minha sugestão é esta:"
  ];
  const detail = preferredKey === "yes"
    ? `aceitar "${candidate.title}" tende a abrir espaço para ${summariseEffects(option.immediate).slice(0, 2).join(" e ")}.`
    : `resistir a "${candidate.title}" protege áreas críticas, mesmo que o crescimento perca ritmo.`;

  elements.advisorTitle.textContent = badAdvice ? "Ministra Helena em modo arriscado" : "Ministra Helena";
  elements.advisorMeta.textContent = trust;
  elements.advisorText.textContent = `${openers[Math.floor(Math.random() * openers.length)]} ${detail}`;
}

function renderDecisions() {
  elements.decisionList.innerHTML = "";
  state.currentDecisions.forEach((decision) => {
    const answered = Boolean(state.selectedAnswers[decision.id]);
    const card = document.createElement("article");
    card.className = `decision-card ${answered ? "answered" : ""}`;
    const tags = decision.tags.map((tag) => `<span class="news-tag">${tag}</span>`).join("");
    card.innerHTML = `
      <div>${tags}</div>
      <h3>${decision.title}</h3>
      <p>${decision.summary}</p>
      <div class="option-row">
        <button class="option-btn ${state.selectedAnswers[decision.id] === "yes" ? "active" : ""}" data-decision="${decision.id}" data-option="yes">${decision.options.yes.label}</button>
        <button class="option-btn ${state.selectedAnswers[decision.id] === "no" ? "active" : ""}" data-decision="${decision.id}" data-option="no">${decision.options.no.label}</button>
      </div>
    `;
    elements.decisionList.appendChild(card);
  });

  elements.decisionList.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.gameOver) return;
      state.selectedAnswers[button.dataset.decision] = button.dataset.option;
      playSound("positive");
      renderDecisions();
      renderPendingSummary();
    });
  });

  elements.decisionStatus.textContent = `${Object.keys(state.selectedAnswers).length} de ${state.currentDecisions.length} respondidas`;
}

function renderPendingSummary() {
  const answered = state.currentDecisions.filter((decision) => state.selectedAnswers[decision.id]);
  if (!answered.length) {
    elements.impactSummary.textContent = "Nenhuma decisão tomada neste ano.";
    elements.impactList.innerHTML = "";
    return;
  }

  const aggregate = { gdp: 0, inflation: 0, popularity: 0, cash: 0, unemployment: 0 };
  answered.forEach((decision) => {
    const selected = decision.options[state.selectedAnswers[decision.id]];
    Object.entries(selected.immediate).forEach(([key, value]) => {
      aggregate[key] += value;
    });
    Object.entries(selected.delayed).forEach(([key, value]) => {
      aggregate[key] += value * 0.45;
    });
  });

  elements.impactSummary.textContent = "Se você avançar agora, estes são os sinais mais prováveis do próximo fechamento anual.";
  elements.impactList.innerHTML = "";
  summariseEffects(aggregate).forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    elements.impactList.appendChild(item);
  });
}

function applyEffect(effect, multiplier = 1) {
  Object.entries(effect).forEach(([key, value]) => {
    state.stats[key] += value * multiplier;
  });
}

function queueDelayedEffects(decision, optionKey) {
  state.pendingEffects.push({
    source: decision.title,
    effect: decision.options[optionKey].delayed
  });
}

function applyPendingEffects() {
  if (!state.pendingEffects.length) return [];
  const effectsToApply = [...state.pendingEffects];
  state.pendingEffects = [];
  effectsToApply.forEach((entry) => applyEffect(entry.effect));
  return effectsToApply;
}

function applyAnnualDrift() {
  const config = getCurrentConfig();
  const stats = state.stats;
  const multiplier = config.driftMultiplier + (state.year - 1) * 0.08;
  stats.cash += (stats.gdp - 2200) * 0.03;
  stats.cash -= Math.max(0, 8 - stats.inflation) * 3;
  stats.popularity += (stats.gdp - 2200) * 0.008;
  stats.popularity -= Math.max(0, stats.inflation - 8) * 1.2 * multiplier;
  stats.popularity -= Math.max(0, state.negativeCashStreak - 1) * 3;
  stats.unemployment += (stats.inflation - 7) * 0.16 * multiplier;
  stats.unemployment -= (stats.gdp - 2200) * 0.004;
  stats.inflation += Math.max(0, 130 - stats.cash) * 0.006 * multiplier;
  stats.inflation -= Math.max(0, stats.unemployment - 12) * 0.08;
  stats.gdp += (stats.popularity - 50) * 2.4 - Math.max(0, stats.inflation - 10) * 18;
}

function rollRandomEvents() {
  const config = getCurrentConfig();
  const activated = [];
  RANDOM_EVENTS.forEach((event) => {
    const adjustedChance = event.chance * (event.rarity === "rare" ? config.shockMultiplier * 0.95 : config.shockMultiplier);
    if (Math.random() < adjustedChance) {
      applyEffect(event.effect, config.shockMultiplier);
      activated.push(event);
    }
  });
  return activated.slice(0, 2);
}

function normalizeStats() {
  state.stats.gdp = clamp(state.stats.gdp, 1200, 4200);
  state.stats.inflation = clamp(state.stats.inflation, 0, 40);
  state.stats.popularity = clamp(state.stats.popularity, 0, 100);
  state.stats.cash = clamp(state.stats.cash, -600, 700);
  state.stats.unemployment = clamp(state.stats.unemployment, 2, 30);
}

function buildIndicatorState(stat, value) {
  if (stat === "gdp") return value >= 2700 ? "good" : value >= 2200 ? "warn" : "bad";
  if (stat === "inflation") return value <= 8 ? "good" : value <= 14 ? "warn" : "bad";
  if (stat === "popularity") return value >= 55 ? "good" : value >= 35 ? "warn" : "bad";
  if (stat === "cash") return value >= 120 ? "good" : value >= 0 ? "warn" : "bad";
  if (stat === "unemployment") return value <= 7 ? "good" : value <= 11 ? "warn" : "bad";
  return "warn";
}

function trendLabel(delta, stat) {
  if (Math.abs(delta) < 0.05) return "Estável";
  const signal = delta > 0 ? "+" : "";
  const suffix = stat === "gdp" || stat === "cash" ? " bi" : "%";
  return `${signal}${delta.toFixed(1)}${suffix}`;
}

function renderHud() {
  const stats = state.stats;
  const prev = state.previousStats;
  elements.statValues.gdp.textContent = formatCurrency(stats.gdp);
  elements.statValues.inflation.textContent = formatPercent(stats.inflation);
  elements.statValues.popularity.textContent = formatPercent(stats.popularity);
  elements.statValues.cash.textContent = formatCurrency(stats.cash);
  elements.statValues.unemployment.textContent = formatPercent(stats.unemployment);

  Object.keys(elements.statDeltas).forEach((key) => {
    elements.statDeltas[key].textContent = trendLabel(stats[key] - prev[key], key);
  });

  elements.hudCards.forEach((card) => {
    const key = card.dataset.stat;
    card.classList.remove("good", "warn", "bad", "flash");
    card.classList.add(buildIndicatorState(key, stats[key]));
    void card.offsetWidth;
    card.classList.add("flash");
  });
}

function renderYear() {
  elements.yearLabel.textContent = `${state.year} / ${state.maxYears}`;
  elements.termProgress.style.width = `${((state.year - 1) / state.maxYears) * 100}%`;
  elements.missionText.textContent = state.gameOver
    ? "Mandato encerrado."
    : "Você vence ao terminar 4 anos com popularidade acima de 50%, inflação controlada e PIB em crescimento.";
}

function pushTimeline(title, description) {
  state.timeline.unshift({ title, description, year: state.year });
  state.timeline = state.timeline.slice(0, 10);
  elements.timeline.innerHTML = "";
  state.timeline.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.innerHTML = `<strong>Ano ${entry.year}</strong><h3>${entry.title}</h3><p>${entry.description}</p>`;
    elements.timeline.appendChild(item);
  });
}

function addNews(category, headline, body) {
  state.news.unshift({ category, headline, body, year: state.year });
  state.news = state.news.slice(0, 8);
  elements.newsFeed.innerHTML = "";
  state.news.forEach((item) => {
    const card = document.createElement("article");
    card.className = "news-item";
    card.innerHTML = `<span class="news-tag">${item.category} • Ano ${item.year}</span><h3>${item.headline}</h3><p>${item.body}</p>`;
    elements.newsFeed.appendChild(card);
  });
  elements.latestHeadline.textContent = headline;
}

function generateIndicatorNews() {
  const { inflation, popularity, gdp, cash, unemployment } = state.stats;
  if (inflation > 18) {
    addNews("Urgente", "Inflação dispara e população protesta nas ruas", "O preço de alimentos e energia sobe acima do tolerável e desgasta rapidamente o governo.");
  } else if (gdp > 2800 && unemployment < 9) {
    addNews("Economia", "Economia cresce após incentivos e melhora do emprego", "Empresas ampliam contratações e o mercado reage com mais confiança ao novo ciclo.");
  } else if (cash < 0) {
    addNews("Fiscal", "Caixa do governo entra no vermelho e equipe busca reação", "O Tesouro precisa apertar despesas enquanto o Congresso pressiona por mais gastos.");
  } else if (popularity < 35) {
    addNews("Política", "Base política racha após queda de popularidade", "Aliados cobram uma guinada rápida para impedir a erosão do capital político.");
  } else if (unemployment > 13) {
    addNews("Trabalho", "Desemprego sobe e afeta o humor das famílias", "A renda encolhe em várias regiões e prefeitos pedem ação imediata do Planalto.");
  } else {
    addNews("Governo", "Planalto fecha o ano sem grandes rupturas", "A equipe avalia que a situação continua administrável, mas o próximo turno exigirá precisão.");
  }
}

function updateHistory() {
  state.history.gdp.push(state.stats.gdp);
  state.history.inflation.push(state.stats.inflation);
  state.history.popularity.push(state.stats.popularity);
}

function drawLineChart(canvas, values, color, label) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 24;
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = Math.max(max - min, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(32,49,38,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = padding + ((height - padding * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padding + ((width - padding * 2) / Math.max(values.length - 1, 1)) * index;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = color;
  values.forEach((value, index) => {
    const x = padding + ((width - padding * 2) / Math.max(values.length - 1, 1)) * index;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#203126";
  ctx.font = "700 13px Trebuchet MS";
  ctx.fillText(label, padding, 18);
}

function renderCharts() {
  drawLineChart(elements.charts.gdp, state.history.gdp, "#15803d", "PIB");
  drawLineChart(elements.charts.inflation, state.history.inflation, "#c68a18", "Inflação");
  drawLineChart(elements.charts.popularity, state.history.popularity, "#1f4b99", "Popularidade");
}

function evaluateCashStreak() {
  state.negativeCashStreak = state.stats.cash < 0 ? state.negativeCashStreak + 1 : 0;
}

function buildPerformanceSummary() {
  const score =
    (state.stats.gdp - 2000) * 0.03 +
    state.stats.popularity * 1.2 -
    state.stats.inflation * 3 -
    Math.max(0, -state.stats.cash) * 0.08 -
    state.stats.unemployment * 2;
  if (score >= 85) return "alto desempenho";
  if (score >= 55) return "desempenho sólido";
  if (score >= 30) return "desempenho irregular";
  return "desempenho fraco";
}

function openEndgame({ title, text, badge }) {
  state.gameOver = true;
  elements.endgameOverlay.classList.remove("hidden");
  elements.endgameBadge.textContent = badge;
  elements.endgameTitle.textContent = title;
  elements.endgameText.textContent = text;
  elements.resultGrid.innerHTML = "";

  [
    { label: "Tempo no cargo", value: `${state.year} ano(s)` },
    { label: "PIB final", value: formatCurrency(state.stats.gdp) },
    { label: "Desempenho geral", value: buildPerformanceSummary() }
  ].forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-item";
    card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
    elements.resultGrid.appendChild(card);
  });

  renderYear();
  renderDecisions();
}

function checkEndgame() {
  if (state.stats.popularity < 20) {
    openEndgame({
      badge: "Impeachment",
      title: "O Congresso derrubou seu governo",
      text: "Sua popularidade caiu abaixo de 20% e a base política desmoronou antes do fim do mandato."
    });
    playSound("negative");
    return true;
  }
  if (state.stats.inflation > 25) {
    openEndgame({
      badge: "Colapso econômico",
      title: "A inflação saiu do controle",
      text: "Com inflação acima de 25%, o governo perdeu credibilidade e a crise econômica dominou o país."
    });
    playSound("negative");
    return true;
  }
  if (state.negativeCashStreak >= 2) {
    openEndgame({
      badge: "Falência fiscal",
      title: "O caixa do governo entrou em colapso",
      text: "Dois anos seguidos no vermelho destruíram a confiança do mercado e paralisaram a administração."
    });
    playSound("negative");
    return true;
  }
  if (state.year === state.maxYears && state.stats.popularity > 50 && state.stats.inflation < 12 && state.stats.gdp > state.history.gdp[0]) {
    openEndgame({
      badge: "Vitória",
      title: "Mandato concluído com sucesso",
      text: "Você terminou 4 anos com apoio popular, inflação controlada e economia maior do que recebeu."
    });
    playSound("positive");
    return true;
  }
  if (state.year === state.maxYears) {
    openEndgame({
      badge: "Mandato encerrado",
      title: "Você chegou ao fim, mas sem convencer o país",
      text: "O governo sobreviveu aos 4 anos, porém ficou abaixo dos critérios de vitória plena."
    });
    return true;
  }
  return false;
}

function advanceYear() {
  if (state.gameOver) return;
  if (Object.keys(state.selectedAnswers).length !== state.currentDecisions.length) {
    elements.impactSummary.textContent = "Você precisa responder todas as decisões antes de avançar o ano.";
    playSound("negative");
    return;
  }

  state.previousStats = deepCopy(state.stats);
  const pendingApplied = applyPendingEffects();
  const currentChoices = [];

  state.currentDecisions.forEach((decision) => {
    const optionKey = state.selectedAnswers[decision.id];
    const option = decision.options[optionKey];
    applyEffect(option.immediate);
    queueDelayedEffects(decision, optionKey);
    currentChoices.push(`${decision.title} ${optionKey === "yes" ? "Sim" : "Não"}`);
    pushTimeline(decision.title, option.news);
  });

  applyAnnualDrift();
  const yearEvents = rollRandomEvents();
  normalizeStats();
  evaluateCashStreak();
  updateHistory();
  generateIndicatorNews();

  pendingApplied.forEach((entry) => {
    addNews("Efeito tardio", `Consequências de "${entry.source}" chegaram`, "Medidas passadas continuam moldando o humor do mercado e o caixa do governo.");
  });

  yearEvents.forEach((event) => {
    addNews(event.rarity === "rare" ? "Evento raro" : "Evento", event.title, event.text);
    pushTimeline(event.title, event.text);
  });

  playSound(state.stats.popularity >= state.previousStats.popularity || state.stats.gdp >= state.previousStats.gdp ? "positive" : "negative");

  renderHud();
  renderCharts();

  if (checkEndgame()) return;

  addNews(
    "Balanço",
    `Ano ${state.year} encerrado com ${currentChoices.length} decisões estratégicas`,
    `Seu gabinete fechou o ciclo com foco em ${currentChoices.join(", ")}.`
  );

  state.year += 1;
  generateDecisions();
  buildAdvice(state.currentDecisions);
  renderYear();
  renderDecisions();
  renderPendingSummary();
}

function startGame() {
  resetState();
  elements.endgameOverlay.classList.add("hidden");
  generateDecisions();
  buildAdvice(state.currentDecisions);
  renderYear();
  renderHud();
  renderCharts();
  renderDecisions();
  renderPendingSummary();
  addNews("Posse", "Novo governo assume em clima de expectativa", "O país espera crescimento com estabilidade e cobra respostas rápidas do novo presidente.");
  pushTimeline("Posse presidencial", `Mandato iniciado na dificuldade ${getCurrentConfig().label}.`);
}

elements.advanceYearButton.addEventListener("click", advanceYear);
elements.restartButton.addEventListener("click", startGame);
elements.difficultySelect.addEventListener("change", (event) => {
  state.difficulty = event.target.value;
  startGame();
});

startGame();
