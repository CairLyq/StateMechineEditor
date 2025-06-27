/**
 * 标准状态机编辑器
 * 继承自BaseEditor，实现标准状态机的编辑功能
 */

import { BaseEditor } from '../common/BaseEditor.js';
import { DOM_IDS, CSS_CLASSES, DEFAULT_CONFIG, COLORS, EVENTS, KEYS, MODES, MESSAGES, ICONS, TEMPLATES } from '../common/Constants.js';
import { UIComponents } from '../common/UIComponents.js';

export class StandardStateMachineEditor extends BaseEditor {
    constructor() {
        super(DOM_IDS.CANVAS, DOM_IDS.SVG_CANVAS);
        
        // 状态机数据
        this.states = new Map();
        this.transitions = new Map();
        this.stateIdCounter = 0;
        this.transitionIdCounter = 0;
        
        // 编辑状态
        this.selectedState = null;
        this.selectedTransition = null;
        this.isConnecting = false;
        this.connectionFrom = null;
        
        // 拖拽状态
        this.dragState = {
            isDragging: false,
            dragElement: null,
            startPos: { x: 0, y: 0 },
            offset: { x: 0, y: 0 }
        };
        
        // 模拟状态
        this.simulation = {
            isRunning: false,
            currentState: null,
            history: []
        };
        
        // 绑定的事件处理器
        this.boundHandlers = new Map();
    }

    /**
     * 初始化编辑器
     */
    init() {
        try {
            this.log('正在初始化标准状态机编辑器...');
            
            this.setupEventListeners();
            this.setupCanvasDragEvents();
            this.setupUI();
            this.createSampleStates();
            this.updateUI();
            
            // 显示使用提示
            setTimeout(() => {
                if (this.states.size === 0) {
                    UIComponents.createNotification(MESSAGES.TIPS.RIGHT_CLICK_CREATE, 'info', 5000);
                }
            }, 1000);
            
            // 启用调试模式以便查看坐标计算日志
            this.toggleDebugMode(true);
            
            this.log('标准状态机编辑器初始化完成');
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
        this.addEventListener(this.getElement(DOM_IDS.ADD_STATE_BTN), EVENTS.CLICK, this.addState);
        this.addEventListener(this.getElement(DOM_IDS.ADD_TRANSITION_BTN), EVENTS.CLICK, this.toggleConnectionMode);
        this.addEventListener(this.getElement(DOM_IDS.SIMULATE_BTN), EVENTS.CLICK, this.toggleSimulation);
        this.addEventListener(this.getElement(DOM_IDS.RESET_BTN), EVENTS.CLICK, this.reset);
        
        // 画布控制按钮
        this.addEventListener(this.getElement(DOM_IDS.ZOOM_IN_BTN), EVENTS.CLICK, this.zoomIn);
        this.addEventListener(this.getElement(DOM_IDS.ZOOM_OUT_BTN), EVENTS.CLICK, this.zoomOut);
        this.addEventListener(this.getElement(DOM_IDS.FIT_TO_SCREEN_BTN), EVENTS.CLICK, this.fitToScreen);
        
        // 导航按钮
        this.addEventListener(this.getElement(DOM_IDS.UNDO_BTN), EVENTS.CLICK, this.undo);
        this.addEventListener(this.getElement(DOM_IDS.REDO_BTN), EVENTS.CLICK, this.redo);
        this.addEventListener(this.getElement(DOM_IDS.IMPORT_BTN), EVENTS.CLICK, () => this.importFromJSON(this.loadFromJSON.bind(this)));
        this.addEventListener(this.getElement(DOM_IDS.EXPORT_BTN), EVENTS.CLICK, () => this.exportToJSON(this.toJSON()));
        
        // 模拟控制
        this.addEventListener(this.getElement(DOM_IDS.TRIGGER_EVENT_BTN), EVENTS.CLICK, this.triggerEvent);
        
        // 画布事件
        this.addEventListener(this.canvas, EVENTS.CLICK, this.onCanvasClick);
        this.addEventListener(this.canvas, EVENTS.DOUBLE_CLICK, this.onCanvasDoubleClick);
        this.addEventListener(this.canvas, EVENTS.CONTEXT_MENU, this.onCanvasContextMenu);
        
        // 模态框
        this.addEventListener(this.getElement(DOM_IDS.CLOSE_MODAL), EVENTS.CLICK, this.hideModal);
        
        // 键盘事件
        this.addEventListener(document, EVENTS.KEY_DOWN, this.onKeyDown);
    }

    /**
     * 设置UI
     */
    setupUI() {
        // 设置画布光标
        this.setCanvasCursor('grab');
        
        // 初始化SVG定义
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
     * 添加状态
     */
    addState(x = null, y = null) {
        const rect = this.canvas.getBoundingClientRect();
        const stateX = x !== null ? x : rect.width / 2 - DEFAULT_CONFIG.NODE.DEFAULT_WIDTH / 2;
        const stateY = y !== null ? y : rect.height / 2 - DEFAULT_CONFIG.NODE.DEFAULT_HEIGHT / 2;
        
        const stateId = this.generateId('state');
        const state = {
            id: stateId,
            name: `状态${this.stateIdCounter++}`,
            x: stateX,
            y: stateY,
            width: DEFAULT_CONFIG.NODE.DEFAULT_WIDTH,
            height: DEFAULT_CONFIG.NODE.DEFAULT_HEIGHT,
            color: this.getRandomColor(),
            isInitial: this.states.size === 0,
            isFinal: false
        };
        
        this.states.set(stateId, state);
        this.createStateElement(state);
        this.addToHistory('addState', state);
        this.updateUI();
        
        this.log(`添加状态: ${state.name} (${stateId})`);
        UIComponents.createNotification(MESSAGES.SUCCESS.STATE_CREATED, 'success');
        
        return state;
    }

    /**
     * 创建状态DOM元素
     */
    createStateElement(state) {
        const element = document.createElement('div');
        element.id = `state-${state.id}`;
        element.className = CSS_CLASSES.STATE_NODE;
        element.setAttribute('data-state-id', state.id);
        
        element.style.cssText = `
            position: absolute;
            left: ${state.x}px;
            top: ${state.y}px;
            width: ${state.width}px;
            height: ${state.height}px;
            background-color: ${state.color};
            border: ${DEFAULT_CONFIG.NODE.BORDER_WIDTH}px solid rgba(255, 255, 255, 0.3);
            border-radius: ${DEFAULT_CONFIG.NODE.BORDER_RADIUS}px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: move;
            user-select: none;
            font-weight: 600;
            color: ${this.getTextColorForBackground(state.color)};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
        `;
        
        // 创建状态内容
        const content = document.createElement('div');
        content.className = 'text-center';
        
        const nameElement = document.createElement('div');
        nameElement.textContent = state.name;
        nameElement.style.fontSize = '14px';
        nameElement.style.fontWeight = '600';
        content.appendChild(nameElement);
        
        // 添加状态指示器
        if (state.isInitial || state.isFinal) {
            const indicator = document.createElement('div');
            indicator.style.fontSize = '10px';
            indicator.style.marginTop = '2px';
            indicator.style.opacity = '0.8';
            
            let indicatorText = '';
            if (state.isInitial) indicatorText += '▶ ';
            if (state.isFinal) indicatorText += '⏹';
            indicator.textContent = indicatorText;
            content.appendChild(indicator);
        }
        
        element.appendChild(content);
        
        // 添加事件监听器
        this.setupStateEvents(element, state);
        
        // 添加到容器
        const container = this.getElement(DOM_IDS.STATES_CONTAINER);
        if (container) {
            container.appendChild(element);
        }
        
        return element;
    }

    /**
     * 设置状态事件
     */
    setupStateEvents(element, state) {
        // 点击事件
        element.addEventListener(EVENTS.CLICK, (e) => {
            e.stopPropagation();
            
            if (this.isConnecting) {
                this.handleConnectionClick(state);
            } else {
                this.selectState(state);
            }
        });
        
        // 右键菜单
        element.addEventListener(EVENTS.CONTEXT_MENU, (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showStateContextMenu(e, state);
        });
        
        // 拖拽事件
        this.setupStateDrag(element, state);
    }

    /**
     * 设置状态拖拽
     */
    setupStateDrag(element, state) {
        element.addEventListener(EVENTS.MOUSE_DOWN, (e) => {
            if (e.button !== 0) return; // 只处理左键
            
            this.dragState.isDragging = true;
            this.dragState.dragElement = element;
            this.dragState.startPos = { x: e.clientX, y: e.clientY };
            this.dragState.offset = {
                x: e.clientX - state.x,
                y: e.clientY - state.y
            };
            
            element.style.cursor = 'grabbing';
            element.style.zIndex = '10';
            
            e.preventDefault();
        });
    }

    /**
     * 画布鼠标移动事件
     */
    onCanvasMouseMove(e) {
        super.onCanvasMouseMove(e);
        
        if (this.dragState.isDragging && this.dragState.dragElement) {
            const stateId = this.dragState.dragElement.getAttribute('data-state-id');
            const state = this.states.get(stateId);
            
            if (state) {
                let newX = e.clientX - this.dragState.offset.x;
                let newY = e.clientY - this.dragState.offset.y;
                
                // 网格对齐
                if (this.config.snapToGrid) {
                    newX = Math.round(newX / DEFAULT_CONFIG.CANVAS.GRID_SIZE) * DEFAULT_CONFIG.CANVAS.GRID_SIZE;
                    newY = Math.round(newY / DEFAULT_CONFIG.CANVAS.GRID_SIZE) * DEFAULT_CONFIG.CANVAS.GRID_SIZE;
                }
                
                // 更新状态位置
                state.x = newX;
                state.y = newY;
                
                // 更新DOM元素位置
                this.dragState.dragElement.style.left = `${newX}px`;
                this.dragState.dragElement.style.top = `${newY}px`;
                
                // 更新相关转换
                this.updateStateTransitions(stateId);
            }
        }
    }

    /**
     * 全局鼠标抬起事件
     */
    onGlobalMouseUp(e) {
        super.onGlobalMouseUp(e);
        
        if (this.dragState.isDragging) {
            this.dragState.isDragging = false;
            
            if (this.dragState.dragElement) {
                this.dragState.dragElement.style.cursor = 'move';
                this.dragState.dragElement.style.zIndex = '1';
                this.dragState.dragElement = null;
            }
        }
    }

    /**
     * 更新状态的转换线条
     */
    updateStateTransitions(stateId) {
        for (const [transitionId, transition] of this.transitions) {
            if (transition.fromId === stateId || transition.toId === stateId) {
                this.updateTransitionLine(transition);
            }
        }
    }

    /**
     * 选择状态
     */
    selectState(state) {
        this.clearSelection();
        this.selectedState = state;
        
        const element = this.getElement(`state-${state.id}`);
        if (element) {
            element.style.boxShadow = `0 0 0 3px ${COLORS.SELECTION}`;
        }
        
        this.updatePropertiesPanel();
        this.log(`选择状态: ${state.name}`);
    }

    /**
     * 清除选择
     */
    clearSelection() {
        this.selectedState = null;
        this.selectedTransition = null;
        
        // 清除状态高亮
        this.states.forEach(state => {
            const element = this.getElement(`state-${state.id}`);
            if (element) {
                element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }
        });
        
        // 清除转换高亮
        this.transitions.forEach(transition => {
            const element = this.getElement(`transition-${transition.id}`);
            if (element) {
                element.style.stroke = COLORS.TRANSITION_TYPES.DEFAULT;
                element.style.strokeWidth = '2';
            }
        });
    }

    /**
     * 切换连接模式
     */
    toggleConnectionMode() {
        this.isConnecting = !this.isConnecting;
        
        const button = this.getElement(DOM_IDS.ADD_TRANSITION_BTN);
        if (button) {
            if (this.isConnecting) {
                button.style.backgroundColor = COLORS.CONNECTION_PREVIEW;
                button.style.color = '#000';
                this.setCanvasCursor('crosshair');
                UIComponents.createNotification('连接模式已启用，点击两个状态创建转换', 'info');
            } else {
                button.style.backgroundColor = '';
                button.style.color = '';
                this.setCanvasCursor('grab');
                this.connectionFrom = null;
            }
        }
        
        this.log(`连接模式: ${this.isConnecting ? '启用' : '禁用'}`);
    }

    /**
     * 处理连接点击
     */
    handleConnectionClick(state) {
        if (!this.connectionFrom) {
            this.connectionFrom = state;
            UIComponents.createNotification(`已选择起始状态: ${state.name}，请选择目标状态`, 'info');
        } else if (this.connectionFrom.id !== state.id) {
            this.createTransition(this.connectionFrom.id, state.id);
            this.connectionFrom = null;
            this.toggleConnectionMode(); // 退出连接模式
        } else {
            UIComponents.createNotification('不能连接到自己，请选择其他状态', 'warning');
        }
    }

    /**
     * 创建转换
     */
    createTransition(fromId, toId, event = 'event', condition = '') {
        const transitionId = this.generateId('transition');
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
        
        const fromState = this.states.get(fromId);
        const toState = this.states.get(toId);
        this.log(`创建转换: ${fromState?.name} → ${toState?.name} [${event}]`);
        UIComponents.createNotification(MESSAGES.SUCCESS.TRANSITION_CREATED, 'success');
        
        return transition;
    }

    /**
     * 创建转换线条
     */
    createTransitionLine(transition) {
        const fromState = this.states.get(transition.fromId);
        const toState = this.states.get(transition.toId);
        
        if (!fromState || !toState) return;
        
        // 计算连接点
        const startPoint = this.getConnectionPoint(fromState, toState);
        const endPoint = this.getConnectionPoint(toState, fromState);
        
        // 创建SVG组
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `transition-${transition.id}`;
        g.setAttribute('data-transition-id', transition.id);
        
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
        
        g.addEventListener(EVENTS.CONTEXT_MENU, (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showTransitionContextMenu(e, transition);
        });
        
        this.svgCanvas.appendChild(g);
        this.updateTransitionLine(transition);
        
        return g;
    }

    /**
     * 更新转换线条
     */
    updateTransitionLine(transition) {
        const element = this.getElement(`transition-${transition.id}`);
        if (!element) return;
        
        const fromState = this.states.get(transition.fromId);
        const toState = this.states.get(transition.toId);
        if (!fromState || !toState) return;
        
        const startPoint = this.getConnectionPoint(fromState, toState);
        const endPoint = this.getConnectionPoint(toState, fromState);
        
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
    getConnectionPoint(fromState, toState) {
        const fromCenterX = fromState.x + fromState.width / 2;
        const fromCenterY = fromState.y + fromState.height / 2;
        const toCenterX = toState.x + toState.width / 2;
        const toCenterY = toState.y + toState.height / 2;
        
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        
        const angle = Math.atan2(dy, dx);
        const radius = Math.min(fromState.width, fromState.height) / 2;
        
        return {
            x: fromCenterX + Math.cos(angle) * radius,
            y: fromCenterY + Math.sin(angle) * radius
        };
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
     * 更新画布变换
     */
    updateCanvasTransform() {
        const container = this.getElement(DOM_IDS.STATES_CONTAINER);
        if (container) {
            const transform = `scale(${this.canvasState.zoom}) translate(${this.canvasState.panX}px, ${this.canvasState.panY}px)`;
            container.style.transform = transform;
            this.svgCanvas.style.transform = transform;
        }
    }

    /**
     * 适应屏幕
     */
    fitToScreen() {
        if (this.states.size === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.states.forEach(state => {
            minX = Math.min(minX, state.x);
            minY = Math.min(minY, state.y);
            maxX = Math.max(maxX, state.x + state.width);
            maxY = Math.max(maxY, state.y + state.height);
        });
        
        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / contentWidth;
        const scaleY = canvasRect.height / contentHeight;
        
        this.canvasState.zoom = Math.min(scaleX, scaleY, 1);
        this.canvasState.panX = (canvasRect.width - contentWidth * this.canvasState.zoom) / 2 - (minX - padding) * this.canvasState.zoom;
        this.canvasState.panY = (canvasRect.height - contentHeight * this.canvasState.zoom) / 2 - (minY - padding) * this.canvasState.zoom;
        
        this.updateCanvasTransform();
    }

    /**
     * 渲染整个状态机
     */
    render() {
        // 清理现有元素
        const container = this.getElement(DOM_IDS.STATES_CONTAINER);
        if (container) {
            container.innerHTML = '';
        }
        this.svgCanvas.innerHTML = '';
        this.initializeSVGDefinitions();
        
        // 重新创建所有状态元素
        this.states.forEach(state => {
            this.createStateElement(state);
        });
        
        // 重新创建所有转换线条
        this.transitions.forEach(transition => {
            this.createTransitionLine(transition);
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
        
        this.states.forEach(state => {
            const item = UIComponents.createListItem(
                state.name,
                () => this.selectState(state),
                state.isInitial ? ICONS.PLAY : (state.isFinal ? ICONS.STOP : null),
                'text-white'
            );
            item.style.backgroundColor = state.color;
            item.style.color = this.getTextColorForBackground(state.color);
            list.appendChild(item);
        });
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        const statesCount = this.getElement(DOM_IDS.STATES_COUNT);
        const transitionsCount = this.getElement(DOM_IDS.TRANSITIONS_COUNT);
        
        if (statesCount) statesCount.textContent = this.states.size;
        if (transitionsCount) transitionsCount.textContent = this.transitions.size;
    }

    /**
     * 更新属性面板
     */
    updatePropertiesPanel() {
        const panel = this.getElement(DOM_IDS.SELECTED_ELEMENT_INFO);
        if (!panel) return;
        
        if (this.selectedState) {
            panel.innerHTML = `
                <div class="space-y-2">
                    <div><strong>状态名称:</strong> ${this.selectedState.name}</div>
                    <div><strong>位置:</strong> (${Math.round(this.selectedState.x)}, ${Math.round(this.selectedState.y)})</div>
                    <div><strong>颜色:</strong> <span style="color: ${this.selectedState.color}">●</span> ${this.selectedState.color}</div>
                    <div><strong>初始状态:</strong> ${this.selectedState.isInitial ? '是' : '否'}</div>
                    <div><strong>终止状态:</strong> ${this.selectedState.isFinal ? '是' : '否'}</div>
                </div>
            `;
        } else if (this.selectedTransition) {
            const fromState = this.states.get(this.selectedTransition.fromId);
            const toState = this.states.get(this.selectedTransition.toId);
            panel.innerHTML = `
                <div class="space-y-2">
                    <div><strong>转换:</strong> ${fromState?.name} → ${toState?.name}</div>
                    <div><strong>事件:</strong> ${this.selectedTransition.event}</div>
                    <div><strong>条件:</strong> ${this.selectedTransition.condition || '无'}</div>
                </div>
            `;
        } else {
            panel.innerHTML = '点击状态或转换查看属性';
        }
    }

    /**
     * 创建示例状态
     */
    createSampleStates() {
        const template = TEMPLATES.SIMPLE;
        
        template.states.forEach(stateData => {
            const state = this.addState(stateData.x, stateData.y);
            state.name = stateData.name;
            state.isInitial = stateData.isInitial || false;
            state.isFinal = stateData.isFinal || false;
        });
        
        // 添加转换
        template.transitions.forEach(transData => {
            const fromState = Array.from(this.states.values()).find(s => s.name === transData.from);
            const toState = Array.from(this.states.values()).find(s => s.name === transData.to);
            
            if (fromState && toState) {
                this.createTransition(fromState.id, toState.id, transData.event);
            }
        });
        
        this.render();
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            states: Array.from(this.states.values()),
            transitions: Array.from(this.transitions.values()),
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0',
                type: 'finite-state-machine'
            }
        };
    }

    /**
     * 从JSON加载
     */
    loadFromJSON(data) {
        this.clear();
        
        if (data.states) {
            data.states.forEach(stateData => {
                this.states.set(stateData.id, stateData);
            });
        }
        
        if (data.transitions) {
            data.transitions.forEach(transData => {
                this.transitions.set(transData.id, transData);
            });
        }
        
        this.render();
        UIComponents.createNotification(MESSAGES.SUCCESS.FILE_IMPORTED, 'success');
    }

    /**
     * 清空编辑器
     */
    clear() {
        this.states.clear();
        this.transitions.clear();
        this.clearSelection();
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
                this.createSampleStates();
                this.addToHistory('reset');
            }
        );
    }

    /**
     * 画布点击事件
     */
    onCanvasClick(e) {
        if (this.isCanvasBackground(e.target)) {
            this.clearSelection();
            
            if (this.isConnecting) {
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
            const panX = this.canvasState.panX || 0;
            const panY = this.canvasState.panY || 0;
            const zoom = this.canvasState.zoom || 1;
            const x = (e.clientX - rect.left - panX) / zoom;
            const y = (e.clientY - rect.top - panY) / zoom;
            
            this.addState(x, y);
        }
    }

    /**
     * 画布右键菜单
     */
    onCanvasContextMenu(e) {
        e.preventDefault();
        
        if (this.isCanvasBackground(e.target)) {
            const items = [
                this.createContextMenuItem(ICONS.ADD, '在此处创建状态', () => {
                    const rect = this.canvas.getBoundingClientRect();
                    // 考虑画布的缩放和平移
                    const panX = this.canvasState.panX || 0;
                    const panY = this.canvasState.panY || 0;
                    const zoom = this.canvasState.zoom || 1;
                    const x = (e.clientX - rect.left - panX) / zoom;
                    const y = (e.clientY - rect.top - panY) / zoom;
                    
                    this.log(`右键创建状态 - 鼠标位置: (${e.clientX}, ${e.clientY}), 画布偏移: (${panX}, ${panY}), 缩放: ${zoom}, 计算坐标: (${x}, ${y})`);
                    this.addState(x, y);
                }),
                this.createContextMenuItem('fas fa-magic', '创建示例状态机', () => {
                    this.createSampleStates();
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
                if (this.selectedState) {
                    this.deleteState(this.selectedState);
                } else if (this.selectedTransition) {
                    this.deleteTransition(this.selectedTransition);
                }
                break;
                
            case KEYS.ESCAPE:
                this.clearSelection();
                if (this.isConnecting) {
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
        }
    }

    /**
     * 切换模拟模式
     */
    toggleSimulation() {
        this.simulation.isRunning = !this.simulation.isRunning;
        
        const button = this.getElement(DOM_IDS.SIMULATE_BTN);
        const currentStateElement = this.getElement(DOM_IDS.CURRENT_STATE);
        
        if (this.simulation.isRunning) {
            // 开始模拟
            const initialState = Array.from(this.states.values()).find(s => s.isInitial);
            if (initialState) {
                this.simulation.currentState = initialState;
                this.simulation.history = [initialState.name];
                
                if (currentStateElement) {
                    currentStateElement.textContent = initialState.name;
                    currentStateElement.style.backgroundColor = initialState.color;
                    currentStateElement.style.color = this.getTextColorForBackground(initialState.color);
                }
                
                this.highlightCurrentState(initialState);
                
                if (button) {
                    button.innerHTML = '<i class="fas fa-stop text-lg mb-1"></i><div class="text-xs font-medium">停止模拟</div>';
                    button.style.backgroundColor = COLORS.ERROR;
                }
                
                UIComponents.createNotification('模拟已开始', 'success');
            } else {
                UIComponents.createNotification('没有找到初始状态', 'error');
                this.simulation.isRunning = false;
            }
        } else {
            // 停止模拟
            this.simulation.currentState = null;
            this.simulation.history = [];
            
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
            
            UIComponents.createNotification('模拟已停止', 'info');
        }
    }

    /**
     * 触发事件
     */
    triggerEvent() {
        if (!this.simulation.isRunning || !this.simulation.currentState) {
            UIComponents.createNotification('请先开始模拟', 'warning');
            return;
        }
        
        const eventInput = this.getElement(DOM_IDS.EVENT_INPUT);
        if (!eventInput || !eventInput.value.trim()) {
            UIComponents.createNotification('请输入事件名称', 'warning');
            return;
        }
        
        const eventName = eventInput.value.trim();
        
        // 查找匹配的转换
        const validTransitions = Array.from(this.transitions.values()).filter(t => 
            t.fromId === this.simulation.currentState.id && t.event === eventName
        );
        
        if (validTransitions.length === 0) {
            UIComponents.createNotification(`当前状态没有响应事件 "${eventName}" 的转换`, 'warning');
            return;
        }
        
        // 选择第一个匹配的转换
        const transition = validTransitions[0];
        const nextState = this.states.get(transition.toId);
        
        if (nextState) {
            this.simulation.currentState = nextState;
            this.simulation.history.push(nextState.name);
            
            const currentStateElement = this.getElement(DOM_IDS.CURRENT_STATE);
            if (currentStateElement) {
                currentStateElement.textContent = nextState.name;
                currentStateElement.style.backgroundColor = nextState.color;
                currentStateElement.style.color = this.getTextColorForBackground(nextState.color);
            }
            
            this.highlightCurrentState(nextState);
            this.updateHistoryList();
            
            // 清空输入框
            eventInput.value = '';
            
            UIComponents.createNotification(`状态转换: ${eventName} → ${nextState.name}`, 'success');
        }
    }

    /**
     * 高亮当前状态
     */
    highlightCurrentState(state) {
        // 清除之前的高亮
        this.clearSimulationHighlight();
        
        const element = this.getElement(`state-${state.id}`);
        if (element) {
            element.style.boxShadow = `0 0 20px ${COLORS.SUCCESS}`;
            element.style.animation = 'pulse 2s infinite';
        }
    }

    /**
     * 清除模拟高亮
     */
    clearSimulationHighlight() {
        this.states.forEach(state => {
            const element = this.getElement(`state-${state.id}`);
            if (element) {
                element.style.animation = '';
                if (state !== this.selectedState) {
                    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }
            }
        });
    }

    /**
     * 更新历史记录列表
     */
    updateHistoryList() {
        const historyList = this.getElement(DOM_IDS.HISTORY_LIST);
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.simulation.history.forEach((stateName, index) => {
            const item = document.createElement('div');
            item.className = 'p-2 rounded text-sm bg-gray-700 text-white';
            item.innerHTML = `<span class="text-gray-400">${index + 1}.</span> ${stateName}`;
            historyList.appendChild(item);
        });
        
        // 滚动到底部
        historyList.scrollTop = historyList.scrollHeight;
    }

    /**
     * 显示状态右键菜单
     */
    showStateContextMenu(e, state) {
        e.preventDefault();
        e.stopPropagation();
        
        const items = [
            this.createContextMenuItem(ICONS.EDIT, '编辑状态', () => {
                this.editState(state);
            }),
            this.createContextMenuItem(ICONS.DELETE, '删除状态', () => {
                this.deleteState(state);
            }, 'text-red-500'),
            this.createContextMenuItem(ICONS.ARROW_RIGHT, '设为初始状态', () => {
                this.setInitialState(state);
            }),
            this.createContextMenuItem(ICONS.STOP, '设为终止状态', () => {
                this.toggleFinalState(state);
            })
        ];
        
        this.showContextMenuAt(e.clientX, e.clientY, items);
    }

    /**
     * 显示转换右键菜单
     */
    showTransitionContextMenu(e, transition) {
        e.preventDefault();
        e.stopPropagation();
        
        const items = [
            this.createContextMenuItem(ICONS.EDIT, '编辑转换', () => {
                this.editTransition(transition);
            }),
            this.createContextMenuItem(ICONS.DELETE, '删除转换', () => {
                this.deleteTransition(transition);
            }, 'text-red-500')
        ];
        
        this.showContextMenuAt(e.clientX, e.clientY, items);
    }

    /**
     * 选择转换
     */
    selectTransition(transition) {
        this.clearSelection();
        this.selectedTransition = transition;
        
        const element = this.getElement(`transition-${transition.id}`);
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
     * 编辑状态
     */
    editState(state) {
        const modalContent = `
            <form id="editStateForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1" style="color: var(--md-on-surface);">状态名称</label>
                    <input type="text" id="stateName" class="w-full px-3 py-2 rounded-lg text-sm" value="${state.name}" style="background: rgba(255, 255, 255, 0.9); color: #1a1a1a;">
                </div>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="isInitial" ${state.isInitial ? 'checked' : ''} class="mr-2">
                        <span class="text-sm" style="color: var(--md-on-surface);">初始状态</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="isFinal" ${state.isFinal ? 'checked' : ''} class="mr-2">
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
        
        const form = document.getElementById('editStateForm');
        const cancelBtn = document.getElementById('cancelEdit');
        
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('stateName');
            const initialCheckbox = document.getElementById('isInitial');
            const finalCheckbox = document.getElementById('isFinal');
            
            const oldName = state.name;
            state.name = nameInput.value.trim() || oldName;
            state.isInitial = initialCheckbox.checked;
            state.isFinal = finalCheckbox.checked;
            
            // 确保只有一个初始状态
            if (state.isInitial) {
                this.states.forEach(s => {
                    if (s.id !== state.id) s.isInitial = false;
                });
            }
            
            this.updateStateElement(state);
            this.addToHistory('editState', { id: state.id, oldName, newName: state.name });
            this.updateUI();
            this.hideModal();
            
            UIComponents.createNotification('状态已更新', 'success');
        });
    }

    /**
     * 编辑转换
     */
    editTransition(transition) {
        const modalContent = `
            <form id="editTransitionForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1" style="color: var(--md-on-surface);">事件名称</label>
                    <input type="text" id="eventName" class="w-full px-3 py-2 rounded-lg text-sm" value="${transition.event}" style="background: rgba(255, 255, 255, 0.9); color: #1a1a1a;">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1" style="color: var(--md-on-surface);">条件（可选）</label>
                    <input type="text" id="condition" class="w-full px-3 py-2 rounded-lg text-sm" value="${transition.condition || ''}" style="background: rgba(255, 255, 255, 0.9); color: #1a1a1a;">
                </div>
                <div class="flex justify-end space-x-2 mt-6">
                    <button type="button" id="cancelEdit" class="md-surface-variant px-4 py-2 rounded-lg transition-colors">取消</button>
                    <button type="submit" class="md-primary-btn px-4 py-2 rounded-lg transition-colors">确定</button>
                </div>
            </form>
        `;
        
        this.showModal('编辑转换', modalContent);
        
        const form = document.getElementById('editTransitionForm');
        const cancelBtn = document.getElementById('cancelEdit');
        
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const eventInput = document.getElementById('eventName');
            const conditionInput = document.getElementById('condition');
            
            transition.event = eventInput.value.trim() || transition.event;
            transition.condition = conditionInput.value.trim();
            
            this.updateTransitionLine(transition);
            this.addToHistory('editTransition', transition);
            this.updateUI();
            this.hideModal();
            
            UIComponents.createNotification('转换已更新', 'success');
        });
    }

    /**
     * 删除状态
     */
    deleteState(state) {
        UIComponents.createConfirmDialog(
            MESSAGES.CONFIRM.DELETE_STATE.replace('{name}', state.name),
            () => {
                // 删除相关转换
                const relatedTransitions = Array.from(this.transitions.values())
                    .filter(t => t.fromId === state.id || t.toId === state.id);
                
                relatedTransitions.forEach(t => {
                    this.transitions.delete(t.id);
                    const element = this.getElement(`transition-${t.id}`);
                    if (element) element.remove();
                });
                
                // 删除状态
                this.states.delete(state.id);
                const element = this.getElement(`state-${state.id}`);
                if (element) element.remove();
                
                this.clearSelection();
                this.addToHistory('deleteState', { state, relatedTransitions });
                this.updateUI();
                
                UIComponents.createNotification('状态已删除', 'success');
            }
        );
    }

    /**
     * 删除转换
     */
    deleteTransition(transition) {
        UIComponents.createConfirmDialog(
            MESSAGES.CONFIRM.DELETE_TRANSITION,
            () => {
                this.transitions.delete(transition.id);
                const element = this.getElement(`transition-${transition.id}`);
                if (element) element.remove();
                
                this.clearSelection();
                this.addToHistory('deleteTransition', transition);
                this.updateUI();
                
                UIComponents.createNotification('转换已删除', 'success');
            }
        );
    }

    /**
     * 设置初始状态
     */
    setInitialState(state) {
        this.states.forEach(s => s.isInitial = false);
        state.isInitial = true;
        
        this.states.forEach(s => this.updateStateElement(s));
        this.addToHistory('setInitialState', state.id);
        this.updateUI();
        
        UIComponents.createNotification(`${state.name} 已设为初始状态`, 'success');
    }

    /**
     * 切换终止状态
     */
    toggleFinalState(state) {
        state.isFinal = !state.isFinal;
        this.updateStateElement(state);
        this.addToHistory('toggleFinalState', state.id);
        this.updateUI();
        
        UIComponents.createNotification(
            `${state.name} ${state.isFinal ? '已设为' : '已取消'}终止状态`, 
            'success'
        );
    }

    /**
     * 更新状态元素
     */
    updateStateElement(state) {
        const element = this.getElement(`state-${state.id}`);
        if (!element) return;
        
        const content = element.querySelector('div');
        const nameElement = content.querySelector('div');
        nameElement.textContent = state.name;
        
        // 更新指示器
        let indicator = content.querySelector('div:last-child');
        if (!indicator || indicator === nameElement) {
            indicator = document.createElement('div');
            indicator.style.fontSize = '10px';
            indicator.style.marginTop = '2px';
            indicator.style.opacity = '0.8';
            content.appendChild(indicator);
        }
        
        let indicatorText = '';
        if (state.isInitial) indicatorText += '▶ ';
        if (state.isFinal) indicatorText += '⏹';
        indicator.textContent = indicatorText;
    }

    /**
     * 从历史记录恢复状态
     */
    restoreFromHistory() {
        if (this.history.currentIndex >= 0 && this.history.currentIndex < this.history.entries.length) {
            const entry = this.history.entries[this.history.currentIndex];
            
            // 根据操作类型恢复状态
            switch (entry.action) {
                case 'addState':
                case 'deleteState':
                case 'addTransition':
                case 'deleteTransition':
                default:
                    // 重新渲染整个状态机
                    this.render();
                    break;
            }
        }
    }
} 