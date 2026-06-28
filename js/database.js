// ==========================================================
// RewardHub - دوال قاعدة البيانات (كاملة)
// ==========================================================

// ===== جلب بيانات المستخدم =====
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ===== تحديث بيانات المستخدم =====
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب المهام المتاحة =====
async function getAvailableTasks() {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب المهام:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب مهام المستخدم =====
async function getUserTasks(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_tasks')
            .select('*, tasks(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب مهام المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ===== بدء مهمة جديدة =====
async function startTask(userId, taskId) {
    try {
        const { data: existing, error: checkError } = await supabaseClient
            .from('user_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('task_id', taskId)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existing) return { success: false, error: 'لقد قمت بهذه المهمة بالفعل' };

        const { data: task, error: taskError } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError) throw taskError;

        const { data, error } = await supabaseClient
            .from('user_tasks')
            .insert([
                {
                    user_id: userId,
                    task_id: taskId,
                    status: 'pending',
                    reward_earned: task.reward
                }
            ])
            .select()
            .single();

        if (error) throw error;

        await logUserActivity(userId, 'task_start', {
            task_id: taskId,
            task_title: task.title
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في بدء المهمة:', error);
        return { success: false, error: error.message };
    }
}

// ===== إكمال مهمة =====
async function completeTask(userTaskId, screenshotUrl = null, aiConfidence = null) {
    try {
        const updates = {
            status: 'completed',
            completed_at: new Date().toISOString()
        };

        if (screenshotUrl) updates.screenshot_url = screenshotUrl;
        if (aiConfidence !== null) updates.ai_confidence = aiConfidence;

        const { data, error } = await supabaseClient
            .from('user_tasks')
            .update(updates)
            .eq('id', userTaskId)
            .select('*, tasks(*)')
            .single();

        if (error) throw error;

        await logUserActivity(data.user_id, 'task_complete', {
            task_id: data.task_id,
            reward: data.reward_earned
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في إكمال المهمة:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب الجوائز المتاحة =====
async function getAvailablePrizes() {
    try {
        const { data, error } = await supabaseClient
            .from('prizes')
            .select('*')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('price', { ascending: true });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب الجوائز:', error);
        return { success: false, error: error.message };
    }
}

// ===== شراء جائزة =====
async function purchasePrize(userId, prizeId, quantity = 1) {
    try {
        const { data: prize, error: prizeError } = await supabaseClient
            .from('prizes')
            .select('*')
            .eq('id', prizeId)
            .single();

        if (prizeError) throw prizeError;
        if (prize.stock < quantity) return { success: false, error: 'الكمية المطلوبة غير متوفرة' };

        const totalPrice = prize.price * quantity;

        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;
        if (user.balance < totalPrice) return { success: false, error: 'الرصيد غير كافٍ' };

        const { data: order, error: orderError } = await supabaseClient
            .from('prize_orders')
            .insert([
                {
                    user_id: userId,
                    prize_id: prizeId,
                    quantity: quantity,
                    total_price: totalPrice,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (orderError) throw orderError;

        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({ balance: user.balance - totalPrice })
            .eq('id', userId);

        if (balanceError) throw balanceError;

        const { error: stockError } = await supabaseClient
            .from('prizes')
            .update({ stock: prize.stock - quantity })
            .eq('id', prizeId);

        if (stockError) throw stockError;

        await logUserActivity(userId, 'prize_purchase', {
            prize_id: prizeId,
            prize_name: prize.name,
            quantity: quantity,
            total_price: totalPrice
        });

        return { success: true, data: order };
    } catch (error) {
        console.error('❌ خطأ في شراء الجائزة:', error);
        return { success: false, error: error.message };
    }
}

// ===== طلب سحب =====
async function requestWithdrawalReal(userId, amount, method, walletAddress) {
    try {
        const settingsResult = await getWithdrawSettings();
        if (!settingsResult.success) throw new Error('فشل في جلب الإعدادات');

        const settings = settingsResult.data;
        const minWithdraw = parseFloat(settings.min_withdraw || 2);
        const maxWithdraw = parseFloat(settings.max_withdraw || 1000);
        const withdrawFee = parseFloat(settings.withdraw_fee || 0.5);

        if (amount < minWithdraw) return { success: false, error: `الحد الأدنى للسحب هو $${minWithdraw}` };
        if (amount > maxWithdraw) return { success: false, error: `الحد الأقصى للسحب هو $${maxWithdraw}` };

        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance, daily_withdraw_limit, withdraw_count_today, last_withdraw_date')
            .eq('id', userId)
            .single();

        if (userError) throw userError;
        if (user.balance < amount) return { success: false, error: 'الرصيد غير كافٍ' };

        const today = new Date().toDateString();
        const lastDate = user.last_withdraw_date ? new Date(user.last_withdraw_date).toDateString() : '';
        let countToday = user.withdraw_count_today || 0;
        if (lastDate !== today) countToday = 0;

        const feeAmount = (amount * withdrawFee) / 100;
        const finalAmount = amount - feeAmount;

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

        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({
                balance: user.balance - amount,
                withdraw_count_today: countToday + 1,
                last_withdraw_date: new Date().toISOString()
            })
            .eq('id', userId);

        if (balanceError) throw balanceError;

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

        await sendNotification(
            userId,
            '💰 طلب سحب جديد',
            `تم تقديم طلب سحب بقيمة $${amount.toFixed(2)} عبر ${method}`,
            'withdrawal'
        );

        await logUserActivity(userId, 'withdrawal_request', {
            amount: amount,
            method: method,
            fee: feeAmount,
            final_amount: finalAmount
        });

        return { success: true, data: data, fee: feeAmount, final_amount: finalAmount };
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

// ===== جلب الإحالات =====
async function getUserReferrals(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('referrals')
            .select('*, users!referred_id(username, full_name, created_at)')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب الإحالات:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب الإشعارات =====
async function getUserNotifications(userId, limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب الإشعارات:', error);
        return { success: false, error: error.message };
    }
}

// ===== تحديث الإشعار كمقروء =====
async function markNotificationAsRead(notificationId) {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في تحديث الإشعار:', error);
        return { success: false, error: error.message };
    }
}

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
        const { count: tasksCount, error: tasksError } = await supabaseClient
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        if (tasksError) throw tasksError;

        const { count: referralsCount, error: referralsError } = await supabaseClient
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId);

        if (referralsError) throw referralsError;

        const { data: lastActivity, error: activityError } = await supabaseClient
            .from('user_activities')
            .select('created_at, activity_type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (activityError) throw activityError;

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

// ===== جلب السحوبات =====
async function getUserWithdrawals(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ خطأ في جلب السحوبات:', error);
        return { success: false, error: error.message };
    }
}

// ===== تصدير الدوال =====
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.getAvailableTasks = getAvailableTasks;
window.getUserTasks = getUserTasks;
window.startTask = startTask;
window.completeTask = completeTask;
window.getAvailablePrizes = getAvailablePrizes;
window.purchasePrize = purchasePrize;
window.requestWithdrawalReal = requestWithdrawalReal;
window.getWithdrawalHistory = getWithdrawalHistory;
window.getDepositHistory = getDepositHistory;
window.getUserReferrals = getUserReferrals;
window.getUserNotifications = getUserNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.getWithdrawSettings = getWithdrawSettings;
window.sendNotification = sendNotification;
window.getUserStats = getUserStats;
window.getUserWithdrawals = getUserWithdrawals;

console.log('🗄️ دوال قاعدة البيانات جاهزة!');
