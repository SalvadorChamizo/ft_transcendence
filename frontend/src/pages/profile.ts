import { getAccessToken } from "../state/authState";
import { getUserIdByUsername, getUserById, getUserStatsById } from "../services/api";
import { fetchCurrentUser } from "./Login/loginService";
import { getMatchesByPlayerId } from "../services/api";

(function setupUserUpdateListener() {
  if (!(window as any).__profile_user_updated_listener_installed) {
    window.addEventListener('user:updated', () => {
      try { localStorage.removeItem('user'); } catch (e) {}
      if ((window.location.hash || '').startsWith('#/profile')) {
        window.location.reload();
        return;
      }
      setTimeout(() => {
        try { profileHandlers(); } catch (e) {}
      }, 0);
    });

    (window as any).__profile_user_updated_listener_installed = true;
  }
})();


const apiHost = `${window.location.hostname}`;

export function Profile() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return `
      <div class="profile-actions">
        <h1>Profile</h1>
        <p>Please log in to view your profile.</p>
      </div>
    `;
  }
  setTimeout(() => profileHandlers(), 0);
  setTimeout(() => setupProfileTabs(), 0);
  return `
    <div class="profile-container">
      <h2>Profile</h2>
      <div class="profile-card expanded">
        <ul class="profile-nav">
          <li class="profile-nav-item">
            <button type="button" class="profile-nav-link active" data-tab="profile-tab">Profile</button>
          </li>
          <li class="profile-nav-item">
            <button type="button" class="profile-nav-link" data-tab="dashboard-tab">Dashboard</button>
          </li>
        </ul>

        <div class="profile-tab-content">
          <div id="profile-tab" class="profile-tab-panel active">
            <div class="profile-form-section">
              <div class="avatar-section">
                <p id="avatar"></p>
              </div>
            </div>

            <div class="profile-form-section">
              <p id="username">Username</p>
            </div>

            <div class="profile-form-section">
              <p id="useremail">Email</p>
            </div>
            <div class="profile-form-section">
              <h3>Friends</h3>
              <div id="friends-list">Loading friends...</div>
            </div>
          </div>

          <div id="dashboard-tab" class="profile-tab-panel">
            <div class="stats-section">
              <h3>Statistics</h3>
              <div id="stats-container">
                <p>Loading stats...</p>
              </div>
              <canvas id="stats-chart" width="400" height="200"></canvas>
            </div>
            <div class="history-section">
              <h3>Match History</h3>
              <div id="history-container">
                <p>Loading history...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function profileHandlers() {
  const accessToken = getAccessToken();
  const usernameField = document.querySelector<HTMLParagraphElement>("#username")!;
  const emailField = document.querySelector<HTMLParagraphElement>("#useremail")!;
  const avatarField = document.querySelector<HTMLParagraphElement>("#avatar")!;
  const statsContainer = document.querySelector<HTMLDivElement>("#stats-container")!;
  const historyContainer = document.querySelector<HTMLDivElement>("#history-container")!;
  const statsChart = document.querySelector<HTMLCanvasElement>("#stats-chart")!;

  // Parse username from URL - supports both /profile/username and /profile?username=...
  function getUsernameFromUrl(): string | null {
    const hash = window.location.hash || '';
    
    // Check for /profile/username format first
    if (hash.startsWith('#/profile/')) {
      const rest = hash.substring('#/profile/'.length);
      const username = rest.split('?')[0].split('/')[0];
      return username ? decodeURIComponent(username) : null;
    }
    
    // Fallback to query param format: /profile?username=...
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return urlParams.get('username');
  }

  // Fetch user data
  async function fetchUserData() {
    try {
      const urlUsername = getUsernameFromUrl();
      let userData: any;
      let userId: number;

      if (urlUsername) {
        // Fetch data for specific user
        const fetchedUserId = await getUserIdByUsername(urlUsername);
        if (!fetchedUserId) {
          // User not found - redirect to error page
          window.location.hash = '#/error';
          return;
        }
        userId = fetchedUserId;
        userData = await getUserById(userId);
        if (!userData) {
          // User data not found - redirect to error page
          window.location.hash = '#/error';
          return;
        }
      } 
      else {
        // Fetch fresh data for current user — do NOT read from local cache.
        try {
          const data = await fetchCurrentUser(accessToken);
          userData = data?.user ?? null;
        } catch (e) {
          console.error('[Profile] fetchCurrentUser failed', e);
          window.location.hash = '#/login';
          return;
        }

        if (!userData) {
          // no user data available — redirect to login
          window.location.hash = '#/login';
          return;
        }
        userId = userData.id;
      }

      if (usernameField) {
        usernameField.textContent = `Username: ${userData.username}`;
      }
      if (emailField)
        emailField.textContent = `Email: ${userData.email}`;

      // Fetch avatar
      const avatarIMG = await fetch(`http://${apiHost}:8080/users/getAvatar`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-user-id": userId.toString(),
        },
      });
      if (avatarIMG.ok) {
        avatarField.innerHTML = `<img src="${URL.createObjectURL(await avatarIMG.blob())}" alt="User Avatar" width="100" height="100"/>`;
      }

      // Fetch stats and history for dashboard
      fetchStatsAndHistory(userId, urlUsername ? null : userData);

      // Fetch friends and render (call user-management endpoint directly)
      try {
        const friendsDiv = document.getElementById('friends-list');
        const res = await fetch(`http://${apiHost}:8080/users/getFriends`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-user-id': String(userId)
          }
        });
        if (!res.ok) {
          if (friendsDiv) friendsDiv.innerHTML = '<p>No friends found or error.</p>';
        } else {
          const data = await res.json();
          const friends = data.friends || [];
          if (friendsDiv) {
            if (friends.length === 0) friendsDiv.innerHTML = '<p>No friends yet.</p>';
            else friendsDiv.innerHTML = `<ul class="friends-list">${friends.map((f: any) => `<li class="friend-item" data-id="${f.id}"><a href="#/profile/${encodeURIComponent(f.username)}">${f.username}</a></li>`).join('')}</ul>`;
          }
        }
      } catch (e) {
        const friendsDiv = document.getElementById('friends-list');
        if (friendsDiv) friendsDiv.innerHTML = '<p>Error loading friends.</p>';
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      if (usernameField) {
        usernameField.textContent = `Error: ${err.message}`;
      }
    }
  }

  async function fetchStatsAndHistory(userId: number, userData?: any) {
    try {
      let victories: number;
      let defeats: number;

      if (userData && userData.victories !== undefined && userData.defeats !== undefined) {
        // Use stats from userData
        victories = userData.victories;
        defeats = userData.defeats;
      } else {
        // Fetch stats
        const stats = await getUserStatsById(userId);
        if (!stats) {
          throw new Error('Stats not found');
        }
        victories = stats.victories || 0;
        defeats = stats.defeats || 0;
      }

      // Fetch match history
      let history: any[];
      if (userData && userData.matchHistory) {
        history = userData.matchHistory;
      } else {
                history = await getMatchesByPlayerId(userId);
      }


      // Display stats
      const games = victories + defeats;
      const winRate = games > 0 ? Math.round((victories / games) * 100) : 0;

      statsContainer.innerHTML = `
        <p>Games: ${games}</p>
        <p>Wins: ${victories}</p>
        <p>Losses: ${defeats}</p>
        <p>Win Rate: ${winRate}%</p>
      `;

      // Simple chart
      drawSimpleChart(statsChart, victories, defeats);

      // Display history
      if (Array.isArray(history) && history.length > 0) {
        historyContainer.innerHTML = history.slice(-10).reverse().map((match: any) => `
          <p class="match-history-item" data-match-id="${match.id || match._id || match.uuid || ''}" style="cursor:pointer; padding: 8px; border: 1px solid #42f3fa; margin: 4px 0; border-radius: 4px;">
            Match: ${match.players.join(' vs ')} - Score: ${match.score.left}-${match.score.right} - Winner: ${match.winner || 'N/A'}
          </p>
        `).join('');

        // Add click handlers for match history items
        setTimeout(() => {
          document.querySelectorAll('.match-history-item').forEach((item) => {
            item.addEventListener('click', (e) => {
              const target = e.currentTarget as HTMLElement;
              const matchId = target.getAttribute('data-match-id');
              if (matchId) {
                window.location.hash = `#/game-stats?id=${encodeURIComponent(matchId)}`;
              }
            });
          });
        }, 0);
      } else {
        historyContainer.innerHTML = '<p>No matches found.</p>';
      }
    } catch (err) {
      console.error("Error fetching stats/history:", err);
      statsContainer.innerHTML = '<p>Error loading stats.</p>';
      historyContainer.innerHTML = '<p>Error loading history.</p>';
    }
  }

  function drawSimpleChart(canvas: HTMLCanvasElement, wins: number, losses: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = wins + losses;
    if (total === 0) return;

    const winAngle = (wins / total) * 2 * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Wins (green)
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, winAngle);
    ctx.lineTo(100, 100);
    ctx.fillStyle = 'green';
    ctx.fill();

    // Losses (red)
    ctx.beginPath();
    ctx.arc(100, 100, 80, winAngle, 2 * Math.PI);
    ctx.lineTo(100, 100);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Labels
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`Wins: ${wins}`, 10, 20);
    ctx.fillText(`Losses: ${losses}`, 10, 40);
  }

  fetchUserData();
}

export function setupProfileTabs() {
  const tabLinks = document.querySelectorAll(".profile-nav-link");
  const tabPanels = document.querySelectorAll(".profile-tab-panel");

  tabLinks.forEach(link => {
    link.addEventListener("click", function (this: Element) {
      const target = this.getAttribute("data-tab");
      if (!target) return;

      tabLinks.forEach(l => l.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(target)?.classList.add("active");
    });
  });
}