/**
 * 分层状态节点类
 * 表示层次状态机中的一个状态节点，支持父子关系
 */
class HierarchicalStateNode {
    constructor(id, name, x, y, level = 0) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.level = level; // 层级深度，0为根级
        this.parent = null; // 父节点
        this.children = new Map(); // 子节点集合
        this.isExpanded = true; // 是否展开显示子节点
        this.isInitial = false;
        this.isFinal = false;
        this.color = this.getDefaultColorForLevel(level);
        this.width = 120;
        this.height = 80;
        this.isComposite = false; // 是否为复合状态（有子状态）
        this.defaultChild = null; // 默认子状态
    }

    /**
     * 根据层级获取默认颜色
     */
    getDefaultColorForLevel(level) {
        const colors = [
            '#4caf50', // Level 0 - 绿色
            '#2196f3', // Level 1 - 蓝色
            '#ff9800', // Level 2 - 橙色
            '#9c27b0', // Level 3 - 紫色
            '#f44336', // Level 4 - 红色
            '#00bcd4', // Level 5 - 青色
        ];
        return colors[level % colors.length];
    }

    /**
     * 添加子节点
     */
    addChild(childNode) {
        if (!(childNode instanceof HierarchicalStateNode)) {
            throw new Error('Child must be a HierarchicalStateNode instance');
        }
        
        // 检查是否已存在同名子节点
        if (this.children.has(childNode.id)) {
            throw new Error(`Child with id '${childNode.id}' already exists`);
        }
        
        // 设置父子关系
        childNode.parent = this;
        childNode.level = this.level + 1;
        childNode.color = childNode.getDefaultColorForLevel(childNode.level);
        
        // 添加到子节点集合
        this.children.set(childNode.id, childNode);
        
        // 标记为复合状态
        this.isComposite = true;
        
        // 如果是第一个子节点，设为默认子状态
        if (this.children.size === 1) {
            this.defaultChild = childNode.id;
        }
        
        return childNode;
    }

    /**
     * 移除子节点
     */
    removeChild(childId) {
        const child = this.children.get(childId);
        if (!child) {
            return false;
        }
        
        // 清除父子关系
        child.parent = null;
        this.children.delete(childId);
        
        // 如果移除的是默认子状态，重新设置默认子状态
        if (this.defaultChild === childId) {
            const remainingChildren = Array.from(this.children.keys());
            this.defaultChild = remainingChildren.length > 0 ? remainingChildren[0] : null;
        }
        
        // 如果没有子节点了，取消复合状态标记
        if (this.children.size === 0) {
            this.isComposite = false;
            this.defaultChild = null;
        }
        
        return true;
    }

    /**
     * 获取子节点
     */
    getChild(childId) {
        return this.children.get(childId);
    }

    /**
     * 获取所有子节点
     */
    getAllChildren() {
        return Array.from(this.children.values());
    }

    /**
     * 获取所有后代节点（递归）
     */
    getAllDescendants() {
        const descendants = [];
        for (const child of this.children.values()) {
            descendants.push(child);
            descendants.push(...child.getAllDescendants());
        }
        return descendants;
    }

    /**
     * 获取状态路径（从根到当前节点的完整路径）
     */
    getStatePath() {
        const path = [this.name];
        let current = this.parent;
        while (current) {
            path.unshift(current.name);
            current = current.parent;
        }
        return path.join('.');
    }

    /**
     * 获取显示名称（包含层级信息）
     */
    getDisplayName() {
        const indent = '  '.repeat(this.level);
        return `${indent}${this.name}`;
    }

    /**
     * 检查是否为叶子节点
     */
    isLeaf() {
        return this.children.size === 0;
    }

    /**
     * 检查是否为根节点
     */
    isRoot() {
        return this.parent === null;
    }

    /**
     * 获取根节点
     */
    getRoot() {
        let current = this;
        while (current.parent) {
            current = current.parent;
        }
        return current;
    }

    /**
     * 查找指定路径的节点
     */
    findNodeByPath(path) {
        const parts = path.split('.');
        let current = this;
        
        for (const part of parts) {
            if (current.name === part) {
                continue;
            }
            
            const child = Array.from(current.children.values())
                .find(c => c.name === part);
            
            if (!child) {
                return null;
            }
            
            current = child;
        }
        
        return current;
    }

    /**
     * 切换展开/折叠状态
     */
    toggleExpansion() {
        this.isExpanded = !this.isExpanded;
        return this.isExpanded;
    }

    /**
     * 设置默认子状态
     */
    setDefaultChild(childId) {
        if (!this.children.has(childId)) {
            throw new Error(`Child with id '${childId}' does not exist`);
        }
        this.defaultChild = childId;
    }

    /**
     * 获取边界框（包含所有子节点）
     */
    getBoundingBox() {
        if (this.children.size === 0) {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }

        let minX = this.x;
        let minY = this.y;
        let maxX = this.x + this.width;
        let maxY = this.y + this.height;

        for (const child of this.children.values()) {
            const childBounds = child.getBoundingBox();
            minX = Math.min(minX, childBounds.x);
            minY = Math.min(minY, childBounds.y);
            maxX = Math.max(maxX, childBounds.x + childBounds.width);
            maxY = Math.max(maxY, childBounds.y + childBounds.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * 序列化为JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            level: this.level,
            isInitial: this.isInitial,
            isFinal: this.isFinal,
            color: this.color,
            width: this.width,
            height: this.height,
            isComposite: this.isComposite,
            defaultChild: this.defaultChild,
            isExpanded: this.isExpanded,
            children: Array.from(this.children.values()).map(child => child.toJSON())
        };
    }

    /**
     * 从JSON反序列化
     */
    static fromJSON(data) {
        const node = new HierarchicalStateNode(
            data.id,
            data.name,
            data.x,
            data.y,
            data.level
        );
        
        node.isInitial = data.isInitial || false;
        node.isFinal = data.isFinal || false;
        node.color = data.color;
        node.width = data.width || 120;
        node.height = data.height || 80;
        node.isComposite = data.isComposite || false;
        node.defaultChild = data.defaultChild || null;
        node.isExpanded = data.isExpanded !== false; // 默认展开
        
        // 递归创建子节点
        if (data.children && data.children.length > 0) {
            for (const childData of data.children) {
                const childNode = HierarchicalStateNode.fromJSON(childData);
                node.addChild(childNode);
            }
        }
        
        return node;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HierarchicalStateNode;
} else if (typeof window !== 'undefined') {
    window.HierarchicalStateNode = HierarchicalStateNode;
} 