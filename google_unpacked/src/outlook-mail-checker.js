/**
 * ================================================================
 * Outlook Mail Checker - Content Script
 * Version: 1.0.3
 * Author: Reyanmatic
 * Date: 2025-12-02
 * Description: Main logic for modifying Outlook interface.
 * ================================================================
 */

'use strict';

// ==================== 全局变量 ====================
let startTimer = null;

// 默认设置
let hideLeftRail = true;
let hideTopIcons = true;
let hideFirstemailAd = true;
let addEmailCalculator = true;
let emailCalculatorColor = '#C00000';
let alignTitle = true;
let addcustomBackground = true;
// 默认背景图 (支持 GIF)
let customBackground = 'https://raw.githubusercontent.com/iHub-2020/outlook-mail-checker/main/google_unpacked/icons/background_stars.jpg';
let topbarTransparency = true;

// ==================== 初始化 ====================
const start = async () => {
    if (document.body) {
        const value = await new Promise(resolve => {
            chrome.storage.local.get(null, value => resolve(value));
        });
        loadVariables(value);
        
        if (document.querySelector('[role="navigation"]')) {
             clearInterval(startTimer);
             injectCustomStyles(); 
        }

        runAllChecks();
        setInterval(runAllChecks, 1000); 

        document.addEventListener('click', () => {
            setTimeout(runAllChecks, 500);
        });
    }
}

const runAllChecks = () => {
    cleanLeftRail();
    removeAdsAndUpgradeEmails(); 
    cleanTopBarIcons();
    emailCalculator(); 
    alignFolderTitle();
    backgroundChanger();
    topbarTransparencyChanger();
    // [已删除] addSupportAndRate(); 
}

startTimer = setInterval(start, 500);

// ==================== 存储监听 ====================
chrome.storage.onChanged.addListener(function (changes) {
    const key = Object.keys(changes)[0];
    if (!changes[key]) return;
    const val = changes[key].newValue;

    switch (key) {
        case 'hideLeftRail': hideLeftRail = val; cleanLeftRail(); break;
        case 'hideTopIcons': hideTopIcons = val; cleanTopBarIcons(); break;
        case 'hideFirstemailAd': hideFirstemailAd = val; removeAdsAndUpgradeEmails(); injectCustomStyles(); break;
        case 'addEmailCalculator': addEmailCalculator = val; emailCalculator(); break;
        case 'emailCalculatorColor': emailCalculatorColor = val; emailCalculator(); break;
        case 'alignTitle': alignTitle = val; alignFolderTitle(); break;
        case 'addcustomBackground': addcustomBackground = val; backgroundChanger(); break;
        case 'customBackground': customBackground = val; backgroundChanger(); break;
        case 'topbarTransparency': topbarTransparency = val; topbarTransparencyChanger(); break;
        // [已删除] case 'supportAndRateButton': ...
    }
})

const loadVariables = (value) => {
    hideFirstemailAd = value.hideFirstemailAd ?? hideFirstemailAd;
    hideLeftRail = value.hideLeftRail ?? hideLeftRail;
    hideTopIcons = value.hideTopIcons ?? hideTopIcons;
    addEmailCalculator = value.addEmailCalculator ?? addEmailCalculator;
    alignTitle = value.alignTitle ?? alignTitle;
    addcustomBackground = value.addcustomBackground ?? addcustomBackground;
    customBackground = value.customBackground ?? customBackground;
    topbarTransparency = value.topbarTransparency ?? topbarTransparency;
    // [已删除] supportAndRateButton
    emailCalculatorColor = value.emailCalculatorColor || '#C00000';
}

// ==================== CSS 辅助 ====================
const injectCustomStyles = () => {
    const styleId = 'outlook-plus-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    if (hideFirstemailAd) {
        styleEl.textContent = `
            #OwaContainer, [data-test-id="ad-rail"], ._1_... { display: none !important; }
        `;
    } else {
        styleEl.textContent = '';
    }
};

// ==================== 核心：强力删除广告 ====================
const removeAdsAndUpgradeEmails = () => {
    if (!hideFirstemailAd) return;

    const mailList = document.querySelector('[role="listbox"]') || document.getElementById('MainModule');
    if (!mailList) return;

    const rows = mailList.querySelectorAll('[role="option"], [draggable="true"]');

    rows.forEach(row => {
        if (row.style.display === 'none') return;

        const text = row.innerText || "";
        let isAd = false;

        if (text.includes("Upgrade Your Account") || 
            text.includes("升级你的帐户") || 
            text.includes("Get the latest premium")) {
            isAd = true;
        }

        if (!isAd) {
            const spans = row.querySelectorAll('span, div');
            for (let span of spans) {
                const spanText = span.innerText.trim();
                if ((spanText === "Ad" || spanText === "广告") && spanText.length === text.length) {
                }
                if (/^(Ad|广告)$/.test(spanText)) {
                    if (row.getAttribute('aria-label')?.includes('Upgrade') || text.includes('Microsoft')) {
                        isAd = true;
                        break;
                    }
                    if (text.includes("Microsoft Outlook")) {
                         isAd = true;
                         break;
                    }
                }
            }
        }

        if (isAd) {
            row.style.display = 'none';
            row.style.visibility = 'hidden';
            row.setAttribute('data-outlook-plus-hidden', 'true');
        }
    });

    const topBanners = document.querySelectorAll('div[aria-label*="Upgrade"], div[aria-label*="升级"]');
    topBanners.forEach(banner => {
        if (banner.getAttribute('role') !== 'button' && !banner.querySelector('input')) {
            banner.style.display = 'none';
        }
    });
}

// ==================== 计数器与颜色 ====================
const emailCalculator = () => {
    if (window.location.href.includes("calendar")) return;
    
    if (!addEmailCalculator) {
        updateBadge(0);
        return;
    }

    let unreadCount = 0;
    const titleMatch = document.title.match(/\((\d+)\)/);
    if (titleMatch) {
        unreadCount = parseInt(titleMatch[1]);
    } else {
        const folders = document.querySelectorAll('[title*="Inbox"], [title*="收件箱"]');
        for (let folder of folders) {
            const container = folder.closest('div[role="treeitem"]');
            if (container) {
                const countEl = container.querySelector('.screenReaderOnly, span:last-child'); 
                if (countEl) {
                    const match = countEl.innerText.match(/(\d+)/);
                    if (match) {
                        unreadCount = parseInt(match[1]);
                        break;
                    }
                }
            }
        }
    }
    updateBadge(unreadCount);
};

const updateBadge = (count) => {
    try {
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            text: count > 0 ? String(count) : '',
            color: emailCalculatorColor
        });
    } catch (e) {}
}

// ==================== UI 清理 ====================
const cleanLeftRail = () => {
    const leftRail = document.getElementById('LeftRail');
    if (leftRail) leftRail.style.display = hideLeftRail ? 'none' : 'block';
}

const alignFolderTitle = () => {
    if (!alignTitle) return;
    const headers = document.querySelectorAll('[role="heading"]');
    headers.forEach(header => {
        header.style.paddingLeft = '0px';
    });
}

const cleanTopBarIcons = () => {
    const selectors = ['[id*="MeetNow"]', '[id*="teams_container"]', '[id*="NoteFeed"]', '[id*="Skype"]'];
    selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.style.display = hideTopIcons ? 'none' : 'flex';
    });
};

const backgroundChanger = () => {
    const backgroundNav = document.getElementById('O365_NavHeader') || document.querySelector('.o365sx-navbar') || document.querySelector('[role="banner"]');
    if (backgroundNav) {
        if (addcustomBackground && customBackground) {
            backgroundNav.style.setProperty('background-image', `url("${customBackground}")`, 'important');
            backgroundNav.style.backgroundPosition = 'center';
            backgroundNav.style.backgroundSize = 'cover';
        } else {
            backgroundNav.style.backgroundImage = '';
        }
    }
}

const topbarTransparencyChanger = () => {
    const header = document.getElementById('O365_NavHeader') || document.querySelector('.o365sx-navbar') || document.querySelector('[role="banner"]');
    if (header) {
        if (topbarTransparency) {
            header.style.backgroundColor = 'rgba(0,0,0,0.2)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.backgroundColor = '';
            header.style.backdropFilter = '';
        }
    }
}
