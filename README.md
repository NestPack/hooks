[![Build Status](https://github.com/NestPack/hooks/workflows/tests/badge.svg)](https://github.com/NestPack/hooks/actions)

# NestPack Hooks

A NestJs hooks system for developing extendable module logic.

The NestJs module system is a fantastic tool for writing modular code. However, projects can easily become a mess when developers start cross linking business logic between modules. A previously independent module that another one depends on ends up needing a `forwardRef` and a developer makes calls to a secondary mmodule inside of a primary one. This results in an application that could have been clearly segmented turning into a tightly coupled monstrosity... that happens to have modules.

NestPack Hooks allows a developer to write code injection points(hooks) inside of modules that will be imported by others. Consuming modules than then write Actions that listen for those Hook events and run their injected code before the imported module continues its logic.

## Why not use the Events System?
In a totally stream and realtime endpoint based environment, NestPack Hooks is not required, as the `@nestjs/cqrs` module can emit simple events and have other listeners trigger responses. Understandably, events are asynchronous operations, and can only be used in situations where the event emitting logic doesn't care about the results and doesn't need to wait for execution. In a REST endpoint setting, the event system will resolve async code after the response has already been returned. NestPack Hooks solves this by providing an "event-like" pattern where actions(similar to events) are run in order of registration, and wait for promises returns from actions.

## Installation

```bash
$ npm install @nestpack/hooks
# OR
$ yarn add @nestpack/hooks
```

## Usage

Try it out [on codesandbox](https://codesandbox.io/s/nest-typescript-starter-f4r49) (You may need to restart the sandbox on changes.)

Import the `HooksModule` and provide the Actions you wish to register.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { HooksModule } from '@nestpack/hooks';
import { AppController } from './app.controller';
import { DoubleValueAction } from './double-value.action';

@Module({
  // Import the Hooks Module
  imports: [HooksModule],
  controllers: [AppController],
  // Provide the actions you wish to register
  providers: [DoubleValueAction],
})
export class AppModule {}
```

Create a hook that will be run. Hooks only need to be a class and can contain whatever additional information wanted.

```typescript
// example.hooks.ts

// A hook can be any class
export class ExampleHook {
  // Here we're including a value for manipulation
  value = 1;
}
```

Create a Hook Action that will be run whenever the Hook is run.

```typescript
// double-value.action.ts
import { IHookAction, HookAction } from '@nestpack/hooks';
import { ExampleHook } from './example.hook';

/**
 * Apply the HookAction decorator with a reference to the actions
 * this hook should trigger on. To add more than one action, add them
 * as additional parameters.
 *
 * If no actions are passed, this hook will run for all actions.
 */
@HookAction(ExampleHook)
// This action will double the value of the provided hook.
export class DoubleValueAction implements IHookAction {
  // the handle function can be sync or async
  async handle(hook: ExampleHook) {
    //simulate an async call
    await new Promise(r => setTimeout(r, 1000));
    //Optionally mutate data inside of the privded hook
    hook.value = hook.value * 2;

    /**
     * Optional: return a new value to be passed to the next hook
     *
     * After all hooks are run, the final value is passed back to runHook
     */
    return hook;
  }
}
```

Include the HooksService and run the desired hook.

```typescript
// app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { HooksService } from '@nestpack/hooks';
import { ExampleHook } from './example.hook';

@Controller()
export class AppController {
  // Add the HooksService dependency
  constructor(private readonly hooksService: HooksService) {}

  @Get()
  async getValue() {
    // Run the hook by passing an instance of the defined hook
    const result = await this.hooksService.runHook(new ExampleHook());

    return result.value;
  }
}
```

## License

[MIT licensed](LICENSE).
