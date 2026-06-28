// ==========================================================
// RewardHub - Dashboard.js (كامل)
// ==========================================================

// ===== متغيرات عامة =====
let currentUser = null;
let userProfile = null;
let currentSection = 'dashboard';

// ===== عناصر الصفحة =====
const authScreen = document.getElementById('authScreen');
const userDashboard = document.getElementById('userDashboard');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const userBalanceDisplay = document.getElementById('userBalanceDisplay');
const notifBadge = document.getElementById('notifBadge');

// ==========================================================
// ===== نظام المصادقة =====
// ==========================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 RewardHub Dashboard loading...');

    const connected = await testSupabaseConnection();
    if (!connected) {
        showToast('❌ خطأ', 'فشل الاتصال بالخادم، يرجى المحاولة لاحقاً', 'error');
        return;
    }

    const authStatus = await checkAuthStatus();

    if (authStatus.isLoggedIn) {
        currentUser = authStatus.user;
        userProfile = authStatus.profile;
        showDashboard();
    } else {
        showAuthScreen();
    }
});

function showAuthScreen() {
    authScreen.style.display = 'flex';
    userDashboard.style.display = 'none';
}

function showDashboard() {
    authScreen.style.display = 'none';
    userDashboard.style.display = 'flex';
    loadUserData();
    loadSection('dashboard');
}

// ===== تسجيل الدخول =====
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = '⚠️ يرجى ملء جميع الحقول';
        errorEl.style.display = 'block';
        return;
    }

    const result = await loginUser(email, password);

    if (result.success) {
        currentUser = result.user;
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
        }
        showDashboard();
        showToast('✅ مرحباً', 'تم تسجيل الدخول بنجاح!', 'success');
        loginForm.reset();
    } else {
        errorEl.textContent = '❌ ' + result.error;
        errorEl.style.display = 'block';
        showToast('❌ خطأ', result.error, 'error');
    }
});

// ===== إنشاء حساب جديد =====
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    const errorEl = document.getElementById('registerError');
    errorEl.style.display = 'none';

    if (!username || !email || !password) {
        errorEl.textContent = '⚠️ يرجى ملء جميع الحقول';
        errorEl.style.display = 'block';
        return;
    }

    if (username.length < 3) {
        errorEl.textContent = '⚠️ اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorEl.textContent = '⚠️ كلمة المرور غير متطابقة';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        errorEl.style.display = 'block';
        return;
    }

    const result = await registerUser(email, password, username, username);

    if (result.success) {
        showToast('✅ تم التسجيل', 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.', 'success');
        registerForm.reset();
        switchAuthTab('login');
    } else {
        errorEl.textContent = '❌ ' + result.error;
        errorEl.style.display = 'block';
        showToast('❌ خطأ', result.error, 'error');
    }
});

// ===== تبديل تبويبات المصادقة =====
document.querySelectorAll('.auth-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchAuthTab(tabName);
    });
});

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(function(t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.auth-form').forEach(function(f) {
        f.classList.toggle('active', f.id === (tabName === 'login' ? 'loginForm' : 'registerForm'));
    });

    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

// ===== تسجيل الخروج =====
logoutBtn.addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        const result = await logoutUser();
        if (result.success) {
            currentUser = null;
            userProfile = null;
            showAuthScreen();
            showToast('👋', 'تم تسجيل الخروج بنجاح', 'info');
        }
    }
});

// ==========================================================
// ===== تحميل بيانات المستخدم =====
// ==========================================================

async function loadUserData() {
    if (!currentUser) return;

    if (userProfile) {
        userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
    }

    const notifsResult = await getUserNotifications(currentUser.id, 100);
    if (notifsResult.success) {
        const unread = notifsResult.data.filter(n => !n.is_read).length;
        notifBadge.textContent = unread;
        notifBadge.style.display = unread > 0 ? 'inline' : 'none';
    }
}

// ==========================================================
// ===== التنقل بين الأقسام =====
// ==========================================================

document.querySelectorAll('.sidebar-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('.sidebar-item').forEach(function(i) {
            i.classList.remove('active');
        });
        this.classList.add('active');

        const section = this.getAttribute('data-section');
        currentSection = section;
        loadSection(section);
    });
});

function loadSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(function(s) {
        s.style.display = 'none';
    });

    const target = document.getElementById('section' + section.charAt(0).toUpperCase() + section.slice(1));

    if (target) {
        target.style.display = 'block';
        fillSectionContent(section);
    }
}

// ==========================================================
// ===== دوال الأقسام =====
// ==========================================================

async function fillSectionContent(section) {
    const target = document.getElementById('section' + section.charAt(0).toUpperCase() + section.slice(1));
    if (!target) return;

    switch (section) {
        case 'dashboard':
            target.innerHTML = await getDashboardHTML();
            break;
        case 'tasks':
            target.innerHTML = await getTasksHTML();
            break;
        case 'offers':
            target.innerHTML = await getOffersHTML();
            break;
        case 'surveys':
            target.innerHTML = await getSurveysHTML();
            break;
        case 'faucets':
            target.innerHTML = await getFaucetsHTML();
            break;
        case 'smartlinks':
            target.innerHTML = await getSmartlinksHTML();
            break;
        case 'prizes':
            target.innerHTML = await getPrizesHTML();
            break;
        case 'wallet':
            target.innerHTML = await getWalletHTML();
            break;
        case 'withdraw':
            target.innerHTML = await getWithdrawHTML();
            break;
        case 'referrals':
            target.innerHTML = await getReferralsHTML();
            break;
        case 'notifications':
            target.innerHTML = await getNotificationsHTML();
            break;
        case 'advertise':
            target.innerHTML = await getAdvertiseHTML();
            break;
        case 'settings':
            target.innerHTML = getSettingsHTML();
            break;
        case 'profile':
            target.innerHTML = getProfileHTML();
            break;
        default:
            target.innerHTML = '<p>جاري التحميل...</p>';
    }
}

// ==========================================================
// ===== لوحة التحكم =====
// ==========================================================

async function getDashboardHTML() {
    if (!currentUser) return '<p>يرجى تسجيل الدخول</p>';

    try {
        const [userProfileResult, tasksResult, withdrawalsResult, referralsResult, notifsResult, availableTasksResult, statsResult, withdrawHistoryResult] = await Promise.all([
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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="card">
                    <h4>📋 آخر المهام</h4>
                    ${tasks.slice(0, 5).map(task => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <span>${task.tasks?.title || 'مهمة'}</span>
                                <div style="font-size: 11px; color: var(--text-muted);">${new Date(task.created_at).toLocaleDateString('ar-EG')}</div>
                            </div>
                            <span class="badge ${task.status === 'completed' ? 'badge-success' : task.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
                                ${task.status === 'completed' ? '✅ مكتملة' : task.status === 'pending' ? '⏳ قيد التنفيذ' : '❌ مرفوضة'}
                            </span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد مهام</p>'}
                </div>

                <div class="card">
                    <h4>🔔 الإشعارات ${unreadNotifs > 0 ? `<span class="badge badge-danger">${unreadNotifs} جديدة</span>` : ''}</h4>
                    ${notifications.slice(0, 5).map(n => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); ${!n.is_read ? 'background: rgba(108,60,225,0.05); border-right: 3px solid var(--primary); padding-right: 8px;' : ''}">
                            <div>
                                <div style="font-weight: ${!n.is_read ? '600' : '400'};">${n.title}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">${n.message}</div>
                            </div>
                            <span style="font-size: 11px; color: var(--text-muted);">${new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد إشعارات</p>'}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div class="card">
                    <h4>🎯 مهام متاحة</h4>
                    ${availableTasks.slice(0, 5).map(task => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span>${task.title}</span>
                            <span style="color: var(--secondary); font-weight: 700;">$${parseFloat(task.reward).toFixed(3)}</span>
                        </div>
                    `).join('') || '<p style="color: var(--text-secondary);">لا توجد مهام متاحة</p>'}
                </div>

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

// ==========================================================
// ===== المهام =====
// ==========================================================

async function getTasksHTML() {
    const result = await getAvailableTasks();
    const tasks = result.success ? result.data : [];

    if (!tasks.length) {
        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-tasks"></i> المهام</h2>
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-inbox" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد مهام متاحة حالياً</p>
            </div>
        `;
    }

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-tasks"></i> المهام المتاحة</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${tasks.map(task => `
                <div class="task-card">
                    <div class="task-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span class="task-title">${task.title}</span>
                        <span class="task-reward" style="color: var(--secondary); font-weight: 700;">$${parseFloat(task.reward).toFixed(3)}</span>
                    </div>
                    <div class="task-description" style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">${task.description || 'لا يوجد وصف'}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        <span class="badge badge-info">${task.task_type}</span>
                        ${task.duration_seconds ? `<span class="badge badge-warning">⏱️ ${task.duration_seconds}s</span>` : ''}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="startUserTask('${task.id}')">
                        <i class="fas fa-play"></i> بدء المهمة
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== بدء مهمة =====
window.startUserTask = async function(taskId) {
    if (!currentUser) { alert('يرجى تسجيل الدخول أولاً'); return; }

    const result = await startTask(currentUser.id, taskId);

    if (result.success) {
        showToast('✅', 'تم بدء المهمة بنجاح!', 'success');
        loadSection('tasks');
    } else {
        showToast('❌ خطأ', result.error, 'error');
    }
};

// ==========================================================
// ===== الجوائز =====
// ==========================================================

async function getPrizesHTML() {
    const result = await getAvailablePrizes();
    const prizes = result.success ? result.data : [];

    if (!prizes.length) {
        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-gift"></i> متجر الجوائز</h2>
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-gift" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد جوائز متاحة حالياً</p>
            </div>
        `;
    }

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-gift"></i> متجر الجوائز</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">استبدل أرباحك بجوائز حصرية</p>
        <div class="prize-grid">
            ${prizes.map(prize => `
                <div class="prize-card" style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 20px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 8px;">${prize.image_url ? `<img src="${prize.image_url}" style="width: 60px; height: 60px; object-fit: contain;" />` : '🎁'}</div>
                    <div style="font-size: 16px; font-weight: 600;">${prize.name}</div>
                    <div style="font-size: 20px; font-weight: 700; color: var(--secondary); margin: 8px 0;">$${parseFloat(prize.price).toFixed(2)}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">المتبقي: ${prize.stock}</div>
                    <button class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="purchaseUserPrize('${prize.id}', ${prize.price})">
                        <i class="fas fa-shopping-cart"></i> شراء
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== شراء جائزة =====
window.purchaseUserPrize = async function(prizeId, price) {
    if (!currentUser) { alert('يرجى تسجيل الدخول أولاً'); return; }

    if (userProfile.balance < price) {
        alert('❌ الرصيد غير كافٍ! رصيدك الحالي: $' + parseFloat(userProfile.balance).toFixed(2));
        return;
    }

    if (!confirm(`هل أنت متأكد من شراء هذه الجائزة بقيمة $${parseFloat(price).toFixed(2)}؟`)) return;

    const result = await purchasePrize(currentUser.id, prizeId);

    if (result.success) {
        showToast('✅', 'تم شراء الجائزة بنجاح!', 'success');
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance).toFixed(2);
        }
        loadSection('prizes');
    } else {
        showToast('❌ خطأ', result.error, 'error');
    }
};

// ==========================================================
// ===== السحب =====
// ==========================================================

async function getWithdrawHTML() {
    const minWithdraw = 2;
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-money-bill-wave"></i> سحب الأرباح</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            الحد الأدنى للسحب: $${minWithdraw} | رصيدك الحالي: $${parseFloat(userProfile.balance || 0).toFixed(2)}
        </p>

        <form id="withdrawForm" class="withdraw-form" onsubmit="submitWithdrawReal(event)">
            <div class="form-group">
                <label>💰 المبلغ ($)</label>
                <input type="number" id="withdrawAmountReal" class="form-control" min="${minWithdraw}" max="${userProfile.balance || 0}" step="0.01" placeholder="أدخل المبلغ" required />
            </div>
            <div class="form-group">
                <label>🏦 طريقة السحب</label>
                <select id="withdrawMethodReal" class="form-control" required>
                    <option value="">اختر طريقة السحب</option>
                    <option value="USDT">USDT</option>
                    <option value="FaucetPay">FaucetPay</option>
                    <option value="GiftCard">بطاقة هدايا</option>
                    <option value="GameVoucher">قسيمة لعبة</option>
                </select>
            </div>
            <div class="form-group">
                <label>📤 عنوان المحفظة</label>
                <input type="text" id="withdrawAddressReal" class="form-control" placeholder="أدخل عنوان المحفظة" required />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success"><i class="fas fa-paper-plane"></i> طلب السحب</button>
                <button type="reset" class="btn btn-secondary">إلغاء</button>
            </div>
            <div id="withdrawResponse" style="display: none; margin-top: 12px;"></div>
        </form>

        <div style="margin-top: 30px;">
            <h4>📋 سجل السحوبات</h4>
            <div id="withdrawHistory" style="margin-top: 12px;"></div>
        </div>
    `;
}

// ===== تقديم طلب سحب =====
window.submitWithdrawReal = async function(e) {
    e.preventDefault();

    if (!currentUser) { alert('يرجى تسجيل الدخول أولاً'); return; }

    const amount = parseFloat(document.getElementById('withdrawAmountReal').value);
    const method = document.getElementById('withdrawMethodReal').value;
    const address = document.getElementById('withdrawAddressReal').value.trim();
    const responseEl = document.getElementById('withdrawResponse');

    responseEl.style.display = 'none';

    if (!amount || amount <= 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال مبلغ صحيح';
        return;
    }

    if (!method) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى اختيار طريقة السحب';
        return;
    }

    if (!address) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال عنوان المحفظة';
        return;
    }

    if (!confirm(`هل أنت متأكد من طلب سحب $${amount.toFixed(2)} عبر ${method}؟`)) return;

    responseEl.style.display = 'block';
    responseEl.className = 'admin-response info';
    responseEl.textContent = '⏳ جاري معالجة طلبك...';

    const result = await requestWithdrawalReal(currentUser.id, amount, method, address);

    if (result.success) {
        responseEl.className = 'admin-response success';
        responseEl.innerHTML = `
            ✅ تم تقديم طلب السحب بنجاح!
            <br><small style="color: var(--text-secondary);">
                المبلغ: $${amount.toFixed(2)} | الرسوم: $${result.fee?.toFixed(2) || '0.00'} | المبلغ النهائي: $${result.final_amount?.toFixed(2) || amount.toFixed(2)}
                <br>سيتم معالجة طلبك خلال 24-48 ساعة
            </small>
        `;

        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
        }

        setTimeout(() => loadSection('withdraw'), 3000);
    } else {
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + result.error;
    }
};

// ==========================================================
// ===== الإحالات =====
// ==========================================================

async function getReferralsHTML() {
    const result = await getUserReferrals(currentUser.id);
    const referrals = result.success ? result.data : [];

    const referralLink = `${window.location.origin}/?ref=${userProfile.referral_code}`;

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-users"></i> برنامج الإحالات</h2>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">ادعُ أصدقائك واربح $0.01 عن كل مستخدم جديد يسجل عبر رابطك</p>

        <div class="card">
            <h4>🔗 رابط الإحالة الخاص بك</h4>
            <div style="background: var(--dark-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; margin-top: 12px;">
                <input type="text" id="referralLink" value="${referralLink}" readonly style="flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 14px; outline: none;" />
                <button class="btn btn-primary btn-sm" onclick="copyReferralLink()"><i class="fas fa-copy"></i> نسخ</button>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <h4>📊 إحصائيات الإحالات</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 12px;">
                <div class="card text-center">
                    <div style="font-size: 28px; font-weight: 700; color: var(--secondary);">${referrals.length}</div>
                    <div style="color: var(--text-secondary);">إجمالي الإحالات</div>
                </div>
                <div class="card text-center">
                    <div style="font-size: 28px; font-weight: 700; color: var(--success);">$${parseFloat(userProfile.referral_earnings || 0).toFixed(2)}</div>
                    <div style="color: var(--text-secondary);">أرباح الإحالات</div>
                </div>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <h4>📋 قائمة الإحالات</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>التاريخ</th>
                            <th>المكافأة</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${referrals.map(ref => `
                            <tr>
                                <td>${ref.users?.username || 'مستخدم'}</td>
                                <td>${new Date(ref.created_at).toLocaleDateString('ar-EG')}</td>
                                <td>$${parseFloat(ref.reward_amount || 0).toFixed(2)}</td>
                                <td><span class="badge ${ref.is_paid ? 'badge-success' : 'badge-warning'}">${ref.is_paid ? 'مدفوعة' : 'معلقة'}</span></td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">لا توجد إحالات</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== نسخ رابط الإحالة =====
window.copyReferralLink = function() {
    const input = document.getElementById('referralLink');
    if (input) {
        input.select();
        document.execCommand('copy');
        showToast('✅', 'تم نسخ الرابط!', 'success');
    }
};

// ==========================================================
// ===== الإشعارات =====
// ==========================================================

async function getNotificationsHTML() {
    const result = await getUserNotifications(currentUser.id, 50);
    const notifications = result.success ? result.data : [];

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-bell"></i> الإشعارات
            ${unreadCount > 0 ? `<span class="badge badge-danger" style="font-size: 14px; padding: 4px 12px;">${unreadCount} جديدة</span>` : ''}
        </h2>

        <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="markAllRead()"><i class="fas fa-check-double"></i> تحديد الكل كمقروء</button>
            <button class="btn btn-secondary btn-sm" onclick="loadSection('notifications')"><i class="fas fa-sync"></i> تحديث</button>
        </div>

        ${notifications.length > 0 ? notifications.map(n => `
            <div class="notification-item ${!n.is_read ? 'unread' : ''}" onclick="markNotifReadReal('${n.id}')" style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; cursor: pointer; ${!n.is_read ? 'border-right: 4px solid var(--primary); background: rgba(108,60,225,0.05);' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-weight: ${!n.is_read ? '600' : '400'};">${n.title}</div>
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
}

// ===== تحديد إشعار كمقروء =====
window.markNotifReadReal = async function(notifId) {
    const result = await markNotificationAsRead(notifId);
    if (result.success) {
        loadSection('notifications');
        loadUserData();
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

// ==========================================================
// ===== أعلن معنا =====
// ==========================================================

async function getAdvertiseHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-bullhorn" style="color: var(--accent);"></i> أعلن معنا
        </h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
            اختر طريقة الإعلان المناسبة لك وابدأ في جذب العملاء
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">

            <div class="card" style="border: 2px solid var(--primary); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 10px; right: 10px; background: var(--primary); color: white; padding: 2px 12px; border-radius: 50px; font-size: 11px; font-weight: 700;">الأكثر طلباً</div>
                <div style="text-align: center; padding: 10px 0;">
                    <i class="fas fa-globe" style="font-size: 48px; color: var(--primary-light);"></i>
                    <h3 style="margin: 12px 0;">الإعلان عن موقع</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">قم بالإعلان عن موقعك الإلكتروني، واحصل على زوار حقيقيين</p>
                    <div style="background: var(--dark-input); padding: 12px; border-radius: 8px; margin: 12px 0;">
                        <span style="color: var(--text-muted);">💰 الحد الأدنى:</span>
                        <span style="color: var(--secondary); font-weight: 700; font-size: 20px;">$10</span>
                    </div>
                    <button onclick="showAdPayment('website')" class="btn btn-primary" style="margin-top: 16px; width: 100%;">
                        <i class="fas fa-rocket"></i> ابدأ الإعلان الآن
                    </button>
                </div>
            </div>

            <div class="card" style="border: 2px solid var(--secondary); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 10px; right: 10px; background: var(--secondary); color: white; padding: 2px 12px; border-radius: 50px; font-size: 11px; font-weight: 700;">🔥 شائع</div>
                <div style="text-align: center; padding: 10px 0;">
                    <i class="fas fa-users" style="font-size: 48px; color: var(--secondary);"></i>
                    <h3 style="margin: 12px 0;">متابعة حسابات التواصل</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">احصل على متابعين حقيقيين لقنوات التواصل الاجتماعي الخاصة بك</p>
                    <div style="background: var(--dark-input); padding: 12px; border-radius: 8px; margin: 12px 0;">
                        <span style="color: var(--text-muted);">💰 الحد الأدنى:</span>
                        <span style="color: var(--secondary); font-weight: 700; font-size: 20px;">$10</span>
                    </div>
                    <button onclick="showAdPayment('social')" class="btn btn-secondary" style="margin-top: 16px; width: 100%;">
                        <i class="fas fa-rocket"></i> ابدأ الإعلان الآن
                    </button>
                </div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 10px; right: 10px; background: var(--accent); color: white; padding: 2px 12px; border-radius: 50px; font-size: 11px; font-weight: 700;">⭐ مميز</div>
                <div style="text-align: center; padding: 10px 0;">
                    <i class="fas fa-crown" style="font-size: 48px; color: var(--accent);"></i>
                    <h3 style="margin: 12px 0;">إعلان مميز</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">احصل على ظهور مميز في الصفحة الرئيسية وأعلى نتائج البحث</p>
                    <div style="background: var(--dark-input); padding: 12px; border-radius: 8px; margin: 12px 0;">
                        <span style="color: var(--text-muted);">💰 الحد الأدنى:</span>
                        <span style="color: var(--secondary); font-weight: 700; font-size: 20px;">$25</span>
                    </div>
                    <button onclick="showAdPayment('premium')" class="btn btn-accent" style="margin-top: 16px; width: 100%; background: var(--accent); color: white; border: none; border-radius: 50px; padding: 12px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-rocket"></i> ابدأ الإعلان الآن
                    </button>
                </div>
            </div>
        </div>

        <div id="paymentGateway" style="display: none; margin-top: 30px;"></div>
    `;
}

// ===== عرض بوابة الدفع =====
window.showAdPayment = function(type) {
    const container = document.getElementById('paymentGateway');
    if (!container) return;

    const titles = { website: 'الإعلان عن موقع', social: 'متابعة حسابات التواصل', premium: 'إعلان مميز' };
    const prices = { website: 10, social: 10, premium: 25 };

    container.style.display = 'block';
    container.innerHTML = `
        <div class="card" style="border: 2px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3>💳 بوابة الدفع</h3>
                <button onclick="closePayment()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
            </div>
            <p style="color: var(--text-secondary);"><strong>نوع الإعلان:</strong> ${titles[type] || 'إعلان'}</p>
            <p style="color: var(--text-secondary);"><strong>المبلغ:</strong> <span style="color: var(--secondary); font-weight: 700; font-size: 24px;">$${prices[type] || 10}.00</span></p>

            <form id="adForm" style="margin-top: 20px;">
                <div class="form-group">
                    <label>🔗 رابط الموقع/القناة</label>
                    <input type="url" id="adLink" class="form-control" placeholder="https://example.com" required />
                </div>

                <div id="socialFields" style="display: ${type === 'social' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>📱 نوع المنصة</label>
                        <select id="adPlatform" class="form-control">
                            <option value="youtube">YouTube</option>
                            <option value="facebook">Facebook</option>
                            <option value="telegram">Telegram</option>
                            <option value="instagram">Instagram</option>
                            <option value="tiktok">TikTok</option>
                            <option value="x">X (Twitter)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>📸 لقطة شاشة للحساب (للتحقق)</label>
                        <input type="file" id="adScreenshot" class="form-control" accept="image/*" />
                        <small style="color: var(--text-muted);">سيتم مراجعة الصورة بواسطة الذكاء الاصطناعي</small>
                    </div>
                </div>

                <div id="websiteFields" style="display: ${type === 'website' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>📝 وصف الموقع</label>
                        <textarea id="adDescription" class="form-control" rows="3" placeholder="وصف مختصر عن موقعك"></textarea>
                    </div>
                </div>

                <div class="form-group">
                    <label>💳 طريقة الدفع</label>
                    <select id="adPaymentMethod" class="form-control" required>
                        <option value="">اختر طريقة الدفع</option>
                        <option value="usdt">USDT (TRC20)</option>
                        <option value="faucetpay">FaucetPay</option>
                        <option value="paypal">PayPal</option>
                        <option value="bank">تحويل بنكي</option>
                    </select>
                </div>

                <div style="background: var(--dark-input); padding: 16px; border-radius: 8px; margin: 12px 0; text-align: center; border: 2px dashed var(--border-color);">
                    <i class="fas fa-plug" style="font-size: 32px; color: var(--text-muted);"></i>
                    <p style="color: var(--text-muted); margin-top: 8px;">🔧 سيتم ربط بوابة الدفع هنا</p>
                    <p style="color: var(--text-muted); font-size: 12px;">(Stripe, Binance Pay, PayPal, أو أي بوابة أخرى)</p>
                </div>

                <button type="submit" class="btn btn-success" style="width: 100%; margin-top: 12px;">
                    <i class="fas fa-check"></i> تأكيد الدفع وبدء الإعلان
                </button>
            </form>

            <div id="adResponse" style="display: none; margin-top: 12px;"></div>
        </div>
    `;

    document.getElementById('adForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitAd(type);
    });

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// ===== إغلاق بوابة الدفع =====
window.closePayment = function() {
    const container = document.getElementById('paymentGateway');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
};

// ===== تقديم طلب إعلان =====
window.submitAd = async function(type) {
    const link = document.getElementById('adLink').value.trim();
    const paymentMethod = document.getElementById('adPaymentMethod').value;
    const responseEl = document.getElementById('adResponse');

    if (!link) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال رابط الموقع أو القناة';
        return;
    }

    if (!paymentMethod) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى اختيار طريقة الدفع';
        return;
    }

    if (type === 'social') {
        const screenshot = document.getElementById('adScreenshot').files[0];
        if (!screenshot) {
            responseEl.style.display = 'block';
            responseEl.className = 'admin-response error';
            responseEl.textContent = '⚠️ يرجى رفع لقطة شاشة للحساب';
            return;
        }
    }

    responseEl.style.display = 'block';
    responseEl.className = 'admin-response success';
    responseEl.innerHTML = `
        ✅ تم استلام طلب الإعلان بنجاح!
        <br><small style="color: var(--text-secondary);">
            سيتم مراجعة طلبك خلال 24 ساعة، وسيتم إشعارك عند الموافقة.
        </small>
        <br><br>
        <div style="background: var(--dark-input); padding: 12px; border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
            <strong>📊 ملخص الطلب:</strong><br>
            نوع الإعلان: ${type === 'website' ? 'موقع' : type === 'social' ? 'متابعة حسابات' : 'إعلان مميز'}<br>
            الرابط: ${link}<br>
            طريقة الدفع: ${paymentMethod}<br>
            الحالة: <span style="color: var(--warning);">قيد المراجعة</span>
        </div>
    `;

    try {
        const { error } = await supabaseClient
            .from('ad_requests')
            .insert([{
                user_id: currentUser.id,
                type: type,
                link: link,
                payment_method: paymentMethod,
                status: 'pending',
                platform: document.getElementById('adPlatform')?.value || null,
                description: document.getElementById('adDescription')?.value || null
            }]);

        if (error) throw error;

        await supabaseClient
            .from('notifications')
            .insert([{
                user_id: currentUser.id,
                title: '📢 طلب إعلان جديد',
                message: `تم تقديم طلب إعلان من نوع ${type}`,
                type: 'ad_request'
            }]);

        showToast('✅', 'تم تقديم طلب الإعلان بنجاح!', 'success');
    } catch (error) {
        console.error('❌ خطأ في حفظ الطلب:', error);
    }
};

// ==========================================================
// ===== المحفظة =====
// ==========================================================

async function getWalletHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-wallet"></i> المحفظة</h2>
        <div class="card">
            <h3 style="font-size: 36px; color: var(--secondary);">$${parseFloat(userProfile.balance || 0).toFixed(2)}</h3>
            <p style="color: var(--text-secondary);">الرصيد الحالي</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 20px;">
            <div class="card text-center">
                <div style="font-size: 24px; font-weight: 700;">$${parseFloat(userProfile.total_earned || 0).toFixed(2)}</div>
                <div style="color: var(--text-secondary);">إجمالي الأرباح</div>
            </div>
            <div class="card text-center">
                <div style="font-size: 24px; font-weight: 700; color: var(--success);">$${parseFloat(userProfile.total_withdrawn || 0).toFixed(2)}</div>
                <div style="color: var(--text-secondary);">إجمالي السحوبات</div>
            </div>
            <div class="card text-center">
                <div style="font-size: 24px; font-weight: 700; color: var(--warning);">$${parseFloat(userProfile.daily_earnings || 0).toFixed(2)}</div>
                <div style="color: var(--text-secondary);">أرباح اليوم</div>
            </div>
        </div>
    `;
}

// ==========================================================
// ===== الملف الشخصي =====
// ==========================================================

function getProfileHTML() {
    if (!userProfile) return '<p>جاري التحميل...</p>';

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-user"></i> الملف الشخصي</h2>
        <div class="profile-card" style="background: var(--dark-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 32px; max-width: 600px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; margin: 0 auto 12px;">
                ${userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div style="text-align: center;">
                <h3>${userProfile.full_name || userProfile.username}</h3>
                <p style="color: var(--text-secondary);">@${userProfile.username}</p>
            </div>
            <div style="margin-top: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <label style="color: var(--text-secondary); font-size: 13px;">البريد الإلكتروني</label>
                        <p>${userProfile.email}</p>
                    </div>
                    <div>
                        <label style="color: var(--text-secondary); font-size: 13px;">الدولة</label>
                        <p>${userProfile.country || 'غير محدد'}</p>
                    </div>
                    <div>
                        <label style="color: var(--text-secondary); font-size: 13px;">رقم الهاتف</label>
                        <p>${userProfile.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                        <label style="color: var(--text-secondary); font-size: 13px;">كود الإحالة</label>
                        <p>${userProfile.referral_code || 'غير متاح'}</p>
                    </div>
                </div>
            </div>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <h4>📊 إحصائياتي</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 12px;">
                    <div class="card text-center" style="padding: 16px;">
                        <div style="font-size: 20px; font-weight: 700; color: var(--secondary);">$${parseFloat(userProfile.total_earned || 0).toFixed(2)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">إجمالي الأرباح</div>
                    </div>
                    <div class="card text-center" style="padding: 16px;">
                        <div style="font-size: 20px; font-weight: 700; color: var(--success);">$${parseFloat(userProfile.total_withdrawn || 0).toFixed(2)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">إجمالي السحوبات</div>
                    </div>
                    <div class="card text-center" style="padding: 16px;">
                        <div style="font-size: 20px; font-weight: 700; color: var(--warning);">$${parseFloat(userProfile.referral_earnings || 0).toFixed(2)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">أرباح الإحالات</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================
// ===== الإعدادات =====
// ==========================================================

function getSettingsHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-cog"></i> الإعدادات</h2>
        <div class="card" style="max-width: 500px;">
            <h4>🔐 تغيير كلمة المرور</h4>
            <form onsubmit="changePassword(event)">
                <div class="form-group">
                    <label>كلمة المرور الحالية</label>
                    <input type="password" id="currentPassword" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>كلمة المرور الجديدة</label>
                    <input type="password" id="newPassword" class="form-control" required minlength="6" />
                </div>
                <div class="form-group">
                    <label>تأكيد كلمة المرور الجديدة</label>
                    <input type="password" id="confirmNewPassword" class="form-control" required />
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> تغيير كلمة المرور</button>
            </form>
        </div>
        <div class="card" style="max-width: 500px; margin-top: 20px;">
            <h4>🌐 اللغة</h4>
            <select class="form-control" onchange="changeLanguage(this.value)">
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
            </select>
        </div>
    `;
}

// ===== تغيير كلمة المرور =====
window.changePassword = function(e) {
    e.preventDefault();
    showToast('🔧', 'سيتم إضافة هذه الميزة قريباً', 'info');
};

// ===== تغيير اللغة =====
window.changeLanguage = function(lang) {
    showToast('🔧', 'سيتم إضافة هذه الميزة قريباً', 'info');
};

// ==========================================================
// ===== دوال الأقسام الفارغة =====
// ==========================================================

async function getOffersHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-ad"></i> Offerwalls</h2>
        <div class="card text-center" style="padding: 60px;">
            <i class="fas fa-ad" style="font-size: 48px; color: var(--text-muted);"></i>
            <p style="color: var(--text-secondary); margin-top: 12px;">قريباً ستتوفر عروض Offerwalls</p>
        </div>
    `;
}

async function getSurveysHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-poll"></i> الاستبيانات</h2>
        <div class="card text-center" style="padding: 60px;">
            <i class="fas fa-poll" style="font-size: 48px; color: var(--text-muted);"></i>
            <p style="color: var(--text-secondary); margin-top: 12px;">قريباً ستتوفر استبيانات مدفوعة</p>
        </div>
    `;
}

async function getFaucetsHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-bolt"></i> الصنابير</h2>
        <div class="card text-center" style="padding: 60px;">
            <i class="fas fa-bolt" style="font-size: 48px; color: var(--text-muted);"></i>
            <p style="color: var(--text-secondary); margin-top: 12px;">قريباً ستتوفر صنابير العملات الرقمية</p>
        </div>
    `;
}

async function getSmartlinksHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-link"></i> Smart Links</h2>
        <div class="card text-center" style="padding: 60px;">
            <i class="fas fa-link" style="font-size: 48px; color: var(--text-muted);"></i>
            <p style="color: var(--text-secondary); margin-top: 12px;">قريباً ستتوفر روابط ذكية</p>
        </div>
    `;
}

// ==========================================================
// ===== تحديث الرصيد بشكل دوري =====
// ==========================================================

setInterval(async function() {
    if (currentUser) {
        const result = await getUserProfile(currentUser.id);
        if (result.success) {
            userProfile = result.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
        }
    }
}, 30000);

console.log('✅ RewardHub Dashboard جاهز!');
