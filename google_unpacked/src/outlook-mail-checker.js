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

// 广告设置
let hideLeftRail = true;
let hideTopIcons = true;
let hideFirstemailAd = true;

// 功能设置
const regex = /\s\(\d+ emails\)/;
const regexEmail = /\s\(\d+ email\)/;
const defaultMs = 100;
let observer = null;
let emailsText = 'emails';
let addEmailCalculator = true;
let emailCalculatorColor = 'green';
let alignTitle = true;
let addcustomBackground = true;
let customBackground = 'https://wallpapercave.com/wp/wp2757894.gif';
let topbarTransparency = true;
let supportAndRateButton = true;

// ==================== 初始化 ====================
const start = async () => {
	if (document.getElementById('o365header') !== null) {
		const value = await new Promise(resolve => {
			chrome.storage.local.get(null, value => resolve(value));
		});
		loadVariables(value);
		clearInterval(startTimer);

		await Promise.all([
			cleanLeftRail(defaultMs),			
			cleanFirstEmailAd(300),
			emailCalculator(defaultMs),
			emailCalculatorReloader(defaultMs),
			resizeHandler(defaultMs),
			alignFolderTitle(defaultMs),
			emailFolderListeners(defaultMs),
			backgroundChanger(defaultMs),
			topbarTransparencyChanger(400)
		]);
	
		cleanTopBarIcons(300);
		addSupportAndRate(300);
		updateBadge();
	}
}

startTimer = setInterval(start, 200);

// ==================== 存储监听 ====================
chrome.storage.onChanged.addListener(function (changes) {
	const updatedElement = Object.keys(changes)[0];
	switch (updatedElement) {
		case 'hideLeftRail':
			hideLeftRail = changes.hideLeftRail.newValue;
			cleanLeftRail();
			break;
		case 'hideTopIcons':
			hideTopIcons = changes.hideTopIcons.newValue;
			cleanTopBarIcons();
			break;
		case 'hideFirstemailAd':
			hideFirstemailAd = changes.hideFirstemailAd.newValue;
			cleanFirstEmailAd();
			break;
		case 'addEmailCalculator':
			addEmailCalculator = changes.addEmailCalculator.newValue;
			emailCalculator();
			break;
		case 'emailCalculatorColor':
			emailCalculatorColor = changes.emailCalculatorColor.newValue;
			emailCalculator();
			updateBadge();
			break;
		case 'alignTitle':
			alignTitle = changes.alignTitle.newValue;
			alignFolderTitle();
			break;
		case 'addcustomBackground':
			addcustomBackground = changes.addcustomBackground.newValue;
			backgroundChanger();
			break;
		case 'customBackground':
			customBackground = changes.customBackground.newValue;
			backgroundChanger();
			break;
		case 'topbarTransparency':
			topbarTransparency = changes.topbarTransparency.newValue;
			topbarTransparencyChanger();
			break;
		case 'supportAndRateButton':
			supportAndRateButton = changes.supportAndRateButton.newValue;
			addSupportAndRate();
			break;
	}
})

// ==================== 配置加载 ====================
const loadVariables = (value) => {
	hideFirstemailAd = value.hideFirstemailAd === undefined ? hideFirstemailAd : value.hideFirstemailAd;
	hideLeftRail = value.hideLeftRail === undefined ? hideLeftRail : value.hideLeftRail;
	hideTopIcons = value.hideTopIcons === undefined ? hideTopIcons : value.hideTopIcons;
	addEmailCalculator = value.addEmailCalculator === undefined ? addEmailCalculator : value.addEmailCalculator;
	alignTitle = value.alignTitle === undefined ? alignTitle : value.alignTitle;
	addcustomBackground = value.addcustomBackground === undefined ? addcustomBackground : value.addcustomBackground;
	customBackground = value.customBackground === undefined ? customBackground : value.customBackground;
	topbarTransparency = value.topbarTransparency === undefined ? topbarTransparency : value.topbarTransparency;
	supportAndRateButton = value.supportAndRateButton === undefined ? supportAndRateButton : value.supportAndRateButton;

	if (typeof value.emailCalculatorColor === 'string') {
		emailCalculatorColor = value.emailCalculatorColor;
	}

	chrome.storage.local.set({
		hideLeftRail,
		hideFirstemailAd,
		hideTopIcons,
		addEmailCalculator,
		emailCalculatorColor,
		alignTitle,
		addcustomBackground,
		customBackground,
		topbarTransparency,
		supportAndRateButton
	});
}

// ==================== 响应式处理 ====================
const resizeHandler = () => {
	let executedOnce1050 = false;
	let executedOnce770 = false; 
	let executedOnce542 = false; 

	const resizeBreakpoints = () => {
		let windowWidth = window.innerWidth;

		if (windowWidth <= 1050 && !executedOnce1050) {
			topbarTransparencyChanger();
			cleanLeftRail();
			cleanTopBarIcons();
			executedOnce1050 = true;
		} else if (windowWidth > 1050 && executedOnce1050) {  
			topbarTransparencyChanger();
			cleanLeftRail();
			cleanTopBarIcons();
			executedOnce1050 = false;
		}

		if (windowWidth <= 770 && !executedOnce770) {
			alignFolderTitle();
			emailCalculator();
			executedOnce770 = true;
		} else if (windowWidth > 770 && executedOnce770) { 
			alignFolderTitle();
			emailCalculator();
			executedOnce770 = false;
		}

		if (windowWidth < 542 && !executedOnce542) {
			emailFolderListeners();
			executedOnce542 = true;
		} else if (windowWidth >= 542 && executedOnce542) {
			emailFolderListeners();
			executedOnce542 = false;
		}
	}

	window.addEventListener('resize', resizeBreakpoints);
	resizeBreakpoints();
}

// ==================== 邮件计数重载 ====================
const emailCalculatorReloader = () => {
	document.addEventListener('click', (e) => { 
		const clickedElement = e.target.parentNode.parentNode.parentNode;
		if (
			clickedElement.classList.contains('is-checked') ||
			clickedElement.id.startsWith('ok-') ||
			clickedElement.classList.contains('ac0xq') ||
			clickedElement.classList.contains('p4pwT') ||
			clickedElement.parentNode.classList.contains('BPfgd')
		) {
			emailCalculator();
			alignFolderTitle();
			updateBadge();
		}
	},{capture: true})
}

// ==================== 邮件计数器 ====================
const emailCalculator = (ms = 0) => {
	let counter = 0;

	const findFolder = () => {
		counter++;
		const folderTitle = document.querySelector('.jXaVF');
		const folderTitleText = folderTitle ? folderTitle.innerText : null;
		const numberOfEmailElement = document.querySelector('.wk4Sg');
		const emptyFolder = document.getElementById('EmptyState_MainMessage');

		if (window.location.href.includes("calendar")) {
			clearInterval(timer);
			return
		}

		if (emptyFolder) {
			if (regexEmail.test(folderTitleText)) {
				folderTitle.innerHTML = folderTitleText.replace(regexEmail, `<b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (0 ${emailsText.slice(0, -1)})</b>`);
			} else {
				folderTitle.innerHTML = `${folderTitleText} <b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (0 ${emailsText.slice(0, -1)})</b>`;
			}
			updateBadge(0);
			clearInterval(timer);
			return
		}

		if (folderTitle && numberOfEmailElement) {
			const numberOfEmail = parseInt(numberOfEmailElement.title.match(/-\s(\d+)/)[1]);
	
			if (!observer) {
				observer = new MutationObserver((mutationsList) => {
					for (const mutation of mutationsList) {
						if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
							emailCalculator();
							updateBadge();
						}
					}
				});
	
				observer.observe(numberOfEmailElement, { attributes: true });
			}

			if (numberOfEmail == 1) {
				if (regexEmail.test(folderTitleText)) {
					folderTitle.innerHTML = folderTitleText.replace(regexEmail, `<b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (${numberOfEmail} ${emailsText.slice(0, -1)})</b>`);
				} else {
					folderTitle.innerHTML = `${folderTitleText} <b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (${numberOfEmail} ${emailsText.slice(0, -1)})</b>`;
				}
				updateBadge(numberOfEmail);
				clearInterval(timer);
			}

			if (numberOfEmail > 1) {
				if (regex.test(folderTitleText)) {
					folderTitle.innerHTML = folderTitleText.replace(regex, `<b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (${numberOfEmail} ${emailsText})</b>`);
				} else {
					folderTitle.innerHTML = `${folderTitleText} <b class="mailColor" style="color: ${emailCalculatorColor}; display: ${addEmailCalculator ? 'inline' : 'none'}"> (${numberOfEmail} ${emailsText})</b>`;
				}
				updateBadge(numberOfEmail);
				clearInterval(timer);
			}
			return
		}
	}
	const timer = setInterval(findFolder, ms);
}

// ==================== 更新徽章 ====================
const updateBadge = (count) => {
	if (count === undefined) {
		const numberOfEmailElement = document.querySelector('.wk4Sg');
		if (numberOfEmailElement) {
			const match = numberOfEmailElement.title.match(/-\s(\d+)/);
			count = match ? parseInt(match[1]) : 0;
		} else {
			count = 0;
		}
	}
	
	chrome.runtime.sendMessage({
		action: 'updateBadge',
		count: count,
		color: emailCalculatorColor
	});
}

// ==================== 清理左侧栏 ====================
const cleanLeftRail = () => {
	const leftRail = document.getElementById('LeftRail');
	if (leftRail) {
		leftRail.style.display = hideLeftRail ? 'none' : 'block';
	}
}

// ==================== 对齐文件夹标题 ====================
const alignFolderTitle = (ms = 0) => {
	const findFolderTitle = () => {
		const folderTitle = document.querySelector('.IG8s8');
		if (folderTitle) {
			alignTitle ? folderTitle.style.paddingLeft = '0px' : folderTitle.style.paddingLeft = '16px';
		}
		clearInterval(timer);
	}
	const timer = setInterval(findFolderTitle, ms);
}

// ==================== 清理顶部图标 ====================
const cleanTopBarIcons = (ms = 0) => {
	const findTopBar = () => {
		const meetNowButton = document.getElementById('owaMeetNowButton_container');
		const teamsButton = document.getElementById('teams_container');
		const noteFeedButton = document.getElementById('owaNoteFeedButton_container');

		if (meetNowButton && teamsButton && noteFeedButton) {
			meetNowButton.style.display = hideTopIcons ? 'none' : 'block';
			teamsButton.style.display = hideTopIcons ? 'none' : 'block';
			noteFeedButton.style.display = hideTopIcons ? 'none' : 'block';
			clearInterval(timer);
		}
	};
	const timer = setInterval(findTopBar, ms);
};

// ==================== 清理首封邮件广告 ====================
const cleanFirstEmailAd = (ms = 0) => {
	let counter = 0;
	const findFirstmailAd = () => {
		const firstmailAd = document.getElementById('OwaContainer');
		if (firstmailAd) {
			firstmailAd.style.display = hideFirstemailAd ? 'none' : 'block';
			clearInterval(timer);
		}

		if (counter >= 30) {
			clearInterval(timer);
		}
		counter++;
	}
	const timer = setInterval(findFirstmailAd, ms);
}

// ==================== 邮件夹监听器 ====================
const emailFolderListeners = (ms = 0) => {
	const findButtons = () => {
		const buttons = document.querySelectorAll('.oTkSL');
		if (buttons) {
			buttons.forEach(button => {
				button.addEventListener('click', () => {
					if (observer) {
						observer.disconnect();
						observer = null;
					}
					setTimeout(emailCalculatorReloader, 150);
					setTimeout(alignFolderTitle, 150);
					setTimeout(emailCalculator, 150);
					setTimeout(cleanFirstEmailAd, 150);
					setTimeout(updateBadge, 150);
				});
			});
			clearInterval(timer);
		}
	}
	const timer = setInterval(findButtons, ms);
}

// ==================== 背景更换 ====================
const backgroundChanger = (ms = 0) => {
	const findBackground = () => {
		const backgroundNav = document.querySelector('.o365sx-navbar');
		if (backgroundNav) {
			if (addcustomBackground) {
				backgroundNav.style.backgroundImage = `url("${customBackground}")`;
				backgroundNav.style.backgroundPosition = 'center';
				backgroundNav.style.backgroundRepeatX = 'repeat';
				backgroundNav.style.backgroundSize = 'cover';
			} else {
				backgroundNav.style.backgroundImage = '';
			}
		}
		clearInterval(timer);
	}
	const timer = setInterval(findBackground, ms);
}

// ==================== 顶栏透明度 ====================
const topbarTransparencyChanger = (ms = 0) => {
	const findTopbarElements = () => {
		const o365Buttons = document.querySelectorAll('.o365sx-button');
		const outlookButton = document.querySelector('.o365sx-appName');
		const teamsButton = document.querySelector('.nUPgy');

		if (outlookButton && o365Buttons.length >= 8 && teamsButton) {
			const computedStyles = getComputedStyle(outlookButton);
			const currentBackgroundColor = computedStyles.backgroundColor;
			const transparencyConverter = convertToRGBA(currentBackgroundColor, topbarTransparency ? 0 : 0.8);

			function convertToRGBA(color, alpha) {
				const matchHEXA = color.match(/#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
				const matchRGB = color.match(/rgb\((\d+), (\d+), (\d+)\)/i);
				const matchRGBA = color.match(/rgba\((\d+), (\d+), (\d+), (0(\.\d+)?|1(\.0)?)\)/i);
				if (matchRGB) {
					return `rgba(${matchRGB[1]}, ${matchRGB[2]}, ${matchRGB[3]}, ${alpha})`;
				} else if (matchRGBA) {
					return `rgba(${matchRGBA[1]}, ${matchRGBA[2]}, ${matchRGBA[3]}, ${alpha})`
				} else if (matchHEXA) {
					return `rgba(${parseInt(matchHEXA[1], 16)}, ${parseInt(matchHEXA[2], 16)}, ${parseInt(matchHEXA[3], 16)}, ${alpha})`;
				} else {
					return
				}
			};

			outlookButton.style.backgroundColor = transparencyConverter;
			teamsButton.style.backgroundColor = transparencyConverter;

			o365Buttons.forEach(topbarbutton => {
				topbarbutton.style.backgroundColor = transparencyConverter;
				topbarbutton.style.transition = "background-color 0.1s ease-out";

				topbarbutton.addEventListener("mouseover", () => {
					topbarbutton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
				});
			
				topbarbutton.addEventListener("mouseout", () => {
					topbarbutton.style.backgroundColor = transparencyConverter;
				});
			});

			clearInterval(timer);
		}
	}
	const timer = setInterval(findTopbarElements, ms);
}

// ==================== 添加支持和评分按钮 ====================
const addSupportAndRate = (ms = 0) => {
	const findTopbar = () => {
		const topBarButtons = document.getElementById('headerButtonsRegionId');
		const rateButton = document.getElementById('rateAndSupport_container');

		if (topBarButtons) {
			if (supportAndRateButton && !rateButton && topBarButtons.children.length >= 8) {
				const newDiv = document.createElement('div');
				const githubLink = 'https://github.com/reyanmatic/Outlook-Mail-Checker';

				newDiv.id = 'rateAndSupport_container';
				newDiv.classList.add('M3pcB5evSAtYMozck1WU7A==');
				newDiv.style.display = 'block';

				const link = document.createElement('a');
				link.style.width = '48px';
				link.style.height = '48px';
				link.style.display = 'flex';
				link.style.justifyContent = 'center';
				link.style.alignItems = 'center';
				link.href = githubLink;
				link.target = '_blank';
				link.title = 'Support & Rate';

				link.style.transition = "background-color 0.1s ease-out";
				link.addEventListener("mouseover", () => {
					link.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
				});
				link.addEventListener("mouseout", () => {
					link.style.backgroundColor = "rgba(255, 255, 255, 0)";
				});

				const imgIcone = document.createElement('img');
				imgIcone.src = 'https://raw.githubusercontent.com/rztprog/outlook-web-plus/main/icons/stars_rating.png';
				imgIcone.style.width = '24px';
				imgIcone.style.height = '24px';

				link.appendChild(imgIcone);
				newDiv.appendChild(link);

				topBarButtons.insertBefore(newDiv, topBarButtons.firstChild);
				clearInterval(timer);
				return;
			} 

			if (rateButton) {
				rateButton.style.display = supportAndRateButton ? 'block' : 'none';
				clearInterval(timer);
			}
		}
	}
	const timer = setInterval(findTopbar, ms);
}
