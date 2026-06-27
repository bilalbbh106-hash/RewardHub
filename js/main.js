// ==========================================================
// RewardHub - main.js
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 RewardHub loaded successfully!');

    // ===== التحقق من وجود عناصر =====
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    // ===== قائمة الموبايل =====
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }

    // ===== إغلاق القائمة عند الضغط على رابط =====
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('show');
            });
        });
    }

    // ===== تحديث الإحصائيات (للتأثير فقط) =====
    function animateNumbers() {
        const elements = document.querySelectorAll('.stat-number');
        elements.forEach(function(el) {
            const text = el.textContent;
            // نترك الأرقام كما هي حالياً - سنقوم بتحديثها من الـ API لاحقاً
        });
    }
    animateNumbers();
});
