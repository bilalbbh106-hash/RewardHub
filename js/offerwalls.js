// ==========================================================
// RewardHub - Offerwalls (كامل)
// ==========================================================

const OFFERWALL_LIST = {
    tapjoy: { name: 'Tapjoy', icon: 'fa-tasks', color: '#FF6B35', description: 'أكمل العروض واحصل على مكافآت' },
    offertoro: { name: 'OfferToro', icon: 'fa-gem', color: '#00D4FF', description: 'عروض حصرية بمكافآت عالية' },
    cpx: { name: 'CPX Research', icon: 'fa-poll', color: '#8B6FE8', description: 'استبيانات مدفوعة' },
    adgate: { name: 'AdGate Media', icon: 'fa-ad', color: '#00E676', description: 'عروض متنوعة يومية' },
    adgem: { name: 'AdGem', icon: 'fa-gem', color: '#FFC107', description: 'عروض حصرية' },
    lootably: { name: 'Lootably', icon: 'fa-trophy', color: '#FF1744', description: 'جوائز وعروض' },
    ayet: { name: 'Ayet Studios', icon: 'fa-film', color: '#4FC3F7', description: 'عروض فيديو' },
    revu: { name: 'RevU', icon: 'fa-star', color: '#9C27B0', description: 'عروض متميزة' },
    timewall: { name: 'TimeWall', icon: 'fa-clock', color: '#FF9800', description: 'عروض زمنية' },
    bitlabs: { name: 'BitLabs', icon: 'fa-bitcoin', color: '#FFD700', description: 'عروض عملات رقمية' },
    monlix: { name: 'Monlix', icon: 'fa-money-bill', color: '#00BCD4', description: 'عروض متنوعة' }
};

async function loadOfferwall(provider) {
    try {
        const config = REWARDHUB_CONFIG.offerwalls[provider];
        if (!config || !config.enabled) {
            return { success: false, error: 'هذه الخدمة غير مفعلة' };
        }

        const mockOffers = [
            { id: 1, title: 'تسجيل في موقع', reward: 0.50, description: 'سجل في الموقع واحصل على مكافأة' },
            { id: 2, title: 'تحميل تطبيق', reward: 0.75, description: 'حمّل التطبيق وافتحه' },
            { id: 3, title: 'مشاهدة فيديو', reward: 0.25, description: 'شاهد فيديو مدته 30 ثانية' },
            { id: 4, title: 'إكمال استبيان', reward: 1.00, description: 'أجب عن 10 أسئلة' }
        ];

        return { success: true, data: mockOffers };
    } catch (error) {
        console.error('❌ خطأ في تحميل العروض:', error);
        return { success: false, error: error.message };
    }
}

async function renderOfferwalls(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `<h3 style="margin-bottom: 16px;">📢 شركات العروض</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">`;

    for (const [key, value] of Object.entries(OFFERWALL_LIST)) {
        const config = REWARDHUB_CONFIG.offerwalls[key];
        const isEnabled = config ? config.enabled : false;

        html += `
            <div class="card" style="padding: 16px; text-align: center; ${!isEnabled ? 'opacity: 0.5;' : ''}">
                <i class="fas ${value.icon}" style="font-size: 32px; color: ${value.color};"></i>
                <h4 style="margin: 8px 0;">${value.name}</h4>
                <p style="font-size: 12px; color: var(--text-secondary);">${value.description}</p>
                ${isEnabled ? `
                    <button class="btn btn-primary btn-sm" onclick="showOfferwall('${key}')" style="margin-top: 8px;">
                        <i class="fas fa-play"></i> استعراض
                    </button>
                ` : `
                    <span class="badge badge-danger">غير مفعل</span>
                `}
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

async function showOfferwall(provider) {
    const result = await loadOfferwall(provider);

    if (!result.success) {
        showToast('❌ خطأ', result.error, 'error');
        return;
    }

    const offers = result.data;
    const providerInfo = OFFERWALL_LIST[provider];

    let html = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
            <div style="background: var(--dark-card); border-radius: var(--radius); max-width: 600px; width: 100%; padding: 24px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3><i class="fas ${providerInfo.icon}" style="color: ${providerInfo.color};"></i> ${providerInfo.name}</h3>
                    <button onclick="this.closest('div[style]').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                </div>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">${providerInfo.description}</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    offers.forEach(offer => {
        html += `
            <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4>${offer.title}</h4>
                    <p style="font-size: 12px; color: var(--text-secondary);">${offer.description}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: var(--secondary); font-weight: 700;">$${offer.reward.toFixed(2)}</span>
                    <button class="btn btn-success btn-sm" onclick="startOffer('${provider}', ${offer.id})">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += `
                </div>
                <button class="btn btn-secondary" style="margin-top: 16px; width: 100%;" onclick="this.closest('div[style]').remove()">إغلاق</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

window.startOffer = async function(provider, offerId) {
    if (!currentUser) {
        showToast('❌', 'يرجى تسجيل الدخول أولاً', 'error');
        return;
    }

    showToast('✅', `تم بدء العرض من ${provider}!`, 'success');

    const reward = 0.10;

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({
                balance: supabaseClient.rpc('increment_balance', { user_id: currentUser.id, amount: reward })
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        showToast('✅', `تم إضافة $${reward.toFixed(2)} إلى رصيدك!`, 'success');

        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
        }

        document.querySelector('div[style*="position: fixed"]')?.remove();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ خطأ', 'حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    }
};

window.loadOfferwall = loadOfferwall;
window.renderOfferwalls = renderOfferwalls;
window.showOfferwall = showOfferwall;

console.log('📢 نظام Offerwalls جاهز!');
