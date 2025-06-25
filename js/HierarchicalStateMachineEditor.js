/**
 * 分层状态机编辑器
 * 主要的分层状态机编辑器类，整合所有分层功能
 */
class HierarchicalStateMachineEditor {
    constructor(canvasId = 'canvas', svgCanvasId = 'svgCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.svgCanvas = document.getElementById(svgCanvasId);
        
        // 核心组件
        this.rootNodes = new Map(); // 根节点集合
        this.allNodes = new Map(); // 所有节点的扁平映射
        this.transitionManager = new HierarchicalTransitionManager();
        this.renderer = new HierarchicalRenderer(this.canvas, this.svgCanvas);
        
        // 状态管理
        this.selectedNode = null;
        this.selectedTransition = null;
        this.currentActiveNode = null; // 当前激活的节点
        
        // 编辑状态
        this.dragState = {
            isDragging: false,
            dragNode: null,
            startPos: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            pendingTransitionUpdate: false, // 标记是否有待更新的转换
            transitionUpdateTimer: null // 转换更新定时器
        };
        
        this.connectionState = {
            isConnecting: false,
            fromNode: null,
            previewLine: null
        };
        
        // 配置
        this.config = {
            defaultNodeWidth: 120,
            defaultNodeHeight: 80,
            gridSize: 20,
            snapToGrid: true,
            autoLayout: false,
            dragUpdateDelay: 16 // 拖拽更新延迟（毫秒），约60FPS
        };
        
        // 性能监控
        this.performanceMonitor = {
            enabled: false,
            dragStartTime: 0,
            frameCount: 0,
            lastFrameTime: 0,
            averageFPS: 0
        };
        
        // 调试模式
        this.debugMode = false;
        
        // ID生成器
        this.nodeIdCounter = 0;
        this.transitionIdCounter = 0;
        
        this.init();
    }

    /**
     * 初始化编辑器
     */
    init() {
        this.setupEventListeners();
        this.createSampleHierarchy(); // 创建示例层次结构
        this.render();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 画布事件
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
        this.canvas.addEventListener('dblclick', this.onCanvasDoubleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
        
        // 鼠标移动和抬起事件绑定到文档级别（用于拖拽）
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // 节点展开/折叠事件
        this.canvas.addEventListener('nodeExpansionChanged', this.onNodeExpansionChanged.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * 添加根节点
     */
    addRootNode(name, x = 100, y = 100) {
        const nodeId = `hnode_${this.nodeIdCounter++}`;
        const node = new HierarchicalStateNode(nodeId, name, x, y, 0);
        
        this.rootNodes.set(nodeId, node);
        this.allNodes.set(nodeId, node);
        
        this.render();
        return node;
    }

    /**
     * 添加子节点
     */
    addChildNode(parentId, name, x = null, y = null) {
        const parent = this.allNodes.get(parentId);
        if (!parent) {
            throw new Error(`Parent node with id '${parentId}' not found`);
        }
        
        const nodeId = `hnode_${this.nodeIdCounter++}`;
        const childX = x !== null ? x : parent.x + 150;
        const childY = y !== null ? y : parent.y + 100;
        
        const childNode = new HierarchicalStateNode(nodeId, name, childX, childY, parent.level + 1);
        
        parent.addChild(childNode);
        this.allNodes.set(nodeId, childNode);
        
        this.render();
        return childNode;
    }

    /**
     * 移除节点
     */
    removeNode(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return false;
        
        // 移除所有相关的转换
        this.removeNodeTransitions(nodeId);
        
        // 从父节点中移除
        if (node.parent) {
            node.parent.removeChild(nodeId);
        } else {
            // 如果是根节点，从根节点集合中移除
            this.rootNodes.delete(nodeId);
        }
        
        // 递归移除所有子节点
        for (const child of node.getAllChildren()) {
            this.allNodes.delete(child.id);
            this.removeNodeTransitions(child.id);
        }
        
        this.allNodes.delete(nodeId);
        this.renderer.removeStateNode(nodeId);
        
        // 如果是选中的节点，清除选择
        if (this.selectedNode === node) {
            this.selectedNode = null;
        }
        
        this.render();
        return true;
    }

    /**
     * 移除节点的所有转换
     */
    removeNodeTransitions(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;
        
        const nodePath = node.getStatePath();
        const transitionsToRemove = [];
        
        // 查找所有涉及此节点的转换
        for (const transition of this.transitionManager.getAllTransitions()) {
            if (transition.fromPath === nodePath || transition.toPath === nodePath) {
                transitionsToRemove.push(transition.id);
            }
        }
        
        // 移除转换
        for (const transitionId of transitionsToRemove) {
            this.transitionManager.removeTransition(transitionId);
            this.renderer.removeTransition(transitionId);
        }
    }

    /**
     * 添加转换
     */
    addTransition(fromNodeId, toNodeId, event = 'event', condition = '') {
        const fromNode = this.allNodes.get(fromNodeId);
        const toNode = this.allNodes.get(toNodeId);
        
        if (!fromNode || !toNode) {
            throw new Error('Source or target node not found');
        }
        
        const transitionId = `htrans_${this.transitionIdCounter++}`;
        const transition = new HierarchicalTransition(
            transitionId,
            fromNode.getStatePath(),
            toNode.getStatePath(),
            event,
            condition
        );
        
        this.transitionManager.addTransition(transition);
        this.render();
        
        return transition;
    }

    /**
     * 移除转换
     */
    removeTransition(transitionId) {
        const success = this.transitionManager.removeTransition(transitionId);
        if (success) {
            this.renderer.removeTransition(transitionId);
            this.render();
        }
        return success;
    }

    /**
     * 选择节点
     */
    selectNode(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;
        
        // 清除之前的选择
        this.clearSelection();
        
        this.selectedNode = node;
        
        // 高亮选中的节点
        this.highlightNode(nodeId, '#ffc107');
        
        // 更新属性面板
        this.updatePropertiesPanel();
    }

    /**
     * 清除选择
     */
    clearSelection() {
        this.selectedNode = null;
        this.selectedTransition = null;
        this.clearHighlights();
    }

    /**
     * 高亮节点
     */
    highlightNode(nodeId, color = '#ffc107') {
        const element = this.renderer.getNodeElement(nodeId);
        if (element) {
            element.style.boxShadow = `0 0 0 3px ${color}`;
        }
    }

    /**
     * 清除所有高亮
     */
    clearHighlights() {
        for (const [nodeId, element] of this.renderer.nodeElements) {
            element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
    }

    /**
     * 渲染整个分层状态机
     */
    render() {
        // 渲染所有根节点及其子节点
        for (const rootNode of this.rootNodes.values()) {
            this.renderer.renderStateNode(rootNode);
        }
        
        // 渲染所有转换
        for (const transition of this.transitionManager.getAllTransitions()) {
            const fromNode = this.findNodeByPath(transition.fromPath);
            const toNode = this.findNodeByPath(transition.toPath);
            
            if (fromNode && toNode) {
                this.renderer.renderTransition(transition, fromNode, toNode);
            }
        }
    }

    /**
     * 根据路径查找节点
     */
    findNodeByPath(path) {
        for (const rootNode of this.rootNodes.values()) {
            const found = rootNode.findNodeByPath(path);
            if (found) return found;
        }
        return null;
    }

    /**
     * 画布点击事件
     */
    onCanvasClick(e) {
        // 检查是否点击在节点上
        const nodeElement = e.target.closest('.hierarchical-state-node');
        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            this.selectNode(nodeId);
            return;
        }
        
        // 点击空白区域，清除选择
        this.clearSelection();
    }

    /**
     * 画布双击事件 - 创建新节点
     */
    onCanvasDoubleClick(e) {
        if (e.target === this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 如果有选中的节点，在其下创建子节点
            if (this.selectedNode) {
                this.addChildNode(this.selectedNode.id, '新子状态', x, y);
            } else {
                // 否则创建根节点
                this.addRootNode('新状态', x, y);
            }
        }
    }

    /**
     * 鼠标按下事件
     */
    onMouseDown(e) {
        const nodeElement = e.target.closest('.hierarchical-state-node');
        if (nodeElement && e.button === 0) { // 左键
            const nodeId = nodeElement.getAttribute('data-node-id');
            const node = this.allNodes.get(nodeId);
            
            if (node) {
                this.dragState.isDragging = true;
                this.dragState.dragNode = node;
                
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                this.dragState.startPos = {
                    x: mouseX,
                    y: mouseY
                };
                
                // 计算鼠标相对于节点左上角的偏移量
                this.dragState.offset = {
                    x: mouseX - node.x,
                    y: mouseY - node.y
                };
                
                // 调试信息
                if (this.debugMode) {
                    console.log('拖拽开始:', {
                        鼠标位置: { x: mouseX, y: mouseY },
                        节点位置: { x: node.x, y: node.y },
                        偏移量: this.dragState.offset,
                        画布边界: rect
                    });
                }
                
                // 设置拖拽状态和禁用动画过渡
                nodeElement.style.cursor = 'grabbing';
                nodeElement.style.transition = 'none';
                
                // 启动性能监控
                if (this.performanceMonitor.enabled) {
                    this.startPerformanceMonitoring();
                }
                
                e.preventDefault();
            }
        }
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(e) {
        if (this.dragState.isDragging && this.dragState.dragNode) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 计算新位置：鼠标位置减去偏移量
            let newX = mouseX - this.dragState.offset.x;
            let newY = mouseY - this.dragState.offset.y;
            
            // 网格对齐
            if (this.config.snapToGrid) {
                newX = Math.round(newX / this.config.gridSize) * this.config.gridSize;
                newY = Math.round(newY / this.config.gridSize) * this.config.gridSize;
            }
            
            // 调试信息（减少频率）
            if (this.debugMode && Math.random() < 0.1) { // 10% 的概率显示调试信息
                console.log('拖拽中:', {
                    鼠标位置: { x: mouseX, y: mouseY },
                    计算位置: { x: newX, y: newY },
                    偏移量: this.dragState.offset
                });
            }
            
            // 更新节点数据
            this.dragState.dragNode.x = newX;
            this.dragState.dragNode.y = newY;
            
            // 直接更新DOM元素位置
            const element = this.renderer.getNodeElement(this.dragState.dragNode.id);
            if (element) {
                // 拖拽期间直接使用 left/top，避免 transform 坐标系问题
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }
            
            // 延迟更新转换以避免频繁重绘
            this.scheduleTransitionUpdate(this.dragState.dragNode.id);
        }
    }

    /**
     * 调度转换更新（防抖）
     */
    scheduleTransitionUpdate(nodeId) {
        // 标记有待更新的转换
        this.dragState.pendingTransitionUpdate = true;
        
        // 清除之前的定时器
        if (this.dragState.transitionUpdateTimer) {
            cancelAnimationFrame(this.dragState.transitionUpdateTimer);
        }
        
        // 使用requestAnimationFrame进行批量更新
        this.dragState.transitionUpdateTimer = requestAnimationFrame(() => {
            if (this.dragState.pendingTransitionUpdate) {
                this.updateNodeTransitions(nodeId);
                this.dragState.pendingTransitionUpdate = false;
                this.dragState.transitionUpdateTimer = null;
                
                // 记录性能帧
                this.recordPerformanceFrame();
            }
        });
    }

    /**
     * 鼠标抬起事件
     */
    onMouseUp(e) {
        if (this.dragState.isDragging) {
            this.dragState.isDragging = false;
            
            if (this.dragState.dragNode) {
                const nodeElement = this.renderer.getNodeElement(this.dragState.dragNode.id);
                if (nodeElement) {
                    // 恢复鼠标样式和动画过渡
                    nodeElement.style.cursor = 'move';
                    nodeElement.style.transition = '';
                    
                    // 确保使用正确的定位方式
                    nodeElement.style.left = `${this.dragState.dragNode.x}px`;
                    nodeElement.style.top = `${this.dragState.dragNode.y}px`;
                }
                
                // 清除待处理的转换更新定时器
                if (this.dragState.transitionUpdateTimer) {
                    cancelAnimationFrame(this.dragState.transitionUpdateTimer);
                    this.dragState.transitionUpdateTimer = null;
                }
                
                // 最终更新转换线条
                this.updateNodeTransitions(this.dragState.dragNode.id);
                this.dragState.pendingTransitionUpdate = false;
                
                // 停止性能监控
                if (this.performanceMonitor.enabled) {
                    this.stopPerformanceMonitoring();
                }
            }
            
            this.dragState.dragNode = null;
        }
    }

    /**
     * 更新节点的转换
     */
    updateNodeTransitions(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;
        
        const nodePath = node.getStatePath();
        
        for (const transition of this.transitionManager.getAllTransitions()) {
            if (transition.fromPath === nodePath || transition.toPath === nodePath) {
                const fromNode = this.findNodeByPath(transition.fromPath);
                const toNode = this.findNodeByPath(transition.toPath);
                
                if (fromNode && toNode) {
                    this.renderer.renderTransition(transition, fromNode, toNode);
                }
            }
        }
    }

    /**
     * 右键菜单事件
     */
    onContextMenu(e) {
        e.preventDefault();
        
        const nodeElement = e.target.closest('.hierarchical-state-node');
        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            this.showNodeContextMenu(e, nodeId);
        } else {
            this.showCanvasContextMenu(e);
        }
    }

    /**
     * 显示节点右键菜单
     */
    showNodeContextMenu(e, nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;
        
        console.log(`显示节点右键菜单 - 状态: ${node.name}, 位置: (${e.clientX}, ${e.clientY})`);

        // 移除已存在的右键菜单
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.id = 'hierarchicalContextMenu';
        menu.className = 'fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50';
        menu.style.minWidth = '150px';

        // 计算菜单位置，防止超出屏幕
        const menuWidth = 150;
        const menuHeight = 150;
        let left = e.clientX;
        let top = e.clientY;

        if (left + menuWidth > window.innerWidth) {
            left = e.clientX - menuWidth;
        }

        if (top + menuHeight > window.innerHeight) {
            top = e.clientY - menuHeight;
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        menu.innerHTML = `
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
                <i class="fas fa-arrow-right mr-2"></i>开始连线
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 transition-colors">
                <i class="fas fa-plus mr-2"></i>添加子状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
                <i class="fas fa-edit mr-2"></i>编辑状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-green-600 transition-colors">
                <i class="fas fa-play mr-2"></i>设为初始状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-orange-600 transition-colors">
                <i class="fas fa-stop mr-2"></i>切换终止状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600 transition-colors">
                <i class="fas fa-trash mr-2"></i>删除状态
            </div>
        `;

        // 添加菜单项事件
        const menuItems = menu.querySelectorAll('.context-menu-item');
        menuItems[0].addEventListener('click', (e) => {
            console.log('菜单项点击: 开始连线模式');
            e.stopPropagation();
            this.startConnectionMode(node);
            this.hideContextMenu();
        });
        menuItems[1].addEventListener('click', (e) => {
            console.log('菜单项点击: 添加子状态');
            e.stopPropagation();
            this.addChildNode(nodeId, '新子状态');
            this.hideContextMenu();
        });
        menuItems[2].addEventListener('click', (e) => {
            console.log('菜单项点击: 编辑状态');
            e.stopPropagation();
            this.editNode(nodeId);
            this.hideContextMenu();
        });
        menuItems[3].addEventListener('click', (e) => {
            console.log('菜单项点击: 设为初始状态');
            e.stopPropagation();
            this.setInitialState(nodeId);
            this.hideContextMenu();
        });
        menuItems[4].addEventListener('click', (e) => {
            console.log('菜单项点击: 切换终止状态');
            e.stopPropagation();
            this.toggleFinalState(nodeId);
            this.hideContextMenu();
        });
        menuItems[5].addEventListener('click', (e) => {
            console.log('菜单项点击: 删除状态');
            e.stopPropagation();
            if (confirm(`确定要删除状态 "${node.name}" 吗？`)) {
                this.removeNode(nodeId);
            }
            this.hideContextMenu();
        });

        document.body.appendChild(menu);

        // 点击其他地方隐藏菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 10);
    }

    /**
     * 显示画布右键菜单
     */
    showCanvasContextMenu(e) {
        console.log(`显示画布右键菜单 - 位置: (${e.clientX}, ${e.clientY})`);

        // 移除已存在的右键菜单
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.id = 'hierarchicalContextMenu';
        menu.className = 'fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50';
        menu.style.minWidth = '150px';

        // 计算菜单位置，防止超出屏幕
        const menuWidth = 150;
        const menuHeight = 100;
        let left = e.clientX;
        let top = e.clientY;

        if (left + menuWidth > window.innerWidth) {
            left = e.clientX - menuWidth;
        }

        if (top + menuHeight > window.innerHeight) {
            top = e.clientY - menuHeight;
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        menu.innerHTML = `
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 transition-colors">
                <i class="fas fa-plus mr-2"></i>添加根状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
                <i class="fas fa-project-diagram mr-2"></i>自动布局
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600 transition-colors">
                <i class="fas fa-trash mr-2"></i>清空画布
            </div>
        `;

        // 添加菜单项事件
        const menuItems = menu.querySelectorAll('.context-menu-item');
        menuItems[0].addEventListener('click', (evt) => {
            console.log('菜单项点击: 添加根状态');
            evt.stopPropagation();
            this.addRootNodeAt(e);
            this.hideContextMenu();
        });
        menuItems[1].addEventListener('click', (evt) => {
            console.log('菜单项点击: 自动布局');
            evt.stopPropagation();
            this.autoLayout();
            this.hideContextMenu();
        });
        menuItems[2].addEventListener('click', (evt) => {
            console.log('菜单项点击: 清空画布');
            evt.stopPropagation();
            if (confirm('确定要清空画布吗？这将删除所有状态和转换。')) {
                this.clear();
            }
            this.hideContextMenu();
        });

        document.body.appendChild(menu);

        // 点击其他地方隐藏菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 10);
    }

    /**
     * 节点展开/折叠状态变化事件
     */
    onNodeExpansionChanged(e) {
        const { node, isExpanded } = e.detail;
        // 可以在这里添加额外的逻辑，比如自动布局
        console.log(`节点 ${node.name} ${isExpanded ? '展开' : '折叠'}`);
    }

    /**
     * 键盘事件
     */
    onKeyDown(e) {
        if (e.key === 'Delete' && this.selectedNode) {
            this.removeNode(this.selectedNode.id);
        }
    }

    /**
     * 创建示例层次结构
     */
    createSampleHierarchy() {
        // 创建根状态
        const rootState = this.addRootNode('游戏状态', 100, 100);
        rootState.isInitial = true;
        
        // 创建主菜单子状态
        const menuState = this.addChildNode(rootState.id, '主菜单', 50, 200);
        const gameState = this.addChildNode(rootState.id, '游戏中', 250, 200);
        const pauseState = this.addChildNode(rootState.id, '暂停', 450, 200);
        
        // 在游戏中状态下创建子状态
        const playingState = this.addChildNode(gameState.id, '正在游戏', 200, 320);
        const gameOverState = this.addChildNode(gameState.id, '游戏结束', 350, 320);
        
        // 添加转换
        this.addTransition(menuState.id, gameState.id, '开始游戏');
        this.addTransition(gameState.id, pauseState.id, '暂停');
        this.addTransition(pauseState.id, gameState.id, '继续');
        this.addTransition(playingState.id, gameOverState.id, '死亡');
        this.addTransition(gameOverState.id, menuState.id, '返回菜单');
    }

    /**
     * 清空画布
     */
    clear() {
        this.rootNodes.clear();
        this.allNodes.clear();
        this.transitionManager.clear();
        this.renderer.clear();
        this.clearSelection();
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            rootNodes: Array.from(this.rootNodes.values()).map(node => node.toJSON()),
            transitions: this.transitionManager.toJSON(),
            metadata: {
                created: new Date().toISOString(),
                version: '2.0.0',
                type: 'hierarchical-state-machine'
            }
        };
    }

    /**
     * 从JSON加载
     */
    loadFromJSON(data) {
        this.clear();
        
        // 加载节点
        if (data.rootNodes) {
            for (const rootData of data.rootNodes) {
                const rootNode = HierarchicalStateNode.fromJSON(rootData);
                this.rootNodes.set(rootNode.id, rootNode);
                
                // 将所有节点添加到扁平映射中
                this.addNodeToFlatMap(rootNode);
            }
        }
        
        // 加载转换
        if (data.transitions) {
            this.transitionManager = HierarchicalTransitionManager.fromJSON(data.transitions);
        }
        
        this.render();
    }

    /**
     * 递归添加节点到扁平映射
     */
    addNodeToFlatMap(node) {
        this.allNodes.set(node.id, node);
        
        for (const child of node.getAllChildren()) {
            this.addNodeToFlatMap(child);
        }
    }

    // ==================== 右键菜单功能 ====================

    /**
     * 隐藏右键菜单
     */
    hideContextMenu() {
        const menu = document.getElementById('hierarchicalContextMenu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * 在指定位置添加根节点
     */
    addRootNodeAt(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = this.addRootNode('新状态', x - 60, y - 40);
        console.log(`在位置 (${x}, ${y}) 添加根状态: ${node.name}`);
    }

    /**
     * 自动布局
     */
    autoLayout() {
        console.log('执行自动布局');
        // 简单的自动布局实现
        let x = 100;
        let y = 100;
        const spacing = 200;
        
        for (const [nodeId, node] of this.rootNodes) {
            node.x = x;
            node.y = y;
            x += spacing;
            
            if (x > 800) {
                x = 100;
                y += spacing;
            }
            
            // 布局子节点
            this.layoutChildren(node, node.x, node.y + 100);
        }
        
        this.render();
    }

    /**
     * 布局子节点
     */
    layoutChildren(parentNode, startX, startY) {
        let x = startX;
        const y = startY;
        const childSpacing = 150;
        
        for (const child of parentNode.children.values()) {
            child.x = x;
            child.y = y;
            x += childSpacing;
            
            // 递归布局子节点的子节点
            if (child.children.size > 0) {
                this.layoutChildren(child, child.x, child.y + 80);
            }
        }
    }

    /**
     * 编辑节点
     */
    editNode(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;

        const newName = prompt('输入新的状态名称:', node.name);
        if (newName && newName.trim() !== node.name) {
            node.name = newName.trim();
            this.render();
            console.log(`节点名称已更新: ${nodeId} -> ${node.name}`);
        }
    }

    /**
     * 设置初始状态
     */
    setInitialState(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;

        // 清除同级别的其他初始状态标记
        if (node.parent) {
            for (const sibling of node.parent.children.values()) {
                sibling.isInitial = false;
            }
        } else {
            // 如果是根节点，清除所有根节点的初始状态标记
            for (const rootNode of this.rootNodes.values()) {
                rootNode.isInitial = false;
            }
        }

        node.isInitial = true;
        this.render();
        console.log(`设置初始状态: ${node.name}`);
    }

    /**
     * 切换终止状态
     */
    toggleFinalState(nodeId) {
        const node = this.allNodes.get(nodeId);
        if (!node) return;

        node.isFinal = !node.isFinal;
        this.render();
        console.log(`切换终止状态: ${node.name} -> ${node.isFinal ? '是' : '否'}`);
    }

    // ==================== 连线模式功能 ====================

    /**
     * 开始连线模式（从StateMachineEditor.js重用）
     */
    startConnectionMode(fromNode) {
        console.log(`启动连线模式 - 起始状态: ${fromNode.name}`);

        this.connectionState = {
            isConnecting: true,
            fromNode: fromNode,
            previewLine: null
        };

        // 创建预览连线
        this.createPreviewLine();

        // 改变鼠标样式
        document.body.style.cursor = 'crosshair';

        // 高亮可连接的状态节点
        this.highlightConnectableNodes(fromNode);

        // 显示连线提示
        this.showConnectionHint();

        // 绑定事件处理函数
        this.boundConnectionMouseMove = this.onConnectionMouseMove.bind(this);
        this.boundConnectionClick = this.onConnectionClick.bind(this);
        this.boundConnectionKeyDown = this.onConnectionKeyDown.bind(this);

        // 添加鼠标移动监听
        document.addEventListener('mousemove', this.boundConnectionMouseMove);
        document.addEventListener('click', this.boundConnectionClick, true);
        document.addEventListener('keydown', this.boundConnectionKeyDown);

        console.log('连线模式已启动，事件监听器已绑定');
    }

    /**
     * 高亮可连接的节点
     */
    highlightConnectableNodes(fromNode) {
        this.allNodes.forEach(node => {
            if (node.id !== fromNode.id) {
                const element = this.renderer.getNodeElement(node.id);
                if (element) {
                    element.style.boxShadow = '0 0 10px #FFD700';
                    element.style.border = '2px solid #FFD700';
                    console.log(`高亮可连接状态: ${node.name}`);
                }
            }
        });
    }

    /**
     * 清除连接高亮
     */
    clearConnectableHighlights() {
        this.allNodes.forEach(node => {
            const element = this.renderer.getNodeElement(node.id);
            if (element) {
                element.style.boxShadow = '';
                element.style.border = '';
            }
        });
    }

    /**
     * 创建预览连线
     */
    createPreviewLine() {
        if (!this.connectionState.isConnecting) return;

        const svg = this.svgCanvas;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = 'hierarchicalPreviewLine';
        line.setAttribute('stroke', '#FFD700');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.style.opacity = '0.8';

        svg.appendChild(line);
        this.connectionState.previewLine = line;
    }

    /**
     * 连线模式鼠标移动事件
     */
    onConnectionMouseMove(event) {
        if (!this.connectionState.isConnecting || !this.connectionState.previewLine) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // 更新预览线条
        const fromElement = this.renderer.getNodeElement(this.connectionState.fromNode.id);
        if (fromElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
            const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;

            this.connectionState.previewLine.setAttribute('x1', fromX);
            this.connectionState.previewLine.setAttribute('y1', fromY);
            this.connectionState.previewLine.setAttribute('x2', mouseX);
            this.connectionState.previewLine.setAttribute('y2', mouseY);
        }
    }

    /**
     * 连线模式点击事件
     */
    onConnectionClick(event) {
        if (!this.connectionState.isConnecting) {
            console.log('连线点击事件：连线模式未激活');
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        console.log(`连线点击事件 - 目标: ${event.target.tagName}, 类名: ${event.target.className}, ID: ${event.target.id}`);

        // 检查是否点击在状态节点上
        const target = event.target.closest('.hierarchical-state-node');
        if (target) {
            const nodeId = target.getAttribute('data-node-id');
            const toNode = this.allNodes.get(nodeId);

            console.log(`找到目标状态 - 元素ID: ${target.id}, 解析状态ID: ${nodeId}, 状态存在: ${!!toNode}`);

            if (toNode && toNode.id !== this.connectionState.fromNode.id) {
                console.log(`创建连线: ${this.connectionState.fromNode.name} -> ${toNode.name}`);
                
                // 创建连接
                const eventName = prompt('输入转换事件名称:', 'event');
                if (eventName) {
                    this.addTransition(this.connectionState.fromNode.id, toNode.id, eventName.trim());
                }
                this.endConnectionMode();
                return;
            } else if (toNode && toNode.id === this.connectionState.fromNode.id) {
                console.log('无法连接到自身');
                this.endConnectionMode();
                return;
            } else {
                console.log('目标状态无效或不存在');
            }
        } else {
            console.log('未找到状态节点目标');
        }

        // 点击空白处取消连线模式
        console.log('点击空白处或无效目标，取消连线模式');
        this.endConnectionMode();
    }

    /**
     * 连线模式键盘事件
     */
    onConnectionKeyDown(event) {
        if (event.key === 'Escape') {
            this.endConnectionMode();
        }
    }

    /**
     * 结束连线模式
     */
    endConnectionMode() {
        if (!this.connectionState.isConnecting) {
            console.log('结束连线模式：连线模式未激活');
            return;
        }

        console.log('结束连线模式');

        // 移除预览线
        if (this.connectionState.previewLine) {
            this.connectionState.previewLine.remove();
            console.log('预览线已移除');
        }

        // 恢复鼠标样式
        document.body.style.cursor = '';

        // 清除状态高亮
        this.clearConnectableHighlights();

        // 移除事件监听
        if (this.boundConnectionMouseMove) {
            document.removeEventListener('mousemove', this.boundConnectionMouseMove);
        }
        if (this.boundConnectionClick) {
            document.removeEventListener('click', this.boundConnectionClick, true);
        }
        if (this.boundConnectionKeyDown) {
            document.removeEventListener('keydown', this.boundConnectionKeyDown);
        }

        console.log('事件监听器已清理');

        // 重置连线模式
        this.connectionState = {
            isConnecting: false,
            fromNode: null,
            previewLine: null
        };

        // 隐藏连线提示
        this.hideConnectionHint();

        console.log('连线模式已完全重置');
    }

    /**
     * 显示连线提示
     */
    showConnectionHint() {
        // 移除已存在的提示
        this.hideConnectionHint();

        const hint = document.createElement('div');
        hint.id = 'hierarchicalConnectionHint';
        hint.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50';
        hint.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-info-circle"></i>
                <span class="text-sm font-medium">连线模式：点击目标状态完成连线，按ESC键取消</span>
            </div>
        `;

        document.body.appendChild(hint);
    }

    /**
     * 隐藏连线提示
     */
    hideConnectionHint() {
        const hint = document.getElementById('hierarchicalConnectionHint');
        if (hint) {
            hint.remove();
        }
    }

    /**
     * 启动性能监控
     */
    startPerformanceMonitoring() {
        this.performanceMonitor.dragStartTime = performance.now();
        this.performanceMonitor.frameCount = 0;
        this.performanceMonitor.lastFrameTime = this.performanceMonitor.dragStartTime;
        console.log('🚀 拖拽性能监控已启动');
    }

    /**
     * 停止性能监控并显示结果
     */
    stopPerformanceMonitoring() {
        const endTime = performance.now();
        const duration = endTime - this.performanceMonitor.dragStartTime;
        const fps = this.performanceMonitor.frameCount > 0 ? 
            (this.performanceMonitor.frameCount / duration * 1000) : 0;
        
        console.log(`📊 拖拽性能统计:
        持续时间: ${duration.toFixed(2)}ms
        帧数: ${this.performanceMonitor.frameCount}
        平均FPS: ${fps.toFixed(1)}
        ${fps >= 55 ? '✅ 性能良好' : fps >= 30 ? '⚠️ 性能中等' : '❌ 性能较差'}`);
    }

    /**
     * 记录性能帧
     */
    recordPerformanceFrame() {
        if (this.performanceMonitor.enabled && this.dragState.isDragging) {
            this.performanceMonitor.frameCount++;
            this.performanceMonitor.lastFrameTime = performance.now();
        }
    }

    /**
     * 启用/禁用性能监控
     */
    togglePerformanceMonitoring(enabled = true) {
        this.performanceMonitor.enabled = enabled;
        console.log(`性能监控已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 测试拖拽功能
     */
    testDragFunction() {
        console.log('🧪 开始拖拽功能测试...');
        
        // 检查是否有节点
        if (this.allNodes.size === 0) {
            console.log('❌ 没有节点可测试，请先添加一些节点');
            return;
        }
        
        // 获取第一个节点进行测试
        const firstNode = Array.from(this.allNodes.values())[0];
        const element = this.renderer.getNodeElement(firstNode.id);
        
        if (!element) {
            console.log('❌ 无法找到节点对应的DOM元素');
            return;
        }
        
        console.log('✅ 拖拽测试信息:');
        console.log('- 节点ID:', firstNode.id);
        console.log('- 节点位置:', { x: firstNode.x, y: firstNode.y });
        console.log('- 元素位置:', { 
            left: element.style.left, 
            top: element.style.top,
            transform: element.style.transform
        });
        console.log('- 画布尺寸:', this.canvas.getBoundingClientRect());
        
        // 检查拖拽状态
        console.log('- 拖拽状态:', this.dragState);
        
        console.log('💡 使用方法:');
        console.log('1. 启用调试: hierarchicalEditor.toggleDebugMode(true)');
        console.log('2. 拖拽节点观察控制台输出');
        console.log('3. 如果位置不匹配，请检查CSS样式和坐标系');
    }

    /**
     * 启用/禁用调试模式
     */
    toggleDebugMode(enabled = true) {
        this.debugMode = enabled;
        console.log(`拖拽调试模式已${enabled ? '启用' : '禁用'}`);
        
        if (enabled) {
            console.log('🔍 调试模式已启用，拖拽时会显示详细信息');
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HierarchicalStateMachineEditor;
} else if (typeof window !== 'undefined') {
    window.HierarchicalStateMachineEditor = HierarchicalStateMachineEditor;
} 