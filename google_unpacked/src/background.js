/**
 * ================================================================
 * Outlook Mail Checker - Background Script
 * Version: 1.2.0
 * Author: Reyanmatic
 * Date: 2025-12-03
 * Description: Background service worker for mail checking & alarms.
 * Update: Added file header & version bump.
 * ================================================================
 */

'use strict';

// ==================== 全局变量 ====================
let cachedUnreadCount = 0;
let cachedColor = '#C00000';

// ==================== 初始化 ====================
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Outlook Plus] 插件已安装/更新');
    
    // 创建定时器（每5分钟检查一次）
    chrome.alarms.create('checkUnreadMail', { 
        delayInMinutes: 1,  // 1分钟后首次执行
        periodInMinutes: 5  // 之后每5分钟执行
    });
    
    // 从存储中恢复上次的计数
    restoreBadgeFromCache();
});

// 浏览器启动时恢复
chrome.runtime.onStartup.addListener(() => {
    console.log('[Outlook Plus] 浏览器启动');
    restoreBadgeFromCache();
    
    // 立即检查一次
    setTimeout(checkUnreadCount, 2000);
});

// ==================== 定时器触发 ====================
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkUnreadMail') {
        console.log('[Outlook Plus] ⏰ 定时检查未读邮件');
        checkUnreadCount();
    }
});

// ==================== 接收来自 Content Script 的消息 ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        updateBadge(request.text, request.color);
    }
});

// ==================== 核心功能：检查未读邮件数 ====================
async function checkUnreadCount() {
    try {
        // 检查用户是否启用了计数器功能
        const settings = await chrome.storage.local.get(['addEmailCalculator', 'emailCalculatorColor']);
        
        if (settings.addEmailCalculator === false) {
            console.log('[Outlook Plus] 计数器已禁用');
            updateBadge('', settings.emailCalculatorColor || '#C00000');
            return;
        }
        
        cachedColor = settings.emailCalculatorColor || '#C00000';
        
        // 查找所有打开的 Outlook 标签页
        const tabs = await chrome.tabs.query({ 
            url: [
                'https://outlook.live.com/*',
                'https://outlook.office365.com/*',
                'https://outlook.office.com/*'
            ]
        });
        
        if (tabs.length > 0) {
            // 有打开的标签页，直接向 Content Script 请求数据
            console.log(`[Outlook Plus] 找到 ${tabs.length} 个 Outlook 标签页`);
            
            for (const tab of tabs) {
                try {
                    // 向该标签页发送消息，请求未读数
                    const response = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'getUnreadCount' 
                    });
                    
                    if (response && response.count !== undefined) {
                        console.log(`[Outlook Plus] 获取到未读数: ${response.count}`);
                        updateBadge(response.count > 0 ? String(response.count) : '', cachedColor);
                        return;
                    }
                } catch (e) {
                    console.warn(`[Outlook Plus] 标签页 ${tab.id} 未响应:`, e.message);
                }
            }
        } else {
            // 没有打开的标签页，使用缓存的数据
            console.log('[Outlook Plus] 无打开的标签页，使用缓存数据');
            restoreBadgeFromCache();
        }
        
    } catch (error) {
        console.error('[Outlook Plus] 检查未读邮件失败:', error);
    }
}

// ==================== 更新角标 ====================
function updateBadge(text, color) {
    cachedColor = color || cachedColor;
    
    // 更新角标
    chrome.action.setBadgeBackgroundColor({ color: cachedColor });
    chrome.action.setBadgeText({ text: text });
    
    // 强制白色字体
    if (chrome.action.setBadgeTextColor) {
        chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    }
    
    // 保存到缓存（下次启动时恢复）
    const count = text === '' ? 0 : parseInt(text) || 0;
    cachedUnreadCount = count;
    
    chrome.storage.local.set({ 
        'cachedUnreadCount': count,
        'cachedColor': cachedColor,
        'lastUpdateTime': Date.now()
    });
    
    console.log(`[Outlook Plus] 💌 角标已更新: ${text || '(空)'}, 颜色: ${cachedColor}`);
}

// ==================== 从缓存恢复 ====================
async function restoreBadgeFromCache() {
    const cache = await chrome.storage.local.get(['cachedUnreadCount', 'cachedColor', 'lastUpdateTime']);
    
    const count = cache.cachedUnreadCount || 0;
    const color = cache.cachedColor || '#C00000';
    const lastUpdate = cache.lastUpdateTime || 0;
    
    // 如果缓存超过1小时，则清空（避免显示过期数据）
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - lastUpdate > oneHour) {
        console.log('[Outlook Plus] 缓存已过期，清空角标');
        updateBadge('', color);
        return;
    }
    
    // 恢复缓存
    cachedUnreadCount = count;
    cachedColor = color;
    
    updateBadge(count > 0 ? String(count) : '', color);
    console.log(`[Outlook Plus] 🔄 已从缓存恢复: ${count} 封未读邮件`);
}
