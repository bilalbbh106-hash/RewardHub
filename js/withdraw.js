// ==========================================================
// RewardHub - نظام السحب (withdraw.js)
// ==========================================================

// ===== عرض صفحة السحب =====
async function getWithdrawHTML() {
    if (!currentUser) return '<p>يرجى تسجيل الدخول</p>';

    try {
        // جلب الإعدادات
        const settingsResult = await getWithdrawSettings();
        const settings = settingsResult.success ? settingsResult.data : {};
        
        const minWithdraw = parseFloat(settings.min_withdraw || 2);
        const maxWithdraw = parseFloat(settings.max_withdraw || 1000);
        const withdrawFee = parseFloat(settings.withdraw_fee || 0.5);
        const methods = settings.withdraw_methods ? JSON.parse(settings.withdraw_methods) : ['USDT', 'FaucetPay', 'GiftCard'];

        // جلب سجل السحوبات
        const historyResult = await getWithdrawalHistory(currentUser.id);
        const history = historyResult.success ? historyResult.data : [];

        // جلب بيانات المستخدم
        const profileResult = await getUserProfile(currentUser.id);
        const profile = profileResult.success ? profileResult.data : null;
        const balance = profile?.balance || 0;

        return `
            <h2 style="font-size: 24px; margin-bottom: 20px;">
                <i class="fas fa-money-bill-wave"></i> سحب الأرباح
            </h2>

            <!-- ===== معلومات الرصيد ===== -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="card text-center" style="border-left: 4px solid var(--secondary);">
                    <div style="font-size: 32px; font-weight: 700; color: var(--secondary);">$${balance.toFixed(2)}</div>
                    <div style="color: var(--text-secondary);">الرصيد المتاح</div>
                </div>
                <div class="card text-center" style="border-left: 4px solid var(--warning);">
                    <div style="font-size: 32px; font-weight: 700; color: var(--warning);">$${minWithdraw.toFixed(2)}</div>
                    <div style="color: var(--text-secondary);">الحد الأدنى للسحب</div>
                </div>
                <div class="card text-center" style="border-left: 4px solid var(--danger);">
                    <div style="font-size: 32px; font-weight: 700; color: var(--danger);">${withdrawFee}%</div>
                    <div style="color: var(--text-secondary);">رسوم السحب</div>
                </div>
            </div>

            <!-- ===== نموذج السحب ===== -->
            <div class="withdraw-form">
                <h4>💳 طلب سحب جديد</h4>
                <form id="withdrawForm" onsubmit="submitWithdrawReal(event)">
                    <div class="form-group">
                        <label>💰 المبلغ ($)</label>
                        <input type="number" id="withdrawAmountReal" class="form-control" 
                               min="${minWithdraw}" max="${balance}" 
                               step="0.01" placeholder="أدخل المبلغ" required />
                        <small style="color: var(--text-muted);">
                            الحد الأدنى: $${minWithdraw} | الحد الأقصى: $${Math.min(maxWithdraw, balance).toFixed(2)}
                        </small>
                    </div>

                    <div class="form-group">
                        <label>🏦 طريقة السحب</label>
                        <select id="withdrawMethodReal" class="form-control" required>
                            <option value="">اختر طريقة السحب</option>
                            ${methods.map(m => `
                                <option value="${m}">${m}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>📤 عنوان المحفظة</label>
                        <input type="text" id="withdrawAddressReal" class="form-control" 
                               placeholder="أدخل عنوان المحفظة" required />
                        <small style="color: var(--text-muted);">
                            تأكد من صحة العنوان لتجنب فقدان الأموال
                        </small>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">
                            <i class="fas fa-paper-plane"></i> طلب السحب
                        </button>
                        <button type="reset" class="btn btn-secondary">إلغاء</button>
                    </div>

                    <div id="withdrawResponse" style="display: none; margin-top: 12px;"></div>
                </form>
            </div>

            <!-- ===== سجل السحوبات ===== -->
            <div style="margin-top: 30px;">
                <h4>📋 سجل السحوبات</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>المبلغ</th>
                                <th>الطريقة</th>
                                <th>العنوان</th>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.length > 0 ? history.map(w => `
                                <tr>
                                    <td style="color: var(--secondary); font-weight: 700;">$${parseFloat(w.amount).toFixed(2)}</td>
                                    <td>${w.method}</td>
                                    <td style="font-size: 12px; word-break: break-all;">${w.wallet_address || '-'}</td>
                                    <td>${new Date(w.created_at).toLocaleDateString('ar-EG')}</td>
                                    <td>
                                        <span class="badge ${w.status === 'approved' ? 'badge-success' : w.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
                                            ${w.status === 'approved' ? '✅ مكتمل' : w.status === 'pending' ? '⏳ معلق' : '❌ مرفوض'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">لا توجد سحوبات</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ خطأ:', error);
        return '<p style="color: var(--danger);">حدث خطأ في تحميل صفحة السحب</p>';
    }
}

// ===== تقديم طلب سحب حقيقي =====
async function submitWithdrawReal(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const amount = parseFloat(document.getElementById('withdrawAmountReal').value);
    const method = document.getElementById('withdrawMethodReal').value;
    const address = document.getElementById('withdrawAddressReal').value.trim();
    const responseEl = document.getElementById('withdrawResponse');

    responseEl.style.display = 'none';

    // التحقق من المدخلات
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

    // تأكيد المستخدم
    if (!confirm(`هل أنت متأكد من طلب سحب $${amount.toFixed(2)} عبر ${method}؟`)) {
        return;
    }

    // إظهار رسالة انتظار
    responseEl.style.display = 'block';
    responseEl.className = 'admin-response info';
    responseEl.textContent = '⏳ جاري معالجة طلبك...';

    // تنفيذ السحب
    const result = await requestWithdrawalReal(currentUser.id, amount, method, address);

    if (result.success) {
        responseEl.className = 'admin-response success';
        responseEl.innerHTML = `
            ✅ تم تقديم طلب السحب بنجاح!
            <br>
            <small style="color: var(--text-secondary);">
                المبلغ: $${amount.toFixed(2)} | 
                الرسوم: $${result.fee?.toFixed(2) || '0.00'} | 
                المبلغ النهائي: $${result.final_amount?.toFixed(2) || amount.toFixed(2)}
                <br>
                سيتم معالجة طلبك خلال 24-48 ساعة
            </small>
        `;

        // تحديث الرصيد
        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
        }

        // تحديث الصفحة بعد 3 ثواني
        setTimeout(() => {
            loadSection('withdraw');
        }, 3000);

    } else {
        responseEl.className = 'admin-response error';
        responseEl.textContent = '❌ ' + result.error;
    }
}

// ===== تصدير الدوال =====
window.getWithdrawHTML = getWithdrawHTML;
window.submitWithdrawReal = submitWithdrawReal;
