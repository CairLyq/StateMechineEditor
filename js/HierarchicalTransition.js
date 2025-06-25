/**
 * 分层状态转换类
 * 处理层次状态机中的状态转换，支持跨层级转换
 */
class HierarchicalTransition {
    constructor(id, fromPath, toPath, event = 'event', condition = '') {
        this.id = id;
        this.fromPath = fromPath; // 源状态路径
        this.toPath = toPath; // 目标状态路径
        this.event = event; // 触发事件
        this.condition = condition; // 转换条件
        this.type = this.determineTransitionType(fromPath, toPath);
        this.priority = 0; // 转换优先级
        this.isEnabled = true; // 是否启用
        this.guard = null; // 守卫条件函数
        this.action = null; // 转换动作函数
        this.label = event; // 显示标签
    }

    /**
     * 转换类型枚举
     */
    static TransitionType = {
        INTERNAL: 'internal', // 内部转换（同一父状态内）
        EXTERNAL: 'external', // 外部转换（跨父状态）
        SELF: 'self', // 自转换
        HISTORY: 'history', // 历史转换
        COMPLETION: 'completion' // 完成转换（无事件触发）
    };

    /**
     * 确定转换类型
     */
    determineTransitionType(fromPath, toPath) {
        if (fromPath === toPath) {
            return HierarchicalTransition.TransitionType.SELF;
        }

        const fromParts = fromPath.split('.');
        const toParts = toPath.split('.');

        // 找到公共祖先
        let commonDepth = 0;
        while (commonDepth < fromParts.length && 
               commonDepth < toParts.length && 
               fromParts[commonDepth] === toParts[commonDepth]) {
            commonDepth++;
        }

        // 如果有公共祖先且不是根，则为内部转换
        if (commonDepth > 0 && commonDepth < Math.max(fromParts.length, toParts.length)) {
            return HierarchicalTransition.TransitionType.INTERNAL;
        }

        return HierarchicalTransition.TransitionType.EXTERNAL;
    }

    /**
     * 获取公共祖先路径
     */
    getCommonAncestorPath() {
        const fromParts = this.fromPath.split('.');
        const toParts = this.toPath.split('.');
        
        const commonParts = [];
        let i = 0;
        
        while (i < fromParts.length && 
               i < toParts.length && 
               fromParts[i] === toParts[i]) {
            commonParts.push(fromParts[i]);
            i++;
        }
        
        return commonParts.join('.');
    }

    /**
     * 获取需要退出的状态路径列表
     */
    getExitPaths() {
        const fromParts = this.fromPath.split('.');
        const commonAncestor = this.getCommonAncestorPath();
        const commonParts = commonAncestor ? commonAncestor.split('.') : [];
        
        const exitPaths = [];
        
        // 从最深层开始，直到公共祖先
        for (let i = fromParts.length; i > commonParts.length; i--) {
            exitPaths.push(fromParts.slice(0, i).join('.'));
        }
        
        return exitPaths;
    }

    /**
     * 获取需要进入的状态路径列表
     */
    getEntryPaths() {
        const toParts = this.toPath.split('.');
        const commonAncestor = this.getCommonAncestorPath();
        const commonParts = commonAncestor ? commonAncestor.split('.') : [];
        
        const entryPaths = [];
        
        // 从公共祖先的下一层开始，到目标状态
        for (let i = commonParts.length + 1; i <= toParts.length; i++) {
            entryPaths.push(toParts.slice(0, i).join('.'));
        }
        
        return entryPaths;
    }

    /**
     * 检查转换是否可以执行
     */
    canExecute(context) {
        if (!this.isEnabled) {
            return false;
        }

        // 检查守卫条件
        if (this.guard && !this.guard(context)) {
            return false;
        }

        // 检查条件表达式
        if (this.condition && this.condition.trim()) {
            try {
                // 简单的条件表达式求值
                // 在实际应用中，这里应该使用更安全的表达式求值器
                return new Function('context', `return ${this.condition}`)(context);
            } catch (error) {
                console.warn(`转换条件求值失败: ${this.condition}`, error);
                return false;
            }
        }

        return true;
    }

    /**
     * 执行转换动作
     */
    executeAction(context) {
        if (this.action) {
            try {
                this.action(context);
            } catch (error) {
                console.error(`转换动作执行失败:`, error);
            }
        }
    }

    /**
     * 设置守卫条件
     */
    setGuard(guardFunction) {
        this.guard = guardFunction;
        return this;
    }

    /**
     * 设置转换动作
     */
    setAction(actionFunction) {
        this.action = actionFunction;
        return this;
    }

    /**
     * 设置优先级
     */
    setPriority(priority) {
        this.priority = priority;
        return this;
    }

    /**
     * 启用/禁用转换
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        return this;
    }

    /**
     * 获取转换的描述信息
     */
    getDescription() {
        let desc = `${this.fromPath} → ${this.toPath}`;
        if (this.event && this.event !== 'event') {
            desc += ` [${this.event}]`;
        }
        if (this.condition) {
            desc += ` {${this.condition}}`;
        }
        return desc;
    }

    /**
     * 检查转换是否跨层级
     */
    isCrossLevel() {
        const fromLevel = this.fromPath.split('.').length;
        const toLevel = this.toPath.split('.').length;
        return fromLevel !== toLevel;
    }

    /**
     * 获取转换深度（跨越的层级数）
     */
    getTransitionDepth() {
        const exitPaths = this.getExitPaths();
        const entryPaths = this.getEntryPaths();
        return Math.max(exitPaths.length, entryPaths.length);
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            id: this.id,
            fromPath: this.fromPath,
            toPath: this.toPath,
            event: this.event,
            condition: this.condition,
            type: this.type,
            priority: this.priority,
            isEnabled: this.isEnabled,
            label: this.label
        };
    }

    /**
     * 从JSON反序列化
     */
    static fromJSON(data) {
        const transition = new HierarchicalTransition(
            data.id,
            data.fromPath,
            data.toPath,
            data.event,
            data.condition
        );
        
        transition.type = data.type;
        transition.priority = data.priority || 0;
        transition.isEnabled = data.isEnabled !== false;
        transition.label = data.label || data.event;
        
        return transition;
    }

    /**
     * 比较两个转换的优先级
     */
    static compareByPriority(a, b) {
        return b.priority - a.priority; // 高优先级在前
    }
}

/**
 * 分层转换管理器
 * 管理所有的分层状态转换
 */
class HierarchicalTransitionManager {
    constructor() {
        this.transitions = new Map(); // 所有转换
        this.transitionsByFromPath = new Map(); // 按源状态分组的转换
        this.transitionsByEvent = new Map(); // 按事件分组的转换
        this.globalTransitions = new Map(); // 全局转换
    }

    /**
     * 添加转换
     */
    addTransition(transition) {
        if (!(transition instanceof HierarchicalTransition)) {
            throw new Error('Must be a HierarchicalTransition instance');
        }

        this.transitions.set(transition.id, transition);

        // 按源状态分组
        if (!this.transitionsByFromPath.has(transition.fromPath)) {
            this.transitionsByFromPath.set(transition.fromPath, []);
        }
        this.transitionsByFromPath.get(transition.fromPath).push(transition);

        // 按事件分组
        if (!this.transitionsByEvent.has(transition.event)) {
            this.transitionsByEvent.set(transition.event, []);
        }
        this.transitionsByEvent.get(transition.event).push(transition);

        return transition;
    }

    /**
     * 移除转换
     */
    removeTransition(transitionId) {
        const transition = this.transitions.get(transitionId);
        if (!transition) {
            return false;
        }

        this.transitions.delete(transitionId);

        // 从分组中移除
        const fromPathTransitions = this.transitionsByFromPath.get(transition.fromPath);
        if (fromPathTransitions) {
            const index = fromPathTransitions.indexOf(transition);
            if (index !== -1) {
                fromPathTransitions.splice(index, 1);
            }
            if (fromPathTransitions.length === 0) {
                this.transitionsByFromPath.delete(transition.fromPath);
            }
        }

        const eventTransitions = this.transitionsByEvent.get(transition.event);
        if (eventTransitions) {
            const index = eventTransitions.indexOf(transition);
            if (index !== -1) {
                eventTransitions.splice(index, 1);
            }
            if (eventTransitions.length === 0) {
                this.transitionsByEvent.delete(transition.event);
            }
        }

        return true;
    }

    /**
     * 获取指定状态的所有转换
     */
    getTransitionsFromState(statePath) {
        return this.transitionsByFromPath.get(statePath) || [];
    }

    /**
     * 获取指定事件的所有转换
     */
    getTransitionsByEvent(event) {
        return this.transitionsByEvent.get(event) || [];
    }

    /**
     * 查找可执行的转换
     */
    findExecutableTransitions(currentStatePath, event, context) {
        const candidates = [];

        // 获取当前状态及其祖先状态的转换
        const stateParts = currentStatePath.split('.');
        for (let i = stateParts.length; i > 0; i--) {
            const ancestorPath = stateParts.slice(0, i).join('.');
            const transitions = this.getTransitionsFromState(ancestorPath);
            
            for (const transition of transitions) {
                if (transition.event === event && transition.canExecute(context)) {
                    candidates.push(transition);
                }
            }
        }

        // 按优先级排序
        candidates.sort(HierarchicalTransition.compareByPriority);
        
        return candidates;
    }

    /**
     * 获取所有转换
     */
    getAllTransitions() {
        return Array.from(this.transitions.values());
    }

    /**
     * 清空所有转换
     */
    clear() {
        this.transitions.clear();
        this.transitionsByFromPath.clear();
        this.transitionsByEvent.clear();
        this.globalTransitions.clear();
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            transitions: this.getAllTransitions().map(t => t.toJSON())
        };
    }

    /**
     * 从JSON反序列化
     */
    static fromJSON(data) {
        const manager = new HierarchicalTransitionManager();
        
        if (data.transitions) {
            for (const transitionData of data.transitions) {
                const transition = HierarchicalTransition.fromJSON(transitionData);
                manager.addTransition(transition);
            }
        }
        
        return manager;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HierarchicalTransition, HierarchicalTransitionManager };
} else if (typeof window !== 'undefined') {
    window.HierarchicalTransition = HierarchicalTransition;
    window.HierarchicalTransitionManager = HierarchicalTransitionManager;
} 