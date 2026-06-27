// ==========================================================
// RewardHub - دوال قاعدة البيانات
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
        // التحقق من عدم وجود المهمة مسبقاً
        const { data: existing, error: checkError } = await supabaseClient
            .from('user_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('task_id', taskId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            return { success: false, error: 'لقد قمت بهذه المهمة بالفعل' };
        }

        // جلب بيانات المهمة
        const { data: task, error: taskError } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError) throw taskError;

        // إنشاء سجل المهمة
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

        // تسجيل النشاط
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

        if (screenshotUrl) {
            updates.screenshot_url = screenshotUrl;
        }

        if (aiConfidence !== null) {
            updates.ai_confidence = aiConfidence;
        }

        const { data, error } = await supabaseClient
            .from('user_tasks')
            .update(updates)
            .eq('id', userTaskId)
            .select('*, tasks(*)')
            .single();

        if (error) throw error;

        // تسجيل النشاط
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
        // جلب بيانات الجائزة
        const { data: prize, error: prizeError } = await supabaseClient
            .from('prizes')
            .select('*')
            .eq('id', prizeId)
            .single();

        if (prizeError) throw prizeError;

        if (prize.stock < quantity) {
            return { success: false, error: 'الكمية المطلوبة غير متوفرة' };
        }

        const totalPrice = prize.price * quantity;

        // التحقق من الرصيد
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (user.balance < totalPrice) {
            return { success: false, error: 'الرصيد غير كافٍ' };
        }

        // إنشاء طلب الشراء
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

        // تحديث رصيد المستخدم
        const { error: balanceError } = await supabaseClient
            .from('users')
            .update({
                balance: user.balance - totalPrice
            })
            .eq('id', userId);

        if (balanceError) throw balanceError;

        // تحديث مخزون الجائزة
        const { error: stockError } = await supabaseClient
            .from('prizes')
            .update({
                stock: prize.stock - quantity
            })
            .eq('id', prizeId);

        if (stockError) throw stockError;

        // تسجيل النشاط
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
async function requestWithdrawal(userId, amount, method, walletAddress) {
    try {
        // التحقق من الرصيد
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (user.balance < amount) {
            return { success: false, error: 'الرصيد غير كافٍ' };
        }

        // إنشاء طلب السحب
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([
                {
                    user_id: userId,
                    amount: amount,
                    method: method,
                    wallet_address: walletAddress,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // تسجيل النشاط
        await logUserActivity(userId, 'withdrawal_request', {
            amount: amount,
            method: method
        });

        return { success: true, data: data };

    } catch (error) {
        console.error('❌ خطأ في طلب السحب:', error);
        return { success: false, error: error.message };
    }
}

// ===== جلب سجل السحوبات =====
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
        console.error('❌ خطأ في جلب سجل السحوبات:', error);
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

// ===== تصدير الدوال =====
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.getAvailableTasks = getAvailableTasks;
window.getUserTasks = getUserTasks;
window.startTask = startTask;
window.completeTask = completeTask;
window.getAvailablePrizes = getAvailablePrizes;
window.purchasePrize = purchasePrize;
window.requestWithdrawal = requestWithdrawal;
window.getUserWithdrawals = getUserWithdrawals;
window.getUserReferrals = getUserReferrals;
window.getUserNotifications = getUserNotifications;
window.markNotificationAsRead = markNotificationAsRead;

console.log('🗄️ دوال قاعدة البيانات جاهزة!');
