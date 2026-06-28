// ==========================================================
// RewardHub - Crypto Faucets (كامل)
// ==========================================================

const FAUCET_LIST = [
    { id: 'faucetpay', name: 'FaucetPay', icon: 'fa-wallet', color: '#00D4FF', currency: 'BTC, ETH, USDT', description: 'أشهر منصة للصنابير', url: 'https://faucetpay.io' },
    { id: 'freebitcoin', name: 'FreeBitcoin', icon: 'fa-bitcoin', color: '#FFD700', currency: 'BTC', description: 'احصل على Bitcoin مجاناً', url: 'https://freebitco.in' },
    { id: 'cointiply', name: 'Cointiply', icon: 'fa-coins', color: '#00E676', currency: 'BTC, DOGE', description: 'صنابير متعددة العملات', url: 'https://cointiply.com' },
    { id: 'pipeflare', name: 'PipeFlare', icon: 'fa-fire', color: '#FF6B35', currency: 'ZEC, BTC', description: 'صنابير سريعة', url: 'https://pipeflare.io' },
    { id: 'allcoins', name: 'AllCoins', icon: 'fa-coins', color: '#9C27B0', currency: 'BTC, LTC, DOGE', description: 'مجموعة صنابير', url: 'https://allcoins.pw' }
];

function renderFaucets(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
        <h3 style="margin-bottom: 16px;">💰 صنابير العملات الرقمية</h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">احصل على عملات رقمية مجانية من هذه المواقع</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
    `;

    FAUCET_LIST.forEach(faucet => {
        const config = REWARDHUB_CONFIG.faucets[faucet.id];
        const isEnabled = config ? config.enabled : false;

        html += `
            <div class="card" style="padding: 20px; ${!isEnabled ? 'opacity: 0.5;' : ''}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas ${faucet.icon}" style="font-size: 32px; color: ${faucet.color};"></i>
                    <div>
                        <h4>${faucet.name}</h4>
                        <p style="font-size: 12px; color: var(--text-secondary);">${faucet.currency}</p>
                    </div>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 8px 0;">${faucet.description}</p>
                ${isEnabled ? `
                    <a href="${faucet.url}" target="_blank" class="btn btn-primary btn-sm" style="width: 100%;">
                        <i class="fas fa-external-link-alt"></i> زيارة الصنبور
                    </a>
                ` : `
                    <span class="badge badge-danger">غير مفعل</span>
                `}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

window.renderFaucets = renderFaucets;
window.FAUCET_LIST = FAUCET_LIST;

console.log('💰 نظام الصنابير جاهز!');
