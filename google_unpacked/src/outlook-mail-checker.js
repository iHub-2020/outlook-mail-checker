/**
 * ================================================================
 * Outlook Mail Checker - Content Script
 * ================================================================
 * Version: 1.0.0
 * Author: reyanmatic
 * Description: 清理广告、邮件计数、主题美化等核心功能
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
let customBackground = '';
let topbarTransparency = true;
let supportAndRateButton = true;

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
    removeAdsAndUpgradeEmails(); // 强力删除广告
    cleanTopBarIcons();
    emailCalculator(); 
    alignFolderTitle();
    backgroundChanger();
    topbarTransparencyChanger();
    addSupportAndRate();
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
        case 'supportAndRateButton': supportAndRateButton = val; addSupportAndRate(); break;
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
    supportAndRateButton = value.supportAndRateButton ?? supportAndRateButton;
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
        // 辅助 CSS，隐藏常见的广告容器 ID
        // 注意：这里只隐藏已知的静态ID，动态列表中的广告由JS处理
        styleEl.textContent = `
            #OwaContainer, [data-test-id="ad-rail"], ._1_... { display: none !important; }
        `;
    } else {
        styleEl.textContent = '';
    }
};

// ==================== 核心：强力删除广告 (优化版) ====================
const removeAdsAndUpgradeEmails = () => {
    if (!hideFirstemailAd) return;

    // 策略变更：不要使用 remove()，因为这会破坏 Outlook 的虚拟列表索引，导致功能失效。
    // 必须使用 style.display = 'none' 来隐藏。

    // 1. 查找所有邮件行 (role="option" 或 draggable="true")
    // 限制在主模块中查找，提高性能
    const mailList = document.querySelector('[role="listbox"]') || document.getElementById('MainModule');
    if (!mailList) return;

    // 获取当前视图中的所有行
    const rows = mailList.querySelectorAll('[role="option"], [draggable="true"]');

    rows.forEach(row => {
        // 如果已经隐藏了，跳过检查，节省性能
        if (row.style.display === 'none') return;

        const text = row.innerText || "";
        
        // 2. 特征识别：根据截图中的广告特征
        // 特征 A: 包含 "Ad" 或 "广告" 的独立小标签
        // 特征 B: 包含 "Upgrade Your Account" 或 "升级你的帐户"
        // 特征 C: 包含 "Microsoft Outlook" 作为发件人且带有推广语
        
        let isAd = false;

        // 检查关键词
        if (text.includes("Upgrade Your Account") || 
            text.includes("升级你的帐户") || 
            text.includes("Get the latest premium")) {
            isAd = true;
        }

        // 检查 "Ad" 徽标 (更精确的检查)
        if (!isAd) {
            const spans = row.querySelectorAll('span, div');
            for (let span of spans) {
                // 只有两个字母 "Ad" 或 "广告"，且通常带有边框（可以通过长度判断）
                const spanText = span.innerText.trim();
                if ((spanText === "Ad" || spanText === "广告") && spanText.length === text.length) {
                    // 如果整行只有 Ad 两个字，那肯定是错的，这里指子元素
                }
                // 检查是否是那个小小的 Ad 框
                if (/^(Ad|广告)$/.test(spanText)) {
                    // 再次确认上下文，避免误伤正文中包含 "Ad" 的邮件
                    // 广告行的结构通常比较简单，或者 aria-label 包含 Upgrade
                    if (row.getAttribute('aria-label')?.includes('Upgrade') || text.includes('Microsoft')) {
                        isAd = true;
                        break;
                    }
                    
                    // 针对截图中的样式：Ad 旁边通常紧挨着 Microsoft Outlook
                    if (text.includes("Microsoft Outlook")) {
                         isAd = true;
                         break;
                    }
                }
            }
        }

        // 3. 执行隐藏 (而不是删除)
        if (isAd) {
            row.style.display = 'none'; // 关键修改：隐藏而非删除
            row.style.visibility = 'hidden'; // 双重保险
            row.setAttribute('data-outlook-plus-hidden', 'true'); // 标记已处理
        }
    });

    // 4. 处理顶部横幅 (Banner)
    const topBanners = document.querySelectorAll('div[aria-label*="Upgrade"], div[aria-label*="升级"]');
    topBanners.forEach(banner => {
        // 排除按钮
        if (banner.getAttribute('role') !== 'button' && !banner.querySelector('input')) {
            banner.style.display = 'none'; // 同样改为隐藏
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
    // 优先从网页标题获取，最准确
    const titleMatch = document.title.match(/\((\d+)\)/);
    if (titleMatch) {
        unreadCount = parseInt(titleMatch[1]);
    } else {
        // 备用：查找左侧树
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
    const backgroundNav = document.getElementById('O365_NavHeader') || document.querySelector('.o365sx-navbar');
    if (backgroundNav) {
        if (addcustomBackground && customBackground) {
            backgroundNav.style.backgroundImage = `url("${customBackground}")`;
            backgroundNav.style.backgroundPosition = 'center';
            backgroundNav.style.backgroundSize = 'cover';
        } else {
            backgroundNav.style.backgroundImage = '';
        }
    }
}

const topbarTransparencyChanger = () => {
    const header = document.getElementById('O365_NavHeader') || document.querySelector('.o365sx-navbar');
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

// ==================== 支持按钮 ====================
const addSupportAndRate = () => {
    const btnId = 'custom-rate-btn';
    const existingBtn = document.getElementById(btnId);

    if (!supportAndRateButton) {
        if (existingBtn) existingBtn.style.display = 'none';
        return;
    }

    if (existingBtn) {
        existingBtn.style.display = 'flex';
        return;
    }

    const headerRegion = document.querySelector('.o365sx-rightNavbar') || document.getElementById('headerButtonsRegionId');
    if (headerRegion) {
        const div = document.createElement('div');
        div.id = btnId;
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.marginRight = '10px';
        div.style.cursor = 'pointer';
        
        const imgUrl = chrome.runtime.getURL('icons/stars_rating.png');
        
        div.innerHTML = `<a href="https://chromewebstore.google.com/" target="_blank" title="Rate Us">
            <img src="${imgUrl}" style="height: 20px; width: auto;" alt="Rate">
        </a>`;
        
        headerRegion.prepend(div);
    }
}
