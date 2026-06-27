// ==========================================================
// RewardHub - Backend Server (Node.js + Express)
// ==========================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== إعدادات Supabase =====
const supabaseUrl = process.env.SUPABASE_URL || 'https://xxxxxxxxxxxx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== إعداد التطبيق =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(helmet());
app.use(cors({
    origin: ['https://rewardhub.com', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== Rate Limiting =====
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // 100 طلب لكل IP
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);

// ===== دالة للتحقق من التوكن =====
async function verifyToken(token) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        return user;
    } catch (error) {
        return null;
    }
}

// ===== Middleware للتحقق من المصادقة =====
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - No token provided'
        });
    }

    const user = await verifyToken(token);
    
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Invalid token'
        });
    }

    req.user = user;
    next();
}

// ===== Middleware للتحقق من الأدمن =====
async function adminMiddleware(req, res, next) {
    const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', req.user.id)
        .single();

    if (error || !userData?.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Forbidden - Admin access required'
        });
    }

    next();
}

// ==========================================================
// ===== Routes =====
// ==========================================================

// ===== اختبار الاتصال =====
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '✅ RewardHub API is running!',
        timestamp: new Date().toISOString()
    });
});

// ===== جلب بيانات المستخدم =====
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== تحديث بيانات المستخدم =====
app.put('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const { full_name, country, phone, avatar_url } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({
                full_name,
                country,
                phone,
                avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب المهام المتاحة =====
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== بدء مهمة =====
app.post('/api/tasks/start', authMiddleware, async (req, res) => {
    try {
        const { task_id } = req.body;

        // التحقق من وجود المهمة
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .single();

        if (taskError) throw taskError;

        // التحقق من عدم وجود المهمة مسبقاً
        const { data: existing, error: checkError } = await supabase
            .from('user_tasks')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('task_id', task_id)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'لقد قمت بهذه المهمة بالفعل'
            });
        }

        // إنشاء سجل المهمة
        const { data, error } = await supabase
            .from('user_tasks')
            .insert([
                {
                    user_id: req.user.id,
                    task_id: task_id,
                    status: 'pending',
                    reward_earned: task.reward
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== إكمال مهمة =====
app.post('/api/tasks/complete', authMiddleware, async (req, res) => {
    try {
        const { user_task_id, screenshot_url } = req.body;

        const { data, error } = await supabase
            .from('user_tasks')
            .update({
                status: 'completed',
                screenshot_url: screenshot_url || null,
                completed_at: new Date().toISOString()
            })
            .eq('id', user_task_id)
            .eq('user_id', req.user.id)
            .select('*, tasks(*)')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب الجوائز =====
app.get('/api/prizes', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prizes')
            .select('*')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('price', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== شراء جائزة =====
app.post('/api/prizes/purchase', authMiddleware, async (req, res) => {
    try {
        const { prize_id, quantity = 1 } = req.body;

        // جلب بيانات الجائزة
        const { data: prize, error: prizeError } = await supabase
            .from('prizes')
            .select('*')
            .eq('id', prize_id)
            .single();

        if (prizeError) throw prizeError;

        if (prize.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: 'الكمية المطلوبة غير متوفرة'
            });
        }

        const totalPrice = prize.price * quantity;

        // التحقق من الرصيد
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', req.user.id)
            .single();

        if (userError) throw userError;

        if (user.balance < totalPrice) {
            return res.status(400).json({
                success: false,
                error: 'الرصيد غير كافٍ'
            });
        }

        // إنشاء طلب الشراء
        const { data: order, error: orderError } = await supabase
            .from('prize_orders')
            .insert([
                {
                    user_id: req.user.id,
                    prize_id: prize_id,
                    quantity: quantity,
                    total_price: totalPrice,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (orderError) throw orderError;

        // تحديث رصيد المستخدم
        const { error: balanceError } = await supabase
            .from('users')
            .update({
                balance: user.balance - totalPrice
            })
            .eq('id', req.user.id);

        if (balanceError) throw balanceError;

        // تحديث مخزون الجائزة
        const { error: stockError } = await supabase
            .from('prizes')
            .update({
                stock: prize.stock - quantity
            })
            .eq('id', prize_id);

        if (stockError) throw stockError;

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== طلب سحب =====
app.post('/api/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount, method, wallet_address } = req.body;

        // التحقق من الرصيد
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', req.user.id)
            .single();

        if (userError) throw userError;

        if (user.balance < amount) {
            return res.status(400).json({
                success: false,
                error: 'الرصيد غير كافٍ'
            });
        }

        // إنشاء طلب السحب
        const { data, error } = await supabase
            .from('withdrawals')
            .insert([
                {
                    user_id: req.user.id,
                    amount: amount,
                    method: method,
                    wallet_address: wallet_address,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب سجل السحوبات =====
app.get('/api/withdrawals', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب الإشعارات =====
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب الإحالات =====
app.get('/api/referrals', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select('*, users!referred_id(username, full_name, created_at)')
            .eq('referrer_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================================
// ===== Routes خاصة بالأدمن =====
// ==========================================================

// ===== جلب جميع المستخدمين =====
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== جلب جميع السحوبات =====
app.get('/api/admin/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*, users(username, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== تحديث حالة السحب =====
app.put('/api/admin/withdrawals/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const { data, error } = await supabase
            .from('withdrawals')
            .update({
                status: status,
                admin_notes: admin_notes,
                processed_by: req.user.id,
                processed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // إذا تمت الموافقة، نقوم بتحديث رصيد المستخدم
        if (status === 'approved') {
            const { error: balanceError } = await supabase
                .from('users')
                .update({
                    balance: supabase.rpc('decrement_balance', { 
                        user_id: data.user_id, 
                        amount: data.amount 
                    })
                })
                .eq('id', data.user_id);

            if (balanceError) console.error('❌ خطأ في تحديث الرصيد:', balanceError);
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== إحصائيات الموقع =====
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // عدد المستخدمين
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // إجمالي الأرباح
        const { data: earningsData, error: earningsError } = await supabase
            .from('users')
            .select('total_earned');

        if (earningsError) throw earningsError;

        const totalEarnings = earningsData.reduce((sum, user) => sum + (user.total_earned || 0), 0);

        // إجمالي السحوبات
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('status', 'processed');

        if (withdrawalsError) throw withdrawalsError;

        const totalWithdrawals = withdrawalsData.reduce((sum, w) => sum + (w.amount || 0), 0);

        // المهام المنجزة
        const { count: tasksCount, error: tasksError } = await supabase
            .from('user_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        if (tasksError) throw tasksError;

        // السحوبات المعلقة
        const { count: pendingWithdrawals, error: pendingError } = await supabase
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (pendingError) throw pendingError;

        res.json({
            success: true,
            data: {
                total_users: usersCount || 0,
                total_earnings: totalEarnings,
                total_withdrawals: totalWithdrawals,
                total_tasks: tasksCount || 0,
                pending_withdrawals: pendingWithdrawals || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================================
// ===== تشغيل السيرفر =====
// ==========================================================

app.listen(PORT, () => {
    console.log(`🚀 RewardHub Server is running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`✅ Ready to accept requests!`);
});

// ===== تصدير التطبيق =====
module.exports = app;
