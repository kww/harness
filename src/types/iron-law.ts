/**
 * 铁律类型定义
 * 
 * @deprecated 请使用 './constraint' 代替
 * 
 * 此模块保留用于向后兼容。
 * 新代码应使用三层约束类型：
 * - Constraint
 * - ConstraintLevel ('iron_law' | 'guideline' | 'tip')
 */

import type {
  ConstraintId,
  ConstraintLevel,
  ConstraintTrigger,
  Constraint,
  ConstraintResult,
  ConstraintContext,
} from './constraint';

import { ConstraintViolationError } from './constraint';

// 重新导出新的约束类型
export type {
  ConstraintId as IronLawId,
  ConstraintLevel,
  ConstraintTrigger as IronLawTrigger,
  Constraint as IronLaw,
  ConstraintResult as IronLawResult,
  ConstraintContext as IronLawContext,
} from './constraint';

export {
  ConstraintViolationError as IronLawViolationError,
} from './constraint';

// 向后兼容的 severity 类型
export type IronLawSeverity = 'error' | 'warning' | 'info';

// 向后兼容的配置类型
export interface IronLawConfig {
  /** @deprecated */
  ironLaws: Constraint[];
  /** @deprecated */
  preset?: 'strict' | 'standard' | 'relaxed';
  /** @deprecated */
  enabled?: boolean;
  /** @deprecated */
  configPath?: string;
}