// ==========================================================
// RewardHub - Admin.js (النسخة الكاملة النهائية)
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
            setTimeout(loadPrizesTable, 300);
            break;
        case 'games':
            content.innerHTML = getGamesHTML();
            setTimeout(loadGamesTable, 300);
            break;
        case 'vouchers':
            content.innerHTML = getVouchersHTML();
            setTimeout(loadVouchersTable, 300);
            break;
        case 'tasks':
            content.innerHTML = getTasksHTML();
            setTimeout(loadTasksTable, 300);
            break;
        case 'prices':
            content.innerHTML = getPricesHTML();
            setTimeout(loadPrices, 300);
            break;
        case 'notifications':
            content.innerHTML = getNotificationsHTML();
            setTimeout(loadNotificationsTable, 300);
            break;
        case 'smartlinks':
            content.innerHTML = getSmartLinksHTML();
            setTimeout(loadSmartLinksTable, 300);
            break;
        case 'languages':
            content.innerHTML = getLanguagesHTML();
            setTimeout(loadLanguagesTable, 300);
            break;
        case 'advertisers':
            content.innerHTML = getAdvertisersHTML();
            setTimeout(loadAdvertisersTable, 300);
            break;
        case 'campaigns':
            content.innerHTML = getCampaignsHTML();
            setTimeout(loadCampaignsTable, 300);
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
// ===== دوال لوحة التحكم =====
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
                <div class="stat-icon">🎮</div>
                <div class="stat-number" id="statsGames">0</div>
                <div class="stat-label">الألعاب المدعومة</div>
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
                <button class="btn btn-primary btn-sm" onclick="loadSection('users')">
                    <i class="fas fa-users"></i> إدارة المستخدمين
                </button>
                <button class="btn btn-success btn-sm" onclick="loadSection('prizes')">
                    <i class="fas fa-gift"></i> إدارة الجوائز
                </button>
                <button class="btn btn-warning btn-sm" onclick="loadSection('tasks')">
                    <i class="fas fa-tasks"></i> إدارة المهام
                </button>
                <button class="btn btn-info btn-sm" onclick="loadSection('notifications')">
                    <i class="fas fa-bell"></i> الإشعارات
                </button>
                <button class="btn btn-danger btn-sm" onclick="if(confirm('هل أنت متأكد؟')) alert('تم عمل نسخة احتياطية')">
                    <i class="fas fa-database"></i> نسخ احتياطي
                </button>
            </div>
        </div>
    `;
}

// ==========================================================
// ===== دوال المستخدمين =====
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

// ==========================================================
// ===== دوال السحوبات =====
// ==========================================================

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

// ==========================================================
// ===== دوال المهام =====
// ==========================================================

function getTasksHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-tasks"></i> إدارة المهام
        </h2>

        <div class="admin-form">
            <h4>➕ إضافة مهمة جديدة</h4>
            <form id="addTaskForm" onsubmit="addNewTask(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>📌 عنوان المهمة</label>
                        <input type="text" id="taskTitle" class="form-control" placeholder="مثال: مشاهدة فيديو" required />
                    </div>
                    <div class="form-group">
                        <label>💰 المكافأة ($)</label>
                        <input type="number" id="taskReward" class="form-control" placeholder="مثال: 0.002" step="0.001" required />
                    </div>
                    <div class="form-group">
                        <label>📂 نوع المهمة</label>
                        <select id="taskType" class="form-control">
                            <option value="video">🎬 فيديو</option>
                            <option value="visit">🌐 زيارة موقع</option>
                            <option value="survey">📊 استبيان</option>
                            <option value="offerwall">📢 Offerwall</option>
                            <option value="social">📱 اجتماعي</option>
                            <option value="smartlink">🔗 Smart Link</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>⏱️ المدة (ثانية)</label>
                        <input type="number" id="taskDuration" class="form-control" placeholder="مثال: 30" />
                    </div>
                    <div class="form-group full-width">
                        <label>🔗 رابط المهمة</label>
                        <input type="url" id="taskUrl" class="form-control" placeholder="https://example.com" />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 تعليمات المهمة</label>
                        <textarea id="taskInstructions" class="form-control" rows="3" placeholder="تعليمات تنفيذ المهمة"></textarea>
                    </div>
                    <div class="form-group">
                        <label>📸 يتطلب لقطة شاشة</label>
                        <select id="taskScreenshot" class="form-control">
                            <option value="true">نعم</option>
                            <option value="false">لا</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>✅ الحالة</label>
                        <select id="taskStatus" class="form-control">
                            <option value="true">🟢 نشطة</option>
                            <option value="false">🔴 غير نشطة</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ المهمة
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="taskResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📋 قائمة المهام</h4>
                <button class="btn btn-success btn-sm" onclick="refreshTasks()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>النوع</th>
                            <th>المكافأة</th>
                            <th>المدة</th>
                            <th>لقطة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="tasksTableBody">
                        <tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال المهام =====

window.addNewTask = async function(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const reward = parseFloat(document.getElementById('taskReward').value);
    const type = document.getElementById('taskType').value;
    const duration = parseInt(document.getElementById('taskDuration').value) || 0;
    const url = document.getElementById('taskUrl').value.trim();
    const instructions = document.getElementById('taskInstructions').value.trim();
    const requiresScreenshot = document.getElementById('taskScreenshot').value === 'true';
    const isActive = document.getElementById('taskStatus').value === 'true';

    const responseEl = document.getElementById('taskResponse');
    responseEl.style.display = 'none';

    if (!title || !reward || reward <= 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال عنوان المهمة ومكافأة صحيحة';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([{
                title: title,
                reward: reward,
                task_type: type,
                duration_seconds: duration || null,
                task_url: url || null,
                instructions: instructions || null,
                requires_screenshot: requiresScreenshot,
                is_active: isActive
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إضافة المهمة "${title}" بنجاح!`;

        document.getElementById('addTaskForm').reset();
        loadTasksTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadTasksTable() {
    try {
        const { data: tasks, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;

        if (!tasks || tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">لا توجد مهام</td></tr>';
            return;
        }

        const typeNames = {
            'video': '🎬 فيديو',
            'visit': '🌐 زيارة',
            'survey': '📊 استبيان',
            'offerwall': '📢 Offerwall',
            'social': '📱 اجتماعي',
            'smartlink': '🔗 Smart Link'
        };

        tbody.innerHTML = tasks.map((task, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${task.title}</td>
                <td>${typeNames[task.task_type] || task.task_type}</td>
                <td style="color: var(--secondary); font-weight: 700;">$${parseFloat(task.reward).toFixed(3)}</td>
                <td>${task.duration_seconds || '-'}</td>
                <td>${task.requires_screenshot ? '📸 نعم' : '❌ لا'}</td>
                <td>
                    <span class="badge ${task.is_active ? 'badge-success' : 'badge-danger'}">
                        ${task.is_active ? '✅ نشطة' : '❌ غير نشطة'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editTask('${task.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل المهام:', error);
        const tbody = document.getElementById('tasksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل المهام</td></tr>';
        }
    }
}

window.refreshTasks = function() {
    loadTasksTable();
};

window.deleteTask = async function(taskId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;

        alert('✅ تم حذف المهمة بنجاح!');
        loadTasksTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editTask = function(taskId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال الجوائز =====
// ==========================================================

function getPrizesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-gift"></i> إدارة الجوائز
        </h2>

        <div class="admin-form">
            <h4>➕ إضافة جائزة جديدة</h4>
            <form id="addPrizeForm" onsubmit="addNewPrize(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>🏷️ اسم الجائزة</label>
                        <input type="text" id="prizeName" class="form-control" placeholder="مثال: Google Play Card" required />
                    </div>
                    <div class="form-group">
                        <label>💰 السعر ($)</label>
                        <input type="number" id="prizePrice" class="form-control" placeholder="مثال: 25.00" step="0.01" required />
                    </div>
                    <div class="form-group">
                        <label>📂 الفئة</label>
                        <select id="prizeCategory" class="form-control">
                            <option value="giftcard">🎫 بطاقة هدايا</option>
                            <option value="game">🎮 قسيمة لعبة</option>
                            <option value="crypto">₿ عملة رقمية</option>
                            <option value="other">📦 أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>📦 الكمية المتاحة</label>
                        <input type="number" id="prizeStock" class="form-control" placeholder="مثال: 100" value="10" />
                    </div>
                    <div class="form-group full-width">
                        <label>🖼️ رابط الصورة (اختياري)</label>
                        <input type="url" id="prizeImage" class="form-control" placeholder="https://example.com/image.png" />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 وصف الجائزة</label>
                        <textarea id="prizeDescription" class="form-control" rows="3" placeholder="وصف الجائزة"></textarea>
                    </div>
                    <div class="form-group">
                        <label>🎮 اسم اللعبة (لجوائز الألعاب)</label>
                        <input type="text" id="prizeGame" class="form-control" placeholder="مثال: Free Fire" />
                    </div>
                    <div class="form-group">
                        <label>✅ الحالة</label>
                        <select id="prizeStatus" class="form-control">
                            <option value="true">🟢 متاحة</option>
                            <option value="false">🔴 غير متاحة</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ الجائزة
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="prizeResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🎁 قائمة الجوائز</h4>
                <button class="btn btn-success btn-sm" onclick="refreshPrizes()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الجائزة</th>
                            <th>الفئة</th>
                            <th>السعر</th>
                            <th>المخزون</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="prizesTableBody">
                        <tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال الجوائز =====

window.addNewPrize = async function(e) {
    e.preventDefault();

    const name = document.getElementById('prizeName').value.trim();
    const price = parseFloat(document.getElementById('prizePrice').value);
    const category = document.getElementById('prizeCategory').value;
    const stock = parseInt(document.getElementById('prizeStock').value) || 0;
    const image = document.getElementById('prizeImage').value.trim();
    const description = document.getElementById('prizeDescription').value.trim();
    const game = document.getElementById('prizeGame').value.trim();
    const isActive = document.getElementById('prizeStatus').value === 'true';

    const responseEl = document.getElementById('prizeResponse');
    responseEl.style.display = 'none';

    if (!name || !price || price <= 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال اسم الجائزة وسعر صحيح';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('prizes')
            .insert([{
                name: name,
                price: price,
                category: category,
                stock: stock,
                image_url: image || null,
                description: description || null,
                game_name: game || null,
                is_active: isActive
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إضافة الجائزة "${name}" بنجاح!`;

        document.getElementById('addPrizeForm').reset();
        loadPrizesTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadPrizesTable() {
    try {
        const { data: prizes, error } = await supabaseClient
            .from('prizes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('prizesTableBody');
        if (!tbody) return;

        if (!prizes || prizes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">لا توجد جوائز</td></tr>';
            return;
        }

        const categoryNames = {
            'giftcard': '🎫 بطاقة هدايا',
            'game': '🎮 قسيمة لعبة',
            'crypto': '₿ عملة رقمية',
            'other': '📦 أخرى'
        };

        tbody.innerHTML = prizes.map((prize, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${prize.name}</strong>
                    ${prize.image_url ? `<br><img src="${prize.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-top: 4px;" />` : ''}
                </td>
                <td>${categoryNames[prize.category] || prize.category}</td>
                <td style="color: var(--secondary); font-weight: 700;">$${parseFloat(prize.price).toFixed(2)}</td>
                <td>${prize.stock}</td>
                <td>
                    <span class="badge ${prize.is_active ? 'badge-success' : 'badge-danger'}">
                        ${prize.is_active ? '✅ متاحة' : '❌ غير متاحة'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editPrize('${prize.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletePrize('${prize.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل الجوائز:', error);
        const tbody = document.getElementById('prizesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل الجوائز</td></tr>';
        }
    }
}

window.refreshPrizes = function() {
    loadPrizesTable();
};

window.deletePrize = async function(prizeId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الجائزة؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
        const { error } = await supabaseClient
            .from('prizes')
            .delete()
            .eq('id', prizeId);

        if (error) throw error;

        alert('✅ تم حذف الجائزة بنجاح!');
        loadPrizesTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editPrize = function(prizeId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال الألعاب =====
// ==========================================================

function getGamesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-gamepad"></i> إدارة الألعاب
        </h2>

        <div class="admin-form">
            <h4>🎮 إضافة لعبة جديدة</h4>
            <form id="addGameForm" onsubmit="addNewGame(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>🎯 اسم اللعبة</label>
                        <input type="text" id="gameName" class="form-control" placeholder="مثال: Free Fire" required />
                    </div>
                    <div class="form-group">
                        <label>📂 الفئة</label>
                        <select id="gameCategory" class="form-control">
                            <option value="shooting">🔫 تصويب</option>
                            <option value="battle">⚔️ معركة</option>
                            <option value="strategy">🧠 استراتيجية</option>
                            <option value="sports">🏅 رياضية</option>
                            <option value="other">📦 أخرى</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>🖼️ رابط الصورة</label>
                        <input type="url" id="gameImage" class="form-control" placeholder="https://example.com/game.png" />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 وصف اللعبة</label>
                        <textarea id="gameDescription" class="form-control" rows="3" placeholder="وصف اللعبة"></textarea>
                    </div>
                    <div class="form-group">
                        <label>✅ الحالة</label>
                        <select id="gameStatus" class="form-control">
                            <option value="true">🟢 مدعومة</option>
                            <option value="false">🔴 غير مدعومة</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ اللعبة
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="gameResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🎮 قائمة الألعاب</h4>
                <button class="btn btn-success btn-sm" onclick="refreshGames()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اللعبة</th>
                            <th>الفئة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="gamesTableBody">
                        <tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال الألعاب =====

window.addNewGame = async function(e) {
    e.preventDefault();

    const name = document.getElementById('gameName').value.trim();
    const category = document.getElementById('gameCategory').value;
    const image = document.getElementById('gameImage').value.trim();
    const description = document.getElementById('gameDescription').value.trim();
    const isActive = document.getElementById('gameStatus').value === 'true';

    const responseEl = document.getElementById('gameResponse');
    responseEl.style.display = 'none';

    if (!name) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال اسم اللعبة';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('games')
            .insert([{
                name: name,
                category: category,
                image_url: image || null,
                description: description || null,
                is_active: isActive
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إضافة اللعبة "${name}" بنجاح!`;

        document.getElementById('addGameForm').reset();
        loadGamesTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadGamesTable() {
    try {
        const { data: games, error } = await supabaseClient
            .from('games')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('gamesTableBody');
        if (!tbody) return;

        if (!games || games.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">لا توجد ألعاب</td></tr>';
            return;
        }

        const categoryNames = {
            'shooting': '🔫 تصويب',
            'battle': '⚔️ معركة',
            'strategy': '🧠 استراتيجية',
            'sports': '🏅 رياضية',
            'other': '📦 أخرى'
        };

        const statsGames = document.getElementById('statsGames');
        if (statsGames) statsGames.textContent = games.length;

        tbody.innerHTML = games.map((game, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${game.name}</strong>
                    ${game.image_url ? `<br><img src="${game.image_url}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px; margin-top: 4px;" />` : ''}
                </td>
                <td>${categoryNames[game.category] || game.category}</td>
                <td>
                    <span class="badge ${game.is_active ? 'badge-success' : 'badge-danger'}">
                        ${game.is_active ? '✅ مدعومة' : '❌ غير مدعومة'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editGame('${game.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGame('${game.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل الألعاب:', error);
        const tbody = document.getElementById('gamesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل الألعاب</td></tr>';
        }
    }
}

window.refreshGames = function() {
    loadGamesTable();
};

window.deleteGame = async function(gameId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه اللعبة؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
        const { error } = await supabaseClient
            .from('games')
            .delete()
            .eq('id', gameId);

        if (error) throw error;

        alert('✅ تم حذف اللعبة بنجاح!');
        loadGamesTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editGame = function(gameId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال القسائم =====
// ==========================================================

function getVouchersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-ticket-alt"></i> إدارة القسائم
        </h2>

        <div class="admin-form">
            <h4>📝 رفع أكواد القسائم</h4>
            <form id="addVoucherForm" onsubmit="addNewVouchers(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>🎁 اختر الجائزة</label>
                        <select id="voucherPrize" class="form-control" required>
                            <option value="">اختر جائزة...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>💰 قيمة القسيمة ($)</label>
                        <input type="number" id="voucherValue" class="form-control" placeholder="مثال: 25.00" step="0.01" required />
                    </div>
                    <div class="form-group full-width">
                        <label>📋 أكواد القسائم (كود واحد في كل سطر)</label>
                        <textarea id="voucherCodes" class="form-control" rows="5" placeholder="CODE-12345-XXXXX&#10;CODE-67890-YYYYY&#10;CODE-ABCDE-ZZZZZ" required></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload"></i> رفع الأكواد
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="voucherResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🎫 قائمة القسائم</h4>
                <button class="btn btn-success btn-sm" onclick="refreshVouchers()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الكود</th>
                            <th>الجائزة</th>
                            <th>القيمة</th>
                            <th>الحالة</th>
                            <th>المستخدم</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="vouchersTableBody">
                        <tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال القسائم =====

async function loadPrizesForVouchers() {
    try {
        const { data: prizes, error } = await supabaseClient
            .from('prizes')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        const select = document.getElementById('voucherPrize');
        if (!select) return;

        select.innerHTML = '<option value="">اختر جائزة...</option>';

        if (prizes && prizes.length > 0) {
            prizes.forEach(prize => {
                const option = document.createElement('option');
                option.value = prize.id;
                option.textContent = prize.name;
                select.appendChild(option);
            });
        }

    } catch (error) {
        console.error('❌ خطأ في تحميل الجوائز للقسائم:', error);
    }
}

window.addNewVouchers = async function(e) {
    e.preventDefault();

    const prizeId = document.getElementById('voucherPrize').value;
    const value = parseFloat(document.getElementById('voucherValue').value);
    const codesText = document.getElementById('voucherCodes').value.trim();

    const responseEl = document.getElementById('voucherResponse');
    responseEl.style.display = 'none';

    if (!prizeId) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى اختيار جائزة';
        return;
    }

    if (!value || value <= 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال قيمة صحيحة للقسيمة';
        return;
    }

    if (!codesText) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال أكواد القسائم';
        return;
    }

    const codes = codesText.split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0);

    if (codes.length === 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال كود صحيح';
        return;
    }

    const vouchers = codes.map(code => ({
        prize_id: prizeId,
        code: code,
        value: value,
        is_used: false
    }));

    try {
        const { data, error } = await supabaseClient
            .from('vouchers')
            .insert(vouchers)
            .select();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم رفع ${data.length} قسيمة بنجاح!`;

        document.getElementById('addVoucherForm').reset();
        loadVouchersTable();
        setTimeout(() => {
            loadPrizesForVouchers();
        }, 500);

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadVouchersTable() {
    try {
        const { data: vouchers, error } = await supabaseClient
            .from('vouchers')
            .select('*, prizes(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('vouchersTableBody');
        if (!tbody) return;

        if (!vouchers || vouchers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">لا توجد قسائم</td></tr>';
            return;
        }

        tbody.innerHTML = vouchers.map((voucher, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><code style="background: var(--dark-input); padding: 2px 8px; border-radius: 4px;">${voucher.code}</code></td>
                <td>${voucher.prizes?.name || 'غير محدد'}</td>
                <td style="color: var(--secondary); font-weight: 700;">$${parseFloat(voucher.value).toFixed(2)}</td>
                <td>
                    <span class="badge ${voucher.is_used ? 'badge-danger' : 'badge-success'}">
                        ${voucher.is_used ? '❌ مستخدمة' : '✅ متاحة'}
                    </span>
                </td>
                <td>${voucher.used_by ? 'مستخدم' : '-'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteVoucher('${voucher.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل القسائم:', error);
        const tbody = document.getElementById('vouchersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل القسائم</td></tr>';
        }
    }
}

window.refreshVouchers = function() {
    loadVouchersTable();
};

window.deleteVoucher = async function(voucherId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه القسيمة؟')) return;

    try {
        const { error } = await supabaseClient
            .from('vouchers')
            .delete()
            .eq('id', voucherId);

        if (error) throw error;

        alert('✅ تم حذف القسيمة بنجاح!');
        loadVouchersTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

// ==========================================================
// ===== دوال الإشعارات =====
// ==========================================================

function getNotificationsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bell"></i> إدارة الإشعارات
        </h2>

        <div class="admin-form">
            <h4>📢 إرسال إشعار جديد</h4>
            <form id="addNotificationForm" onsubmit="sendNotificationToUsers(event)">
                <div class="form-row">
                    <div class="form-group full-width">
                        <label>📌 عنوان الإشعار</label>
                        <input type="text" id="notifTitle" class="form-control" placeholder="مثال: تحديث جديد في المنصة" required />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 رسالة الإشعار</label>
                        <textarea id="notifMessage" class="form-control" rows="3" placeholder="نص الإشعار" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>🎯 المستهدفين</label>
                        <select id="notifTarget" class="form-control">
                            <option value="all">جميع المستخدمين</option>
                            <option value="active">المستخدمين النشطين فقط</option>
                            <option value="specific">مستخدم معين</option>
                        </select>
                    </div>
                    <div class="form-group" id="notifSpecificUserGroup" style="display: none;">
                        <label>👤 اسم المستخدم</label>
                        <input type="text" id="notifSpecificUser" class="form-control" placeholder="أدخل اسم المستخدم" />
                    </div>
                    <div class="form-group">
                        <label>📂 نوع الإشعار</label>
                        <select id="notifType" class="form-control">
                            <option value="system">⚙️ نظام</option>
                            <option value="promotion">🎯 ترويجي</option>
                            <option value="update">🔄 تحديث</option>
                            <option value="warning">⚠️ تنبيه</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>🔗 رابط (اختياري)</label>
                        <input type="url" id="notifLink" class="form-control" placeholder="https://example.com" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> إرسال الإشعار
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="notifResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📋 سجل الإشعارات المرسلة</h4>
                <button class="btn btn-success btn-sm" onclick="refreshNotifications()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>النوع</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="notificationsTableBody">
                        <tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال الإشعارات =====

document.addEventListener('DOMContentLoaded', function() {
    const targetSelect = document.getElementById('notifTarget');
    if (targetSelect) {
        targetSelect.addEventListener('change', function() {
            const specificGroup = document.getElementById('notifSpecificUserGroup');
            if (specificGroup) {
                specificGroup.style.display = this.value === 'specific' ? 'block' : 'none';
            }
        });
    }
});

window.sendNotificationToUsers = async function(e) {
    e.preventDefault();

    const title = document.getElementById('notifTitle').value.trim();
    const message = document.getElementById('notifMessage').value.trim();
    const target = document.getElementById('notifTarget').value;
    const type = document.getElementById('notifType').value;
    const link = document.getElementById('notifLink').value.trim();
    const specificUser = document.getElementById('notifSpecificUser').value.trim();

    const responseEl = document.getElementById('notifResponse');
    responseEl.style.display = 'none';

    if (!title || !message) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال عنوان ورسالة الإشعار';
        return;
    }

    let users = [];
    let targetLabel = 'جميع المستخدمين';

    try {
        if (target === 'all') {
            const { data, error } = await supabaseClient
                .from('users')
                .select('id');
            if (error) throw error;
            users = data.map(u => u.id);
            targetLabel = 'جميع المستخدمين';
        } else if (target === 'active') {
            const { data, error } = await supabaseClient
                .from('users')
                .select('id')
                .eq('is_active', true);
            if (error) throw error;
            users = data.map(u => u.id);
            targetLabel = 'المستخدمين النشطين';
        } else if (target === 'specific') {
            if (!specificUser) {
                responseEl.style.display = 'block';
                responseEl.className = 'admin-response error';
                responseEl.textContent = '⚠️ يرجى إدخال اسم المستخدم';
                return;
            }
            const { data, error } = await supabaseClient
                .from('users')
                .select('id')
                .ilike('username', specificUser);
            if (error) throw error;
            users = data.map(u => u.id);
            targetLabel = `المستخدم: ${specificUser}`;
        }

        if (users.length === 0) {
            responseEl.style.display = 'block';
            responseEl.className = 'admin-response error';
            responseEl.textContent = '❌ لا يوجد مستخدمين مستهدفين';
            return;
        }

        const notifications = users.map(userId => ({
            user_id: userId,
            title: title,
            message: message,
            type: type,
            link: link || null,
            is_read: false
        }));

        const { data, error } = await supabaseClient
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;

        await addLog(adminUser?.id, 'notification', `إرسال إشعار "${title}" لـ ${users.length} مستخدم`, {
            title: title,
            target: targetLabel,
            count: users.length
        });

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إرسال الإشعار بنجاح لـ ${users.length} مستخدم!`;

        document.getElementById('addNotificationForm').reset();
        document.getElementById('notifSpecificUserGroup').style.display = 'none';
        loadNotificationsTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadNotificationsTable() {
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const tbody = document.getElementById('notificationsTableBody');
        if (!tbody) return;

        if (!notifications || notifications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">لا توجد إشعارات</td></tr>';
            return;
        }

        const typeNames = {
            'system': '⚙️ نظام',
            'promotion': '🎯 ترويجي',
            'update': '🔄 تحديث',
            'warning': '⚠️ تنبيه'
        };

        tbody.innerHTML = notifications.map((notif, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${notif.title}</td>
                <td>${typeNames[notif.type] || notif.type}</td>
                <td>${notif.is_read ? '✅ مقروء' : '🔴 غير مقروء'}</td>
                <td style="font-size: 12px; color: var(--text-muted);">${new Date(notif.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                    <span class="badge badge-success">✅ مرسل</span>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteNotification('${notif.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل الإشعارات:', error);
        const tbody = document.getElementById('notificationsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل الإشعارات</td></tr>';
        }
    }
}

window.refreshNotifications = function() {
    loadNotificationsTable();
};

window.deleteNotification = async function(notifId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الإشعار؟')) return;

    try {
        const { error } = await supabaseClient
            .from('notifications')
            .delete()
            .eq('id', notifId);

        if (error) throw error;

        alert('✅ تم حذف الإشعار بنجاح!');
        loadNotificationsTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

// ==========================================================
// ===== دوال الأسعار =====
// ==========================================================

function getPricesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-dollar-sign"></i> إدارة الأسعار
        </h2>

        <div class="admin-form">
            <h4>💰 تعديل الأسعار الافتراضية</h4>
            <form id="pricesForm" onsubmit="updatePrices(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>🎬 فيديو 15 ثانية</label>
                        <input type="number" id="price_video_15s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🎬 فيديو 30 ثانية</label>
                        <input type="number" id="price_video_30s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🎬 فيديو 60 ثانية</label>
                        <input type="number" id="price_video_60s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🎬 فيديو 120 ثانية</label>
                        <input type="number" id="price_video_120s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🌐 زيارة 15 ثانية</label>
                        <input type="number" id="price_visit_15s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🌐 زيارة 30 ثانية</label>
                        <input type="number" id="price_visit_30s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🌐 زيارة 60 ثانية</label>
                        <input type="number" id="price_visit_60s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>🌐 زيارة 120 ثانية</label>
                        <input type="number" id="price_visit_120s" class="form-control" step="0.0001" />
                    </div>
                    <div class="form-group">
                        <label>👥 مكافأة الإحالة</label>
                        <input type="number" id="price_referral" class="form-control" step="0.001" />
                    </div>
                    <div class="form-group">
                        <label>💰 الحد الأدنى للسحب</label>
                        <input type="number" id="price_min_withdraw" class="form-control" step="0.5" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ التغييرات
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="pricesResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>
    `;
}

// ===== دوال الأسعار =====

async function loadPrices() {
    try {
        const { data: settings, error } = await supabaseClient
            .from('settings')
            .select('setting_key, setting_value')
            .in('setting_key', [
                'video_15s_reward', 'video_30s_reward', 'video_60s_reward', 'video_120s_reward',
                'visit_15s_reward', 'visit_30s_reward', 'visit_60s_reward', 'visit_120s_reward',
                'referral_reward', 'min_withdrawal'
            ]);

        if (error) throw error;

        const prices = {};
        settings.forEach(s => {
            prices[s.setting_key] = s.setting_value;
        });

        const mappings = {
            'video_15s_reward': 'price_video_15s',
            'video_30s_reward': 'price_video_30s',
            'video_60s_reward': 'price_video_60s',
            'video_120s_reward': 'price_video_120s',
            'visit_15s_reward': 'price_visit_15s',
            'visit_30s_reward': 'price_visit_30s',
            'visit_60s_reward': 'price_visit_60s',
            'visit_120s_reward': 'price_visit_120s',
            'referral_reward': 'price_referral',
            'min_withdrawal': 'price_min_withdraw'
        };

        Object.keys(mappings).forEach(key => {
            const el = document.getElementById(mappings[key]);
            if (el && prices[key] !== undefined) {
                el.value = prices[key];
            }
        });

    } catch (error) {
        console.error('❌ خطأ في تحميل الأسعار:', error);
    }
}

window.updatePrices = async function(e) {
    e.preventDefault();

    const responseEl = document.getElementById('pricesResponse');
    responseEl.style.display = 'none';

    const mappings = {
        'price_video_15s': 'video_15s_reward',
        'price_video_30s': 'video_30s_reward',
        'price_video_60s': 'video_60s_reward',
        'price_video_120s': 'video_120s_reward',
        'price_visit_15s': 'visit_15s_reward',
        'price_visit_30s': 'visit_30s_reward',
        'price_visit_60s': 'visit_60s_reward',
        'price_visit_120s': 'visit_120s_reward',
        'price_referral': 'referral_reward',
        'price_min_withdraw': 'min_withdrawal'
    };

    const updates = [];

    Object.keys(mappings).forEach(inputId => {
        const el = document.getElementById(inputId);
        if (el) {
            const key = mappings[inputId];
            const value = parseFloat(el.value);
            if (!isNaN(value) && value >= 0) {
                updates.push({ setting_key: key, setting_value: value.toString() });
            }
        }
    });

    if (updates.length === 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ لم يتم إدخال أي أسعار صحيحة';
        return;
    }

    try {
        for (const update of updates) {
            const { error } = await supabaseClient
                .from('settings')
                .update({ setting_value: update.setting_value })
                .eq('setting_key', update.setting_key);

            if (error) throw error;
        }

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم تحديث ${updates.length} سعر بنجاح!`;

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

// ==========================================================
// ===== دوال Smart Links =====
// ==========================================================

function getSmartLinksHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-link"></i> إدارة Smart Links
        </h2>

        <div class="admin-form">
            <h4>🔗 إضافة Smart Link جديد</h4>
            <form id="addSmartLinkForm" onsubmit="addNewSmartLink(event)">
                <div class="form-row">
                    <div class="form-group full-width">
                        <label>📌 عنوان الرابط</label>
                        <input type="text" id="smartLinkTitle" class="form-control" placeholder="مثال: عرض حصري" required />
                    </div>
                    <div class="form-group full-width">
                        <label>🔗 رابط الوجهة</label>
                        <input type="url" id="smartLinkUrl" class="form-control" placeholder="https://example.com" required />
                    </div>
                    <div class="form-group">
                        <label>💰 المكافأة ($)</label>
                        <input type="number" id="smartLinkReward" class="form-control" placeholder="مثال: 0.005" step="0.001" required />
                    </div>
                    <div class="form-group">
                        <label>📊 الحد الأقصى للنقرات</label>
                        <input type="number" id="smartLinkMax" class="form-control" placeholder="مثال: 1000" value="0" />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 وصف الرابط</label>
                        <textarea id="smartLinkDescription" class="form-control" rows="2" placeholder="وصف الرابط"></textarea>
                    </div>
                    <div class="form-group">
                        <label>✅ الحالة</label>
                        <select id="smartLinkStatus" class="form-control">
                            <option value="true">🟢 نشط</option>
                            <option value="false">🔴 غير نشط</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ الرابط
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="smartLinkResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🔗 قائمة Smart Links</h4>
                <button class="btn btn-success btn-sm" onclick="refreshSmartLinks()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>الرابط</th>
                            <th>المكافأة</th>
                            <th>النقرات</th>
                            <th>الحد</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="smartLinksTableBody">
                        <tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال Smart Links =====

window.addNewSmartLink = async function(e) {
    e.preventDefault();

    const title = document.getElementById('smartLinkTitle').value.trim();
    const url = document.getElementById('smartLinkUrl').value.trim();
    const reward = parseFloat(document.getElementById('smartLinkReward').value);
    const maxRedirects = parseInt(document.getElementById('smartLinkMax').value) || 0;
    const description = document.getElementById('smartLinkDescription').value.trim();
    const isActive = document.getElementById('smartLinkStatus').value === 'true';

    const responseEl = document.getElementById('smartLinkResponse');
    responseEl.style.display = 'none';

    if (!title || !url || !reward || reward <= 0) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال عنوان ورابط ومكافأة صحيحة';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('smart_links')
            .insert([{
                title: title,
                link_url: url,
                reward: reward,
                max_redirects: maxRedirects || 0,
                description: description || null,
                is_active: isActive
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إضافة Smart Link "${title}" بنجاح!`;

        document.getElementById('addSmartLinkForm').reset();
        loadSmartLinksTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadSmartLinksTable() {
    try {
        const { data: links, error } = await supabaseClient
            .from('smart_links')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('smartLinksTableBody');
        if (!tbody) return;

        if (!links || links.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">لا توجد روابط ذكية</td></tr>';
            return;
        }

        tbody.innerHTML = links.map((link, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${link.title}</td>
                <td><a href="${link.link_url}" target="_blank" style="color: var(--secondary); font-size: 12px;">${link.link_url.substring(0, 30)}...</a></td>
                <td style="color: var(--secondary); font-weight: 700;">$${parseFloat(link.reward).toFixed(3)}</td>
                <td>${link.redirect_count || 0}</td>
                <td>${link.max_redirects || '∞'}</td>
                <td>
                    <span class="badge ${link.is_active ? 'badge-success' : 'badge-danger'}">
                        ${link.is_active ? '✅ نشط' : '❌ غير نشط'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editSmartLink('${link.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSmartLink('${link.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل Smart Links:', error);
        const tbody = document.getElementById('smartLinksTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل Smart Links</td></tr>';
        }
    }
}

window.refreshSmartLinks = function() {
    loadSmartLinksTable();
};

window.deleteSmartLink = async function(linkId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
        const { error } = await supabaseClient
            .from('smart_links')
            .delete()
            .eq('id', linkId);

        if (error) throw error;

        alert('✅ تم حذف الرابط بنجاح!');
        loadSmartLinksTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editSmartLink = function(linkId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال اللغات =====
// ==========================================================

function getLanguagesHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-language"></i> إدارة اللغات
        </h2>

        <div class="admin-form">
            <h4>🌍 إضافة لغة جديدة</h4>
            <form id="addLanguageForm" onsubmit="addNewLanguage(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>📝 اسم اللغة</label>
                        <input type="text" id="langName" class="form-control" placeholder="مثال: English" required />
                    </div>
                    <div class="form-group">
                        <label>🔤 رمز اللغة</label>
                        <input type="text" id="langCode" class="form-control" placeholder="مثال: en" required />
                    </div>
                    <div class="form-group">
                        <label>✅ اللغة الافتراضية</label>
                        <select id="langDefault" class="form-control">
                            <option value="false">لا</option>
                            <option value="true">نعم</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>📋 ملف الترجمة (JSON)</label>
                        <textarea id="langTranslations" class="form-control" rows="5" placeholder='{"welcome": "Welcome to RewardHub", "earn": "Earn Money"}'></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ اللغة
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="langResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🌍 اللغات المدعومة</h4>
                <button class="btn btn-success btn-sm" onclick="refreshLanguages()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اللغة</th>
                            <th>الرمز</th>
                            <th>الافتراضية</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="languagesTableBody">
                        <tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال اللغات =====

window.addNewLanguage = async function(e) {
    e.preventDefault();

    const name = document.getElementById('langName').value.trim();
    const code = document.getElementById('langCode').value.trim();
    const isDefault = document.getElementById('langDefault').value === 'true';
    let translations = document.getElementById('langTranslations').value.trim();

    const responseEl = document.getElementById('langResponse');
    responseEl.style.display = 'none';

    if (!name || !code) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى إدخال اسم اللغة ورمزها';
        return;
    }

    // محاولة تحويل الـ JSON
    let translationsObj = {};
    if (translations) {
        try {
            translationsObj = JSON.parse(translations);
        } catch (e) {
            responseEl.style.display = 'block';
            responseEl.className = 'admin-response error';
            responseEl.textContent = '⚠️ ملف الترجمة غير صحيح (JSON غير صالح)';
            return;
        }
    }

    try {
        // إذا كانت اللغة افتراضية، نغير اللغات الأخرى
        if (isDefault) {
            await supabaseClient
                .from('languages')
                .update({ is_default: false })
                .eq('is_default', true);
        }

        const { data, error } = await supabaseClient
            .from('languages')
            .insert([{
                name: name,
                code: code,
                is_default: isDefault,
                is_active: true,
                translations: translationsObj
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إضافة اللغة "${name}" بنجاح!`;

        document.getElementById('addLanguageForm').reset();
        loadLanguagesTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadLanguagesTable() {
    try {
        const { data: languages, error } = await supabaseClient
            .from('languages')
            .select('*')
            .order('is_default', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('languagesTableBody');
        if (!tbody) return;

        if (!languages || languages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">لا توجد لغات</td></tr>';
            return;
        }

        tbody.innerHTML = languages.map((lang, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${lang.name}</td>
                <td><code style="background: var(--dark-input); padding: 2px 8px; border-radius: 4px;">${lang.code}</code></td>
                <td>${lang.is_default ? '⭐ نعم' : 'لا'}</td>
                <td>
                    <span class="badge ${lang.is_active ? 'badge-success' : 'badge-danger'}">
                        ${lang.is_active ? '✅ نشطة' : '❌ غير نشطة'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editLanguage('${lang.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLanguage('${lang.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل اللغات:', error);
        const tbody = document.getElementById('languagesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل اللغات</td></tr>';
        }
    }
}

window.refreshLanguages = function() {
    loadLanguagesTable();
};

window.deleteLanguage = async function(langId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه اللغة؟')) return;

    try {
        const { error } = await supabaseClient
            .from('languages')
            .delete()
            .eq('id', langId);

        if (error) throw error;

        alert('✅ تم حذف اللغة بنجاح!');
        loadLanguagesTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editLanguage = function(langId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال المعلنون =====
// ==========================================================

function getAdvertisersHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-bullhorn"></i> إدارة المعلنين
        </h2>

        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>📢 قائمة المعلنين</h4>
                <button class="btn btn-primary btn-sm" onclick="alert('سيتم إضافة ميزة إضافة معلن قريباً')">
                    <i class="fas fa-user-plus"></i> إضافة معلن
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المعلن</th>
                            <th>البريد الإلكتروني</th>
                            <th>عدد الحملات</th>
                            <th>الميزانية</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="advertisersTableBody">
                        <tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال المعلنون =====

async function loadAdvertisersTable() {
    try {
        const { data: advertisers, error } = await supabaseClient
            .from('users')
            .select('id, username, email, balance, is_active, created_at')
            .eq('is_advertiser', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('advertisersTableBody');
        if (!tbody) return;

        if (!advertisers || advertisers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">لا يوجد معلنين</td></tr>';
            return;
        }

        // جلب عدد الحملات لكل معلن
        const campaignsCount = {};
        for (const adv of advertisers) {
            const { count, error: countError } = await supabaseClient
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('advertiser_id', adv.id);
            if (!countError) {
                campaignsCount[adv.id] = count || 0;
            }
        }

        tbody.innerHTML = advertisers.map((adv, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${adv.username || 'معلن'}</td>
                <td>${adv.email}</td>
                <td>${campaignsCount[adv.id] || 0}</td>
                <td>$${parseFloat(adv.balance || 0).toFixed(2)}</td>
                <td>
                    <span class="badge ${adv.is_active ? 'badge-success' : 'badge-danger'}">
                        ${adv.is_active ? '✅ نشط' : '❌ موقوف'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل المعلنين:', error);
        const tbody = document.getElementById('advertisersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل المعلنين</td></tr>';
        }
    }
}

// ==========================================================
// ===== دوال الحملات =====
// ==========================================================

function getCampaignsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-rocket"></i> إدارة الحملات الإعلانية
        </h2>

        <div class="admin-form">
            <h4>🚀 إنشاء حملة جديدة</h4>
            <form id="addCampaignForm" onsubmit="addNewCampaign(event)">
                <div class="form-row">
                    <div class="form-group full-width">
                        <label>📌 عنوان الحملة</label>
                        <input type="text" id="campaignTitle" class="form-control" placeholder="مثال: حملة التسويق الرقمي" required />
                    </div>
                    <div class="form-group">
                        <label>📂 نوع المهمة</label>
                        <select id="campaignTaskType" class="form-control">
                            <option value="video">🎬 فيديو</option>
                            <option value="visit">🌐 زيارة</option>
                            <option value="survey">📊 استبيان</option>
                            <option value="social">📱 اجتماعي</option>
                            <option value="smartlink">🔗 Smart Link</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>💰 الميزانية ($)</label>
                        <input type="number" id="campaignBudget" class="form-control" placeholder="مثال: 100" step="0.01" required />
                    </div>
                    <div class="form-group">
                        <label>💵 المكافأة لكل مهمة ($)</label>
                        <input type="number" id="campaignReward" class="form-control" placeholder="مثال: 0.10" step="0.01" required />
                    </div>
                    <div class="form-group">
                        <label>📊 عدد المهام</label>
                        <input type="number" id="campaignTasks" class="form-control" placeholder="مثال: 100" required />
                    </div>
                    <div class="form-group">
                        <label>📅 تاريخ البدء</label>
                        <input type="date" id="campaignStart" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>📅 تاريخ الانتهاء</label>
                        <input type="date" id="campaignEnd" class="form-control" />
                    </div>
                    <div class="form-group full-width">
                        <label>🔗 رابط الحملة</label>
                        <input type="url" id="campaignUrl" class="form-control" placeholder="https://example.com" />
                    </div>
                    <div class="form-group full-width">
                        <label>📝 وصف الحملة</label>
                        <textarea id="campaignDescription" class="form-control" rows="3" placeholder="وصف الحملة"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> إنشاء الحملة
                    </button>
                    <button type="reset" class="btn btn-secondary">إلغاء</button>
                </div>
                <div id="campaignResponse" style="display: none; margin-top: 12px;"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📊 الحملات النشطة</h4>
                <button class="btn btn-success btn-sm" onclick="refreshCampaigns()">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>المعلن</th>
                            <th>الميزانية</th>
                            <th>المصروف</th>
                            <th>المهام</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="campaignsTableBody">
                        <tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== دوال الحملات =====

window.addNewCampaign = async function(e) {
    e.preventDefault();

    const title = document.getElementById('campaignTitle').value.trim();
    const taskType = document.getElementById('campaignTaskType').value;
    const budget = parseFloat(document.getElementById('campaignBudget').value);
    const reward = parseFloat(document.getElementById('campaignReward').value);
    const totalTasks = parseInt(document.getElementById('campaignTasks').value);
    const startDate = document.getElementById('campaignStart').value;
    const endDate = document.getElementById('campaignEnd').value;
    const url = document.getElementById('campaignUrl').value.trim();
    const description = document.getElementById('campaignDescription').value.trim();

    const responseEl = document.getElementById('campaignResponse');
    responseEl.style.display = 'none';

    if (!title || !budget || !reward || !totalTasks) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '⚠️ يرجى ملء جميع الحقول المطلوبة';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('campaigns')
            .insert([{
                title: title,
                task_type: taskType,
                budget: budget,
                reward_per_task: reward,
                total_tasks: totalTasks,
                start_date: startDate || null,
                end_date: endDate || null,
                target_url: url || null,
                description: description || null,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        responseEl.style.display = 'block';
        responseEl.className = 'admin-response success';
        responseEl.textContent = `✅ تم إنشاء الحملة "${title}" بنجاح!`;

        document.getElementById('addCampaignForm').reset();
        loadCampaignsTable();

        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);

    } catch (error) {
        responseEl.style.display = 'block';
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + error.message;
    }
};

async function loadCampaignsTable() {
    try {
        const { data: campaigns, error } = await supabaseClient
            .from('campaigns')
            .select('*, users(username)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('campaignsTableBody');
        if (!tbody) return;

        if (!campaigns || campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">لا توجد حملات</td></tr>';
            return;
        }

        tbody.innerHTML = campaigns.map((campaign, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${campaign.title}</td>
                <td>${campaign.users?.username || 'غير محدد'}</td>
                <td>$${parseFloat(campaign.budget || 0).toFixed(2)}</td>
                <td>$${parseFloat(campaign.spent || 0).toFixed(2)}</td>
                <td>${campaign.completed_tasks || 0}/${campaign.total_tasks || 0}</td>
                <td>
                    <span class="badge ${campaign.status === 'active' ? 'badge-success' : campaign.status === 'paused' ? 'badge-warning' : 'badge-secondary'}">
                        ${campaign.status === 'active' ? '✅ نشطة' : campaign.status === 'paused' ? '⏸️ موقفة' : '🔴 منتهية'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="editCampaign('${campaign.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCampaign('${campaign.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل الحملات:', error);
        const tbody = document.getElementById('campaignsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger);">❌ خطأ في تحميل الحملات</td></tr>';
        }
    }
}

window.refreshCampaigns = function() {
    loadCampaignsTable();
};

window.deleteCampaign = async function(campaignId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الحملة؟')) return;

    try {
        const { error } = await supabaseClient
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) throw error;

        alert('✅ تم حذف الحملة بنجاح!');
        loadCampaignsTable();

    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.editCampaign = function(campaignId) {
    alert('🔧 سيتم إضافة ميزة التعديل قريباً');
};

// ==========================================================
// ===== دوال السجلات والمحفظة =====
// ==========================================================

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

        const { count: gamesCount } = await supabaseClient
            .from('games')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        const gamesEl = document.getElementById('statsGames');
        if (gamesEl) gamesEl.textContent = gamesCount || 0;

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

// ==========================================================
// ===== دوال الأقسام الفارغة =====
// ==========================================================

function getOffersHTML() { return `<h2 class="section-title">📢 Offerwalls</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getSurveysHTML() { return `<h2 class="section-title">📊 الاستبيانات</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getFaucetsHTML() { return `<h2 class="section-title">💰 الصنابير</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getAIHTML() { return `<h2 class="section-title">🤖 الذكاء الاصطناعي</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getAntiFraudHTML() { return `<h2 class="section-title">🛡️ مكافحة الغش</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getAPIsHTML() { return `<h2 class="section-title">🔌 APIs</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }
function getBackupHTML() { return `<h2 class="section-title">💾 النسخ الاحتياطي</h2><p style="color: var(--text-secondary);">سيتم إضافة هذه الميزة قريباً...</p>`; }

function getLogsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-history"></i> سجل العمليات
        </h2>
        <div class="admin-table-wrapper">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>المستخدم</th>
                            <th>الحدث</th>
                            <th>التفاصيل</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">جاري التحميل...</td></tr>
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
                <div class="stat-number" id="walletTotal" style="-webkit-text-fill-color: white;">$0.00</div>
                <div class="stat-label">إجمالي المحفظة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📤</div>
                <div class="stat-number" id="walletWithdrawn" style="color: var(--danger);">$0.00</div>
                <div class="stat-label">إجمالي السحوبات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📥</div>
                <div class="stat-number" id="walletDeposited" style="color: var(--success);">$0.00</div>
                <div class="stat-label">إجمالي الإيداعات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🏦</div>
                <div class="stat-number" id="walletBalance" style="color: var(--secondary);">$0.00</div>
                <div class="stat-label">الرصيد المتاح</div>
            </div>
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

async function loadAdRequests() {
    try {
        const { data: requests, error } = await supabaseClient
            .from('ad_requests')
            .select('*, users(username, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('adRequestsTableBody');
        if (!tbody) return;

        if (!requests || requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">لا توجد طلبات إعلان</td></tr>';
            return;
        }

        const typeNames = {
            website: '🌐 موقع',
            social: '📱 تواصل اجتماعي',
            premium: '⭐ إعلان مميز'
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
                <td><span class="badge badge-warning">⏳ قيد المراجعة</span></td>
                <td>
                    <button class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في تحميل طلبات الإعلان:', error);
    }
}

// ==========================================================
// ===== دوال مساعدة إضافية =====
// ==========================================================

async function addLog(userId, eventType, description, details = null) {
    try {
        const { error } = await supabaseClient
            .from('logs')
            .insert([{
                user_id: userId,
                event_type: eventType,
                event_description: description,
                details: details,
                ip_address: await getIPAddress()
            }]);

        if (error) console.error('❌ خطأ في إضافة السجل:', error);
    } catch (e) {
        console.error('❌ خطأ:', e);
    }
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return 'unknown';
    }
}

// ==========================================================
// ===== عند تحميل الصفحة =====
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin page loaded - بدأ التحميل');
    checkAdminSession();
    
    setTimeout(() => {
        loadPrizesForVouchers();
    }, 1000);
});

console.log('✅ Admin.js تم تحميله بنجاح!');
