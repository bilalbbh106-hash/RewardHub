// ==========================================================
// RewardHub - Admin.js (النسخة المصححة)
// ==========================================================

console.log('🔍 Admin.js بدأ التحميل...');

// ===== عناصر الصفحة =====
const loginScreen = document.getElementById('adminLoginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const logoutBtn = document.getElementById('adminLogoutBtn');
const currentDateEl = document.getElementById('currentDate');
const adminUserDisplay = document.getElementById('adminUserDisplay');

// ===== متغيرات عامة =====
let adminUser = null;
let adminProfile = null;

// ==========================================================
// ===== التحقق من الجلسة =====
// ==========================================================

async function checkAdminSession() {
    console.log('🔍 جاري التحقق من الجلسة...');
    
    try {
        const session = sessionStorage.getItem('adminLoggedIn');
        
        if (session === 'true') {
            console.log('🔍 جلسة موجودة، جاري التحقق من المستخدم...');
            
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            
            if (user) {
                console.log('🔍 المستخدم موجود:', user.email);
                
                const { data: profile, error: profileError } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile && profile.is_admin) {
                    console.log('✅ مستخدم أدمن موجود:', profile.username);
                    adminUser = user;
                    adminProfile = profile;
                    showDashboard();
                    return;
                } else {
                    console.log('❌ المستخدم ليس أدمن');
                    sessionStorage.removeItem('adminLoggedIn');
                }
            } else {
                console.log('❌ لا يوجد مستخدم');
                sessionStorage.removeItem('adminLoggedIn');
            }
        }
        
        // إذا لم يكن هناك جلسة صالحة، اعرض شاشة تسجيل الدخول
        showLogin();
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error);
        showLogin();
    }
}

// ==========================================================
// ===== عرض/إخفاء الشاشات =====
// ==========================================================

function showLogin() {
    console.log('🔍 عرض شاشة تسجيل الدخول');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showDashboard() {
    console.log('🔍 عرض لوحة الإدارة');
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'flex';
    
    if (adminProfile && adminUserDisplay) {
        adminUserDisplay.textContent = '👤 ' + (adminProfile.full_name || adminProfile.username);
    }
    
    displayCurrentDate();
    loadDashboardStats();
    loadSection('dashboard');
    loadAdminStats();
    loadWalletStats();
}

// ==========================================================
// ===== تسجيل الدخول =====
// ==========================================================

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('🔍 1- بدأ تسجيل الدخول');
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }

        if (!email || !password) {
            if (loginError) {
                loginError.textContent = '⚠️ يرجى ملء جميع الحقول';
                loginError.style.display = 'block';
            }
            console.log('❌ 2- الحقول فارغة');
            return;
        }

        console.log('🔍 3- جاري تسجيل الدخول بـ:', email);

        try {
            // ===== تسجيل الدخول عبر Supabase Auth =====
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('🔍 4- نتيجة تسجيل الدخول:', data ? 'نجاح' : 'فشل');

            if (error) {
                console.error('❌ 5- خطأ تسجيل الدخول:', error.message);
                if (loginError) {
                    loginError.textContent = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    loginError.style.display = 'block';
                }
                return;
            }

            if (!data || !data.user) {
                console.error('❌ 6- لا يوجد مستخدم');
                if (loginError) {
                    loginError.textContent = '❌ لم يتم العثور على المستخدم';
                    loginError.style.display = 'block';
                }
                return;
            }

            console.log('✅ 7- تم تسجيل الدخول، معرف المستخدم:', data.user.id);

            // ===== التحقق من صلاحية الأدمن =====
            console.log('🔍 8- جاري التحقق من صلاحية الأدمن...');
            
            const { data: profile, error: profileError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error('❌ 9- خطأ في جلب بيانات المستخدم:', profileError);
                if (loginError) {
                    loginError.textContent = '❌ خطأ في جلب بيانات المستخدم';
                    loginError.style.display = 'block';
                }
                await supabaseClient.auth.signOut();
                return;
            }

            console.log('🔍 10- بيانات المستخدم:', profile);

            if (!profile) {
                console.error('❌ 11- المستخدم غير موجود في جدول users');
                if (loginError) {
                    loginError.textContent = '❌ المستخدم غير مسجل في النظام';
                    loginError.style.display = 'block';
                }
                await supabaseClient.auth.signOut();
                return;
            }

            if (!profile.is_admin) {
                console.error('❌ 12- المستخدم ليس أدمن');
                if (loginError) {
                    loginError.textContent = '❌ هذا الحساب ليس لديه صلاحية الأدمن';
                    loginError.style.display = 'block';
                }
                await supabaseClient.auth.signOut();
                return;
            }

            console.log('✅ 13- تم التحقق، المستخدم أدمن');

            // ===== تسجيل الدخول ناجح =====
            adminUser = data.user;
            adminProfile = profile;
            sessionStorage.setItem('adminLoggedIn', 'true');
            
            if (loginError) {
                loginError.style.display = 'none';
                loginError.textContent = '';
            }
            
            if (adminEmailInput) adminEmailInput.value = '';
            if (adminPasswordInput) adminPasswordInput.value = '';
            
            console.log('✅ 14- جاري عرض لوحة الإدارة...');
            showDashboard();

        } catch (error) {
            console.error('❌ خطأ غير متوقع:', error);
            if (loginError) {
                loginError.textContent = '❌ حدث خطأ غير متوقع: ' + error.message;
                loginError.style.display = 'block';
            }
        }
    });
} else {
    console.error('❌ نموذج تسجيل الدخول غير موجود!');
}

// ==========================================================
// ===== تسجيل الخروج =====
// ==========================================================

if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            await supabaseClient.auth.signOut();
            sessionStorage.removeItem('adminLoggedIn');
            adminUser = null;
            adminProfile = null;
            showLogin();
            console.log('✅ تم تسجيل الخروج');
        }
    });
}

// ==========================================================
// ===== دوال مساعدة =====
// ==========================================================

function displayCurrentDate() {
    if (!currentDateEl) return;
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDateEl.textContent = now.toLocaleDateString('ar-EG', options);
}

// ==========================================================
// ===== التنقل بين الأقسام =====
// ==========================================================

document.querySelectorAll('.admin-nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('.admin-nav-item').forEach(function(nav) {
            nav.classList.remove('active');
        });
        this.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(function(section) {
            section.style.display = 'none';
        });

        const sectionId = this.getAttribute('data-section');
        const targetSection = document.getElementById('section' + 
            sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
        );

        if (targetSection) {
            targetSection.style.display = 'block';
            loadSectionContent(sectionId);
        }
    });
});

// ==========================================================
// ===== تحميل محتوى الأقسام =====
// ==========================================================

function loadSectionContent(section) {
    const content = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (!content) return;

    switch(section) {
        case 'dashboard':
            content.innerHTML = getDashboardHTML();
            loadAdminStats();
            break;
        case 'users':
            content.innerHTML = getUsersHTML();
            setTimeout(loadUsersTable, 300);
            break;
        case 'withdrawals':
            content.innerHTML = getWithdrawalsHTML();
            setTimeout(loadWithdrawalsTable, 300);
            break;
        case 'prizes':
            content.innerHTML = getPrizesHTML();
            break;
        case 'games':
            content.innerHTML = getGamesHTML();
            break;
        case 'vouchers':
            content.innerHTML = getVouchersHTML();
            break;
        case 'tasks':
            content.innerHTML = getTasksHTML();
            break;
        case 'offers':
            content.innerHTML = getOffersHTML();
            break;
        case 'surveys':
            content.innerHTML = getSurveysHTML();
            break;
        case 'faucets':
            content.innerHTML = getFaucetsHTML();
            break;
        case 'smartlinks':
            content.innerHTML = getSmartlinksHTML();
            break;
        case 'advertisers':
            content.innerHTML = getAdvertisersHTML();
            break;
        case 'campaigns':
            content.innerHTML = getCampaignsHTML();
            break;
        case 'prices':
            content.innerHTML = getPricesHTML();
            break;
        case 'languages':
            content.innerHTML = getLanguagesHTML();
            break;
        case 'notifications':
            content.innerHTML = getNotificationsHTML();
            break;
        case 'ai':
            content.innerHTML = getAIHTML();
            break;
        case 'antifraud':
            content.innerHTML = getAntiFraudHTML();
            break;
        case 'apis':
            content.innerHTML = getAPIsHTML();
            break;
        case 'backup':
            content.innerHTML = getBackupHTML();
            break;
        case 'logs':
            content.innerHTML = getLogsHTML();
            setTimeout(loadLogs, 300);
            break;
        case 'wallet':
            content.innerHTML = getWalletHTML();
            setTimeout(loadWalletStats, 300);
            break;
        case 'ad_requests':
            content.innerHTML = getAdRequestsHTML();
            setTimeout(loadAdRequests, 300);
            break;
        default:
            content.innerHTML = '<p>جاري التحميل...</p>';
    }
}

// ==========================================================
// ===== دوال الأقسام (مختصرة) =====
// ==========================================================

function getDashboardHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-chart-pie"></i> لوحة التحكم
        </h2>

        <div class="admin-stats-grid" id="adminStatsGrid">
            <div class="admin-stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number" id="statsUsers">0</div>
                <div class="stat-label">إجمالي المستخدمين</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number" id="statsEarnings">$0</div>
                <div class="stat-label">إجمالي الأرباح</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🏦</div>
                <div class="stat-number" id="statsWithdrawals">$0</div>
                <div class="stat-label">إجمالي السحوبات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-number" id="statsTasks">0</div>
                <div class="stat-label">المهام المنجزة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-number" style="color: var(--warning);" id="statsPending">0</div>
                <div class="stat-label">سحوبات معلقة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-number" style="color: var(--secondary);">0</div>
                <div class="stat-label">مهام بمراجعة الذكاء الاصطناعي</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div class="card">
                <h4>🔄 آخر السحوبات</h4>
                <div class="table-container" style="margin-top: 12px;">
                    <table>
                        <thead>
                            <tr>
                                <th>المستخدم</th>
                                <th>المبلغ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody id="recentWithdrawals">
                            <tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h4>📊 النشاط اليومي</h4>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-line" style="font-size: 48px; opacity: 0.5;"></i>
                        <p style="margin-top: 12px;">سيتم عرض الرسم البياني هنا</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h4>⚡ إجراءات سريعة</h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                <button class="btn btn-primary btn-sm" onclick="alert('فتح نموذج إضافة مستخدم')">
                    <i class="fas fa-user-plus"></i> إضافة مستخدم
                </button>
                <button class="btn btn-success btn-sm" onclick="alert('فتح نموذج إضافة جائزة')">
                    <i class="fas fa-gift"></i> إضافة جائزة
                </button>
                <button class="btn btn-warning btn-sm" onclick="alert('فتح نموذج إضافة مهمة')">
                    <i class="fas fa-tasks"></i> إضافة مهمة
                </button>
                <button class="btn btn-info btn-sm" onclick="alert('فتح نموذج إرسال إشعار')">
                    <i class="fas fa-bell"></i> إرسال إشعار
                </button>
                <button class="btn btn-danger btn-sm" onclick="if(confirm('هل أنت متأكد؟')) alert('تم عمل نسخة احتياطية')">
                    <i class="fas fa-database"></i> نسخ احتياطي
                </button>
            </div>
        </div>
    `;
}

// ===== دوال أخرى مختصرة =====
function getUsersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-users"></i> إدارة المستخدمين
        </h2>
        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>👥 قائمة المستخدمين</h4>
                <div style="display: flex; gap: 12px;">
                    <input type="text" class="form-control" placeholder="🔍 بحث..." style="width: 200px;" />
                    <button class="btn btn-primary btn-sm"><i class="fas fa-user-plus"></i> إضافة</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المستخدم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الرصيد</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getWithdrawalsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-money-bill-wave"></i> إدارة السحوبات
        </h2>
        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>💸 طلبات السحب</h4>
                <div>
                    <span class="badge badge-warning">0 معلق</span>
                    <span class="badge badge-success">0 مكتمل</span>
                    <span class="badge badge-danger">0 مرفوض</span>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>المبلغ</th>
                            <th>الطريقة</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="withdrawalsTableBody">
                        <tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== باقي الدوال (نفس الكود السابق) =====
// ===== دوال التحميل =====

async function loadUsersTable() {
    try {
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('id, username, email, balance, is_active, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">لا يوجد مستخدمين</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.username || 'مستخدم'}</td>
                <td>${user.email}</td>
                <td>$${parseFloat(user.balance || 0).toFixed(2)}</td>
                <td><span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">${user.is_active ? '✅ نشط' : '❌ موقوف'}</span></td>
                <td>
                    <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل المستخدمين:', error);
    }
}

async function loadWithdrawalsTable() {
    try {
        const { data: withdrawals, error } = await supabaseClient
            .from('withdrawals')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const tbody = document.getElementById('withdrawalsTableBody');
        if (!tbody) return;

        if (withdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">لا توجد سحوبات</td></tr>';
            return;
        }

        tbody.innerHTML = withdrawals.map(w => `
            <tr>
                <td>${w.users?.username || 'مستخدم'}</td>
                <td>$${parseFloat(w.amount || 0).toFixed(2)}</td>
                <td>${w.method || 'غير محدد'}</td>
                <td>${new Date(w.created_at).toLocaleDateString('ar-EG')}</td>
                <td><span class="badge ${w.status === 'pending' ? 'badge-warning' : w.status === 'approved' ? 'badge-success' : 'badge-danger'}">
                    ${w.status === 'pending' ? '⏳ معلق' : w.status === 'approved' ? '✅ مقبول' : '❌ مرفوض'}
                </span></td>
                <td>
                    ${w.status === 'pending' ? `
                        <button class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i></button>
                    ` : `
                        <button class="btn btn-info btn-sm"><i class="fas fa-eye"></i></button>
                    `}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل السحوبات:', error);
    }
}

// ===== دوال السجلات والمحفظة =====
async function loadLogs() {
    try {
        const { data: logs, error } = await supabaseClient
            .from('logs')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">لا توجد سجلات</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td style="font-size: 13px; color: var(--text-muted);">${new Date(log.created_at).toLocaleString('ar-EG')}</td>
                <td>${log.users?.username || 'غير معروف'}</td>
                <td><span class="badge badge-secondary">${log.event_type || 'عام'}</span></td>
                <td>${log.event_description || '-'}</td>
                <td style="font-size: 13px; color: var(--text-muted);">${log.ip_address || '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل السجلات:', error);
    }
}

// ===== دوال إحصائيات الأدمن =====
async function loadAdminStats() {
    try {
        const { count: usersCount } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        const usersEl = document.getElementById('statsUsers');
        if (usersEl) usersEl.textContent = usersCount || 0;

        const { data: earningsData } = await supabaseClient
            .from('users')
            .select('total_earned');
        
        const totalEarnings = earningsData?.reduce((sum, u) => sum + (u.total_earned || 0), 0) || 0;
        const earningsEl = document.getElementById('statsEarnings');
        if (earningsEl) earningsEl.textContent = '$' + totalEarnings.toFixed(2);

        const { data: withdrawalsData } = await supabaseClient
            .from('withdrawals')
            .select('amount')
            .eq('status', 'processed');
        
        const totalWithdrawals = withdrawalsData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        const withdrawalsEl = document.getElementById('statsWithdrawals');
        if (withdrawalsEl) withdrawalsEl.textContent = '$' + totalWithdrawals.toFixed(2);

        const { count: tasksCount } = await supabaseClient
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');
        
        const tasksEl = document.getElementById('statsTasks');
        if (tasksEl) tasksEl.textContent = tasksCount || 0;

        const { count: pendingCount } = await supabaseClient
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        const pendingEl = document.getElementById('statsPending');
        if (pendingEl) pendingEl.textContent = pendingCount || 0;

        const { data: recentWithdrawals } = await supabaseClient
            .from('withdrawals')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(5);

        const recentEl = document.getElementById('recentWithdrawals');
        if (recentEl && recentWithdrawals) {
            if (recentWithdrawals.length === 0) {
                recentEl.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">لا توجد سحوبات</td></tr>';
            } else {
                recentEl.innerHTML = recentWithdrawals.map(w => `
                    <tr>
                        <td>${w.users?.username || 'مستخدم'}</td>
                        <td>$${parseFloat(w.amount || 0).toFixed(2)}</td>
                        <td><span class="badge ${w.status === 'pending' ? 'badge-warning' : w.status === 'approved' ? 'badge-success' : 'badge-danger'}">
                            ${w.status === 'pending' ? '⏳ معلق' : w.status === 'approved' ? '✅ مقبول' : '❌ مرفوض'}
                        </span></td>
                    </tr>
                `).join('');
            }
        }

    } catch (e) {
        console.error('خطأ في تحميل الإحصائيات:', e);
    }
}

async function loadDashboardStats() {
    try {
        const { count: usersCount } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (usersCount !== null) {
            document.getElementById('usersCount').textContent = usersCount || 0;
        }

        const { count: pendingCount } = await supabaseClient
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (pendingCount !== null) {
            document.getElementById('pendingWithdrawals').textContent = pendingCount || 0;
        }
    } catch (e) {
        console.error('خطأ في تحميل الإحصائيات:', e);
    }
}

async function loadWalletStats() {
    try {
        const { data: earningsData } = await supabaseClient
            .from('users')
            .select('total_earned');
        
        const totalEarnings = earningsData?.reduce((sum, u) => sum + (u.total_earned || 0), 0) || 0;
        const depositedEl = document.getElementById('walletDeposited');
        if (depositedEl) depositedEl.textContent = '$' + totalEarnings.toFixed(2);

        const { data: withdrawalsData } = await supabaseClient
            .from('withdrawals')
            .select('amount')
            .eq('status', 'processed');
        
        const totalWithdrawals = withdrawalsData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        const withdrawnEl = document.getElementById('walletWithdrawn');
        if (withdrawnEl) withdrawnEl.textContent = '$' + totalWithdrawals.toFixed(2);

        const { data: balanceData } = await supabaseClient
            .from('users')
            .select('balance');
        
        const totalBalance = balanceData?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
        const balanceEl = document.getElementById('walletBalance');
        if (balanceEl) balanceEl.textContent = '$' + totalBalance.toFixed(2);

        const totalEl = document.getElementById('walletTotal');
        if (totalEl) totalEl.textContent = '$' + (totalEarnings + totalBalance).toFixed(2);

    } catch (e) {
        console.error('❌ خطأ في تحميل إحصائيات المحفظة:', e);
    }
}

// ===== دوال الأقسام الفارغة =====
function getPrizesHTML() { return `<h2>🎁 الجوائز</h2><p>قريباً...</p>`; }
function getGamesHTML() { return `<h2>🎮 الألعاب</h2><p>قريباً...</p>`; }
function getVouchersHTML() { return `<h2>🎫 القسائم</h2><p>قريباً...</p>`; }
function getTasksHTML() { return `<h2>📝 المهام</h2><p>قريباً...</p>`; }
function getOffersHTML() { return `<h2>📢 Offerwalls</h2><p>قريباً...</p>`; }
function getSurveysHTML() { return `<h2>📊 الاستبيانات</h2><p>قريباً...</p>`; }
function getFaucetsHTML() { return `<h2>💰 الصنابير</h2><p>قريباً...</p>`; }
function getSmartlinksHTML() { return `<h2>🔗 Smart Links</h2><p>قريباً...</p>`; }
function getAdvertisersHTML() { return `<h2>📢 المعلنون</h2><p>قريباً...</p>`; }
function getCampaignsHTML() { return `<h2>🚀 الحملات</h2><p>قريباً...</p>`; }
function getPricesHTML() { return `<h2>💰 الأسعار</h2><p>قريباً...</p>`; }
function getLanguagesHTML() { return `<h2>🌍 اللغات</h2><p>قريباً...</p>`; }
function getNotificationsHTML() { return `<h2>🔔 الإشعارات</h2><p>قريباً...</p>`; }
function getAIHTML() { return `<h2>🤖 الذكاء الاصطناعي</h2><p>قريباً...</p>`; }
function getAntiFraudHTML() { return `<h2>🛡️ مكافحة الغش</h2><p>قريباً...</p>`; }
function getAPIsHTML() { return `<h2>🔌 APIs</h2><p>قريباً...</p>`; }
function getBackupHTML() { return `<h2>💾 النسخ الاحتياطي</h2><p>قريباً...</p>`; }
function getLogsHTML() { return `
    <h2>📋 سجل العمليات</h2>
    <div class="admin-table-wrapper">
        <div class="table-container">
            <table>
                <thead><tr><th>التاريخ</th><th>المستخدم</th><th>الحدث</th><th>التفاصيل</th><th>IP</th></tr></thead>
                <tbody id="logsTableBody"><tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">جاري التحميل...</td></tr></tbody>
            </table>
        </div>
    </div>
`; }
function getWalletHTML() { return `
    <h2>💳 محفظة الأدمن</h2>
    <div class="admin-stats-grid">
        <div class="admin-stat-card gradient-card"><div class="stat-icon">💵</div><div class="stat-number" id="walletTotal">$0.00</div><div class="stat-label">إجمالي المحفظة</div></div>
        <div class="admin-stat-card"><div class="stat-icon">📤</div><div class="stat-number" id="walletWithdrawn">$0.00</div><div class="stat-label">إجمالي السحوبات</div></div>
        <div class="admin-stat-card"><div class="stat-icon">📥</div><div class="stat-number" id="walletDeposited">$0.00</div><div class="stat-label">إجمالي الإيداعات</div></div>
        <div class="admin-stat-card"><div class="stat-icon">🏦</div><div class="stat-number" id="walletBalance">$0.00</div><div class="stat-label">الرصيد المتاح</div></div>
    </div>
`; }
function getAdRequestsHTML() { return `<h2>📢 طلبات الإعلان</h2><p>قريباً...</p>`; }

// ===== عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin page loaded - بدأ التحميل');
    checkAdminSession();
});

console.log('✅ Admin.js تم تحميله بنجاح!');
