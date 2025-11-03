import { getUserIdByUsername, getUserStatsById } from '../services/api';
import { getAccessToken } from '../state/authState';

function parseUsernameFromHash(): string | null {
  const hash = window.location.hash || '';
  // /profile/stats?user=username
  if (hash.startsWith('#/profile/stats')) {
    const parts = hash.split('?');
    if (parts.length > 1) {
      const qs = new URLSearchParams(parts[1]);
      const u = qs.get('user') || qs.get('username');
      if (u) return decodeURIComponent(u);
    }
  }
  return null;
}

async function resolveCurrentUsername(): Promise<string | null> {
  try {
    const token = getAccessToken();
    const headers: Record<string,string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(`http://${window.location.hostname}:8080/users/me`, { headers });
    if (resp.ok) {
      const body = await resp.json();
      return body?.user?.username || null;
    }
  } catch (e) {}
  try { const stored = localStorage.getItem('username'); if (stored) return stored; } catch {}
  return null;
}

export function ProfileStats() {
  setTimeout(() => profileStatsHandlers(), 0);
  return `
    <div class="profile-stats-page">
      <h2>Dashboard de estadísticas</h2>
      <div id="profile-stats-result">Cargando estadísticas...</div>
    </div>
  `;
}

export async function profileStatsHandlers() {
  const resultDiv = document.getElementById('profile-stats-result');
  if (!resultDiv) return;
  resultDiv.innerHTML = 'Cargando estadísticas...';

  let username = parseUsernameFromHash();
  if (!username) username = await resolveCurrentUsername();
  if (!username) {
    resultDiv.innerHTML = `<span style='color:red'>No se pudo determinar el usuario. Inicia sesión.</span>`;
    return;
  }

  // Resolve id then stats
  const id = await getUserIdByUsername(username);
  if (!id) {
    resultDiv.innerHTML = `<span style='color:red'>Usuario no encontrado</span>`;
    return;
  }

  const stats = await getUserStatsById(id);
  if (!stats) {
    resultDiv.innerHTML = `<span>No hay estadísticas disponibles.</span>`;
    return;
  }

  const s: any = stats;
  const victories = Number(s.victories ?? 0);
  const defeats = Number(s.defeats ?? 0);
  const games = victories + defeats;
  const winRate = games > 0 ? Math.round((victories / games) * 100) : 0;

  const recentMatches = Array.isArray(s.recentMatches) ? s.recentMatches : [];

  resultDiv.innerHTML = `
    <div class="stats-card">
      <p>Usuario: <strong>${username}</strong></p>
      <div class="stats-grid">
        <div>Games: ${games}</div>
        <div>Wins: ${victories}</div>
        <div>Losses: ${defeats}</div>
        <div>Win rate: ${winRate}%</div>
      </div>
      <h3>Historial reciente</h3>
      <ul>
        ${recentMatches.slice(0, 50).map((m: any) => {
          const id = m.id ?? m.matchId ?? '';
          const ts = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
          const summary = m.summary ?? JSON.stringify(m);
          return `<li data-id="${id}">${ts} - ${summary}</li>`;
        }).join('')}
      </ul>
    </div>
  `;

  // Links to match details
  document.querySelectorAll('#profile-stats-result li[data-id]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      const id = (ev.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;
      window.location.hash = `#/match/${encodeURIComponent(id)}`;
    });
  });
}
