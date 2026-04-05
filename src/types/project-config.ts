/**
 * 项目级自定义约束配置
 *
 * 允许项目定义自己的约束，扩展或覆盖 harness 内置约束
 */

import type { Constraint, ConstraintLevel } from './constraint';

/**
 * 自定义约束定义
 */
export interface CustomConstraintDefinition {
  /** 约束 ID */
  id: string;

  /** 约束层级 */
  level: ConstraintLevel;

  /** 约束规则（英文） */
  rule: string;

  /** 约束消息（中文） */
  message: string;

  /** 触发条件 */
  trigger: string | string[];

  /** 例外条件（可选） */
  exceptions?: string[];

  /** 描述（可选） */
  description?: string;

  /** 是否启用（可选，默认 true） */
  enabled?: boolean;
}

/**
 * 项目配置
 */
export interface ProjectConfig {
  /** harness 版本 */
  harness?: {
    version?: string;
  };

  /** 使用预设 */
  preset?: 'strict' | 'standard' | 'relaxed';

  /** 内置约束启用/禁用配置 */
  constraints?: Record<string, { enabled?: boolean }>;

  /** 自定义约束文件路径 */
  custom_constraints_file?: string;

  /** 自定义约束（直接定义） */
  custom_constraints?: Record<string, CustomConstraintDefinition>;
}

/**
 * 完整的约束配置（合并内置 + 自定义）
 */
export interface MergedConstraintsConfig {
  /** Iron Laws（合并后） */
  ironLaws: Record<string, Constraint>;

  /** Guidelines（合并后） */
  guidelines: Record<string, Constraint>;

  /** Tips（合并后） */
  tips: Record<string, Constraint>;

  /** 禁用的约束 ID */
  disabled: string[];

  /** 自定义约束 ID */
  custom: string[];
}