/**
 * 行为树编辑器 - 模拟器
 * Behavior Tree Editor - Simulator
 */

class BehaviorTreeSimulator {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.executionSpeed = 1000; // 毫秒
        this.executionInterval = null;
        
        // 执行状态
        this.context = {
            blackboard: new Map(),
            variables: new Map(),
            timers: new Map(),
            counters: new Map()
        };
        
        // 执行历史
        this.executionHistory = [];
        this.maxHistorySize = 100;
        
        // 性能统计
        this.stats = {
            totalExecutions: 0,
            successCount: 0,
            failureCount: 0,
            averageExecutionTime: 0,
            lastExecutionTime: 0
        };
        
        // 调试信息
        this.debugMode = false;
        this.breakpoints = new Set();
        this.stepMode = false;
        this.currentNode = null;
    }

    /**
     * 开始执行行为树
     */
    start(tree) {
        if (!tree || !tree.root) {
            console.warn('无法启动：没有有效的行为树根节点');
            return false;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.tree = tree;
        
        // 重置所有节点状态
        this.resetTree();
        
        // 开始执行循环
        this.executionInterval = setInterval(() => {
            if (!this.isPaused) {
                this.executeStep();
            }
        }, this.executionSpeed);
        
        this.logExecution('开始执行行为树', 'info');
        return true;
    }

    /**
     * 停止执行
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        
        this.resetTree();
        this.logExecution('停止执行行为树', 'info');
    }

    /**
     * 暂停执行
     */
    pause() {
        this.isPaused = true;
        this.logExecution('暂停执行', 'info');
    }

    /**
     * 恢复执行
     */
    resume() {
        this.isPaused = false;
        this.logExecution('恢复执行', 'info');
    }

    /**
     * 单步执行
     */
    step() {
        if (!this.isRunning) {
            this.start(this.tree);
            this.pause();
        }
        
        this.stepMode = true;
        this.executeStep();
        this.stepMode = false;
    }

    /**
     * 执行一步
     */
    executeStep() {
        if (!this.tree || !this.tree.root) return;
        
        const startTime = performance.now();
        
        try {
            const result = this.executeNode(this.tree.root);
            
            // 更新统计信息
            this.updateStats(result, performance.now() - startTime);
            
            // 记录执行历史
            this.recordExecution(this.tree.root, result);
            
            // 检查是否完成
            if (result !== NodeStatus.RUNNING) {
                this.logExecution(`行为树执行完成，结果: ${result}`, 'info');
                if (!this.stepMode) {
                    this.stop();
                }
            }
            
        } catch (error) {
            this.logExecution(`执行错误: ${error.message}`, 'error');
            this.stop();
        }
    }

    /**
     * 执行节点
     */
    executeNode(node) {
        if (!node) return NodeStatus.FAILURE;
        
        this.currentNode = node;
        
        // 检查断点
        if (this.breakpoints.has(node.id) && this.debugMode) {
            this.pause();
            this.logExecution(`断点触发: ${node.name}`, 'debug');
            return NodeStatus.RUNNING;
        }
        
        // 标记为运行中
        node.status = NodeStatus.RUNNING;
        node.isActive = true;
        
        let result;
        
        try {
            switch (node.type) {
                case NodeType.ROOT:
                    result = this.executeRoot(node);
                    break;
                case NodeType.SELECTOR:
                    result = this.executeSelector(node);
                    break;
                case NodeType.SEQUENCE:
                    result = this.executeSequence(node);
                    break;
                case NodeType.PARALLEL:
                    result = this.executeParallel(node);
                    break;
                case NodeType.INVERTER:
                    result = this.executeInverter(node);
                    break;
                case NodeType.REPEATER:
                    result = this.executeRepeater(node);
                    break;
                case NodeType.CONDITION:
                    result = this.executeCondition(node);
                    break;
                case NodeType.ACTION:
                    result = this.executeAction(node);
                    break;
                case NodeType.WAIT:
                    result = this.executeWait(node);
                    break;
                default:
                    result = NodeStatus.SUCCESS;
            }
        } catch (error) {
            this.logExecution(`节点执行错误 ${node.name}: ${error.message}`, 'error');
            result = NodeStatus.ERROR;
        }
        
        // 更新节点状态
        node.status = result;
        node.isActive = (result === NodeStatus.RUNNING);
        node.executionCount++;
        node.lastExecutionTime = Date.now();
        
        return result;
    }

    /**
     * 执行根节点
     */
    executeRoot(node) {
        if (node.children.length === 0) {
            return NodeStatus.SUCCESS;
        }
        return this.executeNode(node.children[0]);
    }

    /**
     * 执行选择器节点（OR逻辑）
     */
    executeSelector(node) {
        for (const child of node.children) {
            const result = this.executeNode(child);
            
            if (result === NodeStatus.SUCCESS) {
                return NodeStatus.SUCCESS;
            } else if (result === NodeStatus.RUNNING) {
                return NodeStatus.RUNNING;
            }
            // 失败时继续尝试下一个子节点
        }
        
        return NodeStatus.FAILURE;
    }

    /**
     * 执行序列器节点（AND逻辑）
     */
    executeSequence(node) {
        for (const child of node.children) {
            const result = this.executeNode(child);
            
            if (result === NodeStatus.FAILURE || result === NodeStatus.ERROR) {
                return result;
            } else if (result === NodeStatus.RUNNING) {
                return NodeStatus.RUNNING;
            }
            // 成功时继续执行下一个子节点
        }
        
        return NodeStatus.SUCCESS;
    }

    /**
     * 执行并行节点
     */
    executeParallel(node) {
        const results = node.children.map(child => this.executeNode(child));
        
        // 检查是否有错误
        if (results.some(result => result === NodeStatus.ERROR)) {
            return NodeStatus.ERROR;
        }
        
        // 检查是否还有运行中的节点
        if (results.some(result => result === NodeStatus.RUNNING)) {
            return NodeStatus.RUNNING;
        }
        
        // 检查成功策略（这里使用全部成功策略）
        const successCount = results.filter(result => result === NodeStatus.SUCCESS).length;
        const requiredSuccess = node.properties.requiredSuccess || node.children.length;
        
        return successCount >= requiredSuccess ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    }

    /**
     * 执行反转器节点
     */
    executeInverter(node) {
        if (node.children.length === 0) {
            return NodeStatus.FAILURE;
        }
        
        const result = this.executeNode(node.children[0]);
        
        switch (result) {
            case NodeStatus.SUCCESS:
                return NodeStatus.FAILURE;
            case NodeStatus.FAILURE:
                return NodeStatus.SUCCESS;
            default:
                return result; // RUNNING, ERROR 保持不变
        }
    }

    /**
     * 执行重复器节点
     */
    executeRepeater(node) {
        if (node.children.length === 0) {
            return NodeStatus.FAILURE;
        }
        
        const maxRepeats = node.properties.maxRepeats || -1; // -1 表示无限重复
        const currentCount = node.properties.currentCount || 0;
        
        if (maxRepeats > 0 && currentCount >= maxRepeats) {
            return NodeStatus.SUCCESS;
        }
        
        const result = this.executeNode(node.children[0]);
        
        if (result === NodeStatus.SUCCESS || result === NodeStatus.FAILURE) {
            node.properties.currentCount = currentCount + 1;
            
            if (maxRepeats > 0 && node.properties.currentCount >= maxRepeats) {
                return NodeStatus.SUCCESS;
            }
            
            return NodeStatus.RUNNING; // 继续重复
        }
        
        return result;
    }

    /**
     * 执行条件节点
     */
    executeCondition(node) {
        // 模拟条件检查
        const conditionType = node.properties.conditionType || 'random';
        
        switch (conditionType) {
            case 'random':
                return Math.random() > 0.5 ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            case 'blackboard':
                const key = node.properties.blackboardKey;
                const expectedValue = node.properties.expectedValue;
                const actualValue = this.context.blackboard.get(key);
                return actualValue === expectedValue ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            case 'timer':
                const timer = node.properties.timer || 1000;
                if (!node.properties.startTime) {
                    node.properties.startTime = Date.now();
                }
                const elapsed = Date.now() - node.properties.startTime;
                return elapsed >= timer ? NodeStatus.SUCCESS : NodeStatus.RUNNING;
            default:
                return NodeStatus.SUCCESS;
        }
    }

    /**
     * 执行动作节点
     */
    executeAction(node) {
        // 模拟动作执行
        const actionType = node.properties.actionType || 'instant';
        
        switch (actionType) {
            case 'instant':
                this.logExecution(`执行动作: ${node.name}`, 'action');
                return NodeStatus.SUCCESS;
            case 'duration':
                const duration = node.properties.duration || 1000;
                if (!node.properties.startTime) {
                    node.properties.startTime = Date.now();
                    this.logExecution(`开始执行动作: ${node.name}`, 'action');
                }
                const elapsed = Date.now() - node.properties.startTime;
                if (elapsed >= duration) {
                    this.logExecution(`完成动作: ${node.name}`, 'action');
                    delete node.properties.startTime;
                    return NodeStatus.SUCCESS;
                }
                return NodeStatus.RUNNING;
            case 'blackboard':
                const key = node.properties.blackboardKey;
                const value = node.properties.value;
                this.context.blackboard.set(key, value);
                this.logExecution(`设置黑板 ${key} = ${value}`, 'action');
                return NodeStatus.SUCCESS;
            default:
                return NodeStatus.SUCCESS;
        }
    }

    /**
     * 执行等待节点
     */
    executeWait(node) {
        const waitTime = node.properties.waitTime || 1000;
        
        if (!node.properties.startTime) {
            node.properties.startTime = Date.now();
        }
        
        const elapsed = Date.now() - node.properties.startTime;
        if (elapsed >= waitTime) {
            delete node.properties.startTime;
            return NodeStatus.SUCCESS;
        }
        
        return NodeStatus.RUNNING;
    }

    /**
     * 重置行为树状态
     */
    resetTree() {
        if (!this.tree || !this.tree.root) return;
        
        const nodes = [this.tree.root, ...this.tree.root.getDescendants()];
        nodes.forEach(node => {
            node.reset();
            // 清除运行时属性
            delete node.properties.startTime;
            delete node.properties.currentCount;
        });
        
        // 清除上下文
        this.context.blackboard.clear();
        this.context.timers.clear();
        this.context.counters.clear();
    }

    /**
     * 记录执行历史
     */
    recordExecution(node, result) {
        const execution = {
            nodeId: node.id,
            nodeName: node.name,
            result,
            timestamp: Date.now(),
            context: JSON.parse(JSON.stringify(Object.fromEntries(this.context.blackboard)))
        };
        
        this.executionHistory.push(execution);
        
        // 限制历史记录大小
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
    }

    /**
     * 更新统计信息
     */
    updateStats(result, executionTime) {
        this.stats.totalExecutions++;
        this.stats.lastExecutionTime = executionTime;
        
        // 更新平均执行时间
        this.stats.averageExecutionTime = 
            (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) / 
            this.stats.totalExecutions;
        
        // 更新成功/失败计数
        if (result === NodeStatus.SUCCESS) {
            this.stats.successCount++;
        } else if (result === NodeStatus.FAILURE) {
            this.stats.failureCount++;
        }
    }

    /**
     * 记录执行日志
     */
    logExecution(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type,
            node: this.currentNode?.name || 'Unknown'
        };
        
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
        
        // 触发日志事件（可供UI监听）
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('behaviorTreeLog', { detail: logEntry }));
        }
    }

    /**
     * 设置断点
     */
    setBreakpoint(nodeId) {
        this.breakpoints.add(nodeId);
    }

    /**
     * 移除断点
     */
    removeBreakpoint(nodeId) {
        this.breakpoints.delete(nodeId);
    }

    /**
     * 切换断点
     */
    toggleBreakpoint(nodeId) {
        if (this.breakpoints.has(nodeId)) {
            this.removeBreakpoint(nodeId);
        } else {
            this.setBreakpoint(nodeId);
        }
    }

    /**
     * 获取执行统计
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 获取执行历史
     */
    getHistory() {
        return [...this.executionHistory];
    }

    /**
     * 获取黑板数据
     */
    getBlackboard() {
        return new Map(this.context.blackboard);
    }

    /**
     * 设置黑板数据
     */
    setBlackboardValue(key, value) {
        this.context.blackboard.set(key, value);
    }

    /**
     * 设置执行速度
     */
    setExecutionSpeed(speed) {
        this.executionSpeed = Math.max(100, Math.min(5000, speed));
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = setInterval(() => {
                if (!this.isPaused) {
                    this.executeStep();
                }
            }, this.executionSpeed);
        }
    }

    /**
     * 启用/禁用调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.logExecution(`调试模式: ${enabled ? '启用' : '禁用'}`, 'debug');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviorTreeSimulator;
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeSimulator = BehaviorTreeSimulator;
} 