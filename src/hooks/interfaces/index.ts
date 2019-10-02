export interface IHook {}

export interface IHookAction<T extends IHook = any> {
  handle(hook: T);
}
