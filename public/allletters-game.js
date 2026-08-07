// allletters-game.js
// Client-side interactive game: submit country names to collect all a-z letters.

const COUNTRY_LIST = (function(){
  const orig = [
"Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
"Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas",
"Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
"Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
"Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad",
"Chile","China","Colombia","Comoros","Republic of the Congo","Democratic Republic of the Congo",
"Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic",
"East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
"Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala",
"Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran",
"Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
"Kiribati","North Korea","South Korea","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon",
"Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","North Macedonia","Madagascar",
"Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius",
"Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
"Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
"Norway","Oman","Pakistan","Palestine","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
"Poland","Portugal","Qatar","Romania","Russia","Rwanda","St Kitts and Nevis","St Lucia","Saint Vincent and the Grenadines",
"Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone",
"Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain",
"Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
"Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates",
"United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam",
"Yemen","Zambia","Zimbabwe"
  ];
  if (typeof window !== 'undefined'){
    window._alfa_country_display = window._alfa_country_display || {};
    for (const s of orig) window._alfa_country_display[s.toLowerCase()] = s;
    window._alfa_country_list = orig.map(s => s.toLowerCase());
    return window._alfa_country_list;
  }
  return orig.map(s => s.toLowerCase());
})();

const ALPH = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LETTER_SCORES = Object.freeze({
  a: 100, b: 300, c: 300, d: 200, e: 100, f: 500, g: 300, h: 300, i: 100, j: 500,
  k: 400, l: 200, m: 200, n: 100, o: 100, p: 300, q: 500, r: 100, s: 200, t: 200,
  u: 200, v: 400, w: 400, x: 500, y: 400, z: 400
});

// Game sequencing alphabet: ignore 'w' and 'x' as starting letters per alfaquest rule
const GAME_ALPH = ALPH.filter(c => c !== 'w' && c !== 'x');
const IGNORED = ['w','x'];

function isAlfaMode(){
  return (typeof window !== 'undefined') && window.ALFAQUEST_MODE === true;
}

function isEasyAlfafillMode(){
  return !isAlfaMode() && (typeof window !== 'undefined') && window.ALFAFILL_EASY_MODE === true;
}

function isSequentialAlfafillMode(){
  return !isAlfaMode() && (typeof window !== 'undefined') && window.ALFAFILL_SEQUENCE_MODE === true;
}

function isSequentialFullCollectMode(){
  return !isAlfaMode() && (typeof window !== 'undefined') && window.ALFAFILL_SEQUENCE_FULL_MODE === true;
}

function isNormalAlfafillMode(){
  return !isAlfaMode() && !isEasyAlfafillMode() && !isSequentialAlfafillMode() && !isSequentialFullCollectMode();
}

function normalize(s){ return String(s||'').trim().toLowerCase(); }

// Optional override for API host when pages and worker are on different origins.
// Example: window.ALFA_API_BASE = 'https://alfaquest-worker.judejs.workers.dev'
const API_BASE = (typeof window !== 'undefined' && typeof window.ALFA_API_BASE === 'string')
  ? window.ALFA_API_BASE.replace(/\/+$/, '')
  : '';
const ALFA_HIGH_SCORE_KEY = 'alfaquest_high_score_v6';
const ALFA_SCORING_VERSION = 'v6_letter_weighted_position';
const ALFA_RATING_TIERS = Object.freeze([
  { min: 35500, label: 'Legendary' },
  { min: 34000, label: 'Excellent' },
  { min: 33500, label: 'Very good' },
  { min: 33000, label: 'Good' },
  { min: 31500, label: 'Fair' },
  { min: 0, label: 'Completed' }
]);
const ALFA_POSITION_LETTER_DIVISOR = 4;
const ALFA_TIME_TARGET_PER_MOVE_SECONDS = 12;
const ALFA_TIME_TARGET_MIN_SECONDS = 120;
const ALFA_TIME_FACTOR_MIN = 0.90;
const ALFA_TIME_FACTOR_MAX = 1.10;
const ALFA_LETTER_SCORE_MULTIPLIER = 2;
const ALFA_WEIGHT_LETTERS = 0.60;
const ALFA_WEIGHT_TIMING = 0.40;
const ALFA_SPEED_BASELINE_CPS = 2.0;
const ALFA_SPEED_BONUS_SCALE = 12;
const ALFA_SPEED_BONUS_PER_COUNTRY_CAP = 15;
const ALFA_SPEED_BONUS_TOTAL_CAP = 180;
const ALFA_TIMING_SPEED_SCORE_FACTOR = 100;

function apiUrl(path){
  const p = path.startsWith('/') ? path : ('/' + path);
  return API_BASE + p;
}

// Local game state
let usedLetters = new Set();
let submitted = [];
let sessionName = null;
let usedStarts = new Set();
let gameOver = false;
let completionShown = false;
let completionResetTimer = null;
let gameOverResetTimer = null;
let submissionScores = [];
let scoreDisplayEnabled = false;
let highScoreRecord = null;
let runStartedAtMs = null;
let runEndedAtMs = null;
let lastRenderedRequiredLetter = null;
let liveScoreTimerId = null;
let speedBonuses = [];
let finalScoreDeltas = [];
let currentEntryStartedAtMs = null;
let lastMilestonePct = 0;

function isAlfaScoringMode(){
  return isAlfaMode();
}

function getPositionBonus(firstCh, moveNumber){
  if (moveNumber <= 0) return 0;
  const tier = (firstCh && LETTER_SCORES[firstCh]) ? LETTER_SCORES[firstCh] : 100;
  return Math.round(moveNumber * tier / ALFA_POSITION_LETTER_DIVISOR);
}

function scoreWord(word, moveNumber){
  const n = normalize(word);
  const firstCh = n.charAt(0);
  const firstLetterScore = (firstCh && LETTER_SCORES[firstCh])
    ? (LETTER_SCORES[firstCh] * ALFA_LETTER_SCORE_MULTIPLIER)
    : 0;
  const positionBonus = getPositionBonus(firstCh, moveNumber);
  return firstLetterScore + positionBonus;
}

function getTotalScore(){
  return getScoreBreakdown().finalScore;
}

function getRawTotalScore(){
  return submissionScores.reduce((sum, value) => sum + value, 0);
}

function getTotalSpeedBonus(){
  const total = speedBonuses.reduce((sum, value) => sum + value, 0);
  return clampNumber(total, -ALFA_SPEED_BONUS_TOTAL_CAP, ALFA_SPEED_BONUS_TOTAL_CAP);
}

function alphaCharCount(s){
  let count = 0;
  const n = normalize(s);
  for (let i = 0; i < n.length; i++){
    const ch = n.charAt(i);
    if (ch >= 'a' && ch <= 'z') count++;
  }
  return count;
}

function computeSpeedBonus(word, elapsedMs){
  const chars = alphaCharCount(word);
  if (chars <= 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const seconds = Math.max(0.2, elapsedMs / 1000);
  const cps = chars / seconds;
  const rawBonus = Math.round((cps - ALFA_SPEED_BASELINE_CPS) * ALFA_SPEED_BONUS_SCALE);
  return clampNumber(rawBonus, -ALFA_SPEED_BONUS_PER_COUNTRY_CAP, ALFA_SPEED_BONUS_PER_COUNTRY_CAP);
}

function consumeEntryElapsedMs(){
  if (!Number.isFinite(currentEntryStartedAtMs) || currentEntryStartedAtMs === null) return 0;
  const elapsed = Math.max(0, Date.now() - currentEntryStartedAtMs);
  currentEntryStartedAtMs = null;
  return elapsed;
}

function clampNumber(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function formatElapsedSeconds(totalSeconds){
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return minutes + ':' + String(seconds).padStart(2, '0');
}

function escapeHtml(s){
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureSessionInfoBadgeStyles(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('session-info-badge-styles')) return;
  const style = document.createElement('style');
  style.id = 'session-info-badge-styles';
  style.textContent = '@keyframes reqPulse{0%{transform:scale(1);box-shadow:0 0 12px rgba(245,158,11,0.35)}50%{transform:scale(1.06);box-shadow:0 0 24px rgba(245,158,11,0.72)}100%{transform:scale(1);box-shadow:0 0 12px rgba(245,158,11,0.35)}}.required-pill-pulse{animation:reqPulse 850ms ease-out 1;}';
  document.head.appendChild(style);
}

function ensureRequiredLetterBanner(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('requiredLetterInfo')) return;
  const gridEl = document.getElementById('letterGrid');
  if (!gridEl || !gridEl.parentNode) return;

  const banner = document.createElement('div');
  banner.id = 'requiredLetterInfo';
  banner.className = 'required-letter-banner';
  gridEl.insertAdjacentElement('afterend', banner);
}

function renderSessionInfo(requiredLetter, statusText, pulseRequired, requiredExplanation){
  if (typeof document === 'undefined') return;
  ensureSessionInfoBadgeStyles();
  ensureRequiredLetterBanner();
  const si = document.getElementById('sessionInfo');
  const requiredEl = document.getElementById('requiredLetterInfo');

  const hasSession = !!sessionName;
  const hasRequired = !!requiredLetter;
  const hasStatus = !!statusText;
  const clearAll = !hasSession && !hasRequired && !hasStatus && arguments.length <= 1;

  if (requiredEl) {
    if (hasRequired) {
      const pulseClass = pulseRequired ? ' required-pill-pulse' : '';
      let hintHtml = '';
      if (requiredExplanation) {
        hintHtml = '<div class="required-letter-hint">' + escapeHtml(requiredExplanation) + '</div>';
      }
      requiredEl.innerHTML =
        '<span class="required-letter-pill' + pulseClass + '">Next country must start with <strong>' +
        escapeHtml(String(requiredLetter).toUpperCase()) + '</strong></span>' +
        hintHtml;
    } else if (clearAll) {
      requiredEl.innerHTML = '';
    }
  }

  if (!si) return;
  if (clearAll) {
    si.innerHTML = '';
    return;
  }

  const pills = [];
  if (hasSession) {
    pills.push('<span style="display:inline-block;margin:0 8px 6px 0;padding:3px 9px;border-radius:999px;border:1px solid rgba(125,211,252,0.35);background:rgba(56,189,248,0.12);color:#cbe7ff;font-size:0.8rem;font-weight:700;letter-spacing:0.2px">Session: ' + escapeHtml(sessionName) + '</span>');
  }
  if (hasStatus) {
    pills.push('<span style="display:inline-block;margin:0 8px 6px 0;padding:3px 9px;border-radius:999px;border:1px solid rgba(148,163,184,0.35);background:rgba(148,163,184,0.12);color:#d1d9e2;font-size:0.8rem;font-weight:700">' + escapeHtml(statusText) + '</span>');
  }

  si.innerHTML = pills.join('');
}

function ensureColourLegend(){
  if (typeof document === 'undefined') return;
  const gridEl = document.getElementById('letterGrid');
  if (!gridEl || !gridEl.parentNode) return;

  ensureRequiredLetterBanner();

  const oldSubmittedLegend = document.getElementById('submittedLegend');
  if (oldSubmittedLegend) oldSubmittedLegend.remove();
  const oldGridLegend = document.getElementById('gridLegend');
  if (oldGridLegend) oldGridLegend.remove();
  if (document.getElementById('colourLegend')) return;

  const legend = document.createElement('div');
  legend.id = 'colourLegend';
  legend.className = 'grid-legend';
  legend.innerHTML =
    '<div class="grid-legend-title">Colour key</div>' +
    '<div class="grid-legend-row"><span class="grid-legend-swatch available"></span><span>Bright: still available</span></div>' +
    '<div class="grid-legend-row"><span class="grid-legend-swatch collected"></span><span>Dim / struck-through: already used</span></div>' +
    '<div class="grid-legend-row"><span class="grid-legend-swatch required"></span><span>Gold: required next letter</span></div>' +
    '<div class="grid-legend-row"><span class="grid-legend-swatch ignored"></span><span>Red: ignored (W or X in Alfaquest)</span></div>' +
    '<div class="grid-legend-row" style="margin-top:8px"><a href="helpv2.html" style="color:#7dd3fc;font-size:0.9rem;text-decoration:none">Sequencing tutorial &#8599;</a></div>';

  const anchor = document.getElementById('requiredLetterInfo') || gridEl;
  anchor.insertAdjacentElement('afterend', legend);
}

function formatDisplayCountry(nameLower){
  const displayMap = (typeof window !== 'undefined' && window._alfa_country_display)
    ? window._alfa_country_display
    : null;
  if (displayMap && displayMap[nameLower]) return displayMap[nameLower];
  return String(nameLower || '').split(/(\s|-|\.|,)/).map(part => {
    if (part.match(/\s|\-|\.|,/)) return part;
    return part.length ? (part.charAt(0).toUpperCase() + part.slice(1)) : part;
  }).join('');
}

function ensureGameOverSummary(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('gameOverSummary')) return;
  const anchor = document.getElementById('colourLegend') || document.getElementById('requiredLetterInfo');
  if (!anchor) return;
  const panel = document.createElement('div');
  panel.id = 'gameOverSummary';
  panel.className = 'game-over-summary';
  panel.style.display = 'none';
  anchor.insertAdjacentElement('afterend', panel);
}

function hideGameOverSummary(){
  const el = document.getElementById('gameOverSummary');
  if (el) {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

const GAME_OVER_EXAMPLE_LIMIT = 3;
const GAME_OVER_HINT_MAX_MOVES = 10;

function resolveGameOverDisplayRequired(required, submittedList){
  const req = (required || '').toLowerCase();
  if (req && req !== '?') return req;
  if (submittedList.length > 0) {
    const prev = submittedList.slice(0, -1);
    try { return getRequiredStart(prev); } catch (e) { return '?'; }
  }
  return '?';
}

function countryContinuesChain(country, submittedList){
  if (!country) return false;
  const trial = submittedList.concat([country]);
  try {
    const nextReq = getRequiredStart(trial);
    return findAvailableCountries(nextReq, new Set(), false).length > 0;
  } catch (e) {
    return false;
  }
}

function findValidContinuations(required, submittedList, maxExamples){
  const max = maxExamples || GAME_OVER_EXAMPLE_LIMIT;
  if (!required) return [];
  const req = String(required).toLowerCase();
  const out = [];
  for (const c of COUNTRY_LIST) {
    if (!c || c.charAt(0) !== req) continue;
    if (submittedList.indexOf(c) !== -1) continue;
    if (countryContinuesChain(c, submittedList)) {
      out.push(c);
      if (out.length >= max) break;
    }
  }
  return out;
}

function buildGameOverExampleCountries(required, submittedList, unusedForLetter){
  const req = (required || '').toLowerCase();
  const displayRequired = resolveGameOverDisplayRequired(required, submittedList);
  if (submittedList.length >= GAME_OVER_HINT_MAX_MOVES) {
    return { examples: [], exampleLabel: '', displayRequired };
  }
  if (req && req !== '?') {
    const valid = findValidContinuations(req, submittedList, GAME_OVER_EXAMPLE_LIMIT);
    if (valid.length > 0) {
      return {
        examples: valid,
        exampleLabel: 'Valid answers included',
        displayRequired: req
      };
    }
    const fallback = (unusedForLetter || []).slice(0, GAME_OVER_EXAMPLE_LIMIT);
    if (fallback.length > 0) {
      return {
        examples: fallback,
        exampleLabel: 'On the list for ' + req.toUpperCase(),
        displayRequired: req
      };
    }
    return { examples: [], exampleLabel: '', displayRequired: req };
  }
  if (submittedList.length > 0) {
    const prev = submittedList.slice(0, -1);
    let lastRequired = null;
    try { lastRequired = getRequiredStart(prev); } catch (e) { return { examples: [], exampleLabel: '', displayRequired: '?' }; }
    const valid = findValidContinuations(lastRequired, prev, GAME_OVER_EXAMPLE_LIMIT);
    if (valid.length > 0) {
      return {
        examples: valid,
        exampleLabel: 'Instead of ' + formatDisplayCountry(submittedList[submittedList.length - 1]) + ', try',
        displayRequired: lastRequired
      };
    }
  }
  return { examples: [], exampleLabel: '', displayRequired: '?' };
}

function renderGameOverSummary(summary){
  if (typeof document === 'undefined' || !summary) return;
  ensureGameOverSummary();
  const el = document.getElementById('gameOverSummary');
  if (!el) return;
  const letter = (summary.displayRequired || summary.required || '?').toUpperCase();
  let examplesHtml = '';
  if (summary.examples && summary.examples.length > 0) {
    const names = summary.examples.map(c => formatDisplayCountry(c)).join(', ');
    const label = summary.exampleLabel || ('Still on the list for ' + letter);
    examplesHtml =
      '<div class="game-over-examples"><strong>' + escapeHtml(label) + ':</strong> ' +
      escapeHtml(names) + '</div>';
  }
  el.innerHTML =
    '<div class="game-over-title">Game over — needed <strong>' + escapeHtml(letter) + '</strong></div>' +
    '<div class="game-over-reason">' + escapeHtml(summary.reason) + '</div>' +
    examplesHtml +
    '<div class="game-over-hint">Tap Reset to try again, or read the <a href="helpv2.html">sequencing tutorial</a>.</div>';
  el.style.display = 'block';
}

function ensureCompletionSummary(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('completionSummary')) return;
  const anchor = document.getElementById('bestScoreRow') || document.getElementById('scorePanel');
  if (!anchor || !anchor.parentNode) return;
  const panel = document.createElement('div');
  panel.id = 'completionSummary';
  panel.className = 'completion-summary';
  panel.style.display = 'none';
  anchor.parentNode.insertBefore(panel, anchor);
}

function hideCompletionSummary(){
  const el = document.getElementById('completionSummary');
  if (el) {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

function buildShareableResultLine(){
  if (!isAlfaMode() || !isCompletedAlfaRun()) return '';
  const breakdown = getScoreBreakdown();
  const rating = getAlfaScoreRating(breakdown.finalScore);
  const timeLabel = breakdown.elapsedSeconds > 0
    ? formatElapsedSeconds(breakdown.elapsedSeconds)
    : '';
  const site = (typeof location !== 'undefined' && location.hostname) ? location.hostname : 'alfaword.games';
  return 'Alfaquest — ' + rating + ' — ' + breakdown.finalScore.toLocaleString() + ' pts, ' +
    submitted.length + ' countries' + (timeLabel ? ', ' + timeLabel : '') + ' — ' + site;
}

function copyShareableResult(){
  const line = buildShareableResultLine();
  if (!line) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(line).then(() => {
      showInfoToast('Result copied to clipboard', 2000);
    }).catch(() => {
      showInfoToast(line, 5000);
    });
    return;
  }
  showInfoToast(line, 5000);
}

function renderCompletionSummary(beatHighScore){
  if (typeof document === 'undefined' || !isAlfaMode()) return;
  ensureCompletionSummary();
  const el = document.getElementById('completionSummary');
  if (!el) return;
  lockRunEndTime();
  const breakdown = getScoreBreakdown();
  const rating = getAlfaScoreRating(breakdown.finalScore);
  const timeLabel = breakdown.elapsedSeconds > 0
    ? formatElapsedSeconds(breakdown.elapsedSeconds)
    : '—';
  const highScoreNote = beatHighScore
    ? '<div class="completion-high-score">New high score!</div>'
    : (highScoreRecord ? '<div class="completion-high-score muted">High score: ' +
      highScoreRecord.score.toLocaleString() + ' pts</div>' : '');
  el.innerHTML =
    '<div class="completion-title">Victory — all 24 starting letters</div>' +
    '<div class="completion-rating">' + escapeHtml(rating) + '</div>' +
    '<div class="completion-stats">' +
    '<span><strong>Score:</strong> ' + breakdown.finalScore.toLocaleString() + '</span>' +
    '<span><strong>Countries:</strong> ' + submitted.length + '</span>' +
    '<span><strong>Time:</strong> ' + escapeHtml(timeLabel) + '</span>' +
    '</div>' +
    highScoreNote +
    '<button type="button" id="copyResultBtn" class="completion-copy-btn">Copy result</button>';
  el.style.display = 'block';
  const copyBtn = document.getElementById('copyResultBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyShareableResult);
}

function maybeShowStartMilestones(pct, completedStarts){
  const thresholds = [25, 50, 75];
  for (const threshold of thresholds) {
    if (lastMilestonePct < threshold && pct >= threshold) {
      showInfoToast(completedStarts + ' of 24 starting letters (' + threshold + '%)', 2800);
      lastMilestonePct = threshold;
      break;
    }
  }
}

function configureCountryInput(){
  if (typeof document === 'undefined') return;
  const input = document.getElementById('countryInput');
  if (!input) return;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocapitalize', 'words');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('enterkeyhint', 'go');
  input.setAttribute('inputmode', 'text');
}

function scrollSubmittedListIntoView(){
  if (typeof document === 'undefined') return;
  const list = document.getElementById('submittedList');
  if (!list || list.children.length <= 1) return;
  if (typeof window !== 'undefined' && window.matchMedia('(min-width: 801px)').matches) return;
  const lastItem = list.lastElementChild;
  if (!lastItem || typeof lastItem.scrollIntoView !== 'function') return;
  const rect = lastItem.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
  lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getElapsedSeconds(){
  if (runStartedAtMs === null) return 0;
  const endMs = runEndedAtMs !== null ? runEndedAtMs : Date.now();
  return Math.max(1, Math.round((endMs - runStartedAtMs) / 1000));
}

function lockRunEndTime(){
  if (runStartedAtMs !== null && runEndedAtMs === null) runEndedAtMs = Date.now();
}

function markGameOver(){
  if (gameOver) return;
  gameOver = true;
  lockRunEndTime();
  currentEntryStartedAtMs = null;
  syncLiveScoreTimer();
}

function getTargetSeconds(moveCount){
  const perMoveTarget = Math.max(0, moveCount) * ALFA_TIME_TARGET_PER_MOVE_SECONDS;
  return Math.max(ALFA_TIME_TARGET_MIN_SECONDS, perMoveTarget);
}

function getTimeFactor(elapsedSeconds, targetSeconds){
  if (elapsedSeconds <= 0 || targetSeconds <= 0) return 1;
  const ratio = targetSeconds / elapsedSeconds;
  return clampNumber(ratio, ALFA_TIME_FACTOR_MIN, ALFA_TIME_FACTOR_MAX);
}

function getScoreBreakdown(){
  const rawScore = getRawTotalScore();
  if (!isAlfaScoringMode() || submitted.length === 0 || rawScore <= 0) {
    return {
      rawScore,
      finalScore: rawScore,
      unscaledFinalScore: rawScore,
      timeAdjustedScore: rawScore,
      speedBonus: 0,
      elapsedSeconds: 0,
      targetSeconds: 0,
      timeFactor: 1
    };
  }

  const elapsedSeconds = getElapsedSeconds();
  const targetSeconds = getTargetSeconds(submitted.length);
  const timeFactor = getTimeFactor(elapsedSeconds, targetSeconds);
  const timeAdjustedScore = Math.round(rawScore * timeFactor);
  const speedBonus = getTotalSpeedBonus();
  const timingScore = timeAdjustedScore + (speedBonus * ALFA_TIMING_SPEED_SCORE_FACTOR);
  const unscaledFinalScore = Math.round((rawScore * ALFA_WEIGHT_LETTERS) + (timingScore * ALFA_WEIGHT_TIMING));
  return {
    rawScore,
    timeAdjustedScore,
    timingScore,
    speedBonus,
    unscaledFinalScore,
    finalScore: unscaledFinalScore,
    elapsedSeconds,
    targetSeconds,
    timeFactor
  };
}

function getScoreBreakdownForPrefix(moveCount){
  const rawScore = submissionScores.slice(0, moveCount).reduce((sum, value) => sum + value, 0);
  if (!isAlfaScoringMode() || moveCount <= 0 || rawScore <= 0) {
    return {
      rawScore: 0,
      finalScore: 0,
      speedBonus: 0,
      timeFactor: 1
    };
  }

  const elapsedSeconds = getElapsedSeconds();
  const targetSeconds = getTargetSeconds(moveCount);
  const timeFactor = getTimeFactor(elapsedSeconds, targetSeconds);
  const timeAdjustedScore = Math.round(rawScore * timeFactor);
  const speedBonus = clampNumber(
    speedBonuses.slice(0, moveCount).reduce((sum, value) => sum + value, 0),
    -ALFA_SPEED_BONUS_TOTAL_CAP,
    ALFA_SPEED_BONUS_TOTAL_CAP
  );
  const timingScore = timeAdjustedScore + (speedBonus * ALFA_TIMING_SPEED_SCORE_FACTOR);
  const unscaledFinalScore = Math.round((rawScore * ALFA_WEIGHT_LETTERS) + (timingScore * ALFA_WEIGHT_TIMING));
  return {
    rawScore,
    speedBonus,
    timeFactor,
    finalScore: unscaledFinalScore
  };
}

function recomputeFinalScoreDeltas(){
  finalScoreDeltas = [];
  if (!isAlfaScoringMode() || submissionScores.length === 0) return;
  let previousFinal = 0;
  for (let i = 0; i < submissionScores.length; i++) {
    const breakdown = getScoreBreakdownForPrefix(i + 1);
    finalScoreDeltas.push(breakdown.finalScore - previousFinal);
    previousFinal = breakdown.finalScore;
  }
}

function getSpeedBonusScorePoints(speedBonusTotal){
  return Math.round(speedBonusTotal * ALFA_TIMING_SPEED_SCORE_FACTOR * ALFA_WEIGHT_TIMING);
}

function formatScoreDelta(value){
  if (!Number.isFinite(value) || value === 0) return '+0';
  return (value > 0 ? '+' : '') + value.toLocaleString();
}

function getAlfaScoreRating(finalScore){
  for (const tier of ALFA_RATING_TIERS) {
    if (finalScore >= tier.min) return tier.label;
  }
  return 'Completed';
}

function getAlfaRatingProgress(finalScore){
  for (let i = 0; i < ALFA_RATING_TIERS.length; i++) {
    const tier = ALFA_RATING_TIERS[i];
    if (finalScore >= tier.min) {
      const nextTier = i > 0 ? ALFA_RATING_TIERS[i - 1] : null;
      if (!nextTier) {
        return {
          projectedRating: tier.label,
          nextRating: null,
          pointsNeeded: 0,
          progressPct: 100
        };
      }
      const pointsNeeded = Math.max(0, nextTier.min - finalScore);
      const range = nextTier.min - tier.min;
      const progressPct = range > 0
        ? Math.min(100, Math.max(0, Math.round(((finalScore - tier.min) / range) * 100)))
        : 0;
      return {
        projectedRating: tier.label,
        nextRating: nextTier.label,
        pointsNeeded,
        progressPct
      };
    }
  }
  return {
    projectedRating: 'Completed',
    nextRating: 'Fair',
    pointsNeeded: ALFA_RATING_TIERS[ALFA_RATING_TIERS.length - 2].min,
    progressPct: 0
  };
}

function renderAlfaScorePanelMetrics(){
  if (typeof document === 'undefined') return;
  const totalScoreEl = document.getElementById('totalScore');
  const rawScoreEl = document.getElementById('rawScore');
  const speedBonusEl = document.getElementById('speedBonus');
  const lastScoreDeltaEl = document.getElementById('lastScoreDelta');
  const elapsedTimeEl = document.getElementById('elapsedTime');
  const timeFactorEl = document.getElementById('timeFactor');
  const alfaRatingHeroEl = document.getElementById('alfaRatingHero');
  const alfaRatingLabelEl = document.getElementById('alfaRatingLabel');
  const alfaRatingSubEl = document.getElementById('alfaRatingSub');
  const ratingProgressRowEl = document.getElementById('ratingProgressRow');
  const ratingProgressLabelEl = document.getElementById('ratingProgressLabel');
  const ratingProgressBarEl = document.getElementById('ratingProgressBar');
  if (!totalScoreEl) return;

  const breakdown = getScoreBreakdown();
  const completed = isCompletedAlfaRun();
  const progress = getAlfaRatingProgress(breakdown.finalScore);
  const speedScorePoints = getSpeedBonusScorePoints(breakdown.speedBonus);
  const lastDelta = finalScoreDeltas.length ? finalScoreDeltas[finalScoreDeltas.length - 1] : 0;

  totalScoreEl.textContent = breakdown.finalScore.toLocaleString();
  if (rawScoreEl) rawScoreEl.textContent = breakdown.rawScore.toLocaleString();
  if (speedBonusEl) {
    speedBonusEl.textContent = breakdown.speedBonus === 0
      ? '0'
      : breakdown.speedBonus + ' → ' + formatScoreDelta(speedScorePoints) + ' pts';
  }
  if (lastScoreDeltaEl) lastScoreDeltaEl.textContent = formatScoreDelta(lastDelta);
  if (elapsedTimeEl) elapsedTimeEl.textContent = formatElapsedSeconds(breakdown.elapsedSeconds);
  if (timeFactorEl) timeFactorEl.textContent = 'x' + breakdown.timeFactor.toFixed(2);

  if (alfaRatingLabelEl) {
    alfaRatingLabelEl.textContent = completed
      ? getAlfaScoreRating(breakdown.finalScore)
      : progress.projectedRating;
  }
  if (alfaRatingSubEl) {
    alfaRatingSubEl.textContent = completed ? 'Final rating' : 'On-pace rating';
  }
  if (ratingProgressRowEl && ratingProgressLabelEl && ratingProgressBarEl) {
    if (submitted.length > 0 && progress.nextRating && progress.pointsNeeded > 0) {
      ratingProgressRowEl.style.visibility = 'visible';
      ratingProgressLabelEl.textContent = progress.nextRating + ' in ' + progress.pointsNeeded.toLocaleString() + ' pts';
      ratingProgressBarEl.style.width = progress.progressPct + '%';
    } else if (submitted.length > 0 && !progress.nextRating) {
      ratingProgressRowEl.style.visibility = 'visible';
      ratingProgressLabelEl.textContent = 'Top rating reached';
      ratingProgressBarEl.style.width = '100%';
    } else {
      ratingProgressRowEl.style.visibility = 'hidden';
      ratingProgressLabelEl.textContent = '';
      ratingProgressBarEl.style.width = '0%';
    }
  }
}

function shouldRunLiveScoreTimer(){
  return isAlfaScoringMode() &&
    scoreDisplayEnabled &&
    runStartedAtMs !== null &&
    runEndedAtMs === null &&
    submitted.length > 0;
}

function syncLiveScoreTimer(){
  const shouldRun = shouldRunLiveScoreTimer();
  if (shouldRun && !liveScoreTimerId){
    liveScoreTimerId = setInterval(() => {
      renderAlfaScorePanelMetrics();
    }, 1000);
    return;
  }
  if (!shouldRun && liveScoreTimerId){
    clearInterval(liveScoreTimerId);
    liveScoreTimerId = null;
  }
}

function loadHighScore(){
  try{
    const raw = localStorage.getItem(ALFA_HIGH_SCORE_KEY);
    if (!raw) {
      highScoreRecord = null;
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.completed === true && Number.isFinite(parsed.score) && parsed.score > 0) {
      highScoreRecord = {
        version: typeof parsed.version === 'string' ? parsed.version : 'legacy',
        completed: true,
        score: Math.floor(parsed.score),
        rawScore: Number.isFinite(parsed.rawScore) ? Math.floor(parsed.rawScore) : Math.floor(parsed.score),
        moves: Number.isFinite(parsed.moves) ? Math.floor(parsed.moves) : 0,
        elapsedSeconds: Number.isFinite(parsed.elapsedSeconds) ? Math.floor(parsed.elapsedSeconds) : 0,
        timeFactor: Number.isFinite(parsed.timeFactor) ? parsed.timeFactor : 1,
        achievedAt: typeof parsed.achievedAt === 'string' ? parsed.achievedAt : ''
      };
      return;
    }
    localStorage.removeItem(ALFA_HIGH_SCORE_KEY);
  }catch(e){}
  highScoreRecord = null;
}

function saveHighScore(){
  try{
    if (!highScoreRecord) localStorage.removeItem(ALFA_HIGH_SCORE_KEY);
    else localStorage.setItem(ALFA_HIGH_SCORE_KEY, JSON.stringify(highScoreRecord));
  }catch(e){}
}

function renderHighScore(){
  if (typeof document === 'undefined') return;
  const rowEl = document.getElementById('bestScoreRow');
  const scoreEl = document.getElementById('bestScore');
  const metaEl = document.getElementById('bestScoreMeta');
  if (!rowEl || !scoreEl || !metaEl) return;
  rowEl.style.display = isAlfaMode() ? 'block' : 'none';
  if (!isAlfaMode()) return;
  if (highScoreRecord) {
    scoreEl.textContent = highScoreRecord.score.toLocaleString();
    const rating = getAlfaScoreRating(highScoreRecord.score);
    const answersLabel = highScoreRecord.moves + (highScoreRecord.moves === 1 ? ' answer' : ' answers');
    const durationLabel = highScoreRecord.elapsedSeconds > 0
      ? formatElapsedSeconds(highScoreRecord.elapsedSeconds)
      : '';
    if (highScoreRecord.moves > 0) {
      metaEl.textContent = rating + ' — ' + answersLabel +
        (durationLabel ? ' · Best time: ' + durationLabel : '');
    } else {
      metaEl.textContent = rating;
    }
  } else {
    scoreEl.textContent = '0';
    metaEl.textContent = 'High score only saved for completed games';
  }
}

function maybeUpdateHighScore(){
  if (!isAlfaScoringMode()) return false;
  const isCompletedRun = isCompletedAlfaRun();
  if (!isCompletedRun) return false;
  lockRunEndTime();
  syncLiveScoreTimer();
  const breakdown = getScoreBreakdown();
  const total = breakdown.finalScore;
  if (total <= 0 || submitted.length === 0) return false;
  if (highScoreRecord) {
    if (total < highScoreRecord.score) return false;
    if (total === highScoreRecord.score) {
      const previousElapsed = Number.isFinite(highScoreRecord.elapsedSeconds)
        ? highScoreRecord.elapsedSeconds
        : Number.MAX_SAFE_INTEGER;
      if (breakdown.elapsedSeconds >= previousElapsed) return false;
    }
  }
  highScoreRecord = {
    version: ALFA_SCORING_VERSION,
    completed: true,
    score: total,
    rawScore: breakdown.rawScore,
    speedBonus: breakdown.speedBonus,
    moves: submitted.length,
    elapsedSeconds: breakdown.elapsedSeconds,
    timeFactor: breakdown.timeFactor,
    achievedAt: new Date().toISOString()
  };
  saveHighScore();
  renderHighScore();
  return true;
}

function setScoreDisplayEnabled(enabled){
  scoreDisplayEnabled = isAlfaScoringMode() && !!enabled;
  if (typeof document === 'undefined') return;
  const scorePanel = document.getElementById('scorePanel');
  if (scorePanel) scorePanel.style.display = scoreDisplayEnabled ? 'block' : 'none';
  syncLiveScoreTimer();
  updateUI();
}

function showToast(message, variant, durationMs, onClick){
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('alfa-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'alfa-toast';
  toast.className = 'alfa-toast alfa-toast--' + (variant || 'info');
  toast.textContent = message;
  if (typeof onClick === 'function'){
    toast.classList.add('alfa-toast--actionable');
    toast.title = 'Tap to reset';
    toast.addEventListener('click', () => {
      onClick();
      toast.remove();
    });
  }
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('alfa-toast--visible');
  });

  if (durationMs === 0) return;
  const displayMs = typeof durationMs === 'number' ? durationMs : 2600;
  setTimeout(() => {
    toast.classList.remove('alfa-toast--visible');
    setTimeout(() => toast.remove(), 240);
  }, displayMs);
}

function showSuccessToast(message, durationMs){
  showToast(message, 'success', durationMs);
}

function showErrorToast(message, durationMs){
  showToast(message, 'error', durationMs || 3000);
}

function showInfoToast(message, durationMs){
  showToast(message, 'info', durationMs || 2200);
}

function showResetRequiredToast(message, variant){
  const base = String(message || 'Game over')
    .replace(/\s*(\.|)\s*tap (here )?to reset\s*$/i, '')
    .replace(/\s*GAME OVER\.?\s*$/i, '')
    .trim();
  showToast((base || 'Game over') + ' — tap to reset', variant || 'error', 0, () => {
    resetLocal();
  });
}

function showGameOverResetToast(options){
  const opts = (options && typeof options === 'object') ? options : {};
  if (opts.summaryShown) {
    showToast('Game over', 'error', 2600);
    return;
  }
  const detail = String(opts.detail || 'Game over').trim();
  showResetRequiredToast(detail, 'error');
}

function getEasyModeRating(moveCount){
  if (moveCount <= 6) return 'Legendary';
  if (moveCount === 7) return 'Excellent';
  if (moveCount === 8) return 'Very good';
  if (moveCount === 9) return 'Good';
  if (moveCount === 10) return 'Fair';
  return 'Keep Trying';
}

function getNormalModeRating(moveCount){
  if (moveCount <= 12) return 'Legendary';
  if (moveCount <= 14) return 'Excellent';
  if (moveCount <= 16) return 'Very good';
  if (moveCount <= 18) return 'Good';
  if (moveCount <= 20) return 'Fair';
  return 'Completed';
}

function getHardModeRating(moveCount){
  if (moveCount <= 8) return 'Legendary';
  if (moveCount === 9) return 'Excellent';
  if (moveCount === 10) return 'Very good';
  return 'Good';
}

function isCompletedAlfaRun(){
  return GAME_ALPH.every(ch => usedStarts.has(ch));
}

function getCompletionToastMessage(){
  if (isAlfaMode()){
    const breakdown = getScoreBreakdown();
    const rating = getAlfaScoreRating(breakdown.finalScore);
    const timeLabel = breakdown.elapsedSeconds > 0
      ? ' in ' + formatElapsedSeconds(breakdown.elapsedSeconds)
      : '';
    return 'Bravo! ' + rating + ' run — ' + breakdown.finalScore.toLocaleString() + ' points' + timeLabel + '.';
  }
  if (isEasyAlfafillMode()){
    const moveCount = submitted.length;
    const rating = getEasyModeRating(moveCount);
    return 'Bravo! All target letters completed in ' + moveCount + ' countries. Rating: ' + rating + '.';
  }
  if (isNormalAlfafillMode()){
    const moveCount = submitted.length;
    const rating = getNormalModeRating(moveCount);
    return 'Bravo! All target letters completed in ' + moveCount + ' countries. Rating: ' + rating + '.';
  }
  if (isSequentialFullCollectMode()){
    const moveCount = submitted.length;
    const rating = getHardModeRating(moveCount);
    return 'Bravo! All target letters completed in ' + moveCount + ' countries. Rating: ' + rating + '.';
  }
  return 'Bravo! All target letters completed.';
}

function scheduleGameOverReset(delayMs){
  if (gameOverResetTimer) clearTimeout(gameOverResetTimer);
}

function updateUI(){
  ensureColourLegend();
  const usedArr = Array.from(usedLetters).sort();
  const isAlfa = isAlfaMode();
  const isEasyFill = isEasyAlfafillMode();
  const isNormal = isNormalAlfafillMode();
  const isSeq = isSequentialAlfafillMode();
  const isSeqFull = isSequentialFullCollectMode();
  const remainingLetters = ALPH.filter(c => !usedLetters.has(c));
  const remainingSeqLetters = ALPH.filter(c => !usedLetters.has(c));
  const remainingLettersSet = new Set(remainingLetters);
  let remainingCount;
  if (isAlfa){
    const remainingStarts = GAME_ALPH.filter(c => !usedStarts.has(c));
    remainingCount = remainingStarts.length;
  } else if (isSeq){
    remainingCount = remainingSeqLetters.length;
  } else if (isSeqFull){
    remainingCount = remainingLetters.length;
  } else {
    remainingCount = remainingLetters.length;
  }
  document.getElementById('remainingLetters').textContent = remainingCount;
  const remainingCountLabelEl = document.getElementById('remainingCountLabel');
  if (remainingCountLabelEl) {
    remainingCountLabelEl.textContent = isAlfa ? 'Remaining starts:' : 'Remaining letters:';
  }
  const scorePanelEl = document.getElementById('scorePanel');
  const totalScoreEl = document.getElementById('totalScore');
  const scoreRatingEl = document.getElementById('scoreRating');
  const scoreMovesEl = document.getElementById('scoreMoves');
  renderHighScore();
  if (isAlfa && scorePanelEl && totalScoreEl){
    scorePanelEl.style.display = scoreDisplayEnabled ? 'block' : 'none';
    renderAlfaScorePanelMetrics();
    syncLiveScoreTimer();
  }
  if (scorePanelEl && scoreRatingEl && scoreMovesEl && (isEasyFill || isNormal || isSeqFull)){
    const moveCount = submitted.length;
    scorePanelEl.style.display = (scoreDisplayEnabled || moveCount > 0) ? 'block' : 'none';
    if (isEasyFill) scoreRatingEl.textContent = getEasyModeRating(moveCount);
    else if (isNormal) scoreRatingEl.textContent = getNormalModeRating(moveCount);
    else scoreRatingEl.textContent = getHardModeRating(moveCount);
    scoreMovesEl.textContent = moveCount + (moveCount === 1 ? ' country used' : ' countries used');
  }
  const ul = document.getElementById('submittedList'); ul.innerHTML = '';
  // Render submitted countries and highlight letters that were already used before each submission
  const runningSeen = new Set();
  const usedStartingLetters = new Set();
  submitted.forEach((c,i)=>{
    const alreadyUsed = new Set();
    const letters = new Set();
    for (const ch of c) if (ch >= 'a' && ch <= 'z') letters.add(ch);
    if (isAlfa || isNormal){
      for (const ch of letters) if (usedStartingLetters.has(ch)) alreadyUsed.add(ch);
      const start = c && c.length ? c.charAt(0) : '';
      if (start) usedStartingLetters.add(start);
    } else {
      for (const ch of letters) if (runningSeen.has(ch)) alreadyUsed.add(ch);
      for (const ch of letters) runningSeen.add(ch);
    }
    let activeLetter = '';
    if (isAlfa || isNormal){
      try { activeLetter = getRequiredStart(submitted.slice(0, i + 1)); } catch(e) { activeLetter = ''; }
    }
    const li = document.createElement('li');
    let scoreSuffix = '';
    if (isAlfa && scoreDisplayEnabled) {
      const delta = finalScoreDeltas[i] || 0;
      scoreSuffix = ' <span class="score-meta">(' + formatScoreDelta(delta) + ' pts)</span>';
    }
    li.innerHTML = (i+1)+'. '+formatDisplayWithHighlights(c, alreadyUsed, c.charAt(0), activeLetter) + scoreSuffix;
    ul.appendChild(li);
  });
  renderLetterGrid();
  const pct = isAlfa
    ? Math.round(((GAME_ALPH.length - remainingCount) / GAME_ALPH.length) * 100)
    : Math.round(((26 - remainingCount) / 26) * 100);
  const bar = document.getElementById('progressBar'); if (bar) bar.style.width = pct + '%';
  if (isAlfa && !gameOver && !completionShown && remainingCount > 0) {
    maybeShowStartMilestones(pct, GAME_ALPH.length - remainingCount);
  }
  // show required next-start letter
  if (isAlfa || isNormal || isSeq || isSeqFull){
    try{
      const req = (isAlfa || isNormal) ? getRequiredStart(submitted) : getNextSequentialRequiredLetter();
      const requiredLabel = req ? req.toUpperCase() : '?';
      const shouldPulse = requiredLabel !== lastRenderedRequiredLetter;
      let requiredExplanation = null;
      if (isAlfa || isNormal) {
        const context = getRequiredLetterContext(submitted);
        if (context && context.explanation) requiredExplanation = context.explanation;
      }
      renderSessionInfo(requiredLabel, null, shouldPulse, requiredExplanation);
      lastRenderedRequiredLetter = requiredLabel;
      // check for available countries matching required rule
      const available = (isAlfa || isNormal)
        ? findAvailableCountries(req, remainingLettersSet, false)  // Alfaquest: any country with correct start is valid
        : findAvailableCountries(req, remainingLettersSet, isSeqFull);
      const statusEl = document.getElementById('status');
      const submitBtn = document.getElementById('submitCountry');
      const input = document.getElementById('countryInput');
      if (available.length === 0){
        if (statusEl){
          statusEl.textContent = 'No valid countries for required: ' + (req ? req.toUpperCase() : '?');
          statusEl.className = 'status-danger';
        }
        if (!gameOver){
          markGameOver();
          hideCompletionSummary();
          const letter = (req || '?').toUpperCase();
          const allForLetter = COUNTRY_LIST.filter(c => c && c.charAt(0) === (req||'').toLowerCase());
          const unusedForLetter = allForLetter.filter(c => submitted.indexOf(c) === -1);
          let reason;
          if (allForLetter.length === 0){
            reason = 'No countries on the list begin with "' + letter + '".';
          } else if (unusedForLetter.length === 0){
            reason = 'Every country beginning with "' + letter + '" has already been submitted.';
          } else {
            reason = (isAlfa || isNormal)
              ? 'No remaining country beginning with "' + letter + '" can continue the chain from here.'
              : 'All remaining countries beginning with "' + letter + '" contain only letters already collected.';
          }
          const helper = buildGameOverExampleCountries(req, submitted, unusedForLetter);
          renderGameOverSummary({
            required: req || '?',
            displayRequired: helper.displayRequired,
            reason,
            examples: helper.examples,
            exampleLabel: helper.exampleLabel
          });
          showGameOverResetToast({ summaryShown: true });
        }
        if (submitBtn) submitBtn.disabled = true;
        if (input) input.disabled = true;
      } else {
        if (statusEl){ statusEl.textContent = ''; statusEl.className = ''; }
        gameOver = false;
        hideGameOverSummary();
        if (submitBtn) submitBtn.disabled = false;
        if (input) input.disabled = false;
      }
    }catch(e){
      if (e && e.message && e.message.indexOf('GAME OVER') !== -1){
        if (!gameOver){
          markGameOver();
          hideCompletionSummary();
          const lastCountry = submitted.length ? submitted[submitted.length - 1] : '';
          const displayName = lastCountry ? formatDisplayCountry(lastCountry) : 'your last answer';
          const reason = 'No unused starting letter remains inside "' + displayName +
            '" to determine the next required letter.';
          const helper = buildGameOverExampleCountries('?', submitted, []);
          renderGameOverSummary({
            required: helper.displayRequired || '?',
            displayRequired: helper.displayRequired,
            reason,
            examples: helper.examples,
            exampleLabel: helper.exampleLabel
          });
          showGameOverResetToast({ summaryShown: true });
        }
        const submitBtn = document.getElementById('submitCountry');
        const input = document.getElementById('countryInput');
        if (submitBtn) submitBtn.disabled = true;
        if (input) input.disabled = true;
      }
    }
  } else {
    renderSessionInfo(null);
    lastRenderedRequiredLetter = null;
    const statusEl = document.getElementById('status');
    const submitBtn = document.getElementById('submitCountry');
    const input = document.getElementById('countryInput');
    if (isEasyFill){
      const unreachable = findUnreachableRemainingLetters(remainingLettersSet);
      if (remainingLetters.length > 0 && unreachable.length > 0){
        if (statusEl){
          statusEl.textContent = 'No valid countries can add required remaining letters.';
          statusEl.className = 'status-danger';
        }
        if (!gameOver){
          markGameOver();
          const rem = unreachable.map(ch => ch.toUpperCase()).join(', ');
          showGameOverResetToast({ detail: 'Game over' });
        }
        if (submitBtn) submitBtn.disabled = true;
        if (input) input.disabled = true;
      } else {
        if (statusEl){ statusEl.textContent = ''; statusEl.className = ''; }
        gameOver = false;
        if (submitBtn) submitBtn.disabled = false;
        if (input) input.disabled = false;
      }
    } else {
      if (statusEl){ statusEl.textContent = ''; statusEl.className = ''; }
    }
  }
  if ((isAlfa && remainingCount === 0) || (isSeq && isSequenceModeComplete()) || (isSeqFull && remainingLetters.length === 0) || (!isAlfa && !isSeq && !isSeqFull && remainingLetters.length === 0)) {
    if (!completionShown){
      completionShown = true;
      hideGameOverSummary();
      const beatHighScore = isAlfa ? maybeUpdateHighScore() : false;
      if (isAlfa) renderCompletionSummary(beatHighScore);
      showResetRequiredToast(getCompletionToastMessage(), 'success');
    }
  }
}

function findAvailableCountries(required, remainingSet, requireNewLetterBeyondStart){
  if (!required) return [];
  const out = [];
  for (const c of COUNTRY_LIST){
    if (!c || c.charAt(0) !== required) continue;
    if (submitted.indexOf(c) !== -1) continue;
    if (!requireNewLetterBeyondStart){
      out.push(c);
      continue;
    }
    // For Alfaquest (requireNewLetterBeyondStart=true with usedLetters): 
    // Check if country contains at least one letter not yet collected
    let hasNewLetter = false;
    for (const ch of c){ 
      if (ch >= 'a' && ch <= 'z' && !usedLetters.has(ch)){ 
        hasNewLetter = true; 
        break; 
      } 
    }
    if (hasNewLetter) out.push(c);
  }
  return out;
}

function findContributingCountriesAnyStart(remainingSet){
  const out = [];
  for (const c of COUNTRY_LIST){
    if (!c) continue;
    if (submitted.indexOf(c) !== -1) continue;
    for (const ch of c){
      if (remainingSet.has(ch)){
        out.push(c);
        break;
      }
    }
  }
  return out;
}

function findUnreachableRemainingLetters(remainingSet){
  const canStillCollect = new Set();
  for (const c of COUNTRY_LIST){
    if (!c) continue;
    if (submitted.indexOf(c) !== -1) continue;
    for (const ch of c){
      if (remainingSet.has(ch)) canStillCollect.add(ch);
    }
  }
  const unreachable = [];
  for (const ch of remainingSet){
    if (!canStillCollect.has(ch)) unreachable.push(ch);
  }
  return unreachable;
}

function getNextSequentialRequiredLetter(){
  for (const ch of GAME_ALPH){
    if (!usedLetters.has(ch)) return ch;
  }
  return null;
}

function isSequenceModeComplete(){
  const hasW = usedLetters.has('w');
  const hasX = usedLetters.has('x');
  const hasZ = usedLetters.has('z');
  const last = submitted.length ? normalize(submitted[submitted.length - 1]) : '';
  const lastStartsZ = !!last && last.charAt(0) === 'z';
  const coreDone = GAME_ALPH.filter(ch => ch !== 'z').every(ch => usedLetters.has(ch));
  return coreDone && hasW && hasX && (hasZ || lastStartsZ);
}

function getSequentialCollectedLetters(word, baseUsedLetters){
  const usedBase = baseUsedLetters ? new Set(baseUsedLetters) : new Set();
  let required = null;
  for (const ch of GAME_ALPH){
    if (!usedBase.has(ch)) { required = ch; break; }
  }
  if (!required) return [];

  const n = normalize(word);
  if (!n || n.charAt(0) !== required) return [];

  const lettersInWord = new Set();
  for (const ch of n) if (ch >= 'a' && ch <= 'z') lettersInWord.add(ch);

  const collected = [];
  const reqIdx = GAME_ALPH.indexOf(required);
  for (let i = reqIdx; i < GAME_ALPH.length; i++){
    const ch = GAME_ALPH[i];
    if (usedBase.has(ch)) continue;
    if (!lettersInWord.has(ch)) break;
    collected.push(ch);
    usedBase.add(ch);
  }

  // Only W and X may be picked up out of sequence in this mode.
  for (const ch of ['w', 'x']){
    if (lettersInWord.has(ch) && !usedBase.has(ch)){
      collected.push(ch);
      usedBase.add(ch);
    }
  }

  return collected;
}

function getAllNewLetters(word, baseUsedLetters){
  const usedBase = baseUsedLetters ? new Set(baseUsedLetters) : new Set();
  const n = normalize(word);
  const lettersInWord = new Set();
  for (const ch of n) if (ch >= 'a' && ch <= 'z') lettersInWord.add(ch);
  const collected = [];
  for (const ch of lettersInWord){
    if (!usedBase.has(ch)){
      collected.push(ch);
      usedBase.add(ch);
    }
  }
  return collected;
}

function formatDisplayWithHighlights(nameLower, highlights, startLetter, activeLetter){
  // convert lower-case stored name to title case, then uppercase characters that are in highlights
  // Prefer canonical display name if available
  const displayMap = (typeof window !== 'undefined' && window._alfa_country_display) ? window._alfa_country_display : null;
  const base = displayMap && displayMap[nameLower] ? displayMap[nameLower] : titleCase(nameLower);
  const start = normalize(startLetter).charAt(0);
  const active = normalize(activeLetter).charAt(0);

  function titleCase(s){ return s.split(/(\s|-|\.|,)/).map(part => {
    if (part.match(/\s|\-|\.|,/)) return part;
    return part.length ? (part.charAt(0).toUpperCase() + part.slice(1)) : part;
  }).join(''); }
  // escape HTML to be safe when inserting into innerHTML
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  let out = '';
  let activeHighlighted = false;
  for (let i = 0; i < base.length; i++){
    const ch = base.charAt(i);
    const lower = ch.toLowerCase();
    if (lower >= 'a' && lower <= 'z'){
      if (active && lower === active && !activeHighlighted){
        out += '<span class="hl" style="color:#fbbf24">' + esc(ch) + '</span>';
        activeHighlighted = true;
      } else if (IGNORED.indexOf(lower) !== -1){
        out += '<span class="hl" style="color:#ef4444">' + esc(ch) + '</span>';
      } else if (highlights.has(lower)){
        out += '<span class="hl" style="color:#64748b;text-decoration:line-through">' + esc(ch) + '</span>';
      } else {
        out += esc(ch);
      }
    } else {
      out += esc(ch);
    }
  }
  return out;
}

// compute required starting letter for next submission, following alfaquest rules
function getRequiredStart(submittedList){
  const alpha = GAME_ALPH.slice();
  const usedStarts = IGNORED.slice();
  let prevCommon = null;

  for (let i = 0; i < submittedList.length; i++){
    const w = normalize(submittedList[i]);
    if (!w) throw new Error('Invalid word at index '+i);
    const start = w.charAt(0);
    if (usedStarts.indexOf(start) !== -1) throw new Error('Word already used: '+w);
    usedStarts.push(start);
    // remove start from alpha
    for (let k = alpha.length-1;k>=0;k--) if (alpha[k] === start) alpha.splice(k,1);
    // find first letter in w that is still in alpha
    let common = '';
    for (let j = 0; j < w.length; j++){
      const ch = w.charAt(j);
      if (alpha.indexOf(ch) !== -1){ common = ch; break; }
    }
    if (common === '') throw new Error('You have ran out of letters, GAME OVER');
    prevCommon = common;
  }

  if (submittedList.length === 0) return 'a';
  return prevCommon;
}

function getRequiredLetterContext(submittedList){
  if (!submittedList || submittedList.length === 0) {
    return {
      required: 'a',
      explanation: 'Every Alfaquest run begins with a country starting with A.'
    };
  }

  const alpha = GAME_ALPH.slice();
  const usedStarts = IGNORED.slice();
  let prevCommon = null;
  let sourceWordNormalized = '';

  for (let i = 0; i < submittedList.length; i++){
    const w = normalize(submittedList[i]);
    if (!w) return null;
    const start = w.charAt(0);
    if (usedStarts.indexOf(start) !== -1) return null;
    usedStarts.push(start);
    for (let k = alpha.length - 1; k >= 0; k--) {
      if (alpha[k] === start) alpha.splice(k, 1);
    }
    let common = '';
    for (let j = 0; j < w.length; j++){
      const ch = w.charAt(j);
      if (alpha.indexOf(ch) !== -1) {
        common = ch;
        break;
      }
    }
    if (common === '') return null;
    prevCommon = common;
    sourceWordNormalized = w;
  }

  if (!prevCommon || !sourceWordNormalized) return null;
  const displayName = formatDisplayCountry(sourceWordNormalized);
  return {
    required: prevCommon,
    explanation: 'From ' + displayName + ', ' + prevCommon.toUpperCase() +
      ' is the first unused starting letter in that word.'
  };
}

function renderLetterGrid(){
  const container = document.getElementById('letterGrid');
  if (!container) return;
  container.innerHTML = '';
  const isAlfa = (typeof window !== 'undefined') && window.ALFAQUEST_MODE;
  const isNormal = isNormalAlfafillMode();
  const isSeq = isSequentialAlfafillMode();
  const isSeqFull = isSequentialFullCollectMode();
  let required = null;
  if (isAlfa || isNormal){
    try{ required = getRequiredStart(submitted); }catch(e){ required = null; }
  } else if (isSeq || isSeqFull){
    required = getNextSequentialRequiredLetter();
  }
  for (const ch of ALPH){
    const div = document.createElement('div');
    const classes = ['letter-cell'];
    if (isAlfa){
      const isIgnoredStart = IGNORED.indexOf(ch) !== -1;
      if (isIgnoredStart) classes.push('ignored-letter');
      else if (usedStarts.has(ch)) classes.push('start-used');
      else if (ch === required) classes.push('next-required');
      else classes.push('available');
    } else if (isNormal || isSeq || isSeqFull){
      if (isNormal && ch === required) classes.push('next-required');
      else if (usedLetters.has(ch)) classes.push('used');
      else if (ch === required) classes.push('next-required');
      else classes.push('available');
    } else {
      if (usedLetters.has(ch)) classes.push('used');
      else classes.push('available');
    }
    div.className = classes.join(' ');
    div.textContent = ch.toUpperCase();
    container.appendChild(div);
  }
}

function addCountryLocal(name){
  const n = normalize(name);
  const isAlfa = isAlfaMode();
  const isEasyFill = isEasyAlfafillMode();
  const isNormal = isNormalAlfafillMode();
  const isSeq = isSequentialAlfafillMode();
  const isSeqFull = isSequentialFullCollectMode();
  let requiredStart = null;
  if (!n) return showErrorToast('Enter a country name');
  if (gameOver) return showErrorToast('Game is over - reset to play again');
  if (submitted.indexOf(n) !== -1) return showErrorToast('Country already submitted');
  if (COUNTRY_LIST.indexOf(n) === -1) return showErrorToast('Country not in list or misspelled');
  // ensure used-starts up to date and block reused starts
  recomputeUsedStarts();
  if (!isEasyFill && !isSeq && !isSeqFull && usedStarts.has(n.charAt(0))) return showErrorToast('Starting letter already used');
  // enforce alfaquest sequencing rule
  if (!isEasyFill){
    if (isSeq || isSeqFull){
      requiredStart = getNextSequentialRequiredLetter();
      if (!requiredStart) return showInfoToast('All letters are complete. Reset to play again.');
      if (n.charAt(0) !== requiredStart) return showErrorToast('Invalid start letter - required: '+requiredStart.toUpperCase());
    } else {
      try{
        const required = getRequiredStart(submitted);
        if (n.charAt(0) !== required) return showErrorToast('Invalid start letter - required: '+required.toUpperCase());
      }catch(e){ return showErrorToast(e.message); }
    }
  }
  // ensure the country contributes according to active mode
  let collectedSeq = [];
  let collectedAll = [];
  if (isSeq){
    collectedSeq = getSequentialCollectedLetters(n, usedLetters);
    if (collectedSeq.length === 0) return showErrorToast('This country does not collect the next required letter(s) in sequence');
    if (requiredStart && collectedSeq.length === 1 && collectedSeq[0] === requiredStart){
      markGameOver();
      const submitBtn = document.getElementById('submitCountry');
      const input = document.getElementById('countryInput');
      if (submitBtn) submitBtn.disabled = true;
      if (input) input.disabled = true;
      showGameOverResetToast({ detail: 'Dead-end move' });
      return;
    }
  } else if (isSeqFull){
    collectedAll = getAllNewLetters(n, usedLetters);
    if (collectedAll.length === 0) return showErrorToast('This country does not introduce any new letters');
    if (requiredStart && collectedAll.length === 1 && collectedAll[0] === requiredStart){
      markGameOver();
      const submitBtn = document.getElementById('submitCountry');
      const input = document.getElementById('countryInput');
      if (submitBtn) submitBtn.disabled = true;
      if (input) input.disabled = true;
      showGameOverResetToast({ detail: 'Dead-end move' });
      return;
    }
  } else if (isNormal) {
    // Normal mode allows a no-new-letter move, but it ends the game immediately.
    const letters = new Set();
    for (const ch of n) if (ch >= 'a' && ch <= 'z') letters.add(ch);
    let contributes = false;
    for (const ch of letters) if (!usedLetters.has(ch)) { contributes = true; break; }

    if (!contributes){
      submitted.push(n);
      if (isAlfaScoringMode()) submissionScores.push(scoreWord(n, submitted.length));
      usedStarts.add(n.charAt(0));
      for (const ch of n) if (ch >= 'a' && ch <= 'z') usedLetters.add(ch);
      updateUI();
      saveLocal();
      scrollSubmittedListIntoView();

      markGameOver();
      const submitBtn = document.getElementById('submitCountry');
      const input = document.getElementById('countryInput');
      if (submitBtn) submitBtn.disabled = true;
      if (input) input.disabled = true;
      showGameOverResetToast({ detail: 'Game over' });
      return;
    }
  } else if (isEasyFill) {
    // Easy Alfafill mode: must contribute at least one new letter
    const letters = new Set(); for (const ch of n) if (ch >= 'a' && ch <= 'z') letters.add(ch);
    let contributes = false; for (const ch of letters) if (!usedLetters.has(ch)) { contributes = true; break; }
    if (!contributes) return showErrorToast('This country does not introduce any new letters');
  }
  submitted.push(n);
  if (isAlfaScoringMode()) {
    if (runStartedAtMs === null) runStartedAtMs = Date.now();
    runEndedAtMs = null;
    syncLiveScoreTimer();
  }
  if (isAlfaScoringMode()) {
    const beforeFinal = getScoreBreakdown().finalScore;
    submissionScores.push(scoreWord(n, submitted.length));
    speedBonuses.push(computeSpeedBonus(n, consumeEntryElapsedMs()));
    const afterFinal = getScoreBreakdown().finalScore;
    finalScoreDeltas.push(afterFinal - beforeFinal);
  }
  if (!isSeq && !isSeqFull) usedStarts.add(n.charAt(0));
  if (isSeq){
    for (const ch of collectedSeq) usedLetters.add(ch);
  } else if (isSeqFull){
    for (const ch of collectedAll) usedLetters.add(ch);
  } else {
    for (const ch of n) if (ch >= 'a' && ch <= 'z') usedLetters.add(ch);
  }
  updateUI();
  saveLocal();
  scrollSubmittedListIntoView();
}

function saveLocal(){
  try{
    localStorage.setItem('allletters_submitted', JSON.stringify(submitted));
    localStorage.setItem('allletters_used', JSON.stringify(Array.from(usedLetters)));
    localStorage.setItem('allletters_scores', JSON.stringify(submissionScores));
  }catch(e){}
}
function loadLocal(){
  try{
    const isAlfa = isAlfaMode();
    if (isAlfa){
      // In Alfaquest (original game) mode we don't persist across refreshes — clear any saved state
      try{ localStorage.removeItem('allletters_submitted'); localStorage.removeItem('allletters_used'); localStorage.removeItem('allletters_scores'); }catch(e){}
      submitted = [];
      usedLetters = new Set();
      submissionScores = [];
      speedBonuses = [];
      finalScoreDeltas = [];
      currentEntryStartedAtMs = null;
      runStartedAtMs = null;
      runEndedAtMs = null;
      recomputeUsedStarts();
      return;
    }
    // In Alfafill mode, also reset on refresh.
    try{ localStorage.removeItem('allletters_submitted'); localStorage.removeItem('allletters_used'); localStorage.removeItem('allletters_scores'); }catch(e){}
    submitted = [];
    usedLetters = new Set();
    submissionScores = [];
    speedBonuses = [];
    currentEntryStartedAtMs = null;
    runStartedAtMs = null;
    runEndedAtMs = null;
    recomputeUsedStarts();
  }catch(e){ submitted = []; usedLetters = new Set(); submissionScores = []; speedBonuses = []; finalScoreDeltas = []; currentEntryStartedAtMs = null; runStartedAtMs = null; runEndedAtMs = null; }
}

// Server session helpers (optional)
async function createSession(){
  try{
    const res = await fetch(apiUrl('/session/create'), {method:'POST', headers:{'Content-Type':'application/json'}, body: '{}' });
    const j = await res.json();
    if (j.session){ sessionName = j.session; renderSessionInfo(null, 'created'); showInfoToast('Session created: '+sessionName); }
    else showErrorToast('Failed to create session');
  }catch(e){ showErrorToast('Error creating session (is Worker running at '+apiUrl('/session/create')+'?) '+e.message, 4200); }
}

async function submitToServer(text){
  if (!sessionName) return showErrorToast('No session created');
  try{
    const url = apiUrl('/session/'+encodeURIComponent(sessionName)+'/submit');
    const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
    const j = await res.json();
    if (j.error) showErrorToast('Server error: '+j.error); else { renderSessionInfo(null, 'saved'); }
  }catch(e){ showErrorToast('Error submitting to server: '+e.message); }
}

async function loadSessionStatus(){
  if (!sessionName) return showErrorToast('No session');
  try{
    const url = apiUrl('/session/'+encodeURIComponent(sessionName));
    const res = await fetch(url);
    const j = await res.json();
    if (j.error) return showErrorToast('Server error: '+j.error);
    submitted = (j.texts || []).map(s => normalize(s));
    usedLetters = new Set(j.used || []);
    if (isAlfaScoringMode()) {
      submissionScores = submitted.map((entry, i) => scoreWord(entry, i + 1));
      speedBonuses = submitted.map(() => 0);
      recomputeFinalScoreDeltas();
    } else {
      submissionScores = [];
      speedBonuses = [];
      finalScoreDeltas = [];
    }
    recomputeUsedStarts();
    updateUI();
  }catch(e){ showErrorToast('Error loading session: '+e.message); }
}

function resetLocal(){
  submitted = [];
  usedLetters = new Set();
  submissionScores = [];
  speedBonuses = [];
  finalScoreDeltas = [];
  currentEntryStartedAtMs = null;
  runStartedAtMs = null;
  runEndedAtMs = null;
  syncLiveScoreTimer();
  sessionName = null;
  completionShown = false;
  if (completionResetTimer) {
    clearTimeout(completionResetTimer);
    completionResetTimer = null;
  }
  if (gameOverResetTimer) {
    clearTimeout(gameOverResetTimer);
    gameOverResetTimer = null;
  }
  renderSessionInfo(null);
  lastRenderedRequiredLetter = null;
  lastMilestonePct = 0;
  gameOver = false;
  hideGameOverSummary();
  hideCompletionSummary();
  // restore ignored starts (w,x) and recompute from empty submitted
  recomputeUsedStarts();
  // re-enable inputs
  const submitBtn = document.getElementById('submitCountry');
  const input = document.getElementById('countryInput');
  if (submitBtn) submitBtn.disabled = false;
  if (input) { input.disabled = false; input.value = ''; }
  saveLocal(); updateUI();
}

function recomputeUsedStarts(){
  usedStarts = new Set(IGNORED);
  for (const s of submitted){
    const n = normalize(s);
    if (n && n.length>0) usedStarts.add(n.charAt(0));
  }
}

// Wire up UI
window.addEventListener('load', ()=>{
  ensureColourLegend();
  configureCountryInput();
  loadHighScore(); loadLocal(); updateUI();
  const input = document.getElementById('countryInput');
  const scoreToggle = document.getElementById('scoreToggle');
  if (scoreToggle){
    scoreToggle.checked = true;
    if (scoreToggle.parentElement) scoreToggle.parentElement.style.display = isAlfaScoringMode() ? '' : 'none';
    setScoreDisplayEnabled(true);
    scoreToggle.addEventListener('change', (e) => {
      setScoreDisplayEnabled(e.target.checked);
    });
  }
  document.getElementById('submitCountry').addEventListener('click', async ()=>{
    const text = input.value;
    if (!text) return;
    addCountryLocal(text);
    // automatically persist to server when a session exists
    if (sessionName){ await submitToServer(text); }
    input.value = '';
  });
  input.addEventListener('keypress', (e)=>{ if (e.key === 'Enter'){ e.preventDefault(); document.getElementById('submitCountry').click(); } });
  input.addEventListener('keydown', (e)=>{
    if (!isAlfaScoringMode() || gameOver) return;
    if (e.key === 'Enter') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1 && e.key !== 'Backspace' && e.key !== 'Delete') return;
    if (currentEntryStartedAtMs === null) currentEntryStartedAtMs = Date.now();
  });
  const resetBtn = document.getElementById('resetLocal');
  if (resetBtn) resetBtn.addEventListener('click', ()=>{
    showToast('Reset game? Tap here to confirm.', 'info', 0, () => resetLocal());
    const dismissOnOutsideClick = (e) => {
      const toast = document.getElementById('alfa-toast');
      if (!toast){
        document.removeEventListener('click', dismissOnOutsideClick, true);
        return;
      }
      if (toast.contains(e.target)) return;
      toast.remove();
      document.removeEventListener('click', dismissOnOutsideClick, true);
    };
    // Attach after current click completes so opening the toast doesn't instantly dismiss it.
    setTimeout(() => document.addEventListener('click', dismissOnOutsideClick, true), 0);
  });
  const createBtn = document.getElementById('createSession');
  if (createBtn) createBtn.addEventListener('click', async ()=>{ await createSession(); if (sessionName) await loadSessionStatus(); });
});
