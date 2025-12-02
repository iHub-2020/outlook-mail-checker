/**
 * ================================================================
 * Outlook Mail Checker - Popup Script
 * Version: 1.2.0
 * Author: Reyanmatic
 * Date: 2025-12-03
 * Description: Script for handling popup interactions and settings.
 * Update: Version bump.
 * ================================================================
 */

'use strict';

const i18nDict = {
    zh: {
        btn_open_outlook: "打开 Outlook",
        btn_open_calendar: "打开日历",
        section_hides: "隐藏开关",
        // [已移除] lbl_hide_first_ad
        lbl_hide_meet_icons: "隐藏 Meet, Teams, OneNote 图标",
        lbl_hide_left_rail: "隐藏左侧应用侧边栏",
        section_extras: "增强功能",
        lbl_email_counter: "未读邮件计数器及颜色",
        lbl_align_title: "左侧文件夹标题对齐",
        lbl_bg_theme: "顶栏背景图片 URL (支持 GIF)", 
        lbl_transparency: "顶栏半透明效果",
        footer_github: "GitHub",
        footer_rate: "评分"
    },
    en: {
        btn_open_outlook: "Open Outlook",
        btn_open_calendar: "Open Calendar",
        section_hides: "Hide Switch",
        // [Removed] lbl_hide_first_ad
        lbl_hide_meet_icons: "Hide Meet, Teams icons",
        lbl_hide_left_rail: "Hide Left Rail",
        section_extras: "Extras",
        lbl_email_counter: "Email counter & Color",
        lbl_align_title: "Align folder title",
        lbl_bg_theme: "Background Theme URL (GIF supported)",
        lbl_transparency: "Topbar transparency",
        footer_github: "GitHub",
        footer_rate: "Rate"
    }
};

document.addEventListener('DOMContentLoaded', function () {
    
    // ==================== 1. 状态管理与初始化 ====================
    
    let currentLang = 'zh'; 
    let isDarkMode = false;

    chrome.storage.local.get(['uiLanguage', 'uiTheme'], (result) => {
        if (result.uiLanguage) {
            currentLang = result.uiLanguage;
        } else {
            const navLang = navigator.language || navigator.userLanguage;
            currentLang = navLang.includes('zh') ? 'zh' : 'en';
        }
        applyLanguage(currentLang);

        if (result.uiTheme === 'dark') {
            isDarkMode = true;
            document.body.classList.add('dark-mode');
            document.getElementById('toggle-theme').textContent = '☀️';
        }
    });

    // ==================== 2. 语言与主题切换逻辑 ====================

    const langBtn = document.getElementById('toggle-lang');
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        applyLanguage(currentLang);
        langBtn.textContent = currentLang === 'zh' ? '🇨🇳' : '🇺🇸';
        chrome.storage.local.set({ 'uiLanguage': currentLang });
    });
    langBtn.textContent = '🇨🇳'; 

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
        // [已移除] 'hideFirstemailAd', 
        'hideTopIcons',
        'hideLeftRail',
        'addEmailCalculator',
        'alignTitle',
        'addcustomBackground', // [保留] 这是你要求的背景图开关
        'topbarTransparency'
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
        const defaultBgUrl = 'https://raw.githubusercontent.com/iHub-2020/outlook-mail-checker/main/google_unpacked/icons/banner_background.png';
        
        if (bgInput) {
            bgInput.value = result.customBackground || defaultBgUrl;
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

