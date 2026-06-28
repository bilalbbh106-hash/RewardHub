// ==========================================================
// RewardHub - main.js
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 RewardHub loaded successfully!');

    // ===== قائمة الموبايل =====
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }

    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('show');
            });
        });
    }

    // ===== تحسين الأداء في الموبايل =====
    function optimizeForMobile() {
        const isMobile = window.innerWidth < 768;
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            if (isMobile) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }

    optimizeForMobile();
    window.addEventListener('resize', optimizeForMobile);

    // ===== إغلاق القائمة عند النقر خارجها (للموبايل) =====
    document.addEventListener('click', function(event) {
        const nav = document.getElementById('navLinks');
        const menu = document.getElementById('mobileMenu');
        if (nav && menu) {
            if (!nav.contains(event.target) && !menu.contains(event.target)) {
                nav.classList.remove('show');
            }
        }
    });
});
