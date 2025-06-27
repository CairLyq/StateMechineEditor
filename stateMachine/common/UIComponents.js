/**
 * 公共UI组件类
 * 提供可复用的UI组件和工具方法
 */

import { DOM_IDS, CSS_CLASSES, COLORS, ICONS, MESSAGES } from './Constants.js';

export class UIComponents {
    /**
     * 创建工具栏按钮
     */
    static createToolButton(id, icon, text, onClick, color = null) {
        const button = document.createElement('button');
        button.id = id;
        button.className = `${CSS_CLASSES.TOOL_BTN} ${CSS_CLASSES.MD_SURFACE_VARIANT} p-3 rounded-lg transition-all duration-200`;
        
        if (color) {
            button.style.color = color;
        }
        
        button.innerHTML = `
            <i class="${icon} text-lg mb-1"></i>
            <div class="text-xs font-medium">${text}</div>
        `;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    /**
     * 创建导航按钮
     */
    static createNavButton(icon, text, onClick, isPrimary = false) {
        const button = document.createElement('button');
        button.className = isPrimary 
            ? `${CSS_CLASSES.MD_PRIMARY_BTN} px-4 py-2 rounded-lg transition-colors`
            : `${CSS_CLASSES.MD_SURFACE_VARIANT} px-4 py-2 rounded-lg transition-colors`;
        
        button.innerHTML = `<i class="${icon} mr-2"></i>${text}`;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    /**
     * 创建统计卡片
     */
    static createStatCard(title, value, color = COLORS.SUCCESS) {
        const card = document.createElement('div');
        card.className = 'text-center';
        
        card.innerHTML = `
            <div class="text-2xl font-bold" style="color: ${color};">${value}</div>
            <div class="text-xs" style="color: var(--md-on-surface-variant);">${title}</div>
        `;
        
        return card;
    }

    /**
     * 创建面板
     */
    static createPanel(title, content = '', className = '') {
        const panel = document.createElement('div');
        panel.className = `${CSS_CLASSES.MD_SURFACE_VARIANT} rounded-lg p-4 ${className}`;
        
        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold mb-3';
        titleElement.style.color = 'var(--md-on-surface)';
        titleElement.textContent = title;
        
        const contentElement = document.createElement('div');
        contentElement.innerHTML = content;
        
        panel.appendChild(titleElement);
        panel.appendChild(contentElement);
        
        return panel;
    }

    /**
     * 创建输入字段
     */
    static createInputField(label, placeholder = '', type = 'text', value = '') {
        const container = document.createElement('div');
        
        const labelElement = document.createElement('label');
        labelElement.className = 'block text-sm font-medium mb-1';
        labelElement.style.color = 'var(--md-on-surface)';
        labelElement.textContent = label;
        
        const input = document.createElement('input');
        input.type = type;
        input.className = `w-full px-3 py-2 ${CSS_CLASSES.MD_SURFACE} rounded-lg text-sm`;
        input.style.color = 'var(--md-on-surface)';
        input.placeholder = placeholder;
        input.value = value;
        
        container.appendChild(labelElement);
        container.appendChild(input);
        
        return { container, input };
    }

    /**
     * 创建列表项
     */
    static createListItem(text, onClick = null, icon = null, className = '') {
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg transition-colors cursor-pointer hover:bg-opacity-80 ${className}`;
        
        let content = '';
        if (icon) {
            content += `<i class="${icon} mr-2"></i>`;
        }
        content += text;
        
        item.innerHTML = content;
        
        if (onClick) {
            item.addEventListener('click', onClick);
        }
        
        return item;
    }

    /**
     * 创建模态框内容
     */
    static createModalContent(fields) {
        const form = document.createElement('form');
        form.className = 'space-y-4';
        
        const inputs = {};
        
        fields.forEach(field => {
            const { container, input } = this.createInputField(
                field.label,
                field.placeholder || '',
                field.type || 'text',
                field.value || ''
            );
            
            inputs[field.name] = input;
            form.appendChild(container);
        });
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-end space-x-2 mt-6';
        
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = `${CSS_CLASSES.MD_SURFACE_VARIANT} px-4 py-2 rounded-lg transition-colors`;
        cancelButton.textContent = '取消';
        
        const confirmButton = document.createElement('button');
        confirmButton.type = 'submit';
        confirmButton.className = `${CSS_CLASSES.MD_PRIMARY_BTN} px-4 py-2 rounded-lg transition-colors`;
        confirmButton.textContent = '确定';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        form.appendChild(buttonContainer);
        
        return { form, inputs, cancelButton, confirmButton };
    }

    /**
     * 创建颜色选择器
     */
    static createColorPicker(currentColor, onColorChange) {
        const container = document.createElement('div');
        container.className = 'grid grid-cols-4 gap-2';
        
        COLORS.NODE_COLORS.forEach(color => {
            const colorButton = document.createElement('button');
            colorButton.type = 'button';
            colorButton.className = 'w-8 h-8 rounded-full border-2 transition-all';
            colorButton.style.backgroundColor = color;
            colorButton.style.borderColor = color === currentColor ? '#ffffff' : 'transparent';
            
            colorButton.addEventListener('click', () => {
                // 移除其他按钮的选中状态
                container.querySelectorAll('button').forEach(btn => {
                    btn.style.borderColor = 'transparent';
                });
                
                // 设置当前按钮为选中状态
                colorButton.style.borderColor = '#ffffff';
                
                if (onColorChange) {
                    onColorChange(color);
                }
            });
            
            container.appendChild(colorButton);
        });
        
        return container;
    }

    /**
     * 创建通知消息
     */
    static createNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        let bgColor, textColor, icon;
        switch (type) {
            case 'success':
                bgColor = 'bg-green-500';
                textColor = 'text-white';
                icon = ICONS.SUCCESS;
                break;
            case 'error':
                bgColor = 'bg-red-500';
                textColor = 'text-white';
                icon = ICONS.ERROR;
                break;
            case 'warning':
                bgColor = 'bg-yellow-500';
                textColor = 'text-white';
                icon = ICONS.WARNING;
                break;
            default:
                bgColor = 'bg-blue-500';
                textColor = 'text-white';
                icon = ICONS.INFO;
        }
        
        notification.className += ` ${bgColor} ${textColor}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notification;
    }

    /**
     * 创建加载指示器
     */
    static createLoadingIndicator(text = '加载中...') {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const spinner = document.createElement('div');
        spinner.className = `${CSS_CLASSES.MD_SURFACE} rounded-lg p-6 flex flex-col items-center space-y-4`;
        
        const spinnerIcon = document.createElement('div');
        spinnerIcon.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500';
        
        const textElement = document.createElement('div');
        textElement.textContent = text;
        textElement.style.color = 'var(--md-on-surface)';
        
        spinner.appendChild(spinnerIcon);
        spinner.appendChild(textElement);
        overlay.appendChild(spinner);
        
        return overlay;
    }

    /**
     * 创建确认对话框
     */
    static createConfirmDialog(message, onConfirm, onCancel = null) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const dialog = document.createElement('div');
        dialog.className = `${CSS_CLASSES.MD_SURFACE} rounded-lg p-6 max-w-md mx-4`;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'text-lg mb-6';
        messageElement.style.color = 'var(--md-on-surface)';
        messageElement.textContent = message;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-end space-x-2';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = `${CSS_CLASSES.MD_SURFACE_VARIANT} px-4 py-2 rounded-lg transition-colors`;
        cancelButton.textContent = '取消';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.className = `${CSS_CLASSES.MD_PRIMARY_BTN} px-4 py-2 rounded-lg transition-colors`;
        confirmButton.textContent = '确定';
        confirmButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        
        dialog.appendChild(messageElement);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        return overlay;
    }

    /**
     * 创建进度条
     */
    static createProgressBar(progress = 0, text = '') {
        const container = document.createElement('div');
        container.className = 'w-full';
        
        if (text) {
            const textElement = document.createElement('div');
            textElement.className = 'text-sm mb-2';
            textElement.style.color = 'var(--md-on-surface)';
            textElement.textContent = text;
            container.appendChild(textElement);
        }
        
        const progressBg = document.createElement('div');
        progressBg.className = 'w-full bg-gray-300 rounded-full h-2';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'bg-blue-500 h-2 rounded-full transition-all duration-300';
        progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        
        progressBg.appendChild(progressBar);
        container.appendChild(progressBg);
        
        return { container, progressBar };
    }

    /**
     * 创建工具提示
     */
    static createTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `absolute z-50 px-2 py-1 text-xs text-white bg-black bg-opacity-75 rounded pointer-events-none opacity-0 transition-opacity duration-200`;
        tooltip.textContent = text;
        
        let showTimeout, hideTimeout;
        
        const show = () => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(() => {
                document.body.appendChild(tooltip);
                
                const rect = element.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left, top;
                
                switch (position) {
                    case 'top':
                        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                        top = rect.top - tooltipRect.height - 5;
                        break;
                    case 'bottom':
                        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                        top = rect.bottom + 5;
                        break;
                    case 'left':
                        left = rect.left - tooltipRect.width - 5;
                        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                        break;
                    case 'right':
                        left = rect.right + 5;
                        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                        break;
                }
                
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                tooltip.classList.remove('opacity-0');
            }, 500);
        };
        
        const hide = () => {
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(() => {
                tooltip.classList.add('opacity-0');
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 200);
            }, 100);
        };
        
        element.addEventListener('mouseenter', show);
        element.addEventListener('mouseleave', hide);
        
        return { show, hide };
    }

    /**
     * 创建标签页
     */
    static createTabs(tabs, onTabChange = null) {
        const container = document.createElement('div');
        container.className = 'w-full';
        
        const tabsHeader = document.createElement('div');
        tabsHeader.className = 'flex border-b border-gray-200';
        
        const tabsContent = document.createElement('div');
        tabsContent.className = 'p-4';
        
        let activeTab = 0;
        
        tabs.forEach((tab, index) => {
            const tabButton = document.createElement('button');
            tabButton.className = `px-4 py-2 font-medium transition-colors ${
                index === activeTab 
                    ? 'text-blue-500 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-gray-700'
            }`;
            tabButton.textContent = tab.title;
            
            tabButton.addEventListener('click', () => {
                // 更新标签页样式
                tabsHeader.querySelectorAll('button').forEach((btn, i) => {
                    btn.className = `px-4 py-2 font-medium transition-colors ${
                        i === index 
                            ? 'text-blue-500 border-b-2 border-blue-500' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`;
                });
                
                // 更新内容
                tabsContent.innerHTML = tab.content;
                activeTab = index;
                
                if (onTabChange) {
                    onTabChange(index, tab);
                }
            });
            
            tabsHeader.appendChild(tabButton);
        });
        
        // 设置初始内容
        if (tabs.length > 0) {
            tabsContent.innerHTML = tabs[0].content;
        }
        
        container.appendChild(tabsHeader);
        container.appendChild(tabsContent);
        
        return { container, tabsHeader, tabsContent };
    }

    /**
     * 创建下拉菜单
     */
    static createDropdown(button, items, onSelect = null) {
        const dropdown = document.createElement('div');
        dropdown.className = 'relative inline-block';
        
        const menu = document.createElement('div');
        menu.className = 'absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors';
            menuItem.innerHTML = `<i class="${item.icon} mr-2"></i>${item.text}`;
            
            menuItem.addEventListener('click', () => {
                menu.classList.add('hidden');
                if (onSelect) {
                    onSelect(item);
                }
            });
            
            menu.appendChild(menuItem);
        });
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });
        
        // 点击外部隐藏菜单
        document.addEventListener('click', () => {
            menu.classList.add('hidden');
        });
        
        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        
        return dropdown;
    }

    /**
     * 创建帮助系统
     */
    static createHelpSystem() {
        const helpContent = `
            <div class="help-system max-h-96 overflow-y-auto">
                <div class="space-y-6">
                    <!-- 快捷键 -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3" style="color: var(--md-on-surface);">键盘快捷键</h3>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>添加状态</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Shift+S</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>添加转换</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Shift+T</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>保存</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+S</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>撤销</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Z</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>重做</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Y</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>删除</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Delete</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>适应屏幕</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+0</kbd>
                            </div>
                            <div class="flex justify-between p-2 bg-gray-700 rounded">
                                <span>模拟运行</span>
                                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">F5</kbd>
                            </div>
                        </div>
                    </div>

                    <!-- 操作指南 -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3" style="color: var(--md-on-surface);">操作指南</h3>
                        <div class="space-y-3 text-sm">
                            <div class="p-3 bg-gray-700 rounded">
                                <h4 class="font-semibold mb-2">创建状态</h4>
                                <p>双击画布空白处或点击"添加状态"按钮创建新状态</p>
                            </div>
                            <div class="p-3 bg-gray-700 rounded">
                                <h4 class="font-semibold mb-2">创建转换</h4>
                                <p>点击"添加转换"按钮，然后依次点击起始状态和目标状态</p>
                            </div>
                            <div class="p-3 bg-gray-700 rounded">
                                <h4 class="font-semibold mb-2">编辑状态</h4>
                                <p>右键点击状态，选择"编辑状态"修改名称和属性</p>
                            </div>
                            <div class="p-3 bg-gray-700 rounded">
                                <h4 class="font-semibold mb-2">模拟运行</h4>
                                <p>点击"模拟运行"开始，在右侧输入事件名称触发状态转换</p>
                            </div>
                            <div class="p-3 bg-gray-700 rounded">
                                <h4 class="font-semibold mb-2">拖拽移动</h4>
                                <p>按住左键拖拽状态节点移动位置，拖拽画布背景平移视图</p>
                            </div>
                        </div>
                    </div>

                    <!-- 功能说明 -->
                    <div>
                        <h3 class="text-lg font-semibold mb-3" style="color: var(--md-on-surface);">功能说明</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-circle-plus text-green-400"></i>
                                <span>添加状态 - 创建新的状态节点</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-arrow-right text-blue-400"></i>
                                <span>添加转换 - 在状态间创建转换关系</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-sitemap text-purple-400"></i>
                                <span>添加子状态 - 创建分层结构（分层状态机）</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-play text-green-400"></i>
                                <span>模拟运行 - 交互式状态机执行</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-project-diagram text-orange-400"></i>
                                <span>自动布局 - 智能排列状态位置</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-expand text-gray-400"></i>
                                <span>适应屏幕 - 自动调整视图缩放</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return helpContent;
    }

    /**
     * 显示帮助对话框
     */
    static showHelpDialog() {
        const helpContent = this.createHelpSystem();
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const dialog = document.createElement('div');
        dialog.className = 'bg-gray-800 rounded-lg p-6 max-w-4xl mx-4 max-h-[90vh] overflow-hidden';
        dialog.style.color = '#ffffff';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        header.innerHTML = `
            <h2 class="text-2xl font-bold">帮助 & 快捷键</h2>
            <button id="closeHelp" class="text-gray-400 hover:text-white transition-colors">
                <i class="fas fa-times text-xl"></i>
            </button>
        `;
        
        const content = document.createElement('div');
        content.innerHTML = helpContent;
        
        dialog.appendChild(header);
        dialog.appendChild(content);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        // 关闭事件
        const closeBtn = document.getElementById('closeHelp');
        const closeDialog = () => {
            document.body.removeChild(overlay);
        };
        
        closeBtn.addEventListener('click', closeDialog);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
        
        // ESC键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        return overlay;
    }

    /**
     * 创建欢迎向导
     */
    static createWelcomeWizard() {
        const steps = [
            {
                title: '欢迎使用状态机编辑器',
                content: '这是一个强大的可视化状态机设计工具，支持标准状态机和分层状态机。',
                image: '🎯'
            },
            {
                title: '创建你的第一个状态',
                content: '双击画布空白处或点击"添加状态"按钮来创建状态节点。',
                image: '🔵'
            },
            {
                title: '连接状态',
                content: '点击"添加转换"按钮，然后依次点击两个状态来创建转换关系。',
                image: '🔗'
            },
            {
                title: '模拟运行',
                content: '设置初始状态后，点击"模拟运行"来测试你的状态机逻辑。',
                image: '▶️'
            },
            {
                title: '开始创建',
                content: '现在你已经了解了基础操作，开始创建你的状态机吧！按F1随时查看帮助。',
                image: '🚀'
            }
        ];

        let currentStep = 0;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const wizard = document.createElement('div');
        wizard.className = 'bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center';
        wizard.style.color = '#ffffff';
        
        const updateStep = () => {
            const step = steps[currentStep];
            wizard.innerHTML = `
                <div class="text-6xl mb-4">${step.image}</div>
                <h2 class="text-2xl font-bold mb-4">${step.title}</h2>
                <p class="text-gray-300 mb-6">${step.content}</p>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-400">${currentStep + 1} / ${steps.length}</div>
                    <div class="space-x-2">
                        ${currentStep > 0 ? '<button id="prevStep" class="px-4 py-2 bg-gray-600 rounded transition-colors hover:bg-gray-500">上一步</button>' : ''}
                        ${currentStep < steps.length - 1 ? 
                            '<button id="nextStep" class="px-4 py-2 bg-blue-600 rounded transition-colors hover:bg-blue-500">下一步</button>' : 
                            '<button id="finishWizard" class="px-4 py-2 bg-green-600 rounded transition-colors hover:bg-green-500">开始使用</button>'
                        }
                    </div>
                </div>
                <div class="mt-4">
                    <button id="skipWizard" class="text-sm text-gray-400 hover:text-white transition-colors">跳过向导</button>
                </div>
            `;
            
            // 绑定事件
            const nextBtn = document.getElementById('nextStep');
            const prevBtn = document.getElementById('prevStep');
            const finishBtn = document.getElementById('finishWizard');
            const skipBtn = document.getElementById('skipWizard');
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentStep++;
                    updateStep();
                });
            }
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentStep--;
                    updateStep();
                });
            }
            
            if (finishBtn || skipBtn) {
                const closeWizard = () => {
                    document.body.removeChild(overlay);
                    localStorage.setItem('stateMachineEditor_welcomeShown', 'true');
                };
                
                if (finishBtn) finishBtn.addEventListener('click', closeWizard);
                if (skipBtn) skipBtn.addEventListener('click', closeWizard);
            }
        };
        
        updateStep();
        overlay.appendChild(wizard);
        document.body.appendChild(overlay);
        
        return overlay;
    }

    /**
     * 检查是否需要显示欢迎向导
     */
    static checkWelcomeWizard() {
        const hasShown = localStorage.getItem('stateMachineEditor_welcomeShown');
        if (!hasShown) {
            // 延迟显示，让页面先加载完成
            setTimeout(() => {
                this.createWelcomeWizard();
            }, 1000);
        }
    }

    /**
     * 创建快捷键提示
     */
    static createShortcutHint(key, description, position = { x: 0, y: 0 }) {
        const hint = document.createElement('div');
        hint.className = 'fixed z-50 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm pointer-events-none';
        hint.style.left = `${position.x}px`;
        hint.style.top = `${position.y}px`;
        hint.innerHTML = `
            <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-gray-600 rounded text-xs">${key}</kbd>
                <span>${description}</span>
            </div>
        `;
        
        document.body.appendChild(hint);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        }, 3000);
        
        return hint;
    }

    /**
     * 创建功能介绍气泡
     */
    static createFeatureBubble(element, title, description, position = 'top') {
        const bubble = document.createElement('div');
        bubble.className = 'absolute z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs';
        bubble.innerHTML = `
            <div class="font-semibold mb-1">${title}</div>
            <div class="text-sm opacity-90">${description}</div>
            <div class="absolute w-3 h-3 bg-blue-600 transform rotate-45" style="
                ${position === 'top' ? 'bottom: -6px; left: 50%; transform: translateX(-50%) rotate(45deg);' : ''}
                ${position === 'bottom' ? 'top: -6px; left: 50%; transform: translateX(-50%) rotate(45deg);' : ''}
                ${position === 'left' ? 'right: -6px; top: 50%; transform: translateY(-50%) rotate(45deg);' : ''}
                ${position === 'right' ? 'left: -6px; top: 50%; transform: translateY(-50%) rotate(45deg);' : ''}
            "></div>
        `;
        
        // 计算位置
        const rect = element.getBoundingClientRect();
        let left, top;
        
        switch (position) {
            case 'top':
                left = rect.left + rect.width / 2 - 150; // 假设气泡宽度300px
                top = rect.top - 80; // 气泡高度加间距
                break;
            case 'bottom':
                left = rect.left + rect.width / 2 - 150;
                top = rect.bottom + 10;
                break;
            case 'left':
                left = rect.left - 310;
                top = rect.top + rect.height / 2 - 40;
                break;
            case 'right':
                left = rect.right + 10;
                top = rect.top + rect.height / 2 - 40;
                break;
        }
        
        bubble.style.left = `${Math.max(10, left)}px`;
        bubble.style.top = `${Math.max(10, top)}px`;
        
        document.body.appendChild(bubble);
        
        // 点击其他地方关闭
        const closeBubble = (e) => {
            if (!bubble.contains(e.target) && !element.contains(e.target)) {
                document.body.removeChild(bubble);
                document.removeEventListener('click', closeBubble);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeBubble);
        }, 100);
        
        return bubble;
    }
}

export default UIComponents; 