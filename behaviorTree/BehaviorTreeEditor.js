/**
 * 行为树编辑器 - 主编辑器类
 * Behavior Tree Editor - Main Editor Class
 */

class BehaviorTreeEditor {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 配置选项
        this.options = {
            gridSize: 10,
            snapToGrid: false,
            showGrid: true,
            autoLayout: true,
            debug: false,
            performance: true,
            autoSave: false, // 默认关闭自动保存
            autoSaveInterval: 300000, // 5分钟
            maxUndoSteps: 50,
            maxNodes: 10000, // 最大节点数限制
            ...options
        };
        
        // 初始化节点工厂
        this.nodeFactory = nodeFactory;
        
        // 行为树数据
        this.tree = {
            root: null,
            nodes: new Map(),
            metadata: {
                name: '新建行为树 New Behavior Tree',
                description: '',
                version: '1.0.0',
                created: new Date(),
                modified: new Date()
            }
        };
        
        // 视口状态
        this.viewport = {
            x: 0,
            y: 0,
            zoom: 1,
            minZoom: 0.1,
            maxZoom: 3
        };
        
        // 编辑状态
        this.state = {
            mode: 'select', // 'select', 'connect', 'add'
            selectedNodes: new Set(),
            dragData: null,
            hoveredNode: null,
            connecting: null,
            clipboard: null
        };
        
        // 渲染请求ID，用于防抖
        this.renderRequestId = null;
        
        // 历史记录
        this.history = {
            undoStack: [],
            redoStack: [],
            maxSize: this.options.maxUndoSteps
        };

        // 性能监控
        this.performance = {
            frameCount: 0,
            lastFrameTime: 0,
            fps: 60,
            renderTime: 0,
            nodeCount: 0
        };

        // 自动保存
        this.autoSave = {
            timer: null,
            lastSaveTime: Date.now(),
            isDirty: false
        };
        
        // 初始化组件
        this.renderer = new BehaviorTreeRenderer(this.canvas, this.ctx);
        this.simulator = new BehaviorTreeSimulator();
        this.templates = new BehaviorTreeTemplates();
        
        // 搜索和过滤
        this.searchFilter = {
            query: '',
            nodeType: '',
            nodeStatus: '',
            results: []
        };
        
        this.setupEventListeners();
        this.setupUI();
        // 只有在autoSave选项为true时才设置自动保存
        if (this.options.autoSave) {
            this.setupAutoSave();
        }
        this.createExampleTree();
        this.render();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 画布事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // 窗口事件
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * 设置用户界面
     */
    setupUI() {
        // 工具栏按钮事件
        document.getElementById('deleteBtn')?.addEventListener('click', () => this.deleteSelected());
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('fitBtn')?.addEventListener('click', () => this.fitToScreen());
        document.getElementById('playBtn')?.addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stopSimulation());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportTree());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importTree());
    } 

    /**
     * 鼠标按下处理
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
        const y = (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
        
        const clickedNode = this.getNodeAt(x, y);
        
        if (event.button === 0) { // 左键
            if (clickedNode) {
                this.handleNodeClick(clickedNode, event);
            } else {
                this.handleCanvasClick(x, y, event);
            }
        }
    }

    /**
     * 节点点击处理
     */
    handleNodeClick(node, event) {
        if (this.state.mode === 'connect') {
            this.handleConnectionMode(node);
            return;
        }
        
        // 选择逻辑
        if (!event.ctrlKey && !event.shiftKey) {
            this.clearSelection();
        }
        
        if (event.ctrlKey) {
            this.toggleNodeSelection(node);
        } else {
            this.selectNode(node);
        }
        
        // 立即渲染以更新选中效果
        this.render();
        
        // 开始拖拽
        this.startDrag(node, event);
    }

    /**
     * 画布点击处理
     */
    handleCanvasClick(x, y, event) {
        if (this.state.mode === 'add') {
            this.addNodeAtPosition(x, y);
            return;
        }
        
        // 检查是否点击了连接线
        const clickedConnection = this.getConnectionAt(x, y);
        
        if (clickedConnection) {
            this.handleConnectionClick(clickedConnection, event);
            return;
        }
        
        if (!event.ctrlKey) {
            this.clearSelection();
        }
        
        // 开始画布拖拽
        this.startCanvasDrag(event);
    }

    /**
     * 鼠标移动处理
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
        const y = (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
        
        // 更新悬停状态
        const hoveredNode = this.getNodeAt(x, y);
        if (hoveredNode !== this.state.hoveredNode) {
            this.state.hoveredNode = hoveredNode;
            this.updateCursor();
        }
        
        // 处理拖拽
        if (this.state.dragData) {
            this.handleDrag(event);
        }
        
        // 更新状态栏
        this.updateStatusBar(x, y);
    }

    /**
     * 开始拖拽
     */
    startDrag(node, event) {
        this.state.dragData = {
            type: 'node',
            nodes: this.state.selectedNodes.has(node) ? 
                   Array.from(this.state.selectedNodes) : [node],
            startX: event.clientX,
            startY: event.clientY,
            nodeStartPositions: new Map()
        };
        
        // 记录每个节点的起始位置
        this.state.dragData.nodes.forEach(dragNode => {
            this.state.dragData.nodeStartPositions.set(dragNode, {
                x: dragNode.x,
                y: dragNode.y
            });
        });
        
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * 处理拖拽
     */
    handleDrag(event) {
        if (this.state.dragData.type === 'node') {
            const deltaX = (event.clientX - this.state.dragData.startX) / this.viewport.zoom;
            const deltaY = (event.clientY - this.state.dragData.startY) / this.viewport.zoom;
            this.dragNodes(deltaX, deltaY);
        } else if (this.state.dragData.type === 'canvas') {
            const rect = this.canvas.getBoundingClientRect();
            this.dragCanvas(event.clientX - rect.left, event.clientY - rect.top);
        }
        
        this.render();
    }

    /**
     * 开始画布拖拽
     */
    startCanvasDrag(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.state.dragData = {
            type: 'canvas',
            startX: event.clientX - rect.left,
            startY: event.clientY - rect.top,
            startViewportX: this.viewport.x,
            startViewportY: this.viewport.y
        };
        
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * 拖拽画布
     */
    dragCanvas(currentX, currentY) {
        const deltaX = currentX - this.state.dragData.startX;
        const deltaY = currentY - this.state.dragData.startY;
        
        this.viewport.x = this.state.dragData.startViewportX + deltaX;
        this.viewport.y = this.state.dragData.startViewportY + deltaY;
    }

    /**
     * 右键菜单处理
     */
    handleContextMenu(event) {
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
        const y = (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
        
        const clickedNode = this.getNodeAt(x, y);
        
        if (clickedNode) {
            // 如果右键的节点没有被选中，则选中它
            if (!this.state.selectedNodes.has(clickedNode)) {
                this.clearSelection();
                this.selectNode(clickedNode);
            }
            this.showNodeContextMenu(clickedNode, event.clientX, event.clientY);
        } else {
            this.showCanvasContextMenu(x, y, event.clientX, event.clientY);
        }
    }

    /**
     * 显示节点上下文菜单
     */
    showNodeContextMenu(node, screenX, screenY) {
        const selectedCount = this.state.selectedNodes.size;
        const isMultiSelect = selectedCount > 1;
        
        const menuItems = [
            {
                icon: 'fas fa-edit',
                text: '编辑节点',
                shortcut: 'Enter',
                action: () => this.editSelectedNodes()
            },
            {
                icon: 'fas fa-clone',
                text: '复制节点',
                shortcut: 'Ctrl+D',
                action: () => this.duplicateSelectedNodes()
            },
            { type: 'separator' },
            {
                icon: 'fas fa-plus',
                text: '创建子节点',
                disabled: !node.canHaveChildren(),
                submenu: this.createChildNodeSubmenu(node)
            },
            {
                icon: 'fas fa-link',
                text: '开始连接',
                action: () => this.startConnectionMode(node)
            },
            {
                icon: 'fas fa-unlink',
                text: '断开连接',
                action: () => this.disconnectNode(node)
            },
            { type: 'separator' },
            {
                icon: 'fas fa-arrow-up',
                text: '上移',
                disabled: !this.canMoveNodeUp(node),
                action: () => this.moveNodeUp(node)
            },
            {
                icon: 'fas fa-arrow-down',
                text: '下移',
                disabled: !this.canMoveNodeDown(node),
                action: () => this.moveNodeDown(node)
            },
            { type: 'separator' },
            {
                icon: 'fas fa-palette',
                text: '更改颜色',
                action: () => this.changeNodeColor(node)
            },
            {
                icon: 'fas fa-trash-alt',
                text: '删除节点',
                shortcut: 'Delete',
                danger: true,
                action: () => this.deleteSelected()
            }
        ];
        
        this.showContextMenu(menuItems, screenX, screenY);
    }

    /**
     * 创建子节点子菜单
     */
    createChildNodeSubmenu(parentNode) {
        if (!parentNode.canHaveChildren()) {
            return [];
        }

        return [
            {
                icon: 'fas fa-code-branch',
                text: '选择器 Selector',
                action: () => this.addChildNodeToParent(parentNode, NodeType.SELECTOR)
            },
            {
                icon: 'fas fa-list-ol',
                text: '序列器 Sequence',
                action: () => this.addChildNodeToParent(parentNode, NodeType.SEQUENCE)
            },
            {
                icon: 'fas fa-grip-lines',
                text: '并行器 Parallel',
                action: () => this.addChildNodeToParent(parentNode, NodeType.PARALLEL)
            },
            { type: 'separator' },
            {
                icon: 'fas fa-exchange-alt',
                text: '反转器 Inverter',
                action: () => this.addChildNodeToParent(parentNode, NodeType.INVERTER)
            },
            {
                icon: 'fas fa-redo',
                text: '重复器 Repeater',
                action: () => this.addChildNodeToParent(parentNode, NodeType.REPEATER)
            },
            {
                icon: 'fas fa-clock',
                text: '超时器 Timeout',
                action: () => this.addChildNodeToParent(parentNode, NodeType.TIMEOUT)
            },
            { type: 'separator' },
            {
                icon: 'fas fa-play',
                text: '动作节点 Action',
                action: () => this.addChildNodeToParent(parentNode, NodeType.ACTION)
            },
            {
                icon: 'fas fa-question-circle',
                text: '条件节点 Condition',
                action: () => this.addChildNodeToParent(parentNode, NodeType.CONDITION)
            },
            {
                icon: 'fas fa-pause',
                text: '等待节点 Wait',
                action: () => this.addChildNodeToParent(parentNode, NodeType.WAIT)
            }
        ];
    }

    /**
     * 为父节点添加子节点
     */
    addChildNodeToParent(parentNode, nodeType) {
        // 计算子节点的位置
        const childY = parentNode.y + 120; // 在父节点下方120像素
        let childX = parentNode.x;
        
        // 如果父节点已有子节点，则水平分布
        if (parentNode.children.length > 0) {
            const siblingCount = parentNode.children.length;
            const spacing = 150; // 子节点间距
            const totalWidth = siblingCount * spacing;
            childX = parentNode.x - totalWidth / 2 + siblingCount * spacing;
        }
        
        // 创建新节点
        const childNode = this.addNode(nodeType, childX, childY);
        
        // 连接到父节点
        this.connectNodes(parentNode, childNode);
        
        // 选中新创建的节点
        this.clearSelection();
        this.selectNode(childNode);
        
        // 保存历史状态
        this.saveHistoryState('创建子节点 Create Child Node');
        this.markAsDirty();
        
        // 更新界面
        this.render();
        this.updateNodesList();
        
        this.showToast(`已为 ${parentNode.name} 创建子节点: ${childNode.name}`, 'success');
        
        return childNode;
    }

    /**
     * 显示画布上下文菜单
     */
    showCanvasContextMenu(canvasX, canvasY, screenX, screenY) {
        const menuItems = [
            {
                icon: 'fas fa-code-branch',
                text: '选择器 Selector',
                action: () => {
                    const node = this.addNodeAtPosition(canvasX, canvasY, NodeType.SELECTOR);
                    if (node) {
                        this.clearSelection();
                        this.selectNode(node);
                        this.render();
                    }
                }
            },
            {
                icon: 'fas fa-list-ol',
                text: '序列器 Sequence',
                action: () => {
                    const node = this.addNodeAtPosition(canvasX, canvasY, NodeType.SEQUENCE);
                    if (node) {
                        this.clearSelection();
                        this.selectNode(node);
                        this.render();
                    }
                }
            },
            {
                icon: 'fas fa-play',
                text: '动作节点 Action',
                action: () => {
                    const node = this.addNodeAtPosition(canvasX, canvasY, NodeType.ACTION);
                    if (node) {
                        this.clearSelection();
                        this.selectNode(node);
                        this.render();
                    }
                }
            },
            {
                icon: 'fas fa-question-circle',
                text: '条件节点 Condition',
                action: () => {
                    const node = this.addNodeAtPosition(canvasX, canvasY, NodeType.CONDITION);
                    if (node) {
                        this.clearSelection();
                        this.selectNode(node);
                        this.render();
                    }
                }
            },
            { type: 'separator' },
            {
                icon: 'fas fa-paste',
                text: '粘贴 Paste',
                shortcut: 'Ctrl+V',
                disabled: !this.state.clipboard,
                action: () => this.pasteAtPosition(canvasX, canvasY)
            },
            {
                icon: 'fas fa-expand',
                text: '适应画布 Fit to Screen',
                shortcut: 'F',
                action: () => this.fitToScreen()
            }
        ];
        
        this.showContextMenu(menuItems, screenX, screenY);
    }

    /**
     * 键盘事件处理
     */
    handleKeyDown(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    event.preventDefault();
                    this.copySelected();
                    break;
                case 'x':
                    event.preventDefault();
                    this.cutSelected();
                    break;
                case 'v':
                    event.preventDefault();
                    this.pasteClipboard();
                    break;
                case 'd':
                    event.preventDefault();
                    this.duplicateSelectedNodes();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAll();
                    break;
                case '=':
                case '+':
                    event.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    event.preventDefault();
                    this.zoomOut();
                    break;
            }
        } else {
            switch (event.key) {
                case 'Delete':
                    this.deleteSelected();
                    break;
                case 'Escape':
                    this.clearSelection();
                    this.state.mode = 'select';
                    this.hideContextMenu();
                    break;
                case 'Enter':
                    if (this.state.selectedNodes.size > 0) {
                        this.editSelectedNodes();
                    }
                    break;
                case 'f':
                case 'F':
                    event.preventDefault();
                    this.fitToScreen();
                    break;
            }
        }
    }

    /**
     * 键盘释放处理
     */
    handleKeyUp(event) {
        // 可以用于处理键盘状态
    }

    /**
     * 窗口大小改变处理
     */
    handleResize() {
        this.renderer.setupCanvas();
        this.render();
    }

    /**
     * 连接模式处理
     */
    handleConnectionMode(node) {
        if (!this.state.connecting) {
            // 开始连接
            this.state.connecting = node;
            this.canvas.style.cursor = 'crosshair';
        } else {
            // 完成连接
            if (this.state.connecting !== node) {
                this.connectNodes(this.state.connecting, node);
            }
            this.state.connecting = null;
            this.state.mode = 'select';
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * 在指定位置添加节点
     */
    addNodeAtPosition(x, y, nodeType) {
        if (!nodeType) {
            // 显示节点选择对话框
            nodeType = 'action'; // 默认类型
        }
        
        const node = this.addNode(nodeType, x, y,this.tree.root);
        this.state.mode = 'select';
        
        // 如果有选中的节点且该节点可以有子节点，自动连接
        if (this.state.selectedNodes.size === 1) {
            const selectedNode = Array.from(this.state.selectedNodes)[0];
            if (selectedNode.canHaveChildren()) {
                
                this.connectNodes(selectedNode, node);
                this.showToast(`已将 ${node.name} 连接到 ${selectedNode.name}`);
            }
        }
        
        // 确保画布更新
        this.render();
        this.updateNodesList();
        
        return node;
    }

    /**
     * 复制选中节点
     */
    copySelected() {
        if (this.state.selectedNodes.size === 0) return;
        
        const selectedArray = Array.from(this.state.selectedNodes);
        this.state.clipboard = {
            nodes: selectedArray.map(node => this.nodeFactory.nodeToData(node)),
            timestamp: Date.now()
        };
    }

    /**
     * 粘贴剪贴板内容（快捷键用）
     */
    pasteClipboard() {
        if (!this.state.clipboard) return;
        
        // 在画布中心粘贴
        const rect = this.canvas.getBoundingClientRect();
        const centerX = (rect.width / 2 - this.viewport.x) / this.viewport.zoom;
        const centerY = (rect.height / 2 - this.viewport.y) / this.viewport.zoom;
        
        this.pasteAtPosition(centerX, centerY);
    }
    
    /**
     * 在指定位置粘贴
     */
    pasteAtPosition(x, y) {
        if (!this.state.clipboard) return;
        
        this.clearSelection();
        
        this.state.clipboard.nodes.forEach(nodeData => {
            const node = this.nodeFactory.createNodeFromData(nodeData);
            node.setPosition(x, y);
            
            this.tree.nodes.set(node.id, node);
            this.selectNode(node);
            
            x += 50; // 偏移避免重叠
        });
        
        this.saveHistoryState('粘贴节点');
        this.render();
    }

    /**
     * 全选节点
     */
    selectAll() {
        this.clearSelection();
        this.tree.nodes.forEach(node => {
            this.selectNode(node);
        });
        this.render();
    }

    /**
     * 缩放功能
     */
    zoomIn() {
        this.setZoom(this.viewport.zoom * 1.2);
    }

    zoomOut() {
        this.setZoom(this.viewport.zoom / 1.2);
    }

        setZoom(zoom) {
        this.viewport.zoom = Math.max(this.viewport.minZoom,
            Math.min(this.viewport.maxZoom, zoom));
        this.updateGridBackground();
        this.render();
    }

    /**
     * 适应屏幕
     */
    fitToScreen() {
        if (this.tree.nodes.size === 0) return;
        
        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.tree.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });
        
        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;
        const margin = 50;
        
        const canvasWidth = this.canvas.clientWidth - margin * 2;
        const canvasHeight = this.canvas.clientHeight - margin * 2;
        
        const scaleX = canvasWidth / treeWidth;
        const scaleY = canvasHeight / treeHeight;
        const scale = Math.min(scaleX, scaleY, this.viewport.maxZoom);
        
        this.viewport.zoom = scale;
        this.viewport.x = (canvasWidth - treeWidth * scale) / 2 - minX * scale + margin;
        this.viewport.y = (canvasHeight - treeHeight * scale) / 2 - minY * scale + margin;
        
        this.render();
    }

    /**
     * 开始模拟
     */
    startSimulation() {
        if (this.simulator.start(this.tree)) {
            this.updateSimulationUI(true);
        }
    }

    /**
     * 停止模拟
     */
    stopSimulation() {
        this.simulator.stop();
        this.updateSimulationUI(false);
        this.render();
    }

    /**
     * 暂停模拟
     */
    pauseSimulation() {
        this.simulator.pause();
    }

    /**
     * 继续模拟
     */
    resumeSimulation() {
        this.simulator.resume();
    }

    /**
     * 单步执行
     */
    stepSimulation() {
        this.simulator.step();
        this.render();
    }

    /**
     * 更新模拟UI状态
     */
    updateSimulationUI(isRunning) {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const executionStatus = document.getElementById('executionStatus');
        
        if (isRunning) {
            playBtn?.classList.add('hidden');
            pauseBtn?.classList.remove('hidden');
            stopBtn?.classList.remove('hidden');
            executionStatus?.classList.remove('hidden');
        } else {
            playBtn?.classList.remove('hidden');
            pauseBtn?.classList.add('hidden');
            stopBtn?.classList.add('hidden');
            executionStatus?.classList.add('hidden');
        }
    }

    /**
     * 更新属性面板
     */
    updatePropertyPanel() {
        const propertiesPanel = document.getElementById('propertiesPanel');
        const selectedNodeInfo = document.getElementById('selectedNodeInfo');
        
        if (!selectedNodeInfo) return;
        
        if (this.state.selectedNodes.size === 1) {
            const node = Array.from(this.state.selectedNodes)[0];
            
            // 更新属性面板内容
            let html = `
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-medium mb-1" style="color: var(--md-on-surface);">名称</label>
                        <input type="text" id="nodeName" value="${node.name || ''}" 
                               class="w-full px-2 py-1 text-sm rounded" placeholder="节点名称">
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1" style="color: var(--md-on-surface);">类型</label>
                        <input type="text" value="${node.type}" readonly
                               class="w-full px-2 py-1 text-sm rounded bg-gray-100" style="cursor: not-allowed;">
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1" style="color: var(--md-on-surface);">描述</label>
                        <textarea id="nodeDescription" rows="3" 
                                  class="w-full px-2 py-1 text-sm rounded" 
                                  placeholder="节点描述">${node.metadata.description || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1" style="color: var(--md-on-surface);">状态</label>
                        <span class="text-sm ${this.getStatusColor(node.status)}">${node.status}</span>
                    </div>
                </div>
            `;
            
            selectedNodeInfo.innerHTML = html;
            
            // 绑定更新事件
            const nameInput = document.getElementById('nodeName');
            const descriptionTextarea = document.getElementById('nodeDescription');
            
            if (nameInput) {
                nameInput.addEventListener('input', (e) => {
                    node.name = e.target.value;
                    this.updateNodesList();
                    this.markAsDirty();
                });
            }
            
            if (descriptionTextarea) {
                descriptionTextarea.addEventListener('input', (e) => {
                    node.metadata.description = e.target.value;
                    this.markAsDirty();
                });
            }
        } else if (this.state.selectedNodes.size > 1) {
            selectedNodeInfo.innerHTML = `
                <div class="text-sm" style="color: var(--md-on-surface-variant);">
                    已选择 ${this.state.selectedNodes.size} 个节点
                </div>
            `;
        } else {
            selectedNodeInfo.innerHTML = `
                <div class="text-sm" style="color: var(--md-on-surface-variant);">
                    点击节点查看属性
                </div>
            `;
        }
    }
    
    getStatusColor(status) {
        const colors = {
            'ready': 'text-gray-500',
            'running': 'text-blue-500',
            'success': 'text-green-500',
            'failure': 'text-red-500',
            'error': 'text-orange-500'
        };
        return colors[status] || 'text-gray-500';
    }

    /**
     * 更新状态栏
     */
    updateStatusBar(x, y) {
        // 更新坐标显示和缩放信息
        const statusText = `坐标: (${Math.round(x)}, ${Math.round(y)}) | 缩放: ${Math.round(this.viewport.zoom * 100)}% | 节点: ${this.tree.nodes.size}`;
        
        // 如果有状态栏元素，更新显示
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
            statusBar.textContent = statusText;
        }
    }

    /**
     * 导入行为树
     */
    importTree() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
            
            // 添加事件监听器（如果还没有）
            if (!fileInput.hasAttribute('data-listener-attached')) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const data = JSON.parse(event.target.result);
                                this.loadTreeFromData(data);
                                this.showToast('导入成功', 'success');
                            } catch (error) {
                                console.error('导入失败:', error);
                                this.showToast('导入失败：文件格式错误', 'error');
                            }
                        };
                        reader.readAsText(file);
                    }
                    fileInput.value = ''; // 清空以允许重复导入同一文件
                });
                fileInput.setAttribute('data-listener-attached', 'true');
            }
        }
    }

    /**
     * 从数据恢复行为树
     */
    loadTreeFromData(data) {
        // 清空现有数据
        this.tree.nodes.clear();
        this.tree.root = null;
        this.tree.metadata = data.metadata || {
            name: '导入的行为树',
            description: '',
            version: '1.0.0',
            created: new Date(),
            modified: new Date()
        };
        
        // 如果有root数据，重建节点树
        if (data.root) {
            this.tree.root = this.nodeFactory.createNodeFromData(data.root);
            this.rebuildNodeMap(this.tree.root);
        }
        
        this.clearSelection();
        this.fitToScreen();
        this.updateNodesList();
        this.render();
    }

    /**
     * 拖拽节点
     */
    dragNodes(deltaX, deltaY) {
        this.state.dragData.nodes.forEach(node => {
            const startPos = this.state.dragData.nodeStartPositions.get(node);
            const newX = this.snapToGrid(startPos.x + deltaX);
            const newY = this.snapToGrid(startPos.y + deltaY);
            node.setPosition(newX, newY);
        });
    }

    /**
     * 鼠标释放处理
     */
    handleMouseUp(event) {
        if (this.state.dragData) {
            if (this.state.dragData.type === 'node') {
                this.saveHistoryState('移动节点 Move Node');
            }
            this.state.dragData = null;
        }
        
        this.canvas.style.cursor = 'default';
        this.updateCursor();
    }

    /**
     * 滚轮处理（缩放）
     */
    handleWheel(event) {
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.viewport.minZoom, 
                        Math.min(this.viewport.maxZoom, this.viewport.zoom * zoomFactor));
        
        if (newZoom !== this.viewport.zoom) {
            // 围绕鼠标位置缩放
            this.viewport.x = mouseX - (mouseX - this.viewport.x) * (newZoom / this.viewport.zoom);
            this.viewport.y = mouseY - (mouseY - this.viewport.y) * (newZoom / this.viewport.zoom);
            this.viewport.zoom = newZoom;
            
            this.render();
        }
    }

    /**
     * 添加节点
     */
    addNode(type, x = 0, y = 0) {
        // 使用NodeFactory创建节点
        const node = this.nodeFactory.createNode(type);
        node.setPosition(x, y);
        
        this.tree.nodes.set(node.id, node);
        
        // 如果没有根节点且添加的是根节点类型，设置为根节点
        if (!this.tree.root && type === NodeType.ROOT) {
            this.tree.root = node;
        }
        
        // 如果没有根节点且添加的不是根节点类型，创建一个根节点
        if (!this.tree.root && type !== NodeType.ROOT) {
            const rootNode = this.nodeFactory.createNode(NodeType.ROOT);
            rootNode.setPosition(x, y - 100);
            rootNode.name = '根节点 Root';
            this.tree.nodes.set(rootNode.id, rootNode);
            this.tree.root = rootNode;
            
            // 将新节点作为根节点的子节点
            rootNode.addChild(node);
        }

        this.saveHistoryState('添加节点 Add Node');
        this.markAsDirty();
        
        // 确保UI更新
        this.updateNodesList();
        this.render();
        
        return node;
    }

    /**
     * 删除选中节点
     */
    deleteSelected() {
        if (this.state.selectedNodes.size === 0) return;
        
        const nodesToDelete = Array.from(this.state.selectedNodes);
        
        // 递归删除节点及其所有子节点
        const deleteNodeRecursive = (node) => {
            // 先删除所有子节点
            const children = [...node.children];
            children.forEach(child => deleteNodeRecursive(child));
            
            // 从父节点中移除
            if (node.parent) {
                node.parent.removeChild(node);
            }
            
            // 从树中移除
            this.tree.nodes.delete(node.id);
            
            // 如果是根节点，清空根节点引用
            if (this.tree.root === node) {
                this.tree.root = null;
            }
        };
        
        // 删除所有选中的节点
        nodesToDelete.forEach(node => deleteNodeRecursive(node));
        
        this.clearSelection();
        this.updateNodesList();
        this.saveHistoryState('删除节点 Delete Node');
        this.markAsDirty();
        this.render();
    }

    /**
     * 连接两个节点
     */
    connectNodes(parentNode, childNode) {
        if (!parentNode.canHaveChildren()) {
            this.showMessage('该节点不能有子节点 Node cannot have children');
            return false;
        }
        
        if (childNode.parent === parentNode) {
            return false; // 已经连接
        }
        
        parentNode.addChild(childNode);
        this.saveHistoryState('连接节点 Connect Nodes');
        this.markAsDirty();
        this.render();
        return true;
    }

    /**
     * 选择节点
     */
    selectNode(node) {
        this.state.selectedNodes.add(node);
        node.isSelected = true;
        this.updatePropertyPanel();
        this.updateNodesList();
        // 立即渲染以更新选中效果
        this.render();
    }

    /**
     * 切换节点选择状态
     */
    toggleNodeSelection(node) {
        if (this.state.selectedNodes.has(node)) {
            this.state.selectedNodes.delete(node);
            node.isSelected = false;
        } else {
            this.selectNode(node);
            return; // selectNode已经会调用render()
        }
        this.updatePropertyPanel();
        this.updateNodesList();
        // 立即渲染以更新选中效果
        this.render();
    }

    /**
     * 清空选择
     */
    clearSelection() {
        this.state.selectedNodes.forEach(node => {
            node.isSelected = false;
        });
        this.state.selectedNodes.clear();
        this.updatePropertyPanel();
        this.updateNodesList();
        // 立即渲染以更新选中效果
        this.render();
    }

    /**
     * 获取指定位置的节点
     */
    getNodeAt(x, y) {
        // 从后往前遍历（优先选择上层节点）
        const nodes = Array.from(this.tree.nodes.values()).reverse();
        return nodes.find(node => node.containsPoint(x, y));
    }

    /**
     * 获取指定位置的连接线
     */
    getConnectionAt(x, y) {
        const tolerance = 5; // 点击容差
        
        for (const node of this.tree.nodes.values()) {
            for (const child of node.children) {
                if (this.isPointOnConnection(x, y, node, child, tolerance)) {
                    return { parent: node, child: child };
                }
            }
        }
        return null;
    }

    /**
     * 检查点是否在连接线上
     */
    isPointOnConnection(x, y, parentNode, childNode, tolerance) {
        const parentPoint = parentNode.getConnectionPoints().output;
        const childPoint = childNode.getConnectionPoints().input;
        
        // 简化：检查点到贝塞尔曲线的距离
        // 这里使用线段近似
        const segments = 10;
        for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            const p1 = this.getBezierPoint(parentPoint, childPoint, t1);
            const p2 = this.getBezierPoint(parentPoint, childPoint, t2);
            
            if (this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) < tolerance) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 获取贝塞尔曲线上的点
     */
    getBezierPoint(startPoint, endPoint, t) {
        const curveOffset = 50;
        const controlY1 = startPoint.y + curveOffset;
        const controlY2 = endPoint.y - curveOffset;
        
        // 三次贝塞尔曲线
        const x = Math.pow(1 - t, 3) * startPoint.x +
                  3 * Math.pow(1 - t, 2) * t * startPoint.x +
                  3 * (1 - t) * Math.pow(t, 2) * endPoint.x +
                  Math.pow(t, 3) * endPoint.x;
                  
        const y = Math.pow(1 - t, 3) * startPoint.y +
                  3 * Math.pow(1 - t, 2) * t * controlY1 +
                  3 * (1 - t) * Math.pow(t, 2) * controlY2 +
                  Math.pow(t, 3) * endPoint.y;
        
        return { x, y };
    }

    /**
     * 计算点到线段的距离
     */
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }

    /**
     * 处理连接线点击
     */
    handleConnectionClick(connection, event) {
        // 选中连接线的两个节点
        if (!event.ctrlKey) {
            this.clearSelection();
        }
        
        this.selectNode(connection.parent);
        this.selectNode(connection.child);
        
        this.showToast(`已选中连接: ${connection.parent.name} → ${connection.child.name}`);
    }

    /**
     * 对齐到网格
     */
    snapToGrid(value) {
        if (!this.options.snapToGrid) return value;
        return Math.round(value / this.options.gridSize) * this.options.gridSize;
    }

    /**
     * 保存历史状态
     */
    saveHistoryState(description) {
        // 创建树的深拷贝，但转换节点为数据格式
        const treeData = {
            root: this.tree.root ? this.nodeFactory.nodeToData(this.tree.root) : null,
            metadata: { ...this.tree.metadata }
        };
        
        const state = {
            tree: treeData,
            description,
            timestamp: Date.now()
        };
        
        this.history.undoStack.push(state);
        this.history.redoStack = []; // 清空重做栈
        
        // 限制历史记录大小
        if (this.history.undoStack.length > this.history.maxSize) {
            this.history.undoStack.shift();
        }
    }

    /**
     * 撤销操作
     */
    undo() {
        if (this.history.undoStack.length === 0) return;
        
        const currentState = {
            tree: JSON.parse(JSON.stringify(this.tree)),
            timestamp: Date.now()
        };
        this.history.redoStack.push(currentState);
        
        const previousState = this.history.undoStack.pop();
        this.restoreState(previousState);
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.history.redoStack.length === 0) return;
        
        const currentState = {
            tree: JSON.parse(JSON.stringify(this.tree)),
            timestamp: Date.now()
        };
        this.history.undoStack.push(currentState);
        
        const nextState = this.history.redoStack.pop();
        this.restoreState(nextState);
    }

    /**
     * 恢复状态
     */
    restoreState(state) {
        // 清空现有数据
        this.tree.nodes.clear();
        this.tree.root = null;
        this.tree.metadata = state.tree.metadata;
        
        // 重建节点对象
        if (state.tree.root) {
            this.tree.root = this.nodeFactory.createNodeFromData(state.tree.root);
            this.rebuildNodeMap(this.tree.root);
        }
        
        this.clearSelection();
        this.render();
    }

    /**
     * 重建节点映射
     */
    rebuildNodeMap(node) {
        if (!node) return;
        
        // 清空现有映射
        this.tree.nodes.clear();
        
        // 递归添加所有节点到映射
        const addToMap = (n) => {
            this.tree.nodes.set(n.id, n);
            if (n.children && n.children.length > 0) {
                n.children.forEach(child => addToMap(child));
            }
        };
        
        addToMap(node);
    }

    /**
     * 创建示例行为树
     */
    createExampleTree() {
        // 创建根节点
        const root = this.addNode(NodeType.ROOT, 400, 50);
        
        // 创建选择器
        const selector = this.addNode(NodeType.SELECTOR, 400, 150);
        this.connectNodes(root, selector);
        
        // 创建序列器
        const sequence1 = this.addNode(NodeType.SEQUENCE, 200, 250);
        const sequence2 = this.addNode(NodeType.SEQUENCE, 600, 250);
        this.connectNodes(selector, sequence1);
        this.connectNodes(selector, sequence2);
        
        // 创建叶子节点
        const condition1 = this.addNode(NodeType.CONDITION, 100, 350);
        const action1 = this.addNode(NodeType.ACTION, 300, 350);
        condition1.name = '检查敌人 Check Enemy';
        action1.name = '攻击 Attack';
        
        this.connectNodes(sequence1, condition1);
        this.connectNodes(sequence1, action1);
        
        const condition2 = this.addNode(NodeType.CONDITION, 500, 350);
        const action2 = this.addNode(NodeType.ACTION, 700, 350);
        condition2.name = '检查血量 Check Health';
        action2.name = '治疗 Heal';
        
        this.connectNodes(sequence2, condition2);
        this.connectNodes(sequence2, action2);
        
        this.saveHistoryState('创建示例树 Create Example Tree');
    }

    /**
     * 渲染
     */
    render() {
        // 取消之前的渲染请求
        if (this.renderRequestId) {
            cancelAnimationFrame(this.renderRequestId);
        }
        
        // 使用requestAnimationFrame确保渲染在下一帧进行
        this.renderRequestId = requestAnimationFrame(() => {
            this.updatePerformanceStats();
            this.renderer.render(this.tree, this.viewport);
            this.updateGridBackground();
            this.renderer.updateFPS();
            this.renderRequestId = null;
        });
    }

    /**
     * 更新网格背景
     */
    updateGridBackground() {
        const canvasContainer = document.getElementById('canvas');
        const gridSize = 12 * this.viewport.zoom; // 细网格大小
        const majorGridSize = 120 * this.viewport.zoom; // 粗网格大小 (每10个细网格)
        
        // 计算网格偏移量
        const offsetX = (this.viewport.x * this.viewport.zoom) % gridSize;
        const offsetY = (this.viewport.y * this.viewport.zoom) % gridSize;
        const majorOffsetX = (this.viewport.x * this.viewport.zoom) % majorGridSize;
        const majorOffsetY = (this.viewport.y * this.viewport.zoom) % majorGridSize;

        canvasContainer.style.backgroundSize = `${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`;
        canvasContainer.style.backgroundPosition = `${majorOffsetX}px ${majorOffsetY}px, ${majorOffsetX}px ${majorOffsetY}px, ${offsetX}px ${offsetY}px, ${offsetX}px ${offsetY}px`;
    }

    /**
     * 更新鼠标样式
     */
    updateCursor() {
        if (this.state.hoveredNode) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * 显示消息
     */
    showMessage(message) {
        this.showToast(message, 'info');
        
        // 简单的消息提示
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * 导出行为树
     */
    exportTree() {
        const data = {
            root: this.tree.root ? this.nodeFactory.nodeToData(this.tree.root) : null,
            metadata: {
                ...this.tree.metadata,
                exported: new Date(),
                nodeCount: this.tree.nodes.size,
                version: '2.0.0'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tree.metadata.name || 'behavior_tree'}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('导出成功', 'success');
    }

    // ==================== 右键菜单系统 ====================

    /**
     * 显示上下文菜单
     */
    showContextMenu(menuItems, x, y) {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        // 隐藏现有菜单
        this.hideContextMenu();

        // 收集菜单动作
        this.currentMenuActions = this.collectMenuActions(menuItems);

        // 生成菜单HTML
        contextMenu.innerHTML = this.generateMenuHTML(menuItems);

        // 设置位置
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';

        // 显示菜单
        contextMenu.classList.add('show');

        // 调整位置以防止超出屏幕
        this.adjustMenuPosition(contextMenu, x, y);

        // 绑定事件
        this.bindMenuEvents(contextMenu);

        // 点击其他地方隐藏菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenuHandler, true);
            document.addEventListener('contextmenu', this.hideContextMenuHandler, true);
        }, 0);
    }

    /**
     * 生成菜单HTML
     */
    generateMenuHTML(menuItems) {
        let html = '';
        
        menuItems.forEach(item => {
            if (item.type === 'separator') {
                html += '<div class="context-menu-separator"></div>';
            } else {
                const disabled = item.disabled ? 'disabled' : '';
                const danger = item.danger ? 'danger' : '';
                const hasSubmenu = item.submenu ? 'context-menu-submenu' : '';
                const checked = item.checked ? '✓ ' : '';
                
                html += `
                    <button class="context-menu-item ${disabled} ${danger} ${hasSubmenu}" 
                            data-action="${item.action ? 'action' : ''}"
                            ${item.disabled ? 'disabled' : ''}>
                        <i class="context-menu-icon ${item.icon}"></i>
                        <div class="context-menu-text">
                            <div>${checked}${item.text}</div>
                            ${item.subtext ? `<div style="font-size: 11px; opacity: 0.7;">${item.subtext}</div>` : ''}
                        </div>
                        ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
                        ${item.submenu ? this.generateSubmenuHTML(item.submenu) : ''}
                    </button>
                `;
            }
        });
        
        return html;
    }

    /**
     * 生成子菜单HTML
     */
    generateSubmenuHTML(submenuItems) {
        let html = '<div class="context-submenu">';
        
        submenuItems.forEach(item => {
            if (item.type === 'separator') {
                html += '<div class="context-menu-separator"></div>';
            } else {
                const disabled = item.disabled ? 'disabled' : '';
                const danger = item.danger ? 'danger' : '';
                const hasSubmenu = item.submenu ? 'context-menu-submenu' : '';
                const checked = item.checked ? '✓ ' : '';
                
                html += `
                    <button class="context-menu-item ${disabled} ${danger} ${hasSubmenu}" 
                            data-action="${item.action ? 'action' : ''}"
                            ${item.disabled ? 'disabled' : ''}>
                        <i class="context-menu-icon ${item.icon}"></i>
                        <div class="context-menu-text">
                            <div>${checked}${item.text}</div>
                            ${item.subtext ? `<div style="font-size: 11px; opacity: 0.7;">${item.subtext}</div>` : ''}
                        </div>
                        ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
                        ${item.submenu ? this.generateSubmenuHTML(item.submenu) : ''}
                    </button>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    /**
     * 调整菜单位置
     */
    adjustMenuPosition(menu, x, y) {
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 水平位置调整
        if (x + rect.width > windowWidth) {
            menu.style.left = (windowWidth - rect.width - 10) + 'px';
        }

        // 垂直位置调整
        if (y + rect.height > windowHeight) {
            menu.style.top = (windowHeight - rect.height - 10) + 'px';
        }
    }

    /**
     * 绑定菜单事件
     */
    bindMenuEvents(menu) {
        const items = menu.querySelectorAll('.context-menu-item[data-action="action"]');
        
        items.forEach((item, index) => {
            if (!item.disabled) {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.executeMenuAction(index);
                    this.hideContextMenu();
                });
            }
        });
    }

    /**
     * 执行菜单动作
     */
    executeMenuAction(index) {
        if (this.currentMenuActions && this.currentMenuActions[index]) {
            try {
                this.currentMenuActions[index]();
            } catch (error) {
                console.error('菜单动作执行失败:', error);
                this.showMessage('操作失败: ' + error.message);
            }
        }
    }

    /**
     * 隐藏上下文菜单
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.classList.remove('show');
            contextMenu.innerHTML = '';
        }
        
        document.removeEventListener('click', this.hideContextMenuHandler, true);
        document.removeEventListener('contextmenu', this.hideContextMenuHandler, true);
        
        this.currentMenuActions = null;
    }

    /**
     * 隐藏菜单事件处理器
     */
    hideContextMenuHandler = (e) => {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu && !contextMenu.contains(e.target)) {
            this.hideContextMenu();
        }
    }

    // ==================== 右键菜单功能实现 ====================

    /**
     * 编辑选中节点
     */
    async editSelectedNodes() {
        if (this.state.selectedNodes.size === 0) return;
        
        const node = Array.from(this.state.selectedNodes)[0];
        
        try {
            const newName = await window.prompt('请输入节点名称:', node.name || node.type, '编辑节点');
            
            if (newName !== null && newName.trim() !== '') {
                this.state.selectedNodes.forEach(n => {
                    n.name = newName.trim();
                });
                this.saveHistoryState('编辑节点名称');
                this.render();
            }
        } catch (error) {
            // 用户取消了输入
        }
    }

    /**
     * 复制选中节点
     */
    duplicateSelectedNodes() {
        if (this.state.selectedNodes.size === 0) return;
        
        const offset = 50;
        const newNodes = [];
        
        this.state.selectedNodes.forEach(node => {
            const nodeData = this.nodeFactory.nodeToData(node);
            const newNode = this.nodeFactory.createNodeFromData(nodeData);
            newNode.setPosition(node.x + offset, node.y + offset);
            
            this.tree.nodes.set(newNode.id, newNode);
            newNodes.push(newNode);
        });
        
        this.clearSelection();
        newNodes.forEach(node => this.selectNode(node));
        
        this.saveHistoryState('复制节点');
        this.render();
    }

    /**
     * 剪切选中节点
     */
    cutSelected() {
        this.copySelected();
        this.deleteSelected();
    }

    /**
     * 在指定位置粘贴
     */
    pasteAtPosition(x, y) {
        if (!this.state.clipboard) return;
        
        this.clearSelection();
        
        this.state.clipboard.nodes.forEach(nodeData => {
            const node = this.nodeFactory.createNodeFromData(nodeData);
            node.setPosition(x, y);
            
            this.tree.nodes.set(node.id, node);
            this.selectNode(node);
            
            x += 50; // 偏移避免重叠
        });
        
        this.saveHistoryState('粘贴节点');
        this.render();
    }

    /**
     * 开始连接模式
     */
    startConnectionMode(node) {
        this.state.mode = 'connect';
        this.state.connecting = node;
        this.canvas.style.cursor = 'crosshair';
        this.showMessage('请选择要连接的目标节点...');
    }

    /**
     * 断开节点连接
     */
    disconnectNode(node) {
        let disconnected = false;
        
        // 断开父连接
        if (node.parent) {
            node.parent.removeChild(node);
            disconnected = true;
        }
        
        // 断开子连接
        const children = [...node.children];
        children.forEach(child => {
            node.removeChild(child);
            disconnected = true;
        });
        
        if (disconnected) {
            this.saveHistoryState('断开连接');
            this.render();
            this.showMessage('已断开所有连接');
        }
    }

    /**
     * 高亮节点路径
     */
    highlightNodePath(node) {
        // 清除之前的高亮
        this.tree.nodes.forEach(n => n.isHighlighted = false);
        
        // 高亮当前节点及其路径
        let current = node;
        while (current) {
            current.isHighlighted = true;
            current = current.parent;
        }
        
        // 高亮子节点
        const highlightChildren = (n) => {
            n.children.forEach(child => {
                child.isHighlighted = true;
                highlightChildren(child);
            });
        };
        highlightChildren(node);
        
        this.render();
        
        // 3秒后清除高亮
        setTimeout(() => {
            this.tree.nodes.forEach(n => n.isHighlighted = false);
            this.render();
        }, 3000);
    }

    /**
     * 检查节点是否可以上移
     */
    canMoveNodeUp(node) {
        if (!node.parent) return false;
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        return index > 0;
    }

    /**
     * 检查节点是否可以下移
     */
    canMoveNodeDown(node) {
        if (!node.parent) return false;
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        return index < siblings.length - 1;
    }

    /**
     * 上移节点
     */
    moveNodeUp(node) {
        if (!this.canMoveNodeUp(node)) return;
        
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        
        [siblings[index], siblings[index - 1]] = [siblings[index - 1], siblings[index]];
        
        this.saveHistoryState('上移节点');
        this.render();
    }

    /**
     * 下移节点
     */
    moveNodeDown(node) {
        if (!this.canMoveNodeDown(node)) return;
        
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        
        [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
        
        this.saveHistoryState('下移节点');
        this.render();
    }

    /**
     * 展开子树
     */
    expandSubtree(node) {
        const expandNode = (n) => {
            n.isCollapsed = false;
            n.children.forEach(child => expandNode(child));
        };
        
        expandNode(node);
        this.render();
    }

    /**
     * 折叠子树
     */
    collapseSubtree(node) {
        node.isCollapsed = true;
        this.render();
    }

    /**
     * 从指定节点开始执行
     */
    runFromNode(node) {
        if (this.simulator.isRunning) {
            this.simulator.stop();
        }
        
        // 设置临时根节点
        this.simulator.setTempRoot(node);
        this.simulator.start();
        
        this.showMessage(`从节点 "${node.name || node.type}" 开始执行`);
    }

    /**
     * 切换断点
     */
    toggleBreakpoint(node) {
        node.hasBreakpoint = !node.hasBreakpoint;
        this.render();
        
        const message = node.hasBreakpoint ? '已设置断点' : '已移除断点';
        this.showMessage(message);
    }

    /**
     * 监视节点
     */
    watchNode(node) {
        node.isWatched = !node.isWatched;
        this.render();
        
        const message = node.isWatched ? '已添加到监视列表' : '已从监视列表移除';
        this.showMessage(message);
    }

    /**
     * 切换节点锁定
     */
    toggleNodeLock(node) {
        node.isLocked = !node.isLocked;
        this.render();
        
        const message = node.isLocked ? '已锁定节点位置' : '已解锁节点位置';
        this.showMessage(message);
    }

    /**
     * 更改节点颜色
     */
    changeNodeColor(node) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const colorNames = ['蓝色', '红色', '绿色', '橙色', '紫色', '青色'];
        
        const currentIndex = colors.indexOf(node.customColor || '#3498db');
        const nextIndex = (currentIndex + 1) % colors.length;
        
        node.customColor = colors[nextIndex];
        this.render();
        
        this.showMessage(`已更改为${colorNames[nextIndex]}`);
    }

    /**
     * 添加节点标签
     */
    async addNodeTag(node) {
        try {
            const tag = await window.prompt('请输入标签:', node.tag || '', '添加标签');
            
            if (tag !== null) {
                node.tag = tag.trim();
                this.render();
                
                const message = tag.trim() ? '已添加标签' : '已移除标签';
                this.showMessage(message);
            }
        } catch (error) {
            // 用户取消了输入
        }
    }

    /**
     * 重置视图
     */
    resetView() {
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        this.updateGridBackground();
        this.render();
    }

    /**
     * 切换网格显示
     */
    toggleGrid() {
        this.options.showGrid = !this.options.showGrid;
        this.updateGridBackground();
        this.render();
        
        const message = this.options.showGrid ? '已显示网格' : '已隐藏网格';
        this.showMessage(message);
    }

    /**
     * 切换网格吸附
     */
    toggleSnapToGrid() {
        this.options.snapToGrid = !this.options.snapToGrid;
        
        const message = this.options.snapToGrid ? '已启用网格吸附' : '已禁用网格吸附';
        this.showMessage(message);
    }

    /**
     * 收集菜单动作
     */
    collectMenuActions(menuItems) {
        const actions = [];
        
        const collectActions = (items) => {
            items.forEach(item => {
                if (item.type !== 'separator') {
                    if (item.action) {
                        actions.push(item.action);
                    }
                    if (item.submenu) {
                        collectActions(item.submenu);
                    }
                }
            });
        };
        
        collectActions(menuItems);
        return actions;
    }

    /**
     * 刷新画布
     */
    refreshCanvas() {
        // 清空画布
        this.clearCanvas();
        
        // 更新界面
        this.updateNodesList();
        this.updatePropertyPanel();
        
        // 重新渲染
        this.render();
        
        this.showToast('画布已刷新');
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 更新节点列表
     */
    updateNodesList() {
        const nodesList = document.getElementById('nodesList');
        if (!nodesList) return;

        const nodes = Array.from(this.tree.nodes.values());
        
        if (nodes.length === 0) {
            nodesList.innerHTML = '<div class="text-center py-4" style="color: var(--md-on-surface-variant);"><i class="fas fa-plus-circle mb-2"></i><p class="text-sm">暂无节点</p></div>';
            return;
        }

        nodesList.innerHTML = nodes.map(node => {
            const isSelected = this.state.selectedNodes.has(node);
            return `
                <div class="node-item md-surface-variant p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors shadow-sm ${isSelected ? 'bg-blue-600 text-white' : ''}" 
                     data-node-id="${node.id}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="${node.getIcon()} text-sm" style="color: ${node.metadata.color};"></i>
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
        }).join('');

        // 绑定点击事件
        nodesList.querySelectorAll('.node-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = item.dataset.nodeId;
                const node = this.tree.nodes.get(nodeId);
                if (node) {
                    this.clearSelection();
                    this.selectNode(node);
                    // selectNode和clearSelection方法已经会调用render()，无需重复调用
                }
            });
        });
    }

    /**
     * 显示Toast消息
     */
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 创建Toast容器
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        if (!this.options.autoSave) return;

        this.autoSave.timer = setInterval(() => {
            if (this.autoSave.isDirty) {
                this.performAutoSave();
            }
        }, this.options.autoSaveInterval);

        // 页面关闭前静默保存，不弹窗
        window.addEventListener('beforeunload', () => {
            if (this.autoSave.isDirty) {
                this.performAutoSave();
            }
        });
    }

    /**
     * 执行自动保存
     */
    performAutoSave() {
        try {
            const data = {
                root: this.tree.root ? this.nodeFactory.nodeToData(this.tree.root) : null,
                metadata: {
                    ...this.tree.metadata,
                    autoSaved: new Date(),
                    nodeCount: this.tree.nodes.size,
                    version: '2.0.0'
                }
            };
            const key = `behaviorTree_autosave_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem('behaviorTree_latest_autosave', key);
            
            this.autoSave.isDirty = false;
            this.autoSave.lastSaveTime = Date.now();
            
            // 清理旧的自动保存
            this.cleanupAutoSaves();
            
            this.showToast('自动保存完成', 'success');
        } catch (error) {
            console.error('自动保存失败:', error);
            this.showToast('自动保存失败', 'error');
        }
    }

    /**
     * 清理旧的自动保存
     */
    cleanupAutoSaves() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('behaviorTree_autosave_'));
        if (keys.length > 10) { // 保留最近10个自动保存
            keys.sort().slice(0, -10).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }

    /**
     * 恢复自动保存
     */
    restoreAutoSave() {
        try {
            const latestKey = localStorage.getItem('behaviorTree_latest_autosave');
            if (!latestKey) {
                this.showToast('没有找到自动保存的数据', 'info');
                return false;
            }

            const data = localStorage.getItem(latestKey);
            if (!data) {
                this.showToast('自动保存数据已损坏', 'error');
                return false;
            }

            const treeData = JSON.parse(data);
            this.loadTreeFromData(treeData);
            this.showToast('已恢复自动保存的数据', 'success');
            return true;
        } catch (error) {
            console.error('恢复自动保存失败:', error);
            this.showToast('恢复自动保存失败', 'error');
            return false;
        }
    }

    /**
     * 标记为已修改
     */
    markAsDirty() {
        this.autoSave.isDirty = true;
        this.tree.metadata.modified = new Date();
    }

    /**
     * 性能监控
     */
    updatePerformanceStats() {
        if (!this.options.performance) return;

        const now = performance.now();
        if (this.performance.lastFrameTime > 0) {
            const deltaTime = now - this.performance.lastFrameTime;
            this.performance.fps = Math.round(1000 / deltaTime);
        }
        this.performance.lastFrameTime = now;
        this.performance.frameCount++;
        this.performance.nodeCount = this.tree.nodes.size;
    }

    /**
     * 获取性能统计
     */
    getPerformanceStats() {
        return {
            ...this.performance,
            memoryUsage: this.getMemoryUsage(),
            treeComplexity: this.getTreeComplexity()
        };
    }

    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    /**
     * 获取树复杂度
     */
    getTreeComplexity() {
        if (!this.tree.root) return { depth: 0, breadth: 0, connections: 0 };

        let maxDepth = 0;
        let maxBreadth = 0;
        let connections = 0;

        const traverse = (node, depth = 0) => {
            maxDepth = Math.max(maxDepth, depth);
            maxBreadth = Math.max(maxBreadth, node.children.length);
            connections += node.children.length;

            node.children.forEach(child => traverse(child, depth + 1));
        };

        traverse(this.tree.root);

        return { depth: maxDepth, breadth: maxBreadth, connections };
    }

    /**
     * 优化大型树结构性能
     */
    optimizePerformance() {
        // 限制渲染区域
        if (this.tree.nodes.size > 1000) {
            this.options.renderOptimization = true;
        }

        // 限制历史记录
        if (this.history.undoStack.length > this.options.maxUndoSteps) {
            this.history.undoStack = this.history.undoStack.slice(-this.options.maxUndoSteps);
        }

        // 清理无用的节点引用
        this.cleanupOrphanedNodes();
    }

    /**
     * 清理孤立节点
     */
    cleanupOrphanedNodes() {
        if (!this.tree.root) return;

        const reachableNodes = new Set();
        const traverse = (node) => {
            reachableNodes.add(node.id);
            node.children.forEach(child => traverse(child));
        };

        traverse(this.tree.root);

        // 删除不可达的节点
        for (const [id, node] of this.tree.nodes) {
            if (!reachableNodes.has(id)) {
                this.tree.nodes.delete(id);
                         }
         }
     }

    /**
     * 搜索节点
     */
    searchNodes(query, filters = {}) {
        if (!query && !filters.nodeType && !filters.nodeStatus) {
            this.searchFilter.results = [];
            this.clearSearchHighlight();
            return [];
        }

        const results = [];
        const lowerQuery = query.toLowerCase();

        const searchNode = (node) => {
            let matches = true;

            // 文本搜索
            if (query) {
                const matchesName = node.name.toLowerCase().includes(lowerQuery);
                const matchesType = node.type.toLowerCase().includes(lowerQuery);
                const matchesDescription = node.description?.toLowerCase().includes(lowerQuery);
                matches = matches && (matchesName || matchesType || matchesDescription);
            }

            // 类型过滤
            if (filters.nodeType && filters.nodeType !== 'all') {
                matches = matches && node.type === filters.nodeType;
            }

            // 状态过滤
            if (filters.nodeStatus && filters.nodeStatus !== 'all') {
                matches = matches && node.status === filters.nodeStatus;
            }

            if (matches) {
                results.push(node);
            }

            // 递归搜索子节点
            node.children.forEach(child => searchNode(child));
        };

        if (this.tree.root) {
            searchNode(this.tree.root);
        }

        this.searchFilter.query = query;
        this.searchFilter.nodeType = filters.nodeType || '';
        this.searchFilter.nodeStatus = filters.nodeStatus || '';
        this.searchFilter.results = results;

        this.highlightSearchResults(results);
        return results;
    }

    /**
     * 高亮搜索结果
     */
    highlightSearchResults(results) {
        // 清除之前的高亮
        this.clearSearchHighlight();

        // 添加搜索高亮
        results.forEach(node => {
            node.isSearchHighlighted = true;
        });

        this.render();
    }

    /**
     * 清除搜索高亮
     */
    clearSearchHighlight() {
        const clearHighlight = (node) => {
            node.isSearchHighlighted = false;
            node.children.forEach(child => clearHighlight(child));
        };

        if (this.tree.root) {
            clearHighlight(this.tree.root);
        }
    }

    /**
     * 跳转到搜索结果
     */
    navigateToSearchResult(index) {
        if (index < 0 || index >= this.searchFilter.results.length) return;

        const node = this.searchFilter.results[index];
        this.focusOnNode(node);
        this.selectNode(node);
    }

    /**
     * 聚焦到节点
     */
    focusOnNode(node) {
        // 计算节点在屏幕中心的位置
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = canvasRect.width / 2;
        const centerY = canvasRect.height / 2;

        // 计算需要的平移量
        const targetX = centerX - node.x * this.viewport.zoom;
        const targetY = centerY - node.y * this.viewport.zoom;

        // 平滑动画到目标位置
        this.animateViewportTo(targetX, targetY, this.viewport.zoom);
    }

    /**
     * 动画移动视口
     */
    animateViewportTo(targetX, targetY, targetZoom, duration = 500) {
        const startX = this.viewport.x;
        const startY = this.viewport.y;
        const startZoom = this.viewport.zoom;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = this.easeInOutCubic(progress);

            this.viewport.x = startX + (targetX - startX) * easeProgress;
            this.viewport.y = startY + (targetY - startY) * easeProgress;
            this.viewport.zoom = startZoom + (targetZoom - startZoom) * easeProgress;

            this.render();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 缓动函数
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    /**
     * 节点过滤器
     */
    filterNodes(predicate) {
        const filtered = [];
        
        const filterNode = (node) => {
            if (predicate(node)) {
                filtered.push(node);
            }
            node.children.forEach(child => filterNode(child));
        };

        if (this.tree.root) {
            filterNode(this.tree.root);
        }

        return filtered;
    }

    /**
     * 获取节点统计信息
     */
    getNodeStatistics() {
        const stats = {
            total: 0,
            byType: {},
            byStatus: {},
            depth: 0,
            breadth: 0
        };

        const analyzeNode = (node, depth = 0) => {
            stats.total++;
            stats.depth = Math.max(stats.depth, depth);
            stats.breadth = Math.max(stats.breadth, node.children.length);

            // 按类型统计
            stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;

            // 按状态统计
            stats.byStatus[node.status] = (stats.byStatus[node.status] || 0) + 1;

            node.children.forEach(child => analyzeNode(child, depth + 1));
        };

        if (this.tree.root) {
            analyzeNode(this.tree.root);
        }

        return stats;
    }

    /**
     * 节点路径查找
     */
    findNodePath(targetNode) {
        const path = [];

        const findPath = (node, currentPath = []) => {
            const newPath = [...currentPath, node];

            if (node === targetNode) {
                path.push(...newPath);
                return true;
            }

            for (const child of node.children) {
                if (findPath(child, newPath)) {
                    return true;
                }
            }

            return false;
        };

        if (this.tree.root) {
            findPath(this.tree.root);
        }

        return path;
    }

    /**
     * 高级搜索
     */
    advancedSearch(criteria) {
        const results = [];

        const searchNode = (node) => {
            let matches = true;

            // 名称匹配
            if (criteria.name) {
                const regex = new RegExp(criteria.name, criteria.caseSensitive ? 'g' : 'gi');
                matches = matches && regex.test(node.name);
            }

            // 类型匹配
            if (criteria.types && criteria.types.length > 0) {
                matches = matches && criteria.types.includes(node.type);
            }

            // 状态匹配
            if (criteria.statuses && criteria.statuses.length > 0) {
                matches = matches && criteria.statuses.includes(node.status);
            }

            // 属性匹配
            if (criteria.properties) {
                for (const [key, value] of Object.entries(criteria.properties)) {
                    if (node.properties[key] !== value) {
                        matches = false;
                        break;
                    }
                }
            }

            // 深度范围
            if (criteria.minDepth !== undefined || criteria.maxDepth !== undefined) {
                const path = this.findNodePath(node);
                const depth = path.length - 1;
                
                if (criteria.minDepth !== undefined && depth < criteria.minDepth) {
                    matches = false;
                }
                if (criteria.maxDepth !== undefined && depth > criteria.maxDepth) {
                    matches = false;
                }
            }

            if (matches) {
                results.push({
                    node,
                    path: this.findNodePath(node),
                    depth: this.findNodePath(node).length - 1
                });
            }

            node.children.forEach(child => searchNode(child));
        };

        if (this.tree.root) {
            searchNode(this.tree.root);
        }

        return results;
    }
 }

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviorTreeEditor;
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeEditor = BehaviorTreeEditor;
} 