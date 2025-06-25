/**
 * 状态机系统
 * 提供标准的状态机实现，支持状态切换、条件检查和事件处理
 */

// 状态接口
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

// 状态转换条件接口
export interface ITransitionCondition {
    /** 检查转换条件 */
    check(context: any): boolean;
    /** 转换优先级，数字越大优先级越高 */
    priority?: number;
}

// 状态转换定义
export interface IStateTransition {
    /** 目标状态名称 */
    targetState: string;
    /** 转换条件 */
    condition: ITransitionCondition;
}

export const enum Operator {
    OR,
    AND
}

// 状态基类
export abstract class State implements IState {
    public name: string;
    protected stateMachine: StateMachine;

    constructor(name: string, stateMachine: StateMachine) {
        this.name = name;
        this.stateMachine = stateMachine;
    }

    public onEnter?(context: any): void;
    public onUpdate?(context: any, deltaTime: number): void;
    public onExit?(context: any): void;
    public canTransitionTo?(targetState: string, context: any): boolean;
}

// 状态机管理器
export class StateMachine {
    private states: Map<string, IState> = new Map();
    private transitions: Map<string, IStateTransition[]> = new Map();
    private currentState: IState | null = null;
    private context: any;
    private isInitialized: boolean = false;

    constructor(context?: any) {
        this.context = context;
    }

    /**
     * 添加状态
     * @param state 状态对象
     */
    public addState(state: IState): void {
        this.states.set(state.name, state);
    }

    /**
     * 添加状态转换
     * @param fromState 源状态名称
     * @param transition 转换定义
     */
    public addTransition(fromState: string, transition: IStateTransition): void {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, []);
        }
        this.transitions.get(fromState)!.push(transition);
    }

    /**
     * 设置初始状态
     * @param stateName 状态名称
     */
    public setInitialState(stateName: string): void {
        const state = this.states.get(stateName);
        if (!state) {
            throw new Error(`State '${stateName}' not found`);
        }
        this.currentState = state;
        this.isInitialized = true;
    }

    /**
     * 获取当前状态
     */
    public getCurrentState(): IState | null {
        return this.currentState;
    }

    /**
     * 获取当前状态名称
     */
    public getCurrentStateName(): string | null {
        return this.currentState?.name || null;
    }

    /**
     * 更新状态机
     * @param deltaTime 时间间隔
     */
    public update(deltaTime: number): void {
        if (!this.isInitialized || !this.currentState) {
            return;
        }

        // 更新当前状态
        if (this.currentState.onUpdate) {
            this.currentState.onUpdate(this.context, deltaTime);
        }

        // 检查状态转换
        this.checkTransitions();
    }

    /**
     * 检查状态转换
     */
    private checkTransitions(): void {
        if (!this.currentState) return;

        const currentStateName = this.currentState.name;
        const stateTransitions = this.transitions.get(currentStateName);

        if (!stateTransitions || stateTransitions.length === 0) {
            return;
        }

        // 按优先级排序转换条件
        const sortedTransitions = stateTransitions.sort((a, b) => {
            const priorityA = a.condition.priority || 0;
            const priorityB = b.condition.priority || 0;
            return priorityB - priorityA;
        });

        // 检查转换条件
        for (const transition of sortedTransitions) {
            if (transition.condition.check(this.context)) {
                this.changeState(transition.targetState);
                break;
            }
        }
    }

    /**
     * 切换到指定状态
     * @param stateName 目标状态名称
     * @param force 是否强制切换（忽略canTransitionTo检查）
     */
    public changeState(stateName: string, force: boolean = false): boolean {
        const targetState = this.states.get(stateName);
        if (!targetState) {
            console.warn(`State '${stateName}' not found`);
            return false;
        }

        // 检查是否可以转换
        if (!force && this.currentState && this.currentState.canTransitionTo) {
            if (!this.currentState.canTransitionTo(stateName, this.context)) {
                return false;
            }
        }

        // 退出当前状态
        if (this.currentState && this.currentState.onExit) {
            this.currentState.onExit(this.context);
        }

        // 切换到新状态
        this.currentState = targetState;

        // 进入新状态
        if (this.currentState.onEnter) {
            this.currentState.onEnter(this.context);
        }

        return true;
    }

    /**
     * 检查是否在指定状态
     * @param stateName 状态名称
     */
    public isInState(stateName: string): boolean {
        return this.currentState?.name === stateName;
    }

    /**
     * 获取所有状态名称
     */
    public getAllStateNames(): string[] {
        return Array.from(this.states.keys());
    }

    /**
     * 获取状态
     * @param stateName 状态名称
     */
    public getState(stateName: string): IState | undefined {
        return this.states.get(stateName);
    }

    /**
     * 重置状态机
     */
    public reset(): void {
        if (this.currentState && this.currentState.onExit) {
            this.currentState.onExit(this.context);
        }
        this.currentState = null;
        this.isInitialized = false;
    }

    /**
     * 设置上下文
     * @param context 上下文对象
     */
    public setContext(context: any): void {
        this.context = context;
    }

    /**
     * 获取上下文
     */
    public getContext(): any {
        return this.context;
    }
}

// 简单的转换条件实现
export class SimpleCondition implements ITransitionCondition {
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

// 延迟转换条件
export class DelayCondition implements ITransitionCondition {
    private delay: number;
    private startTime: number = 0;
    private isStarted: boolean = false;
    public priority: number;

    constructor(delay: number, priority: number = 0) {
        this.delay = delay;
        this.priority = priority;
    }

    public getNow() {
        return Date.now();
    }

    public check(context: any): boolean {
        if (!this.isStarted) {
            this.startTime = this.getNow();
            this.isStarted = true;
        }
        return (this.getNow() - this.startTime) >= this.delay;
    }

    public reset(): void {
        this.isStarted = false;
        this.startTime = 0;
    }
}

// 组合条件
export class CompositeCondition implements ITransitionCondition {
    private conditions: ITransitionCondition[];
    private operator: Operator;
    public priority: number;

    constructor(conditions: ITransitionCondition[], operator = Operator.AND, priority: number = 0) {
        this.conditions = conditions;
        this.operator = operator;
        this.priority = priority;
    }

    public check(context: any): boolean {
        switch (this.operator) {
            case Operator.OR:
                return this.conditions.some(condition => condition.check(context));
            case Operator.AND:
                return this.conditions.every(condition => condition.check(context));
            default:
                throw Error(`Operator ${this.operator} not support`);
        }
    }
}
