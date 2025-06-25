/**
 * 分层有限状态机 (Hierarchical Finite State Machine, HFSM)
 * 提供标准的分层状态机实现，支持状态嵌套、事件处理、状态历史等功能
 */

// ==================== 本地接口和类型定义 ====================

/**
 * 状态接口
 */
export interface IState {
    /** 状态名称 */
    name: string;
    /** 进入状态时调用 */
    onEnter?(context: any): void;
    /** 状态更新时调用 */
    onUpdate?(context: any, deltaTime: number): void;
    /** 退出状态时调用 */
    onExit?(context: any): void;
    /** 检查是否可以转换到其他状态 */
    canTransitionTo?(targetState: string, context: any): boolean;
}

/**
 * 状态转换条件接口
 */
export interface ITransitionCondition {
    /** 检查转换条件 */
    check(context: any): boolean;
    /** 转换优先级，数字越大优先级越高 */
    priority?: number;
}

/**
 * 状态转换定义
 */
export interface IStateTransition {
    /** 目标状态名称 */
    targetState: string;
    /** 转换条件 */
    condition: ITransitionCondition;
}

/**
 * 事件处理器接口
 */
export interface IEventHandler {
    /** 事件名称 */
    eventName: string;
    /** 处理事件 */
    handle(event: StateEvent, stateMachine: HierarchicalStateMachine): void;
}

/**
 * 状态机配置选项
 */
export interface IStateMachineOptions {
    /** 是否启用调试模式 */
    debug?: boolean;
    /** 最大历史记录数 */
    maxHistorySize?: number;
    /** 是否启用事件队列 */
    enableEventQueue?: boolean;
    /** 自定义日志函数 */
    logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

// ==================== 分层状态接口 ====================

/**
 * 分层状态接口
 */
export interface IHState extends IState {
    /** 父状态 */
    parent?: IHState;
    /** 子状态列表 */
    children?: IHState[];
    /** 当前活跃的子状态 */
    activeChild?: IHState;
    /** 默认子状态名称 */
    defaultChild?: string;
    /** 状态深度（根状态为0） */
    depth: number;
    /** 获取完整状态路径 */
    getFullPath(): string;
    /** 获取状态层次结构 */
    getHierarchy(): string[];
    /** 检查是否为叶子状态（没有子状态） */
    isLeaf(): boolean;
    /** 检查是否为根状态（没有父状态） */
    isRoot(): boolean;
    /** 获取根状态 */
    getRoot(): IHState;
    /** 查找子状态 */
    findChild(childName: string): IHState | undefined;
    /** 添加子状态 */
    addChild(child: IHState): void;
    /** 移除子状态 */
    removeChild(childName: string): boolean;
    /** 设置默认子状态 */
    setDefaultChild(childName: string): void;
    /** 获取所有子状态 */
    getAllChildren(): IHState[];
    /** 获取所有后代状态 */
    getAllDescendants(): IHState[];
    /** 收集所有后代状态 */
    collectDescendants(descendants: IHState[]): void;
}

// ==================== 分层状态基类 ====================

/**
 * 分层状态基类
 */
export abstract class HState implements IHState {
    public name: string;
    public parent?: IHState;
    public children?: IHState[];
    public activeChild?: IHState;
    public defaultChild?: string;
    public depth: number = 0;
    protected stateMachine: HierarchicalStateMachine;

    constructor(name: string, stateMachine: HierarchicalStateMachine) {
        this.name = name;
        this.stateMachine = stateMachine;
    }

    // IState接口实现
    public onEnter?(context: any): void;
    public onUpdate?(context: any, deltaTime: number): void;
    public onExit?(context: any): void;
    public canTransitionTo?(targetState: string, context: any): boolean;

    /**
     * 获取完整状态路径
     */
    public getFullPath(): string {
        if (this.parent) {
            return `${this.parent.getFullPath()}.${this.name}`;
        }
        return this.name;
    }

    /**
     * 获取状态层次结构
     */
    public getHierarchy(): string[] {
        const hierarchy: string[] = [this.name];
        let current = this.parent;
        while (current) {
            hierarchy.unshift(current.name);
            current = current.parent;
        }
        return hierarchy;
    }

    /**
     * 检查是否为叶子状态
     */
    public isLeaf(): boolean {
        return !this.children || this.children.length === 0;
    }

    /**
     * 检查是否为根状态
     */
    public isRoot(): boolean {
        return !this.parent;
    }

    /**
     * 获取根状态
     */
    public getRoot(): IHState {
        if (this.isRoot()) {
            return this;
        }
        return this.parent!.getRoot();
    }

    /**
     * 查找子状态
     */
    public findChild(childName: string): IHState | undefined {
        if (!this.children) return undefined;
        return this.children.find(child => child.name === childName);
    }

    /**
     * 添加子状态
     */
    public addChild(child: IHState): void {
        if (!this.children) {
            this.children = [];
        }
        
        // 检查是否已存在同名子状态
        if (this.findChild(child.name)) {
            throw new Error(`Child state with name '${child.name}' already exists in state '${this.name}'`);
        }
        
        // 设置父子关系
        child.parent = this;
        child.depth = this.depth + 1;
        
        // 更新子状态的深度
        this.updateChildDepth(child);
        
        this.children.push(child);
    }

    /**
     * 移除子状态
     */
    public removeChild(childName: string): boolean {
        if (!this.children) return false;
        
        const index = this.children.findIndex(child => child.name === childName);
        if (index === -1) return false;
        
        const child = this.children[index];
        
        // 如果当前活跃子状态是要移除的状态，先退出
        if (this.activeChild === child) {
            this.activeChild = undefined;
        }
        
        child.parent = undefined;
        child.depth = 0;
        
        this.children.splice(index, 1);
        return true;
    }

    /**
     * 设置默认子状态
     */
    public setDefaultChild(childName: string): void {
        if (this.children && !this.findChild(childName)) {
            throw new Error(`Child state '${childName}' not found in state '${this.name}'`);
        }
        this.defaultChild = childName;
    }

    /**
     * 获取所有子状态
     */
    public getAllChildren(): IHState[] {
        return this.children || [];
    }

    /**
     * 获取所有后代状态
     */
    public getAllDescendants(): IHState[] {
        const descendants: IHState[] = [];
        this.collectDescendants(descendants);
        return descendants;
    }

    /**
     * 收集所有后代状态
     */
    public collectDescendants(descendants: IHState[]): void {
        if (!this.children) return;
        
        for (const child of this.children) {
            descendants.push(child);
            child.collectDescendants(descendants);
        }
    }

    /**
     * 更新子状态深度
     */
    private updateChildDepth(child: IHState): void {
        child.depth = this.depth + 1;
        if (child.children) {
            for (const grandChild of child.children) {
                this.updateChildDepth(grandChild);
            }
        }
    }

    /**
     * 获取状态机实例
     */
    public getStateMachine(): HierarchicalStateMachine {
        return this.stateMachine;
    }
}

// ==================== 分层状态机 ====================

/**
 * 分层状态机
 */
export class HierarchicalStateMachine {
    private rootStates: Map<string, IHState> = new Map();
    private currentState: IHState | null = null;
    private context: any;
    private isInitialized: boolean = false;
    private stateHistory: string[] = [];
    private maxHistorySize: number = 10;
    private eventQueue: StateEvent[] = [];
    private globalTransitions: Map<string, IStateTransition[]> = new Map();
    private eventHandlers: Map<string, IEventHandler[]> = new Map();
    private debug: boolean = false;
    private logger: (message: string, level: 'info' | 'warn' | 'error') => void;

    /**
     * 状态转换映射（本地）
     */
    private transitions: Map<string, IStateTransition[]> = new Map();

    constructor(context?: any, options?: IStateMachineOptions) {
        this.context = context;
        this.debug = options?.debug || false;
        this.maxHistorySize = options?.maxHistorySize || 10;
        this.logger = options?.logger || this.defaultLogger;
    }

    /**
     * 默认日志函数
     */
    private defaultLogger(message: string, level: 'info' | 'warn' | 'error'): void {
        if (this.debug) {
            const timestamp = new Date().toISOString();
            console[level](`[HFSM ${timestamp}] ${message}`);
        }
    }

    /**
     * 添加根状态
     */
    public addRootState(state: IHState): void {
        if (state.parent) {
            throw new Error(`Cannot add state with parent as root state: ${state.name}`);
        }
        if (this.rootStates.has(state.name)) {
            throw new Error(`Root state with name '${state.name}' already exists`);
        }
        this.rootStates.set(state.name, state);
        this.logger(`Added root state: ${state.name}`, 'info');
    }

    /**
     * 移除根状态
     */
    public removeRootState(stateName: string): boolean {
        const state = this.rootStates.get(stateName);
        if (!state) return false;

        // 如果当前状态是要移除的根状态或其子状态，先重置
        if (this.currentState && this.isInStateHierarchy(stateName)) {
            this.reset();
        }

        this.rootStates.delete(stateName);
        this.logger(`Removed root state: ${stateName}`, 'info');
        return true;
    }

    /**
     * 设置初始状态
     */
    public setInitialState(statePath: string): void {
        const state = this.findStateByPath(statePath);
        if (!state) {
            throw new Error(`State not found: ${statePath}`);
        }
        
        this.currentState = state;
        this.enterState(state);
        this.isInitialized = true;
        this.logger(`Set initial state: ${statePath}`, 'info');
    }

    /**
     * 根据路径查找状态
     */
    public findStateByPath(statePath: string): IHState | undefined {
        if (!statePath) return undefined;
        
        const pathParts = statePath.split('.');
        const rootStateName = pathParts[0];
        
        const rootState = this.rootStates.get(rootStateName);
        if (!rootState) return undefined;
        
        if (pathParts.length === 1) {
            return rootState;
        }
        
        let currentState = rootState;
        for (let i = 1; i < pathParts.length; i++) {
            const childName = pathParts[i];
            const child = currentState.findChild(childName);
            if (!child) return undefined;
            currentState = child;
        }
        
        return currentState;
    }

    /**
     * 进入状态（包括子状态）
     */
    private enterState(state: IHState): void {
        // 进入当前状态
        if (state.onEnter) {
            try {
                state.onEnter(this.context);
                this.logger(`Entered state: ${state.getFullPath()}`, 'info');
            } catch (error) {
                this.logger(`Error entering state ${state.getFullPath()}: ${error}`, 'error');
            }
        }

        // 如果有默认子状态，进入子状态
        if (state.defaultChild && state.children) {
            const defaultChild = state.findChild(state.defaultChild);
            if (defaultChild) {
                state.activeChild = defaultChild;
                this.enterState(defaultChild);
            } else {
                this.logger(`Default child '${state.defaultChild}' not found in state '${state.name}'`, 'warn');
            }
        }
    }

    /**
     * 退出状态（包括子状态）
     */
    private exitState(state: IHState): void {
        // 先退出子状态
        if (state.activeChild) {
            this.exitState(state.activeChild);
            state.activeChild = undefined;
        }

        // 退出当前状态
        if (state.onExit) {
            try {
                state.onExit(this.context);
                this.logger(`Exited state: ${state.getFullPath()}`, 'info');
            } catch (error) {
                this.logger(`Error exiting state ${state.getFullPath()}: ${error}`, 'error');
            }
        }
    }

    /**
     * 更新状态机
     */
    public update(deltaTime: number): void {
        if (!this.isInitialized || !this.currentState) {
            return;
        }

        // 处理事件队列
        this.processEventQueue();

        // 更新当前状态链
        this.updateStateChain(this.currentState, deltaTime);

        // 检查状态转换
        this.checkTransitions();
    }

    /**
     * 更新状态链
     */
    private updateStateChain(state: IHState, deltaTime: number): void {
        // 先更新子状态
        if (state.activeChild) {
            this.updateStateChain(state.activeChild, deltaTime);
        }

        // 再更新当前状态
        if (state.onUpdate) {
            try {
                state.onUpdate(this.context, deltaTime);
            } catch (error) {
                this.logger(`Error updating state ${state.getFullPath()}: ${error}`, 'error');
            }
        }
    }

    /**
     * 检查状态转换
     */
    private checkTransitions(): void {
        if (!this.currentState) return;

        // 检查当前状态的转换
        this.checkStateTransitions(this.currentState);

        // 检查全局转换
        this.checkGlobalTransitions();
    }

    /**
     * 检查状态转换
     */
    private checkStateTransitions(state: IHState): void {
        // 检查当前状态的本地转换
        const transitions = this.getTransitions(state.getFullPath());
        if (transitions && transitions.length > 0) {
            // 按优先级排序
            const sorted = transitions.slice().sort((a, b) => (b.condition.priority || 0) - (a.condition.priority || 0));
            for (const transition of sorted) {
                try {
                    if (transition.condition.check(this.context)) {
                        this.changeState(transition.targetState);
                        return;
                    }
                } catch (error) {
                    this.logger(`Error checking transition condition: ${error}`, 'error');
                }
            }
        }
        // 检查子状态的转换
        if (state.activeChild) {
            this.checkStateTransitions(state.activeChild);
        }
    }

    /**
     * 检查全局转换
     */
    private checkGlobalTransitions(): void {
        for (const [statePath, transitions] of this.globalTransitions) {
            if (this.isInState(statePath)) {
                for (const transition of transitions) {
                    try {
                        if (transition.condition.check(this.context)) {
                            this.changeState(transition.targetState);
                            return;
                        }
                    } catch (error) {
                        this.logger(`Error checking global transition condition: ${error}`, 'error');
                    }
                }
            }
        }
    }

    /**
     * 切换到指定状态
     */
    public changeState(statePath: string, force: boolean = false): boolean {
        const targetState = this.findStateByPath(statePath);
        if (!targetState) {
            this.logger(`State not found: ${statePath}`, 'warn');
            return false;
        }

        // 检查是否可以转换
        if (!force && this.currentState && this.currentState.canTransitionTo) {
            try {
                if (!this.currentState.canTransitionTo(statePath, this.context)) {
                    this.logger(`Cannot transition from ${this.currentState.getFullPath()} to ${statePath}`, 'warn');
                    return false;
                }
            } catch (error) {
                this.logger(`Error checking transition permission: ${error}`, 'error');
                return false;
            }
        }

        // 记录状态历史
        this.addToHistory(this.currentState?.getFullPath() || '');

        // 退出当前状态链
        if (this.currentState) {
            this.exitStateChain(this.currentState);
        }

        // 进入新状态链
        this.currentState = targetState;
        this.enterStateChain(targetState);

        this.logger(`State changed to: ${statePath}`, 'info');
        return true;
    }

    /**
     * 退出状态链
     */
    private exitStateChain(state: IHState): void {
        // 先退出子状态链
        if (state.activeChild) {
            this.exitStateChain(state.activeChild);
        }

        // 退出当前状态
        if (state.onExit) {
            try {
                state.onExit(this.context);
            } catch (error) {
                this.logger(`Error exiting state chain ${state.getFullPath()}: ${error}`, 'error');
            }
        }
    }

    /**
     * 进入状态链
     */
    private enterStateChain(state: IHState): void {
        // 进入当前状态
        if (state.onEnter) {
            try {
                state.onEnter(this.context);
            } catch (error) {
                this.logger(`Error entering state chain ${state.getFullPath()}: ${error}`, 'error');
            }
        }

        // 如果有默认子状态，进入子状态链
        if (state.defaultChild && state.children) {
            const defaultChild = state.findChild(state.defaultChild);
            if (defaultChild) {
                state.activeChild = defaultChild;
                this.enterStateChain(defaultChild);
            }
        }
    }

    /**
     * 添加状态历史
     */
    private addToHistory(statePath: string): void {
        if (statePath) {
            this.stateHistory.push(statePath);
            if (this.stateHistory.length > this.maxHistorySize) {
                this.stateHistory.shift();
            }
        }
    }

    /**
     * 获取当前状态路径
     */
    public getCurrentStatePath(): string {
        if (!this.currentState) return '';
        return this.currentState.getFullPath();
    }

    /**
     * 获取当前状态层次结构
     */
    public getCurrentStateHierarchy(): string[] {
        if (!this.currentState) return [];
        return this.currentState.getHierarchy();
    }

    /**
     * 检查是否在指定状态
     */
    public isInState(statePath: string): boolean {
        if (!this.currentState) return false;
        return this.currentState.getFullPath() === statePath;
    }

    /**
     * 检查是否在指定状态层次结构中
     */
    public isInStateHierarchy(statePath: string): boolean {
        if (!this.currentState) return false;
        const hierarchy = this.currentState.getHierarchy();
        return hierarchy.includes(statePath);
    }

    /**
     * 获取状态历史
     */
    public getStateHistory(): string[] {
        return [...this.stateHistory];
    }

    /**
     * 清空状态历史
     */
    public clearStateHistory(): void {
        this.stateHistory = [];
    }

    /**
     * 设置最大历史记录数
     */
    public setMaxHistorySize(size: number): void {
        this.maxHistorySize = size;
        if (this.stateHistory.length > size) {
            this.stateHistory = this.stateHistory.slice(-size);
        }
    }

    /**
     * 添加全局转换
     */
    public addGlobalTransition(fromStatePath: string, transition: IStateTransition): void {
        if (!this.globalTransitions.has(fromStatePath)) {
            this.globalTransitions.set(fromStatePath, []);
        }
        this.globalTransitions.get(fromStatePath)!.push(transition);
        this.logger(`Added global transition from ${fromStatePath} to ${transition.targetState}`, 'info');
    }

    /**
     * 移除全局转换
     */
    public removeGlobalTransition(fromStatePath: string, targetState: string): boolean {
        const transitions = this.globalTransitions.get(fromStatePath);
        if (!transitions) return false;
        
        const index = transitions.findIndex(t => t.targetState === targetState);
        if (index === -1) return false;
        
        transitions.splice(index, 1);
        this.logger(`Removed global transition from ${fromStatePath} to ${targetState}`, 'info');
        return true;
    }

    /**
     * 添加事件处理器
     */
    public addEventHandler(handler: IEventHandler): void {
        if (!this.eventHandlers.has(handler.eventName)) {
            this.eventHandlers.set(handler.eventName, []);
        }
        this.eventHandlers.get(handler.eventName)!.push(handler);
        this.logger(`Added event handler for: ${handler.eventName}`, 'info');
    }

    /**
     * 移除事件处理器
     */
    public removeEventHandler(eventName: string, handler: IEventHandler): boolean {
        const handlers = this.eventHandlers.get(eventName);
        if (!handlers) return false;
        
        const index = handlers.indexOf(handler);
        if (index === -1) return false;
        
        handlers.splice(index, 1);
        this.logger(`Removed event handler for: ${eventName}`, 'info');
        return true;
    }

    /**
     * 发送事件
     */
    public sendEvent(eventName: string, data?: any): void {
        this.eventQueue.push(new StateEvent(eventName, data));
        this.logger(`Event queued: ${eventName}`, 'info');
    }

    /**
     * 处理事件队列
     */
    private processEventQueue(): void {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift()!;
            this.handleEvent(event);
        }
    }

    /**
     * 处理事件
     */
    private handleEvent(event: StateEvent): void {
        const handlers = this.eventHandlers.get(event.name);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler.handle(event, this);
                } catch (error) {
                    this.logger(`Error handling event ${event.name}: ${error}`, 'error');
                }
            }
        }
        
        // 如果没有处理器，记录调试信息
        if (!handlers || handlers.length === 0) {
            this.logger(`No handlers found for event: ${event.name}`, 'warn');
        }
    }

    /**
     * 获取上下文
     */
    public getContext(): any {
        return this.context;
    }

    /**
     * 设置上下文
     */
    public setContext(context: any): void {
        this.context = context;
    }

    /**
     * 重置状态机
     */
    public reset(): void {
        if (this.currentState) {
            this.exitStateChain(this.currentState);
        }
        this.currentState = null;
        this.isInitialized = false;
        this.stateHistory = [];
        this.eventQueue = [];
        this.logger('State machine reset', 'info');
    }

    /**
     * 获取所有根状态
     */
    public getRootStates(): IHState[] {
        return Array.from(this.rootStates.values());
    }

    /**
     * 获取状态机状态信息
     */
    public getStateInfo(): any {
        return {
            currentState: this.getCurrentStatePath(),
            hierarchy: this.getCurrentStateHierarchy(),
            history: this.getStateHistory(),
            isInitialized: this.isInitialized,
            rootStates: Array.from(this.rootStates.keys()),
            eventQueueSize: this.eventQueue.length,
            globalTransitionsCount: this.globalTransitions.size,
            localTransitionsCount: this.transitions.size
        };
    }

    /**
     * 添加本地状态转换
     */
    public addTransition(fromStatePath: string, transition: IStateTransition): void {
        if (!this.transitions.has(fromStatePath)) {
            this.transitions.set(fromStatePath, []);
        }
        this.transitions.get(fromStatePath)!.push(transition);
        this.logger(`Added transition from ${fromStatePath} to ${transition.targetState}`, 'info');
    }

    /**
     * 移除本地状态转换
     */
    public removeTransition(fromStatePath: string, targetState: string): boolean {
        const transitions = this.transitions.get(fromStatePath);
        if (!transitions) return false;
        const idx = transitions.findIndex(t => t.targetState === targetState);
        if (idx === -1) return false;
        transitions.splice(idx, 1);
        this.logger(`Removed transition from ${fromStatePath} to ${targetState}`, 'info');
        return true;
    }

    /**
     * 获取本地状态转换
     */
    public getTransitions(fromStatePath: string): IStateTransition[] | undefined {
        return this.transitions.get(fromStatePath);
    }

    /**
     * 获取所有转换
     */
    public getAllTransitions(): Map<string, IStateTransition[]> {
        return new Map(this.transitions);
    }

    /**
     * 获取所有全局转换
     */
    public getAllGlobalTransitions(): Map<string, IStateTransition[]> {
        return new Map(this.globalTransitions);
    }

    /**
     * 检查状态是否存在
     */
    public hasState(statePath: string): boolean {
        return this.findStateByPath(statePath) !== undefined;
    }

    /**
     * 获取状态数量
     */
    public getStateCount(): number {
        let count = 0;
        for (const rootState of this.rootStates.values()) {
            count += 1 + rootState.getAllDescendants().length;
        }
        return count;
    }

    /**
     * 启用/禁用调试模式
     */
    public setDebugMode(enabled: boolean): void {
        this.debug = enabled;
        this.logger(`Debug mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    /**
     * 获取调试模式状态
     */
    public isDebugMode(): boolean {
        return this.debug;
    }
}

// ==================== 事件系统 ====================

/**
 * 状态事件
 */
export class StateEvent {
    public name: string;
    public data?: any;
    public timestamp: number;

    constructor(name: string, data?: any) {
        this.name = name;
        this.data = data;
        this.timestamp = Date.now();
    }

    /**
     * 获取事件年龄（毫秒）
     */
    public getAge(): number {
        return Date.now() - this.timestamp;
    }
}

// ==================== 分层转换条件 ====================

/**
 * 分层转换条件
 */
export class HierarchicalTransitionCondition implements ITransitionCondition {
    private checkFunction: (context: any, stateMachine: HierarchicalStateMachine) => boolean;
    public priority: number;

    constructor(checkFunction: (context: any, stateMachine: HierarchicalStateMachine) => boolean, priority: number = 0) {
        this.checkFunction = checkFunction;
        this.priority = priority;
    }

    public check(context: any): boolean {
        // 这里需要访问状态机实例，通过context中的状态机引用或全局状态机管理器
        // 为了简化，我们假设context包含状态机引用
        const stateMachine = (context as any).stateMachine;
        if (!stateMachine) {
            console.warn('StateMachine reference not found in context');
            return false;
        }
        return this.checkFunction(context, stateMachine);
    }
}

/**
 * 简单转换条件
 */
export class SimpleTransitionCondition implements ITransitionCondition {
    private checkFunction: (context: any) => boolean;
    public priority: number;

    constructor(checkFunction: (context: any) => boolean, priority: number = 0) {
        this.checkFunction = checkFunction;
        this.priority = priority;
    }

    public check(context: any): boolean {
        return this.checkFunction(context);
    }
}

// ==================== 状态机构建器 ====================

/**
 * 分层状态机构建器
 */
export class HierarchicalStateMachineBuilder {
    private stateMachine: HierarchicalStateMachine;

    constructor(context?: any, options?: IStateMachineOptions) {
        this.stateMachine = new HierarchicalStateMachine(context, options);
    }

    /**
     * 添加根状态
     */
    public addRootState(state: IHState): this {
        this.stateMachine.addRootState(state);
        return this;
    }

    /**
     * 添加子状态
     */
    public addChildState(parentState: IHState, childState: IHState): this {
        parentState.addChild(childState);
        return this;
    }

    /**
     * 设置默认子状态
     */
    public setDefaultChild(state: IHState, childName: string): this {
        state.setDefaultChild(childName);
        return this;
    }

    /**
     * 设置初始状态
     */
    public setInitialState(statePath: string): this {
        this.stateMachine.setInitialState(statePath);
        return this;
    }

    /**
     * 添加转换
     */
    public addTransition(fromStatePath: string, targetState: string, condition: ITransitionCondition): this {
        this.stateMachine.addTransition(fromStatePath, { targetState, condition });
        return this;
    }

    /**
     * 添加全局转换
     */
    public addGlobalTransition(fromStatePath: string, targetState: string, condition: ITransitionCondition): this {
        this.stateMachine.addGlobalTransition(fromStatePath, { targetState, condition });
        return this;
    }

    /**
     * 添加事件处理器
     */
    public addEventHandler(handler: IEventHandler): this {
        this.stateMachine.addEventHandler(handler);
        return this;
    }

    /**
     * 构建状态机
     */
    public build(): HierarchicalStateMachine {
        return this.stateMachine;
    }
}

// ==================== 实用工具类 ====================

/**
 * 状态机工具类
 */
export class StateMachineUtils {
    /**
     * 创建简单的转换条件
     */
    public static createCondition(checkFunction: (context: any) => boolean, priority: number = 0): ITransitionCondition {
        return new SimpleTransitionCondition(checkFunction, priority);
    }

    /**
     * 创建分层转换条件
     */
    public static createHierarchicalCondition(
        checkFunction: (context: any, stateMachine: HierarchicalStateMachine) => boolean, 
        priority: number = 0
    ): ITransitionCondition {
        return new HierarchicalTransitionCondition(checkFunction, priority);
    }

    /**
     * 创建事件处理器
     */
    public static createEventHandler(eventName: string, handler: (event: StateEvent, stateMachine: HierarchicalStateMachine) => void): IEventHandler {
        return {
            eventName,
            handle: handler
        };
    }

    /**
     * 验证状态路径格式
     */
    public static validateStatePath(path: string): boolean {
        if (!path || path.trim() === '') return false;
        const parts = path.split('.');
        return parts.every(part => part.trim() !== '' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part));
    }

    /**
     * 获取状态路径的父路径
     */
    public static getParentPath(path: string): string | null {
        const lastDotIndex = path.lastIndexOf('.');
        return lastDotIndex > 0 ? path.substring(0, lastDotIndex) : null;
    }

    /**
     * 获取状态路径的最后部分
     */
    public static getStateName(path: string): string {
        const lastDotIndex = path.lastIndexOf('.');
        return lastDotIndex > 0 ? path.substring(lastDotIndex + 1) : path;
    }
} 