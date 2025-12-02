/**
 * ================================================================
 * Outlook Mail Checker - Popup Script
 * ================================================================
 * Version: 1.0.0
 * Author: reyanmatic
 * Description: 弹出窗口界面逻辑和版本检查
 * ================================================================
 */

'use strict';

// 本地字典，用于实时切换语言 (不依赖浏览器重启)
const i18nDict = {
    zh: {
        btn_open_outlook: "打开 Outlook",
        btn_open_calendar: "打开日历",
        section_ads: "广告拦截",
        lbl_hide_first_ad: "删除首封邮件广告 (升级提示)",
        lbl_hide_meet_icons: "隐藏 Meet, Teams, OneNote 图标",
        lbl_hide_left_rail: "隐藏左侧应用侧边栏",
        section_extras: "增强功能",
        lbl_email_counter: "未读邮件计数器及颜色",
        lbl_align_title: "左侧文件夹标题对齐",
        lbl_bg_theme: "顶栏背景图片 URL",
        lbl_transparency: "顶栏半透明效果",
        lbl_support_rate: "显示支持和评分按钮",
        footer_github: "GitHub",
        footer_rate: "评分"
    },
    en: {
        btn_open_outlook: "Open Outlook",
        btn_open_calendar: "Open Calendar",
        section_ads: "Ads Blocker",
        lbl_hide_first_ad: "Delete First Email Ad",
        lbl_hide_meet_icons: "Hide Meet, Teams icons",
        lbl_hide_left_rail: "Hide Left Rail",
        section_extras: "Extras",
        lbl_email_counter: "Email counter & Color",
        lbl_align_title: "Align folder title",
        lbl_bg_theme: "Background Theme URL",
        lbl_transparency: "Topbar transparency",
        lbl_support_rate: "Support and rating Button",
        footer_github: "GitHub",
        footer_rate: "Rate"
    }
};

document.addEventListener('DOMContentLoaded', function () {
    
    // ==================== 1. 状态管理与初始化 ====================
    
    // 默认值
    let currentLang = 'zh'; 
    let isDarkMode = false;

    // 从 storage 加载 UI 偏好 (语言和主题)
    chrome.storage.local.get(['uiLanguage', 'uiTheme'], (result) => {
        // 语言初始化
        if (result.uiLanguage) {
            currentLang = result.uiLanguage;
        } else {
            // 首次运行检测浏览器语言
            const navLang = navigator.language || navigator.userLanguage;
            currentLang = navLang.includes('zh') ? 'zh' : 'en';
        }
        applyLanguage(currentLang);

        // 主题初始化
        if (result.uiTheme === 'dark') {
            isDarkMode = true;
            document.body.classList.add('dark-mode');
            document.getElementById('toggle-theme').textContent = '☀️';
        }
    });

    // ==================== 2. 语言与主题切换逻辑 ====================

    // 语言切换
    const langBtn = document.getElementById('toggle-lang');
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        applyLanguage(currentLang);
        langBtn.textContent = currentLang === 'zh' ? '🇨🇳' : '🇺🇸';
        chrome.storage.local.set({ 'uiLanguage': currentLang });
    });
    // 初始化按钮图标
    langBtn.textContent = '🇨🇳'; // 默认为国旗，applyLanguage 会修正逻辑吗？不，这里简单处理即可，或者在load时设置

    // 主题切换
    const themeBtn = document.getElementById('toggle-theme');
    themeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeBtn.textContent = isDarkMode ? '☀️' : '🌙';
        chrome.storage.local.set({ 'uiTheme': isDarkMode ? 'dark' : 'light' });
    });

    function applyLanguage(lang) {
        const dict = i18nDict[lang];
        if (!dict) return;
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });
        
        // 更新按钮显示的国旗
        document.getElementById('toggle-lang').textContent = lang === 'zh' ? '🇨🇳' : '🇺🇸';
    }

    // ==================== 3. 链接跳转 ====================
    document.getElementById('open-outlook').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://outlook.live.com/mail/' });
        window.close();
    });

    document.getElementById('open-calendar').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://outlook.live.com/calendar/' });
        window.close();
    });

    // ==================== 4. 功能设置同步 ====================
    const checkboxIds = [
        'hideFirstemailAd',
        'hideTopIcons',
        'hideLeftRail',
        'addEmailCalculator',
        'alignTitle',
        'addcustomBackground',
        'topbarTransparency',
        'supportAndRateButton'
    ];

    chrome.storage.local.get(null, (result) => {
        // Checkboxes
        checkboxIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = result[id] !== undefined ? result[id] : true;
                element.addEventListener('change', (e) => {
                    chrome.storage.local.set({ [id]: e.target.checked });
                });
            }
        });

        // Color Input
        const colorInput = document.getElementById('emailcalculatorcolorInput');
        if (colorInput) {
            colorInput.value = result.emailCalculatorColor || '#C00000';
            colorInput.addEventListener('input', (e) => {
                chrome.storage.local.set({ 'emailCalculatorColor': e.target.value });
            });
        }

        // Background URL Input
        const bgInput = document.getElementById('customBackground');
        if (bgInput) {
            bgInput.value = result.customBackground || '';
            bgInput.addEventListener('input', (e) => {
                chrome.storage.local.set({ 'customBackground': e.target.value });
            });
        }
    });

    // ==================== 5. 版本号 ====================
    const manifestData = chrome.runtime.getManifest();
    const versionDiv = document.querySelector('.extVersion'); 
    if (versionDiv && manifestData.version) {
        versionDiv.textContent = `v${manifestData.version}`;
    }
});
