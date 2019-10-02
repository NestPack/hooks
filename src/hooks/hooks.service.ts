import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HOOK_ACTION_METADATA } from './constants';
import { IHook, IHookAction } from './interfaces';

type HookActionType = Type<IHookAction<IHook>>;

/**
 * Allows for running hooks to create extendable NestJs module logic.
 */
@Injectable()
export class HooksService {
  private handlers: Map<string, IHookAction[]> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Registers hook actions
   */
  register(hookActions: HookActionType[]) {
    hookActions.forEach(handler => this.registerHookAction(handler));
  }

  /**
   * Registers hooks if they don't exist and attaches actions to the registered hooks
   */
  protected registerHookAction(hookActionClass: HookActionType) {
    const hookActionInstance = this.moduleRef.get(hookActionClass, {
      strict: false,
    });

    if (!hookActionInstance) {
      return;
    }

    const hooksLinkedToHookAction = this.reflectLinkedHooks(hookActionClass);

    if (hooksLinkedToHookAction.length === 0) {
      const existingHandlers = this.handlers.get('__all__') || [];
      this.handlers.set('__all__', [...existingHandlers, hookActionInstance]);
      return;
    }

    hooksLinkedToHookAction.forEach(hook => {
      const existingHandlers = this.handlers.get(hook.name) || [];
      this.handlers.set(hook.name, [...existingHandlers, hookActionInstance]);
    });
  }

  /**
   * Runs a hook by passing the hook instance into each action and awaiting
   * the action results to perform actions in sequence.
   *
   * Requres an instance of a class
   *
   * `await runHook(new MyHook());`
   *
   * A hook can be any kind of class instance
   *
   * Returns the hook instance that is passed through the actions.
   */
  async runHook<T extends IHook>(hook: T): Promise<T> {
    const hookName = this.getClassName(hook);
    const actions = this.handlers.get(hookName) || [];
    const globalActions = this.handlers.get('__all__') || [];
    const combinedHookAndGlobalActions = actions.concat(globalActions);

    let result: T = hook;

    for (let action of combinedHookAndGlobalActions) {
      const actionResult = await action.handle(result);
      if (typeof actionResult !== 'undefined') result = actionResult;
    }

    return result;
  }

  /**
   * Gets the name of a class
   */
  private getClassName(classRef: any): string {
    const { constructor } = Object.getPrototypeOf(classRef);
    return constructor.name as string;
  }

  /**
   * Retrieves the list of hook classes attached to a HookAction
   */
  private reflectLinkedHooks(handler: HookActionType): FunctionConstructor[] {
    return Reflect.getMetadata(HOOK_ACTION_METADATA, handler);
  }
}
