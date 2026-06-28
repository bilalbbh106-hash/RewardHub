// ==========================================================
// RewardHub - Admin.js (النسخة المصححة)
// ==========================================================

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
            }
        }
        
        console.log('❌ جلسة غير صالحة، مسحها...');
        sessionStorage.removeItem('adminLoggedIn');
    }
    
    showLogin();
}

// ==========================================================
// ===== عرض/إخفاء الشاشات =====
// ==========================================================

function showLogin() {
    console.log('🔍 عرض شاشة تسجيل الدخول');
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showDashboard() {
    console.log('🔍 عرض لوحة الإدارة');
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'flex';
    
    if (adminProfile) {
        adminUserDisplay.textContent = '👤 ' + (adminProfile.full_name || adminProfile.username);
    }
    
    displayCurrentDate();
    loadDashboardStats();
    loadSection('dashboard');
    loadAdminStats();
}

// ==========================================================
// ===== تسجيل الدخول (المصحح) =====
// ==========================================================

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('🔍 1- بدأ تسجيل الدخول');
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    loginError.style.display = 'none';
    loginError.textContent = '';

    if (!email || !password) {
        loginError.textContent = '⚠️ يرجى ملء جميع الحقول';
        loginError.style.display = 'block';
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
            loginError.textContent = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginError.style.display = 'block';
            return;
        }

        if (!data || !data.user) {
            console.error('❌ 6- لا يوجد مستخدم');
            loginError.textContent = '❌ لم يتم العثور على المستخدم';
            loginError.style.display = 'block';
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
            loginError.textContent = '❌ خطأ في جلب بيانات المستخدم';
            loginError.style.display = 'block';
            await supabaseClient.auth.signOut();
            return;
        }

        console.log('🔍 10- بيانات المستخدم:', profile);

        if (!profile) {
            console.error('❌ 11- المستخدم غير موجود في جدول users');
            loginError.textContent = '❌ المستخدم غير مسجل في النظام';
            loginError.style.display = 'block';
            await supabaseClient.auth.signOut();
            return;
        }

        if (!profile.is_admin) {
            console.error('❌ 12- المستخدم ليس أدمن');
            loginError.textContent = '❌ هذا الحساب ليس لديه صلاحية الأدمن';
            loginError.style.display = 'block';
            await supabaseClient.auth.signOut();
            return;
        }

        console.log('✅ 13- تم التحقق، المستخدم أدمن');

        // ===== تسجيل الدخول ناجح =====
        adminUser = data.user;
        adminProfile = profile;
        sessionStorage.setItem('adminLoggedIn', 'true');
        
        loginError.style.display = 'none';
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
        
        console.log('✅ 14- جاري عرض لوحة الإدارة...');
        showDashboard();

    } catch (error) {
        console.error('❌ خطأ غير متوقع:', error);
        loginError.textContent = '❌ حدث خطأ غير متوقع: ' + error.message;
        loginError.style.display = 'block';
    }
});

// ==========================================================
// ===== تسجيل الخروج =====
// ==========================================================

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

// ==========================================================
// ===== دوال مساعدة =====
// ==========================================================

function displayCurrentDate() {
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
            break;
        case 'wallet':
            content.innerHTML = getWalletHTML();
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
// ===== تحميل إحصائيات =====
// ==========================================================

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

        const { count: adRequestsCount } = await supabaseClient
            .from('ad_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        const adEl = document.getElementById('pendingAdsCount');
        if (adEl) adEl.textContent = adRequestsCount || 0;

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

// ==========================================================
// ===== دوال الأقسام =====
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

// ==========================================================
// ===== دوال الأقسام الأخرى (اختصاراً) =====
// ==========================================================

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

function getPrizesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-gift"></i> إدارة الجوائز
        </h2>

        <div class="admin-form">
            <h4>➕ إضافة جائزة جديدة</h4>
            <form id="addPrizeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم الجائزة</label>
                        <input type="text" class="form-control" placeholder="مثال: Google Play Card" />
                    </div>
                    <div class="form-group">
                        <label>السعر ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 25.00" />
                    </div>
                    <div class="form-group">
                        <label>الفئة</label>
                        <select class="form-control">
                            <option>بطاقة هدايا</option>
                            <option>قسيمة لعبة</option>
                            <option>عملة رقمية</option>
                            <option>أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>الكمية المتاحة</label>
                        <input type="number" class="form-control" placeholder="مثال: 100" />
                    </div>
                    <div class="form-group full-width">
                        <label>وصف الجائزة</label>
                        <textarea class="form-control" rows="3" placeholder="وصف الجائزة"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ الجائزة</button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
            </form>
        </div>
    `;
}

function getGamesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-gamepad"></i> إدارة الألعاب
        </h2>

        <div class="admin-form">
            <h4>🎮 إضافة لعبة جديدة</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم اللعبة</label>
                        <input type="text" class="form-control" placeholder="مثال: Blood Strike" />
                    </div>
                    <div class="form-group">
                        <label>الشعار (رابط الصورة)</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                    <div class="form-group full-width">
                        <label>وصف اللعبة</label>
                        <textarea class="form-control" rows="2" placeholder="وصف اللعبة"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ اللعبة</button>
                </div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🎮 الألعاب المدعومة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>اللعبة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>🔫 Blood Strike</td><td><span class="badge badge-success">مدعومة</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                        <tr><td>🔥 Free Fire</td><td><span class="badge badge-success">مدعومة</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                        <tr><td>🎯 PUBG Mobile</td><td><span class="badge badge-success">مدعومة</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                        <tr><td>💣 Call of Duty Mobile</td><td><span class="badge badge-success">مدعومة</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getVouchersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-ticket-alt"></i> إدارة القسائم
        </h2>

        <div class="admin-form">
            <h4>📝 رفع أكواد القسائم</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اختر الجائزة</label>
                        <select class="form-control">
                            <option>Google Play $25</option>
                            <option>Free Fire Diamonds</option>
                            <option>Steam Wallet $50</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>عدد الأكواد</label>
                        <input type="number" class="form-control" placeholder="مثال: 10" />
                    </div>
                    <div class="form-group full-width">
                        <label>أكواد القسائم (كود واحد في كل سطر)</label>
                        <textarea class="form-control" rows="5" placeholder="CODE-12345-XXXXX&#10;CODE-67890-YYYYY&#10;CODE-ABCDE-ZZZZZ"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-upload"></i> رفع الأكواد</button>
                </div>
            </form>
        </div>
    `;
}

function getTasksHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-tasks"></i> إدارة المهام
        </h2>

        <div class="admin-form">
            <h4>➕ إضافة مهمة جديدة</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>عنوان المهمة</label>
                        <input type="text" class="form-control" placeholder="مثال: مشاهدة فيديو" />
                    </div>
                    <div class="form-group">
                        <label>نوع المهمة</label>
                        <select class="form-control">
                            <option>Offerwall</option>
                            <option>استبيان</option>
                            <option>فيديو</option>
                            <option>زيارة موقع</option>
                            <option>Smart Link</option>
                            <option>Faucet</option>
                            <option>اجتماعي</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>المكافأة ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 0.50" step="0.001" />
                    </div>
                    <div class="form-group">
                        <label>المدة (ثانية)</label>
                        <input type="number" class="form-control" placeholder="مثال: 30" />
                    </div>
                    <div class="form-group full-width">
                        <label>رابط المهمة</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                    <div class="form-group full-width">
                        <label>تعليمات المهمة</label>
                        <textarea class="form-control" rows="3" placeholder="تعليمات تنفيذ المهمة"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ المهمة</button>
                </div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📋 قائمة المهام</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المهمة</th>
                            <th>النوع</th>
                            <th>المكافأة</th>
                            <th>المدة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>مشاهدة فيديو 30 ثانية</td>
                            <td>فيديو</td>
                            <td>$0.002</td>
                            <td>30s</td>
                            <td><span class="badge badge-success">نشطة</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>زيارة موقع تقني</td>
                            <td>زيارة</td>
                            <td>$0.001</td>
                            <td>30s</td>
                            <td><span class="badge badge-success">نشطة</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getOffersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-ad"></i> إدارة Offerwalls
        </h2>

        <div class="admin-form">
            <h4>🔗 إضافة Offerwall</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم الشركة</label>
                        <select class="form-control">
                            <option>CPX Research</option>
                            <option>AdGate Media</option>
                            <option>AdGem</option>
                            <option>Lootably</option>
                            <option>Ayet Studios</option>
                            <option>RevU</option>
                            <option>TimeWall</option>
                            <option>BitLabs</option>
                            <option>Monlix</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>API Key</label>
                        <input type="text" class="form-control" placeholder="أدخل مفتاح API" />
                    </div>
                    <div class="form-group full-width">
                        <label>رابط API</label>
                        <input type="text" class="form-control" placeholder="https://api.example.com/offers" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
                </div>
            </form>
        </div>
    `;
}

function getSurveysHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-poll"></i> إدارة الاستبيانات
        </h2>

        <div class="admin-form">
            <h4>📝 إضافة استبيان جديد</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>عنوان الاستبيان</label>
                        <input type="text" class="form-control" placeholder="مثال: استبيان العملاء" />
                    </div>
                    <div class="form-group">
                        <label>المكافأة ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 0.50" />
                    </div>
                    <div class="form-group full-width">
                        <label>رابط الاستبيان</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
                </div>
            </form>
        </div>
    `;
}

function getFaucetsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bolt"></i> إدارة الصنابير (Crypto Faucets)
        </h2>

        <div class="admin-form">
            <h4>💰 إضافة صنبور جديد</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم الصنبور</label>
                        <input type="text" class="form-control" placeholder="مثال: FaucetPay BTC" />
                    </div>
                    <div class="form-group">
                        <label>العملة</label>
                        <select class="form-control">
                            <option>BTC</option>
                            <option>ETH</option>
                            <option>USDT</option>
                            <option>DOGE</option>
                            <option>LTC</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>رابط الصنبور</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
                </div>
            </form>
        </div>
    `;
}

function getSmartlinksHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-link"></i> إدارة Smart Links
        </h2>

        <div class="admin-form">
            <h4>🔗 إضافة Smart Link</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>عنوان الرابط</label>
                        <input type="text" class="form-control" placeholder="مثال: عرض حصري" />
                    </div>
                    <div class="form-group">
                        <label>المكافأة ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 0.005" step="0.001" />
                    </div>
                    <div class="form-group full-width">
                        <label>رابط الوجهة</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
                </div>
            </form>
        </div>
    `;
}

function getAdvertisersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bullhorn"></i> إدارة المعلنين
        </h2>

        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>📢 قائمة المعلنين</h4>
                <button class="btn btn-primary btn-sm"><i class="fas fa-user-plus"></i> إضافة معلن</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المعلن</th>
                            <th>البريد الإلكتروني</th>
                            <th>عدد الحملات</th>
                            <th>الميزانية الكلية</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>شركة التسويق</td>
                            <td>marketing@company.com</td>
                            <td>5</td>
                            <td>$2,500</td>
                            <td><span class="badge badge-success">نشط</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getCampaignsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-rocket"></i> إدارة الحملات الإعلانية
        </h2>

        <div class="admin-form">
            <h4>🚀 إنشاء حملة جديدة</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>عنوان الحملة</label>
                        <input type="text" class="form-control" placeholder="مثال: حملة التسويق الرقمي" />
                    </div>
                    <div class="form-group">
                        <label>المعلن</label>
                        <select class="form-control">
                            <option>شركة التسويق</option>
                            <option>معلن 2</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>الميزانية ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 1000" />
                    </div>
                    <div class="form-group">
                        <label>المكافأة لكل مهمة ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 0.10" step="0.01" />
                    </div>
                    <div class="form-group full-width">
                        <label>رابط الحملة</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> إنشاء الحملة</button>
                </div>
            </form>
        </div>
    `;
}

function getPricesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-dollar-sign"></i> إدارة الأسعار
        </h2>

        <div class="admin-form">
            <h4>💰 تعديل الأسعار الافتراضية</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>فيديو 15 ثانية</label>
                        <input type="number" class="form-control" value="0.001" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>فيديو 30 ثانية</label>
                        <input type="number" class="form-control" value="0.002" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>فيديو 60 ثانية</label>
                        <input type="number" class="form-control" value="0.004" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>فيديو 120 ثانية</label>
                        <input type="number" class="form-control" value="0.008" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>زيارة 15 ثانية</label>
                        <input type="number" class="form-control" value="0.0005" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>زيارة 30 ثانية</label>
                        <input type="number" class="form-control" value="0.001" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>زيارة 60 ثانية</label>
                        <input type="number" class="form-control" value="0.002" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>زيارة 120 ثانية</label>
                        <input type="number" class="form-control" value="0.004" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>مكافأة الإحالة</label>
                        <input type="number" class="form-control" value="0.01" step="0.001" />
                    </div>
                    <div class="form-group">
                        <label>الحد الأدنى للسحب</label>
                        <input type="number" class="form-control" value="2" step="0.5" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
                </div>
            </form>
        </div>
    `;
}

function getLanguagesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-language"></i> إدارة اللغات
        </h2>

        <div class="admin-form">
            <h4>🌍 إضافة لغة جديدة</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم اللغة</label>
                        <input type="text" class="form-control" placeholder="مثال: English" />
                    </div>
                    <div class="form-group">
                        <label>رمز اللغة</label>
                        <input type="text" class="form-control" placeholder="مثال: en" />
                    </div>
                    <div class="form-group full-width">
                        <label>ملف الترجمة (JSON)</label>
                        <textarea class="form-control" rows="5" placeholder='{"welcome": "Welcome to RewardHub", "earn": "Earn Money"}'></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ اللغة</button>
                </div>
            </form>
        </div>
    `;
}

function getNotificationsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bell"></i> إدارة الإشعارات
        </h2>

        <div class="admin-form">
            <h4>📢 إرسال إشعار جديد</h4>
            <form>
                <div class="form-row">
                    <div class="form-group full-width">
                        <label>عنوان الإشعار</label>
                        <input type="text" class="form-control" placeholder="مثال: تحديث جديد في المنصة" />
                    </div>
                    <div class="form-group full-width">
                        <label>رسالة الإشعار</label>
                        <textarea class="form-control" rows="3" placeholder="نص الإشعار"></textarea>
                    </div>
                    <div class="form-group">
                        <label>المستهدفين</label>
                        <select class="form-control">
                            <option>جميع المستخدمين</option>
                            <option>المستخدمين النشطين فقط</option>
                            <option>مستخدم معين</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>رابط (اختياري)</label>
                        <input type="text" class="form-control" placeholder="https://..." />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> إرسال الإشعار</button>
                </div>
            </form>
        </div>
    `;
}

function getAIHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-robot"></i> إدارة الذكاء الاصطناعي
        </h2>

        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-number">0</div>
                <div class="stat-label">مهام بانتظار المراجعة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-number" style="color: var(--success);">94%</div>
                <div class="stat-label">نسبة دقة الذكاء الاصطناعي</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-number" style="color: var(--secondary);">2.3s</div>
                <div class="stat-label">متوسط وقت المراجعة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📸</div>
                <div class="stat-number">0</div>
                <div class="stat-label">صورة تم تحليلها</div>
            </div>
        </div>

        <div class="admin-form">
            <h4>⚙️ إعدادات الذكاء الاصطناعي</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>تفعيل مراجعة الصور</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>نسبة الثقة المطلوبة</label>
                        <input type="number" class="form-control" value="75" min="0" max="100" />
                    </div>
                    <div class="form-group">
                        <label>OCR (قراءة النصوص)</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>كشف الصور المعدلة</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group full-width">
                        <label>المهام المشكوك فيها ترسل للمراجعة اليدوية</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ الإعدادات</button>
                </div>
            </form>
        </div>
    `;
}

function getAntiFraudHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-shield-alt"></i> نظام مكافحة الغش
        </h2>

        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="stat-icon">🛡️</div>
                <div class="stat-number" style="color: var(--success);">0</div>
                <div class="stat-label">حسابات موقوفة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">⚠️</div>
                <div class="stat-number" style="color: var(--warning);">0</div>
                <div class="stat-label">تنبيهات أمنية</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🌐</div>
                <div class="stat-number" style="color: var(--secondary);">0</div>
                <div class="stat-label">محاولات VPN ممنوعة</div>
            </div>
        </div>

        <div class="admin-form">
            <h4>⚙️ إعدادات مكافحة الغش</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>كشف VPN</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>كشف Proxy</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Device Fingerprint</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>كشف الحسابات المتعددة</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>كشف إساءة الإحالات</label>
                        <div class="toggle-switch active" onclick="this.classList.toggle('active')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>الحد الأقصى للمحاولات الفاشلة</label>
                        <input type="number" class="form-control" value="5" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ الإعدادات</button>
                </div>
            </form>
        </div>
    `;
}

function getAPIsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-plug"></i> إدارة مفاتيح API
        </h2>

        <div class="admin-form">
            <h4>🔑 مفاتيح الخدمات</h4>
            <form>
                <div class="form-row">
                    <div class="form-group full-width">
                        <label>Supabase URL</label>
                        <input type="text" class="form-control" placeholder="https://xxxxx.supabase.co" />
                    </div>
                    <div class="form-group full-width">
                        <label>Supabase Key</label>
                        <input type="password" class="form-control" placeholder="أدخل مفتاح Supabase" />
                    </div>
                    <div class="form-group full-width">
                        <label>Binance API Key</label>
                        <input type="password" class="form-control" placeholder="أدخل مفتاح Binance" />
                    </div>
                    <div class="form-group full-width">
                        <label>Binance Secret Key</label>
                        <input type="password" class="form-control" placeholder="أدخل المفتاح السري" />
                    </div>
                    <div class="form-group full-width">
                        <label>Google Vision API (للذكاء الاصطناعي)</label>
                        <input type="password" class="form-control" placeholder="أدخل مفتاح Google Vision" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ المفاتيح</button>
                </div>
                <div style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border: 1px solid var(--warning);">
                    <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                    <span style="color: var(--text-secondary);">⚠️ هذه المفاتيح مخزنة في الخادم وليست في واجهة المستخدم</span>
                </div>
            </form>
        </div>
    `;
}

function getBackupHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-database"></i> النسخ الاحتياطي
        </h2>

        <div class="card">
            <h4>💾 عمل نسخة احتياطية</h4>
            <p style="color: var(--text-secondary); margin: 12px 0;">
                قم بعمل نسخة احتياطية كاملة من قاعدة البيانات وجميع الملفات
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="if(confirm('هل أنت متأكد؟')) alert('جاري إنشاء النسخة الاحتياطية...')">
                    <i class="fas fa-download"></i> إنشاء نسخة احتياطية
                </button>
                <button class="btn btn-secondary">
                    <i class="fas fa-upload"></i> استعادة نسخة
                </button>
            </div>
        </div>
    `;
}

function getLogsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-history"></i> سجل العمليات
        </h2>

        <div class="admin-form" style="margin-bottom: 20px;">
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <input type="text" class="form-control" placeholder="🔍 بحث في السجل..." style="flex: 1; min-width: 200px;" />
                <select class="form-control" style="width: auto;">
                    <option>جميع العمليات</option>
                    <option>تسجيل دخول</option>
                    <option>مهمة</option>
                    <option>سحب</option>
                    <option>جائزة</option>
                </select>
                <button class="btn btn-primary"><i class="fas fa-search"></i> بحث</button>
                <button class="btn btn-secondary"><i class="fas fa-sync"></i> تحديث</button>
            </div>
        </div>

        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>📋 سجل الأحداث</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ والوقت</th>
                            <th>المستخدم</th>
                            <th>الحدث</th>
                            <th>التفاصيل</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2026-06-28 14:32:15</td>
                            <td>Ahmed_Gamer</td>
                            <td><span class="badge badge-success">تسجيل دخول</span></td>
                            <td>تسجيل دخول ناجح</td>
                            <td>192.168.1.1</td>
                        </tr>
                        <tr>
                            <td>2026-06-28 14:28:42</td>
                            <td>Crypto_Warrior</td>
                            <td><span class="badge badge-info">مهمة</span></td>
                            <td>أكمل مهمة فيديو 30 ثانية</td>
                            <td>192.168.1.2</td>
                        </tr>
                        <tr>
                            <td>2026-06-28 14:15:03</td>
                            <td>FreeFire_King</td>
                            <td><span class="badge badge-warning">سحب</span></td>
                            <td>طلب سحب $25.00</td>
                            <td>192.168.1.3</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getWalletHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-wallet"></i> محفظة الأدمن
        </h2>

        <div class="admin-stats-grid">
            <div class="admin-stat-card gradient-card">
                <div class="stat-icon">💵</div>
                <div class="stat-number" style="-webkit-text-fill-color: white;">$12,450.00</div>
                <div class="stat-label">إجمالي المحفظة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📤</div>
                <div class="stat-number" style="color: var(--danger);">$8,230.00</div>
                <div class="stat-label">إجمالي السحوبات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📥</div>
                <div class="stat-number" style="color: var(--success);">$20,680.00</div>
                <div class="stat-label">إجمالي الإيداعات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🏦</div>
                <div class="stat-number" style="color: var(--secondary);">$4,220.00</div>
                <div class="stat-label">الرصيد المتاح</div>
            </div>
        </div>

        <div class="admin-form">
            <h4>➕ إضافة رصيد للمستخدم</h4>
            <form>
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم المستخدم</label>
                        <input type="text" class="form-control" placeholder="أدخل اسم المستخدم" />
                    </div>
                    <div class="form-group">
                        <label>المبلغ ($)</label>
                        <input type="number" class="form-control" placeholder="مثال: 10.00" step="0.01" />
                    </div>
                    <div class="form-group full-width">
                        <label>سبب الإضافة</label>
                        <textarea class="form-control" rows="2" placeholder="سبب إضافة الرصيد"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-success"><i class="fas fa-plus"></i> إضافة رصيد</button>
                </div>
            </form>
        </div>
    `;
}

function getAdRequestsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bullhorn" style="color: var(--accent);"></i> طلبات الإعلان
        </h2>

        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>📢 طلبات الإعلان الواردة</h4>
                <div>
                    <span class="badge badge-warning" id="pendingCount">0 معلق</span>
                    <span class="badge badge-success" id="approvedCount">0 مقبول</span>
                    <span class="badge badge-danger" id="rejectedCount">0 مرفوض</span>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المعلن</th>
                            <th>نوع الإعلان</th>
                            <th>الرابط</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="adRequestsTableBody">
                        <tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ==========================================================
// ===== دوال تحميل البيانات =====
// ==========================================================

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
                    <button class="btn btn-info btn-sm" onclick="alert('تعديل المستخدم ${user.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="if(confirm('هل أنت متأكد؟')) alert('تم حذف المستخدم')"><i class="fas fa-trash"></i></button>
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
                        <button class="btn btn-success btn-sm" onclick="approveWithdrawal('${w.id}')"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="rejectWithdrawal('${w.id}')"><i class="fas fa-times"></i></button>
                    ` : `
                        <button class="btn btn-info btn-sm" onclick="alert('تفاصيل السحب')"><i class="fas fa-eye"></i></button>
                    `}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل السحوبات:', error);
    }
}

async function loadAdRequests() {
    try {
        const { data: requests, error } = await supabaseClient
            .from('ad_requests')
            .select('*, users(username, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('adRequestsTableBody');
        if (!tbody) return;

        const pending = requests?.filter(r => r.status === 'pending').length || 0;
        const approved = requests?.filter(r => r.status === 'approved').length || 0;
        const rejected = requests?.filter(r => r.status === 'rejected').length || 0;

        document.getElementById('pendingCount').textContent = `${pending} معلق`;
        document.getElementById('approvedCount').textContent = `${approved} مقبول`;
        document.getElementById('rejectedCount').textContent = `${rejected} مرفوض`;

        if (!requests || requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">لا توجد طلبات إعلان</td></tr>';
            return;
        }

        const typeNames = {
            website: '🌐 موقع',
            social: '📱 تواصل اجتماعي',
            premium: '⭐ إعلان مميز'
        };

        const statusColors = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger',
            completed: 'badge-info'
        };

        const statusNames = {
            pending: '⏳ قيد المراجعة',
            approved: '✅ مقبول',
            rejected: '❌ مرفوض',
            completed: '✅ مكتمل'
        };

        tbody.innerHTML = requests.map((r, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${r.users?.username || 'مستخدم'}</strong>
                    <br><small style="color: var(--text-muted);">${r.users?.email || ''}</small>
                </td>
                <td>${typeNames[r.type] || r.type}</td>
                <td><a href="${r.link}" target="_blank" style="color: var(--secondary); font-size: 12px; word-break: break-all;">${r.link.substring(0, 30)}...</a></td>
                <td><span style="color: var(--secondary); font-weight: 700;">$${r.type === 'premium' ? '25.00' : '10.00'}</span></td>
                <td style="font-size: 12px; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                <td><span class="badge ${statusColors[r.status] || 'badge-warning'}">${statusNames[r.status] || r.status}</span></td>
                <td>
                    ${r.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveAd('${r.id}')" title="قبول"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="rejectAd('${r.id}')" title="رفض"><i class="fas fa-times"></i></button>
                    ` : `
                        <button class="btn btn-info btn-sm" onclick="viewAdDetails('${r.id}')" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                    `}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل طلبات الإعلان:', error);
    }
}

// ==========================================================
// ===== دوال إدارة السحوبات =====
// ==========================================================

window.approveWithdrawal = async function(withdrawalId) {
    if (!confirm('✅ هل أنت متأكد من قبول هذا السحب؟')) return;

    try {
        const { error } = await supabaseClient
            .from('withdrawals')
            .update({
                status: 'approved',
                processed_by: adminUser?.id,
                processed_at: new Date().toISOString(),
                admin_notes: 'تمت الموافقة على السحب'
            })
            .eq('id', withdrawalId);

        if (error) throw error;

        alert('✅ تم قبول السحب بنجاح!');
        loadWithdrawalsTable();
        loadAdminStats();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.rejectWithdrawal = async function(withdrawalId) {
    const reason = prompt('❌ سبب الرفض (اختياري):');
    if (reason === null) return;

    try {
        const { data: withdrawal, error: getError } = await supabaseClient
            .from('withdrawals')
            .select('user_id, amount')
            .eq('id', withdrawalId)
            .single();

        if (getError) throw getError;

        const { error } = await supabaseClient
            .from('withdrawals')
            .update({
                status: 'rejected',
                processed_by: adminUser?.id,
                processed_at: new Date().toISOString(),
                admin_notes: reason || 'تم رفض السحب من قبل الإدارة'
            })
            .eq('id', withdrawalId);

        if (error) throw error;

        // إعادة الرصيد للمستخدم
        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({
                balance: supabaseClient.rpc('increment_balance', {
                    user_id: withdrawal.user_id,
                    amount: withdrawal.amount
                })
            })
            .eq('id', withdrawal.user_id);

        if (balanceError) throw balanceError;

        alert('❌ تم رفض السحب وإعادة المبلغ للمستخدم');
        loadWithdrawalsTable();
        loadAdminStats();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

// ==========================================================
// ===== دوال إدارة طلبات الإعلان =====
// ==========================================================

window.approveAd = async function(requestId) {
    if (!confirm('✅ هل أنت متأكد من قبول طلب الإعلان هذا؟')) return;

    try {
        const { error } = await supabaseClient
            .from('ad_requests')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminUser?.id
            })
            .eq('id', requestId);

        if (error) throw error;

        alert('✅ تم قبول طلب الإعلان بنجاح!');
        loadAdRequests();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.rejectAd = async function(requestId) {
    const reason = prompt('❌ سبب الرفض (اختياري):');
    if (reason === null) return;

    try {
        const { error } = await supabaseClient
            .from('ad_requests')
            .update({
                status: 'rejected',
                admin_notes: reason || 'تم الرفض من قبل الإدارة',
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminUser?.id
            })
            .eq('id', requestId);

        if (error) throw error;

        alert('❌ تم رفض طلب الإعلان');
        loadAdRequests();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.viewAdDetails = function(requestId) {
    alert(`🔍 تفاصيل الطلب (ID: ${requestId})\n\nسيتم عرض التفاصيل الكاملة قريباً`);
};

// ==========================================================
// ===== عند تحميل الصفحة =====
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin page loaded');
    checkAdminSession();
});

console.log('🔐 Admin Panel (Secure Version) جاهز!');
