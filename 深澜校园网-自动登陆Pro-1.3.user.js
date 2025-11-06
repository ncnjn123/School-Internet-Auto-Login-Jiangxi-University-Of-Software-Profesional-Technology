// ==UserScript==
// @name         深澜校园网-自动登陆Pro
// @namespace    http://www.baidu.com/
// @version      1.3
// @description  深澜校园网自动登录，支持错误自动重试
// @author       ncnjn123
// @match        http://10.10.4.2/*
// @match        https://10.10.4.2/*
// @match        http://10.10.4.2/srun_portal_pc*
// @match        https://10.10.4.2/srun_portal_pc*
// @icon         https://srun.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 用户自定义 - 输入账号密码
    var usr = "请输入账号"; // 账号
    var pwd = "请输入密码"; // 密码

    // 重试配置
    var retryConfig = {
        maxRetries: 1, // 最大重试次数
        currentRetry: 0, // 当前重试次数
        firstTry: '@lan' // 优先尝试有线网络（因为宿舍用得更多）
    };

    function autoLogin() {
        var usernameInput = document.querySelector("#username");
        var passwordInput = document.querySelector("#password");
        var domainSelect = document.querySelector("#domain");
        var loginButton = document.querySelector("#login-account");

     //检测是否填写账号密码（下面的请输入账号密码无需修改）
        if (usernameInput && passwordInput && domainSelect && loginButton) {
            if (usr === "请输入账号" || pwd === "请输入密码") {
                alert("请去用户脚本管理器中，找到【深澜校园网-自动登录】脚本的代码，添加自己的账号与密码");
                return;
            }

            // 填充账号和密码
            usernameInput.value = usr;
            passwordInput.value = pwd;

            // 根据重试次数选择网络类型
            var selectedDomain = retryConfig.currentRetry === 0 ? retryConfig.firstTry : '@wlan';
            domainSelect.value = selectedDomain;

            console.log('尝试登录，网络类型: ', selectedDomain, ' 重试次数: ', retryConfig.currentRetry);

            // 设置一个定时器检查错误提示
            setTimeout(checkForError, 2000);

            // 点击登录按钮
            loginButton.click();
        } else {
            // 如果元素还没加载完成，等待一下再试
            setTimeout(autoLogin, 500);
        }
    }

    // 检查是否出现错误提示
    function checkForError() {
        // 查找包含"找不到符合条件的产品"的对话框
        var dialogs = document.querySelectorAll('.dialog .section');
        var foundError = false;

        dialogs.forEach(function(section) {
            if (section.textContent.includes('找不到符合条件的产品')) {
                foundError = true;
                console.log('检测到错误提示，准备重试...');

                // 关闭错误对话框
                var confirmBtn = document.querySelector('.dialog .btn-confirm');
                if (confirmBtn) {
                    confirmBtn.click();
                }

                // 重试登录
                retryLogin();
            }
        });

        // 如果没有找到错误提示，但重试次数为0，也设置一个检查（防止漏检）
        if (!foundError && retryConfig.currentRetry === 0) {
            setTimeout(function() {
                checkForError();
            }, 3000);
        }
    }

    // 重试登录
    function retryLogin() {
        if (retryConfig.currentRetry < retryConfig.maxRetries) {
            retryConfig.currentRetry++;
            console.log('开始第 ' + retryConfig.currentRetry + ' 次重试');

            // 等待对话框关闭后再重试
            setTimeout(autoLogin, 1000);
        } else {
            console.log('已达到最大重试次数，停止自动登录');
        }
    }

    // 监听DOM变化，检测错误提示框的出现
    function setupErrorObserver() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        if (node.nodeType === 1) { // Element node
                            // 检查新增的元素是否包含错误提示
                            if (node.querySelector && node.querySelector('.section')) {
                                var sections = node.querySelectorAll('.section');
                                sections.forEach(function(section) {
                                    if (section.textContent.includes('找不到符合条件的产品')) {
                                        console.log('通过DOM观察器检测到错误提示');

                                        // 关闭错误对话框
                                        var confirmBtn = document.querySelector('.dialog .btn-confirm');
                                        if (confirmBtn) {
                                            setTimeout(function() {
                                                confirmBtn.click();
                                            }, 500);
                                        }

                                        // 重试登录
                                        setTimeout(retryLogin, 1000);
                                    }
                                });
                            }

                            // 直接检查文本内容
                            if (node.textContent && node.textContent.includes('找不到符合条件的产品')) {
                                console.log('通过文本检测到错误提示');
                                setTimeout(retryLogin, 1000);
                            }
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupErrorObserver();
            autoLogin();
        });
    } else {
        setupErrorObserver();
        autoLogin();
    }
})();