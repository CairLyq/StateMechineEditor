

/**
 * 基础编辑器类
 * 包含所有状态机编辑器的公共功能
 */

import { DOM_IDS, CSS_CLASSES, DEFAULT_CONFIG, COLORS, EVENTS, KEYS, MODES, MESSAGES, ICONS } from './Constants.js';

export class BaseEditor {
    constructor(canvasId, svgCanvasId) {
        // 核心DOM元素
        this.canvas = this.getElement(canvasId);
        this.svgCanvas = this.getElement(svgCanvasId);
        
        // 基础状态
        this.selectedElement = null;
        this.isSimulating = false;
        this.currentMode = MODES.SELECT;
        
        // 画布状态
        this.canvasState = {
            zoom: DEFAULT_CONFIG.CANVAS.ZOOM_MIN + 0.7, // 默认1.0
            panX: DEFAULT_CONFIG.CANVAS.PAN_INITIAL_X,
            panY: DEFAULT_CONFIG.CANVAS.PAN_INITIAL_Y,
            isDragging: false,
            dragStart: { x: 0, y: 0 }
        };
        
        // 历史记录
        this.history = {
            entries: [],
            currentIndex: -1,
            maxEntries: DEFAULT_CONFIG.HISTORY.MAX_ENTRIES
        };
        
        // 性能监控
        this.performance = {
            enabled: false,
            frameCount: 0,
            lastFrameTime: 0
        };
        
        // 配置
        this.config = this.createDefaultConfig();
        
        // 事件绑定映射
        this.boundEvents = new Map();
    }

    /**
     * 创建默认配置
     */
    createDefaultConfig() {
        return {
            ...DEFAULT_CONFIG,
            snapToGrid: true,
            showGrid: true,
            autoSave: true,
            debugMode: false
        };
    }

    /**
     * 安全获取DOM元素
     */
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
            return null;
        }
        return element;
    }

    /**
     * 安全获取元素集合
     */
    getElements(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * 添加事件监听器（带自动清理）
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;
        
        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);
        
        // 存储绑定信息用于清理
        const key = `${element.id || 'unknown'}-${event}`;
        if (!this.boundEvents.has(key)) {
            this.boundEvents.set(key, []);
        }
        this.boundEvents.get(key).push({ element, event, handler: boundHandler, options });
    }

    /**
     * 移除所有事件监听器
     */
    removeAllEventListeners() {
        for (const [key, bindings] of this.boundEvents) {
            for (const { element, event, handler, options } of bindings) {
                element.removeEventListener(event, handler, options);
            }
        }
        this.boundEvents.clear();
    }

    /**
     * 设置画布拖动事件
     */
    setupCanvasDragEvents() {
        this.addEventListener(this.canvas, EVENTS.MOUSE_DOWN, this.onCanvasMouseDown);
        this.addEventListener(this.canvas, EVENTS.MOUSE_MOVE, this.onCanvasMouseMove);
        this.addEventListener(this.canvas, EVENTS.MOUSE_UP, this.onCanvasMouseUp);
        this.addEventListener(this.canvas, EVENTS.MOUSE_LEAVE, this.onCanvasMouseLeave);
        this.addEventListener(this.canvas, EVENTS.WHEEL, this.onCanvasWheel);
        
        // 全局事件用于处理拖动
        this.addEventListener(document, EVENTS.MOUSE_MOVE, this.onGlobalMouseMove);
        this.addEventListener(document, EVENTS.MOUSE_UP, this.onGlobalMouseUp);
    }

    /**
     * 画布鼠标按下事件
     */
    onCanvasMouseDown(e) {
        if (this.isCanvasBackground(e.target) && e.button === 0) {
            this.canvasState.isDragging = true;
            this.canvasState.dragStart = {
                x: e.clientX - this.canvasState.panX,
                y: e.clientY - this.canvasState.panY
            };
            
            this.setCanvasCursor('grabbing');
            e.preventDefault();
        }
    }

    /**
     * 画布鼠标移动事件
     */
    onCanvasMouseMove(e) {
        // 子类实现具体逻辑
    }

    /**
     * 画布鼠标抬起事件
     */
    onCanvasMouseUp(e) {
        if (this.canvasState.isDragging) {
            this.canvasState.isDragging = false;
            this.setCanvasCursor('grab');
        }
    }

    /**
     * 画布鼠标离开事件
     */
    onCanvasMouseLeave(e) {
        if (this.canvasState.isDragging) {
            this.canvasState.isDragging = false;
            this.setCanvasCursor('grab');
        }
    }

    /**
     * 全局鼠标移动事件
     */
    onGlobalMouseMove(e) {
        if (this.canvasState.isDragging) {
            this.canvasState.panX = e.clientX - this.canvasState.dragStart.x;
            this.canvasState.panY = e.clientY - this.canvasState.dragStart.y;
            this.updateCanvasTransform();
        }
    }

    /**
     * 全局鼠标抬起事件
     */
    onGlobalMouseUp(e) {
        if (this.canvasState.isDragging) {
            this.canvasState.isDragging = false;
            this.setCanvasCursor('grab');
        }
    }

    /**
     * 画布滚轮事件
     */
    onCanvasWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.canvasState.zoom = Math.max(
            DEFAULT_CONFIG.CANVAS.ZOOM_MIN,
            Math.min(DEFAULT_CONFIG.CANVAS.ZOOM_MAX, this.canvasState.zoom * delta)
        );
        this.updateCanvasTransform();
    }

    /**
     * 检查是否为画布背景
     */
    isCanvasBackground(target) {
        // 子类可以重写此方法
        return target === this.canvas || target === this.svgCanvas;
    }

    /**
     * 设置画布光标
     */
    setCanvasCursor(cursor) {
        if (this.canvas) {
            this.canvas.style.cursor = cursor;
        }
    }

    /**
     * 更新画布变换
     */
    updateCanvasTransform() {
        // 子类实现具体的变换逻辑
    }

    /**
     * 缩放功能
     */
    zoomIn() {
        this.canvasState.zoom = Math.min(
            DEFAULT_CONFIG.CANVAS.ZOOM_MAX,
            this.canvasState.zoom + DEFAULT_CONFIG.CANVAS.ZOOM_STEP
        );
        this.updateCanvasTransform();
    }

    zoomOut() {
        this.canvasState.zoom = Math.max(
            DEFAULT_CONFIG.CANVAS.ZOOM_MIN,
            this.canvasState.zoom - DEFAULT_CONFIG.CANVAS.ZOOM_STEP
        );
        this.updateCanvasTransform();
    }

    /**
     * 适应屏幕
     */
    fitToScreen() {
        // 子类实现具体逻辑
    }

    /**
     * 历史记录管理
     */
    addToHistory(action, data = null) {
        // 移除当前位置之后的所有历史记录
        this.history.entries = this.history.entries.slice(0, this.history.currentIndex + 1);
        
        // 添加新的历史记录
        this.history.entries.push({
            action,
            data: data ? JSON.parse(JSON.stringify(data)) : null,
            timestamp: Date.now()
        });
        
        // 限制历史记录数量
        if (this.history.entries.length > this.history.maxEntries) {
            this.history.entries.shift();
        } else {
            this.history.currentIndex++;
        }
        
        this.updateHistoryUI();
    }

    /**
     * 撤销操作
     */
    undo() {
        if (this.history.currentIndex >= 0) {
            this.history.currentIndex--;
            this.restoreFromHistory();
            this.updateHistoryUI();
        }
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.history.currentIndex < this.history.entries.length - 1) {
            this.history.currentIndex++;
            this.restoreFromHistory();
            this.updateHistoryUI();
        }
    }

    /**
     * 从历史记录恢复状态
     */
    restoreFromHistory() {
        // 子类实现具体逻辑
    }

    /**
     * 更新历史记录UI
     */
    updateHistoryUI() {
        const undoBtn = this.getElement(DOM_IDS.UNDO_BTN);
        const redoBtn = this.getElement(DOM_IDS.REDO_BTN);
        
        if (undoBtn) {
            undoBtn.disabled = this.history.currentIndex < 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.history.currentIndex >= this.history.entries.length - 1;
        }
    }

    /**
     * 模态框管理
     */
    showModal(title, content) {
        const modal = this.getElement(DOM_IDS.MODAL);
        const modalTitle = this.getElement(DOM_IDS.MODAL_TITLE);
        const modalContent = this.getElement(DOM_IDS.MODAL_CONTENT);
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    hideModal() {
        const modal = this.getElement(DOM_IDS.MODAL);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    /**
     * 右键菜单管理
     */
    hideContextMenu() {
        const menu = this.getElement(DOM_IDS.CONTEXT_MENU);
        if (menu) {
            menu.remove();
        }
    }

    /**
     * 创建右键菜单项
     */
    createContextMenuItem(icon, text, onClick, className = '') {
        const item = document.createElement('div');
        
        // 处理分隔符
        if (icon === 'fas fa-separator') {
            item.className = `${className}`;
            item.style.height = '1px';
            item.style.margin = '4px 0';
            return item;
        }
        
        // 普通菜单项
        item.className = `${CSS_CLASSES.CONTEXT_MENU_ITEM} px-4 py-2 cursor-pointer text-sm transition-colors ${className}`;
        
        // 根据是否有文本决定内容
        if (text) {
            item.innerHTML = `<i class="${icon} mr-2"></i>${text}`;
        } else {
            item.innerHTML = `<i class="${icon}"></i>`;
        }
        
        // 添加点击事件
        if (onClick && typeof onClick === 'function') {
            item.addEventListener(EVENTS.CLICK, (e) => {
                e.stopPropagation();
                onClick();
                this.hideContextMenu();
            });
        }
        
        return item;
    }

    /**
     * 显示右键菜单
     */
    showContextMenuAt(x, y, items) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.id = DOM_IDS.CONTEXT_MENU;
        menu.className = 'fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50';
        menu.style.minWidth = '150px';
        
        // 计算菜单位置，防止超出屏幕
        const menuWidth = 150;
        const menuHeight = items.length * 40;
        let left = x;
        let top = y;
        
        if (left + menuWidth > window.innerWidth) {
            left = x - menuWidth;
        }
        if (top + menuHeight > window.innerHeight) {
            top = y - menuHeight;
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        
        // 添加菜单项
        items.forEach(item => menu.appendChild(item));
        
        document.body.appendChild(menu);
        
        // 点击其他地方隐藏菜单
        setTimeout(() => {
            this.addEventListener(document, EVENTS.CLICK, this.hideContextMenu, { once: true });
        }, 10);
    }

    /**
     * 文件操作
     */
    exportToJSON(data, filename = 'state-machine.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSON(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        callback(data);
                    } catch (error) {
                        console.error(MESSAGES.ERROR.INVALID_FILE_FORMAT, error);
                        alert(MESSAGES.ERROR.INVALID_FILE_FORMAT);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * 工具方法
     */
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getRandomColor() {
        return COLORS.NODE_COLORS[Math.floor(Math.random() * COLORS.NODE_COLORS.length)];
    }

    calculateTextWidth(text, fontSize = 14) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px Inter, sans-serif`;
        return context.measureText(text).width;
    }

    /**
     * 性能监控
     */
    startPerformanceMonitoring() {
        this.performance.enabled = true;
        this.performance.frameCount = 0;
        this.performance.lastFrameTime = performance.now();
    }

    stopPerformanceMonitoring() {
        this.performance.enabled = false;
        const duration = performance.now() - this.performance.lastFrameTime;
        const fps = this.performance.frameCount / (duration / 1000);
        console.log(`性能统计: ${this.performance.frameCount} 帧, ${fps.toFixed(1)} FPS`);
    }

    recordFrame() {
        if (this.performance.enabled) {
            this.performance.frameCount++;
        }
    }

    /**
     * 调试功能
     */
    toggleDebugMode(enabled) {
        this.config.debugMode = enabled;
        console.log(`调试模式${enabled ? '已启用' : '已禁用'}`);
    }

    log(message, level = 'info') {
        if (this.config.debugMode) {
            console[level](`[${this.constructor.name}] ${message}`);
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        this.removeAllEventListeners();
        this.hideModal();
        this.hideContextMenu();
        
        // 清理画布内容
        if (this.canvas) {
            this.canvas.innerHTML = '';
        }
        if (this.svgCanvas) {
            this.svgCanvas.innerHTML = '';
        }
    }

    /**
     * 抽象方法 - 子类必须实现
     */
    init() {
        throw new Error('子类必须实现 init 方法');
    }

    render() {
        throw new Error('子类必须实现 render 方法');
    }

    clear() {
        throw new Error('子类必须实现 clear 方法');
    }

    toJSON() {
        throw new Error('子类必须实现 toJSON 方法');
    }

    loadFromJSON(data) {
        throw new Error('子类必须实现 loadFromJSON 方法');
    }
} 