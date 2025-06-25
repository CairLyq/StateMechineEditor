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
            gridSize: 20,
            snapToGrid: true,
            showGrid: true,
            autoLayout: true,
            debug: false,
            ...options
        };
        
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
        
        // 历史记录
        this.history = {
            undoStack: [],
            redoStack: [],
            maxSize: 50
        };
        
        // 初始化组件
        this.renderer = new BehaviorTreeRenderer(this.canvas, this.ctx);
        this.simulator = new BehaviorTreeSimulator();
        
        this.setupEventListeners();
        this.setupUI();
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
        document.getElementById('addNodeBtn')?.addEventListener('click', () => this.showNodePalette());
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
        const rect = this.canvas.getBoundingClientRect();
        this.state.dragData = {
            type: 'node',
            nodes: this.state.selectedNodes.has(node) ? 
                   Array.from(this.state.selectedNodes) : [node],
            startX: event.clientX - rect.left,
            startY: event.clientY - rect.top,
            nodeOffsets: new Map()
        };
        
        // 记录每个节点的偏移量
        this.state.dragData.nodes.forEach(dragNode => {
            this.state.dragData.nodeOffsets.set(dragNode, {
                x: dragNode.x - node.x,
                y: dragNode.y - node.y
            });
        });
        
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * 处理拖拽
     */
    handleDrag(event) {
        const rect = this.canvas.getBoundingClientRect();
        const deltaX = (event.clientX - rect.left - this.state.dragData.startX) / this.viewport.zoom;
        const deltaY = (event.clientY - rect.top - this.state.dragData.startY) / this.viewport.zoom;
        
        if (this.state.dragData.type === 'node') {
            this.dragNodes(deltaX, deltaY);
        } else if (this.state.dragData.type === 'canvas') {
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
            this.showNodeContextMenu(clickedNode, event.clientX, event.clientY);
        } else {
            this.showCanvasContextMenu(x, y, event.clientX, event.clientY);
        }
    }

    /**
     * 显示节点上下文菜单
     */
    showNodeContextMenu(node, x, y) {
        // TODO: 实现节点右键菜单
        console.log('Node context menu for:', node.name);
    }

    /**
     * 显示画布上下文菜单
     */
    showCanvasContextMenu(canvasX, canvasY, screenX, screenY) {
        // TODO: 实现画布右键菜单
        console.log('Canvas context menu at:', canvasX, canvasY);
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
                case 'v':
                    event.preventDefault();
                    this.pasteClipboard();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAll();
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
    addNodeAtPosition(x, y) {
        // TODO: 显示节点选择对话框
        const nodeType = 'action'; // 默认类型
        this.addNode(nodeType, x, y);
        this.state.mode = 'select';
    }

    /**
     * 复制选中节点
     */
    copySelected() {
        if (this.state.selectedNodes.size === 0) return;
        
        const selectedArray = Array.from(this.state.selectedNodes);
        this.state.clipboard = {
            nodes: selectedArray.map(node => node.toJSON()),
            timestamp: Date.now()
        };
    }

    /**
     * 粘贴剪贴板内容
     */
    pasteClipboard() {
        if (!this.state.clipboard) return;
        
        const offset = 50; // 粘贴偏移量
        this.clearSelection();
        
        this.state.clipboard.nodes.forEach(nodeData => {
            const node = BehaviorTreeNode.fromJSON(nodeData);
            node.id = node.generateId(); // 生成新ID
            node.setPosition(node.x + offset, node.y + offset);
            
            this.tree.nodes.set(node.id, node);
            this.selectNode(node);
        });
        
        this.saveHistoryState('粘贴节点 Paste Nodes');
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
        const noSelection = document.getElementById('noSelection');
        const nodeProperties = document.getElementById('nodeProperties');
        
        if (this.state.selectedNodes.size === 1) {
            const node = Array.from(this.state.selectedNodes)[0];
            noSelection?.classList.add('hidden');
            nodeProperties?.classList.remove('hidden');
            
            // 更新属性字段
            const nameInput = document.getElementById('nodeName');
            const typeSelect = document.getElementById('nodeType');
            const descriptionTextarea = document.getElementById('nodeDescription');
            
            if (nameInput) nameInput.value = node.name;
            if (typeSelect) typeSelect.value = node.type;
            if (descriptionTextarea) descriptionTextarea.value = node.metadata.description;
        } else {
            noSelection?.classList.remove('hidden');
            nodeProperties?.classList.add('hidden');
        }
    }

    /**
     * 更新状态栏
     */
    updateStatusBar(x, y) {
        // TODO: 更新状态栏信息
    }

    /**
     * 导入行为树
     */
    importTree() {
        const fileInput = document.getElementById('fileInput');
        fileInput?.click();
    }

    /**
     * 从数据恢复行为树
     */
    loadTreeFromData(data) {
        this.tree = data;
        
        // 重建节点映射
        this.tree.nodes = new Map();
        if (this.tree.root) {
            this.tree.root = BehaviorTreeNode.fromJSON(this.tree.root);
            this.rebuildNodeMap(this.tree.root);
        }
        
        this.clearSelection();
        this.fitToScreen();
        this.render();
    }

    /**
     * 拖拽节点
     */
    dragNodes(deltaX, deltaY) {
        const baseNode = this.state.dragData.nodes[0];
        const newX = this.snapToGrid(baseNode.x + deltaX);
        const newY = this.snapToGrid(baseNode.y + deltaY);
        
        this.state.dragData.nodes.forEach(node => {
            const offset = this.state.dragData.nodeOffsets.get(node);
            node.setPosition(newX + offset.x, newY + offset.y);
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
        const node = new BehaviorTreeNode(type);
        node.setPosition(x, y);
        
        this.tree.nodes.set(node.id, node);
        
        if (!this.tree.root && type === NodeType.ROOT) {
            this.tree.root = node;
        }
        
        this.saveHistoryState('添加节点 Add Node');
        this.render();
        
        return node;
    }

    /**
     * 删除选中节点
     */
    deleteSelected() {
        if (this.state.selectedNodes.size === 0) return;
        
        const nodesToDelete = Array.from(this.state.selectedNodes);
        
        nodesToDelete.forEach(node => {
            // 移除父子关系
            if (node.parent) {
                node.parent.removeChild(node);
            }
            
            // 移除所有子节点
            const children = [...node.children];
            children.forEach(child => {
                node.removeChild(child);
            });
            
            // 从树中移除
            this.tree.nodes.delete(node.id);
            
            // 如果是根节点，清空根节点
            if (this.tree.root === node) {
                this.tree.root = null;
            }
        });
        
        this.clearSelection();
        this.saveHistoryState('删除节点 Delete Node');
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
        }
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
        const state = {
            tree: JSON.parse(JSON.stringify(this.tree)),
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
        this.tree = state.tree;
        
        // 重建节点对象
        this.tree.nodes = new Map();
        if (this.tree.root) {
            this.tree.root = BehaviorTreeNode.fromJSON(this.tree.root);
            this.rebuildNodeMap(this.tree.root);
        }
        
        this.clearSelection();
        this.render();
    }

    /**
     * 重建节点映射
     */
    rebuildNodeMap(node) {
        this.tree.nodes.set(node.id, node);
        node.children.forEach(child => this.rebuildNodeMap(child));
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
        this.renderer.render(this.tree, this.viewport);
        this.updateGridBackground();
        this.renderer.updateFPS();
    }

    /**
     * 更新网格背景
     */
    updateGridBackground() {
        const canvas = document.getElementById('canvas');
        const gridSize = 12 * this.viewport.zoom; // 细网格大小
        const majorGridSize = 120 * this.viewport.zoom; // 粗网格大小 (每10个细网格)
        
        // 计算网格偏移量
        const offsetX = (this.viewport.x * this.viewport.zoom) % gridSize;
        const offsetY = (this.viewport.y * this.viewport.zoom) % gridSize;
        const majorOffsetX = (this.viewport.x * this.viewport.zoom) % majorGridSize;
        const majorOffsetY = (this.viewport.y * this.viewport.zoom) % majorGridSize;

        canvas.style.backgroundSize = `${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`;
        canvas.style.backgroundPosition = `${majorOffsetX}px ${majorOffsetY}px, ${majorOffsetX}px ${majorOffsetY}px, ${offsetX}px ${offsetY}px, ${offsetX}px ${offsetY}px`;
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
        console.log(message);
        // TODO: 实现消息提示UI
    }

    /**
     * 导出行为树
     */
    exportTree() {
        const data = {
            ...this.tree,
            metadata: {
                ...this.tree.metadata,
                exported: new Date()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tree.metadata.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviorTreeEditor;
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeEditor = BehaviorTreeEditor;
} 