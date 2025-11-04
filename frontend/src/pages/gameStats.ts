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
    container.innerHTML = 'Cargando partida...';

    const matchId = getMatchIdFromUrl();
    if (!matchId) {
      container.innerHTML = `<span style="color:red">Match id inválido en la URL</span>`;
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
      const players = match.players || [];
      const score = match.score || { left: 0, right: 0 };
      const winner = match.winner || 'N/A';
      const endedAt = match.endedAt ? new Date(match.endedAt).toLocaleString() : 'N/A';
      const roomId = match.roomId || 'N/A';

      container.innerHTML = `
        <div class="game-stats-card">
          <h3>Match Details</h3>
          <div class="stats-detail">
            <strong>Room ID:</strong> ${roomId}
          </div>
          <div class="stats-detail">
            <strong>Players:</strong> ${players.join(' vs ')}
          </div>
          <div class="stats-detail">
            <strong>Score:</strong> ${score.left} - ${score.right}
          </div>
          <div class="stats-detail">
            <strong>Winner:</strong> ${winner}
          </div>
          <div class="stats-detail">
            <strong>Date Played:</strong> ${endedAt}
          </div>
          <button onclick="window.location.hash='#/profile'" class="back-btn">Back to Profile</button>
        </div>
      `;
    } catch (err: any) {
      console.error(err);
      container.innerHTML = `<span style="color:red">Error cargando la partida: ${err.message ?? err}</span>`;
    }
  })();
}