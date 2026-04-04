/**
 * @dommaker/harness - 主入口
 * 
 * 通用工程约束框架
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
// 预设导出
// ========================================
export * from './presets';

// ========================================
// 便捷 API
// ========================================

import { IronLawChecker } from './core/iron-laws/checker';
import type { IronLawContext, IronLawResult } from './types/iron-law';

/**
 * 检查铁律
 */
export async function checkIronLaws(
  context: IronLawContext
): Promise<IronLawResult[]> {
  return IronLawChecker.getInstance().checkAll(context);
}

/**
 * 执行前检查铁律
 */
export async function checkBeforeExecution(
  context: IronLawContext
): Promise<void> {
  return IronLawChecker.getInstance().beforeExecution(context);
}