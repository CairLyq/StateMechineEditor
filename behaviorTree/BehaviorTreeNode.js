/**
 * 行为树编辑器 - 节点系统
 * Behavior Tree Editor - Node System
 */

/**
 * 节点状态枚举
 */
const NodeStatus = {
    READY: 'ready',        // 准备状态
    RUNNING: 'running',    // 运行中
    SUCCESS: 'success',    // 成功
    FAILURE: 'failure',    // 失败
    ERROR: 'error'         // 错误
};

/**
 * 节点类型枚举
 */
const NodeType = {
    // 控制节点 Control Nodes
    SELECTOR: 'selector',           // 选择器节点
    SEQUENCE: 'sequence',           // 序列节点
    PARALLEL: 'parallel',           // 并行节点
    
    // 装饰器节点 Decorator Nodes
    INVERTER: 'inverter',           // 反转器
    REPEATER: 'repeater',           // 重复器
    RETRY: 'retry',                 // 重试器
    TIMEOUT: 'timeout',             // 超时器
    COOLDOWN: 'cooldown',           // 冷却器
    
    // 叶子节点 Leaf Nodes
    ACTION: 'action',               // 动作节点
    CONDITION: 'condition',         // 条件节点
    
    // 特殊节点 Special Nodes
    ROOT: 'root',                   // 根节点
    WAIT: 'wait',                   // 等待节点
    LOG: 'log'                      // 日志节点
};

/**
 * 行为树节点基类
 */
class BehaviorTreeNode {
    constructor(type, name = '', id = null) {
        this.id = id || this.generateId();
        this.type = type;
        this.name = name || this.getDefaultName();
        this.status = NodeStatus.READY;
        
        // 位置和尺寸
        this.x = 0;
        this.y = 0;
        this.width = 120;
        this.height = 60;
        
        // 层次结构
        this.parent = null;
        this.children = [];
        
        // 节点属性
        this.properties = {};
        this.metadata = {
            description: '',
            category: this.getCategory(),
            color: this.getDefaultColor(),
            icon: this.getDefaultIcon()
        };
        
        // 执行相关
        this.isActive = false;
        this.executionCount = 0;
        this.lastExecutionTime = 0;
        
        // 编辑器相关
        this.isSelected = false;
        this.isExpanded = true;
        this.isEditing = false;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取默认名称
     */
    getDefaultName() {
        const names = {
            [NodeType.SELECTOR]: '选择器 Selector',
            [NodeType.SEQUENCE]: '序列器 Sequence',
            [NodeType.PARALLEL]: '并行器 Parallel',
            [NodeType.INVERTER]: '反转器 Inverter',
            [NodeType.REPEATER]: '重复器 Repeater',
            [NodeType.RETRY]: '重试器 Retry',
            [NodeType.TIMEOUT]: '超时器 Timeout',
            [NodeType.COOLDOWN]: '冷却器 Cooldown',
            [NodeType.ACTION]: '动作节点 Action',
            [NodeType.CONDITION]: '条件节点 Condition',
            [NodeType.ROOT]: '根节点 Root',
            [NodeType.WAIT]: '等待节点 Wait',
            [NodeType.LOG]: '日志节点 Log'
        };
        return names[this.type] || '未知节点 Unknown';
    }

    /**
     * 获取节点分类
     */
    getCategory() {
        if ([NodeType.SELECTOR, NodeType.SEQUENCE, NodeType.PARALLEL].includes(this.type)) {
            return 'control';
        }
        if ([NodeType.INVERTER, NodeType.REPEATER, NodeType.RETRY, NodeType.TIMEOUT, NodeType.COOLDOWN].includes(this.type)) {
            return 'decorator';
        }
        if ([NodeType.ACTION, NodeType.CONDITION, NodeType.WAIT, NodeType.LOG].includes(this.type)) {
            return 'leaf';
        }
        return 'special';
    }

    /**
     * 获取默认颜色
     */
    getDefaultColor() {
        const colors = {
            control: '#3b82f6',      // 蓝色 - 控制节点
            decorator: '#8b5cf6',    // 紫色 - 装饰器节点
            leaf: '#10b981',         // 绿色 - 叶子节点
            special: '#f59e0b'       // 橙色 - 特殊节点
        };
        return colors[this.getCategory()] || '#6b7280';
    }

    /**
     * 获取默认图标
     */
    getDefaultIcon() {
        const icons = {
            [NodeType.SELECTOR]: 'fas fa-code-branch',
            [NodeType.SEQUENCE]: 'fas fa-list-ol',
            [NodeType.PARALLEL]: 'fas fa-grip-lines',
            [NodeType.INVERTER]: 'fas fa-exchange-alt',
            [NodeType.REPEATER]: 'fas fa-redo',
            [NodeType.RETRY]: 'fas fa-sync',
            [NodeType.TIMEOUT]: 'fas fa-clock',
            [NodeType.COOLDOWN]: 'fas fa-snowflake',
            [NodeType.ACTION]: 'fas fa-play',
            [NodeType.CONDITION]: 'fas fa-question-circle',
            [NodeType.ROOT]: 'fas fa-tree',
            [NodeType.WAIT]: 'fas fa-pause',
            [NodeType.LOG]: 'fas fa-file-alt'
        };
        return icons[this.type] || 'fas fa-circle';
    }

    /**
     * 获取图标（兼容方法）
     */
    getIcon() {
        return this.getDefaultIcon();
    }

    /**
     * 添加子节点
     */
    addChild(child, index = -1) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        child.parent = this;
        
        if (index >= 0 && index < this.children.length) {
            this.children.splice(index, 0, child);
        } else {
            this.children.push(child);
        }
        
        return this;
    }

    /**
     * 移除子节点
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
            child.parent = null;
        }
        return this;
    }

    /**
     * 获取所有后代节点
     */
    getDescendants() {
        const descendants = [];
        const stack = [...this.children];
        
        while (stack.length > 0) {
            const node = stack.pop();
            descendants.push(node);
            stack.push(...node.children);
        }
        
        return descendants;
    }

    /**
     * 获取根节点
     */
    getRoot() {
        let node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    /**
     * 获取节点路径
     */
    getPath() {
        const path = [];
        let node = this;
        
        while (node) {
            path.unshift(node.name);
            node = node.parent;
        }
        
        return path.join(' > ');
    }

    /**
     * 检查是否为叶子节点
     */
    isLeaf() {
        return this.children.length === 0;
    }

    /**
     * 检查是否可以有子节点
     */
    canHaveChildren() {
        const leafTypes = [NodeType.ACTION, NodeType.CONDITION, NodeType.WAIT, NodeType.LOG];
        return !leafTypes.includes(this.type);
    }

    /**
     * 克隆节点
     */
    clone() {
        const cloned = new BehaviorTreeNode(this.type, this.name);
        cloned.properties = JSON.parse(JSON.stringify(this.properties));
        cloned.metadata = JSON.parse(JSON.stringify(this.metadata));
        cloned.width = this.width;
        cloned.height = this.height;
        
        // 递归克隆子节点
        this.children.forEach(child => {
            cloned.addChild(child.clone());
        });
        
        return cloned;
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            status: this.status,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            properties: this.properties,
            metadata: this.metadata,
            children: this.children.map(child => child.toJSON())
        };
    }

    /**
     * 从JSON创建节点
     */
    static fromJSON(data) {
        const node = new BehaviorTreeNode(data.type, data.name, data.id);
        
        Object.assign(node, {
            status: data.status || NodeStatus.READY,
            x: data.x || 0,
            y: data.y || 0,
            width: data.width || 120,
            height: data.height || 60,
            properties: data.properties || {},
            metadata: { ...node.metadata, ...(data.metadata || {}) }
        });
        
        // 递归创建子节点
        if (data.children) {
            data.children.forEach(childData => {
                node.addChild(BehaviorTreeNode.fromJSON(childData));
            });
        }
        
        return node;
    }

    /**
     * 执行节点（虚拟方法，由具体节点类型实现）
     */
    execute(context = {}) {
        this.executionCount++;
        this.lastExecutionTime = Date.now();
        this.isActive = true;
        
        // 默认返回成功
        this.status = NodeStatus.SUCCESS;
        return this.status;
    }

    /**
     * 重置节点状态
     */
    reset() {
        this.status = NodeStatus.READY;
        this.isActive = false;
        this.children.forEach(child => child.reset());
    }

    /**
     * 获取状态颜色
     */
    getStatusColor() {
        const colors = {
            [NodeStatus.READY]: '#6b7280',
            [NodeStatus.RUNNING]: '#3b82f6',
            [NodeStatus.SUCCESS]: '#10b981',
            [NodeStatus.FAILURE]: '#ef4444',
            [NodeStatus.ERROR]: '#dc2626'
        };
        return colors[this.status] || '#6b7280';
    }

    /**
     * 获取连接点
     */
    getConnectionPoints() {
        return {
            input: { x: this.x + this.width / 2, y: this.y },
            output: { x: this.x + this.width / 2, y: this.y + this.height }
        };
    }

    /**
     * 检查点是否在节点内
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    /**
     * 更新位置
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 更新尺寸
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        return this;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BehaviorTreeNode, NodeType, NodeStatus };
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeNode = BehaviorTreeNode;
    window.NodeType = NodeType;
    window.NodeStatus = NodeStatus;
} 