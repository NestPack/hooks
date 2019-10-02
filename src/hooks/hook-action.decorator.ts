import { HOOK_ACTION_METADATA } from './constants';
import { IHook } from './interfaces';

export const HookAction = (...events: IHook[]): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(HOOK_ACTION_METADATA, events, target);
  };
};
