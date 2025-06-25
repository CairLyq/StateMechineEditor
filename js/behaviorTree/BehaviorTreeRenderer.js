/**
 * 行为树编辑器 - 渲染器
 * Behavior Tree Editor - Renderer
 */

class BehaviorTreeRenderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        
        // 渲染配置
        this.config = {
            node: {
                borderRadius: 8,
                borderWidth: 2,
                shadowBlur: 4,
                shadowOffset: { x: 2, y: 2 },
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                padding: 8
            },
            connection: {
                lineWidth: 2,
                arrowSize: 8,
                curveOffset: 30
            },
            animation: {
                duration: 300,
                easing: 'easeOutCubic'
            }
        };
        
        // 渲染缓存
        this.cache = new Map();
        this.animationQueue = [];
        this.isAnimating = false;
        
        // 性能监控
        this.renderStats = {
            nodesRendered: 0,
            connectionsRendered: 0,
            renderTime: 0,
            fps: 0
        };
        
        this.setupCanvas();
    }

    /**
     * 设置画布
     */
    setupCanvas() {
        // 设置高DPI支持
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 设置文本渲染质量
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染整个行为树
     */
    render(tree, viewport = { x: 0, y: 0, zoom: 1 }) {
        const startTime = performance.now();
        
        this.clear();
        
        // 应用视口变换
        this.ctx.save();
        this.ctx.translate(viewport.x, viewport.y);
        this.ctx.scale(viewport.zoom, viewport.zoom);
        
        if (tree && tree.root) {
            // 先渲染连接线，再渲染节点
            this.renderConnections(tree.root);
            this.renderNodes(tree.root);
        }
        
        this.ctx.restore();
        
        // 更新性能统计
        this.renderStats.renderTime = performance.now() - startTime;
        
        // 渲染调试信息
        this.renderDebugInfo();
    }

    /**
     * 渲染节点
     */
    renderNodes(rootNode) {
        const nodes = [rootNode, ...rootNode.getDescendants()];
        this.renderStats.nodesRendered = nodes.length;
        
        nodes.forEach(node => {
            this.renderNode(node);
        });
    }

    /**
     * 渲染单个节点
     */
    renderNode(node) {
        const { x, y, width, height } = node;
        const config = this.config.node;
        
        // 获取节点样式
        const style = this.getNodeStyle(node);
        
        // 绘制阴影
        if (!node.isSelected) {
            this.ctx.save();
            this.ctx.shadowBlur = config.shadowBlur;
            this.ctx.shadowOffsetX = config.shadowOffset.x;
            this.ctx.shadowOffsetY = config.shadowOffset.y;
            this.ctx.shadowColor = config.shadowColor;
            
            this.drawRoundedRect(x, y, width, height, config.borderRadius, style.backgroundColor);
            
            this.ctx.restore();
        }
        
        // 绘制节点主体
        this.drawRoundedRect(x, y, width, height, config.borderRadius, style.backgroundColor);
        
        // 绘制边框
        this.ctx.strokeStyle = style.borderColor;
        this.ctx.lineWidth = node.isSelected ? config.borderWidth * 2 : config.borderWidth;
        this.drawRoundedRect(x, y, width, height, config.borderRadius, null, true);
        
        // 绘制状态指示器
        this.renderStatusIndicator(node);
        
        // 绘制图标
        this.renderNodeIcon(node);
        
        // 绘制文本
        this.renderNodeText(node);
        
        // 绘制连接点
        this.renderConnectionPoints(node);
        
        // 绘制选择效果
        if (node.isSelected) {
            this.renderSelectionEffect(node);
        }
        
        // 绘制运行效果
        if (node.status === NodeStatus.RUNNING) {
            this.renderRunningEffect(node);
        }
    }

    /**
     * 获取节点样式
     */
    getNodeStyle(node) {
        const baseColor = node.metadata.color;
        const category = node.metadata.category;
        
        // 根据状态调整颜色
        let backgroundColor = baseColor;
        let borderColor = baseColor;
        
        if (node.status === NodeStatus.SUCCESS) {
            backgroundColor = '#10b981';
            borderColor = '#059669';
        } else if (node.status === NodeStatus.FAILURE) {
            backgroundColor = '#ef4444';
            borderColor = '#dc2626';
        } else if (node.status === NodeStatus.RUNNING) {
            backgroundColor = '#3b82f6';
            borderColor = '#2563eb';
        } else if (node.isSelected) {
            borderColor = '#f59e0b';
        }
        
        return {
            backgroundColor,
            borderColor,
            textColor: this.getContrastColor(backgroundColor)
        };
    }

    /**
     * 绘制圆角矩形
     */
    drawRoundedRect(x, y, width, height, radius, fillColor = null, strokeOnly = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        if (!strokeOnly && fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        
        if (strokeOnly || !fillColor) {
            this.ctx.stroke();
        }
    }

    /**
     * 渲染状态指示器
     */
    renderStatusIndicator(node) {
        const { x, y, width } = node;
        const indicatorSize = 8;
        const indicatorX = x + width - indicatorSize - 4;
        const indicatorY = y + 4;
        
        this.ctx.beginPath();
        this.ctx.arc(indicatorX + indicatorSize / 2, indicatorY + indicatorSize / 2, 
                    indicatorSize / 2, 0, 2 * Math.PI);
        this.ctx.fillStyle = node.getStatusColor();
        this.ctx.fill();
        
        if (node.status === NodeStatus.RUNNING) {
            // 添加脉冲效果
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 4) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            this.ctx.beginPath();
            this.ctx.arc(indicatorX + indicatorSize / 2, indicatorY + indicatorSize / 2, 
                        indicatorSize / 2 + 2, 0, 2 * Math.PI);
            this.ctx.fillStyle = node.getStatusColor();
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    /**
     * 渲染节点图标
     */
    renderNodeIcon(node) {
        const { x, y, width, height } = node;
        const iconSize = 16;
        const iconX = x + 8;
        const iconY = y + height / 2;
        
        // 这里使用简单的图形代替字体图标
        this.ctx.save();
        this.ctx.fillStyle = this.getNodeStyle(node).textColor;
        
        switch (node.type) {
            case NodeType.SELECTOR:
                this.drawSelectorIcon(iconX, iconY, iconSize);
                break;
            case NodeType.SEQUENCE:
                this.drawSequenceIcon(iconX, iconY, iconSize);
                break;
            case NodeType.PARALLEL:
                this.drawParallelIcon(iconX, iconY, iconSize);
                break;
            case NodeType.ACTION:
                this.drawActionIcon(iconX, iconY, iconSize);
                break;
            case NodeType.CONDITION:
                this.drawConditionIcon(iconX, iconY, iconSize);
                break;
            default:
                this.drawDefaultIcon(iconX, iconY, iconSize);
        }
        
        this.ctx.restore();
    }

    /**
     * 绘制选择器图标
     */
    drawSelectorIcon(x, y, size) {
        const half = size / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - half, y - half);
        this.ctx.lineTo(x + half, y);
        this.ctx.lineTo(x - half, y + half);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 绘制序列器图标
     */
    drawSequenceIcon(x, y, size) {
        const half = size / 2;
        this.ctx.fillRect(x - half, y - half, size, size / 4);
        this.ctx.fillRect(x - half, y - size / 8, size, size / 4);
        this.ctx.fillRect(x - half, y + size / 8, size, size / 4);
    }

    /**
     * 绘制并行器图标
     */
    drawParallelIcon(x, y, size) {
        const half = size / 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(x - half + i * size / 3, y - half, size / 6, size);
        }
    }

    /**
     * 绘制动作图标
     */
    drawActionIcon(x, y, size) {
        const half = size / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - half, y - half);
        this.ctx.lineTo(x + half, y);
        this.ctx.lineTo(x - half, y + half);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 绘制条件图标
     */
    drawConditionIcon(x, y, size) {
        const half = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, half, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.save();
        this.ctx.fillStyle = this.getContrastColor(this.ctx.fillStyle);
        this.ctx.font = `${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('?', x, y);
        this.ctx.restore();
    }

    /**
     * 绘制默认图标
     */
    drawDefaultIcon(x, y, size) {
        const half = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, half, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * 渲染节点文本
     */
    renderNodeText(node) {
        const { x, y, width, height } = node;
        const config = this.config.node;
        const style = this.getNodeStyle(node);
        
        this.ctx.save();
        this.ctx.fillStyle = style.textColor;
        this.ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 文本区域
        const textX = x + width / 2;
        const textY = y + height / 2;
        const maxWidth = width - config.padding * 2 - 24; // 留出图标空间
        
        // 处理文本换行
        const text = node.name;
        const lines = this.wrapText(text, maxWidth);
        const lineHeight = config.fontSize + 2;
        const totalHeight = lines.length * lineHeight;
        const startY = textY - totalHeight / 2 + lineHeight / 2;
        
        lines.forEach((line, index) => {
            this.ctx.fillText(line, textX, startY + index * lineHeight);
        });
        
        this.ctx.restore();
    }

    /**
     * 文本换行处理
     */
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [text];
    }

    /**
     * 渲染连接点
     */
    renderConnectionPoints(node) {
        const points = node.getConnectionPoints();
        const pointSize = 4;
        
        // 输入连接点
        if (node.parent) {
            this.ctx.beginPath();
            this.ctx.arc(points.input.x, points.input.y, pointSize, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = node.metadata.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // 输出连接点
        if (node.children.length > 0) {
            this.ctx.beginPath();
            this.ctx.arc(points.output.x, points.output.y, pointSize, 0, 2 * Math.PI);
            this.ctx.fillStyle = node.metadata.color;
            this.ctx.fill();
        }
    }

    /**
     * 渲染连接线
     */
    renderConnections(rootNode) {
        const nodes = [rootNode, ...rootNode.getDescendants()];
        let connectionCount = 0;
        
        nodes.forEach(node => {
            node.children.forEach(child => {
                this.renderConnection(node, child);
                connectionCount++;
            });
        });
        
        this.renderStats.connectionsRendered = connectionCount;
    }

    /**
     * 渲染单个连接线
     */
    renderConnection(parentNode, childNode) {
        const parentPoint = parentNode.getConnectionPoints().output;
        const childPoint = childNode.getConnectionPoints().input;
        
        const config = this.config.connection;
        
        this.ctx.save();
        this.ctx.strokeStyle = parentNode.metadata.color;
        this.ctx.lineWidth = config.lineWidth;
        this.ctx.lineCap = 'round';
        
        // 绘制贝塞尔曲线
        this.ctx.beginPath();
        this.ctx.moveTo(parentPoint.x, parentPoint.y);
        
        const controlY1 = parentPoint.y + config.curveOffset;
        const controlY2 = childPoint.y - config.curveOffset;
        
        this.ctx.bezierCurveTo(
            parentPoint.x, controlY1,
            childPoint.x, controlY2,
            childPoint.x, childPoint.y
        );
        
        this.ctx.stroke();
        
        // 绘制箭头
        this.drawArrow(childPoint.x, childPoint.y, Math.PI / 2, config.arrowSize);
        
        this.ctx.restore();
    }

    /**
     * 绘制箭头
     */
    drawArrow(x, y, angle, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size / 2, -size);
        this.ctx.lineTo(size / 2, -size);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    /**
     * 渲染选择效果
     */
    renderSelectionEffect(node) {
        const { x, y, width, height } = node;
        const padding = 4;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.drawRoundedRect(
            x - padding, y - padding,
            width + padding * 2, height + padding * 2,
            this.config.node.borderRadius + padding,
            null, true
        );
        
        this.ctx.restore();
    }

    /**
     * 渲染运行效果
     */
    renderRunningEffect(node) {
        const { x, y, width, height } = node;
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;
        
        this.ctx.save();
        this.ctx.globalAlpha = pulse * 0.5;
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 4;
        
        this.drawRoundedRect(x - 2, y - 2, width + 4, height + 4, 
                           this.config.node.borderRadius + 2, null, true);
        
        this.ctx.restore();
    }

    /**
     * 渲染调试信息
     */
    renderDebugInfo() {
        if (!window.BehaviorTreeEditor?.debug) return;
        
        const info = [
            `节点: ${this.renderStats.nodesRendered}`,
            `连接: ${this.renderStats.connectionsRendered}`,
            `渲染时间: ${this.renderStats.renderTime.toFixed(2)}ms`,
            `FPS: ${this.renderStats.fps}`
        ];
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        info.forEach((line, index) => {
            this.ctx.fillText(line, 15, 15 + index * 16);
        });
        
        this.ctx.restore();
    }

    /**
     * 获取对比色
     */
    getContrastColor(hexColor) {
        // 处理不同格式的颜色
        if (typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
            return '#000000';
        }
        
        if (hexColor.length === 4) {
            // 简短格式 #rgb -> #rrggbb
            hexColor = '#' + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2] + hexColor[3] + hexColor[3];
        }
        
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    /**
     * 更新FPS
     */
    updateFPS() {
        if (!this.lastTime) {
            this.lastTime = performance.now();
            return;
        }
        
        const now = performance.now();
        const delta = now - this.lastTime;
        this.renderStats.fps = Math.round(1000 / delta);
        this.lastTime = now;
    }

    /**
     * 缓存管理
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 获取节点在画布上的位置
     */
    getCanvasPosition(node, viewport) {
        return {
            x: (node.x + viewport.x) * viewport.zoom,
            y: (node.y + viewport.y) * viewport.zoom,
            width: node.width * viewport.zoom,
            height: node.height * viewport.zoom
        };
    }

    /**
     * 检查节点是否在视口内
     */
    isNodeVisible(node, viewport, canvasWidth, canvasHeight) {
        const pos = this.getCanvasPosition(node, viewport);
        return pos.x + pos.width >= 0 && pos.x <= canvasWidth &&
               pos.y + pos.height >= 0 && pos.y <= canvasHeight;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviorTreeRenderer;
} else if (typeof window !== 'undefined') {
    window.BehaviorTreeRenderer = BehaviorTreeRenderer;
} 