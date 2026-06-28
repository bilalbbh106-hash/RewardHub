// ==========================================================
// RewardHub - Dashboard.js (لوحة تحكم حقيقية)
// ==========================================================

// ===== لوحة التحكم الحقيقية =====
async function getDashboardHTML() {
    if (!currentUser) return '<p>يرجى تسجيل الدخول</p>';

    try {
        // جلب جميع البيانات بالتوازي
        const [
            userProfileResult,
            tasksResult,
            withdrawalsResult,
            referralsResult,
            notifsResult,
            availableTasksResult,
            statsResult,
            withdrawHistoryResult
        ] = await Promise.all([
            getUserProfile(currentUser.id),
            getUserTasks(currentUser.id),
            getUserWithdrawals(currentUser.id),
            getUserReferrals(currentUser.id),
            getUserNotifications(currentUser.id, 5),
            getAvailableTasks(),
            getUserStats(currentUser.id),
            getWithdrawalHistory(currentUser.id, 5)
        ]);

        const profile = userProfileResult.success ? userProfileResult.data : null;
        const tasks = tasksResult.success ? tasksResult.data : [];
        const withdrawals = withdrawalsResult.success ? withdrawalsResult.data : [];
        const referrals = referralsResult.success ? referralsResult.data : [];
        const notifications = notifsResult.success ? notifsResult.data : [];
        const availableTasks = availableTasksResult.success ? availableTasksResult.data : [];
        const stats = statsResult.success ? statsResult.data : {};
        const withdrawHistory = withdrawHistoryResult.success ? withdrawHistoryResult.data : [];

        // حساب الإحصائيات
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.status === 'processed' ? w.amount : 0), 0);
        const unreadNotifs = notifications.filter(n => !n.is_read).length;
        const totalEarnings = profile?.total_earned || 0;
        const currentBalance = profile?.balance || 0;
        const dailyEarnings = profile?.daily_earnings || 0;

        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-chart-pie"></i> لوحة التحكم
                <span style="font-size: 14px; color: var(--text-secondary); font-weight: normal; margin-right: 12px;">
                    مرحباً ${profile?.full_name || profile?.username || 'مستخدم'} 👋
                </span>
            </h2>

            <!-- ===== الإحصائيات الرئيسية ===== -->
            <div class="dashboard-stats">
                <div class="stat-card" style="border-left: 4px solid var(--secondary);">
                    <div class="stat-icon">💰</div>
                    <div class="stat-number" style="color: var(--secondary);">$${currentBalance.toFixed(2)}</div>
                    <div class="stat-label">الرصيد الحالي</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--success);">
                    <div class="stat-icon">📈</div>
                    <div class="stat-number" style="color: var(--success);">$${totalEarnings.toFixed(2)}</div>
                    <div class="stat-label">إجمالي الأرباح</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--warning);">
                    <div class="stat-icon">🏦</div>
                    <div class="stat-number" style="color: var(--warning);">$${totalWithdrawn.toFixed(2)}</div>
                    <div class="stat-label">إجمالي السحوبات</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--accent);">
                    <div class="stat-icon">📊</div>
                    <div class="stat-number" style="color: var(--accent);">$${dailyEarnings.toFixed(2)}</div>
                    <div class="stat-label">أرباح اليوم</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--primary-light);">
                    <div class="stat-icon">📝</div>
                    <div class="stat-number" style="color: var(--primary-light);">${stats.tasks_completed || 0}</div>
                    <div class="stat-label">المهام المنجزة</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #FF6B9D;">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number" style="color: #FF6B9D;">${stats.referrals || 0}</div>
                    <div class="stat-label">الإحالات</div>
                </div>
            </div>

            <!-- ===== صفين ===== -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                
                <!-- ===== المهام الأخيرة ===== -->
                <div class="card">
                    <h4>📋 آخر المهام</h4>
                    ${tasks.slice(0, 5).map(task => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <span>${task.tasks?.title || 'مهمة'}</span>
                                <div style="font-size: 11px; color: var(--text-muted);">
                                    ${new Date(task.created_at).toLocaleDateString('ar-EG')}
                                </div>
                            </div>
                            <span class="badge ${task.status === 'completed' ? 'badge-success' : task.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
                                ${task.status === 'completed' ? '✅ مكتملة' : task.status === 'pending' ? '⏳ قيد التنفيذ' : '❌ مرفوضة'}
                            </span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد مهام</p>'}
                </div>

                <!-- ===== الإشعارات ===== -->
                <div class="card">
                    <h4>🔔 الإشعارات ${unreadNotifs > 0 ? `<span class="badge badge-danger">${unreadNotifs} جديدة</span>` : ''}</h4>
                    ${notifications.slice(0, 5).map(n => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); ${!n.is_read ? 'background: rgba(108,60,225,0.05); border-right: 3px solid var(--primary); padding-right: 8px;' : ''}">
                            <div>
                                <div style="font-weight: ${!n.is_read ? '600' : '400'};">${n.title}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">${n.message}</div>
                            </div>
                            <span style="font-size: 11px; color: var(--text-muted);">
                                ${new Date(n.created_at).toLocaleDateString('ar-EG')}
                            </span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد إشعارات</p>'}
                </div>
            </div>

            <!-- ===== صف ثاني ===== -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                
                <!-- ===== المهام المتاحة ===== -->
                <div class="card">
                    <h4>🎯 مهام متاحة</h4>
                    ${availableTasks.slice(0, 5).map(task => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span>${task.title}</span>
                            <span style="color: var(--secondary); font-weight: 700;">$${parseFloat(task.reward).toFixed(3)}</span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد مهام متاحة</p>'}
                </div>

                <!-- ===== آخر السحوبات ===== -->
                <div class="card">
                    <h4>💰 آخر السحوبات</h4>
                    ${withdrawHistory.slice(0, 5).map(w => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <span style="color: var(--secondary); font-weight: 700;">$${parseFloat(w.amount).toFixed(2)}</span>
                                <span style="font-size: 11px; color: var(--text-muted);">${w.method}</span>
                            </div>
                            <span class="badge ${w.status === 'approved' ? 'badge-success' : w.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
                                ${w.status === 'approved' ? '✅ مكتمل' : w.status === 'pending' ? '⏳ معلق' : '❌ مرفوض'}
                            </span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد سحوبات</p>'}
                </div>
            </div>

            <!-- ===== إجراءات سريعة ===== -->
            <div class="card" style="margin-top: 20px;">
                <h4>⚡ إجراءات سريعة</h4>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                    <button class="btn btn-primary btn-sm" onclick="loadSection('tasks')">
                        <i class="fas fa-tasks"></i> استكشاف المهام
                    </button>
                    <button class="btn btn-success btn-sm" onclick="loadSection('prizes')">
                        <i class="fas fa-gift"></i> متجر الجوائز
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="loadSection('withdraw')">
                        <i class="fas fa-money-bill-wave"></i> سحب الأرباح
                    </button>
                    <button class="btn btn-info btn-sm" onclick="loadSection('referrals')">
                        <i class="fas fa-users"></i> دعوة الأصدقاء
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ خطأ في تحميل لوحة التحكم:', error);
        return `
            <div class="card" style="padding: 60px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--warning);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">حدث خطأ في تحميل البيانات</p>
                <button class="btn btn-primary" onclick="location.reload()">إعادة تحميل</button>
            </div>
        `;
    }
}
