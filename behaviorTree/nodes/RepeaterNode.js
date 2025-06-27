/**
 * 重复器节点 - Repeater Node
 * 重复执行子节点指定次数或直到满足条件
 */
class RepeaterNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.REPEATER, name, id);
        this.currentIteration = 0;
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 重复器特有属性
            repeatCount: 3,            // 重复次数（-1表示无限重复）
            repeatUntil: 'count',      // 重复条件：count, success, failure, always
            maxIterations: 10,         // 最大迭代次数（防止无限循环）
            
            // 执行控制
            resetChildOnRepeat: true,  // 每次重复时是否重置子节点
            breakOnFailure: false,     // 失败时是否中断重复
            breakOnSuccess: false,     // 成功时是否中断重复
            
            // 通用属性
            description: '重复器节点：重复执行子节点',
            tooltip: '重复器会按照设定的条件重复执行子节点'
        };
    }

    /**
     * 初始化节点
     */
    initializeNode() {
        this.currentIteration = 0;
        this.iterationResults = [];
    }

    /**
     * 执行重复器逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        if (this.children.length === 0) {
            this.status = NodeStatus.FAILURE;
            return this.status;
        }

        if (this.children.length > 1) {
            this.logExecution('警告：重复器节点只能有一个子节点，将执行第一个', context);
        }

        const child = this.children[0];
        
        // 检查是否需要开始新的重复周期
        if (this.status === NodeStatus.READY) {
            this.currentIteration = 0;
            this.iterationResults = [];
        }

        // 执行重复逻辑
        while (this.shouldContinueRepeating()) {
            // 重置子节点（如果配置了）
            if (this.properties.resetChildOnRepeat && this.currentIteration > 0) {
                child.reset();
            }

            const result = child.execute(context);
            this.iterationResults.push(result);
            
            // 记录执行信息
            this.logExecution(`第${this.currentIteration + 1}次执行结果: ${result}`, context);
            
            this.currentIteration++;

            // 检查中断条件
            if (this.shouldBreakOnResult(result)) {
                this.status = this.getFinalStatus(result);
                return this.status;
            }

            // 如果子节点正在运行，暂停重复
            if (result === NodeStatus.RUNNING) {
                this.status = NodeStatus.RUNNING;
                return this.status;
            }

            // 检查是否达到重复条件
            if (this.hasReachedRepeatCondition()) {
                this.status = this.getFinalStatus(result);
                return this.status;
            }
        }

        // 重复完成
        this.status = this.getFinalStatus();
        return this.status;
    }

    /**
     * 检查是否应该继续重复
     */
    shouldContinueRepeating() {
        // 检查最大迭代次数
        if (this.currentIteration >= this.properties.maxIterations) {
            return false;
        }

        // 根据重复条件判断
        switch (this.properties.repeatUntil) {
            case 'count':
                return this.properties.repeatCount === -1 || 
                       this.currentIteration < this.properties.repeatCount;
            
            case 'success':
                return !this.iterationResults.includes(NodeStatus.SUCCESS);
            
            case 'failure':
                return !this.iterationResults.includes(NodeStatus.FAILURE);
            
            case 'always':
                return true;
            
            default:
                return false;
        }
    }

    /**
     * 检查是否应该基于结果中断
     */
    shouldBreakOnResult(result) {
        if (this.properties.breakOnFailure && result === NodeStatus.FAILURE) {
            return true;
        }
        
        if (this.properties.breakOnSuccess && result === NodeStatus.SUCCESS) {
            return true;
        }
        
        return false;
    }

    /**
     * 检查是否达到重复条件
     */
    hasReachedRepeatCondition() {
        switch (this.properties.repeatUntil) {
            case 'count':
                return this.properties.repeatCount !== -1 && 
                       this.currentIteration >= this.properties.repeatCount;
            
            case 'success':
                return this.iterationResults.includes(NodeStatus.SUCCESS);
            
            case 'failure':
                return this.iterationResults.includes(NodeStatus.FAILURE);
            
            case 'always':
                return false; // 永远不会达到条件
            
            default:
                return true;
        }
    }

    /**
     * 获取最终状态
     */
    getFinalStatus(lastResult = null) {
        if (this.iterationResults.length === 0) {
            return NodeStatus.FAILURE;
        }

        const lastIterationResult = lastResult || this.iterationResults[this.iterationResults.length - 1];
        
        // 根据重复条件决定最终状态
        switch (this.properties.repeatUntil) {
            case 'success':
                return this.iterationResults.includes(NodeStatus.SUCCESS) ? 
                       NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            case 'failure':
                return this.iterationResults.includes(NodeStatus.FAILURE) ? 
                       NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            default:
                return lastIterationResult;
        }
    }

    /**
     * 重置节点状态
     */
    reset() {
        super.reset();
        this.currentIteration = 0;
        this.iterationResults = [];
    }

    /**
     * 检查是否可以有子节点
     */
    canHaveChildren() {
        return true; // 装饰器节点可以有子节点
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('repeater', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '重复器节点配置',
            properties: [
                {
                    key: 'repeatCount',
                    label: '重复次数',
                    type: 'number',
                    value: this.properties.repeatCount,
                    min: -1,
                    description: '重复执行的次数（-1表示无限重复）'
                },
                {
                    key: 'repeatUntil',
                    label: '重复条件',
                    type: 'select',
                    value: this.properties.repeatUntil,
                    options: [
                        { value: 'count', label: '按次数' },
                        { value: 'success', label: '直到成功' },
                        { value: 'failure', label: '直到失败' },
                        { value: 'always', label: '永远重复' }
                    ],
                    description: '重复执行的条件'
                },
                {
                    key: 'maxIterations',
                    label: '最大迭代次数',
                    type: 'number',
                    value: this.properties.maxIterations,
                    min: 1,
                    description: '防止无限循环的最大迭代次数'
                },
                {
                    key: 'resetChildOnRepeat',
                    label: '重复时重置子节点',
                    type: 'boolean',
                    value: this.properties.resetChildOnRepeat,
                    description: '每次重复时是否重置子节点状态'
                },
                {
                    key: 'breakOnFailure',
                    label: '失败时中断',
                    type: 'boolean',
                    value: this.properties.breakOnFailure,
                    description: '当子节点失败时是否立即中断重复'
                },
                {
                    key: 'breakOnSuccess',
                    label: '成功时中断',
                    type: 'boolean',
                    value: this.properties.breakOnSuccess,
                    description: '当子节点成功时是否立即中断重复'
                },
                {
                    key: 'description',
                    label: '描述',
                    type: 'textarea',
                    value: this.properties.description,
                    description: '节点的详细描述'
                }
            ]
        };
    }

    /**
     * 验证节点配置
     */
    validate() {
        const errors = [];
        
        if (this.children.length === 0) {
            errors.push('重复器节点需要一个子节点');
        }
        
        if (this.children.length > 1) {
            errors.push('重复器节点只能有一个子节点');
        }

        if (this.properties.repeatCount < -1 || this.properties.repeatCount === 0) {
            errors.push('重复次数必须是正数或-1（无限重复）');
        }

        if (this.properties.maxIterations < 1) {
            errors.push('最大迭代次数必须是正数');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            type: 'Repeater',
            currentIteration: this.currentIteration,
            iterationResults: this.iterationResults,
            childCount: this.children.length,
            properties: this.properties
        };
    }

    /**
     * 获取执行进度
     */
    getProgress() {
        if (this.properties.repeatCount === -1) {
            return 0; // 无限重复无法计算进度
        }
        
        return Math.min(this.currentIteration / this.properties.repeatCount, 1);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RepeaterNode;
} else if (typeof window !== 'undefined') {
    window.RepeaterNode = RepeaterNode;
} 