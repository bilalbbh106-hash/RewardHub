// ==========================================================
// RewardHub - ملف الإعدادات (كامل)
// ==========================================================

const REWARDHUB_CONFIG = {
    // ===== Supabase =====
    supabase: {
        url: 'https://your-project-id.supabase.co',
        anonKey: 'your-anon-key-here'
    },

    // ===== شركات الإعلانات (Banner Ads) =====
    bannerAds: {
        adsterra: {
            enabled: true,
            code: '<!-- كود إعلان Adsterra هنا -->',
            placementId: 'YOUR_ADSTERRA_PLACEMENT_ID'
        },
        adsense: {
            enabled: false,
            code: '<!-- كود إعلان Google AdSense هنا -->',
            clientId: 'ca-pub-xxxxxxxxxxxxxxxx'
        },
        propeller: {
            enabled: false,
            code: '<!-- كود إعلان PropellerAds هنا -->',
            zoneId: 'YOUR_PROPELLER_ZONE_ID'
        }
    },

    // ===== إعلانات الفيديو =====
    videoAds: {
        adsterraVideo: {
            enabled: true,
            code: '<!-- كود إعلان فيديو Adsterra هنا -->',
            placementId: 'YOUR_ADSTERRA_VIDEO_PLACEMENT'
        },
        unity: {
            enabled: false,
            gameId: 'YOUR_UNITY_GAME_ID',
            placementId: 'rewardedVideo'
        }
    },

    // ===== Offerwalls =====
    offerwalls: {
        tapjoy: { enabled: false, apiKey: 'YOUR_TAPJOY_API_KEY', url: 'https://api.tapjoy.com/v1' },
        offertoro: { enabled: false, apiKey: 'YOUR_OFFERTORO_API_KEY', url: 'https://api.offertoro.com' },
        cpx: { enabled: false, apiKey: 'YOUR_CPX_API_KEY', url: 'https://api.cpx-research.com' },
        adgate: { enabled: false, apiKey: 'YOUR_ADGATE_API_KEY', url: 'https://api.adgatemediagroup.com' },
        adgem: { enabled: false, apiKey: 'YOUR_ADGEM_API_KEY', url: 'https://api.adgem.com' },
        lootably: { enabled: false, apiKey: 'YOUR_LOOTABLY_API_KEY', url: 'https://api.lootably.com' },
        ayet: { enabled: false, apiKey: 'YOUR_AYET_API_KEY', url: 'https://api.ayetstudios.com' },
        revu: { enabled: false, apiKey: 'YOUR_REVU_API_KEY', url: 'https://api.revu.com' },
        timewall: { enabled: false, apiKey: 'YOUR_TIMEWALL_API_KEY', url: 'https://api.timewall.com' },
        bitlabs: { enabled: false, apiKey: 'YOUR_BITLABS_API_KEY', url: 'https://api.bitlabs.com' },
        monlix: { enabled: false, apiKey: 'YOUR_MONLIX_API_KEY', url: 'https://api.monlix.com' }
    },

    // ===== Crypto Faucets =====
    faucets: {
        faucetpay: { enabled: false, apiKey: 'YOUR_FAUCETPAY_API_KEY', url: 'https://faucetpay.io/api/v1' },
        freebitcoin: { enabled: false, apiKey: 'YOUR_FREEBITCOIN_API_KEY', url: 'https://freebitco.in/api' },
        cointiply: { enabled: false, apiKey: 'YOUR_COINTIPLY_API_KEY', url: 'https://cointiply.com/api' },
        pipeflare: { enabled: false, apiKey: 'YOUR_PIPEFLARE_API_KEY', url: 'https://pipeflare.io/api' },
        allcoins: { enabled: false, apiKey: 'YOUR_ALLCOINS_API_KEY', url: 'https://allcoins.pw/api' }
    },

    // ===== Smart Links =====
    smartLinks: {
        linkvertise: { enabled: false, apiKey: 'YOUR_LINKVERTISE_API_KEY', url: 'https://api.linkvertise.com' },
        lootlinks: { enabled: false, apiKey: 'YOUR_LOOTLINKS_API_KEY', url: 'https://api.lootlinks.com' }
    }
};

window.REWARDHUB_CONFIG = REWARDHUB_CONFIG;

console.log('⚙️ ملف الإعدادات جاهز!');
