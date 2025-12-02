/**
 * ============================================================================
 * 标题: Outlook Background Customizer (Style Injector)
 * 版本: 2.0.0
 * 作者: Reyanmatic
 * 日期: 2025-12-02
 * 描述: 
 *   此脚本作为 Content Script 运行在 Outlook 网页版中。
 *   它负责读取用户配置，动态注入 CSS 样式以修改页面背景图片和虚化效果。
 *   支持区分主界面与独立弹窗界面。
 * ============================================================================
 */

(function() {
    'use strict';

    // 定义常量，方便后续维护 CSS 类名或 ID
    const STYLE_ID = 'outlook-custom-bg-style';
    const OUTLOOK_MAIN_CONTAINER = '#app'; // Outlook 主容器通常是 #app，如果微软改版可能需要调整

    /**
     * 初始化函数
     */
    function init() {
        console.log('[Outlook Customizer] Style Injector v2.0.0 loaded.');
        
        // 监听存储变化，实现实时预览（用户在 popup 修改后无需刷新页面）
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                applyStyles();
            }
        });

        // 首次加载时应用样式
        applyStyles();
    }

    /**
     * 从 Storage 读取配置并生成 CSS
     */
    function applyStyles() {
        chrome.storage.local.get(['mainBgUrl', 'popupBgUrl', 'blurAmount'], (result) => {
            const mainBg = result.mainBgUrl || '';
            const popupBg = result.popupBgUrl || '';
            const blur = result.blurAmount || 0;

            // 判断当前是否为独立弹窗 (Outlook 独立窗口通常 URL 包含 /mail/deeplink 或 popout)
            const isPopout = window.location.href.includes('popout') || window.location.search.includes('view=modeless');
            
            // 确定当前应该使用的背景图
            const currentBg = isPopout ? (popupBg || mainBg) : mainBg;

            if (!currentBg) {
                // 如果没有设置背景图，移除自定义样式（恢复默认）
                removeCustomStyle();
                return;
            }

            const css = generateCSS(currentBg, blur);
            injectStyleTag(css);
        });
    }

    /**
     * 生成 CSS 字符串
     * @param {string} imageUrl - 背景图片 URL
     * @param {number} blurPx - 虚化像素值
     * @returns {string} - 完整的 CSS 字符串
     */
    function generateCSS(imageUrl, blurPx) {
        // 注意：这里使用了 ::before 伪元素覆盖在背景上，避免影响文字的可读性
        // 同时也尝试覆盖 Outlook 默认的白色/灰色背景层
        return `
            /* 强制背景透明，让 body 的背景显露出来 */
            body, #app, .ms-Fabric, .root-42, .app-container {
                background-color: transparent !important;
                background-image: none !important;
            }

            /* 设置全屏背景 */
            body::before {
                content: "";
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: -1; /* 放在最底层 */
                
                background-image: url('${imageUrl}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
                
                filter: blur(${blurPx}px);
                -webkit-filter: blur(${blurPx}px);
                
                /* 稍微加一点遮罩，防止背景太亮看不清文字 */
                opacity: 0.9; 
            }

            /* 针对阅读窗格和邮件列表，可能需要半透明背景以保证可读性 */
            /* 注意：这些类名可能会随 Outlook 更新而变化，需要定期检查 */
            div[role="listbox"], div[role="region"], .customScrollBar {
                background-color: rgba(255, 255, 255, 0.7) !important; /* 浅色模式下的半透明白 */
            }
            
            /* 适配深色模式 (Dark Mode) */
            @media (prefers-color-scheme: dark) {
                div[role="listbox"], div[role="region"], .customScrollBar {
                    background-color: rgba(0, 0, 0, 0.6) !important; /* 深色模式下的半透明黑 */
                }
            }
        `;
    }

    /**
     * 将 <style> 标签注入到 <head> 中
     * @param {string} cssContent 
     */
    function injectStyleTag(cssContent) {
        let styleEl = document.getElementById(STYLE_ID);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            document.head.appendChild(styleEl);
        }
        
        styleEl.textContent = cssContent;
        console.log('[Outlook Customizer] Styles updated.');
    }

    /**
     * 移除自定义样式
     */
    function removeCustomStyle() {
        const styleEl = document.getElementById(STYLE_ID);
        if (styleEl) {
            styleEl.remove();
            console.log('[Outlook Customizer] Styles removed.');
        }
    }

    // 启动脚本
    init();

})();