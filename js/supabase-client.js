// ==========================================================
// RewardHub - Supabase Client
// ==========================================================

// ===== إعدادات Supabase =====
// 🔴 استبدل هذه القيم بمفاتيح مشروعك من Supabase
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// ===== إنشاء عميل Supabase =====
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// ===== دالة للتحقق من الاتصال =====
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ فشل الاتصال بـ Supabase:', error);
            return false;
        }
        
        console.log('✅ تم الاتصال بـ Supabase بنجاح!');
        return true;
    } catch (e) {
        console.error('❌ خطأ في الاتصال:', e);
        return false;
    }
}

// ===== دالة للحصول على المستخدم الحالي =====
async function getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error('❌ خطأ في جلب المستخدم:', error);
        return null;
    }
    return user;
}

// ===== دالة لتسجيل الخروج =====
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        return false;
    }
    console.log('✅ تم تسجيل الخروج بنجاح');
    return true;
}

// ===== تصدير الدوال =====
window.supabaseClient = supabaseClient;
window.testSupabaseConnection = testSupabaseConnection;
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;

console.log('🔌 Supabase Client جاهز!');
