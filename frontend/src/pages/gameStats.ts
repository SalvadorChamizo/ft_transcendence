// Página para mostrar estadísticas de una partida concreta: #/game-stats?id={matchId}
import * as api from "../services/api";
import { getAccessToken } from "../state/authState";

const apiHost = `${window.location.hostname}`;

export function GameStats(): string {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return `
      <div class="game-stats-actions">
        <h1>Game Statistics</h1>
        <p>Please log in to view game statistics.</p>
      </div>
    `;
  }
  setTimeout(() => gameStatsHandlers(accessToken), 0);
  return `
    <div class="game-stats-container">
      <h2>Game Statistics</h2>
      <div id="game-stats-content">
        <p>Loading game statistics...</p>
      </div>
    </div>
  `;
}

function getMatchIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return urlParams.get('id');
}

export function gameStatsHandlers(accessToken: string) {
  (async () => {
    const container = document.getElementById('game-stats-content');
    if (!container) return;
    container.innerHTML = 'Loading match...';

    const matchId = getMatchIdFromUrl();
    if (!matchId) {
      container.innerHTML = `<span style="color:red">Invalid match ID in URL</span>`;
      return;
    }

    try {
      // For now, we'll fetch all matches for the current user and find the specific match
      // In a real implementation, you'd have an endpoint like /matches/${matchId}
      const userRes = await fetch(`http://${apiHost}:8080/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error('Failed to get user data');
      }

  const historyRes = await fetch(`http://${apiHost}:8080/game/matches/player/${userData.user.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const history = await historyRes.json();

      // Find the specific match
      const match = history.find((m: any) => m.id === matchId || m._id === matchId || m.uuid === matchId);
      if (!match) {
        container.innerHTML = '<p>Match not found.</p>';
        return;
      }

      // Display match details
      const rawPlayers = match.players || [];
      const score = match.score || { left: 0, right: 0 };
      const endedAt = match.endedAt ? new Date(match.endedAt).toLocaleString() : 'N/A';
      // room id may come as roomId or room_id depending on backend; handle both
  // Try multiple places where room id could be stored
  let rawRoomId: any = match.roomId ?? match.room_id ?? (match.room && (match.room.roomId ?? match.room.id)) ?? match.room ?? null;
  if (rawRoomId === null || typeof rawRoomId === 'undefined') rawRoomId = 'N/A';
  const roomId = rawRoomId;

      // Resolve player IDs to usernames (with simple cache)
      const usernameCache = new Map<string, string>();
      async function resolvePlayer(p: any) {
        const pid = String(p);
        if (usernameCache.has(pid)) return usernameCache.get(pid)!;
        try {
          const user = await api.getUserById(Number(pid));
          const uname = user?.username ?? 'deleted_account';
          usernameCache.set(pid, uname);
          return uname;
        } catch (err) {
          usernameCache.set(pid, 'deleted_account');
          return 'deleted_account';
        }
      }

      const playersArr: string[] = Array.isArray(rawPlayers) ? rawPlayers : (typeof rawPlayers === 'string' ? JSON.parse(rawPlayers) : []);
      const displayPlayers = await Promise.all(playersArr.map(p => resolvePlayer(p)));

      // If roomId is missing, try to find a matching room by players (best-effort)
      let resolvedRoomId = roomId;
      if ((resolvedRoomId === null || resolvedRoomId === 'N/A' || resolvedRoomId === undefined) && playersArr.length > 0) {
        try {
          const roomsRes = await fetch(`http://${apiHost}:8080/game/rooms`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (roomsRes.ok) {
            const rooms = await roomsRes.json();
            // find a room whose players array contains all players in this match (string match)
            const matchPlayersSet = new Set(playersArr.map(String));
            for (const r of rooms) {
              const rPlayers = Array.isArray(r.players) ? r.players.map(String) : (typeof r.players === 'string' ? JSON.parse(r.players) : []);
              const rSet = new Set(rPlayers);
              let allPresent = true;
              for (const p of matchPlayersSet) {
                if (!rSet.has(p)) { allPresent = false; break; }
              }
              if (allPresent && r.id) {
                resolvedRoomId = r.id;
                break;
              }
            }
          }
        } catch (err) {
          // ignore — we'll keep room as N/A
        }
      }

      // Resolve winner display
      let winnerDisplay = 'N/A';
      if (typeof match.winner !== 'undefined' && match.winner !== null) {
        const w = String(match.winner);
        if (w === 'left') winnerDisplay = displayPlayers[0] ?? w;
        else if (w === 'right') winnerDisplay = displayPlayers[1] ?? w;
        else winnerDisplay = await resolvePlayer(w);
      }

      // Make player usernames link to their profile
      const playerLinks = displayPlayers.map(u => `<a href="#/profile/${encodeURIComponent(u)}">${u}</a>`).join(' vs ');

      container.innerHTML = `
        <div class="game-stats-card">
          <h3>Match Details</h3>
          <div class="stats-detail">
            <strong>Players:</strong> ${playerLinks}
          </div>
          <div class="stats-detail">
            <strong>Score:</strong> ${score.left} - ${score.right}
          </div>
          <div class="stats-detail">
            <strong>Winner:</strong> ${winnerDisplay}
          </div>
          <div class="stats-detail">
            <strong>Date Played:</strong> ${endedAt}
          </div>
          <button onclick="window.location.hash='#/profile'" class="back-btn">Back to Profile</button>
        </div>
      `;
    } catch (err: any) {
      container.innerHTML = `<span style="color:red">Error loading match: ${err.message ?? err}</span>`;
    }
  })();
}