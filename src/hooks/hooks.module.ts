import { Module, OnModuleInit } from '@nestjs/common';
import { HooksExplorer } from './hooks-exporer';
import { HooksService } from './hooks.service';

@Module({
  providers: [HooksService, HooksExplorer],
  exports: [HooksService],
})
export class HooksModule implements OnModuleInit {
  constructor(
    private readonly hooksService: HooksService,
    private readonly hooksExplorer: HooksExplorer,
  ) {}

  async onModuleInit() {
    const { hookActions } = this.hooksExplorer.explore();
    this.hooksService.register(hookActions);
  }
}
