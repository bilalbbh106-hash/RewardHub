// ==========================================================
// RewardHub - Admin.js (إحصائيات حقيقية)
// ==========================================================

// ===== تحميل إحصائيات حقيقية =====
async function loadRealAdminStats() {
    try {
        // 1. عدد المستخدمين
        const { count: usersCount, error: usersError } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (!usersError) {
            document.getElementById('statsUsers').textContent = usersCount || 0;
        }

        // 2. إجمالي الأرباح
        const { data: earningsData, error: earningsError } = await supabaseClient
            .from('users')
            .select('total_earned');

        if (!earningsError && earningsData) {
            const totalEarnings = earningsData.reduce((sum, u) => sum + (u.total_earned || 0), 0);
            document.getElementById('statsEarnings').textContent = '$' + totalEarnings.toFixed(2);
        }

        // 3. إجمالي السحوبات
        const { data: withdrawalsData, error: withdrawalsError } = await supabaseClient
            .from('withdrawals')
            .select('amount')
            .eq('status', 'processed');

        if (!withdrawalsError && withdrawalsData) {
            const totalWithdrawals = withdrawalsData.reduce((sum, w) => sum + (w.amount || 0), 0);
            document.getElementById('statsWithdrawals').textContent = '$' + totalWithdrawals.toFixed(2);
        }

        // 4. المهام المنجزة
        const { count: tasksCount, error: tasksError } = await supabaseClient
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        if (!tasksError) {
            document.getElementById('statsTasks').textContent = tasksCount || 0;
        }

        // 5. السحوبات المعلقة
        const { count: pendingCount, error: pendingError } = await supabaseClient
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (!pendingError) {
            document.getElementById('statsPending').textContent = pendingCount || 0;
            document.getElementById('pendingWithdrawals').textContent = pendingCount || 0;
        }

        // 6. طلبات الإعلان المعلقة
        const { count: adRequestsCount, error: adError } = await supabaseClient
            .from('ad_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (!adError) {
            document.getElementById('pendingAdsCount').textContent = adRequestsCount || 0;
        }

        // 7. آخر السحوبات
        const { data: recentWithdrawals, error: recentError } = await supabaseClient
            .from('withdrawals')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!recentError && recentWithdrawals) {
            const recentEl = document.getElementById('recentWithdrawals');
            if (recentEl) {
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
        }

    } catch (e) {
        console.error('❌ خطأ في تحميل الإحصائيات:', e);
    }
}

// ===== تحميل قائمة المستخدمين =====
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

// ===== تحميل قائمة السحوبات =====
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

// ===== قبول سحب =====
async function approveWithdrawal(withdrawalId) {
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
        loadRealAdminStats();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
}

// ===== رفض سحب =====
async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('❌ سبب الرفض (اختياري):');
    if (reason === null) return;

    try {
        // إعادة المبلغ للمستخدم
        const { data: withdrawal, error: getError } = await supabaseClient
            .from('withdrawals')
            .select('user_id, amount')
            .eq('id', withdrawalId)
            .single();

        if (getError) throw getError;

        // تحديث حالة السحب
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
        loadRealAdminStats();
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
}

// ===== تحديث دوال التحميل =====
// أضف في دالة loadSectionContent:
case 'users':
    content.innerHTML = getUsersHTML();
    setTimeout(loadUsersTable, 300);
    break;

case 'withdrawals':
    content.innerHTML = getWithdrawalsHTML();
    setTimeout(loadWithdrawalsTable, 300);
    break;

// ===== تحديث دالة loadDashboardStats =====
async function loadDashboardStats() {
    await loadRealAdminStats();
}

// ===== تصدير الدوال الجديدة =====
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.loadRealAdminStats = loadRealAdminStats;
window.loadUsersTable = loadUsersTable;
window.loadWithdrawalsTable = loadWithdrawalsTable;
