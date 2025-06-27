/**
 * 序列器节点 - Sequence Node
 * 按顺序执行子节点，直到有一个返回FAILURE或RUNNING
 */
class SequenceNode extends BaseNode {
    constructor(name = '', id = null) {
        super(NodeType.SEQUENCE, name, id);
        this.currentChildIndex = 0;
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            // 序列器特有属性
            abortOnFailure: true,      // 失败时是否立即中止
            continueOnSuccess: true,   // 成功时是否继续下一个
            resetOnRestart: true,      // 重新开始时是否重置状态
            
            // 通用属性
            description: '序列器节点：按顺序执行子节点，直到有一个失败',
            tooltip: '序列器会依次执行子节点，所有节点都成功才算成功'
        };
    }

    /**
     * 初始化节点
     */
    initializeNode() {
        this.currentChildIndex = 0;
        this.completedChildren = new Set();
    }

    /**
     * 执行序列器逻辑
     */
    execute(context = {}) {
        super.execute(context);
        
        if (this.children.length === 0) {
            this.status = NodeStatus.SUCCESS;
            return this.status;
        }

        // 如果设置了重置，清空已完成的子节点记录
        if (this.properties.resetOnRestart && this.status === NodeStatus.READY) {
            this.completedChildren.clear();
            this.currentChildIndex = 0;
        }

        // 从当前索引开始执行
        for (let i = this.currentChildIndex; i < this.children.length; i++) {
            const child = this.children[i];
            
            if (!child) continue;

            // 如果子节点已经完成且成功，跳过
            if (this.completedChildren.has(child.id)) {
                continue;
            }

            const result = child.execute(context);
            
            // 记录执行信息
            this.logExecution(`执行子节点 ${child.name}: ${result}`, context);
            
            if (result === NodeStatus.FAILURE) {
                this.status = NodeStatus.FAILURE;
                if (this.properties.abortOnFailure) {
                    this.currentChildIndex = 0; // 重置索引
                    this.completedChildren.clear();
                }
                return this.status;
            } else if (result === NodeStatus.RUNNING) {
                this.status = NodeStatus.RUNNING;
                this.currentChildIndex = i; // 记住当前位置
                return this.status;
            } else if (result === NodeStatus.SUCCESS) {
                this.completedChildren.add(child.id);
                if (this.properties.continueOnSuccess) {
                    continue; // 继续下一个子节点
                } else {
                    this.status = NodeStatus.SUCCESS;
                    this.currentChildIndex = 0;
                    this.completedChildren.clear();
                    return this.status;
                }
            }
        }

        // 所有子节点都成功了
        this.status = NodeStatus.SUCCESS;
        this.currentChildIndex = 0;
        this.completedChildren.clear();
        return this.status;
    }

    /**
     * 重置节点状态
     */
    reset() {
        super.reset();
        this.currentChildIndex = 0;
        this.completedChildren.clear();
    }

    /**
     * 记录执行日志
     */
    logExecution(message, context) {
        if (context.logger) {
            context.logger.log('sequence', message, this.id);
        }
    }

    /**
     * 获取属性配置界面
     */
    getPropertyConfig() {
        return {
            title: '序列器节点配置',
            properties: [
                {
                    key: 'abortOnFailure',
                    label: '失败时中止',
                    type: 'boolean',
                    value: this.properties.abortOnFailure,
                    description: '当子节点失败时是否立即中止执行'
                },
                {
                    key: 'continueOnSuccess',
                    label: '成功时继续',
                    type: 'boolean',
                    value: this.properties.continueOnSuccess,
                    description: '当子节点成功时是否继续执行下一个'
                },
                {
                    key: 'resetOnRestart',
                    label: '重启时重置',
                    type: 'boolean',
                    value: this.properties.resetOnRestart,
                    description: '重新开始执行时是否重置所有状态'
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
            errors.push('序列器节点至少需要一个子节点');
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
            type: 'Sequence',
            currentChildIndex: this.currentChildIndex,
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
    module.exports = SequenceNode;
} else if (typeof window !== 'undefined') {
    window.SequenceNode = SequenceNode;
} 