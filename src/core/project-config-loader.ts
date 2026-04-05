/**
 * 项目配置加载器
 *
 * 加载 .harness/config.yml 和 .harness/custom-constraints.yml
 * 合并内置约束和项目自定义约束
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Constraint, ConstraintTrigger } from '../types/constraint';
import type {
  ProjectConfig,
  CustomConstraintDefinition,
  MergedConstraintsConfig,
} from '../types/project-config';
import { IRON_LAWS, GUIDELINES, TIPS } from './constraints/definitions';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ProjectConfig = {
  preset: 'standard',
  custom_constraints_file: 'custom-constraints.yml',
};

/**
 * 项目配置加载器
 */
export class ProjectConfigLoader {
  private projectPath: string;
  private config: ProjectConfig;
  private customConstraints: Record<string, CustomConstraintDefinition>;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.config = { ...DEFAULT_CONFIG };
    this.customConstraints = {};
  }

  /**
   * 加载项目配置
   */
  load(): ProjectConfig {
    // 1. 加载主配置
    const configPath = path.join(this.projectPath, '.harness', 'config.yml');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const loaded = yaml.load(content) as ProjectConfig;
      this.config = { ...DEFAULT_CONFIG, ...loaded };
    }

    // 2. 加载自定义约束
    this.loadCustomConstraints();

    return this.config;
  }

  /**
   * 加载自定义约束
   */
  private loadCustomConstraints(): void {
    // 方式 1：从单独文件加载
    if (this.config.custom_constraints_file) {
      const customPath = path.join(
        this.projectPath,
        '.harness',
        this.config.custom_constraints_file
      );
      if (fs.existsSync(customPath)) {
        const content = fs.readFileSync(customPath, 'utf-8');
        const loaded = yaml.load(content) as {
          custom_constraints?: Record<string, CustomConstraintDefinition>;
        };
        if (loaded.custom_constraints) {
          this.customConstraints = { ...this.customConstraints, ...loaded.custom_constraints };
        }
      }
    }

    // 方式 2：从主配置文件中加载
    if (this.config.custom_constraints) {
      this.customConstraints = { ...this.customConstraints, ...this.config.custom_constraints };
    }
  }

  /**
   * 合并内置约束和自定义约束
   */
  mergeConstraints(): MergedConstraintsConfig {
    const result: MergedConstraintsConfig = {
      ironLaws: { ...IRON_LAWS },
      guidelines: { ...GUIDELINES },
      tips: { ...TIPS },
      disabled: [],
      custom: [],
    };

    // 1. 处理启用/禁用配置
    if (this.config.constraints) {
      for (const [constraintId, config] of Object.entries(this.config.constraints)) {
        if (config.enabled === false) {
          result.disabled.push(constraintId);
          // 从对应层级中移除
          delete result.ironLaws[constraintId];
          delete result.guidelines[constraintId];
          delete result.tips[constraintId];
        }
      }
    }

  /**
   * 添加自定义约束
   */
  for (const [id, customDef] of Object.entries(this.customConstraints)) {
    // 检查是否是纯扩展模式（只有 extend_exceptions，没有其他覆盖字段）
    const isExtendOnly = customDef.extend_exceptions &&
      customDef.extend_exceptions.length > 0 &&
      !customDef.rule &&
      !customDef.exceptions; // 没有 rule 和 exceptions 表示只是扩展例外

    if (isExtendOnly) {
      // 纯扩展模式：只追加例外，保留内置约束其他属性
      const builtIn = this.findBuiltInConstraint(id, result);
      if (builtIn) {
        // 复制内置约束
        const constraint = { ...builtIn };
        // 合并例外
        constraint.exceptions = [
          ...(builtIn.exceptions || []),
          ...customDef.extend_exceptions!,
        ];
        // 更新到对应层级
        if (result.ironLaws[id]) result.ironLaws[id] = constraint;
        if (result.guidelines[id]) result.guidelines[id] = constraint;
        if (result.tips[id]) result.tips[id] = constraint;
        continue; // 跳过后续处理
      }
    }

    // 完整定义模式：创建新约束
    const constraint = this.toConstraint(customDef, id);

    // 处理 extend_exceptions + 其他字段的情况
    if (customDef.extend_exceptions && customDef.extend_exceptions.length > 0) {
      const builtIn = this.findBuiltInConstraint(id, result);
      if (builtIn) {
        constraint.exceptions = [
          ...(builtIn.exceptions || []),
          ...(customDef.exceptions || []),
          ...customDef.extend_exceptions,
        ];
      } else {
        constraint.exceptions = [
          ...(customDef.exceptions || []),
          ...customDef.extend_exceptions,
        ];
      }
    }

    result.custom.push(id);

    // 根据层级添加到对应集合
    const level = customDef.level || 'guideline';
    switch (level) {
      case 'iron_law':
        result.ironLaws[id] = constraint;
        break;
      case 'guideline':
        result.guidelines[id] = constraint;
        break;
      case 'tip':
        result.tips[id] = constraint;
        break;
    }
  }

    return result;
  }

  /**
   * 在合并结果中查找内置约束
   */
  private findBuiltInConstraint(
    id: string,
    merged: MergedConstraintsConfig
  ): Constraint | undefined {
    return merged.ironLaws[id] || merged.guidelines[id] || merged.tips[id];
  }

  /**
   * 将自定义约束定义转换为 Constraint
   */
  private toConstraint(def: CustomConstraintDefinition, defaultId: string): Constraint {
    return {
      id: def.id || defaultId,
      level: def.level || 'guideline',
      rule: def.rule || '',
      message: def.message || '',
      trigger: (def.trigger || 'manual') as ConstraintTrigger | ConstraintTrigger[],
      exceptions: def.exceptions,
      description: def.description,
      enabled: def.enabled !== false,
      enforcement: 'custom',
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ProjectConfig {
    return this.config;
  }

  /**
   * 获取自定义约束
   */
  getCustomConstraints(): Record<string, CustomConstraintDefinition> {
    return this.customConstraints;
  }

  /**
   * 检查约束是否启用
   */
  isConstraintEnabled(constraintId: string): boolean {
    // 1. 检查是否在禁用列表
    if (this.config.constraints?.[constraintId]?.enabled === false) {
      return false;
    }

    // 2. 检查自定义约束是否禁用
    if (this.customConstraints[constraintId]?.enabled === false) {
      return false;
    }

    return true;
  }

  /**
   * 获取约束来源
   */
  getConstraintSource(constraintId: string): 'built-in' | 'custom' | 'disabled' {
    if (this.config.constraints?.[constraintId]?.enabled === false) {
      return 'disabled';
    }
    if (this.customConstraints[constraintId]) {
      return 'custom';
    }
    return 'built-in';
  }

  /**
   * 检查是否有自定义配置
   */
  hasCustomConfig(): boolean {
    return (
      Object.keys(this.customConstraints).length > 0 ||
      (this.config.constraints !== undefined && Object.keys(this.config.constraints).length > 0)
    );
  }
}

/**
 * 创建项目配置加载器
 */
export function createProjectConfigLoader(projectPath?: string): ProjectConfigLoader {
  return new ProjectConfigLoader(projectPath);
}