// ==========================================================
// RewardHub - نظام المصادقة (Auth) - كامل
// ==========================================================

// ===== تسجيل مستخدم جديد =====
async function registerUser(email, password, username, fullName) {
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    full_name: fullName || username,
                }
            }
        });

        if (authError) throw authError;

        const { error: userError } = await supabaseClient
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    email: email,
                    full_name: fullName || username,
                    referral_code: generateReferralCode(username),
                    is_active: true,
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    daily_earnings: 0
                }
            ]);

        if (userError) throw userError;

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

        if (error) throw error;

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

// ===== تسجيل الدخول عبر Google =====
async function loginWithGoogle() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                }
            }
        });

        if (error) throw error;
        return { success: true, data: data };

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول عبر Google:', error);
        showToast('❌ خطأ', 'فشل تسجيل الدخول عبر Google: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الدخول عبر GitHub =====
async function loginWithGitHub() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
        return { success: true, data: data };

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول عبر GitHub:', error);
        showToast('❌ خطأ', 'فشل تسجيل الدخول عبر GitHub: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الدخول عبر Discord =====
async function loginWithDiscord() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
        return { success: true, data: data };

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول عبر Discord:', error);
        showToast('❌ خطأ', 'فشل تسجيل الدخول عبر Discord: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الدخول عبر X (Twitter) =====
async function loginWithX() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'twitter',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
        return { success: true, data: data };

    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول عبر X:', error);
        showToast('❌ خطأ', 'فشل تسجيل الدخول عبر X: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ===== تسجيل الخروج =====
async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
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

// ===== توليد كود إحالة =====
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

        if (error) console.error('❌ خطأ في تسجيل النشاط:', error);
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

// ===== إشعار Toast =====
function showToast(title, message, type = 'info', duration = 5000) {
    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--secondary)'
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--dark-card);
        border: 1px solid ${colors[type] || 'var(--border-color)'};
        border-left: 4px solid ${colors[type] || 'var(--primary)'};
        border-radius: 12px;
        padding: 16px 20px;
        max-width: 400px;
        z-index: 99999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        animation: slideInRight 0.3s ease forwards;
        cursor: pointer;
    `;

    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="font-size: 24px;">${icons[type] || '📌'}</div>
            <div>
                <div style="font-weight: 600; font-size: 16px;">${title}</div>
                <div style="color: var(--text-secondary); font-size: 14px;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px;">✕</button>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);

    toast.addEventListener('click', () => toast.remove());
}

// ===== تصدير الدوال =====
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.checkAuthStatus = checkAuthStatus;
window.generateReferralCode = generateReferralCode;
window.loginWithGoogle = loginWithGoogle;
window.loginWithGitHub = loginWithGitHub;
window.loginWithDiscord = loginWithDiscord;
window.loginWithX = loginWithX;
window.showToast = showToast;

console.log('🔐 نظام المصادقة جاهز!');
