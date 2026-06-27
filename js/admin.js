// ==========================================================
// RewardHub - Admin.js
// ==========================================================

// ===== كلمة المرور الصحيحة =====
const ADMIN_PASSWORD = '2009bb2009';

// ===== عناصر الصفحة =====
const loginScreen = document.getElementById('adminLoginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');
const adminPasswordInput = document.getElementById('adminPassword');
const logoutBtn = document.getElementById('adminLogoutBtn');
const currentDateEl = document.getElementById('currentDate');

// ===== تحقق من حالة الجلسة =====
function checkAdminSession() {
    const session = sessionStorage.getItem('adminLoggedIn');
    if (session === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

// ===== عرض شاشة الدخول =====
function showLogin() {
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

// ===== عرض لوحة الإدارة =====
function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'flex';
    loadDashboardStats();
    displayCurrentDate();
}

// ===== تسجيل الدخول =====
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const password = adminPasswordInput.value.trim();

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        loginError.style.display = 'none';
        showDashboard();
        adminPasswordInput.value = '';
    } else {
        loginError.style.display = 'block';
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
    }
});

// ===== تسجيل الخروج =====
logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('adminLoggedIn');
    showLogin();
});

// ===== إظهار التاريخ الحالي =====
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

// ===== التنقل بين الأقسام =====
document.querySelectorAll('.admin-nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        // إزالة الـ active من الكل
        document.querySelectorAll('.admin-nav-item').forEach(function(nav) {
            nav.classList.remove('active');
        });
        this.classList.add('active');

        // إخفاء كل الأقسام
        document.querySelectorAll('.admin-section').forEach(function(section) {
            section.style.display = 'none';
        });

        // إظهار القسم المختار
        const sectionId = this.getAttribute('data-section');
        const targetSection = document.getElementById('section' + 
            sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
        );

        if (targetSection) {
            targetSection.style.display = 'block';
            // تحميل محتوى القسم
            loadSectionContent(sectionId);
        }
    });
});

// ===== تحميل محتوى الأقسام =====
function loadSectionContent(section) {
    const content = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (!content) return;

    switch(section) {
        case 'dashboard':
            content.innerHTML = getDashboardHTML();
            break;
        case 'users':
            content.innerHTML = getUsersHTML();
            break;
        case 'withdrawals':
            content.innerHTML = getWithdrawalsHTML();
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
        default:
            content.innerHTML = '<p>جاري التحميل...</p>';
    }
}

// ===== تحميل إحصائيات لوحة التحكم =====
function loadDashboardStats() {
    // في التطبيق الحقيقي، هذه البيانات تجلب من API
    document.getElementById('usersCount').textContent = '1,247';
    document.getElementById('pendingWithdrawals').textContent = '23';

    // تحميل لوحة التحكم تلقائياً
    const dashboardSection = document.getElementById('sectionDashboard');
    if (dashboardSection) {
        dashboardSection.innerHTML = getDashboardHTML();
    }
}

// ===== HTML الخاص بلوحة التحكم =====
function getDashboardHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-chart-pie"></i> لوحة التحكم
        </h2>

        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number">1,247</div>
                <div class="stat-label">إجمالي المستخدمين</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number">$284,530</div>
                <div class="stat-label">إجمالي الأرباح</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🏦</div>
                <div class="stat-number">$192,100</div>
                <div class="stat-label">إجمالي السحوبات</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-number">58,432</div>
                <div class="stat-label">المهام المنجزة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-number" style="color: var(--warning);">23</div>
                <div class="stat-label">سحوبات معلقة</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-number" style="color: var(--secondary);">12</div>
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
                        <tbody>
                            <tr>
                                <td>Ahmed_Gamer</td>
                                <td>$25.00</td>
                                <td><span class="badge badge-warning">معلق</span></td>
                            </tr>
                            <tr>
                                <td>Crypto_Warrior</td>
                                <td>$50.00</td>
                                <td><span class="badge badge-success">مكتمل</span></td>
                            </tr>
                            <tr>
                                <td>FreeFire_King</td>
                                <td>$10.00</td>
                                <td><span class="badge badge-success">مكتمل</span></td>
                            </tr>
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

// ===== HTML الخاص بالمستخدمين =====
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
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>⭐ Ahmed_Gamer</td>
                            <td>ahmed@email.com</td>
                            <td>$125.50</td>
                            <td><span class="badge badge-success">نشط</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>⭐ Crypto_Warrior</td>
                            <td>crypto@email.com</td>
                            <td>$340.00</td>
                            <td><span class="badge badge-success">نشط</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>⭐ FreeFire_King</td>
                            <td>king@email.com</td>
                            <td>$87.20</td>
                            <td><span class="badge badge-warning">موقوف</span></td>
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

// ===== HTML الخاص بالسحوبات =====
function getWithdrawalsHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-money-bill-wave"></i> إدارة السحوبات
        </h2>

        <div class="admin-table-wrapper">
            <div class="table-header">
                <h4>💸 طلبات السحب</h4>
                <div>
                    <span class="badge badge-warning">23 معلق</span>
                    <span class="badge badge-success">45 مكتمل</span>
                    <span class="badge badge-danger">12 مرفوض</span>
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
                    <tbody>
                        <tr>
                            <td>Ahmed_Gamer</td>
                            <td>$25.00</td>
                            <td>USDT</td>
                            <td>2026-06-27</td>
                            <td><span class="badge badge-warning">معلق</span></td>
                            <td>
                                <button class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>Crypto_Warrior</td>
                            <td>$50.00</td>
                            <td>FaucetPay</td>
                            <td>2026-06-26</td>
                            <td><span class="badge badge-success">مكتمل</span></td>
                            <td>
                                <button class="btn btn-success btn-sm" disabled><i class="fas fa-check"></i></button>
                                <button class="btn btn-danger btn-sm" disabled><i class="fas fa-times"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>FreeFire_King</td>
                            <td>$10.00</td>
                            <td>Google Play</td>
                            <td>2026-06-25</td>
                            <td><span class="badge badge-danger">مرفوض</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-eye"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بالجوائز =====
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
                <div class="admin-response" id="prizeResponse"></div>
            </form>
        </div>

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🎁 قائمة الجوائز</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الجائزة</th>
                            <th>الفئة</th>
                            <th>السعر</th>
                            <th>المخزون</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>🎮 Google Play $25</td>
                            <td>بطاقة هدايا</td>
                            <td>$25.00</td>
                            <td>50</td>
                            <td><span class="badge badge-success">متاح</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>🔥 Free Fire Diamonds</td>
                            <td>قسيمة لعبة</td>
                            <td>$10.00</td>
                            <td>30</td>
                            <td><span class="badge badge-success">متاح</span></td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>💎 Blood Strike Gold</td>
                            <td>قسيمة لعبة</td>
                            <td>$5.00</td>
                            <td>0</td>
                            <td><span class="badge badge-danger">نفد</span></td>
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

// ===== HTML الخاص بالألعاب =====
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

// ===== HTML الخاص بالقسائم =====
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

// ===== HTML الخاص بالمهام =====
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

// ===== HTML الخاص بـ Offerwalls =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📊 Offerwalls النشطة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الشركة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>CPX Research</td><td><span class="badge badge-success">نشط</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-toggle-off"></i></button></td></tr>
                        <tr><td>AdGate Media</td><td><span class="badge badge-success">نشط</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-toggle-off"></i></button></td></tr>
                        <tr><td>AdGem</td><td><span class="badge badge-warning">قيد التفعيل</span></td><td><button class="btn btn-success btn-sm"><i class="fas fa-toggle-on"></i></button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بالاستبيانات =====
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

// ===== HTML الخاص بالصنابير (Faucets) =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>🪙 الصنابير المتاحة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الصنبور</th>
                            <th>العملة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>FaucetPay BTC</td><td>BTC</td><td><span class="badge badge-success">نشط</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                        <tr><td>Free USDT Faucet</td><td>USDT</td><td><span class="badge badge-success">نشط</span></td><td><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بـ Smart Links =====
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

// ===== HTML الخاص بالمعلنين =====
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

// ===== HTML الخاص بالحملات =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📊 الحملات النشطة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الحملة</th>
                            <th>المعلن</th>
                            <th>الميزانية</th>
                            <th>المصروف</th>
                            <th>المهام</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>حملة التسويق</td>
                            <td>شركة التسويق</td>
                            <td>$1,000</td>
                            <td>$450</td>
                            <td>45/100</td>
                            <td><span class="badge badge-success">نشطة</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بالأسعار =====
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

// ===== HTML الخاص باللغات =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📚 اللغات المدعومة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>اللغة</th>
                            <th>الرمز</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>العربية</td><td>ar</td><td><span class="badge badge-success">نشطة</span></td><td><button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button></td></tr>
                        <tr><td>English</td><td>en</td><td><span class="badge badge-success">نشطة</span></td><td><button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button></td></tr>
                        <tr><td>Français</td><td>fr</td><td><span class="badge badge-warning">قيد الإضافة</span></td><td><button class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بالإشعارات =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📋 سجل الإشعارات المرسلة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>التاريخ</th>
                            <th>المستهدفين</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>تحديث جديد</td>
                            <td>2026-06-27</td>
                            <td>جميع المستخدمين</td>
                            <td><span class="badge badge-success">مرسل</span></td>
                        </tr>
                        <tr>
                            <td>عرض حصري</td>
                            <td>2026-06-26</td>
                            <td>النشطين فقط</td>
                            <td><span class="badge badge-success">مرسل</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بالذكاء الاصطناعي =====
function getAIHTML() {
    return `
        <h2 class="section-title" style="text-align: right; font-size: 28px; margin-bottom: 24px;">
            <i class="fas fa-robot"></i> إدارة الذكاء الاصطناعي
        </h2>

        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-number">12</div>
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
                <div class="stat-number">1,847</div>
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📸 المهام قيد المراجعة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>المهمة</th>
                            <th>نسبة الثقة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Ahmed_Gamer</td>
                            <td>مشاهدة فيديو</td>
                            <td>87%</td>
                            <td><span class="badge badge-warning">مراجعة</span></td>
                            <td>
                                <button class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>New_User</td>
                            <td>زيارة موقع</td>
                            <td>45%</td>
                            <td><span class="badge badge-danger">مشكوك فيها</span></td>
                            <td>
                                <button class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-times"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بمكافحة الغش =====
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
                <div class="stat-number" style="color: var(--warning);">3</div>
                <div class="stat-label">تنبيهات أمنية</div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🌐</div>
                <div class="stat-number" style="color: var(--secondary);">12</div>
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

// ===== HTML الخاص بالـ APIs =====
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

// ===== HTML الخاص بالنسخ الاحتياطي =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📂 النسخ الاحتياطية السابقة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>اسم الملف</th>
                            <th>الحجم</th>
                            <th>التاريخ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>backup_2026-06-27.sql</td>
                            <td>2.4 MB</td>
                            <td>2026-06-27</td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-download"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>backup_2026-06-26.sql</td>
                            <td>2.3 MB</td>
                            <td>2026-06-26</td>
                            <td>
                                <button class="btn btn-info btn-sm"><i class="fas fa-download"></i></button>
                                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بسجل العمليات =====
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
                            <td>2026-06-27 14:32:15</td>
                            <td>Ahmed_Gamer</td>
                            <td><span class="badge badge-success">تسجيل دخول</span></td>
                            <td>تسجيل دخول ناجح</td>
                            <td>192.168.1.1</td>
                        </tr>
                        <tr>
                            <td>2026-06-27 14:28:42</td>
                            <td>Crypto_Warrior</td>
                            <td><span class="badge badge-info">مهمة</span></td>
                            <td>أكمل مهمة فيديو 30 ثانية</td>
                            <td>192.168.1.2</td>
                        </tr>
                        <tr>
                            <td>2026-06-27 14:15:03</td>
                            <td>FreeFire_King</td>
                            <td><span class="badge badge-warning">سحب</span></td>
                            <td>طلب سحب $25.00</td>
                            <td>192.168.1.3</td>
                        </tr>
                        <tr>
                            <td>2026-06-27 13:55:18</td>
                            <td>New_User</td>
                            <td><span class="badge badge-danger">محاولة غش</span></td>
                            <td>كشف VPN أثناء المهمة</td>
                            <td>10.0.0.1</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== HTML الخاص بمحفظة الأدمن =====
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

        <div class="admin-table-wrapper" style="margin-top: 20px;">
            <div class="table-header">
                <h4>📊 سجل المحفظة</h4>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>المستخدم</th>
                            <th>العملية</th>
                            <th>المبلغ</th>
                            <th>الرصيد الجديد</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2026-06-27 14:30:00</td>
                            <td>Ahmed_Gamer</td>
                            <td><span class="badge badge-success">إيداع</span></td>
                            <td>+$5.00</td>
                            <td>$130.50</td>
                        </tr>
                        <tr>
                            <td>2026-06-27 12:15:00</td>
                            <td>Crypto_Warrior</td>
                            <td><span class="badge badge-danger">سحب</span></td>
                            <td>-$50.00</td>
                            <td>$290.00</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();

    // منع الخروج من الصفحة بدون تسجيل خروج (اختياري)
    window.addEventListener('beforeunload', function(e) {
        // لا نفعل شيئاً
    });
});

// ===== منع النقر بزر الماوس الأيمن (حماية إضافية) =====
document.addEventListener('contextmenu', function(e) {
    if (document.getElementById('adminDashboard').style.display === 'flex') {
        // نسمح أو نمنع حسب الرغبة
        // e.preventDefault();
    }
});
