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
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <span>${n.title}</span>
                        <span style="font-size: 12px; color: var(--text-muted);">
                            ${n.is_read ? '✅ مقروء' : '🔴 جديد'}
                        </span>
                    </div>
                `).join('') : '<p style="color: var(--text-secondary);">لا توجد إشعارات</p>'}
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
}

// ===== المهام =====
async function getTasksHTML() {
    const result = await getAvailableTasks();
    const tasks = result.success ? result.data : [];

    if (!tasks.length) {
        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-tasks"></i> المهام
            </h2>
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-inbox" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد مهام متاحة حالياً</p>
            </div>
        `;
    }

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-tasks"></i> المهام المتاحة
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${tasks.map(task => `
                <div class="task-card">
                    <div class="task-header">
                        <span class="task-title">${task.title}</span>
                        <span class="task-reward">$${parseFloat(task.reward).toFixed(3)}</span>
                    </div>
                    <div class="task-description">${task.description || 'لا يوجد وصف'}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        <span class="badge badge-info">${task.task_type}</span>
                        ${task.duration_seconds ? `<span class="badge badge-warning">⏱️ ${task.duration_seconds}s</span>` : ''}
                    </div>
                    <div class="task-footer">
                        <button class="btn btn-primary btn-sm" onclick="startUserTask('${task.id}')">
                            <i class="fas fa-play"></i> بدء المهمة
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== بدء مهمة =====
window.startUserTask = async function(taskId) {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const result = await startTask(currentUser.id, taskId);
    
    if (result.success) {
        alert('✅ تم بدء المهمة بنجاح!');
        loadSection('tasks');
    } else {
        alert('❌ ' + result.error);
    }
};

// ===== الجوائز =====
async function getPrizesHTML() {
    const result = await getAvailablePrizes();
    const prizes = result.success ? result.data : [];

    if (!prizes.length) {
        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-gift"></i> متجر الجوائز
            </h2>
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-gift" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد جوائز متاحة حالياً</p>
            </div>
        `;
    }

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-gift"></i> متجر الجوائز
        </h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">استبدل أرباحك بجوائز حصرية</p>
        <div class="prize-grid">
            ${prizes.map(prize => `
                <div class="prize-card">
                    <div class="prize-icon">${prize.image_url ? `<img src="${prize.image_url}" style="width: 60px; height: 60px; object-fit: contain;" />` : '🎁'}</div>
                    <div class="prize-name">${prize.name}</div>
                    <div class="prize-price">$${parseFloat(prize.price).toFixed(2)}</div>
                    <div class="prize-stock">المتبقي: ${prize.stock}</div>
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
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    if (userProfile.balance < price) {
        alert('❌ الرصيد غير كافٍ! رصيدك الحالي: $' + parseFloat(userProfile.balance).toFixed(2));
        return;
    }

    if (!confirm(`هل أنت متأكد من شراء هذه الجائزة بقيمة $${parseFloat(price).toFixed(2)}؟`)) {
        return;
    }

    const result = await purchasePrize(currentUser.id, prizeId);
    
    if (result.success) {
        alert('✅ تم شراء الجائزة بنجاح!');
        // تحديث الرصيد
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance).toFixed(2);
        }
        loadSection('prizes');
    } else {
        alert('❌ ' + result.error);
    }
};

// ===== السحب =====
async function getWithdrawHTML() {
    const minWithdrawal = 2; // يمكن جلبها من الإعدادات

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-money-bill-wave"></i> سحب الأرباح
        </h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            الحد الأدنى للسحب: $${minWithdrawal}
            | رصيدك الحالي: $${parseFloat(userProfile.balance || 0).toFixed(2)}
        </p>

        <form id="withdrawForm" class="withdraw-form" onsubmit="submitWithdraw(event)">
            <div class="form-group">
                <label>💰 المبلغ ($)</label>
                <input type="number" id="withdrawAmount" class="form-control" 
                       min="${minWithdrawal}" max="${userProfile.balance || 0}" 
                       step="0.01" placeholder="أدخل المبلغ" required />
            </div>
            <div class="form-group">
                <label>🏦 طريقة السحب</label>
                <select id="withdrawMethod" class="form-control" required>
                    <option value="">اختر طريقة السحب</option>
                    <option value="USDT">USDT</option>
                    <option value="FaucetPay">FaucetPay</option>
                    <option value="GiftCard">بطاقة هدايا</option>
                    <option value="GameVoucher">قسيمة لعبة</option>
                </select>
            </div>
            <div class="form-group">
                <label>📤 عنوان المحفظة</label>
                <input type="text" id="withdrawAddress" class="form-control" 
                       placeholder="أدخل عنوان المحفظة" required />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-paper-plane"></i> طلب السحب
                </button>
                <button type="reset" class="btn btn-secondary">إلغاء</button>
            </div>
        </form>

        <div style="margin-top: 30px;">
            <h4>📋 سجل السحوبات</h4>
            <div id="withdrawHistory" style="margin-top: 12px;"></div>
        </div>
    `;
}

// ===== تقديم طلب سحب =====
window.submitWithdraw = async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    const address = document.getElementById('withdrawAddress').value.trim();

    if (!amount || amount <= 0) {
        alert('⚠️ يرجى إدخال مبلغ صحيح');
        return;
    }

    if (amount > userProfile.balance) {
        alert('❌ المبلغ أكبر من الرصيد المتاح');
        return;
    }

    if (!method) {
        alert('⚠️ يرجى اختيار طريقة السحب');
        return;
    }

    if (!address) {
        alert('⚠️ يرجى إدخال عنوان المحفظة');
        return;
    }

    if (!confirm(`هل أنت متأكد من طلب سحب $${amount.toFixed(2)} عبر ${method}؟`)) {
        return;
    }

    const result = await requestWithdrawal(currentUser.id, amount, method, address);
    
    if (result.success) {
        alert('✅ تم تقديم طلب السحب بنجاح!');
        // تحديث الرصيد
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance).toFixed(2);
        }
        document.getElementById('withdrawForm').reset();
        loadSection('withdraw');
    } else {
        alert('❌ ' + result.error);
    }
};

// ===== الإحالات =====
async function getReferralsHTML() {
    const result = await getUserReferrals(currentUser.id);
    const referrals = result.success ? result.data : [];

    const referralLink = `${window.location.origin}/?ref=${userProfile.referral_code}`;

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-users"></i> برنامج الإحالات
        </h2>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">
            ادعُ أصدقائك واربح $0.01 عن كل مستخدم جديد يسجل عبر رابطك
        </p>

        <div class="card">
            <h4>🔗 رابط الإحالة الخاص بك</h4>
            <div class="referral-link-box">
                <input type="text" id="referralLink" value="${referralLink}" readonly />
                <button class="btn btn-primary btn-sm" onclick="copyReferralLink()">
                    <i class="fas fa-copy"></i> نسخ
                </button>
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
        alert('✅ تم نسخ الرابط!');
    }
};

// ===== الإشعارات =====
async function getNotificationsHTML() {
    const result = await getUserNotifications(currentUser.id, 50);
    const notifications = result.success ? result.data : [];

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-bell"></i> الإشعارات
            <span class="badge badge-danger" style="font-size: 14px; padding: 4px 12px;">
                ${notifications.filter(n => !n.is_read).length} غير مقروءة
            </span>
        </h2>

        ${notifications.length ? notifications.map(n => `
            <div class="notification-item ${!n.is_read ? 'unread' : ''}" onclick="markNotifRead('${n.id}')">
                <div class="notif-title">${n.title}</div>
                <div style="color: var(--text-secondary); font-size: 14px;">${n.message}</div>
                <div class="notif-time">${new Date(n.created_at).toLocaleDateString('ar-EG')} ${new Date(n.created_at).toLocaleTimeString('ar-EG')}</div>
            </div>
        `).join('') : `
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-bell-slash" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد إشعارات</p>
            </div>
        `}
    `;
}

// ===== تحديد الإشعار كمقروء =====
window.markNotifRead = async function(notifId) {
    const result = await markNotificationAsRead(notifId);
    if (result.success) {
        loadSection('notifications');
        loadUserData();
    }
};

// ===== ملف المستخدم =====
function getProfileHTML() {
    if (!userProfile) return '<p>جاري التحميل...</p>';

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-user"></i> الملف الشخصي
        </h2>

        <div class="profile-card">
            <div class="profile-avatar">
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

// ===== الإعدادات =====
function getSettingsHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-cog"></i> الإعدادات
        </h2>

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
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> تغيير كلمة المرور
                </button>
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
window.changePassword = async function(e) {
    e.preventDefault();
    alert('🔧 سيتم إضافة هذه الميزة قريباً');
};

// ===== تغيير اللغة =====
window.changeLanguage = function(lang) {
    alert('🔧 سيتم إضافة هذه الميزة قريباً');
};

// ==========================================================
// ===== دوال مساعدة أخرى =====
// ==========================================================

// ===== عرض الأقسام الفارغة =====
function getEmptySectionHTML(title, icon, message) {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="${icon}"></i> ${title}
        </h2>
        <div class="card text-center" style="padding: 60px;">
            <i class="${icon}" style="font-size: 48px; color: var(--text-muted);"></i>
            <p style="color: var(--text-secondary); margin-top: 12px;">${message}</p>
        </div>
    `;
}

// ===== جلب محتوى الأقسام الأخرى (مؤقتاً) =====
async function getOffersHTML() {
    return getEmptySectionHTML('Offerwalls', 'fas fa-ad', 'قريباً ستتوفر عروض Offerwalls');
}

async function getSurveysHTML() {
    return getEmptySectionHTML('الاستبيانات', 'fas fa-poll', 'قريباً ستتوفر استبيانات مدفوعة');
}

async function getFaucetsHTML() {
    return getEmptySectionHTML('الصنابير', 'fas fa-bolt', 'قريباً ستتوفر صنابير العملات الرقمية');
}

async function getSmartlinksHTML() {
    return getEmptySectionHTML('Smart Links', 'fas fa-link', 'قريباً ستتوفر روابط ذكية');
}

async function getWalletHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-wallet"></i> المحفظة
        </h2>
        <div class="card">
            <h3 style="font-size: 36px; color: var(--secondary);">
                $${parseFloat(userProfile.balance || 0).toFixed(2)}
            </h3>
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
}, 30000); // كل 30 ثانية

console.log('✅ RewardHub Dashboard جاهز!');
