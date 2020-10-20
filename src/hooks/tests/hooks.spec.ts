import { TestingModule, Test } from '@nestjs/testing';
import { HooksModule } from '../hooks.module';
import { IHookAction } from '../interfaces';
import { Injectable, Module } from '@nestjs/common';
import { HooksService } from '../hooks.service';
import { HookAction } from '../hook-action.decorator';
jest.setTimeout(20000);
describe('hooks', () => {
  it('should initialize without throwing', async () => {
    const module = await Test.createTestingModule({
      imports: [HooksModule],
    }).compile();
    await module.init();
    expect(true).toBe(true);
  });

  it('should run hook actions', async () => {
    class Hook {}

    @HookAction(Hook)
    class Action implements IHookAction {
      handle(hook) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      run() {
        return this.hooksService.runHook(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, Action],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result).toBe('works');
  });

  it('should run actions in order', async () => {
    class Hook {
      value = 1;
    }

    @HookAction(Hook)
    class DoubleAction implements IHookAction {
      handle(hook) {
        hook.value = hook.value * 2;
      }
    }

    @HookAction(Hook)
    class ToStringAction implements IHookAction {
      handle(hook) {
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      run() {
        return this.hooksService.runHook(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleAction, ToStringAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should run async actions', async () => {
    class Hook {
      value = 1;
    }

    @HookAction(Hook)
    class DoubleAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 10));
        hook.value = hook.value * 2;
      }
    }

    @HookAction(Hook)
    class ToStringAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      run() {
        return this.hooksService.runHook(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleAction, ToStringAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should allow multiple hooks', async () => {
    class Hook {
      value = 1;
    }

    class HookTwo {
      value = 2;
    }

    @HookAction(Hook, HookTwo)
    class DoubleAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 10));
        hook.value = hook.value * 2;
      }
    }

    @HookAction(Hook)
    class ToStringAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      async run() {
        return [
          await this.hooksService.runHook(new Hook()),
          await this.hooksService.runHook(new HookTwo()),
        ];
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleAction, ToStringAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result[0].value).toBe('2');
    expect(result[1].value).toBe(4);
  });

  it('should allow global hooks', async () => {
    class Hook {
      value = 1;
    }

    class HookTwo {
      value = 2;
    }

    @HookAction(Hook, HookTwo)
    class DoubleAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 10));
        hook.value = hook.value * 2;
      }
    }

    @HookAction(Hook)
    class ToStringAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = hook.value.toString();
      }
    }

    @HookAction()
    class GlobalAction implements IHookAction {
      async handle(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = `global ${hook.value}`;
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      async run() {
        return [
          await this.hooksService.runHook(new Hook()),
          await this.hooksService.runHook(new HookTwo()),
        ];
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleAction, ToStringAction, GlobalAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result[0].value).toBe('global 2');
    expect(result[1].value).toBe('global 4');
  });

  it('should allow cross module hooks', async () => {
    class Hook {}

    @HookAction(Hook)
    class Action implements IHookAction {
      handle(hook) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksService: HooksService) {}
      run() {
        return this.hooksService.runHook(new Hook());
      }
    }

    @Module({
      imports: [HooksModule],
      providers: [Service],
    })
    class ModuleOne {}

    @Module({
      imports: [HooksModule, ModuleOne],
      providers: [Action],
    })
    class ModuleTwo {}

    const module = await Test.createTestingModule({
      imports: [ModuleOne, ModuleTwo],
      providers: [],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result).toBe('works');
  });
});
