/**
 * 根节点类
 * Root Node Class
 */
class RootNode extends BaseNode {
    constructor(name = '根节点 Root', id = null) {
        super(NodeType.ROOT, name, id);
        
        // 根节点特有属性
        this.properties = {
            ...this.properties,
            // 行为树元数据
            treeVersion: '1.0.0',
            description: '',
            author: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            
            // 执行设置
            maxExecutionTime: 0, // 0表示无限制
            debugMode: false,
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            
            // 性能设置
            enableProfiling: false,
            maxProfileSamples: 1000
        };
    }

    /**
     * 获取默认属性
     */
    getDefaultProperties() {
        return {
            treeVersion: '1.0.0',
            description: '',
            author: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            maxExecutionTime: 0,
            debugMode: false,
            logLevel: 'info',
            enableProfiling: false,
            maxProfileSamples: 1000
        };
    }

    /**
     * 执行根节点
     */
    execute(context = {}) {
        // 更新修改时间
        this.properties.modified = new Date().toISOString();
        
        // 设置调试模式
        if (this.properties.debugMode) {
            context.debug = true;
            context.logLevel = this.properties.logLevel;
        }
        
        // 启用性能分析
        if (this.properties.enableProfiling) {
            context.profiling = true;
            context.profileSamples = [];
        }
        
        // 设置最大执行时间
        if (this.properties.maxExecutionTime > 0) {
            context.maxExecutionTime = this.properties.maxExecutionTime;
            context.startTime = Date.now();
        }
        
        // 执行子节点（通常只有一个）
        if (this.children.length === 0) {
            this.status = NodeStatus.FAILURE;
            return this.status;
        }
        
        // 根节点只执行第一个子节点
        const child = this.children[0];
        this.status = NodeStatus.RUNNING;
        
        try {
            const childStatus = child.execute(context);
            this.status = childStatus;
            
            // 检查执行时间限制
            if (context.maxExecutionTime && context.startTime) {
                const elapsed = Date.now() - context.startTime;
                if (elapsed > context.maxExecutionTime) {
                    console.warn(`行为树执行超时: ${elapsed}ms > ${context.maxExecutionTime}ms`);
                    this.status = NodeStatus.ERROR;
                }
            }
            
            return this.status;
        } catch (error) {
            console.error('根节点执行错误:', error);
            this.status = NodeStatus.ERROR;
            return this.status;
        }
    }

    /**
     * 重置根节点
     */
    reset() {
        super.reset();
        
        // 重置所有子节点
        this.children.forEach(child => child.reset());
        
        // 更新修改时间
        this.properties.modified = new Date().toISOString();
    }

    /**
     * 验证根节点
     */
    validate() {
        const errors = [];
        
        // 根节点应该只有一个子节点
        if (this.children.length === 0) {
            errors.push('根节点必须至少有一个子节点');
        } else if (this.children.length > 1) {
            errors.push('根节点只能有一个直接子节点');
        }
        
        // 验证属性
        if (this.properties.maxExecutionTime < 0) {
            errors.push('最大执行时间不能为负数');
        }
        
        if (!['debug', 'info', 'warn', 'error'].includes(this.properties.logLevel)) {
            errors.push('无效的日志级别');
        }
        
        if (this.properties.maxProfileSamples < 0) {
            errors.push('最大性能采样数不能为负数');
        }
        
        return errors;
    }

    /**
     * 获取属性配置
     */
    getPropertyConfig() {
        return [
            {
                key: 'description',
                label: '描述 Description',
                type: 'textarea',
                value: this.properties.description,
                placeholder: '描述这个行为树的用途...'
            },
            {
                key: 'author',
                label: '作者 Author',
                type: 'text',
                value: this.properties.author,
                placeholder: '作者姓名'
            },
            {
                key: 'treeVersion',
                label: '版本 Version',
                type: 'text',
                value: this.properties.treeVersion,
                placeholder: '1.0.0'
            },
            {
                key: 'maxExecutionTime',
                label: '最大执行时间 (ms)',
                type: 'number',
                value: this.properties.maxExecutionTime,
                min: 0,
                step: 100,
                description: '0表示无限制'
            },
            {
                key: 'debugMode',
                label: '调试模式 Debug Mode',
                type: 'checkbox',
                value: this.properties.debugMode,
                description: '启用调试输出'
            },
            {
                key: 'logLevel',
                label: '日志级别 Log Level',
                type: 'select',
                value: this.properties.logLevel,
                options: [
                    { value: 'debug', label: '调试 Debug' },
                    { value: 'info', label: '信息 Info' },
                    { value: 'warn', label: '警告 Warn' },
                    { value: 'error', label: '错误 Error' }
                ]
            },
            {
                key: 'enableProfiling',
                label: '性能分析 Profiling',
                type: 'checkbox',
                value: this.properties.enableProfiling,
                description: '启用性能分析'
            },
            {
                key: 'maxProfileSamples',
                label: '最大采样数 Max Samples',
                type: 'number',
                value: this.properties.maxProfileSamples,
                min: 100,
                max: 10000,
                step: 100,
                description: '性能分析的最大采样数'
            }
        ];
    }

    /**
     * 检查是否可以有子节点
     */
    canHaveChildren() {
        return true;
    }

    /**
     * 获取节点统计信息
     */
    getTreeStatistics() {
        const stats = {
            totalNodes: 0,
            nodeTypes: {},
            maxDepth: 0,
            leafNodes: 0
        };
        
        this.collectStats(this, stats, 0);
        
        return stats;
    }

    /**
     * 收集统计信息
     */
    collectStats(node, stats, depth) {
        stats.totalNodes++;
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        
        // 统计节点类型
        if (!stats.nodeTypes[node.type]) {
            stats.nodeTypes[node.type] = 0;
        }
        stats.nodeTypes[node.type]++;
        
        // 统计叶子节点
        if (node.children.length === 0) {
            stats.leafNodes++;
        }
        
        // 递归统计子节点
        node.children.forEach(child => {
            this.collectStats(child, stats, depth + 1);
        });
    }
}

// 确保在全局作用域中可用
if (typeof window !== 'undefined') {
    window.RootNode = RootNode;
} 