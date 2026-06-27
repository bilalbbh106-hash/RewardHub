// ==========================================================
// RewardHub - نظام المصادقة (Auth)
// ==========================================================

// ===== تسجيل مستخدم جديد =====
async function registerUser(email, password, username, fullName) {
    try {
        // 1. تسجيل المستخدم في Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    full_name: fullName,
                }
            }
        });

        if (authError) {
            throw authError;
        }

        // 2. إضافة المستخدم إلى جدول users
        const { error: userError } = await supabaseClient
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    email: email,
                    full_name: fullName,
                    referral_code: generateReferralCode(username),
                    is_active: true,
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    daily_earnings: 0
                }
            ]);

        if (userError) {
            throw userError;
        }

        console.log('✅ تم تسجيل المستخدم بنجاح:', username);
        return { success: true, user: authData.user };

    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الدخول =====
async function loginUser(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        // تسجيل نشاط الدخول
        await logUserActivity(data.user.id, 'login', {
            email: email,
            timestamp: new Date().toISOString()
        });

        console.log('✅ تم تسجيل الدخول بنجاح:', data.user.email);
        return { success: true, user: data.user };

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الخروج =====
async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        console.log('✅ تم تسجيل الخروج');
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        return { success: false, error: error.message };
    }
}

// ===== التحقق من حالة تسجيل الدخول =====
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            return { isLoggedIn: false, user: null };
        }

        // جلب بيانات المستخدم من جدول users
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            return { isLoggedIn: true, user: user, profile: null };
        }

        return { isLoggedIn: true, user: user, profile: userData };

    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error);
        return { isLoggedIn: false, user: null, error: error.message };
    }
}

// ===== توليد كود إحالة فريد =====
function generateReferralCode(username) {
    const prefix = username.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
}

// ===== تسجيل نشاط المستخدم =====
async function logUserActivity(userId, activityType, details = {}) {
    try {
        const { error } = await supabaseClient
            .from('user_activities')
            .insert([
                {
                    user_id: userId,
                    activity_type: activityType,
                    details: details,
                    ip_address: await getIPAddress(),
                    user_agent: navigator.userAgent
                }
            ]);

        if (error) {
            console.error('❌ خطأ في تسجيل النشاط:', error);
        }
    } catch (e) {
        console.error('❌ خطأ في تسجيل النشاط:', e);
    }
}

// ===== جلب عنوان IP =====
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return 'unknown';
    }
}

// ===== تصدير الدوال =====
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.checkAuthStatus = checkAuthStatus;
window.generateReferralCode = generateReferralCode;

console.log('🔐 نظام المصادقة جاهز!');
