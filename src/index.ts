/**
 * @dommaker/harness - 主入口
 * 
 * 通用工程约束框架
 * 
 * 三层约束体系：
 * - Iron Laws：绝对禁止，无例外
 * - Guidelines：优先建议，有例外
 * - Tips：信息性提示，可忽略
 */

// ========================================
// 类型导出
// ========================================
export * from './types';

// ========================================
// 核心功能导出
// ========================================
export * from './core';

// ========================================
// 监控导出
// ========================================
export * from './monitoring';

// ========================================
// 预设导出
// ========================================
export * from './presets';

// ========================================
// 便捷 API
// ========================================

import { constraintChecker } from './core/constraints/checker';
import type { ConstraintContext, ConstraintCheckResult, ConstraintResult } from './types/constraint';
// 向后兼容
import type { IronLawContext, IronLawResult } from './types/constraint';

/**
 * 检查约束（三层）
 */
export async function checkConstraints(
  context: ConstraintContext
): Promise<ConstraintCheckResult> {
  return constraintChecker.checkConstraints(context);
}

/**
 * 执行前检查（仅 Iron Laws）
 */
export async function checkBeforeExecution(
  context: ConstraintContext
): Promise<void> {
  return constraintChecker.beforeExecution(context);
}

// ========================================
// 向后兼容 API
// ========================================

/**
 * @deprecated 使用 checkConstraints 代替
 */
export async function checkIronLaws(
  context: IronLawContext
): Promise<IronLawResult[]> {
  const result = await constraintChecker.checkConstraints(context);
  return [...result.ironLaws, ...result.guidelines, ...result.tips] as IronLawResult[];
}