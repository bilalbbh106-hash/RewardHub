// ==========================================================
// RewardHub - نظام الإشعارات (notifications.js)
// ==========================================================

// ===== عرض الإشعارات =====
async function getNotificationsHTML() {
    if (!currentUser) return '<p>يرجى تسجيل الدخول</p>';

    try {
        const result = await getUserNotifications(currentUser.id, 50);
        const notifications = result.success ? result.data : [];

        const unreadCount = notifications.filter(n => !n.is_read).length;

        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-bell"></i> الإشعارات
                ${unreadCount > 0 ? `<span class="badge badge-danger" style="font-size: 14px; padding: 4px 12px;">${unreadCount} جديدة</span>` : ''}
            </h2>

            <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="markAllRead()">
                    <i class="fas fa-check-double"></i> تحديد الكل كمقروء
                </button>
                <button class="btn btn-secondary btn-sm" onclick="loadSection('notifications')">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>

            ${notifications.length > 0 ? notifications.map(n => `
                <div class="notification-item ${!n.is_read ? 'unread' : ''}" onclick="markNotifReadReal('${n.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <div class="notif-title" style="font-weight: ${!n.is_read ? '600' : '400'};">
                                ${getNotificationIcon(n.type)} ${n.title}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 14px;">${n.message}</div>
                        </div>
                        <span style="font-size: 11px; color: var(--text-muted); white-space: nowrap; margin-right: 12px;">
                            ${new Date(n.created_at).toLocaleDateString('ar-EG')}
                            <br>
                            ${new Date(n.created_at).toLocaleTimeString('ar-EG')}
                        </span>
                    </div>
                    ${!n.is_read ? `<div style="margin-top: 8px;"><span class="badge badge-info">🔴 جديد</span></div>` : ''}
                </div>
            `).join('') : `
                <div class="card text-center" style="padding: 60px;">
                    <i class="fas fa-bell-slash" style="font-size: 48px; color: var(--text-muted);"></i>
                    <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد إشعارات</p>
                </div>
            `}
        `;
    } catch (error) {
        console.error('❌ خطأ:', error);
        return '<p style="color: var(--danger);">حدث خطأ في تحميل الإشعارات</p>';
    }
}

// ===== أيقونة حسب نوع الإشعار =====
function getNotificationIcon(type) {
    const icons = {
        'task': '📝',
        'withdrawal': '💰',
        'prize': '🎁',
        'system': '⚙️',
        'ad_request': '📢',
        'referral': '👥',
        'promotion': '🎯',
        'warning': '⚠️'
    };
    return icons[type] || '📌';
}

// ===== تحديد إشعار كمقروء =====
async function markNotifReadReal(notifId) {
    const result = await markNotificationAsRead(notifId);
    if (result.success) {
        loadSection('notifications');
        loadUserData();
    }
}

// ===== تحديد الكل كمقروء =====
async function markAllRead() {
    if (!confirm('هل أنت متأكد من تحديد جميع الإشعارات كمقروءة؟')) return;

    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);

        if (error) throw error;

        alert('✅ تم تحديد جميع الإشعارات كمقروءة');
        loadSection('notifications');
        loadUserData();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
}

// ===== إشعار فوري (Toast) =====
function showToast(title, message, type = 'info', duration = 5000) {
    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--secondary)'
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--dark-card);
        border: 1px solid ${colors[type] || 'var(--border-color)'};
        border-left: 4px solid ${colors[type] || 'var(--primary)'};
        border-radius: 12px;
        padding: 16px 20px;
        max-width: 400px;
        z-index: 99999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        animation: slideInRight 0.3s ease forwards;
        cursor: pointer;
    `;

    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="font-size: 24px;">${icons[type] || '📌'}</div>
            <div>
                <div style="font-weight: 600; font-size: 16px;">${title}</div>
                <div style="color: var(--text-secondary); font-size: 14px;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px;">✕</button>
        </div>
    `;

    document.body.appendChild(toast);

    // إزالة الإشعار تلقائياً
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);

    // إزالة عند النقر
    toast.addEventListener('click', () => {
        toast.remove();
    });
}

// ===== إضافة أنيميشن للإشعارات =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== تصدير الدوال =====
window.getNotificationsHTML = getNotificationsHTML;
window.markNotifReadReal = markNotifReadReal;
window.markAllRead = markAllRead;
window.showToast = showToast;
