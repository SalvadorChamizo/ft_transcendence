import { UI_MESSAGES, CHAT_CONFIG } from "./chatConstants";
import { getAccessToken } from "../../state/authState";
import { getActiveNotificationId, setActiveNotificationId, setActiveNotificationName } from "./chatState";

export function setupSidebarTabs() {
  const tabLinks = document.querySelectorAll(".sidebar-nav-link");
  const tabPanels = document.querySelectorAll(".sidebar-tab-panel");

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

const apiHost = `${window.location.hostname}`

export async function getNotifications() {
    try {
        const token = getAccessToken();
        const res = await fetch(`https://${apiHost}:8443/api/conversations/notifications`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

export async function getSpecificNotification(notificationId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`https://${apiHost}:8443/api/conversations/${notificationId}/notification`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

export async function updateReadAtNotification(notification: any) {
    try {
        if (notification[0].read_at !== null)
                return ;
        
        const notificationId = notification[0].id;

        const token = getAccessToken();
        const res = await fetch(`https://${apiHost}:8443/api/conversations/${notificationId}/read`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const avatarEl = document.querySelector(`.notification-item[data-user-id="${notificationId}"] .notification-avatar`);
        if (avatarEl) {
            avatarEl.textContent = "✅";
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

export async function deleteNotification(notificationId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`https://${apiHost}:8443/api/conversations/${notificationId}/notifyDelete`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = `<div class="welcome-message">
                        <div class="welcome-icon">💬</div>
                        <h3>Welcome to Chat</h3>
                        <p>Select a conversation or start a new one to begin chatting.</p>
                    </div>`;
        }

        return await res.json();
    } catch (err) {
        throw err;
    }
}

export function displayNotification(notification: any) {
    const contactAvatar = document.getElementById('contact-avatar');
    if (contactAvatar) {
        const emoji = notification.read_at === null ? "📩" : "✅";
        contactAvatar.innerHTML = emoji;
    }

    const notificationsTabBtn = document.querySelector('.sidebar-nav-link.notification-btr') as HTMLElement;
    if (notificationsTabBtn) {
        // Extract the current count from the button text
        const match = notificationsTabBtn.textContent?.match(/\((\d+)\)/);
        let unreadCount = match ? parseInt(match[1]) : 0;

        // Decrease count if this notification is read
        if (notification.read_at !== null && unreadCount > 0) {
            unreadCount -= 1;
        }
        if (unreadCount !== 0)
            notificationsTabBtn.textContent = `Notifications (${unreadCount})`;
        else
            notificationsTabBtn.textContent = `Notifications`;
    }

    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer)
        return;
    
    if (notification.content === '') {
        messagesContainer.innerHTML = '';
        return;
    }
    messagesContainer.innerHTML = `
                <div class="message-bubble message-received">
                    <div class="message-content">${notification[0].content}</div>
                    <div class="message-time">${new Date(notification[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
}

export async function selectNotification(notificationId: number, title: string) {
    setActiveNotificationId(notificationId);
    setActiveNotificationName(title);


    // Update the chat header
    const contactName = document.getElementById('contact-name');
    if (contactName) contactName.textContent = title;

    // Update online/offline status dynamically
    const contactStatus = document.getElementById('contact-status');
    if (contactStatus) {
        contactStatus.style.display = 'none';
    }

    // Show and update block button
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const viewProfileButton = document.getElementById('view-profile-btn') as HTMLButtonElement;
    const profileBtn = document.getElementById('view-profile-btn') as HTMLButtonElement;
    const friendBtn = document.getElementById('invite-friend-btn') as HTMLButtonElement;

    if (profileBtn) {
        profileBtn.style.display = 'none';
    }

    if (blockButton) {
        blockButton.style.display = 'none';
    }

    if (friendBtn) {
      friendBtn.style.display = 'none';
    }
    // Show invite to game button
    const inviteBtn = document.getElementById('invite-game-btn') as HTMLButtonElement;
    if (inviteBtn) {
        inviteBtn.style.display = 'none';
    }

    // Charge indicator display
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="loading">Loading notifications...</div>';
    }

    try {
        const result = await getSpecificNotification(notificationId);
        displayNotification(result.notification);
        await updateReadAtNotification(result.notification);
    } catch (err) {
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="error">Failed to load notification content</div>';
        }
    }
}

export async function loadNotificationsAuto() {
  const notificationsList = document.getElementById('notifications-list') as HTMLDivElement;

  try {
    notificationsList.innerHTML = `<div class="loading">${UI_MESSAGES.LOADING_NOTIFICATIONS}</div>`;

    const result = await getNotifications();

    if (result.notifications && result.notifications.length > 0) {
      // Render notifications

    const unreadCount = result.notifications.filter((not: any) => not.read_at === null).length;

    const notificationsTabBtn = document.querySelector('.sidebar-nav-link.notification-btr') as HTMLElement;
    if (notificationsTabBtn) {
      notificationsTabBtn.textContent = `Notifications (${unreadCount})`;
    }

      notificationsList.innerHTML = result.notifications
        .map((not: any) => {
          const emoji = not.read_at === null ? "📩" : "✅";

          return `
            <div class="notification-item" data-user-id="${not.id}">
              <div class="notification-avatar">${emoji}</div>
              <div class="notification-info">
                <div class="notification-title">${not.title}</div>
                <div class="notification-preview">Received: ${new Date(not.created_at).toLocaleString()}</div>
              </div>
              <div id="notification-delete" class="notification-delete">❌</div>
            </div>
          `;
        })
        .join('');

      // Add click handlers
      setTimeout(() => {
        document.querySelectorAll('.notification-item').forEach(item => {
          const notificationId = Number(item.getAttribute('data-user-id'));

          // Restore active selection if it exists
          if (getActiveNotificationId() === notificationId) {
            item.classList.add('active');
          }

          // Main click
          item.addEventListener('click', async (e) => {
            if ((e.target as HTMLElement).classList.contains('notification-delete')) {
              return;
            }

            const titleEl = item.querySelector('.notification-title') as HTMLElement | null;
            const title = titleEl?.textContent?.trim() || '';

            document.querySelectorAll('.notification-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            selectNotification(notificationId, title);
          });

          // Delete button handler
          const deleteBtn = item.querySelector('.notification-delete');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              try {
                await deleteNotification(notificationId);
                item.remove();
              } catch (err) {
                console.error('❌ Error deleting notification:', err);
              }
            });
          }
        });
      }, CHAT_CONFIG.USERNAME_LOADING_DELAY);

    } else {
      notificationsList.innerHTML = `
        <div class="no-notifications">
          <p>${UI_MESSAGES.NO_NOTIFICATIONS_FOUND}</p>
        </div>
      `;
    }

  } catch (error) {
    if (notificationsList) {
      notificationsList.innerHTML = `
        <div class="no-conversations">
          <p style="color: red;">❌ Error loading conversations: ${error}</p>
        </div>
      `;
    }
  }
  try {
    notificationsList.scrollTop = notificationsList.scrollHeight;
  } catch (err: any) {

  }
}
