/**
 * 状态机编辑器常量配置
 * 集中管理所有硬编码的值，提高代码可维护性
 */

// DOM 元素 ID 常量
export const DOM_IDS = {
    // 画布相关
    CANVAS: 'canvas',
    SVG_CANVAS: 'svgCanvas',
    STATES_CONTAINER: 'statesContainer',
    HIERARCHICAL_CANVAS: 'hierarchicalCanvas',
    HIERARCHICAL_SVG_CANVAS: 'hierarchicalSvgCanvas',
    HIERARCHICAL_STATES_CONTAINER: 'hierarchicalStatesContainer',
    
    // 按钮
    ADD_STATE_BTN: 'addStateBtn',
    ADD_TRANSITION_BTN: 'addTransitionBtn',
    ADD_CHILD_STATE_BTN: 'addChildStateBtn',
    TOGGLE_MODE_BTN: 'toggleModeBtn',
    SIMULATE_BTN: 'simulateBtn',
    RESET_BTN: 'resetBtn',
    ZOOM_IN_BTN: 'zoomInBtn',
    ZOOM_OUT_BTN: 'zoomOutBtn',
    FIT_TO_SCREEN_BTN: 'fitToScreenBtn',
    UNDO_BTN: 'undoBtn',
    REDO_BTN: 'redoBtn',
    IMPORT_BTN: 'importBtn',
    EXPORT_BTN: 'exportBtn',
    TRIGGER_EVENT_BTN: 'triggerEventBtn',
    CLOSE_MODAL: 'closeModal',
    
    // 面板和列表
    STATES_LIST: 'statesList',
    PROPERTIES_PANEL: 'propertiesPanel',
    SELECTED_ELEMENT_INFO: 'selectedElementInfo',
    SIMULATION_PANEL: 'simulationPanel',
    CURRENT_STATE: 'currentState',
    EVENT_INPUT: 'eventInput',
    HISTORY_LIST: 'historyList',
    STATES_COUNT: 'statesCount',
    TRANSITIONS_COUNT: 'transitionsCount',
    
    // 模态框
    MODAL: 'modal',
    MODAL_TITLE: 'modalTitle',
    MODAL_CONTENT: 'modalContent',
    
    // 右键菜单
    CONTEXT_MENU: 'contextMenu',
    HIERARCHICAL_CONTEXT_MENU: 'hierarchicalContextMenu',
    
    // 预览线
    PREVIEW_LINE: 'previewLine',
    HIERARCHICAL_PREVIEW_LINE: 'hierarchicalPreviewLine',
    
    // 连接提示
    CONNECTION_HINT: 'connectionHint',
    HIERARCHICAL_CONNECTION_HINT: 'hierarchicalConnectionHint'
};

// CSS 类名常量
export const CSS_CLASSES = {
    // 状态节点
    STATE_NODE: 'state-node',
    HIERARCHICAL_STATE_NODE: 'hierarchical-state-node',
    NODE_CONTENT: 'node-content',
    NODE_NAME: 'node-name',
    TYPE_INDICATOR: 'type-indicator',
    LEVEL_INDICATOR: 'level-indicator',
    EXPANDER_BUTTON: 'expander-button',
    
    // 转换
    TRANSITION_LINE: 'transition-line',
    TRANSITION_STROKE: 'transition-stroke',
    TRANSITION_CLICK_AREA: 'transition-click-area',
    TRANSITION_LABEL_BG: 'transition-label-bg',
    HIERARCHICAL_TRANSITION: 'hierarchical-transition',
    
    // 样式类
    COMPOSITE_STATE: 'composite-state',
    LEAF_STATE: 'leaf-state',
    PREVIEW_LINE: 'preview-line',
    CONTEXT_MENU_ITEM: 'context-menu-item',
    TOOL_BTN: 'tool-btn',
    
    // 层级样式
    LEVEL_0: 'level-0',
    LEVEL_1: 'level-1',
    LEVEL_2: 'level-2',
    LEVEL_3: 'level-3',
    
    // Material Design 样式
    MD_SURFACE: 'md-surface',
    MD_SURFACE_VARIANT: 'md-surface-variant',
    MD_PRIMARY_BTN: 'md-primary-btn',
    MD_SECONDARY_BTN: 'md-secondary-btn',
    
    // 布局
    CANVAS_GRID: 'canvas-grid',
    GLASS_EFFECT: 'glass-effect',
    FADE_IN: 'fade-in',
    MODE_TRANSITION: 'mode-transition'
};

// 默认配置常量
export const DEFAULT_CONFIG = {
    // 节点配置
    NODE: {
        DEFAULT_WIDTH: 120,
        DEFAULT_HEIGHT: 80,
        MIN_WIDTH: 80,
        MIN_HEIGHT: 60,
        BORDER_RADIUS: 8,
        BORDER_WIDTH: 2,
        PADDING: 8
    },
    
    // 画布配置
    CANVAS: {
        GRID_SIZE: 20,
        ZOOM_MIN: 0.3,
        ZOOM_MAX: 3.0,
        ZOOM_STEP: 0.1,
        PAN_INITIAL_X: 0,
        PAN_INITIAL_Y: 0
    },
    
    // 分层状态机配置
    HIERARCHICAL: {
        LEVEL_INDENT: 30,
        CHILDREN_SPACING: 20,
        EXPANDER_SIZE: 16,
        MAX_LEVELS: 5
    },
    
    // 性能配置
    PERFORMANCE: {
        DRAG_UPDATE_DELAY: 16, // 约60FPS
        TRANSITION_UPDATE_DEBOUNCE: 50,
        RENDER_THROTTLE: 16
    },
    
    // 动画配置
    ANIMATION: {
        TRANSITION_DURATION: 300,
        EASE_FUNCTION: 'cubic-bezier(0.4, 0, 0.2, 1)',
        PREVIEW_PULSE_DURATION: 1000
    },
    
    // 历史记录配置
    HISTORY: {
        MAX_ENTRIES: 50,
        AUTO_SAVE_INTERVAL: 30000 // 30秒
    }
};

// 颜色配置
export const COLORS = {
    // 节点默认颜色
    NODE_COLORS: [
        '#4caf50', // 绿色
        '#ff9800', // 橙色
        '#2196f3', // 蓝色
        '#f44336', // 红色
        '#9c27b0', // 紫色
        '#00bcd4', // 青色
        '#ffeb3b', // 黄色
        '#e91e63'  // 粉红色
    ],
    
    // 层级颜色
    LEVEL_COLORS: [
        '#4caf50', // Level 0 - 绿色
        '#2196f3', // Level 1 - 蓝色
        '#ff9800', // Level 2 - 橙色
        '#9c27b0', // Level 3 - 紫色
        '#f44336', // Level 4 - 红色
        '#00bcd4'  // Level 5 - 青色
    ],
    
    // 状态颜色
    SELECTION: '#ffc107',
    CONNECTION_PREVIEW: '#FFD700',
    ERROR: '#f44336',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    
    // 转换颜色
    TRANSITION_TYPES: {
        INTERNAL: '#4caf50',
        EXTERNAL: '#2196f3',
        SELF: '#ff9800',
        HISTORY: '#9c27b0',
        DEFAULT: '#666666'
    }
};

// 事件类型常量
export const EVENTS = {
    // 鼠标事件
    CLICK: 'click',
    DOUBLE_CLICK: 'dblclick',
    MOUSE_DOWN: 'mousedown',
    MOUSE_MOVE: 'mousemove',
    MOUSE_UP: 'mouseup',
    MOUSE_LEAVE: 'mouseleave',
    CONTEXT_MENU: 'contextmenu',
    WHEEL: 'wheel',
    
    // 键盘事件
    KEY_DOWN: 'keydown',
    KEY_UP: 'keyup',
    
    // 自定义事件
    NODE_EXPANSION_CHANGED: 'nodeExpansionChanged',
    STATE_CHANGED: 'stateChanged',
    TRANSITION_CREATED: 'transitionCreated',
    MODE_CHANGED: 'modeChanged'
};

// 键盘按键常量
export const KEYS = {
    ESCAPE: 'Escape',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    ENTER: 'Enter',
    SPACE: ' ',
    CTRL: 'Control',
    SHIFT: 'Shift',
    ALT: 'Alt',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    F1: 'F1',
    F2: 'F2',
    F5: 'F5',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown'
};

// 键盘快捷键配置
export const SHORTCUTS = {
    // 文件操作
    NEW: 'Ctrl+N',
    OPEN: 'Ctrl+O',
    SAVE: 'Ctrl+S',
    SAVE_AS: 'Ctrl+Shift+S',
    EXPORT: 'Ctrl+E',
    IMPORT: 'Ctrl+I',
    
    // 编辑操作
    UNDO: 'Ctrl+Z',
    REDO: 'Ctrl+Y',
    CUT: 'Ctrl+X',
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    SELECT_ALL: 'Ctrl+A',
    DELETE: 'Delete',
    
    // 视图操作
    ZOOM_IN: 'Ctrl+=',
    ZOOM_OUT: 'Ctrl+-',
    FIT_TO_SCREEN: 'Ctrl+0',
    FULL_SCREEN: 'F11',
    
    // 工具操作
    ADD_STATE: 'Ctrl+Shift+S',
    ADD_TRANSITION: 'Ctrl+Shift+T',
    ADD_CHILD: 'Ctrl+Shift+C',
    TOGGLE_SIMULATION: 'F5',
    CONNECTION_MODE: 'Ctrl+L',
    
    // 导航
    NEXT_STATE: 'Tab',
    PREV_STATE: 'Shift+Tab',
    MOVE_UP: 'ArrowUp',
    MOVE_DOWN: 'ArrowDown',
    MOVE_LEFT: 'ArrowLeft',
    MOVE_RIGHT: 'ArrowRight',
    
    // 功能
    HELP: 'F1',
    RENAME: 'F2',
    SEARCH: 'Ctrl+F',
    AUTO_LAYOUT: 'Ctrl+Shift+L',
    EXPAND_ALL: 'Ctrl+Shift+E',
    COLLAPSE_ALL: 'Ctrl+Shift+R'
};

// 高级功能配置
export const ADVANCED_FEATURES = {
    // 智能对齐
    SMART_ALIGNMENT: {
        ENABLED: true,
        SNAP_DISTANCE: 10,
        GRID_SIZE: 20,
        MAGNETIC_FORCE: 5
    },
    
    // 自动保存
    AUTO_SAVE: {
        ENABLED: true,
        INTERVAL: 30000, // 30秒
        MAX_BACKUPS: 10
    },
    
    // 性能优化
    PERFORMANCE: {
        VIRTUAL_SCROLLING: true,
        LAZY_RENDERING: true,
        DEBOUNCE_DELAY: 100,
        THROTTLE_DELAY: 16
    },
    
    // 协作功能
    COLLABORATION: {
        REAL_TIME_SYNC: false,
        CONFLICT_RESOLUTION: 'last_write_wins',
        PRESENCE_INDICATORS: true
    },
    
    // 导出选项
    EXPORT_OPTIONS: {
        FORMATS: ['json', 'xml', 'yaml', 'png', 'svg', 'pdf'],
        INCLUDE_METADATA: true,
        COMPRESS: true,
        ENCRYPTION: false
    },
    
    // 主题配置
    THEMES: {
        DARK: 'dark',
        LIGHT: 'light',
        AUTO: 'auto',
        HIGH_CONTRAST: 'high_contrast'
    },
    
    // 辅助功能
    ACCESSIBILITY: {
        SCREEN_READER: true,
        HIGH_CONTRAST: false,
        LARGE_TEXT: false,
        KEYBOARD_NAVIGATION: true,
        FOCUS_INDICATORS: true
    }
};

// 文件类型常量
export const FILE_TYPES = {
    JSON: 'application/json',
    PNG: 'image/png',
    SVG: 'image/svg+xml'
};

// 模式常量
export const MODES = {
    SELECT: 'select',
    CONNECT: 'connect',
    ADD: 'add',
    EDIT: 'edit'
};

// 转换类型常量
export const TRANSITION_TYPES = {
    INTERNAL: 'internal',
    EXTERNAL: 'external',
    SELF: 'self',
    HISTORY: 'history',
    COMPLETION: 'completion'
};

// 消息常量
export const MESSAGES = {
    // 确认消息
    CONFIRM: {
        DELETE_STATE: '确定要删除状态 "{name}" 吗？',
        DELETE_TRANSITION: '确定要删除转换吗？',
        CLEAR_CANVAS: '确定要清空画布吗？这将删除所有状态和转换。',
        RESET_EDITOR: '确定要重置编辑器吗？这将丢失所有未保存的更改。'
    },
    
    // 提示消息
    PROMPT: {
        STATE_NAME: '输入状态名称:',
        TRANSITION_EVENT: '输入转换事件名称:',
        TRANSITION_CONDITION: '输入转换条件（可选）:',
        EXPORT_FILENAME: '输入导出文件名:'
    },
    
    // 帮助提示
    TIPS: {
        RIGHT_CLICK_CREATE: '右键空白区域可创建新状态',
        DOUBLE_CLICK_CREATE: '双击空白区域可快速创建状态',
        DRAG_TO_MOVE: '拖拽状态节点可移动位置',
        CONNECT_STATES: '使用连接模式创建状态转换',
        KEYBOARD_SHORTCUTS: '使用键盘快捷键提高效率'
    },
    
    // 错误消息
    ERROR: {
        FILE_LOAD_FAILED: '文件加载失败',
        INVALID_FILE_FORMAT: '无效的文件格式',
        NODE_NOT_FOUND: '找不到指定的节点',
        TRANSITION_CREATE_FAILED: '创建转换失败',
        EDITOR_INIT_FAILED: '编辑器初始化失败'
    },
    
    // 成功消息
    SUCCESS: {
        FILE_IMPORTED: '文件导入成功',
        FILE_EXPORTED: '文件导出成功',
        STATE_CREATED: '状态创建成功',
        TRANSITION_CREATED: '转换创建成功'
    }
};

// 图标常量
export const ICONS = {
    // Font Awesome 图标
    ADD: 'fas fa-plus',
    DELETE: 'fas fa-trash',
    EDIT: 'fas fa-edit',
    SAVE: 'fas fa-save',
    LOAD: 'fas fa-folder-open',
    EXPORT: 'fas fa-download',
    IMPORT: 'fas fa-upload',
    PLAY: 'fas fa-play',
    PAUSE: 'fas fa-pause',
    STOP: 'fas fa-stop',
    RESET: 'fas fa-refresh',
    ZOOM_IN: 'fas fa-plus',
    ZOOM_OUT: 'fas fa-minus',
    FIT_SCREEN: 'fas fa-expand',
    UNDO: 'fas fa-undo',
    REDO: 'fas fa-redo',
    SETTINGS: 'fas fa-cog',
    INFO: 'fas fa-info-circle',
    WARNING: 'fas fa-exclamation-triangle',
    ERROR: 'fas fa-times-circle',
    SUCCESS: 'fas fa-check-circle',
    ARROW_RIGHT: 'fas fa-arrow-right',
    LAYER_GROUP: 'fas fa-layer-group',
    SITEMAP: 'fas fa-sitemap',
    CIRCLE_PLUS: 'fas fa-circle-plus',
    PROJECT_DIAGRAM: 'fas fa-project-diagram'
};

// 默认状态机模板
export const TEMPLATES = {
    SIMPLE: {
        name: '简单状态机',
        description: '包含基本的开始、处理、结束状态',
        states: [
            { name: '开始', x: 100, y: 100, isInitial: true },
            { name: '处理中', x: 300, y: 100 },
            { name: '结束', x: 500, y: 100, isFinal: true }
        ],
        transitions: [
            { from: '开始', to: '处理中', event: 'start' },
            { from: '处理中', to: '结束', event: 'finish' }
        ]
    },
    
    GAME: {
        name: '游戏状态机',
        description: '游戏的基本状态流程',
        states: [
            { name: '主菜单', x: 100, y: 100, isInitial: true },
            { name: '游戏中', x: 300, y: 100 },
            { name: '暂停', x: 300, y: 250 },
            { name: '游戏结束', x: 500, y: 100, isFinal: true }
        ],
        transitions: [
            { from: '主菜单', to: '游戏中', event: 'start' },
            { from: '游戏中', to: '暂停', event: 'pause' },
            { from: '暂停', to: '游戏中', event: 'resume' },
            { from: '游戏中', to: '游戏结束', event: 'gameOver' },
            { from: '游戏结束', to: '主菜单', event: 'restart' }
        ]
    }
};

// 导出所有常量
export default {
    DOM_IDS,
    CSS_CLASSES,
    DEFAULT_CONFIG,
    COLORS,
    EVENTS,
    KEYS,
    FILE_TYPES,
    MODES,
    TRANSITION_TYPES,
    MESSAGES,
    ICONS,
    TEMPLATES,
    SHORTCUTS,
    ADVANCED_FEATURES
}; 