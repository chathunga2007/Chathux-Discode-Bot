/**
 * ChathuX Frontend Global Utility
 * Seamlessly adapts between Express Production Server (Port 3000) and Live Server Preview (Port 5500)
 */

const isLivePreview = window.location.port === '5500' || window.location.protocol === 'file:';

document.addEventListener('DOMContentLoaded', async () => {
    setupPreviewMode();
    await checkAuthState();
    setupNavigationRouting();
});

/**
 * If user opens files via Live Server (port 5500) or file://
 */
function setupPreviewMode() {
    if (!isLivePreview) return;

    // Show friendly preview indicator
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.background = 'linear-gradient(90deg, #7c3aed, #06b6d4)';
    banner.style.color = '#ffffff';
    banner.style.textAlign = 'center';
    banner.style.padding = '5px 12px';
    banner.style.fontSize = '12px';
    banner.style.fontWeight = '600';
    banner.style.zIndex = '999999';
    banner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
    banner.innerHTML = `
        ⚡ <span>Live Server Preview Active (Port 5500). To run live Discord Bot & Dashboard API, execute <code>npm start</code> in terminal and open <a href="http://localhost:3000" style="color:#fff; text-decoration:underline;">http://localhost:3000</a>!</span>
    `;
    document.body.prepend(banner);

    // Adjust navbar padding to accommodate banner
    const nav = document.querySelector('.navbar-custom');
    if (nav) nav.style.top = '28px';
}

/**
 * Rewrites navigation links when in static Live Server preview
 */
function setupNavigationRouting() {
    if (!isLivePreview) return;

    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href === '/' || href === '/index.html') {
            link.setAttribute('href', 'index.html');
        } else if (href === '/dashboard' || href === '/dashboard.html') {
            link.setAttribute('href', 'dashboard.html');
        } else if (href === '/servers' || href === '/servers.html' || href === '/api/auth/demo') {
            link.setAttribute('href', 'servers.html');
        }
    });
}

/**
 * Authentication State Manager
 */
async function checkAuthState() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    let authenticated = false;
    let user = null;
    let isDemo = false;

    if (!isLivePreview) {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                authenticated = data.authenticated;
                user = data.user;
                isDemo = data.isDemo;
            }
        } catch {
            // Offline fallback
        }
    } else {
        // In preview mode, provide instantaneous demo state
        authenticated = true;
        user = { username: 'ChathuX Admin', id: '1548035152637329428' };
        isDemo = true;
    }

    if (authenticated && user) {
        const avatar = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : '/assets/Logo.png';

        const serversLink = isLivePreview ? 'servers.html' : '/servers';
        const dashboardLink = isLivePreview ? 'dashboard.html' : '/dashboard';

        authContainer.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <a href="${serversLink}" class="btn btn-outline-glass btn-sm">
                    <span>🏰 My Servers</span>
                </a>
                <div class="dropdown">
                    <button class="btn btn-outline-glass btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                        <img src="${avatar}" width="26" height="26" style="width: 26px; height: 26px; object-fit: cover;" class="rounded-circle shadow-sm" alt="Avatar" onerror="this.src='/assets/Logo.png'">
                        <span>${user.username}</span>
                        ${isDemo ? '<span class="badge bg-warning text-dark" style="font-size: 0.65rem;">DEMO</span>' : ''}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg" style="background: rgba(15, 22, 38, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);">
                        <li><a class="dropdown-item py-2" href="${dashboardLink}">📊 Global Analytics</a></li>
                        <li><a class="dropdown-item py-2" href="${serversLink}">⚙️ Server Manager</a></li>
                        <li><hr class="dropdown-divider border-secondary opacity-25"></li>
                        <li><a class="dropdown-item py-2 text-danger" href="/api/auth/logout">🚪 Log Out</a></li>
                    </ul>
                </div>
            </div>
        `;
    } else {
        const demoLink = isLivePreview ? 'servers.html' : '/api/auth/demo';
        const loginLink = isLivePreview ? 'servers.html' : '/api/auth/login';

        authContainer.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <a href="${demoLink}" class="btn btn-outline-glass btn-sm" title="Explore dashboard instantly without OAuth2 setup">
                    <span>⚡ Demo Mode</span>
                </a>
                <a href="${loginLink}" class="btn btn-chathux btn-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    <span>Login with Discord</span>
                </a>
            </div>
        `;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-4 shadow-lg d-flex align-items-center gap-2`;
    toast.style.zIndex = '99999';
    toast.style.backdropFilter = 'blur(15px)';
    toast.style.borderRadius = '14px';
    toast.style.border = '1px solid rgba(255,255,255,0.15)';
    toast.innerHTML = `<span>${type === 'success' ? '✔' : '⚠'}</span> <div>${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
