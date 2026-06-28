// ==========================================================
// RewardHub - نظام الإعلانات (كامل)
// ==========================================================

function loadBannerAd(placement, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = REWARDHUB_CONFIG.bannerAds;
    let html = '';

    switch(placement) {
        case 'adsterra':
            if (config.adsterra.enabled) {
                html = config.adsterra.code || `
                    <div class="ad-banner adsterra-banner">
                        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2a2545;">
                            <p style="color: #8B6FE8; font-size: 14px; margin-bottom: 8px;">📢 إعلان مدعوم من Adsterra</p>
                            <div style="background: #252040; padding: 20px; border-radius: 8px; min-height: 90px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: #6B6599;">[مساحة إعلان Adsterra - ضع كودك هنا]</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        case 'adsense':
            if (config.adsense.enabled) {
                html = config.adsense.code || `
                    <div class="ad-banner adsense-banner">
                        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2a2545;">
                            <p style="color: #00D4FF; font-size: 14px; margin-bottom: 8px;">📢 إعلان من Google</p>
                            <div style="background: #252040; padding: 20px; border-radius: 8px; min-height: 90px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: #6B6599;">[مساحة إعلان Google AdSense - ضع كودك هنا]</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        default:
            html = `
                <div class="ad-banner default-banner">
                    <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2a2545;">
                        <p style="color: var(--text-secondary);">📢 مساحة إعلانية</p>
                        <div style="background: #252040; padding: 20px; border-radius: 8px; min-height: 90px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #6B6599;">ضع كود الإعلان هنا</span>
                        </div>
                    </div>
                </div>
            `;
    }

    container.innerHTML = html;
}

function loadVideoAd(placement, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = REWARDHUB_CONFIG.videoAds;
    let html = '';

    switch(placement) {
        case 'adsterra':
            if (config.adsterraVideo.enabled) {
                html = config.adsterraVideo.code || `
                    <div class="video-ad-container">
                        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2a2545;">
                            <p style="color: #8B6FE8; font-size: 14px; margin-bottom: 8px;">🎬 إعلان فيديو مدعوم من Adsterra</p>
                            <div style="background: #000; border-radius: 8px; min-height: 200px; display: flex; align-items: center; justify-content: center; position: relative;">
                                <span style="color: #6B6599;">[مساحة إعلان فيديو Adsterra - ضع كودك هنا]</span>
                            </div>
                            <button onclick="claimVideoReward()" class="btn btn-success btn-sm" style="margin-top: 12px;">
                                <i class="fas fa-gift"></i> احصل على المكافأة (0.002$)
                            </button>
                        </div>
                    </div>
                `;
            }
            break;
        default:
            html = `
                <div class="video-ad-container">
                    <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2a2545;">
                        <p style="color: var(--text-secondary);">🎬 إعلان فيديو</p>
                        <div style="background: #000; border-radius: 8px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #6B6599;">ضع كود إعلان الفيديو هنا</span>
                        </div>
                        <button onclick="claimVideoReward()" class="btn btn-success btn-sm" style="margin-top: 12px;">
                            <i class="fas fa-gift"></i> احصل على المكافأة (0.002$)
                        </button>
                    </div>
                </div>
            `;
    }

    container.innerHTML = html;
}

async function claimVideoReward() {
    if (!currentUser) {
        showToast('❌', 'يرجى تسجيل الدخول أولاً', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({
                balance: supabaseClient.rpc('increment_balance', { user_id: currentUser.id, amount: 0.002 })
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        await logUserActivity(currentUser.id, 'video_ad_watched', { reward: 0.002 });

        showToast('✅', 'تم إضافة 0.002$ إلى رصيدك!', 'success');

        const profileResult = await getUserProfile(currentUser.id);
        if (profileResult.success) {
            userProfile = profileResult.data;
            userBalanceDisplay.textContent = '$' + parseFloat(userProfile.balance || 0).toFixed(2);
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ خطأ', 'حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    }
}

window.loadBannerAd = loadBannerAd;
window.loadVideoAd = loadVideoAd;
window.claimVideoReward = claimVideoReward;

console.log('📢 نظام الإعلانات جاهز!');
