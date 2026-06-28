// ==========================================================
// RewardHub - نظام الإشعارات (كامل)
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
                <div class="notification-item ${!n.is_read ? 'unread' : ''}" onclick="markNotifReadReal('${n.id}')" style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; cursor: pointer; ${!n.is_read ? 'border-right: 4px solid var(--primary); background: rgba(108,60,225,0.05);' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <div style="font-weight: ${!n.is_read ? '600' : '400'};">
                                ${getNotificationIcon(n.type)} ${n.title}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 14px;">${n.message}</div>
                        </div>
                        <span style="font-size: 11px; color: var(--text-muted); white-space: nowrap; margin-right: 12px;">
                            ${new Date(n.created_at).toLocaleDateString('ar-EG')}
                            <br>${new Date(n.created_at).toLocaleTimeString('ar-EG')}
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
window.markNotifReadReal = async function(notifId) {
    const result = await markNotificationAsRead(notifId);
    if (result.success) {
        loadSection('notifications');
        loadUserData();
        showToast('✅', 'تم تحديد الإشعار كمقروء', 'success');
    }
};

// ===== تحديد الكل كمقروء =====
window.markAllRead = async function() {
    if (!confirm('هل أنت متأكد من تحديد جميع الإشعارات كمقروءة؟')) return;

    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);

        if (error) throw error;

        showToast('✅', 'تم تحديد جميع الإشعارات كمقروءة', 'success');
        loadSection('notifications');
        loadUserData();
    } catch (error) {
        showToast('❌ خطأ', error.message, 'error');
    }
};

console.log('🔔 نظام الإشعارات جاهز!');
