/**
 * 约束模块入口
 */

// 三层约束定义
export {
  IRON_LAWS,
  GUIDELINES,
  TIPS,
  getAllConstraints,
  findConstraintsByTrigger,
  getConstraint,
  // 向后兼容
  getAllLaws,
  findLawsByTrigger,
  getLaw,
  filterLawsBySeverity,
} from './definitions';

// 约束检查器
export {
  ConstraintChecker,
  checkConstraint,
  checkConstraints,
  checkBeforeExecution,
  constraintChecker,
  // 向后兼容
  IronLawChecker,
  checkIronLaw,
  checkAllIronLaws,
  ironLawChecker,
} from './checker';

// 类型导出
export type {
  ConstraintId,
  ConstraintLevel,
  ConstraintTrigger,
  Constraint,
  ConstraintResult,
  ConstraintContext,
  ConstraintCheckResult,
  // 向后兼容
  IronLawId,
  IronLawSeverity,
  IronLawTrigger,
  IronLaw,
  IronLawResult,
  IronLawContext,
} from '../../types/constraint';

export {
  ConstraintViolationError,
  // 向后兼容
  IronLawViolationError,
} from '../../types/constraint';