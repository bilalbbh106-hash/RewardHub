// ==========================================================
// RewardHub - دوال قاعدة البيانات (إضافات جديدة)
// ==========================================================

// ===== جلب إعدادات السحب =====
async function getWithdrawSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('withdraw_settings')
            .select('*');

        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.setting_key] = item.setting_value;
        });
        
        return { success: true, data: settings };
    } catch (error) {
        console.error('❌ خطأ في جلب إعدادات السحب:', error);
        return { success: false, error: error.message };
    }
}

// ===== طلب سحب جديد =====
async function requestWithdrawalReal(userId, amount, method, walletAddress) {
    try {
        // 1. جلب إعدادات السحب
        const settingsResult = await getWithdrawSettings();
        if (!settingsResult.success) throw new Error('فشل في جلب الإعدادات');
        
        const settings = settingsResult.data;
        const minWithdraw = parseFloat(settings.min_withdraw || 2);
        const maxWithdraw = parseFloat(settings.max_withdraw || 1000);
        const withdrawFee = parseFloat(settings.withdraw_fee || 0.5);

        // 2. التحقق من المبلغ
        if (amount < minWithdraw) {
            return { success: false, error: `الحد الأدنى للسحب هو $${minWithdraw}` };
        }
        if (amount > maxWithdraw) {
            return { success: false, error: `الحد الأقصى للسحب هو $${maxWithdraw}` };
        }

        // 3. التحقق من الرصيد
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance, daily_withdraw_limit, withdraw_count_today, last_withdraw_date')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (user.balance < amount) {
            return { success: false, error: 'الرصيد غير كافٍ' };
        }

        // 4. التحقق من الحد اليومي
        const today = new Date().toDateString();
        const lastDate = user.last_withdraw_date ? new Date(user.last_withdraw_date).toDateString() : '';
        
        let countToday = user.withdraw_count_today || 0;
        if (lastDate !== today) {
            countToday = 0;
        }

        // حساب المبلغ بعد الرسوم
        const feeAmount = (amount * withdrawFee) / 100;
        const finalAmount = amount - feeAmount;

        // 5. إنشاء طلب السحب
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([
                {
                    user_id: userId,
                    amount: amount,
                    method: method,
                    wallet_address: walletAddress,
                    status: 'pending',
                    admin_notes: `رسوم السحب: $${feeAmount.toFixed(2)}`
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 6. تحديث رصيد المستخدم (خصم المبلغ مؤقتاً)
        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({
                balance: user.balance - amount,
                withdraw_count_today: countToday + 1,
                last_withdraw_date: new Date().toISOString()
            })
            .eq('id', userId);

        if (balanceError) throw balanceError;

        // 7. تسجيل في سجل السحوبات
        await supabaseClient
            .from('withdrawal_history')
            .insert([
                {
                    user_id: userId,
                    amount: amount,
                    method: method,
                    wallet_address: walletAddress,
                    status: 'pending'
                }
            ]);

        // 8. إرسال إشعار
        await sendNotification(
            userId,
            '💰 طلب سحب جديد',
            `تم تقديم طلب سحب بقيمة $${amount.toFixed(2)} عبر ${method}`,
            'withdrawal'
        );

        // 9. تسجيل النشاط
        await logUserActivity(userId, 'withdrawal_request', {
            amount: amount,
            method: method,
            fee: feeAmount,
            final_amount: finalAmount
        });

        return { 
            success: true, 
            data: data,
            fee: feeAmount,
            final_amount: finalAmount
        };

    } catch (error) {
        console.error('❌ خطأ في طلب السحب:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب سجل السحوبات =====
async function getWithdrawalHistory(userId, limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from('withdrawal_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب سجل السحوبات:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب سجل الإيداعات =====
async function getDepositHistory(userId, limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from('deposit_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب سجل الإيداعات:', error);
        return { success: false, error: error.message };
    }
}

// ===== إرسال إشعار =====
async function sendNotification(userId, title, message, type = 'system') {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .insert([
                {
                    user_id: userId,
                    title: title,
                    message: message,
                    type: type,
                    is_read: false
                }
            ]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في إرسال الإشعار:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب إحصائيات المستخدم =====
async function getUserStats(userId) {
    try {
        // جلب عدد المهام المنجزة
        const { count: tasksCount, error: tasksError } = await supabaseClient
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        if (tasksError) throw tasksError;

        // جلب عدد الإحالات
        const { count: referralsCount, error: referralsError } = await supabaseClient
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId);

        if (referralsError) throw referralsError;

        // جلب آخر نشاط
        const { data: lastActivity, error: activityError } = await supabaseClient
            .from('user_activities')
            .select('created_at, activity_type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (activityError) throw activityError;

        // جلب عدد السحوبات
        const { count: withdrawalsCount, error: withdrawalsError } = await supabaseClient
            .from('withdrawal_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (withdrawalsError) throw withdrawalsError;

        return {
            success: true,
            data: {
                tasks_completed: tasksCount || 0,
                referrals: referralsCount || 0,
                withdrawals: withdrawalsCount || 0,
                last_activity: lastActivity?.[0] || null
            }
        };
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ===== تصدير الدوال الجديدة =====
window.getWithdrawSettings = getWithdrawSettings;
window.requestWithdrawalReal = requestWithdrawalReal;
window.getWithdrawalHistory = getWithdrawalHistory;
window.getDepositHistory = getDepositHistory;
window.sendNotification = sendNotification;
window.getUserStats = getUserStats;
