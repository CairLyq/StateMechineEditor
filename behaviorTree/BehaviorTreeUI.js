/**
 * 行为树编辑器UI管理器
 * 负责处理用户界面交互、事件监听和界面更新
 */
class BehaviorTreeUI {
    constructor() {
        this.editor = null;
        this.performanceTimer = null;
        this.dialogManager = null;
        this.isInitialized = false;
    }

    /**
     * 初始化UI
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // 创建编辑器实例
            this.editor = new BehaviorTreeEditor('behaviorTreeCanvas', {
                gridSize: 20,
                snapToGrid: true,
                showGrid: true,
                debug: false,
                autoSave: false // 默认关闭自动保存
            });
            
            // 初始化对话框管理器
            this.dialogManager = new DialogManager();
            this.setupGlobalDialogs();
            
            // 设置UI和事件监听器
            this.setupUI();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('行为树编辑器初始化完成');
        } catch (error) {
            console.error('编辑器初始化失败:', error);
        }
    }

    /**
     * 设置UI组件
     */
    setupUI() {
        // 设置节点按钮
        document.querySelectorAll('[data-node-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                const nodeType = btn.dataset.nodeType;
                this.addNodeAtCenter(nodeType);
            });
        });
        
        // 更新界面状态
        this.updateUI();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 行为树日志监听
        window.addEventListener('behaviorTreeLog', (event) => {
            this.addLogEntry(event.detail);
        });
        
        // 执行速度滑块
        const speedControl = document.getElementById('speedControl');
        speedControl.addEventListener('input', () => {
            const speed = parseFloat(speedControl.value);
            document.getElementById('speedValue').textContent = speed.toFixed(1) + 'x';
            if (this.editor && this.editor.simulator) {
                this.editor.simulator.setExecutionSpeed(speed);
            }
        });

        // 搜索功能
        document.getElementById('searchBtn').addEventListener('click', () => this.toggleSearchPanel());
        document.getElementById('closeSearchBtn').addEventListener('click', () => this.hideSearchPanel());
        document.getElementById('searchInput').addEventListener('input', () => this.performSearch());
        document.getElementById('nodeTypeFilter').addEventListener('change', () => this.performSearch());
        document.getElementById('nodeStatusFilter').addEventListener('change', () => this.performSearch());

        // 模板功能
        document.getElementById('templatesBtn').addEventListener('click', () => this.toggleTemplatesPanel());
        document.getElementById('closeTemplatesBtn').addEventListener('click', () => this.hideTemplatesPanel());
        document.getElementById('templateCategoryFilter').addEventListener('change', () => this.updateTemplatesList());
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveCurrentAsTemplate());

        // 性能监控
        document.getElementById('performanceBtn').addEventListener('click', () => this.togglePerformancePanel());
        document.getElementById('closePerformanceBtn').addEventListener('click', () => this.hidePerformancePanel());

        // 自动保存
        document.getElementById('autoSaveBtn').addEventListener('click', () => this.toggleAutoSave());

        // 键盘快捷键
        document.addEventListener('keydown', (event) => this.handleGlobalKeyDown(event));
        
        // 执行控制按钮
        this.setupExecutionControls();
        
        // 画布工具栏
        this.setupCanvasToolbar();
        
        // 导入导出
        this.setupImportExport();
        
        // 撤销重做
        this.setupUndoRedo();
        
        // 黑板数据按钮
        this.setupBlackboardControls();
        
        // 定期更新统计信息
        setInterval(() => this.updateUI(), 1000);
        setInterval(() => this.updatePerformanceStats(), 1000);
    }

    /**
     * 设置执行控制按钮
     */
    setupExecutionControls() {
        document.getElementById('clearLogBtn').addEventListener('click', () => {
            document.getElementById('executionLog').innerHTML = '<div class="text-green-400">日志已清空...</div>';
        });
        
        document.getElementById('playBtn').addEventListener('click', () => {
            if (this.editor && this.editor.simulator) {
                this.editor.simulator.start();
                this.updateExecutionState('运行中');
            }
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.editor && this.editor.simulator) {
                this.editor.simulator.pause();
                this.updateExecutionState('已暂停');
            }
        });
        
        document.getElementById('stopBtn').addEventListener('click', () => {
            if (this.editor && this.editor.simulator) {
                this.editor.simulator.stop();
                this.updateExecutionState('已停止');
            }
        });
        
        document.getElementById('stepBtn').addEventListener('click', () => {
            if (this.editor && this.editor.simulator) {
                this.editor.simulator.step();
                this.updateExecutionState('单步执行');
            }
        });
    }

    /**
     * 设置画布工具栏
     */
    setupCanvasToolbar() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            if (this.editor) this.editor.refreshCanvas();
        });
        
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            if (this.editor) this.editor.zoomIn();
        });
        
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            if (this.editor) this.editor.zoomOut();
        });
        
        document.getElementById('fitBtn').addEventListener('click', () => {
            if (this.editor) this.editor.fitToScreen();
        });
        
        document.getElementById('deleteBtn').addEventListener('click', () => {
            if (this.editor) this.editor.deleteSelected();
        });
    }

    /**
     * 设置导入导出功能
     */
    setupImportExport() {
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            if (this.editor) {
                const data = this.editor.exportTree();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'behavior_tree.json';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
        
        // 文件导入
        document.getElementById('fileInput').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.editor.importTree(data);
                        this.updateUI();
                    } catch (error) {
                        window.alert('文件格式错误：' + error.message, '导入失败');
                    }
                };
                reader.readAsText(file);
            }
            event.target.value = '';
        });
    }

    /**
     * 设置撤销重做功能
     */
    setupUndoRedo() {
        document.getElementById('undoBtn').addEventListener('click', () => {
            if (this.editor) this.editor.undo();
        });
        
        document.getElementById('redoBtn').addEventListener('click', () => {
            if (this.editor) this.editor.redo();
        });
    }

    /**
     * 设置黑板数据控制
     */
    setupBlackboardControls() {
        document.getElementById('addBlackboardBtn').addEventListener('click', () => {
            this.addBlackboardData();
        });
        
        document.getElementById('clearBlackboardBtn').addEventListener('click', () => {
            this.clearBlackboardData();
        });
    }

    /**
     * 在画布中心添加节点
     */
    addNodeAtCenter(nodeType) {
        if (!this.editor) return;
        
        const canvas = document.getElementById('behaviorTreeCanvas');
        const rect = canvas.getBoundingClientRect();
        const centerX = (rect.width / 2 - this.editor.viewport.x) / this.editor.viewport.zoom;
        const centerY = (rect.height / 2 - this.editor.viewport.y) / this.editor.viewport.zoom;
        
        const node = this.editor.addNode(nodeType, centerX, centerY);
        if (node) {
            this.editor.clearSelection();
            this.editor.selectNode(node);
            this.editor.render();
            this.updateUI();
        }
    }

    /**
     * 更新UI界面
     */
    updateUI() {
        if (!this.editor) return;
        
        // 更新节点统计
        const nodeCount = this.editor.tree.nodes ? this.editor.tree.nodes.size : 0;
        document.getElementById('totalNodes').textContent = nodeCount;
        
        // 使用编辑器内置的统计方法获取树深度
        const stats = this.editor.getNodeStatistics();
        document.getElementById('treeDepth').textContent = stats.depth;
        
        // 更新其他统计信息
        const treeDepthDisplay = document.getElementById('treeDepthDisplay');
        if (treeDepthDisplay) {
            treeDepthDisplay.textContent = stats.depth;
        }
        
        // 更新节点列表
        this.updateNodesList();
        
        // 更新黑板数据
        this.updateBlackboard();
    }

    /**
     * 更新节点列表
     */
    updateNodesList() {
        if (!this.editor || !this.editor.tree.nodes) return;
        
        const listDiv = document.getElementById('nodesList');
        let html = '';
        
        if (this.editor.tree.nodes.size === 0) {
            html = '<div class="text-center py-4" style="color: var(--md-on-surface-variant);"><i class="fas fa-plus-circle mb-2"></i><p class="text-sm">暂无节点</p></div>';
        } else {
            this.editor.tree.nodes.forEach((node, id) => {
                const isSelected = this.editor.state && this.editor.state.selectedNodes && this.editor.state.selectedNodes.has(node);
                html += `
                    <div class="node-list-item md-surface-variant p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors shadow-sm ${isSelected ? 'bg-blue-600 text-white' : ''}" data-node-id="${id}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <i class="fas ${this.getNodeIcon(node.type)} text-sm" style="color: ${node.metadata ? node.metadata.color : '#6b7280'};"></i>
                                <span class="text-sm font-medium" style="color: var(--md-on-surface-variant);">${node.name || node.type}</span>
                            </div>
                            <div class="flex space-x-1">
                                ${node.status === 'success' ? '<i class="fas fa-check text-xs" style="color: var(--md-success);" title="成功"></i>' : ''}
                                ${node.status === 'failure' ? '<i class="fas fa-times text-xs" style="color: var(--md-error);" title="失败"></i>' : ''}
                                ${node.status === 'running' ? '<i class="fas fa-play text-xs" style="color: var(--md-warning);" title="运行中"></i>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        listDiv.innerHTML = html;
        
        // 添加点击事件
        listDiv.querySelectorAll('.node-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = item.dataset.nodeId;
                const node = this.editor.tree.nodes.get(nodeId);
                if (node) {
                    this.editor.clearSelection();
                    this.editor.selectNode(node);
                    // selectNode和clearSelection方法已经会调用render()，无需重复调用
                    this.updateUI();
                }
            });
        });
    }

    /**
     * 更新黑板数据显示
     */
    updateBlackboard() {
        if (!this.editor || !this.editor.simulator) return;
        
        const blackboard = this.editor.simulator.getBlackboard();
        const blackboardDiv = document.getElementById('blackboardDataSection');
        
        if (blackboard.size === 0) {
            blackboardDiv.innerHTML = '<div class="text-center" style="color: var(--md-on-surface-variant);">暂无数据</div>';
        } else {
            let html = '';
            blackboard.forEach((value, key) => {
                html += `<div class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <span class="font-mono text-xs" style="color: var(--md-on-surface);">${key}:</span>
                    <span class="font-mono text-xs" style="color: var(--md-on-secondary-container);">${JSON.stringify(value)}</span>
                </div>`;
            });
            blackboardDiv.innerHTML = html;
        }
    }

    /**
     * 更新执行状态显示
     */
    updateExecutionState(state) {
        document.getElementById('executionState').textContent = state;
    }

    /**
     * 获取节点图标
     */
    getNodeIcon(type) {
        const icons = {
            selector: 'fa-code-branch',
            sequence: 'fa-list-ol',
            parallel: 'fa-grip-lines',
            inverter: 'fa-exchange-alt',
            repeater: 'fa-redo',
            timeout: 'fa-clock',
            action: 'fa-play',
            condition: 'fa-question-circle',
            wait: 'fa-pause',
            log: 'fa-file-alt'
        };
        return icons[type] || 'fa-circle';
    }

    /**
     * 添加日志条目
     */
    addLogEntry(logEntry) {
        const logDiv = document.getElementById('executionLog');
        const entry = document.createElement('div');
        entry.className = `log-entry text-${this.getLogColor(logEntry.type)}`;
        entry.innerHTML = `[${logEntry.timestamp}] ${logEntry.message}`;
        
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
        
        // 限制日志条目数量
        while (logDiv.children.length > 100) {
            logDiv.removeChild(logDiv.firstChild);
        }
    }

    /**
     * 获取日志颜色
     */
    getLogColor(type) {
        const colors = {
            info: 'green-400',
            error: 'red-400',
            debug: 'yellow-400',
            action: 'blue-400'
        };
        return colors[type] || 'white';
    }

    /**
     * 黑板数据管理
     */
    async addBlackboardData() {
        try {
            const key = await window.prompt('请输入数据键名:', '', '添加黑板数据');
            if (!key || key.trim() === '') return;
            
            const value = await window.prompt('请输入数据值:', '', '输入数据值');
            if (value === null) return;
            
            try {
                // 尝试解析JSON
                let parsedValue;
                try {
                    parsedValue = JSON.parse(value);
                } catch {
                    parsedValue = value; // 如果不是JSON，就作为字符串
                }
                
                if (this.editor && this.editor.simulator) {
                    this.editor.simulator.setBlackboardValue(key.trim(), parsedValue);
                    this.updateBlackboard();
                    this.editor.showToast(`已添加黑板数据: ${key.trim()}`);
                }
            } catch (error) {
                window.alert('数据格式错误: ' + error.message, '错误');
            }
        } catch (error) {
            // 用户取消了输入
        }
    }

    async clearBlackboardData() {
        try {
            const confirmed = await window.confirm('确定要清空所有黑板数据吗？', '确认清空');
            if (confirmed) {
                if (this.editor && this.editor.simulator) {
                    this.editor.simulator.clearBlackboard();
                    this.updateBlackboard();
                    this.editor.showToast('黑板数据已清空');
                }
            }
        } catch (error) {
            // 用户取消了操作
        }
    }

    /**
     * 搜索功能
     */
    toggleSearchPanel() {
        const panel = document.getElementById('searchPanel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            document.getElementById('searchInput').focus();
        }
    }

    hideSearchPanel() {
        document.getElementById('searchPanel').classList.add('hidden');
        if (this.editor) {
            this.editor.clearSearchHighlight();
            this.editor.render();
        }
    }

    performSearch() {
        if (!this.editor) return;

        const query = document.getElementById('searchInput').value;
        const nodeType = document.getElementById('nodeTypeFilter').value;
        const nodeStatus = document.getElementById('nodeStatusFilter').value;

        const results = this.editor.searchNodes(query, { nodeType, nodeStatus });
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-4">未找到匹配的节点</div>';
            return;
        }

        results.forEach((node, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100';
            item.innerHTML = `
                <div>
                    <div class="font-medium text-sm">${node.name}</div>
                    <div class="text-xs text-gray-500">${node.type} - ${node.status}</div>
                </div>
                <button class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-crosshairs"></i>
                </button>
            `;
            
            item.addEventListener('click', () => {
                this.editor.navigateToSearchResult(index);
            });

            container.appendChild(item);
        });
    }

    /**
     * 模板功能
     */
    toggleTemplatesPanel() {
        const panel = document.getElementById('templatesPanel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.updateTemplatesList();
        }
    }

    hideTemplatesPanel() {
        document.getElementById('templatesPanel').classList.add('hidden');
    }

    updateTemplatesList() {
        if (!this.editor) return;

        const category = document.getElementById('templateCategoryFilter').value;
        const templates = category ? 
            this.editor.templates.getTemplatesByCategory(category) : 
            this.editor.templates.getAllTemplates();

        const container = document.getElementById('templatesList');
        container.innerHTML = '';

        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100';
            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-sm" style="color: var(--md-primary);">${template.name}</div>
                        <div class="text-xs" style="color: var(--md-primary-container);">${template.category}</div>
                        <div class="text-xs mt-1" style="color: var(--md-primary-container);">${template.description}</div>
                    </div>
                    <div class="flex space-x-1">
                        <button class="text-blue-600 hover:text-blue-800 p-1" title="使用模板">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800 p-1" title="导出模板">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;

            const useBtn = item.querySelector('.fa-plus').parentElement;
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useTemplate(template.id);
            });

            const exportBtn = item.querySelector('.fa-download').parentElement;
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exportTemplate(template.id);
            });

            container.appendChild(item);
        });
    }

    async useTemplate(templateId) {
        if (!this.editor) return;
        
        try {
            // 清空现有节点
            if (this.editor.tree.nodes.size > 0) {
                try {
                    const confirmed = await window.confirm('加载模板将清空当前的行为树，是否继续？', '确认加载模板');
                    if (!confirmed) {
                        return;
                    }
                } catch (error) {
                    return; // 用户取消了操作
                }
                
                // 清空所有节点
                this.editor.tree.nodes.clear();
                this.editor.tree.root = null;
                this.editor.clearSelection();
            }
            
            // 加载模板节点
            const nodes = this.editor.templates.instantiateTemplate(templateId, 100, 100);
            
            if (nodes.length > 0) {
                // 将模板节点添加到树中
                nodes.forEach(node => {
                    this.editor.tree.nodes.set(node.id, node);
                });
                
                // 设置根节点（模板的第一个节点）
                this.editor.tree.root = nodes[0];
                
                // 重建节点映射确保父子关系正确
                this.editor.rebuildNodeMap(this.editor.tree.root);
            }
            
            // 更新UI
            this.editor.updateNodesList();
            this.editor.markAsDirty();
            this.editor.fitToScreen();
            this.editor.render();
            this.editor.showToast(`已加载模板: ${templateId}`, 'success');
        } catch (error) {
            console.error('模板使用失败:', error);
            this.editor.showToast(`模板使用失败: ${error.message}`, 'error');
        }
    }

    exportTemplate(templateId) {
        if (!this.editor) return;
        
        try {
            const templateData = this.editor.templates.exportTemplate(templateId);
            const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `template_${templateId}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.editor.showToast('模板导出成功', 'success');
        } catch (error) {
            this.editor.showToast(`模板导出失败: ${error.message}`, 'error');
        }
    }

    async saveCurrentAsTemplate() {
        if (!this.editor || !this.editor.tree.root) {
            this.editor.showToast('没有可保存的节点', 'warning');
            return;
        }

        try {
            const name = await window.prompt('请输入模板名称:', '', '保存模板');
            if (!name) return;

            const description = await window.prompt('请输入模板描述:', '', '模板描述');
            const category = await window.prompt('请输入模板分类:', 'Custom', '模板分类') || 'Custom';

            const selectedNodes = Array.from(this.editor.state.selectedNodes);
            const nodesToSave = selectedNodes.length > 0 ? selectedNodes : [this.editor.tree.root];
            
            const templateId = `custom_${Date.now()}`;
            this.editor.templates.createTemplateFromNodes(nodesToSave, {
                id: templateId,
                name,
                description,
                category,
                icon: 'fas fa-cube'
            });

            this.editor.templates.saveToLocalStorage();
            this.updateTemplatesList();
            this.editor.showToast('模板保存成功', 'success');
        } catch (error) {
            if (error.message) {
                this.editor.showToast(`模板保存失败: ${error.message}`, 'error');
            }
            // 如果是用户取消输入，不显示错误信息
        }
    }

    /**
     * 性能监控
     */
    togglePerformancePanel() {
        const panel = document.getElementById('performancePanel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.startPerformanceMonitoring();
        } else {
            this.stopPerformanceMonitoring();
        }
    }

    hidePerformancePanel() {
        document.getElementById('performancePanel').classList.add('hidden');
        this.stopPerformanceMonitoring();
    }

    startPerformanceMonitoring() {
        if (this.performanceTimer) return;

        this.performanceTimer = setInterval(() => {
            if (!this.editor) return;

            const stats = this.editor.getPerformanceStats();
            
            document.getElementById('fpsDisplay').textContent = stats.fps;
            document.getElementById('nodeCountDisplay').textContent = stats.nodeCount;
            document.getElementById('renderTimeDisplay').textContent = `${stats.renderTime.toFixed(1)}ms`;
            document.getElementById('treeDepthDisplay').textContent = stats.treeComplexity.depth;
            
            if (stats.memoryUsage) {
                document.getElementById('memoryUsageDisplay').textContent = 
                    `${stats.memoryUsage.used}/${stats.memoryUsage.total}MB`;
            }
        }, 1000);
    }

    stopPerformanceMonitoring() {
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer);
            this.performanceTimer = null;
        }
    }

    /**
     * 自动保存
     */
    toggleAutoSave() {
        if (!this.editor) return;

        this.editor.options.autoSave = !this.editor.options.autoSave;
        const btn = document.getElementById('autoSaveBtn');
        
        if (this.editor.options.autoSave) {
            btn.style.color = 'var(--md-secondary)';
            btn.title = '自动保存已启用';
            this.editor.setupAutoSave();
            this.editor.showToast('自动保存已启用', 'success');
        } else {
            btn.style.color = 'var(--md-on-surface)';
            btn.title = '自动保存已禁用';
            if (this.editor.autoSave.timer) {
                clearInterval(this.editor.autoSave.timer);
                this.editor.autoSave.timer = null;
            }
            this.editor.showToast('自动保存已禁用', 'info');
        }
    }

    /**
     * 全局键盘快捷键
     */
    handleGlobalKeyDown(event) {
        if (!this.editor) return;

        // Ctrl+F - 搜索
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            this.toggleSearchPanel();
            return;
        }

        // Ctrl+T - 模板
        if (event.ctrlKey && event.key === 't') {
            event.preventDefault();
            this.toggleTemplatesPanel();
            return;
        }

        // Ctrl+Shift+P - 性能监控
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            event.preventDefault();
            this.togglePerformancePanel();
            return;
        }

        // Ctrl+S - 手动保存
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (this.editor.autoSave.isDirty) {
                this.editor.performAutoSave();
            } else {
                this.editor.showToast('没有需要保存的更改', 'info');
            }
            return;
        }

        // Escape - 关闭所有面板
        if (event.key === 'Escape') {
            this.hideSearchPanel();
            this.hideTemplatesPanel();
            this.hidePerformancePanel();
            return;
        }
    }

    /**
     * 更新性能统计
     */
    updatePerformanceStats() {
        if (this.editor) {
            this.editor.updatePerformanceStats();
            this.editor.optimizePerformance();
        }
    }

    /**
     * 设置全局对话框
     */
    setupGlobalDialogs() {
        // 重写全局的alert, confirm, prompt函数
        window.alert = (message, title) => this.dialogManager.alert(message, title);
        window.confirm = (message, title) => this.dialogManager.confirm(message, title);
        window.prompt = (message, defaultValue, title) => this.dialogManager.prompt(message, defaultValue, title);
    }
}

/**
 * MD3风格弹窗管理器
 */
class DialogManager {
    constructor() {
        this.isInitialized = false;
        this.confirmResolve = null;
        this.confirmReject = null;
        this.inputResolve = null;
        this.inputReject = null;
        
        // 延迟设置事件监听器，确保DOM已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // 模态框关闭按钮
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // 确认对话框按钮
        const confirmCancel = document.getElementById('confirmCancel');
        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                console.log('确认对话框：点击取消按钮');
                if (this.confirmReject) {
                    this.confirmReject(false);
                }
                this.hideConfirmDialog();
               
            });
        } else {
            console.error('找不到确认取消按钮元素');
        }

        const confirmOk = document.getElementById('confirmOk');
        if (confirmOk) {
            confirmOk.addEventListener('click', () => {
                console.log('确认对话框：点击确认按钮');
                if (this.confirmResolve) {
                    this.confirmResolve(true);
                }
                this.hideConfirmDialog();
            });
        } else {
            console.error('找不到确认按钮元素');
        }

        // 输入对话框按钮
        const inputCancel = document.getElementById('inputCancel');
        if (inputCancel) {
            inputCancel.addEventListener('click', () => {
                if (this.inputReject) this.inputReject();
                this.hideInputDialog();
            });
        }

        const inputOk = document.getElementById('inputOk');
        if (inputOk) {
            inputOk.addEventListener('click', () => {
                const value = document.getElementById('inputField').value;
                if (this.inputResolve) this.inputResolve(value);
                this.hideInputDialog();
            });
        }

        // 输入框回车确认
        const inputField = document.getElementById('inputField');
        if (inputField) {
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const okBtn = document.getElementById('inputOk');
                    if (okBtn) okBtn.click();
                } else if (e.key === 'Escape') {
                    const cancelBtn = document.getElementById('inputCancel');
                    if (cancelBtn) cancelBtn.click();
                }
            });
        }

        // 点击背景关闭
        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.hideModal();
            });
        }

        const confirmDialog = document.getElementById('confirmDialog');
        if (confirmDialog) {
            confirmDialog.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    if (this.confirmReject) this.confirmReject();
                    this.hideConfirmDialog();
                }
            });
        }

        const inputDialog = document.getElementById('inputDialog');
        if (inputDialog) {
            inputDialog.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    if (this.inputReject) this.inputReject();
                    this.hideInputDialog();
                }
            });
        }
    }

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('modal').classList.remove('hidden');
        document.getElementById('modal').classList.add('flex');
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('modal').classList.remove('flex');
    }

    showConfirm(title, message) {
        console.log('显示确认对话框:', title, message);
        return new Promise((resolve, reject) => {
            this.confirmResolve = resolve;
            this.confirmReject = reject;
            
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const dialogEl = document.getElementById('confirmDialog');
            
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
            if (dialogEl) {
                dialogEl.classList.remove('hidden');
                dialogEl.classList.add('flex');
                console.log('确认对话框已显示');
            } else {
                console.error('找不到确认对话框元素');
            }
        });
    }

    hideConfirmDialog() {
        console.log('隐藏确认对话框');
        const dialogEl = document.getElementById('confirmDialog');
        if (dialogEl) {
            dialogEl.classList.add('hidden');
            dialogEl.classList.remove('flex');
        }
        this.confirmResolve = null;
        this.confirmReject = null;
    }

    showInput(title, label, defaultValue = '') {
        return new Promise((resolve, reject) => {
            this.inputResolve = resolve;
            this.inputReject = reject;
            
            document.getElementById('inputTitle').textContent = title;
            document.getElementById('inputLabel').textContent = label;
            document.getElementById('inputField').value = defaultValue;
            document.getElementById('inputDialog').classList.remove('hidden');
            document.getElementById('inputDialog').classList.add('flex');
            
            // 聚焦输入框并选中文本
            setTimeout(() => {
                const input = document.getElementById('inputField');
                input.focus();
                input.select();
            }, 100);
        });
    }

    hideInputDialog() {
        document.getElementById('inputDialog').classList.add('hidden');
        document.getElementById('inputDialog').classList.remove('flex');
        this.inputResolve = null;
        this.inputReject = null;
    }

    // 替换原生alert的函数
    alert(message, title = '提示') {
        this.showModal(title, `<p style="color: var(--md-on-surface-variant);">${message}</p>`);
    }

    // 替换原生confirm的函数
    confirm(message, title = '确认') {
        return this.showConfirm(title, message);
    }

    // 替换原生prompt的函数
    prompt(message, defaultValue = '', title = '输入') {
        return this.showInput(title, message, defaultValue);
    }
}

// 全局UI实例
let behaviorTreeUI = null;

// 初始化函数
function initBehaviorTreeUI() {
    if (!behaviorTreeUI) {
        behaviorTreeUI = new BehaviorTreeUI();
        behaviorTreeUI.init();
    }
    return behaviorTreeUI;
}

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBehaviorTreeUI);
} else {
    initBehaviorTreeUI();
}

// 导出给全局使用
window.BehaviorTreeEditorUI = {
    get ui() { return behaviorTreeUI; },
    get editor() { return behaviorTreeUI?.editor; },
    get dialogManager() { return behaviorTreeUI?.dialogManager; }
}; 