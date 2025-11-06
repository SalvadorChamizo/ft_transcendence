import * as api from '../services/api';
import { getUserIdByUsername, getUserById, getUserStatsById } from '../services/api';
import { getAccessToken } from '../state/authState';

/**
 * Search for a user by username, then fetch and return their profile data by ID.
 * @param username The username to search for
 * @returns The user profile data or an error message
 */
export async function fetchUserProfileByUsername(username: string) {
  try {
    const id = await getUserIdByUsername(username);
    if (!id) {
      return { error: 'User not found' };
    }
    const user = await getUserById(id);
    if (!user) {
      return { error: 'User data not found' };
    }
    const stats = await getUserStatsById(id);
    return { user, stats };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

export function ProfileView(): string {
  // Render container only — profileViewHandlers se encargará de cargar el perfil desde la URL
  return `
    <div class="profile-page">
      <div id="profile-result">Cargando perfil...</div>
    </div>
  `;
}

/** Extrae el username de la URL:
 * - "#/profile/username"
 * - "#/profile?user=username"
 */
function parseUsernameFromHash(): string | null {
  const hash = window.location.hash || '';
  // /profile/username
  if (hash.startsWith('#/profile/')) {
    const rest = hash.substring('#/profile/'.length);
    // ignore querystring after username
    const username = rest.split('?')[0].split('/')[0];
    return username ? decodeURIComponent(username) : null;
  }
  // /profile?user=username
  if (hash.startsWith('#/profile')) {
    const parts = hash.split('?');
    if (parts.length > 1) {
      const qs = new URLSearchParams(parts[1]);
      const u = qs.get('user') || qs.get('username');
      if (u) return decodeURIComponent(u);
    }
  }
  return null;
}

/** Intenta resolver el username del usuario logueado por varios medios */
async function resolveCurrentUsername(): Promise<string | null> {
  console.log('[profile] resolveCurrentUsername: start');

  // 1) api.getCurrentUser() si existe
  try {
    if (typeof (api as any).getCurrentUser === 'function') {
      console.log('[profile] resolveCurrentUsername: calling api.getCurrentUser()');
      const cu = await (api as any).getCurrentUser();
      console.log('[profile] resolveCurrentUsername: api.getCurrentUser ->', cu);
      if (cu && cu.username) {
        console.log('[profile] resolveCurrentUsername: got username from api.getCurrentUser', cu.username);
        return cu.username;
      }
    }
  } catch (err) {
    console.error('[profile] resolveCurrentUsername: api.getCurrentUser error', err);
  }

  // 2) Intentar /users/me directamente (gateway -> user-management-service)
  try {
    const token = getAccessToken();
    console.log('[profile] resolveCurrentUsername: token present?', !!token);
    const headers: Record<string,string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    console.log('[profile] resolveCurrentUsername: fetching /users/me with headers', Object.keys(headers));
    const resp = await fetch(`http://${window.location.hostname}:8080/users/me`, { headers });
    console.log('[profile] resolveCurrentUsername: /users/me status', resp.status);
    let body: any = null;
    try { body = await resp.json(); } catch (e) { console.warn('[profile] /users/me invalid json', e); }
    console.log('[profile] resolveCurrentUsername: /users/me body', body);
    console.log('[profile] resolveCurrentUsername: body.user', body?.user);
    console.log('[profile] resolveCurrentUsername: body.user.username', body?.user?.username);
    if (resp.ok && body && body.user && body.user.username) {
      console.log('[profile] resolveCurrentUsername: got username from /users/me', body.user.username);
      return body.user.username;
    }
  } catch (err) {
    console.error('[profile] resolveCurrentUsername: fetch /users/me error', err);
  }

  // 3) fallback: localStorage (si el login guardó username allí)
  try {
    const stored = localStorage.getItem('username');
    console.log('[profile] resolveCurrentUsername: localStorage username', stored);
    if (stored) return stored;
  } catch (err) { console.error('[profile] resolveCurrentUsername: localStorage error', err); }

  console.warn('[profile] resolveCurrentUsername: could not determine username');
  return null;
}

/**
 * Dibuja la progresión de win% en un canvas.
 * - matches: array cronológico/reciente; se usa ownerResult/won/result/winner/profileUsername para determinar victorias.
 */
function drawWinLossChart(canvas: HTMLCanvasElement, matches: any[]) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W = 600;
  const H = 160;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sorted = (matches || []).slice(-50).sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  let wins = 0;
  let games = 0;
  const points: number[] = [];
  for (const m of sorted) {
    let userWon: boolean | null = null;
    if (typeof m.ownerResult === 'string') {
      userWon = m.ownerResult === 'win';
    } else if (typeof m.won === 'boolean') {
      userWon = m.won;
    } else if (m.result === 'win' || m.result === 'loss') {
      userWon = m.result === 'win';
    } else if (m.winner && m.profileUsername) {
      userWon = (m.winner === m.profileUsername);
    } else {
      userWon = null;
    }

    if (userWon === null) continue;
    games++;
    if (userWon) wins++;
    points.push((wins / games) * 100);
  }

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  if (points.length === 0) {
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText("Not enough match data to display progression", 12, H / 2);
    return;
  }

  // grid
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  const plotTop = 10;
  const plotLeft = 40;
  const plotWidth = W - 60;
  const plotHeight = H - 40;
  for (let i = 0; i <= 4; i++) {
    const y = plotTop + (i / 4) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotLeft + plotWidth, y);
    ctx.stroke();
  }

  // axes
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop);
  ctx.lineTo(plotLeft, plotTop + plotHeight);
  ctx.lineTo(plotLeft + plotWidth, plotTop + plotHeight);
  ctx.stroke();

  // line
  ctx.beginPath();
  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 2;
  const step = plotWidth / (points.length - 1 || 1);
  for (let i = 0; i < points.length; i++) {
    const x = plotLeft + step * i;
    const y = plotTop + (1 - points[i] / 100) * plotHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // fill area
  ctx.lineTo(plotLeft + step * (points.length - 1), plotTop + plotHeight);
  ctx.lineTo(plotLeft, plotTop + plotHeight);
  ctx.closePath();
  ctx.fillStyle = "rgba(25,118,210,0.12)";
  ctx.fill();

  // dots
  ctx.fillStyle = "#1976d2";
  for (let i = 0; i < points.length; i++) {
    const x = plotLeft + step * i;
    const y = plotTop + (1 - points[i] / 100) * plotHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // labels
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.fillText("100%", 8, plotTop + 6);
  ctx.fillText("0%", 8, plotTop + plotHeight + 4);
  ctx.fillText("Win % progression", W / 2 - 50, 16);
}

export function profileViewHandlers() {
  // al cargar la vista, obtenemos el username de la URL o el usuario actual automáticamente
  (async () => {
    const resultDiv = document.getElementById('profile-result');
    if (!resultDiv) return;

    resultDiv.innerHTML = 'Cargando perfil...';

    console.log('[profile] profileHandlers: start');
    console.log('[profile] profileHandlers: current hash', window.location.hash);

    let username = parseUsernameFromHash();
    console.log('[profile] profileHandlers: parsed username from hash', username);

    if (!username) {
      console.log('[profile] profileHandlers: no username from hash, resolving current user');
      username = await resolveCurrentUsername();
      console.log('[profile] profileHandlers: resolved current username', username);
    }

    if (!username) {
      console.log('[profile] profileHandlers: no username resolved, showing error');
      resultDiv.innerHTML = `<span style='color:red'>No se pudo determinar el usuario. Especifica el username en la URL o inicia sesión.</span>`;
      return;
    }

    const res = await fetchUserProfileByUsername(username);
    if (res.error) {
      resultDiv.innerHTML = `<span style='color:red'>${res.error}</span>`;
      return;
    }
  const user = res.user;
  const stats: any = res.stats ?? {};

    // Derived stats
    const victories = Number(stats.victories ?? 0);
    const defeats = Number(stats.defeats ?? 0);
    const games = victories + defeats;
    const winRate = games > 0 ? Math.round((victories / games) * 100) : 0;
    const streak = stats.current_streak ?? stats.streak ?? 0;
    const elo = stats.elo ?? stats.rating ?? 'N/A';
    const lastActive = user.last_active ? new Date(user.last_active).toLocaleString() : 'N/A';

    // Recent matches if provided by stats API (optional)
    const recentMatches = Array.isArray(stats.recentMatches) ? stats.recentMatches.slice(0, 50) : [];

    // Prepare last10 list
    const last10 = recentMatches.slice(-10).reverse();

    resultDiv.innerHTML = `
      <div class="profile-card enhanced">
        <div class="profile-top">
          <div class="profile-avatar">${user.username?.charAt(0)?.toUpperCase() ?? '?'}</div>
          <div class="profile-meta">
            <h2 class="profile-username">${user.username}</h2>
            <p class="profile-email">${user.email ?? 'No email'}</p>
            <p class="profile-last-active">Última conexión: <span>${lastActive}</span></p>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Games</div>
            <div class="stat-value">${games}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Wins</div>
            <div class="stat-value">${victories}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Losses</div>
            <div class="stat-value">${defeats}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value">${winRate}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Streak</div>
            <div class="stat-value">${streak}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">ELO</div>
            <div class="stat-value">${elo}</div>
          </div>
        </div>

        <div class="stat-bar-wrap">
          <div class="stat-bar-label">Win rate</div>
          <div class="stat-bar">
            <div class="stat-bar-fill" style="width:${winRate}%;"></div>
          </div>
        </div>

        <div class="chart-section">
          <h3>Win/Loss progression (recent)</h3>
          <canvas id="winloss-chart" width="600" height="160" style="width:100%;max-width:600px;border:1px solid #eee;background:#fff;"></canvas>
        </div>

        ${last10.length > 0 ? `
          <div class="recent-matches">
            <h3>Últimas partidas</h3>
            <ul>
              ${last10.map((m: any) => {
                const id = m.id ?? m.matchId ?? m._id ?? m.uuid ?? '';
                const text = m.summary ?? `${m.left ?? 'L'} ${m.score_left ?? ''} - ${m.score_right ?? ''} ${m.right ?? 'R'}`;
                return `<li class="recent-match-item" data-id="${String(id)}" style="cursor:pointer">${text}</li>`;
              }).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    // Fetch and display friends for this user (if allowed by backend) via direct fetch (minimal change)
    (async () => {
      try {
        const token = getAccessToken();
        const friendsResp = await fetch(`http://${window.location.hostname}:8080/users/getFriends`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': String(user.id)
          }
        });
        if (friendsResp.ok) {
          const friendsData = await friendsResp.json();
          const friends = friendsData.friends || [];
          if (friends.length > 0) {
            const listHTML = `<div class="friends-section"><h3>Friends</h3><ul class="friends-list">${friends.map((f: any) => `<li><a href="#/profile/${encodeURIComponent(f.username)}">${f.username}</a></li>`).join('')}</ul></div>`;
            resultDiv.querySelector('.profile-card.enhanced')!.insertAdjacentHTML('beforeend', listHTML);
          }
        }
      } catch (err) {
        // ignore silently, friends optional
      }
    })();

    // Draw chart after DOM insertion
    const canvas = document.getElementById('winloss-chart') as HTMLCanvasElement | null;
    if (canvas) {
      const enriched = recentMatches.map((m: any) => ({ ...m, profileUsername: user.username }));
      drawWinLossChart(canvas, enriched);
    }

    // Attach click handler for recent matches
    document.querySelectorAll('.recent-match-item').forEach((el) => {
      el.addEventListener('click', (ev) => {
        const target = ev.currentTarget as HTMLElement;
        const id = target.getAttribute('data-id');
        if (!id) return;
        window.location.hash = `#/match/${encodeURIComponent(id)}`;
      });
    });
  })();
}
