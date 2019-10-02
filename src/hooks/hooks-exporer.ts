import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { HOOK_ACTION_METADATA } from './constants';
import { IHookAction } from './interfaces';

/* THIS WAS MOSTLY COPPIED FROM THE @nestjs/cqrs module */

/**
 * Retrieves Hook Actions available to the module.
 */
@Injectable()
export class HooksExplorer {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  /**
   * Retrieves Hook Actions available to the module.
   */
  explore() {
    const modules = [...this.modulesContainer.values()];

    const hookActions = this.flatMap<IHookAction>(modules, instance =>
      this.filterProvider(instance, HOOK_ACTION_METADATA),
    );

    return { hookActions };
  }

  flatMap<T>(
    modules: Module[],
    callback: (instance: InstanceWrapper) => Type<any> | undefined,
  ): Type<T>[] {
    return modules
      .map(module => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), [])
      .filter(element => !!element) as Type<T>[];
  }

  filterProvider(
    wrapper: InstanceWrapper,
    metadataKey: string,
  ): Type<any> | undefined {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return this.extractMetadata(instance, metadataKey);
  }

  extractMetadata(instance: Object, metadataKey: string): Type<any> {
    if (!instance.constructor) {
      return;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
    return metadata ? (instance.constructor as Type<any>) : undefined;
  }
}
