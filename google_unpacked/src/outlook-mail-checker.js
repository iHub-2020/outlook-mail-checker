/**
 * ================================================================
 * Outlook Mail Checker - Content Script
 * Version: 1.2.0
 * Author: Reyanmatic
 * Date: 2025-12-03
 * Description: Main logic for modifying Outlook interface.
 * Update: Version bump.
 * ================================================================
 */

'use strict';

// ==================== 全局变量 ====================
let startTimer = null;

// 默认设置
let hideLeftRail = true;
let hideTopIcons = true;
// [已移除] let hideFirstemailAd = true; 
let addEmailCalculator = true;
let emailCalculatorColor = '#C00000';
let alignTitle = true;
let addcustomBackground = true; // [保留] 背景图开关
// 默认背景图 (支持 GIF)
let customBackground = 'https://raw.githubusercontent.com/iHub-2020/outlook-mail-checker/main/google_unpacked/icons/banner_background.jpg';
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
             // [已修改] 不再需要注入隐藏广告的 CSS
             // injectCustomStyles(); 
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
    // [已移除] removeAdsAndUpgradeEmails(); 
    cleanTopBarIcons();
    emailCalculator(); 
    alignFolderTitle();
    backgroundChanger();
    topbarTransparencyChanger();
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
        // [已移除] case 'hideFirstemailAd': ...
        case 'addEmailCalculator': addEmailCalculator = val; emailCalculator(); break;
        case 'emailCalculatorColor': emailCalculatorColor = val; emailCalculator(); break;
        case 'alignTitle': alignTitle = val; alignFolderTitle(); break;
        case 'addcustomBackground': addcustomBackground = val; backgroundChanger(); break;
        case 'customBackground': customBackground = val; backgroundChanger(); break;
        case 'topbarTransparency': topbarTransparency = val; topbarTransparencyChanger(); break;
    }
})

const loadVariables = (value) => {
    // [已移除] hideFirstemailAd = value.hideFirstemailAd ?? hideFirstemailAd;
    hideLeftRail = value.hideLeftRail ?? hideLeftRail;
    hideTopIcons = value.hideTopIcons ?? hideTopIcons;
    addEmailCalculator = value.addEmailCalculator ?? addEmailCalculator;
    alignTitle = value.alignTitle ?? alignTitle;
    addcustomBackground = value.addcustomBackground ?? addcustomBackground;
    customBackground = value.customBackground ?? customBackground;
    topbarTransparency = value.topbarTransparency ?? topbarTransparency;
    emailCalculatorColor = value.emailCalculatorColor || '#C00000';
}

// ==================== [已移除] CSS 辅助 ====================
// 原 injectCustomStyles 函数主要用于隐藏广告 rail，现已移除。
// 如果未来需要其他全局 CSS，可重新启用。

// ==================== [已移除] 核心：强力删除广告 ====================
// 原 removeAdsAndUpgradeEmails 函数已彻底删除。

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
        // [逻辑保留] 只有当开关打开 (addcustomBackground) 且有 URL 时才应用
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
