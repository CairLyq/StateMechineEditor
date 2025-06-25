/**
 * 分层状态机渲染器
 * 负责分层状态节点和转换的可视化渲染
 */
class HierarchicalRenderer {
    constructor(canvas, svgCanvas) {
        this.canvas = canvas;
        this.svgCanvas = svgCanvas;
        this.statesContainer = canvas.querySelector('#statesContainer') || canvas;
        this.nodeElements = new Map(); // 节点元素缓存
        this.transitionElements = new Map(); // 转换元素缓存
        this.expanderElements = new Map(); // 展开/折叠按钮元素缓存
        
        // 渲染配置
        this.config = {
            nodeMinWidth: 120,
            nodeMinHeight: 80,
            levelIndent: 30, // 每层级的缩进
            childrenSpacing: 20, // 子节点间距
            expanderSize: 16, // 展开/折叠按钮大小
            borderWidth: 2,
            shadowOffset: 4,
            fontSizes: {
                0: 14, // 根级字体大小
                1: 13,
                2: 12,
                3: 11,
                default: 10
            }
        };
    }

    /**
     * 渲染单个分层状态节点
     */
    renderStateNode(node) {
        let element = this.nodeElements.get(node.id);
        
        if (!element) {
            element = this.createElement(node);
            this.nodeElements.set(node.id, element);
            this.statesContainer.appendChild(element);
        }
        
        this.updateNodeElement(element, node);
        
        // 渲染子节点（如果展开）
        if (node.isExpanded && node.children.size > 0) {
            for (const child of node.children.values()) {
                this.renderStateNode(child);
            }
        }
        
        return element;
    }

    /**
     * 创建节点DOM元素
     */
    createElement(node) {
        const element = document.createElement('div');
        element.id = `hstate-${node.id}`;
        element.className = 'hierarchical-state-node';
        element.setAttribute('data-node-id', node.id);
        element.setAttribute('data-level', node.level);
        
        // 设置基本样式
        element.style.cssText = `
            position: absolute;
            cursor: move;
            user-select: none;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(8px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        // 创建节点内容
        const content = document.createElement('div');
        content.className = 'node-content';
        content.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 8px;
        `;
        
        // 节点名称
        const nameElement = document.createElement('div');
        nameElement.className = 'node-name';
        nameElement.style.cssText = `
            font-weight: 600;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
        `;
        
        // 状态类型指示器
        const typeIndicator = document.createElement('div');
        typeIndicator.className = 'type-indicator';
        typeIndicator.style.cssText = `
            font-size: 10px;
            opacity: 0.8;
            margin-top: 2px;
        `;
        
        content.appendChild(nameElement);
        content.appendChild(typeIndicator);
        element.appendChild(content);
        
        // 如果是复合状态，添加展开/折叠按钮
        if (node.isComposite) {
            this.addExpanderButton(element, node);
        }
        
        // 添加层级指示器
        this.addLevelIndicator(element, node);
        
        return element;
    }

    /**
     * 更新节点元素
     */
    updateNodeElement(element, node) {
        // 缓存当前状态以避免不必要的更新
        const currentState = {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            color: node.color,
            name: node.name,
            level: node.level,
            isInitial: node.isInitial,
            isFinal: node.isFinal,
            isComposite: node.isComposite,
            childrenCount: node.children.size,
            isExpanded: node.isExpanded
        };
        
        const lastState = element._lastState;
        const hasChanged = !lastState || Object.keys(currentState).some(key => 
            currentState[key] !== lastState[key]
        );
        
        if (!hasChanged) {
            return; // 状态没有变化，跳过更新
        }
        
        // 批量更新样式以减少重绘
        const styles = {};
        
        // 位置更新 - 统一使用 left/top 定位
        if (!lastState || lastState.x !== currentState.x || lastState.y !== currentState.y) {
            styles.left = `${node.x}px`;
            styles.top = `${node.y}px`;
            // 清除可能存在的 transform
            styles.transform = '';
        }
        
        // 尺寸更新
        if (!lastState || lastState.width !== currentState.width || lastState.height !== currentState.height) {
            styles.width = `${node.width}px`;
            styles.height = `${node.height}px`;
        }
        
        // 颜色更新
        if (!lastState || lastState.color !== currentState.color) {
            styles.backgroundColor = node.color;
            styles.color = this.getTextColor(node.color);
        }
        
        // 字体大小更新
        if (!lastState || lastState.level !== currentState.level) {
            const fontSize = this.config.fontSizes[node.level] || this.config.fontSizes.default;
            styles.fontSize = `${fontSize}px`;
        }
        
        // 批量应用样式
        Object.assign(element.style, styles);
        
        // 更新内容（只在必要时）
        if (!lastState || lastState.name !== currentState.name) {
            const nameElement = element.querySelector('.node-name');
            if (nameElement) {
                nameElement.textContent = node.name;
            }
        }
        
        // 更新类型指示器
        if (!lastState || 
            lastState.isInitial !== currentState.isInitial ||
            lastState.isFinal !== currentState.isFinal ||
            lastState.isComposite !== currentState.isComposite ||
            lastState.childrenCount !== currentState.childrenCount) {
            
            const typeIndicator = element.querySelector('.type-indicator');
            if (typeIndicator) {
                let typeText = '';
                if (node.isInitial) typeText += '▶ ';
                if (node.isFinal) typeText += '⏹ ';
                if (node.isComposite) typeText += `📁(${node.children.size}) `;
                typeIndicator.textContent = typeText;
            }
        }
        
        // 更新展开按钮（只在必要时）
        if (node.isComposite && (!lastState || lastState.isExpanded !== currentState.isExpanded)) {
            this.updateExpanderButton(element, node);
        }
        
        // 更新层级样式（只在层级变化时）
        if (!lastState || lastState.level !== currentState.level) {
            this.updateLevelStyling(element, node);
        }
        
        // 更新子节点可见性（只在展开状态变化时）
        if (node.isComposite && (!lastState || lastState.isExpanded !== currentState.isExpanded)) {
            this.updateChildrenVisibility(node);
        }
        
        // 缓存当前状态
        element._lastState = currentState;
    }

    /**
     * 添加展开/折叠按钮
     */
    addExpanderButton(element, node) {
        let expander = this.expanderElements.get(node.id);
        
        if (!expander) {
            expander = document.createElement('div');
            expander.className = 'expander-button';
            expander.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                width: ${this.config.expanderSize}px;
                height: ${this.config.expanderSize}px;
                background: #2196f3;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 10px;
                font-weight: bold;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                z-index: 10;
                transition: all 0.2s ease;
            `;
            
            expander.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onExpanderClick(node);
            });
            
            element.appendChild(expander);
            this.expanderElements.set(node.id, expander);
        }
        
        this.updateExpanderButton(element, node);
    }

    /**
     * 更新展开按钮
     */
    updateExpanderButton(element, node) {
        const expander = this.expanderElements.get(node.id);
        if (expander) {
            expander.textContent = node.isExpanded ? '−' : '+';
            expander.title = node.isExpanded ? '折叠子状态' : '展开子状态';
        }
    }

    /**
     * 添加层级指示器
     */
    addLevelIndicator(element, node) {
        if (node.level > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'level-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: 4px;
                left: 4px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                font-size: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            indicator.textContent = node.level;
            element.appendChild(indicator);
        }
    }

    /**
     * 更新层级样式
     */
    updateLevelStyling(element, node) {
        // 根据层级调整透明度和边框
        const opacity = Math.max(0.7, 1 - node.level * 0.1);
        element.style.opacity = opacity;
        
        // 层级越深，边框越细
        const borderWidth = Math.max(1, this.config.borderWidth - node.level);
        element.style.borderWidth = `${borderWidth}px`;
        
        // 添加层级特定的类名
        element.className = `hierarchical-state-node level-${node.level}`;
        if (node.isComposite) {
            element.classList.add('composite-state');
        }
        if (node.isLeaf()) {
            element.classList.add('leaf-state');
        }
    }

    /**
     * 更新子节点可见性
     */
    updateChildrenVisibility(node) {
        if (!node.isComposite) return;
        
        for (const child of node.children.values()) {
            const childElement = this.nodeElements.get(child.id);
            if (childElement) {
                childElement.style.display = node.isExpanded ? 'flex' : 'none';
                
                // 递归更新子节点的子节点
                if (child.isComposite) {
                    this.updateChildrenVisibility(child);
                }
            }
        }
    }

    /**
     * 展开按钮点击事件处理
     */
    onExpanderClick(node) {
        node.toggleExpansion();
        this.updateChildrenVisibility(node);
        this.updateExpanderButton(null, node);
        
        // 触发自定义事件
        this.canvas.dispatchEvent(new CustomEvent('nodeExpansionChanged', {
            detail: { node, isExpanded: node.isExpanded }
        }));
    }

    /**
     * 渲染分层转换
     */
    renderTransition(transition, fromNode, toNode) {
        // 计算连接点
        const startPoint = this.getConnectionPoint(fromNode, toNode, 'start');
        const endPoint = this.getConnectionPoint(toNode, fromNode, 'end');
        
        // 创建或更新SVG路径
        let pathElement = this.transitionElements.get(transition.id);
        
        if (!pathElement) {
            pathElement = this.createTransitionElement(transition);
            this.transitionElements.set(transition.id, pathElement);
            this.svgCanvas.appendChild(pathElement);
        }
        
        this.updateTransitionPath(pathElement, startPoint, endPoint, transition);
        
        return pathElement;
    }

    /**
     * 创建转换SVG元素
     */
    createTransitionElement(transition) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `htransition-${transition.id}`;
        g.setAttribute('class', 'hierarchical-transition');
        g.setAttribute('data-transition-id', transition.id);
        
        // 创建路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.getTransitionColor(transition));
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        // 创建标签背景
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBg.setAttribute('fill', 'rgba(0, 0, 0, 0.7)'); // 深色背景以突出白色文字
        labelBg.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)'); // 白色边框
        labelBg.setAttribute('rx', '4');
        
        // 创建标签文本
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('dominant-baseline', 'middle');
        labelText.setAttribute('font-size', '12');
        labelText.setAttribute('font-weight', '500');
        labelText.setAttribute('fill', 'white'); // 设置文字颜色为白色
        
        g.appendChild(path);
        g.appendChild(labelBg);
        g.appendChild(labelText);
        
        return g;
    }

    /**
     * 更新转换路径
     */
    updateTransitionPath(pathElement, startPoint, endPoint, transition) {
        const path = pathElement.querySelector('path');
        const labelBg = pathElement.querySelector('rect');
        const labelText = pathElement.querySelector('text');
        
        // 缓存之前的路径数据以避免不必要的更新
        const cacheKey = `${startPoint.x},${startPoint.y},${endPoint.x},${endPoint.y}`;
        if (pathElement._lastPathCache === cacheKey) {
            return; // 位置没有变化，跳过更新
        }
        pathElement._lastPathCache = cacheKey;
        
        // 计算贝塞尔曲线控制点
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 优化曲线控制点计算
        const curvature = Math.min(distance * 0.25, 60); // 减少曲率以简化计算
        const cp1x = startPoint.x + dx * 0.25;
        const cp1y = startPoint.y - curvature * 0.8;
        const cp2x = endPoint.x - dx * 0.25;
        const cp2y = endPoint.y - curvature * 0.8;
        
        const pathData = `M ${startPoint.x.toFixed(1)} ${startPoint.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${endPoint.x.toFixed(1)} ${endPoint.y.toFixed(1)}`;
        path.setAttribute('d', pathData);
        
        // 优化标签更新
        this.updateTransitionLabel(labelText, labelBg, startPoint, endPoint, curvature, transition);
    }

    /**
     * 优化的标签更新方法
     */
    updateTransitionLabel(labelText, labelBg, startPoint, endPoint, curvature, transition) {
        // 计算标签位置
        const midX = (startPoint.x + endPoint.x) * 0.5;
        const midY = (startPoint.y + endPoint.y) * 0.5 - curvature * 0.4;
        
        const labelContent = this.getTransitionLabel(transition);
        
        // 只在标签内容变化时更新文本
        if (labelText.textContent !== labelContent) {
            labelText.textContent = labelContent;
        }
        
        // 批量更新属性
        labelText.setAttribute('x', midX.toFixed(1));
        labelText.setAttribute('y', midY.toFixed(1));
        
        // 使用缓存的边界框大小避免频繁的getBBox调用
        if (!labelText._cachedBBox || labelText.textContent !== labelText._lastContent) {
            labelText._cachedBBox = labelText.getBBox();
            labelText._lastContent = labelText.textContent;
        }
        
        const bbox = labelText._cachedBBox;
        const padding = 4;
        
        // 批量更新背景属性
        labelBg.setAttribute('x', (bbox.x - padding).toFixed(1));
        labelBg.setAttribute('y', (bbox.y - 2).toFixed(1));
        labelBg.setAttribute('width', (bbox.width + padding * 2).toFixed(1));
        labelBg.setAttribute('height', (bbox.height + 4).toFixed(1));
    }

    /**
     * 优化的连接点计算
     */
    getConnectionPoint(fromNode, toNode, type) {
        // 缓存计算结果
        const cacheKey = `${fromNode.id}-${toNode.id}-${fromNode.x}-${fromNode.y}-${toNode.x}-${toNode.y}`;
        if (this._connectionPointCache && this._connectionPointCache[cacheKey]) {
            return this._connectionPointCache[cacheKey];
        }
        
        if (!this._connectionPointCache) {
            this._connectionPointCache = {};
        }
        
        const fromCenterX = fromNode.x + fromNode.width * 0.5;
        const fromCenterY = fromNode.y + fromNode.height * 0.5;
        const toCenterX = toNode.x + toNode.width * 0.5;
        const toCenterY = toNode.y + toNode.height * 0.5;
        
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        
        const nodeWidth = fromNode.width * 0.5;
        const nodeHeight = fromNode.height * 0.5;
        
        let x, y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平连接
            x = fromCenterX + (dx > 0 ? nodeWidth : -nodeWidth);
            y = fromCenterY + (nodeHeight * dy) / Math.abs(dx);
        } else {
            // 垂直连接
            x = fromCenterX + (nodeWidth * dx) / Math.abs(dy);
            y = fromCenterY + (dy > 0 ? nodeHeight : -nodeHeight);
        }
        
        const result = { x: x, y: y };
        
        // 缓存结果，但限制缓存大小
        if (Object.keys(this._connectionPointCache).length > 100) {
            this._connectionPointCache = {}; // 清空缓存
        }
        this._connectionPointCache[cacheKey] = result;
        
        return result;
    }

    /**
     * 获取转换颜色
     */
    getTransitionColor(transition) {
        switch (transition.type) {
            case 'internal': return '#4caf50';
            case 'external': return '#2196f3';
            case 'self': return '#ff9800';
            case 'history': return '#9c27b0';
            default: return '#666666';
        }
    }

    /**
     * 获取转换标签
     */
    getTransitionLabel(transition) {
        let label = transition.event;
        if (transition.condition) {
            label += ` [${transition.condition}]`;
        }
        return label;
    }

    /**
     * 计算文本颜色
     */
    getTextColor(backgroundColor) {
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    /**
     * 清理节点元素
     */
    removeStateNode(nodeId) {
        const element = this.nodeElements.get(nodeId);
        if (element) {
            element.remove();
            this.nodeElements.delete(nodeId);
        }
        
        const expander = this.expanderElements.get(nodeId);
        if (expander) {
            this.expanderElements.delete(nodeId);
        }
    }

    /**
     * 清理转换元素
     */
    removeTransition(transitionId) {
        const element = this.transitionElements.get(transitionId);
        if (element) {
            element.remove();
            this.transitionElements.delete(transitionId);
        }
    }

    /**
     * 清理所有元素
     */
    clear() {
        this.nodeElements.forEach(element => element.remove());
        this.transitionElements.forEach(element => element.remove());
        this.nodeElements.clear();
        this.transitionElements.clear();
        this.expanderElements.clear();
    }

    /**
     * 获取节点元素
     */
    getNodeElement(nodeId) {
        return this.nodeElements.get(nodeId);
    }

    /**
     * 获取转换元素
     */
    getTransitionElement(transitionId) {
        return this.transitionElements.get(transitionId);
    }

    /**
     * 清理缓存
     */
    clearCaches() {
        this._connectionPointCache = {};
        // 清理路径元素的缓存
        this.transitionElements.forEach(element => {
            element._lastPathCache = null;
            const labelText = element.querySelector('text');
            if (labelText) {
                labelText._cachedBBox = null;
                labelText._lastContent = null;
            }
        });
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HierarchicalRenderer;
} else if (typeof window !== 'undefined') {
    window.HierarchicalRenderer = HierarchicalRenderer;
} 