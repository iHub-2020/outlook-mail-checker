/**
 * ================================================================
 * Outlook Mail Checker - Background Service Worker
 * ================================================================
 * Version: 1.0.0
 * Author: reyanmatic
 * Description: 处理徽章更新和扩展消息通信
 * ================================================================
 */

'use strict';

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'updateBadge') {
		updateBadge(request.count, request.color, sender.tab.id);
	}
});

/**
 * 更新扩展图标徽章
 * @param {number} count - 未读邮件数量
 * @param {string} color - 徽章颜色
 * @param {number} tabId - 标签页ID
 */
function updateBadge(count = 0, color = 'green', tabId) {
	const badgeText = count > 0 ? String(count) : '';
	
	chrome.action.setBadgeText({ 
		text: badgeText, 
		tabId: tabId 
	});
	
	chrome.action.setBadgeBackgroundColor({ 
		color: color, 
		tabId: tabId 
	});
}

// 扩展安装时初始化存储
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.set({
		hideLeftRail: true,
		hideTopIcons: true,
		hideFirstemailAd: true,
		addEmailCalculator: true,
		emailCalculatorColor: 'green',
		alignTitle: true,
		addcustomBackground: true,
		customBackground: 'https://wallpapercave.com/wp/wp2757894.gif',
		topbarTransparency: true,
		supportAndRateButton: true
	});
});
