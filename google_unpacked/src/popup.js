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

// ==================== 版本检查 ====================
function scrapeAddonVersion(actualVersion, translatedMessage) {
	fetch('https://api.github.com/repos/reyanmatic/Outlook-Mail-Checker/releases/latest')
	.then(response => response.json()) 
	.then(data => {
		const newVersion = data.tag_name.replace('v', '');
		const newVersionUrl = data.html_url;
		const divNewVersion = document.querySelector('.linkNewVersion');

		if (newVersion !== actualVersion) {
			divNewVersion.style.display = 'flex';
			divNewVersion.href = newVersionUrl;
			document.querySelector('.newVersion').textContent = `🔔 ${translatedMessage} v${newVersion}`;
		} else {
			divNewVersion.style.display = 'none';
		}
	})
	.catch(error => {
		console.error('Version not found : ', error);
	});
}

// ==================== 颜色选择器 ====================
const colorChecker = (ms = 100) => {
	const findColorInput = () => {
		const textInput = document.getElementById('emailcalculatorcolorInput');
		const colorInput = document.getElementById('emailcalculatorcolortypeInput');

		if (textInput) {
			textInput.addEventListener('input', function (event) {
				chrome.storage.local.set({ emailCalculatorColor: event.target.value });
				colorInput.style.backgroundColor = event.target.value;
			});
		
			textInput.addEventListener('change', function (event) {
				chrome.storage.local.set({ emailCalculatorColor: event.target.value });
				colorInput.style.backgroundColor = event.target.value;
			});

			colorInput.style.backgroundColor = textInput.value;
			clearInterval(timer);
		}
	}
	const timer = setInterval(findColorInput, ms);
}

// ==================== 更新输入元素 ====================
const updateInputElement = (id, storageKey) => {
	const inputElement = document.getElementById(id);

	if (inputElement) {
		chrome.storage.local.get([storageKey], function (value) {
			if (value[storageKey] !== undefined) {
				if (inputElement.type === 'checkbox') {
					inputElement.checked = value[storageKey];
				} else {
					inputElement.value = value[storageKey];
				}

				inputElement.addEventListener('input', function (e) {
					const newValue = inputElement.type === 'checkbox' ? e.target.checked : e.target.value;
					chrome.storage.local.set({ [storageKey]: newValue });
				});
			}
		});
	}
}

// ==================== 页面加载 ====================
window.onload = function() {
	// 更新输入元素
	updateInputElement('hideleftbannerInput', 'hideLeftRail');
	updateInputElement('hidetopiconsInput', 'hideTopIcons');
	updateInputElement('hidefirstemailadInput', 'hideFirstemailAd');                        
	colorChecker();
	updateInputElement('addemailcalculatorInput', 'addEmailCalculator');
	updateInputElement('emailcalculatorcolorInput', 'emailCalculatorColor');
	updateInputElement('emailcalculatorcolortypeInput', 'emailCalculatorColor');
	updateInputElement('addaligntitlefolderInput', 'alignTitle');
	updateInputElement('addcustomBackgroundInput', 'addcustomBackground');
	updateInputElement('customBackgroundInput', 'customBackground');
	updateInputElement('addtransparencytobarInput', 'topbarTransparency');
	updateInputElement('addsupportandratebuttonInput', 'supportAndRateButton');

	// 国际化文本
	document.getElementById('ads_title_text').textContent = chrome.i18n.getMessage('ads_text');
	document.getElementById('hide_left_rail_text').textContent = chrome.i18n.getMessage('cfg_hide_left_rail');
	document.getElementById('hide_top_icons_text').textContent = chrome.i18n.getMessage('cfg_hide_top_icons');
	document.getElementById('extras_title_text').textContent = chrome.i18n.getMessage('extras_text');
	document.getElementById('email_counter_text').textContent = chrome.i18n.getMessage('cfg_email_counter');
	document.getElementById('align_title_text').textContent = chrome.i18n.getMessage('cfg_align_title_folder');
	document.getElementById('custom_background_text').textContent = chrome.i18n.getMessage('cfg_custom_background');
	document.getElementById('transparency_topbar_text').textContent = chrome.i18n.getMessage('cfg_transparency_topbar');
	document.getElementById('support_rate_topbar_text').textContent = chrome.i18n.getMessage('cfg_support_rate_topbar');
	document.getElementById('topButtonsCalendar_text').textContent = chrome.i18n.getMessage('cfg_open_calendar');
	document.getElementById('topButtonsOutlook_text').textContent = chrome.i18n.getMessage('cfg_open_outlook');
	document.getElementById('hide_firstemail_ad_text').textContent = chrome.i18n.getMessage('cfg_hide_firstemail_ad');

	// 显示版本
	let manifestData = chrome.runtime.getManifest();
	document.querySelector('.extVersion').textContent = `v${manifestData.version}`;

	// 检查新版本
	scrapeAddonVersion(manifestData.version, chrome.i18n.getMessage('cfg_new_version'));
	setInterval(() => {
		scrapeAddonVersion(manifestData.version, chrome.i18n.getMessage('cfg_new_version'));
	}, 12 * 60 * 60 * 1000);

	// 评分链接
	document.querySelector('.rating').href = 'https://github.com/reyanmatic/Outlook-Mail-Checker/issues';
};
