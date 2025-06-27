/**
 * 并行器节点 - Parallel Node
 * 同时执行所有子节点，根据策略决定成功/失败条件
 */
class ParallelNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.PARALLEL, name, id);
        this.childResults = new Map();
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 并行器特有属性
            policy: 'require_all',     // 策略：require_all, require_one, require_majority
            successThreshold: 1,       // 成功阈值（需要多少个子节点成功）
            failureThreshold: 1,       // 失败阈值（允许多少个子节点失败）
            
            // 执行控制
            waitForAll: false,         // 是否等待所有子节点完成
            abortOnFailure: false,     // 失败时是否中止其他子节点
            maxConcurrency: 0,         // 最大并发数（0表示无限制）
            
            // 通用属性
            description: '并行器节点：同时执行所有子节点',
            tooltip: '并行器会同时执行所有子节点，根据策略决定整体结果'
        };
    }

    /**
     * 初始化节点
     */
    initializeNode() {
        this.childResults = new Map();
        this.runningChildren = new Set();
        this.completedChildren = new Set();
    }

    /**
     * 执行并行器逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        if (this.children.length === 0) {
            this.status = NodeStatus.SUCCESS;
            return this.status;
        }

        // 清空之前的结果（如果是新的执行周期）
        if (this.status === NodeStatus.READY) {
            this.childResults.clear();
            this.runningChildren.clear();
            this.completedChildren.clear();
        }

        // 执行子节点
        this.executeChildren(context);

        // 评估整体状态
        return this.evaluateStatus();
    }

    /**
     * 执行子节点
     */
    executeChildren(context) {
        const maxConcurrency = this.properties.maxConcurrency;
        let activeCount = 0;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            
            if (!child) continue;

            // 检查并发限制
            if (maxConcurrency > 0 && activeCount >= maxConcurrency) {
                break;
            }

            // 跳过已完成的子节点
            if (this.completedChildren.has(child.id)) {
                continue;
            }

            const result = child.execute(context);
            this.childResults.set(child.id, result);
            
            // 记录执行信息
            this.logExecution(`子节点 ${child.name} 执行结果: ${result}`, context);

            if (result === NodeStatus.RUNNING) {
                this.runningChildren.add(child.id);
                activeCount++;
            } else {
                this.runningChildren.delete(child.id);
                this.completedChildren.add(child.id);
                
                // 检查是否需要中止其他子节点
                if (result === NodeStatus.FAILURE && this.properties.abortOnFailure) {
                    this.abortRunningChildren();
                    break;
                }
            }
        }
    }

    /**
     * 中止运行中的子节点
     */
    abortRunningChildren() {
        this.runningChildren.forEach(childId => {
            const child = this.children.find(c => c.id === childId);
            if (child) {
                child.reset();
                this.childResults.set(childId, NodeStatus.FAILURE);
            }
        });
        this.runningChildren.clear();
    }

    /**
     * 评估整体状态
     */
    evaluateStatus() {
        const results = Array.from(this.childResults.values());
        const successCount = results.filter(r => r === NodeStatus.SUCCESS).length;
        const failureCount = results.filter(r => r === NodeStatus.FAILURE).length;
        const runningCount = results.filter(r => r === NodeStatus.RUNNING).length;

        // 如果还有子节点在运行
        if (runningCount > 0) {
            // 检查是否已经可以确定结果
            if (this.canDetermineEarlySuccess(successCount, runningCount)) {
                this.status = NodeStatus.SUCCESS;
                return this.status;
            }
            
            if (this.canDetermineEarlyFailure(failureCount, runningCount)) {
                this.status = NodeStatus.FAILURE;
                return this.status;
            }
            
            // 继续等待
            this.status = NodeStatus.RUNNING;
            return this.status;
        }

        // 所有子节点都完成了，根据策略评估
        this.status = this.evaluateCompletionStatus(successCount, failureCount);
        return this.status;
    }

    /**
     * 检查是否可以提前确定成功
     */
    canDetermineEarlySuccess(successCount, runningCount) {
        switch (this.properties.policy) {
            case 'require_one':
                return successCount >= 1;
            case 'require_majority':
                const majority = Math.ceil(this.children.length / 2);
                return successCount >= majority;
            case 'custom':
                return successCount >= this.properties.successThreshold;
            default:
                return false; // require_all 不能提前确定
        }
    }

    /**
     * 检查是否可以提前确定失败
     */
    canDetermineEarlyFailure(failureCount, runningCount) {
        switch (this.properties.policy) {
            case 'require_all':
                return failureCount >= 1;
            case 'require_majority':
                const majority = Math.ceil(this.children.length / 2);
                const maxPossibleSuccess = this.children.length - failureCount;
                return maxPossibleSuccess < majority;
            case 'custom':
                return failureCount > this.properties.failureThreshold;
            default:
                return false;
        }
    }

    /**
     * 评估完成状态
     */
    evaluateCompletionStatus(successCount, failureCount) {
        switch (this.properties.policy) {
            case 'require_all':
                return successCount === this.children.length ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            case 'require_one':
                return successCount >= 1 ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            case 'require_majority':
                const majority = Math.ceil(this.children.length / 2);
                return successCount >= majority ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            case 'custom':
                const meetsSuccess = successCount >= this.properties.successThreshold;
                const meetsFailure = failureCount <= this.properties.failureThreshold;
                return (meetsSuccess && meetsFailure) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            
            default:
                return NodeStatus.FAILURE;
        }
    }

    /**
     * 重置节点状态
     */
    reset() {
        super.reset();
        this.childResults.clear();
        this.runningChildren.clear();
        this.completedChildren.clear();
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('parallel', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '并行器节点配置',
            properties: [
                {
                    key: 'policy',
                    label: '执行策略',
                    type: 'select',
                    value: this.properties.policy,
                    options: [
                        { value: 'require_all', label: '需要全部成功' },
                        { value: 'require_one', label: '需要一个成功' },
                        { value: 'require_majority', label: '需要大多数成功' },
                        { value: 'custom', label: '自定义阈值' }
                    ],
                    description: '决定并行执行成功/失败的策略'
                },
                {
                    key: 'successThreshold',
                    label: '成功阈值',
                    type: 'number',
                    value: this.properties.successThreshold,
                    min: 1,
                    description: '需要成功的子节点数量（自定义策略）',
                    visible: () => this.properties.policy === 'custom'
                },
                {
                    key: 'failureThreshold',
                    label: '失败阈值',
                    type: 'number',
                    value: this.properties.failureThreshold,
                    min: 0,
                    description: '允许失败的子节点数量（自定义策略）',
                    visible: () => this.properties.policy === 'custom'
                },
                {
                    key: 'waitForAll',
                    label: '等待全部完成',
                    type: 'boolean',
                    value: this.properties.waitForAll,
                    description: '是否等待所有子节点完成再返回结果'
                },
                {
                    key: 'abortOnFailure',
                    label: '失败时中止',
                    type: 'boolean',
                    value: this.properties.abortOnFailure,
                    description: '当有子节点失败时是否中止其他正在运行的子节点'
                },
                {
                    key: 'maxConcurrency',
                    label: '最大并发数',
                    type: 'number',
                    value: this.properties.maxConcurrency,
                    min: 0,
                    description: '同时运行的最大子节点数量（0表示无限制）'
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
            errors.push('并行器节点至少需要一个子节点');
        }

        if (this.properties.policy === 'custom') {
            if (this.properties.successThreshold > this.children.length) {
                errors.push('成功阈值不能超过子节点数量');
            }
            
            if (this.properties.failureThreshold < 0) {
                errors.push('失败阈值不能为负数');
            }
        }

        if (this.properties.maxConcurrency < 0) {
            errors.push('最大并发数不能为负数');
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
            type: 'Parallel',
            childResults: Object.fromEntries(this.childResults),
            runningChildren: Array.from(this.runningChildren),
            completedChildren: Array.from(this.completedChildren),
            childCount: this.children.length,
            properties: this.properties
        };
    }

    /**
     * 获取执行进度
     */
    getProgress() {
        if (this.children.length === 0) return 1;
        return this.completedChildren.size / this.children.length;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParallelNode;
} else if (typeof window !== 'undefined') {
    window.ParallelNode = ParallelNode;
} 