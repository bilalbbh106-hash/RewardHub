// ==========================================================
// RewardHub - بوت إدارة تيليجرام
// ==========================================================

const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== إعدادات Supabase =====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ===== إعدادات البوت =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 جاري تشغيل بوت RewardHub...');
console.log('📋 معرف المشرف:', ADMIN_CHAT_ID);

// ==========================================================
// ===== الأوامر الأساسية =====
// ==========================================================

// ===== /start =====
bot.start(async (ctx) => {
    const chatId = ctx.chat.id.toString();
    
    if (chatId !== ADMIN_CHAT_ID) {
        return ctx.reply('⛔ هذا البوت خاص بإدارة الموقع فقط.');
    }
    
    await ctx.reply(
        `🤖 **مرحباً بك في بوت إدارة RewardHub!**

📋 **الأوامر المتاحة:**

📊 `/stats` - إحصائيات الموقع
👥 `/users` - قائمة المستخدمين
💰 `/withdrawals` - طلبات السحب
🎁 `/prizes` - إدارة الجوائز
📝 `/tasks` - إدارة المهام
🔗 `/smartlinks` - إدارة الروابط الذكية
📢 `/notify` - إرسال إشعار للجميع
🛡️ `/antifraud` - إعدادات مكافحة الغش
⚙️ `/settings` - إعدادات الموقع
📊 `/logs` - سجل العمليات

✅ `/approve [رقم]` - قبول سحب
❌ `/reject [رقم] [السبب]` - رفض سحب

💡 **للإضافة:**
\`/addprize [الاسم] [السعر] [الفئة]\`
\`/addtask [العنوان] [المكافأة] [النوع]\`
\`/addlink [العنوان] [الرابط] [المكافأة]\`
`,
        { parse_mode: 'Markdown' }
    );
});

// ===== /help =====
bot.help(async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    await ctx.reply(
        `📋 **قائمة الأوامر الكاملة**

**📊 الإحصائيات:**
/stats - عرض إحصائيات الموقع
/logs - عرض سجل العمليات

**👥 المستخدمين:**
/users - قائمة آخر 20 مستخدم

**💰 السحوبات:**
/withdrawals - طلبات السحب المعلقة
/approve [ID] - قبول سحب
/reject [ID] [السبب] - رفض سحب

**🎁 الجوائز:**
/prizes - قائمة الجوائز
/addprize [الاسم] [السعر] [الفئة] - إضافة جائزة
/deleteprize [ID] - حذف جائزة

**📝 المهام:**
/tasks - قائمة المهام
/addtask [العنوان] [المكافأة] [النوع] - إضافة مهمة
/deletetask [ID] - حذف مهمة

**🔗 Smart Links:**
/smartlinks - قائمة الروابط الذكية
/addlink [العنوان] [الرابط] [المكافأة] - إضافة رابط
/deletelink [ID] - حذف رابط

**📢 الإشعارات:**
/notify [الرسالة] - إرسال إشعار للجميع

**🛡️ مكافحة الغش:**
/antifraud - إعدادات مكافحة الغش
/togglefraud - تفعيل/تعطيل مكافحة الغش

**⚙️ الإعدادات:**
/settings - عرض إعدادات الموقع`,
        { parse_mode: 'Markdown' }
    );
});

// ==========================================================
// ===== الإحصائيات =====
// ==========================================================

bot.command('stats', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        const { data: earningsData } = await supabase
            .from('users')
            .select('total_earned');
        const totalEarnings = earningsData?.reduce((sum, u) => sum + (u.total_earned || 0), 0) || 0;
        
        const { data: withdrawalsData } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('status', 'approved');
        const totalWithdrawals = withdrawalsData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        
        const { count: pendingCount } = await supabase
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        const { count: tasksCount } = await supabase
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');
        
        const today = new Date().toISOString().split('T')[0];
        const { count: todayUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        
        await ctx.reply(
            `📊 **إحصائيات RewardHub**

👥 **المستخدمين:** ${usersCount || 0}
🆕 **جدد اليوم:** ${todayUsers || 0}
💰 **إجمالي الأرباح:** $${totalEarnings.toFixed(2)}
🏦 **إجمالي السحوبات:** $${totalWithdrawals.toFixed(2)}
⏳ **سحوبات معلقة:** ${pendingCount || 0}
📝 **مهام منجزة:** ${tasksCount || 0}
📅 **آخر تحديث:** ${new Date().toLocaleString('ar-EG')}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ في جلب الإحصائيات: ' + error.message);
    }
});

// ==========================================================
// ===== السحوبات =====
// ==========================================================

bot.command('withdrawals', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: withdrawals, error } = await supabase
            .from('withdrawals')
            .select('*, users(username, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!withdrawals || withdrawals.length === 0) {
            return ctx.reply('✅ لا توجد سحوبات معلقة');
        }
        
        let message = `💰 **طلبات السحب المعلقة (${withdrawals.length})**\n\n`;
        withdrawals.forEach((w, i) => {
            message += `**${i + 1}.** ID: \`${w.id.slice(0, 8)}\`\n`;
            message += `👤 ${w.users?.username || 'مستخدم'}\n`;
            message += `💵 $${parseFloat(w.amount).toFixed(2)}\n`;
            message += `🏦 ${w.method}\n`;
            message += `📅 ${new Date(w.created_at).toLocaleDateString('ar-EG')}\n\n`;
        });
        
        message += `✅ \`/approve [رقم المعرف]\`\n`;
        message += `❌ \`/reject [رقم المعرف] [السبب]\``;
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== قبول سحب =====
bot.command('approve', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const withdrawalId = parts[1];
    
    if (!withdrawalId) {
        return ctx.reply('⚠️ يرجى إدخال رقم المعرف\nمثال: `/approve abc123`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { data: withdrawal, error: getError } = await supabase
            .from('withdrawals')
            .select('*, users(username, email)')
            .eq('id', withdrawalId)
            .single();
        
        if (getError || !withdrawal) {
            return ctx.reply('❌ لم يتم العثور على طلب السحب');
        }
        
        if (withdrawal.status !== 'pending') {
            return ctx.reply(`⚠️ هذا الطلب بحالة ${withdrawal.status} (ليس معلقاً)`);
        }
        
        const { error: updateError } = await supabase
            .from('withdrawals')
            .update({
                status: 'approved',
                admin_notes: 'تمت الموافقة من قبل المشرف',
                processed_at: new Date().toISOString()
            })
            .eq('id', withdrawalId);
        
        if (updateError) throw updateError;
        
        await supabase
            .from('notifications')
            .insert([{
                user_id: withdrawal.user_id,
                title: '✅ تم قبول طلب السحب',
                message: `تم قبول طلب سحب بقيمة $${parseFloat(withdrawal.amount).toFixed(2)} عبر ${withdrawal.method}`,
                type: 'withdrawal',
                is_read: false
            }]);
        
        await ctx.reply(
            `✅ **تم قبول السحب بنجاح!**
👤 ${withdrawal.users?.username}
💵 $${parseFloat(withdrawal.amount).toFixed(2)}
🏦 ${withdrawal.method}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== رفض سحب =====
bot.command('reject', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const withdrawalId = parts[1];
    const reason = parts.slice(2).join(' ') || 'لم يتم تحديد سبب';
    
    if (!withdrawalId) {
        return ctx.reply('⚠️ يرجى إدخال رقم المعرف والسبب\nمثال: `/reject abc123 سبب الرفض`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { data: withdrawal, error: getError } = await supabase
            .from('withdrawals')
            .select('*, users(username, email)')
            .eq('id', withdrawalId)
            .single();
        
        if (getError || !withdrawal) {
            return ctx.reply('❌ لم يتم العثور على طلب السحب');
        }
        
        if (withdrawal.status !== 'pending') {
            return ctx.reply(`⚠️ هذا الطلب بحالة ${withdrawal.status} (ليس معلقاً)`);
        }
        
        await supabase.rpc('increment_balance', {
            user_id: withdrawal.user_id,
            amount: withdrawal.amount
        });
        
        const { error: updateError } = await supabase
            .from('withdrawals')
            .update({
                status: 'rejected',
                admin_notes: reason,
                processed_at: new Date().toISOString()
            })
            .eq('id', withdrawalId);
        
        if (updateError) throw updateError;
        
        await supabase
            .from('notifications')
            .insert([{
                user_id: withdrawal.user_id,
                title: '❌ تم رفض طلب السحب',
                message: `تم رفض طلب سحب بقيمة $${parseFloat(withdrawal.amount).toFixed(2)}.\nالسبب: ${reason}`,
                type: 'withdrawal',
                is_read: false
            }]);
        
        await ctx.reply(
            `❌ **تم رفض السحب!**
👤 ${withdrawal.users?.username}
💵 $${parseFloat(withdrawal.amount).toFixed(2)}
📝 السبب: ${reason}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== الجوائز =====
// ==========================================================

bot.command('prizes', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: prizes, error } = await supabase
            .from('prizes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!prizes || prizes.length === 0) {
            return ctx.reply('🎁 لا توجد جوائز حالياً');
        }
        
        let message = `🎁 **قائمة الجوائز (${prizes.length})**\n\n`;
        prizes.forEach((p, i) => {
            message += `${i + 1}. **${p.name}**\n`;
            message += `   💰 $${parseFloat(p.price).toFixed(2)}\n`;
            message += `   📦 ${p.stock} متبقية\n`;
            message += `   📂 ${p.category}\n`;
            message += `   ${p.is_active ? '✅ متاحة' : '❌ غير متاحة'}\n\n`;
        });
        
        message += `➕ \`/addprize [الاسم] [السعر] [الفئة]\`\n`;
        message += `❌ \`/deleteprize [ID]\`\n`;
        message += `📂 الفئات: giftcard, game, crypto, other`;
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== إضافة جائزة =====
bot.command('addprize', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const name = parts.slice(1, -2).join(' ') || parts[1];
    const price = parseFloat(parts[parts.length - 2]);
    const category = parts[parts.length - 1];
    
    if (!name || !price || !category) {
        return ctx.reply(
            '⚠️ **طريقة الاستخدام:**\n`/addprize [الاسم] [السعر] [الفئة]`\n\n📂 الفئات: giftcard, game, crypto, other',
            { parse_mode: 'Markdown' }
        );
    }
    
    try {
        const { data, error } = await supabase
            .from('prizes')
            .insert([{
                name: name,
                price: price,
                category: category,
                stock: 10,
                is_active: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        await ctx.reply(
            `✅ **تم إضافة الجائزة بنجاح!**
🎁 ${data.name}
💰 $${parseFloat(data.price).toFixed(2)}
📂 ${data.category}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== حذف جائزة =====
bot.command('deleteprize', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const prizeId = parts[1];
    
    if (!prizeId) {
        return ctx.reply('⚠️ يرجى إدخال ID الجائزة\nمثال: `/deleteprize abc123`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { error } = await supabase
            .from('prizes')
            .delete()
            .eq('id', prizeId);
        
        if (error) throw error;
        
        await ctx.reply('✅ تم حذف الجائزة بنجاح!');
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== المهام =====
// ==========================================================

bot.command('tasks', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!tasks || tasks.length === 0) {
            return ctx.reply('📝 لا توجد مهام حالياً');
        }
        
        let message = `📝 **قائمة المهام (${tasks.length})**\n\n`;
        tasks.forEach((t, i) => {
            message += `${i + 1}. **${t.title}**\n`;
            message += `   💰 $${parseFloat(t.reward).toFixed(3)}\n`;
            message += `   📂 ${t.task_type}\n`;
            message += `   ⏱️ ${t.duration_seconds || 'غير محدد'} ثانية\n`;
            message += `   ${t.is_active ? '✅ نشطة' : '❌ غير نشطة'}\n\n`;
        });
        
        message += `➕ \`/addtask [العنوان] [المكافأة] [النوع]\`\n`;
        message += `❌ \`/deletetask [ID]\`\n`;
        message += `📂 الأنواع: video, visit, survey, offerwall, social, smartlink`;
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== إضافة مهمة =====
bot.command('addtask', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const title = parts.slice(1, -2).join(' ') || parts[1];
    const reward = parseFloat(parts[parts.length - 2]);
    const type = parts[parts.length - 1];
    
    if (!title || !reward || !type) {
        return ctx.reply(
            '⚠️ **طريقة الاستخدام:**\n`/addtask [العنوان] [المكافأة] [النوع]`\n\n📂 الأنواع: video, visit, survey, offerwall, social, smartlink',
            { parse_mode: 'Markdown' }
        );
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title: title,
                reward: reward,
                task_type: type,
                is_active: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        await ctx.reply(
            `✅ **تم إضافة المهمة بنجاح!**
📌 ${data.title}
💰 $${parseFloat(data.reward).toFixed(3)}
📂 ${data.task_type}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== حذف مهمة =====
bot.command('deletetask', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const taskId = parts[1];
    
    if (!taskId) {
        return ctx.reply('⚠️ يرجى إدخال ID المهمة\nمثال: `/deletetask abc123`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        await ctx.reply('✅ تم حذف المهمة بنجاح!');
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== Smart Links =====
// ==========================================================

bot.command('smartlinks', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: links, error } = await supabase
            .from('smart_links')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!links || links.length === 0) {
            return ctx.reply('🔗 لا توجد روابط ذكية حالياً');
        }
        
        let message = `🔗 **قائمة Smart Links (${links.length})**\n\n`;
        links.forEach((l, i) => {
            message += `${i + 1}. **${l.title}**\n`;
            message += `   💰 $${parseFloat(l.reward).toFixed(3)}\n`;
            message += `   🔗 ${l.link_url}\n`;
            message += `   👆 ${l.redirect_count || 0} نقرة\n`;
            message += `   ${l.is_active ? '✅ نشط' : '❌ غير نشط'}\n\n`;
        });
        
        message += `➕ \`/addlink [العنوان] [الرابط] [المكافأة]\`\n`;
        message += `❌ \`/deletelink [ID]\``;
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== إضافة Smart Link =====
bot.command('addlink', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const title = parts.slice(1, -2).join(' ') || parts[1];
    const url = parts[parts.length - 2];
    const reward = parseFloat(parts[parts.length - 1]);
    
    if (!title || !url || !reward) {
        return ctx.reply(
            '⚠️ **طريقة الاستخدام:**\n`/addlink [العنوان] [الرابط] [المكافأة]`',
            { parse_mode: 'Markdown' }
        );
    }
    
    try {
        const { data, error } = await supabase
            .from('smart_links')
            .insert([{
                title: title,
                link_url: url,
                reward: reward,
                is_active: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        await ctx.reply(
            `✅ **تم إضافة Smart Link بنجاح!**
📌 ${data.title}
🔗 ${data.link_url}
💰 $${parseFloat(data.reward).toFixed(3)}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== حذف Smart Link =====
bot.command('deletelink', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const parts = ctx.message.text.split(' ');
    const linkId = parts[1];
    
    if (!linkId) {
        return ctx.reply('⚠️ يرجى إدخال ID الرابط\nمثال: `/deletelink abc123`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { error } = await supabase
            .from('smart_links')
            .delete()
            .eq('id', linkId);
        
        if (error) throw error;
        
        await ctx.reply('✅ تم حذف Smart Link بنجاح!');
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== الإشعارات =====
// ==========================================================

bot.command('notify', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    const message = ctx.message.text.replace('/notify', '').trim();
    
    if (!message) {
        return ctx.reply('⚠️ يرجى كتابة رسالة الإشعار\nمثال: `/notify عروض جديدة في الموقع!`', { parse_mode: 'Markdown' });
    }
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id');
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            return ctx.reply('❌ لا يوجد مستخدمين لإرسال الإشعار لهم');
        }
        
        const notifications = users.map(user => ({
            user_id: user.id,
            title: '📢 إشعار من الإدارة',
            message: message,
            type: 'promotion',
            is_read: false
        }));
        
        const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);
        
        if (insertError) throw insertError;
        
        await ctx.reply(`✅ تم إرسال الإشعار لـ ${users.length} مستخدم بنجاح!`);
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== المستخدمين =====
// ==========================================================

bot.command('users', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, balance, is_active, created_at')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            return ctx.reply('👥 لا يوجد مستخدمين');
        }
        
        let message = `👥 **آخر 20 مستخدم**\n\n`;
        users.forEach((u, i) => {
            message += `${i + 1}. **${u.username || 'مستخدم'}**\n`;
            message += `   📧 ${u.email}\n`;
            message += `   💰 $${parseFloat(u.balance || 0).toFixed(2)}\n`;
            message += `   ${u.is_active ? '✅ نشط' : '❌ موقوف'}\n`;
            message += `   📅 ${new Date(u.created_at).toLocaleDateString('ar-EG')}\n\n`;
        });
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== سجل العمليات =====
// ==========================================================

bot.command('logs', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: logs, error } = await supabase
            .from('logs')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (!logs || logs.length === 0) {
            return ctx.reply('📋 لا توجد سجلات');
        }
        
        let message = `📋 **آخر 10 عمليات**\n\n`;
        logs.forEach((log, i) => {
            message += `${i + 1}. **${log.event_type || 'عام'}**\n`;
            message += `   👤 ${log.users?.username || 'غير معروف'}\n`;
            message += `   📝 ${log.event_description || '-'}\n`;
            message += `   📅 ${new Date(log.created_at).toLocaleString('ar-EG')}\n\n`;
        });
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== مكافحة الغش =====
// ==========================================================

bot.command('antifraud', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: settings, error } = await supabase
            .from('bot_settings')
            .select('*')
            .in('setting_key', ['anti_fraud_enabled', 'min_withdraw', 'withdraw_fee']);
        
        if (error) throw error;
        
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.setting_key] = s.setting_value;
        });
        
        const { count: attemptsCount } = await supabase
            .from('referral_attempts')
            .select('*', { count: 'exact', head: true });
        
        await ctx.reply(
            `🛡️ **إعدادات مكافحة الغش**

🔒 **الحالة:** ${settingsMap.anti_fraud_enabled === 'true' ? '✅ مفعل' : '❌ غير مفعل'}
💰 **الحد الأدنى للسحب:** $${settingsMap.min_withdraw || 2}
📊 **رسوم السحب:** ${settingsMap.withdraw_fee || 0.5}%
⚠️ **محاولات مشبوهة:** ${attemptsCount || 0}

📋 **الأوامر المتاحة:**
\`/togglefraud\` - تفعيل/تعطيل مكافحة الغش`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ===== تفعيل/تعطيل مكافحة الغش =====
bot.command('togglefraud', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: current, error: getError } = await supabase
            .from('bot_settings')
            .select('setting_value')
            .eq('setting_key', 'anti_fraud_enabled')
            .single();
        
        if (getError) throw getError;
        
        const newValue = current?.setting_value === 'true' ? 'false' : 'true';
        
        const { error: updateError } = await supabase
            .from('bot_settings')
            .update({ setting_value: newValue })
            .eq('setting_key', 'anti_fraud_enabled');
        
        if (updateError) throw updateError;
        
        await ctx.reply(`🛡️ **تم ${newValue === 'true' ? 'تفعيل' : 'تعطيل'} نظام مكافحة الغش بنجاح!**`, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== الإعدادات =====
// ==========================================================

bot.command('settings', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_CHAT_ID) return;
    
    try {
        const { data: settings, error } = await supabase
            .from('bot_settings')
            .select('*');
        
        if (error) throw error;
        
        let message = `⚙️ **إعدادات الموقع**\n\n`;
        settings.forEach(s => {
            message += `**${s.setting_key}:** \`${s.setting_value}\`\n`;
            message += `📝 ${s.description || ''}\n\n`;
        });
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply('❌ خطأ: ' + error.message);
    }
});

// ==========================================================
// ===== تشغيل البوت =====
// ==========================================================

bot.launch()
    .then(() => {
        console.log('✅ بوت RewardHub شغال بنجاح!');
        console.log('📋 معرف المشرف:', ADMIN_CHAT_ID);
        console.log('🤖 اذهب إلى البوت واكتب /start');
    })
    .catch(err => console.error('❌ خطأ في تشغيل البوت:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
