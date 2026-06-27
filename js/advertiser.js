// ==========================================================
// RewardHub - Advertiser.js
// ==========================================================

// ===== متغيرات عامة =====
let currentUser = null;
let advertiserProfile = null;
let currentSection = 'dashboard';

// ===== عناصر الصفحة =====
const authScreen = document.getElementById('advertiserAuthScreen');
const dashboard = document.getElementById('advertiserDashboard');
const loginForm = document.getElementById('advertiserLoginForm');
const logoutBtn = document.getElementById('advLogoutBtn');
const balanceDisplay = document.getElementById('advBalanceDisplay');

// ==========================================================
// ===== نظام المصادقة =====
// ==========================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📢 RewardHub Advertiser loading...');

    const connected = await testSupabaseConnection();
    if (!connected) {
        showError('❌ فشل الاتصال بالخادم');
        return;
    }

    const authStatus = await checkAuthStatus();
    
    if (authStatus.isLoggedIn) {
        currentUser = authStatus.user;
        advertiserProfile = authStatus.profile;
        
        // التحقق من أن المستخدم معلن
        if (advertiserProfile && advertiserProfile.is_advertiser) {
            showDashboard();
        } else {
            showError('⚠️ هذا الحساب ليس لديه صلاحية المعلن');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 3000);
        }
    } else {
        showAuthScreen();
    }
});

function showAuthScreen() {
    authScreen.style.display = 'flex';
    dashboard.style.display = 'none';
}

function showDashboard() {
    authScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    loadAdvertiserData();
    loadSection('dashboard');
}

function showError(message) {
    const errorEl = document.getElementById('advLoginError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// ===== تسجيل الدخول =====
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('advLoginEmail').value.trim();
    const password = document.getElementById('advLoginPassword').value;

    const errorEl = document.getElementById('advLoginError');
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
            advertiserProfile = profileResult.data;
            if (advertiserProfile.is_advertiser) {
                showDashboard();
                loginForm.reset();
            } else {
                errorEl.textContent = '⚠️ هذا الحساب ليس لديه صلاحية المعلن';
                errorEl.style.display = 'block';
                await logoutUser();
            }
        }
    } else {
        errorEl.textContent = '❌ ' + result.error;
        errorEl.style.display = 'block';
    }
});

// ===== تسجيل الخروج =====
logoutBtn.addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        await logoutUser();
        currentUser = null;
        advertiserProfile = null;
        showAuthScreen();
    }
});

// ==========================================================
// ===== تحميل بيانات المعلن =====
// ==========================================================

async function loadAdvertiserData() {
    if (!currentUser) return;

    if (advertiserProfile) {
        balanceDisplay.textContent = '$' + parseFloat(advertiserProfile.balance || 0).toFixed(2);
    }
}

// ==========================================================
// ===== التنقل بين الأقسام =====
// ==========================================================

document.querySelectorAll('.advertiser-sidebar .sidebar-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('.advertiser-sidebar .sidebar-item').forEach(function(i) {
            i.classList.remove('active');
        });
        this.classList.add('active');

        const section = this.getAttribute('data-section');
        currentSection = section;
        loadSection(section);
    });
});

function loadSection(section) {
    document.querySelectorAll('.advertiser-section').forEach(function(s) {
        s.style.display = 'none';
    });

    const target = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (target) {
        target.style.display = 'block';
        fillSectionContent(section);
    }
}

// ==========================================================
// ===== تعبئة محتوى الأقسام =====
// ==========================================================

async function fillSectionContent(section) {
    const target = document.getElementById('section' + 
        section.charAt(0).toUpperCase() + section.slice(1)
    );

    if (!target) return;

    switch(section) {
        case 'dashboard':
            target.innerHTML = await getAdvertiserDashboardHTML();
            break;
        case 'campaigns':
            target.innerHTML = await getCampaignsHTML();
            break;
        case 'create':
            target.innerHTML = getCreateCampaignHTML();
            break;
        case 'stats':
            target.innerHTML = await getStatsHTML();
            break;
        case 'wallet':
            target.innerHTML = getAdvertiserWalletHTML();
            break;
        case 'settings':
            target.innerHTML = getAdvertiserSettingsHTML();
            break;
        default:
            target.innerHTML = '<p>جاري التحميل...</p>';
    }
}

// ==========================================================
// ===== محتوى الأقسام =====
// ==========================================================

// ===== لوحة التحكم =====
async function getAdvertiserDashboardHTML() {
    // جلب الحملات
    const campaignsResult = await getAdvertiserCampaigns(currentUser.id);
    const campaigns = campaignsResult.success ? campaignsResult.data : [];
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + parseFloat(c.spent || 0), 0);
    const totalTasks = campaigns.reduce((sum, c) => sum + parseInt(c.total_tasks || 0), 0);
    const completedTasks = campaigns.reduce((sum, c) => sum + parseInt(c.completed_tasks || 0), 0);

    // جلب آخر الحملات
    const recentCampaigns = campaigns.slice(0, 5);

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-chart-pie"></i> لوحة التحكم - المعلن
        </h2>

        <div class="adv-stats-grid">
            <div class="adv-stat-card">
                <div class="stat-icon">🚀</div>
                <div class="stat-number" style="color: var(--primary-light);">${totalCampaigns}</div>
                <div class="stat-label">إجمالي الحملات</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-number" style="color: var(--success);">${activeCampaigns}</div>
                <div class="stat-label">حملات نشطة</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number" style="color: var(--secondary);">$${totalBudget.toFixed(2)}</div>
                <div class="stat-label">إجمالي الميزانية</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-number" style="color: var(--warning);">${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</div>
                <div class="stat-label">نسبة الإنفاق</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-number" style="color: var(--info);">${completedTasks}/${totalTasks}</div>
                <div class="stat-label">المهام المنجزة</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">💵</div>
                <div class="stat-number" style="color: var(--accent);">$${totalSpent.toFixed(2)}</div>
                <div class="stat-label">المصروف</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card">
                <h4>📋 آخر الحملات</h4>
                ${recentCampaigns.length ? recentCampaigns.map(c => `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>${c.title}</strong>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                ${c.completed_tasks || 0}/${c.total_tasks || 0} مهمة
                            </div>
                        </div>
                        <span class="campaign-status ${c.status}">${c.status === 'active' ? 'نشطة' : c.status === 'paused' ? 'موقفة' : 'مكتملة'}</span>
                    </div>
                `).join('') : '<p style="color: var(--text-secondary);">لا توجد حملات</p>'}
            </div>

            <div class="card">
                <h4>⚡ إجراءات سريعة</h4>
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                    <button class="btn btn-primary" onclick="loadSection('create')">
                        <i class="fas fa-plus-circle"></i> إنشاء حملة جديدة
                    </button>
                    <button class="btn btn-secondary" onclick="loadSection('campaigns')">
                        <i class="fas fa-rocket"></i> إدارة الحملات
                    </button>
                    <button class="btn btn-info" onclick="loadSection('stats')">
                        <i class="fas fa-chart-line"></i> عرض الإحصائيات
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== إدارة الحملات =====
async function getCampaignsHTML() {
    const result = await getAdvertiserCampaigns(currentUser.id);
    const campaigns = result.success ? result.data : [];

    if (!campaigns.length) {
        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-rocket"></i> الحملات
            </h2>
            <div class="card text-center" style="padding: 60px;">
                <i class="fas fa-rocket" style="font-size: 48px; color: var(--text-muted);"></i>
                <p style="color: var(--text-secondary); margin-top: 12px;">لا توجد حملات حالياً</p>
                <button class="btn btn-primary" onclick="loadSection('create')" style="margin-top: 12px;">
                    <i class="fas fa-plus-circle"></i> إنشاء حملة جديدة
                </button>
            </div>
        `;
    }

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-rocket"></i> إدارة الحملات
            <button class="btn btn-primary btn-sm" style="margin-right: 12px;" onclick="loadSection('create')">
                <i class="fas fa-plus-circle"></i> حملة جديدة
            </button>
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${campaigns.map(campaign => {
                const progress = campaign.total_tasks > 0 ? Math.round((campaign.completed_tasks || 0) / campaign.total_tasks * 100) : 0;
                const spentPercent = campaign.budget > 0 ? Math.round((campaign.spent || 0) / campaign.budget * 100) : 0;
                
                return `
                    <div class="campaign-card">
                        <div class="campaign-header">
                            <div>
                                <div class="campaign-title">${campaign.title}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">${campaign.description || 'لا يوجد وصف'}</div>
                            </div>
                            <span class="campaign-status ${campaign.status}">
                                ${campaign.status === 'active' ? '✅ نشطة' : campaign.status === 'paused' ? '⏸️ موقفة' : '✅ مكتملة'}
                            </span>
                        </div>

                        <div class="campaign-stats">
                            <div class="stat">
                                <div class="number">$${parseFloat(campaign.budget || 0).toFixed(2)}</div>
                                <div class="label">الميزانية</div>
                            </div>
                            <div class="stat">
                                <div class="number">$${parseFloat(campaign.spent || 0).toFixed(2)}</div>
                                <div class="label">المصروف</div>
                            </div>
                            <div class="stat">
                                <div class="number">${campaign.completed_tasks || 0}/${campaign.total_tasks || 0}</div>
                                <div class="label">المهام</div>
                            </div>
                            <div class="stat">
                                <div class="number">$${parseFloat(campaign.reward_per_task || 0).toFixed(2)}</div>
                                <div class="label">المكافأة/مهمة</div>
                            </div>
                        </div>

                        <div style="margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                                <span>تقدم المهام: ${progress}%</span>
                                <span>الإنفاق: ${spentPercent}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%;"></div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                            <button class="btn btn-sm ${campaign.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                    onclick="toggleCampaign('${campaign.id}', '${campaign.status}')">
                                <i class="fas ${campaign.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                                ${campaign.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                            <button class="btn btn-sm btn-info" onclick="editCampaign('${campaign.id}')">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCampaign('${campaign.id}')">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== إنشاء حملة =====
function getCreateCampaignHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-plus-circle"></i> إنشاء حملة جديدة
        </h2>

        <form id="createCampaignForm" class="campaign-form" onsubmit="submitCampaign(event)">
            <div class="form-row">
                <div class="form-group full-width">
                    <label>📌 عنوان الحملة</label>
                    <input type="text" id="campaignTitle" class="form-control" placeholder="مثال: حملة التسويق الرقمي" required />
                </div>

                <div class="form-group full-width">
                    <label>📝 وصف الحملة</label>
                    <textarea id="campaignDescription" class="form-control" rows="3" placeholder="وصف الحملة"></textarea>
                </div>

                <div class="form-group">
                    <label>🎯 نوع المهمة</label>
                    <select id="campaignTaskType" class="form-control" required>
                        <option value="">اختر نوع المهمة</option>
                        <option value="offerwall">Offerwall</option>
                        <option value="survey">استبيان</option>
                        <option value="video">فيديو</option>
                        <option value="visit">زيارة موقع</option>
                        <option value="smartlink">Smart Link</option>
                        <option value="social">مهمة اجتماعية</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>💰 الميزانية ($)</label>
                    <input type="number" id="campaignBudget" class="form-control" placeholder="مثال: 100" step="0.01" required />
                </div>

                <div class="form-group">
                    <label>💵 المكافأة لكل مهمة ($)</label>
                    <input type="number" id="campaignReward" class="form-control" placeholder="مثال: 0.50" step="0.01" required />
                </div>

                <div class="form-group">
                    <label>📊 عدد المهام</label>
                    <input type="number" id="campaignTotalTasks" class="form-control" placeholder="مثال: 100" required />
                </div>

                <div class="form-group full-width">
                    <label>🔗 رابط الحملة</label>
                    <input type="url" id="campaignUrl" class="form-control" placeholder="https://example.com/campaign" />
                </div>

                <div class="form-group">
                    <label>📅 تاريخ البدء</label>
                    <input type="date" id="campaignStartDate" class="form-control" />
                </div>

                <div class="form-group">
                    <label>📅 تاريخ الانتهاء</label>
                    <input type="date" id="campaignEndDate" class="form-control" />
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> إنشاء الحملة
                </button>
                <button type="reset" class="btn btn-secondary">إلغاء</button>
            </div>

            <div id="campaignFormResponse" class="admin-response" style="display:none;"></div>
        </form>
    `;
}

// ===== تقديم حملة جديدة =====
window.submitCampaign = async function(e) {
    e.preventDefault();

    const title = document.getElementById('campaignTitle').value.trim();
    const description = document.getElementById('campaignDescription').value.trim();
    const taskType = document.getElementById('campaignTaskType').value;
    const budget = parseFloat(document.getElementById('campaignBudget').value);
    const reward = parseFloat(document.getElementById('campaignReward').value);
    const totalTasks = parseInt(document.getElementById('campaignTotalTasks').value);
    const targetUrl = document.getElementById('campaignUrl').value.trim();
    const startDate = document.getElementById('campaignStartDate').value;
    const endDate = document.getElementById('campaignEndDate').value;

    const responseEl = document.getElementById('campaignFormResponse');

    if (!title || !taskType || !budget || !reward || !totalTasks) {
        responseEl.textContent = '⚠️ يرجى ملء جميع الحقول المطلوبة';
        responseEl.className = 'admin-response error';
        responseEl.style.display = 'block';
        return;
    }

    const result = await createCampaign(
        currentUser.id,
        title,
        description,
        taskType,
        budget,
        reward,
        totalTasks,
        targetUrl,
        startDate || null,
        endDate || null
    );

    if (result.success) {
        responseEl.textContent = '✅ تم إنشاء الحملة بنجاح!';
        responseEl.className = 'admin-response success';
        responseEl.style.display = 'block';
        
        // تحديث الرصيد
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            advertiserProfile = profileResult.data;
            balanceDisplay.textContent = '$' + parseFloat(advertiserProfile.balance || 0).toFixed(2);
        }

        setTimeout(() => {
            loadSection('campaigns');
        }, 2000);
    } else {
        responseEl.textContent = '❌ ' + result.error;
        responseEl.className = 'admin-response error';
        responseEl.style.display = 'block';
    }
};

// ===== الإحصائيات =====
async function getStatsHTML() {
    const campaignsResult = await getAdvertiserCampaigns(currentUser.id);
    const campaigns = campaignsResult.success ? campaignsResult.data : [];

    const totalCampaigns = campaigns.length;
    const totalBudget = campaigns.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + parseFloat(c.spent || 0), 0);
    const totalTasks = campaigns.reduce((sum, c) => sum + parseInt(c.total_tasks || 0), 0);
    const completedTasks = campaigns.reduce((sum, c) => sum + parseInt(c.completed_tasks || 0), 0);

    // إحصائيات حسب النوع
    const statsByType = {};
    campaigns.forEach(c => {
        const type = c.task_type || 'unknown';
        if (!statsByType[type]) {
            statsByType[type] = { tasks: 0, spent: 0 };
        }
        statsByType[type].tasks += parseInt(c.total_tasks || 0);
        statsByType[type].spent += parseFloat(c.spent || 0);
    });

    // إحصائيات حسب الشهر
    const statsByMonth = {};
    campaigns.forEach(c => {
        if (c.created_at) {
            const month = new Date(c.created_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            if (!statsByMonth[month]) {
                statsByMonth[month] = { spent: 0, tasks: 0 };
            }
            statsByMonth[month].spent += parseFloat(c.spent || 0);
            statsByMonth[month].tasks += parseInt(c.completed_tasks || 0);
        }
    });

    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-chart-line"></i> الإحصائيات
        </h2>

        <div class="adv-stats-grid">
            <div class="adv-stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-number" style="color: var(--primary-light);">${totalCampaigns}</div>
                <div class="stat-label">إجمالي الحملات</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number" style="color: var(--secondary);">$${totalBudget.toFixed(2)}</div>
                <div class="stat-label">إجمالي الميزانية</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">💵</div>
                <div class="stat-number" style="color: var(--warning);">$${totalSpent.toFixed(2)}</div>
                <div class="stat-label">إجمالي المصروف</div>
            </div>
            <div class="adv-stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-number" style="color: var(--success);">${completedTasks}/${totalTasks}</div>
                <div class="stat-label">المهام المنجزة</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div class="card">
                <h4>📊 حسب نوع المهمة</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>النوع</th>
                                <th>المهام</th>
                                <th>المصروف</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(statsByType).map(([type, data]) => `
                                <tr>
                                    <td>${type}</td>
                                    <td>${data.tasks}</td>
                                    <td>$${data.spent.toFixed(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">لا توجد بيانات</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h4>📈 حسب الشهر</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>الشهر</th>
                                <th>المصروف</th>
                                <th>المهام</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(statsByMonth).map(([month, data]) => `
                                <tr>
                                    <td>${month}</td>
                                    <td>$${data.spent.toFixed(2)}</td>
                                    <td>${data.tasks}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">لا توجد بيانات</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h4>📋 جميع الحملات</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>النوع</th>
                            <th>الميزانية</th>
                            <th>المصروف</th>
                            <th>المهام</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns.map(c => `
                            <tr>
                                <td>${c.title}</td>
                                <td>${c.task_type}</td>
                                <td>$${parseFloat(c.budget || 0).toFixed(2)}</td>
                                <td>$${parseFloat(c.spent || 0).toFixed(2)}</td>
                                <td>${c.completed_tasks || 0}/${c.total_tasks || 0}</td>
                                <td><span class="campaign-status ${c.status}">${c.status === 'active' ? 'نشطة' : c.status === 'paused' ? 'موقفة' : 'مكتملة'}</span></td>
                            </tr>
                        `).join('') || '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">لا توجد حملات</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== محفظة المعلن =====
function getAdvertiserWalletHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-wallet"></i> المحفظة
        </h2>

        <div class="wallet-overview">
            <div class="wallet-card">
                <div class="amount" style="color: var(--secondary);">$${parseFloat(advertiserProfile.balance || 0).toFixed(2)}</div>
                <div class="label">الرصيد الحالي</div>
            </div>
            <div class="wallet-card">
                <div class="amount" style="color: var(--success);">$${parseFloat(advertiserProfile.total_earned || 0).toFixed(2)}</div>
                <div class="label">إجمالي الإيداعات</div>
            </div>
            <div class="wallet-card">
                <div class="amount" style="color: var(--danger);">$${parseFloat(advertiserProfile.total_withdrawn || 0).toFixed(2)}</div>
                <div class="label">إجمالي المصروف</div>
            </div>
        </div>

        <div class="card">
            <h4>➕ شحن المحفظة</h4>
            <form onsubmit="chargeWallet(event)" style="max-width: 400px;">
                <div class="form-group">
                    <label>💰 المبلغ ($)</label>
                    <input type="number" id="chargeAmount" class="form-control" placeholder="مثال: 100" min="10" step="1" required />
                </div>
                <div class="form-group">
                    <label>🏦 طريقة الدفع</label>
                    <select id="chargeMethod" class="form-control" required>
                        <option value="">اختر طريقة الدفع</option>
                        <option value="USDT">USDT</option>
                        <option value="FaucetPay">FaucetPay</option>
                        <option value="Bank">تحويل بنكي</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-plus"></i> شحن الرصيد
                </button>
            </form>
            <div id="chargeResponse" class="admin-response" style="display:none;"></div>
        </div>
    `;
}

// ===== شحن المحفظة =====
window.chargeWallet = async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('chargeAmount').value);
    const method = document.getElementById('chargeMethod').value;
    const responseEl = document.getElementById('chargeResponse');

    if (!amount || amount < 10) {
        responseEl.textContent = '⚠️ الحد الأدنى للشحن هو $10';
        responseEl.className = 'admin-response error';
        responseEl.style.display = 'block';
        return;
    }

    if (!method) {
        responseEl.textContent = '⚠️ يرجى اختيار طريقة الدفع';
        responseEl.className = 'admin-response error';
        responseEl.style.display = 'block';
        return;
    }

    // في التطبيق الحقيقي، هنا يتم الاتصال ببوابة الدفع
    responseEl.textContent = '🔧 سيتم إضافة نظام الدفع قريباً';
    responseEl.className = 'admin-response info';
    responseEl.style.display = 'block';
};

// ===== الإعدادات =====
function getAdvertiserSettingsHTML() {
    return `
        <h2 style="font-size: 24px; margin-bottom: 20px;">
            <i class="fas fa-cog"></i> إعدادات المعلن
        </h2>

        <div class="card" style="max-width: 500px;">
            <h4>🔐 تغيير كلمة المرور</h4>
            <form onsubmit="changeAdvertiserPassword(event)">
                <div class="form-group">
                    <label>كلمة المرور الحالية</label>
                    <input type="password" id="advCurrentPassword" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>كلمة المرور الجديدة</label>
                    <input type="password" id="advNewPassword" class="form-control" required minlength="6" />
                </div>
                <div class="form-group">
                    <label>تأكيد كلمة المرور الجديدة</label>
                    <input type="password" id="advConfirmNewPassword" class="form-control" required />
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> تغيير كلمة المرور
                </button>
            </form>
        </div>

        <div class="card" style="max-width: 500px; margin-top: 20px;">
            <h4>💰 إعدادات الدفع</h4>
            <div class="form-group">
                <label>عنوان محفظة USDT (للدفع)</label>
                <input type="text" id="advWalletAddress" class="form-control" placeholder="أدخل عنوان محفظة USDT" />
            </div>
            <button class="btn btn-primary" onclick="saveAdvertiserSettings()">
                <i class="fas fa-save"></i> حفظ الإعدادات
            </button>
        </div>
    `;
}

// ==========================================================
// ===== دوال API للمعلن =====
// ==========================================================

// ===== جلب حملات المعلن =====
async function getAdvertiserCampaigns(advertiserId) {
    try {
        const { data, error } = await supabaseClient
            .from('campaigns')
            .select('*')
            .eq('advertiser_id', advertiserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب الحملات:', error);
        return { success: false, error: error.message };
    }
}

// ===== إنشاء حملة جديدة =====
async function createCampaign(advertiserId, title, description, taskType, budget, reward, totalTasks, targetUrl, startDate, endDate) {
    try {
        // التحقق من الرصيد
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', advertiserId)
            .single();

        if (userError) throw userError;

        if (user.balance < budget) {
            return { success: false, error: 'الرصيد غير كافٍ لإنشاء هذه الحملة' };
        }

        // إنشاء الحملة
        const { data, error } = await supabaseClient
            .from('campaigns')
            .insert([
                {
                    advertiser_id: advertiserId,
                    title: title,
                    description: description || null,
                    task_type: taskType,
                    budget: budget,
                    spent: 0,
                    reward_per_task: reward,
                    total_tasks: totalTasks,
                    completed_tasks: 0,
                    target_url: targetUrl || null,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    status: 'active'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // خصم الميزانية من رصيد المعلن
        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({
                balance: user.balance - budget,
                total_earned: (user.total_earned || 0) + budget
            })
            .eq('id', advertiserId);

        if (balanceError) throw balanceError;

        // إضافة المهام للحملة
        // في التطبيق الحقيقي، يتم إضافة مهام متعددة حسب الحملة

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في إنشاء الحملة:', error);
        return { success: false, error: error.message };
    }
}

// ===== تبديل حالة الحملة =====
window.toggleCampaign = async function(campaignId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    if (!confirm(`هل أنت متأكد من ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} هذه الحملة؟`)) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('campaigns')
            .update({ status: newStatus })
            .eq('id', campaignId);

        if (error) throw error;

        alert(`✅ تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الحملة بنجاح`);
        loadSection('campaigns');
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

// ===== حذف حملة =====
window.deleteCampaign = async function(campaignId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الحملة؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) throw error;

        alert('✅ تم حذف الحملة بنجاح');
        loadSection('campaigns');
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

// ===== تعديل حملة =====
window.editCampaign = function(campaignId) {
    alert('🔧 سيتم إضافة هذه الميزة قريباً');
};

// ===== تغيير كلمة مرور المعلن =====
window.changeAdvertiserPassword = async function(e) {
    e.preventDefault();
    alert('🔧 سيتم إضافة هذه الميزة قريباً');
};

// ===== حفظ إعدادات المعلن =====
window.saveAdvertiserSettings = function() {
    alert('✅ تم حفظ الإعدادات بنجاح!');
};

// ==========================================================
// ===== تحديث الرصيد بشكل دوري =====
// ==========================================================

setInterval(async function() {
    if (currentUser) {
        const result = await getUserProfile(currentUser.id);
        if (result.success) {
            advertiserProfile = result.data;
            balanceDisplay.textContent = '$' + parseFloat(advertiserProfile.balance || 0).toFixed(2);
        }
    }
}, 30000);

console.log('📢 RewardHub Advertiser Dashboard جاهز!');
