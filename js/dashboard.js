// ==========================================================
// RewardHub - Dashboard.js
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

// ===== التحقق من حالة الجلسة عند التحميل =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 RewardHub Dashboard loading...');

    // التحقق من الاتصال بـ Supabase
    const connected = await testSupabaseConnection();
    if (!connected) {
        showAuthError('login', '❌ فشل الاتصال بالخادم، يرجى المحاولة لاحقاً');
        return;
    }

    // التحقق من حالة تسجيل الدخول
    const authStatus = await checkAuthStatus();
    
    if (authStatus.isLoggedIn) {
        currentUser = authStatus.user;
        userProfile = authStatus.profile;
        showDashboard();
    } else {
        showAuthScreen();
    }
});

// ===== عرض شاشة المصادقة =====
function showAuthScreen() {
    authScreen.style.display = 'flex';
    userDashboard.style.display = 'none';
}

// ===== عرض لوحة المستخدم =====
function showDashboard() {
    authScreen.style.display = 'none';
    userDashboard.style.display = 'flex';
    loadUserData();
    loadDashboardContent();
}

// ===== تسجيل الدخول =====
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    hideAuthError('login');

    if (!email || !password) {
        showAuthError('login', '⚠️ يرجى ملء جميع الحقول');
        return;
    }

    const result = await loginUser(email, password);
    
    if (result.success) {
        currentUser = result.user;
        // جلب بيانات المستخدم
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
        }
        showDashboard();
        loginForm.reset();
    } else {
        showAuthError('login', '❌ ' + result.error);
    }
});

// ===== إنشاء حساب جديد =====
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    hideAuthError('register');

    if (!username || !email || !password) {
        showAuthError('register', '⚠️ يرجى ملء جميع الحقول');
        return;
    }

    if (username.length < 3) {
        showAuthError('register', '⚠️ اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        return;
    }

    if (password !== confirmPassword) {
        showAuthError('register', '⚠️ كلمة المرور غير متطابقة');
        return;
    }

    if (password.length < 6) {
        showAuthError('register', '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }

    const result = await registerUser(email, password, username, username);
    
    if (result.success) {
        alert('✅ تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
        registerForm.reset();
        // التبديل إلى تبويب تسجيل الدخول
        switchAuthTab('login');
    } else {
        showAuthError('register', '❌ ' + result.error);
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
    // تحديث التبويبات
    document.querySelectorAll('.auth-tab').forEach(function(t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    // تحديث النماذج
    document.querySelectorAll('.auth-form').forEach(function(f) {
        f.classList.toggle('active', f.id === (tabName === 'login' ? 'loginForm' : 'registerForm'));
    });

    // إخفاء الأخطاء
    hideAuthError('login');
    hideAuthError('register');
}

// ===== إظهار/إخفاء أخطاء المصادقة =====
function showAuthError(type, message) {
    const errorEl = document.getElementById(type === 'login' ? 'loginError' : 'registerError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideAuthError(type) {
    const errorEl = document.getElementById(type === 'login' ? 'loginError' : 'registerError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// ===== تسجيل الخروج =====
logoutBtn.addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        const result = await logoutUser();
        if (result.success) {
            currentUser = null;
            userProfile = null;
            showAuthScreen();
        }
    }
});

// ==========================================================
// ===== تحميل بيانات المستخدم =====
// ==========================================================

async function loadUserData() {
    if (!currentUser) return;

    // تحديث الرصيد
    if (userProfile) {
        userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
    }

    // جلب عدد الإشعارات غير المقروءة
    const notifsResult = await getUserNotifications(currentUser.id, 100);
    if (notifsResult.success) {
        const unread = notifsResult.data.filter(n => !n.is_read).length;
        notifBadge.textContent = unread;
        notifBadge.style.display = unread > 0 ? 'inline' : 'none';
    }
}

// ==========================================================
// ===== تحميل محتوى لوحة التحكم =====
// ==========================================================

function loadDashboardContent() {
    loadSection('dashboard');
}

// ===== التنقل بين الأقسام =====
document.querySelectorAll('.sidebar-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        // تحديث العنصر النشط
        document.querySelectorAll('.sidebar-item').forEach(function(i) {
            i.classList.remove('active');
        });
        this.classList.add('active');

        // جلب اسم القسم
        const section = this.getAttribute('data-section');
        currentSection = section;

        // تحميل المحتوى
        loadSection(section);

        // إغلاق القائمة في الموبايل
        if (window.innerWidth <= 768) {
            document.getElementById('dashboardSidebar').style.display = 'none';
        }
    });
});

// ===== تحميل قسم معين =====
function loadSection(section) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.dashboard-section').forEach(function(s) {
        s.style.display = 'none';
    });

    // إظهار القسم المطلوب
    const target = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (target) {
        target.style.display = 'block';
        // تعبئة المحتوى
        fillSectionContent(section);
    }
}

// ===== تعبئة محتوى الأقسام =====
async function fillSectionContent(section) {
    const target = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (!target) return;

    switch(section) {
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
// ===== محتوى الأقسام =====
// ==========================================================

// ===== لوحة التحكم =====
async function getDashboardHTML() {
    if (!currentUser) return '<p>يرجى تسجيل الدخول</p>';

    // جلب الإحصائيات
    const tasksResult = await getUserTasks(currentUser.id);
    const withdrawalsResult = await getUserWithdrawals(currentUser.id);
    const referralsResult = await getUserReferrals(currentUser.id);
    const notifsResult = await getUserNotifications(currentUser.id, 5);

    const tasks = tasksResult.success ? tasksResult.data : [];
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const withdrawals = withdrawalsResult.success ? withdrawalsResult.data : [];
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.status === 'processed' ? w.amount : 0), 0);
    const referrals = referralsResult.success ? referralsResult.data : [];
    const unreadNotifs = notifsResult.success ? notifsResult.data.filter(n => !n.is_read).length : 0;

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-chart-pie"></i> لوحة التحكم
        </h2>

        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number">$${parseFloat(userProfile.balance || 0).toFixed(2)}</div>
                <div class="stat-label">الرصيد الحالي</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-number">$${parseFloat(userProfile.total_earned || 0).toFixed(2)}</div>
                <div class="stat-label">إجمالي الأرباح</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏦</div>
                <div class="stat-number">$${parseFloat(totalWithdrawn || 0).toFixed(2)}</div>
                <div class="stat-label">إجمالي السحوبات</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-number">${completedTasks.length}</div>
                <div class="stat-label">المهام المنجزة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-number">${pendingTasks.length}</div>
                <div class="stat-label">مهام معلقة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number">${referrals.length}</div>
                <div class="stat-label">الإحالات</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card">
                <h4>📋 آخر المهام</h4>
                ${tasks.slice(0, 5).map(task => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <span>${task.tasks?.title || 'مهمة'}</span>
                        <span class="badge ${task.status === 'completed' ? 'badge-success' : task.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
                            ${task.status === 'completed' ? 'مكتملة' : task.status === 'pending' ? 'قيد التنفيذ' : 'مرفوضة'}
                        </span>
                    </div>
                `).join('') || '<p style="color: var(--text-secondary);">لا توجد مهام</p>'}
            </div>

            <div class="card">
                <h4>🔔 آخر الإشعارات</h4>
                ${notifsResult.success ? notifsResult.data.slice(0, 5).map(n => `
                    <div style="display: flex;
