/**
 * 现代化分层状态机编辑器
 * 继承自BaseEditor，实现分层状态机的编辑功能
 */

import { BaseEditor } from '../common/BaseEditor.js';
import { DOM_IDS, CSS_CLASSES, DEFAULT_CONFIG, COLORS, EVENTS, KEYS, MODES, MESSAGES, ICONS } from '../common/Constants.js';
import { UIComponents } from '../common/UIComponents.js';

// 由于模块系统限制，我们需要直接导入或创建必要的类
// 在实际使用中，这些类应该从相应的模块导入

export class HierarchicalStateMachineEditorModern extends BaseEditor {
    constructor() {
        super(DOM_IDS.HIERARCHICAL_CANVAS, DOM_IDS.HIERARCHICAL_SVG_CANVAS);
        
        // 分层状态机数据
        this.rootNodes = new Map();
        this.allNodes = new Map();
        this.transitions = new Map();
        this.nodeIdCounter = 0;
        this.transitionIdCounter = 0;
        
        // 编辑状态
        this.selectedNode = null;
        this.selectedTransition = null;
        this.currentActiveNode = null;
        
        // 连接状态
        this.connectionState = {
            isConnecting: false,
            fromNode: null,
            previewLine: null
        };
        
        // 拖拽状态
        this.dragState = {
            isDragging: false,
            dragNode: null,
            startPos: { x: 0, y: 0 },
            offset: { x: 0, y: 0 }
        };
        
        // 画布拖动状态
        this.canvasDragState = {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            panX: 0,
            panY: 0,
            zoom: 1
        };
        
        // 渲染器（简化版）
        this.renderer = {
            nodeElements: new Map(),
            transitionElements: new Map()
        };
        
        // 配置
        this.config = {
            ...this.createDefaultConfig(),
            nodeDefaultWidth: DEFAULT_CONFIG.NODE.DEFAULT_WIDTH,
            nodeDefaultHeight: DEFAULT_CONFIG.NODE.DEFAULT_HEIGHT,
            levelIndent: DEFAULT_CONFIG.HIERARCHICAL.LEVEL_INDENT,
            childrenSpacing: DEFAULT_CONFIG.HIERARCHICAL.CHILDREN_SPACING,
            expanderSize: DEFAULT_CONFIG.HIERARCHICAL.EXPANDER_SIZE
        };
    }

    /**
     * 初始化编辑器
     */
    init() {
        try {
            this.log('正在初始化分层状态机编辑器...');
            
            this.setupEventListeners();
            this.setupCanvasDragEvents();
            this.setupUI();
            this.createSampleHierarchy();
            this.updateUI();
            
            // 显示使用提示
            setTimeout(() => {
                if (this.rootNodes.size === 0) {
                    UIComponents.createNotification(MESSAGES.TIPS.RIGHT_CLICK_CREATE, 'info', 5000);
                }
            }, 1000);
            
            // 启用调试模式以便查看坐标计算日志
            this.toggleDebugMode(true);
            
            this.log('分层状态机编辑器初始化完成');
        } catch (error) {
            console.error(MESSAGES.ERROR.EDITOR_INIT_FAILED, error);
            throw error;
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 工具栏按钮
        this.addEventListener(this.getElement(DOM_IDS.ADD_STATE_BTN), EVENTS.CLICK, this.addRootNode);
        this.addEventListener(this.getElement(DOM_IDS.ADD_TRANSITION_BTN), EVENTS.CLICK, this.toggleConnectionMode);
        this.addEventListener(this.getElement(DOM_IDS.ADD_CHILD_STATE_BTN), EVENTS.CLICK, this.addChildNode);
        this.addEventListener(this.getElement('autoLayoutBtn'), EVENTS.CLICK, this.autoLayout);
        this.addEventListener(this.getElement(DOM_IDS.SIMULATE_BTN), EVENTS.CLICK, this.toggleSimulation);
        this.addEventListener(this.getElement(DOM_IDS.RESET_BTN), EVENTS.CLICK, this.reset);
        
        // 画布控制按钮
        this.addEventListener(this.getElement(DOM_IDS.ZOOM_IN_BTN), EVENTS.CLICK, this.zoomIn);
        this.addEventListener(this.getElement(DOM_IDS.ZOOM_OUT_BTN), EVENTS.CLICK, this.zoomOut);
        this.addEventListener(this.getElement(DOM_IDS.FIT_TO_SCREEN_BTN), EVENTS.CLICK, this.fitToScreen);
        this.addEventListener(this.getElement('expandAllBtn'), EVENTS.CLICK, this.expandAll);
        this.addEventListener(this.getElement('collapseAllBtn'), EVENTS.CLICK, this.collapseAll);
        
        // 导航按钮
        this.addEventListener(this.getElement(DOM_IDS.UNDO_BTN), EVENTS.CLICK, this.undo);
        this.addEventListener(this.getElement(DOM_IDS.REDO_BTN), EVENTS.CLICK, this.redo);
        this.addEventListener(this.getElement(DOM_IDS.IMPORT_BTN), EVENTS.CLICK, () => this.importFromJSON(this.loadFromJSON.bind(this)));
        this.addEventListener(this.getElement(DOM_IDS.EXPORT_BTN), EVENTS.CLICK, () => this.exportToJSON(this.toJSON()));
        
        // 画布事件
        this.addEventListener(this.canvas, EVENTS.CLICK, this.onCanvasClick);
        this.addEventListener(this.canvas, EVENTS.DOUBLE_CLICK, this.onCanvasDoubleClick);
        this.addEventListener(this.canvas, EVENTS.CONTEXT_MENU, this.onCanvasContextMenu);
        this.addEventListener(this.canvas, EVENTS.MOUSE_DOWN, this.onMouseDown);
        this.addEventListener(this.canvas, EVENTS.WHEEL, this.onWheel);
        
        // 全局事件
        this.addEventListener(document, EVENTS.MOUSE_MOVE, this.onMouseMove);
        this.addEventListener(document, EVENTS.MOUSE_UP, this.onMouseUp);
        this.addEventListener(document, EVENTS.KEY_DOWN, this.onKeyDown);
        
        // 模态框
        this.addEventListener(this.getElement(DOM_IDS.CLOSE_MODAL), EVENTS.CLICK, this.hideModal);
    }

    /**
     * 设置UI
     */
    setupUI() {
        this.setCanvasCursor('grab');
        this.initializeSVGDefinitions();
    }

    /**
     * 初始化SVG定义
     */
    initializeSVGDefinitions() {
        const defs = this.svgCanvas.querySelector('defs');
        if (!defs) {
            const defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svgCanvas.appendChild(defsElement);
        }
    }

    /**
     * 添加根节点
     */
    addRootNode(x = 100, y = 100) {
        const nodeId = this.generateId('hnode');
        const node = this.createHierarchicalNode(nodeId, `状态${this.nodeIdCounter++}`, x, y, 0);
        
        this.rootNodes.set(nodeId, node);
        this.allNodes.set(nodeId, node);
        
        this.renderNode(node);
        this.addToHistory('addRootNode', node);
        this.updateUI();
        
        this.log(`添加根节点: ${node.name} (${nodeId})`);
        UIComponents.createNotification(MESSAGES.SUCCESS.STATE_CREATED, 'success');
        
        return node;
    }

    /**
     * 添加子节点
     */
    addChildNode() {
        if (!this.selectedNode) {
            UIComponents.createNotification('请先选择一个父状态', 'warning');
            return;
        }
        
        const parentId = this.selectedNode.id;
        const parent = this.allNodes.get(parentId);
        if (!parent) {
            UIComponents.createNotification('未找到父状态', 'error');
            return;
        }
        
        const nodeId = this.generateId('hnode');
        const childX = parent.x + 150;
        const childY = parent.y + 100;
        
        const childNode = this.createHierarchicalNode(nodeId, `子状态${this.nodeIdCounter++}`, childX, childY, parent.level + 1);
        
        this.addChildToParent(parent, childNode);
        this.allNodes.set(nodeId, childNode);
        
        this.renderNode(childNode);
        this.addToHistory('addChildNode', { parent: parentId, child: nodeId });
        this.updateUI();
        
        this.log(`添加子节点: ${childNode.name} 到 ${parent.name}`);
        UIComponents.createNotification('子状态创建成功', 'success');
        
        return childNode;
    }

    /**
     * 创建分层节点
     */
    createHierarchicalNode(id, name, x, y, level) {
        return {
            id,
            name,
            x,
            y,
            level,
            width: this.config.nodeDefaultWidth,
            height: this.config.nodeDefaultHeight,
            color: this.getLevelColor(level),
            parent: null,
            children: new Map(),
            isExpanded: true,
            isInitial: false,
            isFinal: false,
            isComposite: false
        };
    }

    /**
     * 获取层级颜色
     */
    getLevelColor(level) {
        return COLORS.LEVEL_COLORS[level % COLORS.LEVEL_COLORS.length];
    }

    /**
     * 添加子节点到父节点
     */
    addChildToParent(parent, child) {
        child.parent = parent;
        parent.children.set(child.id, child);
        parent.isComposite = true;
    }

    /**
     * 渲染节点
     */
    renderNode(node) {
        let element = this.renderer.nodeElements.get(node.id);
        
        if (!element) {
            element = this.createNodeElement(node);
            this.renderer.nodeElements.set(node.id, element);
            
            const container = this.getElement(DOM_IDS.HIERARCHICAL_STATES_CONTAINER);
            if (container) {
                container.appendChild(element);
            }
        }
        
        this.updateNodeElement(element, node);
        
        return element;
    }

    /**
     * 创建节点DOM元素
     */
    createNodeElement(node) {
        const element = document.createElement('div');
        element.id = `hstate-${node.id}`;
        element.className = CSS_CLASSES.HIERARCHICAL_STATE_NODE;
        element.setAttribute('data-node-id', node.id);
        element.setAttribute('data-level', node.level);
        
        element.style.cssText = `
            position: absolute;
            cursor: move;
            user-select: none;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(8px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        // 创建节点内容
        const content = document.createElement('div');
        content.className = CSS_CLASSES.NODE_CONTENT;
        content.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 8px;
        `;
        
        // 节点名称
        const nameElement = document.createElement('div');
        nameElement.className = CSS_CLASSES.NODE_NAME;
        nameElement.style.cssText = `
            font-weight: 600;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
        `;
        
        // 状态类型指示器
        const typeIndicator = document.createElement('div');
        typeIndicator.className = CSS_CLASSES.TYPE_INDICATOR;
        typeIndicator.style.cssText = `
            font-size: 10px;
            opacity: 0.8;
            margin-top: 2px;
        `;
        
        content.appendChild(nameElement);
        content.appendChild(typeIndicator);
        element.appendChild(content);
        
        // 添加事件监听器
        this.setupNodeEvents(element, node);
        
        return element;
    }

    /**
     * 设置节点事件
     */
    setupNodeEvents(element, node) {
        // 点击事件
        element.addEventListener(EVENTS.CLICK, (e) => {
            e.stopPropagation();
            
            if (this.connectionState.isConnecting) {
                this.handleConnectionClick(node);
            } else {
                this.selectNode(node);
            }
        });
        
        // 右键菜单
        element.addEventListener(EVENTS.CONTEXT_MENU, (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showNodeContextMenu(e, node);
        });
        
        // 拖拽事件
        element.addEventListener(EVENTS.MOUSE_DOWN, (e) => {
            if (e.button !== 0) return;
            
            this.dragState.isDragging = true;
            this.dragState.dragNode = node;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.dragState.startPos = { x: mouseX, y: mouseY };
            this.dragState.offset = {
                x: mouseX - node.x,
                y: mouseY - node.y
            };
            
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });
    }

    /**
     * 更新节点元素
     */
    updateNodeElement(element, node) {
        // 位置更新
        element.style.left = `${node.x}px`;
        element.style.top = `${node.y}px`;
        element.style.width = `${node.width}px`;
        element.style.height = `${node.height}px`;
        
        // 颜色更新
        element.style.backgroundColor = node.color;
        element.style.color = this.getTextColorForBackground(node.color);
        
        // 层级样式
        element.className = `${CSS_CLASSES.HIERARCHICAL_STATE_NODE} level-${node.level}`;
        if (node.isComposite) {
            element.classList.add(CSS_CLASSES.COMPOSITE_STATE);
        }
        
        // 更新内容
        const nameElement = element.querySelector(`.${CSS_CLASSES.NODE_NAME}`);
        if (nameElement) {
            nameElement.textContent = node.name;
        }
        
        const typeIndicator = element.querySelector(`.${CSS_CLASSES.TYPE_INDICATOR}`);
        if (typeIndicator) {
            let typeText = '';
            if (node.isInitial) typeText += '▶ ';
            if (node.isFinal) typeText += '⏹ ';
            if (node.isComposite) typeText += `📁(${node.children.size}) `;
            typeIndicator.textContent = typeText;
        }
    }

    /**
     * 选择节点
     */
    selectNode(node) {
        this.clearSelection();
        this.selectedNode = node;
        
        const element = this.getElement(`hstate-${node.id}`);
        if (element) {
            element.style.boxShadow = `0 0 0 3px ${COLORS.SELECTION}`;
        }
        
        this.updatePropertiesPanel();
        this.log(`选择节点: ${node.name}`);
    }

    /**
     * 清除选择
     */
    clearSelection() {
        this.selectedNode = null;
        this.selectedTransition = null;
        
        // 清除节点高亮
        this.allNodes.forEach(node => {
            const element = this.getElement(`hstate-${node.id}`);
            if (element) {
                element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
        });
    }

    /**
     * 鼠标按下事件
     */
    onMouseDown(e) {
        const nodeElement = e.target.closest(`.${CSS_CLASSES.HIERARCHICAL_STATE_NODE}`);
        if (nodeElement && e.button === 0) {
            // 节点拖拽已在setupNodeEvents中处理
            return;
        } else if (this.isCanvasBackground(e.target) && e.button === 0) {
            // 画布拖动
            this.canvasDragState.isDragging = true;
            this.canvasDragState.startPos = {
                x: e.clientX - this.canvasDragState.panX,
                y: e.clientY - this.canvasDragState.panY
            };
            
            this.setCanvasCursor('grabbing');
            e.preventDefault();
        }
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(e) {
        if (this.dragState.isDragging && this.dragState.dragNode) {
            // 节点拖拽
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let newX = mouseX - this.dragState.offset.x;
            let newY = mouseY - this.dragState.offset.y;
            
            // 网格对齐
            if (this.config.snapToGrid) {
                newX = Math.round(newX / DEFAULT_CONFIG.CANVAS.GRID_SIZE) * DEFAULT_CONFIG.CANVAS.GRID_SIZE;
                newY = Math.round(newY / DEFAULT_CONFIG.CANVAS.GRID_SIZE) * DEFAULT_CONFIG.CANVAS.GRID_SIZE;
            }
            
            this.dragState.dragNode.x = newX;
            this.dragState.dragNode.y = newY;
            
            const element = this.getElement(`hstate-${this.dragState.dragNode.id}`);
            if (element) {
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }
            
            this.updateNodeTransitions(this.dragState.dragNode.id);
        } else if (this.canvasDragState.isDragging) {
            // 画布拖动
            this.canvasDragState.panX = e.clientX - this.canvasDragState.startPos.x;
            this.canvasDragState.panY = e.clientY - this.canvasDragState.startPos.y;
            this.updateCanvasTransform();
        }
    }

    /**
     * 鼠标抬起事件
     */
    onMouseUp(e) {
        if (this.dragState.isDragging) {
            this.dragState.isDragging = false;
            
            if (this.dragState.dragNode) {
                const element = this.getElement(`hstate-${this.dragState.dragNode.id}`);
                if (element) {
                    element.style.cursor = 'move';
                }
                this.dragState.dragNode = null;
            }
        }
        
        if (this.canvasDragState.isDragging) {
            this.canvasDragState.isDragging = false;
            this.setCanvasCursor('grab');
        }
    }

    /**
     * 滚轮事件
     */
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.canvasDragState.zoom = Math.max(0.3, Math.min(3, this.canvasDragState.zoom * delta));
        this.updateCanvasTransform();
    }

    /**
     * 更新画布变换
     */
    updateCanvasTransform() {
        const statesContainer = this.getElement(DOM_IDS.HIERARCHICAL_STATES_CONTAINER);
        const svgCanvas = this.svgCanvas;
        
        if (statesContainer && svgCanvas) {
            const transform = `scale(${this.canvasDragState.zoom}) translate(${this.canvasDragState.panX}px, ${this.canvasDragState.panY}px)`;
            statesContainer.style.transform = transform;
            svgCanvas.style.transform = transform;
        }
    }

    /**
     * 检查是否为画布背景
     */
    isCanvasBackground(target) {
        if (target.closest(`.${CSS_CLASSES.HIERARCHICAL_STATE_NODE}`)) {
            return false;
        }
        
        return target === this.canvas || 
               target === this.svgCanvas ||
               target.id === DOM_IDS.HIERARCHICAL_CANVAS ||
               target.id === DOM_IDS.HIERARCHICAL_SVG_CANVAS ||
               target.id === DOM_IDS.HIERARCHICAL_STATES_CONTAINER;
    }

    /**
     * 获取文本颜色
     */
    getTextColorForBackground(backgroundColor) {
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    /**
     * 创建示例层次结构
     */
    createSampleHierarchy() {
        // 创建根状态
        const rootState = this.addRootNode(100, 100);
        rootState.name = '游戏状态';
        rootState.isInitial = true;
        
        // 创建子状态
        const menuState = this.createHierarchicalNode(this.generateId('hnode'), '主菜单', 50, 200, 1);
        const gameState = this.createHierarchicalNode(this.generateId('hnode'), '游戏中', 250, 200, 1);
        const pauseState = this.createHierarchicalNode(this.generateId('hnode'), '暂停', 450, 200, 1);
        
        this.addChildToParent(rootState, menuState);
        this.addChildToParent(rootState, gameState);
        this.addChildToParent(rootState, pauseState);
        
        this.allNodes.set(menuState.id, menuState);
        this.allNodes.set(gameState.id, gameState);
        this.allNodes.set(pauseState.id, pauseState);
        
        // 在游戏中状态下创建子状态
        const playingState = this.createHierarchicalNode(this.generateId('hnode'), '正在游戏', 200, 320, 2);
        const gameOverState = this.createHierarchicalNode(this.generateId('hnode'), '游戏结束', 350, 320, 2);
        
        this.addChildToParent(gameState, playingState);
        this.addChildToParent(gameState, gameOverState);
        
        this.allNodes.set(playingState.id, playingState);
        this.allNodes.set(gameOverState.id, gameOverState);
        
        this.render();
    }

    /**
     * 渲染整个分层状态机
     */
    render() {
        // 清理现有元素
        const container = this.getElement(DOM_IDS.HIERARCHICAL_STATES_CONTAINER);
        if (container) {
            container.innerHTML = '';
        }
        this.svgCanvas.innerHTML = '';
        this.initializeSVGDefinitions();
        
        // 重新渲染所有节点
        this.renderer.nodeElements.clear();
        this.allNodes.forEach(node => {
            this.renderNode(node);
        });
        
        this.updateUI();
    }

    /**
     * 更新UI
     */
    updateUI() {
        this.updateStatesList();
        this.updateStatistics();
        this.updatePropertiesPanel();
        this.updateHistoryUI();
    }

    /**
     * 更新状态列表
     */
    updateStatesList() {
        const list = this.getElement(DOM_IDS.STATES_LIST);
        if (!list) return;
        
        list.innerHTML = '';
        
        // 递归渲染层次结构
        this.rootNodes.forEach(rootNode => {
            this.renderNodeHierarchy(list, rootNode, 0);
        });
    }

    /**
     * 渲染节点层次结构
     */
    renderNodeHierarchy(container, node, depth) {
        const indent = '  '.repeat(depth);
        const item = UIComponents.createListItem(
            `${indent}${node.name}`,
            () => this.selectNode(node),
            node.isComposite ? ICONS.SITEMAP : (node.isInitial ? ICONS.PLAY : (node.isFinal ? ICONS.STOP : null)),
            'text-white'
        );
        item.style.backgroundColor = node.color;
        item.style.color = this.getTextColorForBackground(node.color);
        container.appendChild(item);
        
        // 递归渲染子节点
        if (node.isExpanded && node.children.size > 0) {
            node.children.forEach(child => {
                this.renderNodeHierarchy(container, child, depth + 1);
            });
        }
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        const statesCount = this.getElement(DOM_IDS.STATES_COUNT);
        const transitionsCount = this.getElement(DOM_IDS.TRANSITIONS_COUNT);
        const levelsCount = this.getElement('levelsCount');
        const compositeCount = this.getElement('compositeCount');
        
        if (statesCount) statesCount.textContent = this.allNodes.size;
        if (transitionsCount) transitionsCount.textContent = this.transitions.size;
        
        // 计算层级数量
        const levels = new Set();
        this.allNodes.forEach(node => levels.add(node.level));
        if (levelsCount) levelsCount.textContent = levels.size;
        
        // 计算复合状态数量
        const compositeStates = Array.from(this.allNodes.values()).filter(node => node.isComposite);
        if (compositeCount) compositeCount.textContent = compositeStates.length;
    }

    /**
     * 更新属性面板
     */
    updatePropertiesPanel() {
        const panel = this.getElement(DOM_IDS.SELECTED_ELEMENT_INFO);
        if (!panel) return;
        
        if (this.selectedNode) {
            const node = this.selectedNode;
            panel.innerHTML = `
                <div class="space-y-2">
                    <div><strong>状态名称:</strong> ${node.name}</div>
                    <div><strong>层级:</strong> ${node.level}</div>
                    <div><strong>位置:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</div>
                    <div><strong>颜色:</strong> <span style="color: ${node.color}">●</span> ${node.color}</div>
                    <div><strong>初始状态:</strong> ${node.isInitial ? '是' : '否'}</div>
                    <div><strong>终止状态:</strong> ${node.isFinal ? '是' : '否'}</div>
                    <div><strong>复合状态:</strong> ${node.isComposite ? '是' : '否'}</div>
                    <div><strong>子状态数量:</strong> ${node.children.size}</div>
                </div>
            `;
        } else {
            panel.innerHTML = '点击状态或转换查看属性';
        }
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            rootNodes: Array.from(this.rootNodes.values()).map(node => this.nodeToJSON(node)),
            transitions: Array.from(this.transitions.values()),
            metadata: {
                created: new Date().toISOString(),
                version: '2.0.0',
                type: 'hierarchical-state-machine'
            }
        };
    }

    /**
     * 节点转JSON
     */
    nodeToJSON(node) {
        return {
            id: node.id,
            name: node.name,
            x: node.x,
            y: node.y,
            level: node.level,
            width: node.width,
            height: node.height,
            color: node.color,
            isInitial: node.isInitial,
            isFinal: node.isFinal,
            isComposite: node.isComposite,
            isExpanded: node.isExpanded,
            children: Array.from(node.children.values()).map(child => this.nodeToJSON(child))
        };
    }

    /**
     * 从JSON加载
     */
    loadFromJSON(data) {
        this.clear();
        
        if (data.rootNodes) {
            data.rootNodes.forEach(nodeData => {
                const node = this.nodeFromJSON(nodeData);
                this.rootNodes.set(node.id, node);
                this.addNodeToAllNodes(node);
            });
        }
        
        this.render();
        UIComponents.createNotification(MESSAGES.SUCCESS.FILE_IMPORTED, 'success');
    }

    /**
     * 从JSON创建节点
     */
    nodeFromJSON(data) {
        const node = this.createHierarchicalNode(data.id, data.name, data.x, data.y, data.level);
        
        node.width = data.width || this.config.nodeDefaultWidth;
        node.height = data.height || this.config.nodeDefaultHeight;
        node.color = data.color || this.getLevelColor(data.level);
        node.isInitial = data.isInitial || false;
        node.isFinal = data.isFinal || false;
        node.isComposite = data.isComposite || false;
        node.isExpanded = data.isExpanded !== false;
        
        // 递归创建子节点
        if (data.children && data.children.length > 0) {
            data.children.forEach(childData => {
                const childNode = this.nodeFromJSON(childData);
                this.addChildToParent(node, childNode);
            });
        }
        
        return node;
    }

    /**
     * 添加节点到所有节点映射
     */
    addNodeToAllNodes(node) {
        this.allNodes.set(node.id, node);
        node.children.forEach(child => {
            this.addNodeToAllNodes(child);
        });
    }

    /**
     * 清空编辑器
     */
    clear() {
        this.rootNodes.clear();
        this.allNodes.clear();
        this.transitions.clear();
        this.clearSelection();
        this.renderer.nodeElements.clear();
        this.renderer.transitionElements.clear();
        this.render();
    }

    /**
     * 重置编辑器
     */
    reset() {
        UIComponents.createConfirmDialog(
            MESSAGES.CONFIRM.RESET_EDITOR,
            () => {
                this.clear();
                this.createSampleHierarchy();
                this.addToHistory('reset');
            }
        );
    }

    /**
     * 切换连接模式
     */
    toggleConnectionMode() {
        this.connectionState.isConnecting = !this.connectionState.isConnecting;
        
        const button = this.getElement(DOM_IDS.ADD_TRANSITION_BTN);
        if (button) {
            if (this.connectionState.isConnecting) {
                button.style.backgroundColor = COLORS.CONNECTION_PREVIEW;
                button.style.color = '#000';
                this.setCanvasCursor('crosshair');
                UIComponents.createNotification('连接模式已启用，点击两个状态创建转换', 'info');
            } else {
                button.style.backgroundColor = '';
                button.style.color = '';
                this.setCanvasCursor('grab');
                this.connectionState.fromNode = null;
            }
        }
        
        this.log(`连接模式: ${this.connectionState.isConnecting ? '启用' : '禁用'}`);
    }

    /**
     * 自动布局
     */
    autoLayout() {
        const padding = 50;
        const levelSpacing = 200;
        const nodeSpacing = 150;
        
        // 按层级组织节点
        const nodesByLevel = new Map();
        this.allNodes.forEach(node => {
            if (!nodesByLevel.has(node.level)) {
                nodesByLevel.set(node.level, []);
            }
            nodesByLevel.get(node.level).push(node);
        });
        
        // 计算每层的位置
        let currentY = padding;
        for (const [level, nodes] of nodesByLevel) {
            const totalWidth = nodes.length * nodeSpacing;
            let currentX = padding;
            
            nodes.forEach((node, index) => {
                node.x = currentX + (index * nodeSpacing);
                node.y = currentY;
                
                const element = this.getElement(`hstate-${node.id}`);
                if (element) {
                    element.style.left = `${node.x}px`;
                    element.style.top = `${node.y}px`;
                }
            });
            
            currentY += levelSpacing;
        }
        
        this.updateNodeTransitions();
        this.addToHistory('autoLayout');
        
        UIComponents.createNotification('自动布局完成', 'success');
        this.log('自动布局完成');
    }

    /**
     * 展开所有节点
     */
    expandAll() {
        this.allNodes.forEach(node => {
            node.isExpanded = true;
        });
        
        this.render();
        this.addToHistory('expandAll');
        
        UIComponents.createNotification('所有节点已展开', 'success');
        this.log('展开所有节点');
    }

    /**
     * 折叠所有节点
     */
    collapseAll() {
        this.allNodes.forEach(node => {
            if (node.level > 0) { // 不折叠根节点
                node.isExpanded = false;
            }
        });
        
        this.render();
        this.addToHistory('collapseAll');
        
        UIComponents.createNotification('所有节点已折叠', 'success');
        this.log('折叠所有节点');
    }

    /**
     * 切换模拟
     */
    toggleSimulation() {
        this.isSimulating = !this.isSimulating;
        
        const button = this.getElement(DOM_IDS.SIMULATE_BTN);
        const currentStateElement = this.getElement(DOM_IDS.CURRENT_STATE);
        
        if (this.isSimulating) {
            // 开始模拟
            const initialNodes = Array.from(this.allNodes.values()).filter(n => n.isInitial);
            if (initialNodes.length > 0) {
                this.currentActiveNode = initialNodes[0];
                
                if (currentStateElement) {
                    const statePath = this.getStatePath(this.currentActiveNode);
                    currentStateElement.textContent = statePath;
                    currentStateElement.style.backgroundColor = this.currentActiveNode.color;
                    currentStateElement.style.color = this.getTextColorForBackground(this.currentActiveNode.color);
                }
                
                this.highlightActiveNode(this.currentActiveNode);
                
                if (button) {
                    button.innerHTML = '<i class="fas fa-stop text-lg mb-1"></i><div class="text-xs font-medium">停止模拟</div>';
                    button.style.backgroundColor = COLORS.ERROR;
                }
                
                UIComponents.createNotification('分层状态机模拟已开始', 'success');
            } else {
                UIComponents.createNotification('没有找到初始状态', 'error');
                this.isSimulating = false;
            }
        } else {
            // 停止模拟
            this.currentActiveNode = null;
            
            if (currentStateElement) {
                currentStateElement.textContent = '未开始';
                currentStateElement.style.backgroundColor = '';
                currentStateElement.style.color = '';
            }
            
            this.clearSimulationHighlight();
            
            if (button) {
                button.innerHTML = '<i class="fas fa-play text-lg mb-1"></i><div class="text-xs font-medium">模拟运行</div>';
                button.style.backgroundColor = '';
            }
            
            UIComponents.createNotification('分层状态机模拟已停止', 'info');
        }
    }

    /**
     * 获取状态路径
     */
    getStatePath(node) {
        const path = [];
        let current = node;
        
        while (current) {
            path.unshift(current.name);
            current = current.parent;
        }
        
        return path.join(' > ');
    }

    /**
     * 高亮活动节点
     */
    highlightActiveNode(node) {
        this.clearSimulationHighlight();
        
        const element = this.getElement(`hstate-${node.id}`);
        if (element) {
            element.style.boxShadow = `0 0 20px ${COLORS.SUCCESS}`;
            element.style.animation = 'pulse 2s infinite';
        }
    }

    /**
     * 清除模拟高亮
     */
    clearSimulationHighlight() {
        this.allNodes.forEach(node => {
            const element = this.getElement(`hstate-${node.id}`);
            if (element) {
                element.style.animation = '';
                if (node !== this.selectedNode) {
                    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }
            }
        });
    }

    /**
     * 画布点击事件
     */
    onCanvasClick(e) {
        if (this.isCanvasBackground(e.target)) {
            this.clearSelection();
            
            if (this.connectionState.isConnecting) {
                this.toggleConnectionMode(); // 退出连接模式
            }
        }
    }

    /**
     * 画布双击事件
     */
    onCanvasDoubleClick(e) {
        if (this.isCanvasBackground(e.target)) {
            const rect = this.canvas.getBoundingClientRect();
            // 考虑画布的缩放和平移
            const panX = this.canvasDragState.panX || 0;
            const panY = this.canvasDragState.panY || 0;
            const zoom = this.canvasDragState.zoom || 1;
            const x = (e.clientX - rect.left - panX) / zoom;
            const y = (e.clientY - rect.top - panY) / zoom;
            
            this.addRootNode(x, y);
        }
        
        this.log('画布双击 - 添加根节点');
    }

    /**
     * 画布右键菜单
     */
    onCanvasContextMenu(e) {
        e.preventDefault();
        
        if (this.isCanvasBackground(e.target)) {
            const items = [
                this.createContextMenuItem(ICONS.ADD, '在此处创建根状态', () => {
                    const rect = this.canvas.getBoundingClientRect();
                    // 考虑画布的缩放和平移
                    const panX = this.canvasDragState.panX || 0;
                    const panY = this.canvasDragState.panY || 0;
                    const zoom = this.canvasDragState.zoom || 1;
                    const x = (e.clientX - rect.left - panX) / zoom;
                    const y = (e.clientY - rect.top - panY) / zoom;
                    
                    this.log(`右键创建根状态 - 鼠标位置: (${e.clientX}, ${e.clientY}), 画布偏移: (${panX}, ${panY}), 缩放: ${zoom}, 计算坐标: (${x}, ${y})`);
                    this.addRootNode(x, y);
                }),
                this.createContextMenuItem(ICONS.SITEMAP, '添加子状态', () => {
                    if (this.selectedNode) {
                        this.addChildNode();
                    } else {
                        UIComponents.createNotification('请先选择一个父状态', 'warning');
                    }
                }),
                this.createContextMenuItem('fas fa-magic', '创建示例层次结构', () => {
                    this.createSampleHierarchy();
                }),
                this.createContextMenuItem('fas fa-separator', '', () => {}, 'border-t border-gray-300 my-1 pointer-events-none'),
                this.createContextMenuItem(ICONS.PROJECT_DIAGRAM, '自动布局', () => {
                    this.autoLayout();
                }),
                this.createContextMenuItem('fas fa-expand-arrows-alt', '展开所有', () => {
                    this.expandAll();
                }),
                this.createContextMenuItem('fas fa-compress-arrows-alt', '折叠所有', () => {
                    this.collapseAll();
                }),
                this.createContextMenuItem('fas fa-separator', '', () => {}, 'border-t border-gray-300 my-1 pointer-events-none'),
                this.createContextMenuItem(ICONS.IMPORT, '导入JSON文件', () => {
                    this.importFromJSON(this.loadFromJSON.bind(this));
                }),
                this.createContextMenuItem(ICONS.EXPORT, '导出为JSON', () => {
                    this.exportToJSON(this.toJSON());
                }),
                this.createContextMenuItem('fas fa-separator', '', () => {}, 'border-t border-gray-300 my-1 pointer-events-none'),
                this.createContextMenuItem(ICONS.FIT_SCREEN, '适应屏幕', () => {
                    this.fitToScreen();
                }),
                this.createContextMenuItem('fas fa-broom', '清空画布', () => {
                    if (confirm('确定要清空所有状态和转换吗？')) {
                        this.clear();
                    }
                }, 'text-red-500')
            ];
            
            this.showContextMenuAt(e.clientX, e.clientY, items);
        }
    }

    /**
     * 键盘事件处理
     */
    onKeyDown(e) {
        switch (e.key) {
            case KEYS.DELETE:
            case KEYS.BACKSPACE:
                if (this.selectedNode) {
                    this.deleteSelectedNode();
                }
                break;
                
            case KEYS.ESCAPE:
                this.clearSelection();
                if (this.connectionState.isConnecting) {
                    this.toggleConnectionMode();
                }
                break;
                
            case 'z':
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
                break;
                
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.exportToJSON(this.toJSON());
                }
                break;
                
            case 'o':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.importFromJSON(this.loadFromJSON.bind(this));
                }
                break;
                
            case 'c':
                if (e.ctrlKey && this.selectedNode) {
                    e.preventDefault();
                    this.addChildNode();
                }
                break;
        }
    }

    /**
     * 显示节点右键菜单
     */
    showNodeContextMenu(e, node) {
        e.preventDefault();
        e.stopPropagation();
        
        const items = [
            this.createContextMenuItem(ICONS.EDIT, '编辑状态', () => {
                this.editNode(node);
            }),
            this.createContextMenuItem(ICONS.SITEMAP, '添加子状态', () => {
                this.selectNode(node);
                this.addChildNode();
            }),
            this.createContextMenuItem(ICONS.DELETE, '删除状态', () => {
                this.deleteNode(node);
            }, 'text-red-500'),
            this.createContextMenuItem(ICONS.ARROW_RIGHT, '设为初始状态', () => {
                this.setInitialNode(node);
            }),
            this.createContextMenuItem(ICONS.STOP, '设为终止状态', () => {
                this.toggleFinalNode(node);
            }),
            this.createContextMenuItem(
                node.isExpanded ? 'fas fa-compress' : 'fas fa-expand', 
                node.isExpanded ? '折叠' : '展开', 
                () => {
                    this.toggleNodeExpansion(node);
                }
            )
        ];
        
        this.showContextMenuAt(e.clientX, e.clientY, items);
        
        this.log(`显示节点 ${node.name} 的右键菜单`);
    }

    /**
     * 处理连接点击
     */
    handleConnectionClick(node) {
        if (!this.connectionState.fromNode) {
            this.connectionState.fromNode = node;
            UIComponents.createNotification(`已选择起始状态: ${node.name}，请选择目标状态`, 'info');
        } else if (this.connectionState.fromNode.id !== node.id) {
            this.createTransition(this.connectionState.fromNode.id, node.id);
            this.connectionState.fromNode = null;
            this.toggleConnectionMode(); // 退出连接模式
        } else {
            UIComponents.createNotification('不能连接到自己，请选择其他状态', 'warning');
        }
        
        this.log(`连接点击: ${node.name}`);
    }

    /**
     * 创建转换
     */
    createTransition(fromId, toId, event = 'event', condition = '') {
        const transitionId = this.generateId('htransition');
        const transition = {
            id: transitionId,
            fromId,
            toId,
            event,
            condition
        };
        
        this.transitions.set(transitionId, transition);
        this.createTransitionLine(transition);
        this.addToHistory('addTransition', transition);
        this.updateUI();
        
        const fromNode = this.allNodes.get(fromId);
        const toNode = this.allNodes.get(toId);
        this.log(`创建转换: ${fromNode?.name} → ${toNode?.name} [${event}]`);
        UIComponents.createNotification('转换创建成功', 'success');
        
        return transition;
    }

    /**
     * 创建转换线条
     */
    createTransitionLine(transition) {
        const fromNode = this.allNodes.get(transition.fromId);
        const toNode = this.allNodes.get(transition.toId);
        
        if (!fromNode || !toNode) return;
        
        // 创建SVG组
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `htransition-${transition.id}`;
        g.setAttribute('data-transition-id', transition.id);
        g.className = CSS_CLASSES.HIERARCHICAL_TRANSITION;
        
        // 创建路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', COLORS.TRANSITION_TYPES.DEFAULT);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        // 创建标签
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#fff');
        text.textContent = transition.event;
        
        // 创建标签背景
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
        rect.setAttribute('rx', '4');
        
        g.appendChild(path);
        g.appendChild(rect);
        g.appendChild(text);
        
        // 添加事件监听器
        g.addEventListener(EVENTS.CLICK, (e) => {
            e.stopPropagation();
            this.selectTransition(transition);
        });
        
        this.svgCanvas.appendChild(g);
        this.updateTransitionLine(transition);
        
        return g;
    }

    /**
     * 更新转换线条
     */
    updateTransitionLine(transition) {
        const element = this.getElement(`htransition-${transition.id}`);
        if (!element) return;
        
        const fromNode = this.allNodes.get(transition.fromId);
        const toNode = this.allNodes.get(transition.toId);
        if (!fromNode || !toNode) return;
        
        const startPoint = this.getConnectionPoint(fromNode, toNode);
        const endPoint = this.getConnectionPoint(toNode, fromNode);
        
        // 计算曲线路径
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(distance * 0.2, 50);
        
        const cp1x = startPoint.x + dx * 0.3;
        const cp1y = startPoint.y - curvature;
        const cp2x = endPoint.x - dx * 0.3;
        const cp2y = endPoint.y - curvature;
        
        const pathData = `M ${startPoint.x} ${startPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPoint.x} ${endPoint.y}`;
        
        const path = element.querySelector('path');
        if (path) {
            path.setAttribute('d', pathData);
        }
        
        // 更新标签位置
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2 - curvature / 2;
        
        const text = element.querySelector('text');
        const rect = element.querySelector('rect');
        
        if (text && rect) {
            text.setAttribute('x', midX);
            text.setAttribute('y', midY);
            
            // 更新背景矩形
            const bbox = text.getBBox();
            rect.setAttribute('x', bbox.x - 4);
            rect.setAttribute('y', bbox.y - 2);
            rect.setAttribute('width', bbox.width + 8);
            rect.setAttribute('height', bbox.height + 4);
        }
    }

    /**
     * 获取连接点
     */
    getConnectionPoint(fromNode, toNode) {
        const fromCenterX = fromNode.x + fromNode.width / 2;
        const fromCenterY = fromNode.y + fromNode.height / 2;
        const toCenterX = toNode.x + toNode.width / 2;
        const toCenterY = toNode.y + toNode.height / 2;
        
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        
        const angle = Math.atan2(dy, dx);
        const radius = Math.min(fromNode.width, fromNode.height) / 2;
        
        return {
            x: fromCenterX + Math.cos(angle) * radius,
            y: fromCenterY + Math.sin(angle) * radius
        };
    }

    /**
     * 选择转换
     */
    selectTransition(transition) {
        this.clearSelection();
        this.selectedTransition = transition;
        
        const element = this.getElement(`htransition-${transition.id}`);
        if (element) {
            const path = element.querySelector('path');
            if (path) {
                path.style.stroke = COLORS.SELECTION;
                path.style.strokeWidth = '4';
            }
        }
        
        this.updatePropertiesPanel();
        this.log(`选择转换: ${transition.event}`);
    }

    /**
     * 更新节点转换
     */
    updateNodeTransitions(nodeId = null) {
        if (nodeId) {
            // 更新特定节点的转换
            for (const [transitionId, transition] of this.transitions) {
                if (transition.fromId === nodeId || transition.toId === nodeId) {
                    this.updateTransitionLine(transition);
                }
            }
        } else {
            // 更新所有转换
            for (const [transitionId, transition] of this.transitions) {
                this.updateTransitionLine(transition);
            }
        }
    }

    /**
     * 编辑节点
     */
    editNode(node) {
        const modalContent = `
            <form id="editNodeForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1" style="color: var(--md-on-surface);">状态名称</label>
                    <input type="text" id="nodeName" class="w-full px-3 py-2 rounded-lg text-sm" value="${node.name}" style="background: rgba(255, 255, 255, 0.9); color: #1a1a1a;">
                </div>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="isInitial" ${node.isInitial ? 'checked' : ''} class="mr-2">
                        <span class="text-sm" style="color: var(--md-on-surface);">初始状态</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="isFinal" ${node.isFinal ? 'checked' : ''} class="mr-2">
                        <span class="text-sm" style="color: var(--md-on-surface);">终止状态</span>
                    </label>
                </div>
                <div class="flex justify-end space-x-2 mt-6">
                    <button type="button" id="cancelEdit" class="md-surface-variant px-4 py-2 rounded-lg transition-colors">取消</button>
                    <button type="submit" class="md-primary-btn px-4 py-2 rounded-lg transition-colors">确定</button>
                </div>
            </form>
        `;
        
        this.showModal('编辑状态', modalContent);
        
        const form = document.getElementById('editNodeForm');
        const cancelBtn = document.getElementById('cancelEdit');
        
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('nodeName');
            const initialCheckbox = document.getElementById('isInitial');
            const finalCheckbox = document.getElementById('isFinal');
            
            const oldName = node.name;
            node.name = nameInput.value.trim() || oldName;
            node.isInitial = initialCheckbox.checked;
            node.isFinal = finalCheckbox.checked;
            
            // 确保只有一个初始状态
            if (node.isInitial) {
                this.allNodes.forEach(n => {
                    if (n.id !== node.id) n.isInitial = false;
                });
            }
            
            this.updateNodeElement(this.renderer.nodeElements.get(node.id), node);
            this.addToHistory('editNode', { id: node.id, oldName, newName: node.name });
            this.updateUI();
            this.hideModal();
            
            UIComponents.createNotification('状态已更新', 'success');
        });
    }

    /**
     * 删除节点
     */
    deleteNode(node) {
        UIComponents.createConfirmDialog(
            MESSAGES.CONFIRM.DELETE_STATE.replace('{name}', node.name),
            () => {
                // 递归删除子节点
                this.deleteNodeRecursively(node);
                
                // 删除相关转换
                const relatedTransitions = Array.from(this.transitions.values())
                    .filter(t => t.fromId === node.id || t.toId === node.id);
                
                relatedTransitions.forEach(t => {
                    this.transitions.delete(t.id);
                    const element = this.getElement(`htransition-${t.id}`);
                    if (element) element.remove();
                });
                
                this.clearSelection();
                this.addToHistory('deleteNode', { node, relatedTransitions });
                this.updateUI();
                
                UIComponents.createNotification('状态已删除', 'success');
            }
        );
    }

    /**
     * 递归删除节点
     */
    deleteNodeRecursively(node) {
        // 先删除所有子节点
        node.children.forEach(child => {
            this.deleteNodeRecursively(child);
        });
        
        // 从父节点中移除
        if (node.parent) {
            node.parent.children.delete(node.id);
            if (node.parent.children.size === 0) {
                node.parent.isComposite = false;
            }
        }
        
        // 从根节点中移除
        this.rootNodes.delete(node.id);
        
        // 从所有节点中移除
        this.allNodes.delete(node.id);
        
        // 移除DOM元素
        const element = this.getElement(`hstate-${node.id}`);
        if (element) element.remove();
        
        // 从渲染器中移除
        this.renderer.nodeElements.delete(node.id);
    }

    /**
     * 设置初始节点
     */
    setInitialNode(node) {
        this.allNodes.forEach(n => n.isInitial = false);
        node.isInitial = true;
        
        this.allNodes.forEach(n => {
            const element = this.renderer.nodeElements.get(n.id);
            if (element) {
                this.updateNodeElement(element, n);
            }
        });
        
        this.addToHistory('setInitialNode', node.id);
        this.updateUI();
        
        UIComponents.createNotification(`${node.name} 已设为初始状态`, 'success');
    }

    /**
     * 切换终止节点
     */
    toggleFinalNode(node) {
        node.isFinal = !node.isFinal;
        
        const element = this.renderer.nodeElements.get(node.id);
        if (element) {
            this.updateNodeElement(element, node);
        }
        
        this.addToHistory('toggleFinalNode', node.id);
        this.updateUI();
        
        UIComponents.createNotification(
            `${node.name} ${node.isFinal ? '已设为' : '已取消'}终止状态`, 
            'success'
        );
    }

    /**
     * 切换节点展开状态
     */
    toggleNodeExpansion(node) {
        node.isExpanded = !node.isExpanded;
        
        this.render();
        this.addToHistory('toggleExpansion', node.id);
        
        UIComponents.createNotification(
            `${node.name} 已${node.isExpanded ? '展开' : '折叠'}`, 
            'info'
        );
    }

    /**
     * 删除选中节点
     */
    deleteSelectedNode() {
        if (this.selectedNode) {
            this.deleteNode(this.selectedNode);
        }
        
        this.log('删除选中节点');
    }

    /**
     * 适应屏幕
     */
    fitToScreen() {
        if (this.allNodes.size === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.allNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });
        
        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / contentWidth;
        const scaleY = canvasRect.height / contentHeight;
        
        this.canvasDragState.zoom = Math.min(scaleX, scaleY, 1);
        this.canvasDragState.panX = (canvasRect.width - contentWidth * this.canvasDragState.zoom) / 2 - (minX - padding) * this.canvasDragState.zoom;
        this.canvasDragState.panY = (canvasRect.height - contentHeight * this.canvasDragState.zoom) / 2 - (minY - padding) * this.canvasDragState.zoom;
        
        this.updateCanvasTransform();
        
        UIComponents.createNotification('已适应屏幕', 'success');
    }

    /**
     * 从历史记录恢复状态
     */
    restoreFromHistory() {
        if (this.history.currentIndex >= 0 && this.history.currentIndex < this.history.entries.length) {
            const entry = this.history.entries[this.history.currentIndex];
            
            // 根据操作类型恢复状态
            switch (entry.action) {
                case 'addRootNode':
                case 'addChildNode':
                case 'deleteNode':
                case 'addTransition':
                case 'autoLayout':
                case 'expandAll':
                case 'collapseAll':
                default:
                    // 重新渲染整个分层状态机
                    this.render();
                    break;
            }
        }
    }
} 