const appEl = document.getElementById('app');
const dateLabel = document.getElementById('date-label');

// ── Helpers ────────────────────────────────────────────────────────────────

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function formatDayHeading(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = isoDate(new Date());
  const tomorrow = isoDate(new Date(Date.now() + 86400000));
  const prefix = dateStr === today ? 'Today — ' : dateStr === tomorrow ? 'Tomorrow — ' : '';
  return prefix + d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatWeekLabel(monday, sunday) {
  const opts = { day: 'numeric', month: 'short' };
  return `Week of ${monday.toLocaleDateString('en-GB', opts)} – ${sunday.toLocaleDateString('en-GB', opts)}`;
}

function formatTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(status) {
  if (status === 'IN_PLAY' || status === 'PAUSED') return ['LIVE', 'status-live'];
  if (status === 'FINISHED')                        return ['FT', 'status-fin'];
  return ['', 'status-sched'];
}

// ── Prediction Logic ────────────────────────────────────────────────────────

function buildStandingsMap(standingsData) {
  const tables = standingsData.standings || [];
  const total = tables.find(t => t.type === 'TOTAL') || tables[0];
  if (!total) return null;

  const map = {};
  let goalsForSum = 0, playedSum = 0;

  for (const row of total.table) {
    map[row.team.id] = row;
    goalsForSum += row.goalsFor;
    playedSum   += row.playedGames;
  }

  const leagueAvg = playedSum > 0 ? goalsForSum / playedSum : 1.3;
  const maxPos    = total.table.length;

  return { map, leagueAvg, maxPos };
}

function predict(homeRow, awayRow, leagueAvg, maxPos) {
  if (!homeRow || !awayRow) return null;
  if (homeRow.playedGames === 0 || awayRow.playedGames === 0) return null;

  const HOME_ADV = 1.25;

  const homeAttack  = homeRow.goalsFor      / homeRow.playedGames;
  const homeDefense = homeRow.goalsAgainst  / homeRow.playedGames;
  const awayAttack  = awayRow.goalsFor      / awayRow.playedGames;
  const awayDefense = awayRow.goalsAgainst  / awayRow.playedGames;

  const avg = leagueAvg || 1.3;

  const homeXG = (homeAttack / avg) * (awayDefense / avg) * avg * HOME_ADV;
  const awayXG = (awayAttack / avg) * (homeDefense / avg) * avg;

  const homeGoals = Math.round(Math.max(0, homeXG));
  const awayGoals = Math.round(Math.max(0, awayXG));

  const posDiff    = Math.abs(homeRow.position - awayRow.position);
  const confidence = Math.min(90, Math.max(50, Math.round(50 + (posDiff / maxPos) * 40)));

  return { homeGoals, awayGoals, confidence };
}

// ── Rendering ───────────────────────────────────────────────────────────────

function confClass(pct) {
  if (pct >= 75) return 'conf-high';
  if (pct >= 62) return 'conf-mid';
  return 'conf-low';
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function renderMatch(match, standingsInfo) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const [statusText, statusClass] = statusLabel(match.status);

  let predHTML = `<span class="no-pred">No standings data</span>`;
  let confHTML  = '';
  let homePosText = '';
  let awayPosText = '';

  if (standingsInfo) {
    const { map, leagueAvg, maxPos } = standingsInfo;
    const homeRow = map[home.id];
    const awayRow = map[away.id];
    const result  = predict(homeRow, awayRow, leagueAvg, maxPos);

    homePosText = homeRow ? `${ordinal(homeRow.position)} · ${homeRow.points} pts` : '';
    awayPosText = awayRow ? `${ordinal(awayRow.position)} · ${awayRow.points} pts` : '';

    if (result) {
      const { homeGoals, awayGoals, confidence } = result;
      predHTML = `
        <div class="predicted-score">
          <span class="pred-label">Predicted</span>
          <span class="score-badge">${homeGoals} – ${awayGoals}</span>
        </div>`;
      confHTML = `
        <div class="confidence-wrap">
          <span class="confidence-label">Confidence</span>
          <div class="confidence-bar-bg">
            <div class="confidence-bar-fill ${confClass(confidence)}" style="width:${confidence}%"></div>
          </div>
          <span class="confidence-pct">${confidence}%</span>
        </div>`;
    }
  }

  const timeStr = match.utcDate ? formatTime(match.utcDate) : '';
  const badge   = statusText ? `<span class="status-badge ${statusClass}">${statusText}</span>` : '';

  return `
    <div class="match-card">
      <div class="match-teams">
        <div class="team home">
          <span class="team-name">${home.name}</span>
          ${homePosText ? `<span class="team-position">${homePosText}</span>` : ''}
        </div>
        <div class="vs-divider">
          VS${badge}
          <div class="match-time">${timeStr}</div>
        </div>
        <div class="team away">
          <span class="team-name">${away.name}</span>
          ${awayPosText ? `<span class="team-position">${awayPosText}</span>` : ''}
        </div>
      </div>
      <div class="prediction">
        ${predHTML}
        ${confHTML}
      </div>
    </div>`;
}

function renderDay(dateStr, byComp, standingsMap) {
  let html = `<div class="day-section">
    <h2 class="day-heading">${formatDayHeading(dateStr)}</h2>`;

  for (const compId of Object.keys(byComp)) {
    const { meta, matches } = byComp[compId];
    const emblem = meta.emblem
      ? `<img class="competition-emblem" src="${meta.emblem}" alt="" loading="lazy" />`
      : '';
    const cards = matches.map(m => renderMatch(m, standingsMap[meta.id] || null)).join('');

    html += `
      <section class="competition">
        <div class="competition-header">
          ${emblem}
          <span class="competition-name">${meta.name}</span>
          <span class="match-count">${matches.length} match${matches.length !== 1 ? 'es' : ''}</span>
        </div>
        ${cards}
      </section>`;
  }

  html += `</div>`;
  return html;
}

// ── Data fetching ───────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function fetchAllStandings(competitionIds) {
  const map = {};
  for (const id of competitionIds) {
    try {
      const data = await fetchJSON(`/api/standings/${id}`);
      map[id] = buildStandingsMap(data);
    } catch (e) {
      console.warn(`No standings for competition ${id}:`, e.message);
      map[id] = null;
    }
    await new Promise(r => setTimeout(r, 700));
  }
  return map;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function init() {
  const { monday, sunday } = getWeekRange();
  dateLabel.textContent = formatWeekLabel(monday, sunday);

  try {
    const weekData = await fetchJSON('/api/week');
    const matches  = weekData.matches || [];

    if (matches.length === 0) {
      appEl.innerHTML = `
        <div class="no-matches">
          <div class="big">📅</div>
          <p>No matches scheduled this week.</p>
        </div>`;
      return;
    }

    // Group: date → competitionId → { meta, matches[] }
    const byDate = {};
    const compIdSet = new Set();

    for (const m of matches) {
      const dateStr = m.utcDate.slice(0, 10);
      const compId  = m.competition.id;
      compIdSet.add(compId);

      if (!byDate[dateStr]) byDate[dateStr] = {};
      if (!byDate[dateStr][compId]) byDate[dateStr][compId] = { meta: m.competition, matches: [] };
      byDate[dateStr][compId].matches.push(m);
    }

    appEl.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Fetching standings & calculating predictions…</p>
      </div>`;

    const standingsMap = await fetchAllStandings([...compIdSet]);

    let html = '';
    for (const dateStr of Object.keys(byDate).sort()) {
      html += renderDay(dateStr, byDate[dateStr], standingsMap);
    }

    appEl.innerHTML = html;
  } catch (err) {
    appEl.innerHTML = `
      <div class="error-msg">
        <strong>Error loading data:</strong> ${err.message}
      </div>`;
  }
}

init();
