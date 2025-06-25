class StateMachineEditor {
    constructor() {
        this.$guid = 0;
        this.states = new Map();
        this.transitions = [];
        this.selectedElement = null;
        this.isSimulating = false;
        this.currentState = null;
        this.history = [];
        this.historyIndex = -1;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.transitionMode = false;
        this.selectedStates = [];
        this.connectionMode = {
            active: false,
            fromState: null,
            previewLine: null
        };

        // 调试信息
        this.debugMode = true;
        this.debugLog = [];

        this.init();
        this.log('StateMachineEditor 初始化完成');
    }

    init() {
        this.setupEventListeners();
        this.createSampleStates();
        this.updateUI();
        this.createDebugPanel();
        this.updateGridBackground();
    }

    log(message) {
        if (this.debugMode) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `${timestamp}: ${message}`;
            console.log(logEntry);
            this.debugLog.push(logEntry);
            this.updateDebugPanel();
        }
    }

    createDebugPanel() {
        if (!this.debugMode) return;

        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 400px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            z-index: 1000;
            display: block;
        `;

        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 5px;">
                <span>调试面板</span>
                <button onclick="window.editor.toggleDebugPanel()" style="background: #333; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">隐藏</button>
            </div>
            <div id="debugLog" style="max-height: 150px; overflow-y: auto;"></div>
        `;

        document.body.appendChild(debugPanel);

        // 添加快捷键 Ctrl+D 显示/隐藏调试面板
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    toggleDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    updateDebugPanel() {
        const logDiv = document.getElementById('debugLog');
        if (logDiv) {
            logDiv.innerHTML = this.debugLog.slice(-20).map(entry => `<div>${entry}</div>`).join('');
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }

    setupEventListeners() {
        // 工具按钮事件
        document.getElementById('addStateBtn').addEventListener('click', () => this.addState());
        document.getElementById('addTransitionBtn').addEventListener('click', () => this.toggleTransitionMode());
        document.getElementById('simulateBtn').addEventListener('click', () => this.toggleSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // 导航按钮事件
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('importBtn').addEventListener('click', () => this.importStateMachine());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportStateMachine());

        // 缩放按钮事件
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('fitToScreenBtn').addEventListener('click', () => this.fitToScreen());

        // 画布事件
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        canvas.addEventListener('dblclick', (e) => this.onCanvasDoubleClick(e));
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // 模拟控制事件
        document.getElementById('triggerEventBtn').addEventListener('click', () => this.triggerEvent());
        document.getElementById('eventInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.triggerEvent();
        });

        // 模态框事件
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.hideModal();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            // 只有在没有输入框获得焦点时才处理删除键
            if ((e.key === 'Delete' || e.key === 'Backspace') &&
                !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.deleteSelectedElement();
            }
        });
    }

    addState(x = null, y = null) {
        const stateId = `state_${this.$guid++}`;
        const state = {
            id: stateId,
            name: `状态 ${this.states.size + 1}`,
            x: x || Math.random() * 500 + 150,
            y: y || Math.random() * 300 + 150,
            isInitial: this.states.size === 0,
            isFinal: false,
            color: this.getRandomColor()
        };

        this.states.set(stateId, state);
        this.saveToHistory('添加状态');
        this.updateUI();
        this.createStateElement(state);

        // 动画效果
        const element = document.getElementById(`state-${state.id}`);
        if (element) {
            element.style.transform = `scale(0)`;
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                element.style.transform = `scale(1)`;
                element.style.opacity = '1';

                // 动画完成后移除transition，避免干扰拖拽
                setTimeout(() => {
                    element.style.transition = '';
                }, 300);
            }, 10);
        }
    }

    // 计算颜色亮度，返回合适的文字颜色
    getTextColorForBackground(backgroundColor) {
        // 移除 # 符号
        const hex = backgroundColor.replace('#', '');
        
        // 转换为RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 计算亮度 (使用 WCAG 2.0 相对亮度公式)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // 如果背景较亮，使用深色文字；如果背景较暗，使用浅色文字
        return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
    }

    createStateElement(state) {
        const container = document.getElementById('statesContainer');
        const element = document.createElement('div');
        element.id = `state-${state.id}`;

        // 圆形状态节点，根据文本长度调整半径
        const textWidth = this.calculateTextWidth(state.name);
        const minRadius = 40;
        const maxRadius = 80;
        const padding = 10;
        // 基于文本宽度计算半径，但至少要容纳文本
        const textBasedRadius = Math.max(textWidth / 2 + padding, minRadius);
        const nodeRadius = Math.min(textBasedRadius, maxRadius);
        const nodeSize = nodeRadius * 2;

        // 根据背景色计算合适的文字颜色
        const textColor = this.getTextColorForBackground(state.color);

        element.className = `state-node absolute rounded-full flex items-center justify-center font-semibold text-base cursor-move pointer-events-auto shadow-lg`;
        element.style.left = `${state.x}px`;
        element.style.top = `${state.y}px`;
        element.style.width = `${nodeSize}px`;
        element.style.height = `${nodeSize}px`;
        element.style.backgroundColor = state.color;
        element.style.color = textColor; // 动态设置文字颜色

        if (state.isInitial) {
            element.classList.add('ring-4', 'ring-green-400');
        }
        if (state.isFinal) {
            element.classList.add('ring-4', 'ring-red-400');
        }

        element.innerHTML = `
            <div class="text-center px-2">
                <div class="text-sm font-medium truncate">${state.name}</div>
                <div class="flex justify-center space-x-1 mt-1">
                    ${state.isInitial ? '<i class="fas fa-play text-sm"></i>' : ''}
                    ${state.isFinal ? '<i class="fas fa-stop text-sm"></i>' : ''}
                </div>
            </div>
        `;

        // 事件监听
        element.addEventListener('click', (e) => {
            e.stopPropagation();

            // 如果处于连线模式，不处理普通点击事件
            if (this.connectionMode.active) {
                this.log(`状态节点点击被连线模式拦截: ${state.name}`);
                return;
            }

            this.handleStateClick(state);
        });

        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editState(state);
        });

        // 右键菜单
        element.addEventListener('contextmenu', (e) => {
            this.log(`右键点击状态: ${state.name}`);
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e, state);
        });

        this.makeDraggable(element, state);
        container.appendChild(element);
    }

    handleStateClick(state) {
        if (this.transitionMode) {
            if (this.selectedStates.length === 0) {
                this.selectedStates.push(state.id);
                this.highlightState(state.id, 'blue');
            } else if (this.selectedStates.length === 1 && this.selectedStates[0] !== state.id) {
                this.addTransition(this.selectedStates[0], state.id, 'event');
                this.clearStateHighlights();
                this.selectedStates = [];
                this.transitionMode = false;
                this.updateTransitionButton();
            }
        } else {
            this.selectState(state);
        }
    }

    toggleTransitionMode() {
        this.transitionMode = !this.transitionMode;
        this.updateTransitionButton();

        if (!this.transitionMode) {
            this.clearStateHighlights();
            this.selectedStates = [];
        }
    }

    updateTransitionButton() {
        const btn = document.getElementById('addTransitionBtn');
        if (this.transitionMode) {
            btn.classList.add('bg-yellow-200', 'text-yellow-800');
            btn.classList.remove('bg-green-100', 'text-green-800');
            btn.innerHTML = '<i class="fas fa-times text-lg mb-1"></i><div class="text-xs font-medium">取消转换</div>';
        } else {
            btn.classList.add('bg-green-100', 'text-green-800');
            btn.classList.remove('bg-yellow-200', 'text-yellow-800');
            btn.innerHTML = '<i class="fas fa-arrow-right text-lg mb-1"></i><div class="text-xs font-medium">添加转换</div>';
        }
    }

    highlightState(stateId, color) {
        const element = document.getElementById(`state-${stateId}`);
        if (element) {
            element.classList.add('ring-4', `ring-${color}-400`);
        }
    }

    clearStateHighlights() {
        document.querySelectorAll('.state-node').forEach(el => {
            el.classList.remove('ring-4', 'ring-blue-400', 'ring-yellow-400');
        });
    }

    makeDraggable(element, state) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = state.x;
            initialY = state.y;

            // 临时禁用transition以确保实时拖拽
            element.style.transition = 'none';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = (e.clientX - startX) / this.zoom;
            const deltaY = (e.clientY - startY) / this.zoom;

            state.x = initialX + deltaX;
            state.y = initialY + deltaY;

            // 立即更新状态位置
            element.style.left = `${state.x}px`;
            element.style.top = `${state.y}px`;

            this.updateTransitionsForState(state.id);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;

                // 恢复transition
                element.style.transition = '';

                this.updateTransitionsForState(state.id);
                this.saveToHistory('移动状态');
            }
        });
    }

    selectState(state) {
        // 取消之前的选择
        this.clearStateHighlights();

        // 选择新状态
        this.highlightState(state.id, 'blue');

        this.selectedElement = { type: 'state', data: state };
        this.updatePropertiesPanel();
    }

    editState(state) {
        this.showModal('编辑状态 Edit State', `
            <div class="space-y-4 modal-content">
                <div>
                    <label class="block text-sm font-medium mb-1">状态名称 State Name</label>
                    <input id="editStateName" type="text" value="${state.name}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="flex space-x-4">
                    <label class="flex items-center">
                        <input id="editInitialState" type="checkbox" ${state.isInitial ? 'checked' : ''} class="mr-2">
                        <span class="text-sm property-label">初始状态 Initial</span>
                    </label>
                    <label class="flex items-center">
                        <input id="editFinalState" type="checkbox" ${state.isFinal ? 'checked' : ''} class="mr-2">
                        <span class="text-sm property-label">终止状态 Final</span>
                    </label>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">颜色 Color</label>
                    <div class="flex space-x-2">
                        ${this.getColorOptions(state.color)}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button id="saveStateBtn" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-save mr-2"></i>保存 Save
                    </button>
                    <button id="deleteStateBtn" class="px-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash mr-2"></i>删除
                    </button>
                </div>
            </div>
        `);

        document.getElementById('saveStateBtn').addEventListener('click', () => {
            const newName = document.getElementById('editStateName').value.trim();
            if (!newName) {
                alert('状态名称不能为空');
                return;
            }

            state.name = newName;
            state.isInitial = document.getElementById('editInitialState').checked;
            state.isFinal = document.getElementById('editFinalState').checked;

            const selectedColor = document.querySelector('input[name="stateColor"]:checked');
            if (selectedColor) {
                state.color = selectedColor.value;
            }

            this.updateStateElement(state);
            this.saveToHistory('编辑状态');
            this.hideModal();
        });

        document.getElementById('deleteStateBtn').addEventListener('click', () => {
            if (confirm('确定要删除这个状态吗？')) {
                this.deleteState(state);
                this.hideModal();
            }
        });
    }

    getColorOptions(currentColor) {
        const colors = [
            '#4caf50', // 绿色 - 与背景对比度高
            '#ff9800', // 橙色 - 明亮醒目
            '#2196f3', // 蓝色 - 清晰可见
            '#f44336', // 红色 - 高对比度
            '#9c27b0', // 紫色 - 比原来更亮
            '#00bcd4', // 青色 - 明亮
            '#ffeb3b', // 黄色 - 高亮醒目
            '#e91e63'  // 粉红色 - 鲜艳对比
        ];

        return colors.map(color => `
            <label class="cursor-pointer">
                <input type="radio" name="stateColor" value="${color}" ${color === currentColor ? 'checked' : ''} class="sr-only">
                <div class="w-8 h-8 rounded-full border-2 hover:border-opacity-60 transition-colors" 
                     style="background-color: ${color}; border-color: var(--md-outline);"></div>
            </label>
        `).join('');
    }

    deleteState(state) {
        // 删除相关转换
        this.transitions = this.transitions.filter(t =>
            t.from !== state.id && t.to !== state.id
        );

        // 删除状态元素
        const element = document.getElementById(`state-${state.id}`);
        if (element) {
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(0)';
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }

        // 删除状态数据
        this.states.delete(state.id);

        this.saveToHistory('删除状态');
        this.updateUI();
    }

    updateStateElement(state) {
        const element = document.getElementById(`state-${state.id}`);
        if (!element) return;

        // 根据背景色计算合适的文字颜色
        const textColor = this.getTextColorForBackground(state.color);

        element.style.backgroundColor = state.color;
        element.style.color = textColor; // 应用动态文字颜色
        element.innerHTML = `
            <div class="text-center px-2">
                <div class="text-sm font-medium truncate">${state.name}</div>
                <div class="flex justify-center space-x-1 mt-1">
                    ${state.isInitial ? '<i class="fas fa-play text-sm"></i>' : ''}
                    ${state.isFinal ? '<i class="fas fa-stop text-sm"></i>' : ''}
                </div>
            </div>
        `;

        // 计算新的圆形节点尺寸
        const textWidth = this.calculateTextWidth(state.name);
        const minRadius = 40;
        const maxRadius = 80;
        const padding = 10;
        const textBasedRadius = Math.max(textWidth / 2 + padding, minRadius);
        const nodeRadius = Math.min(textBasedRadius, maxRadius);
        const nodeSize = nodeRadius * 2;

        // 更新样式和尺寸 (移除固定的text-white)
        element.className = `state-node absolute rounded-full flex items-center justify-center font-semibold text-base cursor-move pointer-events-auto shadow-lg`;
        element.style.width = `${nodeSize}px`;
        element.style.height = `${nodeSize}px`;

        if (state.isInitial) element.classList.add('ring-4', 'ring-green-400');
        if (state.isFinal) element.classList.add('ring-4', 'ring-red-400');
    }

    addTransition(fromId, toId, event = 'event', condition = '') {
        this.log(`添加转换开始 - 从: ${fromId}, 到: ${toId}, 事件: ${event}`);

        const fromState = this.states.get(fromId);
        const toState = this.states.get(toId);

        if (!fromState || !toState) {
            this.log(`转换添加失败 - 状态不存在: 从状态=${!!fromState}, 到状态=${!!toState}`);
            return;
        }

        const transition = {
            id: `transition_${Date.now()}`,
            from: fromId,
            to: toId,
            event: event,
            condition: condition
        };

        this.transitions.push(transition);
        this.log(`转换已添加 - ID: ${transition.id}, 总转换数: ${this.transitions.length}`);

        this.saveToHistory('添加转换');
        this.updateTransitions();
        this.updateUI();

        this.log('转换添加完成，UI已更新');
    }

    updateTransitions() {
        this.log(`更新转换 - 总数: ${this.transitions.length}`);

        const svg = document.getElementById('svgCanvas');
        if (!svg) {
            this.log('错误：SVG画布未找到');
            return;
        }

        const existingElements = svg.querySelectorAll('.transition-line, .transition-stroke, .transition-click-area, .transition-text, .transition-label-bg');
        this.log(`清除现有转换元素: ${existingElements.length}个`);
        existingElements.forEach(element => element.remove());

        this.transitions.forEach((transition, index) => {
            this.log(`绘制转换 ${index + 1}: ${transition.from} -> ${transition.to}`);
            this.drawTransition(transition);
        });

        this.log('转换更新完成');
    }

    updateTransitionsForState(stateId) {
        this.log(`更新状态 ${stateId} 相关的转换`);

        const svg = document.getElementById('svgCanvas');
        if (!svg) {
            this.log('错误：SVG画布未找到');
            return;
        }

        // 找到与该状态相关的所有转换
        const relatedTransitions = this.transitions.filter(t =>
            t.from === stateId || t.to === stateId
        );

        this.log(`找到 ${relatedTransitions.length} 个相关转换 (总共 ${this.transitions.length} 个转换，节省 ${this.transitions.length - relatedTransitions.length} 个转换的重绘)`);

        // 只移除与该状态相关的转换元素
        relatedTransitions.forEach(transition => {
            const elementsToRemove = svg.querySelectorAll(
                `[data-transition-id="${transition.id}"]`
            );
            elementsToRemove.forEach(element => element.remove());
        });

        // 重新绘制相关转换
        relatedTransitions.forEach(transition => {
            this.log(`重绘转换: ${transition.from} -> ${transition.to}`);
            this.drawTransition(transition);
        });

        this.log('相关转换更新完成');
    }

    addTransitionLabel(transition, startX, startY, endX, endY, isLoop) {
        const svg = document.getElementById('svgCanvas');

        // 计算标签位置
        let labelX, labelY;
        if (isLoop) {
            // 自循环标签位置 - 在圆弧外侧
            labelX = startX + 45;
            labelY = startY - 25;
        } else {
            // 直线连线标签位置 - 在线条中点
            labelX = (startX + endX) / 2;
            labelY = (startY + endY) / 2;

            // 根据线条角度调整标签位置，避免与线条重叠
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);

            // 将标签稍微偏移到线条上方
            const offsetDistance = 15;
            const perpAngle = angle - Math.PI / 2; // 垂直向上
            labelX += Math.cos(perpAngle) * offsetDistance;
            labelY += Math.sin(perpAngle) * offsetDistance;
        }

        // 创建标签背景
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const textWidth = transition.event.length * 7;
        const padding = 6;

        labelBg.setAttribute('x', labelX - textWidth / 2 - padding);
        labelBg.setAttribute('y', labelY - 8);
        labelBg.setAttribute('width', textWidth + padding * 2);
        labelBg.setAttribute('height', 16);
        labelBg.setAttribute('rx', '8');
        labelBg.setAttribute('ry', '8');
        labelBg.setAttribute('fill', '#2a2a2a');
        labelBg.setAttribute('stroke', '#FFD700');
        labelBg.setAttribute('stroke-width', '1');
        labelBg.setAttribute('class', 'transition-label-bg');
        labelBg.setAttribute('filter', 'url(#labelGlow)');
        labelBg.setAttribute('data-transition-id', transition.id);

        // 创建标签文字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
        text.setAttribute('class', 'transition-text');
        text.setAttribute('data-transition-id', transition.id);
        text.textContent = transition.event;

        svg.appendChild(labelBg);
        svg.appendChild(text);
    }

    drawTransition(transition) {
        const fromState = this.states.get(transition.from);
        const toState = this.states.get(transition.to);

        if (!fromState || !toState) return;

        const svg = document.getElementById('svgCanvas');

        // 获取节点的实际尺寸来计算中心点和半径
        const fromElement = document.getElementById(`state-${fromState.id}`);
        const toElement = document.getElementById(`state-${toState.id}`);
        const fromSize = fromElement ? fromElement.offsetWidth : 80;
        const toSize = toElement ? toElement.offsetWidth : 80;
        const fromRadius = fromSize / 2;
        const toRadius = toSize / 2;

        // 计算节点中心点
        const fromCenterX = fromState.x + fromRadius;
        const fromCenterY = fromState.y + fromRadius;
        const toCenterX = toState.x + toRadius;
        const toCenterY = toState.y + toRadius;

        let startX, startY, endX, endY, pathData;

        if (fromState.id === toState.id) {
            // 自循环连线 - 从圆形右边到上边
            startX = fromCenterX + fromRadius;
            startY = fromCenterY;
            endX = fromCenterX;
            endY = fromCenterY - fromRadius;

            // 让自循环箭头也稍微远离节点边缘
            const arrowOffset = fromRadius * 0.2; // 半径的20%作为偏移
            endY -= arrowOffset;

            const loopRadius = fromRadius * 0.8;
            // 简单的圆弧路径
            pathData = `M ${startX} ${startY}
                       A ${loopRadius} ${loopRadius} 0 1 1 ${endX} ${endY}`;
        } else {
            // 检查是否存在反向连线（双向连线）
            const hasReverse = this.transitions.some(t =>
                t.from === transition.to && t.to === transition.from && t.id !== transition.id
            );

            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // 计算圆形边缘的连接点
            startX = fromCenterX + Math.cos(angle) * fromRadius;
            startY = fromCenterY + Math.sin(angle) * fromRadius;
            endX = toCenterX - Math.cos(angle) * toRadius;
            endY = toCenterY - Math.sin(angle) * toRadius;

            if (hasReverse) {
                // 双向连线：创建真正的平行线
                const offsetDistance = 8; // 平行线间距的一半
                const perpAngle = angle + Math.PI / 2; // 垂直于连线方向的角度

                // 使用状态ID的字符串比较，确保偏移方向一致
                const fromId = transition.from;
                const toId = transition.to;
                const shouldOffsetUp = fromId < toId;
                const offsetDirection = shouldOffsetUp ? 1 : -1;

                // 计算垂直偏移向量
                const perpOffsetX = Math.cos(perpAngle) * offsetDistance * offsetDirection;
                const perpOffsetY = Math.sin(perpAngle) * offsetDistance * offsetDirection;

                // 偏移两个圆的中心点
                const offsetFromCenterX = fromCenterX + perpOffsetX;
                const offsetFromCenterY = fromCenterY + perpOffsetY;
                const offsetToCenterX = toCenterX + perpOffsetX;
                const offsetToCenterY = toCenterY + perpOffsetY;

                // 重新计算基于偏移中心点的圆形边缘连接点
                startX = offsetFromCenterX + Math.cos(angle) * fromRadius;
                startY = offsetFromCenterY + Math.sin(angle) * fromRadius;
                endX = offsetToCenterX - Math.cos(angle) * toRadius;
                endY = offsetToCenterY - Math.sin(angle) * toRadius;
            }

            // 直线路径
            pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        }

        // 创建点击区域（透明粗线，便于点击）
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        clickArea.setAttribute('d', pathData);
        clickArea.setAttribute('stroke', 'transparent');
        clickArea.setAttribute('stroke-width', '12'); // 较粗的点击区域
        clickArea.setAttribute('fill', 'none');
        clickArea.setAttribute('stroke-linecap', 'round');
        clickArea.setAttribute('cursor', 'pointer');
        clickArea.setAttribute('data-transition-id', transition.id);
        clickArea.classList.add('transition-click-area');

        // 创建描边路径（外层粗线）
        const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        strokePath.setAttribute('d', pathData);
        strokePath.setAttribute('stroke', '#B8860B'); // 暗金色描边，与明黄色主线协调
        strokePath.setAttribute('stroke-width', '4');
        strokePath.setAttribute('fill', 'none');
        strokePath.setAttribute('stroke-linecap', 'round');
        strokePath.setAttribute('opacity', '0.8');
        strokePath.setAttribute('data-transition-id', transition.id);
        strokePath.classList.add('transition-stroke');

        // 创建主路径（内层亮线）
        const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mainPath.setAttribute('d', pathData);
        mainPath.setAttribute('stroke', '#FFD700'); // 明黄色
        mainPath.setAttribute('stroke-width', '2');
        mainPath.setAttribute('fill', 'none');
        mainPath.setAttribute('stroke-linecap', 'round');
        // 只在末端添加箭头
        mainPath.setAttribute('marker-end', 'url(#blueprintArrowSmall)');
        mainPath.setAttribute('filter', 'url(#connectionGlow)');
        mainPath.setAttribute('data-transition-id', transition.id);
        mainPath.classList.add('transition-line');

        // 添加事件监听器到点击区域
        [clickArea, strokePath, mainPath].forEach(path => {
            path.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTransition(transition);
            });

            path.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.editTransition(transition);
            });
        });

        // 鼠标悬停效果
        const addHoverEffect = (element) => {
            element.addEventListener('mouseenter', () => {
                mainPath.setAttribute('stroke', '#FFFF00'); // 更亮的黄色
                mainPath.setAttribute('stroke-width', '3');
                strokePath.setAttribute('stroke', '#DAA520'); // 悬停时更亮的金色描边
                strokePath.setAttribute('stroke-width', '5');
                strokePath.setAttribute('opacity', '1');
            });

            element.addEventListener('mouseleave', () => {
                mainPath.setAttribute('stroke', '#FFD700'); // 恢复明黄色
                mainPath.setAttribute('stroke-width', '2');
                strokePath.setAttribute('stroke', '#B8860B'); // 恢复暗金色描边
                strokePath.setAttribute('stroke-width', '4');
                strokePath.setAttribute('opacity', '0.8');
            });
        };

        addHoverEffect(clickArea);
        addHoverEffect(strokePath);
        addHoverEffect(mainPath);

        // 先添加点击区域，再添加描边，最后添加主线
        svg.appendChild(clickArea);
        svg.appendChild(strokePath);
        svg.appendChild(mainPath);

        // 添加标签
        if (transition.event !== 'event') {
            this.addTransitionLabel(transition, startX, startY, endX, endY, fromState.id === toState.id);
        }
    }

    selectTransition(transition) {
        this.selectedElement = { type: 'transition', data: transition };
        this.updatePropertiesPanel();
    }

    editTransition(transition) {
        this.showModal('编辑转换 Edit Transition', `
            <div class="space-y-4 modal-content">
                <div>
                    <label class="block text-sm font-medium mb-1">事件名称 Event Name</label>
                    <input id="editTransitionEvent" type="text" value="${transition.event}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">条件 Condition (可选)</label>
                    <input id="editTransitionCondition" type="text" value="${transition.condition || ''}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="例如: x > 0">
                </div>
                <div class="flex space-x-2">
                    <button id="saveTransitionBtn" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-save mr-2"></i>保存 Save
                    </button>
                    <button id="deleteTransitionBtn" class="px-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash mr-2"></i>删除
                    </button>
                </div>
            </div>
        `);

        document.getElementById('saveTransitionBtn').addEventListener('click', () => {
            const newEvent = document.getElementById('editTransitionEvent').value.trim();
            if (!newEvent) {
                alert('事件名称不能为空');
                return;
            }

            transition.event = newEvent;
            transition.condition = document.getElementById('editTransitionCondition').value.trim();

            this.updateTransitions();
            this.saveToHistory('编辑转换');
            this.hideModal();
        });

        document.getElementById('deleteTransitionBtn').addEventListener('click', () => {
            if (confirm('确定要删除这个转换吗？')) {
                this.deleteTransition(transition);
                this.hideModal();
            }
        });
    }

    deleteTransition(transition) {
        this.transitions = this.transitions.filter(t => t.id !== transition.id);
        this.updateTransitions();
        this.saveToHistory('删除转换');
        this.updateUI();
    }

    toggleSimulation() {
        this.isSimulating = !this.isSimulating;
        const btn = document.getElementById('simulateBtn');

        if (this.isSimulating) {
            btn.innerHTML = '<i class="fas fa-stop text-lg mb-1"></i><div class="text-xs font-medium">停止模拟</div>';
            btn.className = 'tool-btn bg-red-100 hover:bg-red-200 text-red-800 p-3 rounded-lg transition-all duration-200';
            this.startSimulation();
        } else {
            btn.innerHTML = '<i class="fas fa-play text-lg mb-1"></i><div class="text-xs font-medium">模拟运行</div>';
            btn.className = 'tool-btn bg-purple-100 hover:bg-purple-200 text-purple-800 p-3 rounded-lg transition-all duration-200';
            this.stopSimulation();
        }
    }

    startSimulation() {
        const initialState = Array.from(this.states.values()).find(s => s.isInitial);
        if (!initialState) {
            alert('请先设置初始状态');
            this.toggleSimulation();
            return;
        }

        this.currentState = initialState.id;
        this.updateCurrentStateDisplay();
        this.highlightCurrentState();
        this.addToHistory(`开始模拟 - 初始状态: ${initialState.name}`);
    }

    stopSimulation() {
        this.currentState = null;
        this.updateCurrentStateDisplay();
        this.removeStateHighlights();
        this.addToHistory('停止模拟');
    }

    triggerEvent() {
        if (!this.isSimulating || !this.currentState) {
            alert('请先开始模拟');
            return;
        }

        const eventName = document.getElementById('eventInput').value.trim();
        if (!eventName) {
            alert('请输入事件名称');
            return;
        }

        const transition = this.transitions.find(t =>
            t.from === this.currentState && t.event === eventName
        );

        if (transition) {
            const fromState = this.states.get(this.currentState);
            const toState = this.states.get(transition.to);

            this.currentState = transition.to;
            this.updateCurrentStateDisplay();
            this.highlightCurrentState();
            this.addToHistory(`事件: ${eventName} -> ${toState.name}`);
            document.getElementById('eventInput').value = '';

            // 检查是否到达终止状态
            if (toState.isFinal) {
                alert('已到达终止状态！');
            }
        } else {
            alert(`当前状态没有对应事件 "${eventName}" 的转换`);
        }
    }

    updateCurrentStateDisplay() {
        const display = document.getElementById('currentState');
        if (this.currentState) {
            const state = this.states.get(this.currentState);
            display.textContent = state ? state.name : '未知状态';
            display.className = 'md-secondary-btn px-3 py-2 rounded text-sm font-medium';
        } else {
            display.textContent = '未开始';
            display.className = 'md-surface px-3 py-2 rounded text-sm';
            display.style.color = 'var(--md-on-surface-variant)';
        }
    }

    highlightCurrentState() {
        this.removeStateHighlights();

        if (this.currentState) {
            const element = document.getElementById(`state-${this.currentState}`);
            if (element) {
                element.style.filter = 'url(#glow)';
                element.classList.add('animate-pulse');
            }
        }
    }

    removeStateHighlights() {
        document.querySelectorAll('.state-node').forEach(el => {
            el.style.filter = '';
            el.classList.remove('animate-pulse');
        });
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;

        if (this.selectedElement.type === 'state') {
            this.deleteState(this.selectedElement.data);
        } else if (this.selectedElement.type === 'transition') {
            this.deleteTransition(this.selectedElement.data);
        }

        this.selectedElement = null;
        this.updatePropertiesPanel();
    }

    calculateTextWidth(text) {
        // 创建临时元素来测量文本宽度
        const tempElement = document.createElement('span');
        tempElement.style.visibility = 'hidden';
        tempElement.style.position = 'absolute';
        tempElement.style.fontSize = '12px';
        tempElement.style.fontWeight = '600';
        tempElement.style.fontFamily = 'Inter, system-ui, sans-serif';
        tempElement.textContent = text;

        document.body.appendChild(tempElement);
        const width = tempElement.offsetWidth;
        document.body.removeChild(tempElement);

        return width;
    }

    showContextMenu(event, state) {
        this.log(`显示右键菜单 - 状态: ${state.name}, 位置: (${event.clientX}, ${event.clientY})`);

        // 移除已存在的右键菜单
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.className = 'fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50';
        menu.style.minWidth = '150px';

        // 计算菜单位置，防止超出屏幕
        const menuWidth = 150;
        const menuHeight = 120;
        let left = event.clientX;
        let top = event.clientY;

        // 检查右边界
        if (left + menuWidth > window.innerWidth) {
            left = event.clientX - menuWidth;
        }

        // 检查下边界
        if (top + menuHeight > window.innerHeight) {
            top = event.clientY - menuHeight;
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        menu.innerHTML = `
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
                <i class="fas fa-arrow-right mr-2"></i>开始连线
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
                <i class="fas fa-edit mr-2"></i>编辑状态
            </div>
            <div class="context-menu-item px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600 transition-colors">
                <i class="fas fa-trash mr-2"></i>删除状态
            </div>
        `;

        // 添加菜单项事件
        const menuItems = menu.querySelectorAll('.context-menu-item');
        menuItems[0].addEventListener('click', (e) => {
            this.log('菜单项点击: 开始连线模式');
            e.stopPropagation();
            this.startConnectionMode(state);
            this.hideContextMenu();
        });
        menuItems[1].addEventListener('click', (e) => {
            this.log('菜单项点击: 编辑状态');
            e.stopPropagation();
            this.editState(state);
            this.hideContextMenu();
        });
        menuItems[2].addEventListener('click', (e) => {
            this.log('菜单项点击: 删除状态');
            e.stopPropagation();
            this.deleteState(state);
            this.hideContextMenu();
        });

        document.body.appendChild(menu);

        // 点击其他地方隐藏菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 10);
    }

    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.remove();
        }
    }

    startConnectionMode(fromState) {
        this.log(`启动连线模式 - 起始状态: ${fromState.name}`);

        this.connectionMode = {
            active: true,
            fromState: fromState,
            previewLine: null
        };

        // 创建预览连线
        this.createPreviewLine();

        // 改变鼠标样式
        document.body.style.cursor = 'crosshair';

        // 高亮可连接的状态节点
        this.highlightConnectableStates(fromState);

        // 显示连线提示
        this.showConnectionHint();

        // 绑定事件处理函数
        this.boundConnectionMouseMove = this.onConnectionMouseMove.bind(this);
        this.boundConnectionClick = this.onConnectionClick.bind(this);
        this.boundConnectionKeyDown = this.onConnectionKeyDown.bind(this);

        // 添加鼠标移动监听
        document.addEventListener('mousemove', this.boundConnectionMouseMove);
        document.addEventListener('click', this.boundConnectionClick, true); // 使用捕获模式确保优先处理
        document.addEventListener('keydown', this.boundConnectionKeyDown);

        this.log('连线模式已启动，事件监听器已绑定');
    }

    highlightConnectableStates(fromState) {
        this.states.forEach(state => {
            if (state.id !== fromState.id) {
                const element = document.getElementById(`state-${state.id}`);
                if (element) {
                    element.style.boxShadow = '0 0 10px #FFD700';
                    element.style.border = '2px solid #FFD700';
                    this.log(`高亮可连接状态: ${state.name}`);
                }
            }
        });
    }

    clearConnectableHighlights() {
        this.states.forEach(state => {
            const element = document.getElementById(`state-${state.id}`);
            if (element) {
                element.style.boxShadow = '';
                element.style.border = '';
            }
        });
    }

    createPreviewLine() {
        if (!this.connectionMode.active) return;

        const svg = document.getElementById('svgCanvas');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = 'previewLine';
        line.setAttribute('stroke', '#FFD700');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.classList.add('preview-line');

        svg.appendChild(line);
        this.connectionMode.previewLine = line;
    }

    onConnectionMouseMove(event) {
        if (!this.connectionMode.active || !this.connectionMode.previewLine) return;

        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - this.panX) / this.zoom;
        const mouseY = (event.clientY - rect.top - this.panY) / this.zoom;

        // 更新预览线条
        const fromElement = document.getElementById(`state-${this.connectionMode.fromState.id}`);
        if (fromElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const fromX = (fromRect.left + fromRect.width / 2 - canvasRect.left - this.panX) / this.zoom;
            const fromY = (fromRect.top + fromRect.height / 2 - canvasRect.top - this.panY) / this.zoom;

            this.connectionMode.previewLine.setAttribute('x1', fromX);
            this.connectionMode.previewLine.setAttribute('y1', fromY);
            this.connectionMode.previewLine.setAttribute('x2', mouseX);
            this.connectionMode.previewLine.setAttribute('y2', mouseY);
        }
    }

    onConnectionClick(event) {
        if (!this.connectionMode.active) {
            this.log('连线点击事件：连线模式未激活');
            return;
        }

        // 阻止事件冒泡和默认行为
        event.preventDefault();
        event.stopPropagation();

        this.log(`连线点击事件 - 目标: ${event.target.tagName}, 类名: ${event.target.className}, ID: ${event.target.id}`);

        // 检查是否点击在状态节点上
        const target = event.target.closest('.state-node');
        if (target) {
            const stateId = target.id.replace('state-', '');
            const toState = this.states.get(stateId);

            this.log(`找到目标状态 - 元素ID: ${target.id}, 解析状态ID: ${stateId}, 状态存在: ${!!toState}`);

            if (toState && toState.id !== this.connectionMode.fromState.id) {
                this.log(`创建连线: ${this.connectionMode.fromState.name} -> ${toState.name}`);
                // 创建连接
                this.addTransition(this.connectionMode.fromState.id, toState.id, 'event');
                this.endConnectionMode();
                return;
            } else if (toState && toState.id === this.connectionMode.fromState.id) {
                this.log('无法连接到自身');
                this.endConnectionMode();
                return;
            } else {
                this.log('目标状态无效或不存在');
            }
        } else {
            this.log('未找到状态节点目标');
        }

        // 检查是否点击在连线上（阻止默认连线行为）
        if (event.target.closest('.transition-line, .transition-stroke, .transition-click-area')) {
            this.log('点击在连线上，取消连线模式');
            this.endConnectionMode();
            return;
        }

        // 点击空白处取消连线模式
        this.log('点击空白处或无效目标，取消连线模式');
        this.endConnectionMode();
    }

    onConnectionKeyDown(event) {
        if (event.key === 'Escape') {
            this.endConnectionMode();
        }
    }

    endConnectionMode() {
        if (!this.connectionMode.active) {
            this.log('结束连线模式：连线模式未激活');
            return;
        }

        this.log('结束连线模式');

        // 移除预览线
        if (this.connectionMode.previewLine) {
            this.connectionMode.previewLine.remove();
            this.log('预览线已移除');
        }

        // 恢复鼠标样式
        document.body.style.cursor = '';

        // 清除状态高亮
        this.clearConnectableHighlights();

        // 移除事件监听
        if (this.boundConnectionMouseMove) {
            document.removeEventListener('mousemove', this.boundConnectionMouseMove);
        }
        if (this.boundConnectionClick) {
            document.removeEventListener('click', this.boundConnectionClick, true); // 对应捕获模式的移除
        }
        if (this.boundConnectionKeyDown) {
            document.removeEventListener('keydown', this.boundConnectionKeyDown);
        }

        this.log('事件监听器已清理');

        // 重置连线模式
        this.connectionMode = {
            active: false,
            fromState: null,
            previewLine: null
        };

        // 隐藏连线提示
        this.hideConnectionHint();

        this.log('连线模式已完全重置');
    }

    showConnectionHint() {
        // 移除已存在的提示
        this.hideConnectionHint();

        const hint = document.createElement('div');
        hint.id = 'connectionHint';
        hint.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50';
        hint.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-info-circle"></i>
                <span class="text-sm font-medium">连线模式：点击目标状态完成连线，按ESC键取消</span>
            </div>
        `;

        document.body.appendChild(hint);
    }

    hideConnectionHint() {
        const hint = document.getElementById('connectionHint');
        if (hint) {
            hint.remove();
        }
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('selectedElementInfo');

        if (!this.selectedElement) {
            panel.innerHTML = `
                <div class="text-center" style="color: var(--md-on-surface-variant);">
                    <i class="fas fa-mouse-pointer text-2xl mb-2"></i>
                    <p class="text-sm">点击状态或转换查看属性</p>
                    <p class="text-xs mt-1">Click state or transition to view properties</p>
                </div>
            `;
            return;
        }

        if (this.selectedElement.type === 'state') {
            const state = this.selectedElement.data;
            panel.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: ${state.color}"></div>
                        <h4 class="font-semibold" style="color: var(--md-on-surface);">状态属性 State Properties</h4>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div><span class="property-label">名称:</span> <span class="property-value">${state.name}</span></div>
                        <div><span class="property-label">ID:</span> <code>${state.id}</code></div>
                        <div><span class="property-label">位置:</span> <span class="property-value">(${Math.round(state.x)}, ${Math.round(state.y)})</span></div>
                        <div><span class="property-label">初始状态:</span> <span class="property-value">${state.isInitial ? '✓ 是' : '✗ 否'}</span></div>
                        <div><span class="property-label">终止状态:</span> <span class="property-value">${state.isFinal ? '✓ 是' : '✗ 否'}</span></div>
                    </div>
                    <button onclick="window.editor.editState(window.editor.selectedElement.data)" 
                            class="w-full md-primary-btn py-2 px-3 rounded text-sm transition-colors">
                        <i class="fas fa-edit mr-2"></i>编辑状态
                    </button>
                </div>
            `;
        } else if (this.selectedElement.type === 'transition') {
            const transition = this.selectedElement.data;
            const fromState = this.states.get(transition.from);
            const toState = this.states.get(transition.to);

            panel.innerHTML = `
                <div class="space-y-3">
                    <h4 class="font-semibold" style="color: var(--md-on-surface);">转换属性 Transition Properties</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="property-label">从:</span> <span class="property-value">${fromState?.name || '未知'}</span></div>
                        <div><span class="property-label">到:</span> <span class="property-value">${toState?.name || '未知'}</span></div>
                        <div><span class="property-label">事件:</span> <code>${transition.event}</code></div>
                        <div><span class="property-label">条件:</span> <span class="property-value">${transition.condition || '无'}</span></div>
                    </div>
                    <button onclick="window.editor.editTransition(window.editor.selectedElement.data)" 
                            class="w-full md-primary-btn py-2 px-3 rounded text-sm transition-colors">
                        <i class="fas fa-edit mr-2"></i>编辑转换
                    </button>
                </div>
            `;
        }
    }

    updateUI() {
        document.getElementById('statesCount').textContent = this.states.size;
        document.getElementById('transitionsCount').textContent = this.transitions.length;
        this.updateStatesList();
        this.updateTransitions();
    }

    updateStatesList() {
        const list = document.getElementById('statesList');
        list.innerHTML = '';

        if (this.states.size === 0) {
            list.innerHTML = '<div class="text-center py-4" style="color: var(--md-on-surface-variant);"><i class="fas fa-plus-circle mb-2"></i><p class="text-sm">暂无状态</p></div>';
            return;
        }

        this.states.forEach(state => {
            const item = document.createElement('div');
            item.className = 'md-surface-variant p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors shadow-sm';
            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${state.color}"></div>
                        <span class="text-sm font-medium" style="color: var(--md-on-surface-variant);">${state.name}</span>
                    </div>
                    <div class="flex space-x-1">
                        ${state.isInitial ? '<i class="fas fa-play text-xs" style="color: var(--md-success);" title="初始状态"></i>' : ''}
                        ${state.isFinal ? '<i class="fas fa-stop text-xs" style="color: var(--md-error);" title="终止状态"></i>' : ''}
                    </div>
                </div>
            `;

            item.addEventListener('click', () => this.selectState(state));
            list.appendChild(item);
        });
    }

    addToHistory(action) {
        const historyList = document.getElementById('historyList');
        const item = document.createElement('div');
        item.className = 'md-surface-variant p-3 rounded-lg text-sm';
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-medium" style="color: var(--md-on-surface);">${action}</div>
                    <div class="text-xs" style="color: var(--md-on-surface-variant);">${new Date().toLocaleTimeString()}</div>
                </div>
                <i class="fas fa-history" style="color: var(--md-on-surface-variant);"></i>
            </div>
        `;

        historyList.insertBefore(item, historyList.firstChild);

        if (historyList.children.length > 20) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    saveToHistory(action) {
        const state = {
            states: new Map(this.states),
            transitions: [...this.transitions],
            action: action
        };

        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;

        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.addToHistory(action);
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
            this.addToHistory('撤销操作');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
            this.addToHistory('重做操作');
        }
    }

    restoreFromHistory() {
        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            const state = this.history[this.historyIndex];
            this.states = new Map(state.states);
            this.transitions = [...state.transitions];

            document.getElementById('statesContainer').innerHTML = '';
            this.states.forEach(state => this.createStateElement(state));
            this.updateUI();
        }
    }

    reset() {
        if (confirm('确定要重置状态机吗？这将清除所有状态和转换。')) {
            this.states.clear();
            this.transitions = [];
            this.selectedElement = null;
            this.currentState = null;
            this.isSimulating = false;

            document.getElementById('statesContainer').innerHTML = '';
            document.getElementById('svgCanvas').innerHTML = `
                <defs>
                    <!-- Blueprint风格箭头 - 小号版本 -->
                    <marker id="blueprintArrowSmall" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                        <path d="M0,0 L0,5 L7,2.5 z" fill="#FFD700" stroke="#FFD700" stroke-width="0.5"/>
                    </marker>
                    
                    <!-- 连线渐变 - 正常状态 -->
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#00D4AA;stop-opacity:0.9" />
                        <stop offset="50%" style="stop-color:#00E5BB;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00F2CC;stop-opacity:0.9" />
                    </linearGradient>
                    
                    <!-- 连线渐变 - 悬停状态 -->
                    <linearGradient id="connectionGradientHover" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:0.9" />
                        <stop offset="50%" style="stop-color:#FF8E8E;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#FFB1B1;stop-opacity:0.9" />
                    </linearGradient>
                    

                    
                    <!-- 连线发光效果 -->
                    <filter id="connectionGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    <!-- 标签发光效果 -->
                    <filter id="labelGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    <!-- 状态节点发光效果 -->
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
            `;

            this.updateUI();
            this.saveToHistory('重置状态机');
        }
    }

    importStateMachine() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.loadStateMachineData(data);
                } catch (error) {
                    alert('导入失败：文件格式不正确或数据损坏\n' + error.message);
                }
            };
            reader.readAsText(file);
        });

        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    loadStateMachineData(data) {
        try {
            // 验证数据格式
            if (!data.states || !data.transitions) {
                throw new Error('缺少必要的状态机数据（states 或 transitions）');
            }

            // 清空当前状态机
            this.states.clear();
            this.transitions = [];
            this.selectedElement = null;
            this.currentState = null;
            this.isSimulating = false;
            document.getElementById('statesContainer').innerHTML = '';

            // 重置 GUID 计数器，避免ID冲突
            this.$guid = 0;

            // 导入状态
            if (Array.isArray(data.states)) {
                data.states.forEach(stateData => {
                    // 验证状态数据
                    const state = {
                        id: stateData.id || `state_${this.$guid++}`,
                        name: stateData.name || '未命名状态',
                        x: stateData.x || 100,
                        y: stateData.y || 100,
                        isInitial: stateData.isInitial || false,
                        isFinal: stateData.isFinal || false,
                        color: stateData.color || this.getRandomColor()
                    };

                    this.states.set(state.id, state);
                    this.createStateElement(state);

                    // 更新GUID计数器
                    const idNumber = parseInt(state.id.split('_')[1]);
                    if (!isNaN(idNumber) && idNumber >= this.$guid) {
                        this.$guid = idNumber + 1;
                    }
                });
            }

            // 导入转换
            if (Array.isArray(data.transitions)) {
                data.transitions.forEach(transitionData => {
                    // 验证转换数据
                    if (this.states.has(transitionData.from) && this.states.has(transitionData.to)) {
                        const transition = {
                            id: transitionData.id || `transition_${Date.now()}_${Math.random()}`,
                            from: transitionData.from,
                            to: transitionData.to,
                            event: transitionData.event || 'event',
                            condition: transitionData.condition || ''
                        };

                        this.transitions.push(transition);
                    } else {
                        console.warn('跳过无效转换：', transitionData);
                    }
                });
            }

            // 重新渲染SVG定义
            document.getElementById('svgCanvas').innerHTML = `
                <defs>
                    <!-- Blueprint风格箭头 - 小号版本 -->
                    <marker id="blueprintArrowSmall" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                        <path d="M0,0 L0,5 L7,2.5 z" fill="#FFD700" stroke="#FFD700" stroke-width="0.5"/>
                    </marker>
                    
                    <!-- 连线渐变 - 正常状态 -->
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#00D4AA;stop-opacity:0.9" />
                        <stop offset="50%" style="stop-color:#00E5BB;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00F2CC;stop-opacity:0.9" />
                    </linearGradient>
                    
                    <!-- 连线渐变 - 悬停状态 -->
                    <linearGradient id="connectionGradientHover" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:0.9" />
                        <stop offset="50%" style="stop-color:#FF8E8E;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#FFB1B1;stop-opacity:0.9" />
                    </linearGradient>
                    
                    <!-- 连线发光效果 -->
                    <filter id="connectionGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    <!-- 标签发光效果 -->
                    <filter id="labelGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    <!-- 状态节点发光效果 -->
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
            `;

            // 更新界面
            this.updateUI();
            this.saveToHistory('导入状态机');

            // 显示导入成功信息
            const statesCount = data.states ? data.states.length : 0;
            const transitionsCount = data.transitions ? data.transitions.length : 0;
            const metadata = data.metadata || {};
            
            alert(`导入成功！\n状态数量：${statesCount}\n转换数量：${transitionsCount}\n${metadata.name ? '名称：' + metadata.name : ''}\n${metadata.created ? '创建时间：' + new Date(metadata.created).toLocaleString() : ''}`);
            
            this.log(`导入完成 - 状态：${statesCount}个，转换：${transitionsCount}个`);

        } catch (error) {
            alert('导入失败：' + error.message);
            console.error('导入错误：', error);
        }
    }

    exportStateMachine() {
        const data = {
            states: Array.from(this.states.values()),
            transitions: this.transitions,
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0',
                name: '状态机导出'
            }
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `state-machine-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addToHistory('导出状态机');
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.3);
        this.updateZoom();
    }

    fitToScreen() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    }

    updateZoom() {
        const container = document.getElementById('statesContainer');
        const svg = document.getElementById('svgCanvas');
        const canvas = document.getElementById('canvas');

        container.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        svg.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        
        // 更新网格背景以跟随缩放和平移
        this.updateGridBackground();
    }

    updateGridBackground() {
        const canvas = document.getElementById('canvas');
        const gridSize = 12 * this.zoom; // 细网格大小
        const majorGridSize = 120 * this.zoom; // 粗网格大小 (每10个细网格)
        
        // 计算网格偏移量
        const offsetX = (this.panX * this.zoom) % gridSize;
        const offsetY = (this.panY * this.zoom) % gridSize;
        const majorOffsetX = (this.panX * this.zoom) % majorGridSize;
        const majorOffsetY = (this.panY * this.zoom) % majorGridSize;

        canvas.style.backgroundSize = `${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`;
        canvas.style.backgroundPosition = `${majorOffsetX}px ${majorOffsetY}px, ${majorOffsetX}px ${majorOffsetY}px, ${offsetX}px ${offsetY}px, ${offsetX}px ${offsetY}px`;
    }

    onCanvasClick(e) {
        if (e.target.id === 'canvas') {
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.clearStateHighlights();
            this.hideContextMenu();
        }
    }

    onCanvasDoubleClick(e) {
        if (e.target.id === 'canvas') {
            const rect = e.target.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - this.panY) / this.zoom;
            this.addState(x - 40, y - 40);
        }
    }

    onMouseDown(e) {
        if (e.target.id === 'canvas' && e.button === 0) {
            this.isDragging = true;
            this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
            e.target.style.cursor = 'grabbing';
        }
    }

    onMouseMove(e) {
        if (this.isDragging) {
            this.panX = e.clientX - this.dragStart.x;
            this.panY = e.clientY - this.dragStart.y;
            this.updateZoom();
        }
    }

    onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            e.target.style.cursor = 'crosshair';
        }
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.3, Math.min(3, this.zoom * delta));
        this.updateZoom();
    }

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        const modal = document.getElementById('modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    hideModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    getRandomColor() {
        const colors = [
            '#4caf50', // 绿色 - 与背景对比度高
            '#ff9800', // 橙色 - 明亮醒目
            '#2196f3', // 蓝色 - 清晰可见
            '#f44336', // 红色 - 高对比度
            '#9c27b0', // 紫色 - 比原来更亮
            '#00bcd4', // 青色 - 明亮
            '#ffeb3b', // 黄色 - 高亮醒目
            '#e91e63'  // 粉红色 - 鲜艳对比
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createSampleStates() {
        // 创建示例状态机
        const state1 = { x: 200, y: 150 };
        const state2 = { x: 400, y: 400 };
        const state3 = { x: 600, y: 150 };

        this.addState(state1.x, state1.y);
        this.addState(state2.x, state2.y);
        this.addState(state3.x, state3.y);

        const states = Array.from(this.states.keys());
        if (states.length >= 3) {
            this.addTransition(states[0], states[1], 'start');
            this.addTransition(states[1], states[2], 'finish');
            this.addTransition(states[2], states[0], 'reset');

            // 设置最后一个状态为终止状态
            const lastState = this.states.get(states[2]);
            lastState.isFinal = true;
            this.updateStateElement(lastState);
        }
        this.updateTransitions();
    }
}

// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new StateMachineEditor();
}); 