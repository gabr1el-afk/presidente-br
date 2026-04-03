const TICKS_PER_SECOND = 20;
const TICKS_PER_MINUTE = 1200;
const TICKS_PER_YEAR = 48000;

let tickAtual = 0;
let jogoRodando = true;
let velocidadeJogo = 1;
let loopId = null;

const GAME_OVER_REASONS = {
  impeachment: {
    badge: "Impeachment",
    title: "O Congresso rompeu com seu governo",
    text: "A popularidade caiu abaixo de 20% e sua base política desmoronou no meio do mandato."
  },
  collapse: {
    badge: "Colapso econômico",
    title: "A inflação saiu do controle",
    text: "A inflação passou de 30% e o país entrou em uma espiral de crise econômica."
  },
  bankruptcy: {
    badge: "Falência fiscal",
    title: "O caixa ficou negativo por tempo demais",
    text: "O Tesouro não conseguiu reagir ao rombo prolongado e a administração perdeu sustentação."
  },
  victory: {
    badge: "Vitória",
    title: "Você concluiu o mandato com sucesso",
    text: "O governo chegou ao fim do mandato com popularidade sólida, inflação controlada e economia maior do que no início."
  },
  finish: {
    badge: "Mandato encerrado",
    title: "Você chegou ao fim do mandato",
    text: "O governo sobreviveu ao relógio, mas não cumpriu todos os critérios de vitória plena."
  }
};

const DIFFICULTIES = {
  medium: {
    label: "Dificuldade média",
    start: { gdp: 2350, inflation: 6.8, popularity: 57, cash: 170, unemployment: 10.5, taxRate: 28 },
    drift: 1,
    eventRate: 1,
    decisionRate: 1
  }
};

const DECISION_LIBRARY = [
  {
    id: "tax-corporate",
    title: "Reduzir impostos para empresas?",
    body: "O setor produtivo promete investir mais se receber um alívio tributário imediato.",
    tags: ["PIB", "Caixa", "Emprego"],
    duration: 5200,
    options: {
      approve: {
        label: "Aprovar",
        immediate: { gdp: 65, cash: -70, unemployment: -0.7, popularity: 2, inflation: 0.2 },
        overTime: { gdp: 0.01, cash: -0.007, popularity: -0.001 },
        impact: "Empresas anunciam expansão, mas a arrecadação sente o golpe."
      },
      reject: {
        label: "Recusar",
        immediate: { cash: 45, popularity: -2, gdp: -18, unemployment: 0.2 },
        overTime: { cash: 0.004, inflation: -0.001 },
        impact: "O mercado critica o governo, mas o caixa respira melhor."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -4, gdp: -10, cash: -20 },
      overTime: { popularity: -0.0015 },
      impact: "A indefinição irritou empresários e a equipe econômica."
    }
  },
  {
    id: "social-programs",
    title: "Expandir programas sociais?",
    body: "Movimentos regionais pressionam por reforço de renda para conter desgaste nas periferias.",
    tags: ["Popularidade", "Caixa", "Inflação"],
    duration: 5600,
    options: {
      approve: {
        label: "Expandir",
        immediate: { popularity: 6, cash: -75, gdp: 30, unemployment: -0.3, inflation: 0.4 },
        overTime: { popularity: 0.005, cash: -0.005, inflation: 0.0012 },
        impact: "A base social reage bem, mas a pressão fiscal aumenta."
      },
      reject: {
        label: "Cortar",
        immediate: { cash: 38, popularity: -6, inflation: -0.1 },
        overTime: { popularity: -0.0035, unemployment: 0.0015 },
        impact: "O caixa melhora, porém a pressão popular sobe."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -5, cash: -10 },
      overTime: { popularity: -0.0018 },
      impact: "A hesitação passou imagem de fraqueza e desorganização."
    }
  },
  {
    id: "imports",
    title: "Abrir importações de alimentos e insumos?",
    body: "A medida pode aliviar preços rapidamente, mas alguns setores industriais prometem protestar.",
    tags: ["Inflação", "PIB", "Indústria"],
    duration: 4800,
    options: {
      approve: {
        label: "Abrir",
        immediate: { inflation: -1.1, gdp: 28, popularity: 1, unemployment: 0.2 },
        overTime: { inflation: -0.0025, gdp: 0.0035, popularity: -0.0015 },
        impact: "Os preços aliviam, mas parte da indústria reclama da concorrência."
      },
      reject: {
        label: "Proteger",
        immediate: { popularity: 1.5, inflation: 0.6, cash: 12 },
        overTime: { inflation: 0.0018, gdp: -0.002 },
        impact: "O discurso protecionista agrada aliados, mas mantém a pressão inflacionária."
      }
    },
    timeoutPenalty: {
      immediate: { inflation: 0.7, popularity: -3 },
      overTime: { inflation: 0.0012 },
      impact: "A demora travou o abastecimento e a inflação ganhou força."
    }
  },
  {
    id: "infrastructure",
    title: "Lançar um pacote de infraestrutura?",
    body: "Governadores pedem obras para destravar logística e reduzir desemprego.",
    tags: ["PIB", "Emprego", "Caixa"],
    duration: 6400,
    options: {
      approve: {
        label: "Investir",
        immediate: { gdp: 50, cash: -90, unemployment: -0.9, popularity: 3, inflation: 0.2 },
        overTime: { gdp: 0.012, unemployment: -0.0025, cash: -0.004 },
        impact: "Obras aceleram a atividade, mas exigem um caixa mais robusto."
      },
      reject: {
        label: "Adiar",
        immediate: { cash: 42, popularity: -2.5, gdp: -20 },
        overTime: { unemployment: 0.0018, gdp: -0.0028 },
        impact: "A responsabilidade fiscal melhora, porém a economia perde tração."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -3, unemployment: 0.3 },
      overTime: { unemployment: 0.0012 },
      impact: "A indecisão travou investimentos e gerou desgaste com governadores."
    }
  },
  {
    id: "fuel-support",
    title: "Subsidiar combustíveis temporariamente?",
    body: "Transportadores ameaçam parar e o preço da energia voltou a subir.",
    tags: ["Inflação", "Caixa", "Popularidade"],
    duration: 4200,
    options: {
      approve: {
        label: "Subsidiar",
        immediate: { inflation: -1.4, popularity: 4, cash: -80, gdp: 16 },
        overTime: { inflation: 0.0015, cash: -0.006 },
        impact: "Você ganha fôlego político, mas o custo fiscal é pesado."
      },
      reject: {
        label: "Segurar caixa",
        immediate: { cash: 24, popularity: -4, inflation: 0.9 },
        overTime: { inflation: 0.0018, popularity: -0.0015 },
        impact: "O caixa agradece, mas as ruas reagem mal."
      }
    },
    timeoutPenalty: {
      immediate: { popularity: -4.5, inflation: 0.5 },
      overTime: { popularity: -0.001 },
      impact: "A falta de resposta elevou o ruído político no setor."
    }
  }
];

const EVENT_LIBRARY = [
  {
    title: "Crise global de crédito",
    rarity: "rara",
    probability: 0.12,
    effect: { gdp: -45, inflation: 0.8, popularity: -2, cash: -18, unemployment: 0.4 },
    news: "Mercados internacionais travam e investidores fogem de risco."
  },
  {
    title: "Boom de exportações",
    rarity: "rara",
    probability: 0.11,
    effect: { gdp: 42, cash: 20, popularity: 1.5, inflation: -0.4, unemployment: -0.3 },
    news: "A demanda externa sobe e dá novo fôlego ao setor produtivo."
  },
  {
    title: "Escândalo político",
    rarity: "comum",
    probability: 0.17,
    effect: { popularity: -5, gdp: -10, cash: -8 },
    news: "Denúncias atingem aliados e aumentam a tensão com o Congresso."
  },
  {
    title: "Safra recorde",
    rarity: "comum",
    probability: 0.18,
    effect: { inflation: -0.6, gdp: 18, popularity: 1, cash: 10 },
    news: "A produção agrícola surpreende e alivia preços relevantes."
  },
  {
    title: "Crise energética",
    rarity: "comum",
    probability: 0.15,
    effect: { inflation: 0.9, gdp: -14, popularity: -1.5, cash: -10 },
    news: "A conta de energia encarece cadeias produtivas e pressiona o governo."
  }
];

const state = {
  config: DIFFICULTIES.medium,
  gameOver: false,
  stats: {},
  previousStats: {},
  history: { gdp: [], inflation: [], popularity: [] },
  activeDecisions: [],
  pendingModifiers: [],
  news: [],
  impacts: [],
  timeline: [],
  lastProcessedTick: 0,
  nextDecisionTick: 2000,
  nextNewsTick: 900,
  nextAdvisorTick: 1200,
  negativeCashTicks: 0
};

const elements = {
  playButton: document.getElementById("playButton"),
  pauseButton: document.getElementById("pauseButton"),
  speedButtons: Array.from(document.querySelectorAll(".speed-btn")),
  clockLabel: document.getElementById("clockLabel"),
  statusLabel: document.getElementById("statusLabel"),
  difficultyTag: document.getElementById("difficultyTag"),
  advisorTitle: document.getElementById("advisorTitle"),
  advisorText: document.getElementById("advisorText"),
  advisorMeta: document.getElementById("advisorMeta"),
  decisionCounter: document.getElementById("decisionCounter"),
  decisionList: document.getElementById("decisionList"),
  impactFeed: document.getElementById("impactFeed"),
  headlineChip: document.getElementById("headlineChip"),
  newsFeed: document.getElementById("newsFeed"),
  timeline: document.getElementById("timeline"),
  endgameOverlay: document.getElementById("endgameOverlay"),
  endgameBadge: document.getElementById("endgameBadge"),
  endgameTitle: document.getElementById("endgameTitle"),
  endgameText: document.getElementById("endgameText"),
  resultGrid: document.getElementById("resultGrid"),
  restartButton: document.getElementById("restartButton"),
  hudCards: Array.from(document.querySelectorAll(".hud-card")),
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
  statDeltas: {
    gdp: document.getElementById("gdpDelta"),
    inflation: document.getElementById("inflationDelta"),
    popularity: document.getElementById("popularityDelta"),
    cash: document.getElementById("cashDelta"),
    unemployment: document.getElementById("unemploymentDelta")
  },
  statStates: {
    gdp: document.getElementById("gdpState"),
    inflation: document.getElementById("inflationState"),
    popularity: document.getElementById("popularityState"),
    cash: document.getElementById("cashState"),
    unemployment: document.getElementById("unemploymentState")
  },
  charts: {
    gdp: document.getElementById("gdpChart"),
    inflation: document.getElementById("inflationChart"),
    popularity: document.getElementById("popularityChart")
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrencyBillions(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value * 1000000000);
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function currentYear() {
  return Math.floor(tickAtual / TICKS_PER_YEAR) + 1;
}

function setRunningStatus() {
  elements.statusLabel.textContent = jogoRodando ? `Rodando em ${velocidadeJogo}x` : "Pausado";
}

function initGame() {
  tickAtual = 0;
  jogoRodando = true;
  velocidadeJogo = 1;
  state.gameOver = false;
  state.stats = deepCopy(state.config.start);
  state.previousStats = deepCopy(state.config.start);
  state.history = {
    gdp: [state.stats.gdp],
    inflation: [state.stats.inflation],
    popularity: [state.stats.popularity]
  };
  state.activeDecisions = [];
  state.pendingModifiers = [];
  state.news = [];
  state.impacts = [];
  state.timeline = [];
  state.lastProcessedTick = 0;
  state.nextDecisionTick = 1800;
  state.nextNewsTick = 900;
  state.nextAdvisorTick = 1200;
  state.negativeCashTicks = 0;
  elements.endgameOverlay.classList.add("hidden");
  elements.speedButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.speed) === 1);
  });
  elements.difficultyTag.textContent = state.config.label;
  addNews("Posse", "Novo governo assume sob pressão", "O país entra em compasso de espera enquanto o mercado testa sua capacidade de reagir rápido.");
  addTimeline("Posse presidencial", "O mandato começou com economia estável, mas com margem curta para erros.");
  addImpact("neutral", "Simulação iniciada", "O relógio político já está em movimento e o país reagirá continuamente.");
  updateAdvisor();
  renderAll();
}

function startLoop() {
  if (loopId) {
    clearInterval(loopId);
  }
  loopId = setInterval(gameLoop, 50);
}

function gameLoop() {
  if (!jogoRodando || state.gameOver) {
    return;
  }

  tickAtual += velocidadeJogo;
  processTicks(tickAtual - state.lastProcessedTick);
  state.lastProcessedTick = tickAtual;
  renderLiveOnly();
}

function processTicks(deltaTicks) {
  if (deltaTicks <= 0) {
    return;
  }

  for (let processed = 0; processed < deltaTicks; processed += 1) {
    const currentTick = tickAtual - deltaTicks + processed + 1;
    applyContinuousSimulation();
    processDecisionTimeouts(currentTick);

    if (currentTick % 100 === 0) {
      applyBatchEconomy();
      checkPassiveWarnings();
    }

    if (currentTick % 400 === 0) {
      updateHistory();
    }

    if (currentTick >= state.nextDecisionTick) {
      spawnDecision(currentTick);
      state.nextDecisionTick = currentTick + nextDecisionInterval();
    }

    if (currentTick >= state.nextNewsTick) {
      generateNewsFromIndicators();
      state.nextNewsTick = currentTick + 1400;
    }

    if (currentTick >= state.nextAdvisorTick) {
      updateAdvisor();
      state.nextAdvisorTick = currentTick + 1800;
    }

    if (currentTick % 2200 === 0) {
      rollRandomEvent();
    }

    if (currentTick % 200 === 0) {
      checkGameOver();
      if (state.gameOver) {
        break;
      }
    }
  }
}

function applyContinuousSimulation() {
  const stats = state.stats;

  if (stats.inflation > 9) {
    stats.popularity -= 0.0018 * (stats.inflation - 9);
  }
  if (stats.taxRate > 30) {
    stats.gdp -= 0.0012 * (stats.taxRate - 30);
  }
  if (stats.gdp > 2400) {
    stats.popularity += 0.0012 * ((stats.gdp - 2400) / 200);
  }
  if (stats.unemployment > 10) {
    stats.popularity -= 0.0016 * (stats.unemployment - 10);
  }
  if (stats.cash < 80) {
    stats.inflation += 0.0012 * ((80 - stats.cash) / 80);
  }

  applyModifiers();
  normalizeStats();
}

function applyModifiers() {
  state.pendingModifiers.forEach((modifier) => {
    Object.entries(modifier.effect).forEach(([key, value]) => {
      state.stats[key] += value;
    });
    modifier.remainingTicks -= 1;
  });
  state.pendingModifiers = state.pendingModifiers.filter((modifier) => modifier.remainingTicks > 0);
}

function applyBatchEconomy() {
  const stats = state.stats;
  state.previousStats = deepCopy(state.stats);
  stats.cash += (stats.gdp - 2300) * 0.0018;
  stats.cash -= Math.max(0, stats.inflation - 8) * 0.22;
  stats.unemployment -= (stats.gdp - 2300) * 0.00018;
  stats.unemployment += Math.max(0, stats.inflation - 10) * 0.015;
  stats.gdp += (stats.popularity - 50) * 0.06;
  stats.gdp -= Math.max(0, stats.inflation - 12) * 0.28;

  if (stats.cash < 0) {
    state.negativeCashTicks += 100;
  } else {
    state.negativeCashTicks = Math.max(0, state.negativeCashTicks - 150);
  }

  normalizeStats();
}

function normalizeStats() {
  state.stats.gdp = clamp(state.stats.gdp, 1200, 5200);
  state.stats.inflation = clamp(state.stats.inflation, 0, 45);
  state.stats.popularity = clamp(state.stats.popularity, 0, 100);
  state.stats.cash = clamp(state.stats.cash, -600, 900);
  state.stats.unemployment = clamp(state.stats.unemployment, 2, 30);
  state.stats.taxRate = clamp(state.stats.taxRate, 12, 42);
}

function nextDecisionInterval() {
  return Math.floor(5200 + Math.random() * 1800);
}

function spawnDecision(currentTick) {
  if (state.activeDecisions.length >= 3) {
    return;
  }
  const template = deepCopy(DECISION_LIBRARY[Math.floor(Math.random() * DECISION_LIBRARY.length)]);
  template.spawnTick = currentTick;
  template.deadlineTick = currentTick + template.duration;
  state.activeDecisions.unshift(template);
  state.activeDecisions = state.activeDecisions.slice(0, 3);
  addTimeline("Nova decisão", template.title);
  addNews("Gabinete", `Nova decisão urgente: ${template.title}`, "O relógio está correndo e a omissão gera penalidade automática.");
}

function processDecisionTimeouts(currentTick) {
  const expired = state.activeDecisions.filter((decision) => currentTick >= decision.deadlineTick);
  if (!expired.length) {
    return;
  }

  expired.forEach((decision) => {
    applyOutcome(decision.timeoutPenalty, `${decision.title} expirou`, "negative", true);
    addNews("Crise", `Você perdeu o prazo: ${decision.title}`, decision.timeoutPenalty.impact);
  });

  state.activeDecisions = state.activeDecisions.filter((decision) => currentTick < decision.deadlineTick);
}

function applyOutcome(outcome, title, tone, isPenalty = false) {
  state.previousStats = deepCopy(state.stats);
  Object.entries(outcome.immediate).forEach(([key, value]) => {
    state.stats[key] += value;
  });

  if (outcome.overTime) {
    state.pendingModifiers.push({
      effect: outcome.overTime,
      remainingTicks: 3600
    });
  }

  normalizeStats();
  addImpact(tone, title, outcome.impact);
  addTimeline(title, outcome.impact);
  if (!isPenalty) {
    generateFeedbackNews(title, outcome.impact, tone);
  }
}

function answerDecision(decisionId, optionKey) {
  if (!jogoRodando || state.gameOver) {
    return;
  }

  const decision = state.activeDecisions.find((item) => item.id === decisionId && item.deadlineTick > tickAtual);
  if (!decision) {
    return;
  }

  const outcome = decision.options[optionKey];
  applyOutcome(outcome, `${decision.title} (${outcome.label})`, optionKey === "approve" ? "positive" : "neutral");
  state.activeDecisions = state.activeDecisions.filter((item) => item !== decision);
  updateAdvisor();
  renderAll();
}

function generateFeedbackNews(title, text, tone) {
  const category = tone === "positive" ? "Mercado" : tone === "negative" ? "Crise" : "Política";
  addNews(category, title, text);
}

function rollRandomEvent() {
  const event = EVENT_LIBRARY[Math.floor(Math.random() * EVENT_LIBRARY.length)];
  if (Math.random() > event.probability) {
    return;
  }

  state.previousStats = deepCopy(state.stats);
  Object.entries(event.effect).forEach(([key, value]) => {
    state.stats[key] += value;
  });
  normalizeStats();
  addNews(event.rarity === "rara" ? "Evento raro" : "Evento", event.title, event.news);
  addTimeline(event.title, event.news);
  addImpact(event.effect.gdp >= 0 || event.effect.popularity >= 0 ? "positive" : "negative", event.title, event.news);
}

function generateNewsFromIndicators() {
  const { inflation, popularity, gdp, cash, unemployment } = state.stats;
  if (inflation > 22) {
    addNews("Urgente", "Inflação dispara no varejo", "Consumidores sentem o choque dos preços e a pressão política sobe rapidamente.");
  } else if (popularity < 30) {
    addNews("Política", "Protestos se espalham contra o governo", "A queda de apoio popular já produz ruído nas ruas e no Congresso.");
  } else if (cash < 0) {
    addNews("Fiscal", "Tesouro opera no vermelho", "O governo trabalha sob forte tensão para recompor caixa.");
  } else if (gdp > 2800 && unemployment < 9) {
    addNews("Economia", "PIB cresce e o emprego reage", "A atividade acelera e parte do mercado começa a rever projeções.");
  } else if (unemployment > 14) {
    addNews("Trabalho", "Desemprego alto pressiona o Planalto", "Famílias sentem queda de renda e cobram ação imediata.");
  } else {
    addNews("Monitor", "Mercado observa o próximo movimento", "O país segue em compasso tenso, aguardando novas medidas do governo.");
  }
}

function checkPassiveWarnings() {
  if (state.stats.inflation > 18) {
    addImpact("negative", "Inflação em alerta", "A perda de controle dos preços está corroendo apoio popular em tempo real.");
  }
  if (state.stats.cash < 40) {
    addImpact("negative", "Caixa apertado", "O governo perdeu margem fiscal e qualquer erro agora pesa mais.");
  }
}

function updateAdvisor() {
  const stats = state.stats;
  const openers = [
    "Minha leitura do momento:",
    "No radar do gabinete:",
    "Se quiser sobreviver politicamente:"
  ];

  let message = "mantenha inflação e caixa sob vigilância, porque eles disparam crises em cadeia.";
  if (stats.inflation > 16) {
    message = "controle preços antes de tentar crescer mais, ou a popularidade vai derreter.";
  } else if (stats.cash < 60) {
    message = "reconstrua o caixa com alguma disciplina, porque o déficit prolongado derruba tudo ao redor.";
  } else if (stats.unemployment > 12) {
    message = "priorize decisões que acelerem investimento e emprego, mesmo com algum custo político.";
  } else if (stats.popularity < 35) {
    message = "qualquer atraso agora vira combustível para a oposição; responda rápido às decisões ativas.";
  } else if (state.activeDecisions.length > 1) {
    message = "há decisões demais abertas; resolva primeiro as com menos tempo restante.";
  }

  elements.advisorText.textContent = `${openers[Math.floor(Math.random() * openers.length)]} ${message}`;
  elements.advisorMeta.textContent = `Decisões abertas: ${state.activeDecisions.length} • Velocidade ${velocidadeJogo}x`;
}

function checkGameOver() {
  if (state.stats.popularity < 20) {
    return endGame("impeachment");
  }
  if (state.stats.inflation > 30) {
    return endGame("collapse");
  }
  if (state.negativeCashTicks >= 7200) {
    return endGame("bankruptcy");
  }
  if (tickAtual >= TICKS_PER_YEAR * 4) {
    if (state.stats.popularity > 50 && state.stats.inflation < 12 && state.stats.gdp > state.config.start.gdp) {
      return endGame("victory");
    }
    return endGame("finish");
  }
  return false;
}

function endGame(reasonKey) {
  const reason = GAME_OVER_REASONS[reasonKey];
  state.gameOver = true;
  jogoRodando = false;
  setRunningStatus();
  elements.endgameOverlay.classList.remove("hidden");
  elements.endgameBadge.textContent = reason.badge;
  elements.endgameTitle.textContent = reason.title;
  elements.endgameText.textContent = reason.text;
  elements.resultGrid.innerHTML = "";

  const summary = [
    { label: "Tempo de governo", value: `${currentYear()} ano(s)` },
    { label: "Tick final", value: tickAtual.toLocaleString("pt-BR") },
    { label: "PIB final", value: formatCurrencyBillions(state.stats.gdp) }
  ];

  summary.forEach((item) => {
    const node = document.createElement("div");
    node.className = "result-item";
    node.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
    elements.resultGrid.appendChild(node);
  });

  renderAll();
  return true;
}

function addImpact(tone, title, text) {
  state.impacts.unshift({ tone, title, text, tick: tickAtual });
  state.impacts = state.impacts.slice(0, 8);
}

function addNews(category, title, text) {
  state.news.unshift({ category, title, text, tick: tickAtual });
  state.news = state.news.slice(0, 10);
}

function addTimeline(title, text) {
  state.timeline.unshift({ title, text, tick: tickAtual });
  state.timeline = state.timeline.slice(0, 10);
}

function updateHistory() {
  state.history.gdp.push(state.stats.gdp);
  state.history.inflation.push(state.stats.inflation);
  state.history.popularity.push(state.stats.popularity);
  if (state.history.gdp.length > 40) {
    state.history.gdp.shift();
    state.history.inflation.shift();
    state.history.popularity.shift();
  }
}

function statConfig(stat) {
  if (stat === "gdp") {
    return {
      range: [1200, 5200],
      state: state.stats.gdp > 2800 ? "good" : state.stats.gdp > 2200 ? "warn" : "bad",
      text: state.stats.gdp > 2800 ? "Crescendo" : state.stats.gdp > 2200 ? "Estável" : "Frágil",
      color: state.stats.gdp > 2800 ? "var(--good)" : state.stats.gdp > 2200 ? "var(--warn)" : "var(--bad)"
    };
  }
  if (stat === "inflation") {
    return {
      range: [0, 35],
      state: state.stats.inflation < 8 ? "good" : state.stats.inflation < 15 ? "warn" : "bad",
      text: state.stats.inflation < 8 ? "Controlada" : state.stats.inflation < 15 ? "Pressão" : "Crítica",
      color: state.stats.inflation < 8 ? "var(--good)" : state.stats.inflation < 15 ? "var(--warn)" : "var(--bad)"
    };
  }
  if (stat === "popularity") {
    return {
      range: [0, 100],
      state: state.stats.popularity > 55 ? "good" : state.stats.popularity > 35 ? "warn" : "bad",
      text: state.stats.popularity > 55 ? "Apoio forte" : state.stats.popularity > 35 ? "Oscilando" : "Risco político",
      color: state.stats.popularity > 55 ? "var(--good)" : state.stats.popularity > 35 ? "var(--warn)" : "var(--bad)"
    };
  }
  if (stat === "cash") {
    return {
      range: [-300, 900],
      state: state.stats.cash > 150 ? "good" : state.stats.cash > 0 ? "warn" : "bad",
      text: state.stats.cash > 150 ? "Folga fiscal" : state.stats.cash > 0 ? "Apertado" : "No vermelho",
      color: state.stats.cash > 150 ? "var(--good)" : state.stats.cash > 0 ? "var(--warn)" : "var(--bad)"
    };
  }
  return {
    range: [2, 30],
    state: state.stats.unemployment < 8 ? "good" : state.stats.unemployment < 12 ? "warn" : "bad",
    text: state.stats.unemployment < 8 ? "Baixo" : state.stats.unemployment < 12 ? "Sensível" : "Alto",
    color: state.stats.unemployment < 8 ? "var(--good)" : state.stats.unemployment < 12 ? "var(--warn)" : "var(--bad)"
  };
}

function deltaText(current, previous, isMoney = false) {
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) {
    return "Estável";
  }
  const prefix = delta > 0 ? "+" : "";
  const suffix = isMoney ? " bi" : "%";
  return `${prefix}${delta.toFixed(1)}${suffix}`;
}

function renderHud() {
  elements.statValues.gdp.textContent = formatCurrencyBillions(state.stats.gdp);
  elements.statValues.inflation.textContent = formatPercent(state.stats.inflation);
  elements.statValues.popularity.textContent = formatPercent(state.stats.popularity);
  elements.statValues.cash.textContent = formatCurrencyBillions(state.stats.cash);
  elements.statValues.unemployment.textContent = formatPercent(state.stats.unemployment);

  Object.keys(elements.statValues).forEach((stat) => {
    const config = statConfig(stat);
    const [min, max] = config.range;
    const ratio = ((state.stats[stat] - min) / (max - min)) * 100;
    const card = elements.hudCards.find((item) => item.dataset.stat === stat);
    card.classList.remove("good", "warn", "bad", "flash");
    card.classList.add(config.state);
    void card.offsetWidth;
    card.classList.add("flash");
    elements.statBars[stat].style.width = `${clamp(ratio, 0, 100)}%`;
    elements.statBars[stat].style.background = `linear-gradient(90deg, ${config.color}, ${config.color})`;
    elements.statStates[stat].textContent = config.text;
  });

  elements.statDeltas.gdp.textContent = deltaText(state.stats.gdp, state.previousStats.gdp, true);
  elements.statDeltas.inflation.textContent = deltaText(state.stats.inflation, state.previousStats.inflation);
  elements.statDeltas.popularity.textContent = deltaText(state.stats.popularity, state.previousStats.popularity);
  elements.statDeltas.cash.textContent = deltaText(state.stats.cash, state.previousStats.cash, true);
  elements.statDeltas.unemployment.textContent = deltaText(state.stats.unemployment, state.previousStats.unemployment);
}

function renderClock() {
  elements.clockLabel.textContent = `Ano ${currentYear()} • Tick ${tickAtual.toLocaleString("pt-BR")}`;
  setRunningStatus();
}

function renderDecisions() {
  elements.decisionCounter.textContent = `${state.activeDecisions.length} ativa(s)`;
  elements.decisionList.innerHTML = "";

  if (!state.activeDecisions.length) {
    const empty = document.createElement("div");
    empty.className = "impact-item neutral";
    empty.innerHTML = "<h3>Sem decisões abertas</h3><p>O gabinete está quieto por enquanto, mas o relógio continuará trazendo pressão.</p>";
    elements.decisionList.appendChild(empty);
    return;
  }

  state.activeDecisions.forEach((decision) => {
    const remaining = Math.max(0, decision.deadlineTick - tickAtual);
    const expiring = remaining < 1200;
    const card = document.createElement("article");
    card.className = `decision-card ${expiring ? "expiring" : ""}`;
    const tags = decision.tags.map((tag) => `<span class="decision-tag">${tag}</span>`).join("");
    card.innerHTML = `
      <div class="decision-tags">${tags}</div>
      <h3>${decision.title}</h3>
      <p>${decision.body}</p>
      <div class="decision-footer">
        <span class="decision-deadline">Prazo: ${remaining.toLocaleString("pt-BR")} ticks</span>
        <div class="decision-actions">
          <button class="decision-option" data-id="${decision.id}" data-option="approve">${decision.options.approve.label}</button>
          <button class="decision-option" data-id="${decision.id}" data-option="reject">${decision.options.reject.label}</button>
        </div>
      </div>
    `;
    elements.decisionList.appendChild(card);
  });

  elements.decisionList.querySelectorAll(".decision-option").forEach((button) => {
    button.addEventListener("click", () => {
      answerDecision(button.dataset.id, button.dataset.option);
    });
  });
}

function renderImpacts() {
  elements.impactFeed.innerHTML = "";
  state.impacts.forEach((impact) => {
    const item = document.createElement("article");
    item.className = `impact-item ${impact.tone}`;
    item.innerHTML = `<h3>${impact.title}</h3><p>${impact.text}</p><strong>Tick ${impact.tick.toLocaleString("pt-BR")}</strong>`;
    elements.impactFeed.appendChild(item);
  });
}

function renderNews() {
  elements.newsFeed.innerHTML = "";
  const headline = state.news[0];
  elements.headlineChip.textContent = headline ? headline.title : "Mercado observando";
  state.news.forEach((news) => {
    const item = document.createElement("article");
    item.className = "news-item";
    item.innerHTML = `<span class="eyebrow">${news.category} • Tick ${news.tick.toLocaleString("pt-BR")}</span><h3>${news.title}</h3><p>${news.text}</p>`;
    elements.newsFeed.appendChild(item);
  });
}

function renderTimeline() {
  elements.timeline.innerHTML = "";
  state.timeline.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.innerHTML = `<span class="eyebrow">Tick ${entry.tick.toLocaleString("pt-BR")}</span><h3>${entry.title}</h3><p>${entry.text}</p>`;
    elements.timeline.appendChild(item);
  });
}

function drawLineChart(canvas, values, color, label) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 24;
  const min = Math.min(...values) * 0.96;
  const max = Math.max(...values) * 1.04;
  const range = Math.max(max - min, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(31, 47, 36, 0.12)";
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
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
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

  ctx.fillStyle = "#1f2f24";
  ctx.font = "700 13px Segoe UI";
  ctx.fillText(label, padding, 18);
}

function renderCharts() {
  drawLineChart(elements.charts.gdp, state.history.gdp, "#148046", "PIB");
  drawLineChart(elements.charts.inflation, state.history.inflation, "#c98a19", "Inflação");
  drawLineChart(elements.charts.popularity, state.history.popularity, "#1c4f99", "Popularidade");
}

function renderLiveOnly() {
  renderClock();
  renderHud();
  renderDecisions();
  renderCharts();
}

function renderAll() {
  renderClock();
  renderHud();
  renderDecisions();
  renderImpacts();
  renderNews();
  renderTimeline();
  renderCharts();
}

elements.playButton.addEventListener("click", () => {
  if (!state.gameOver) {
    jogoRodando = true;
    setRunningStatus();
  }
});

elements.pauseButton.addEventListener("click", () => {
  jogoRodando = false;
  setRunningStatus();
});

elements.speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    velocidadeJogo = Number(button.dataset.speed);
    elements.speedButtons.forEach((item) => item.classList.toggle("active", item === button));
    setRunningStatus();
  });
});

elements.restartButton.addEventListener("click", () => {
  initGame();
});

initGame();
startLoop();
