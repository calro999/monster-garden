// ads-config.js
const ADS_CONFIG = {
    // 左側バナーの設定
    left: {
        imageUrl: "/golden-panda300.png", // 160x600推奨
        linkUrl: "https://record.discasinoaffiliates.com/_R757TaLb9LkdIqIeVhNpQ2Nd7ZgqdRLk/1/?pg=0",
        altText: "Golden Pandaでお試しプレイ！"
    },
    // 右側バナーの設定
    right: {
        imageUrl: "/calro.png",
        linkUrl: "https://x.com/calro_shorts",
        altText: "お問い合わせは（@calro_shorts）こちら"
    }
};

// バナーをHTMLに流し込む処理
function loadSideAds() {
    const leftContainer = document.getElementById('ad-side-left');
    const rightContainer = document.getElementById('ad-side-right');

    if (leftContainer) {
        leftContainer.innerHTML = `<a href="${ADS_CONFIG.left.linkUrl}" target="_blank" rel="nofollow">
            <img src="${ADS_CONFIG.left.imageUrl}" alt="${ADS_CONFIG.left.altText}" style="width:100%; border-radius:8px;">
        </a>`;
    }
    if (rightContainer) {
        rightContainer.innerHTML = `<a href="${ADS_CONFIG.right.linkUrl}" target="_blank" rel="nofollow">
            <img src="${ADS_CONFIG.right.imageUrl}" alt="${ADS_CONFIG.right.altText}" style="width:100%; border-radius:8px;">
        </a>`;
    }
}

// 実行
document.addEventListener('DOMContentLoaded', loadSideAds);