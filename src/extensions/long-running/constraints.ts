/**
 * Long-Running Agents 约束定义
 * 
 * 来源：Anthropic Engineering Blog - Effective Harnesses for Long-Running Agents
 * 参考：~/knowledge-base/projects/harness/anthropic-long-running-agents-roadmap.md
 * 
 * 这些约束是特定模式特有的，不是通用约束。
 * 适用于：
 * - 使用 feature_list.json 的项目
 * - 跨 session 追踪进度的项目
 * - 单功能推进的开发模式
 */

import type { Constraint, ConstraintTrigger } from '../../types/constraint';

/**
 * Long-Running Agents 铁律
 */
export const LONG_RUNNING_IRON_LAWS: Record<string, Constraint> = {
  /**
   * 单功能推进约束
   * 
   * 每次 session 只推进一个功能，防止 one-shotting（假完成）
   * 
   * 检查位置：agent-runtime CleanStateManager.onSessionEnd()
   */
  incremental_progress_required: {
    id: 'incremental_progress_required',
    rule: 'ONE FEATURE PER SESSION - NO ONE-SHOTTING',
    message: '每次 session 只推进一个功能，禁止一次性完成多个',
    level: 'iron_law',
    trigger: 'feature_completion_claim',
    enforcement: 'single-feature-checker',
    description: `在 Anthropic Long-Running Agents 模式下，每次 session 只推进一个功能。

目的：
- 防止 one-shotting（一次完成多个功能但质量不足）
- 确保每个功能有足够的验证
- 便于追踪进度和问题定位

实现：
- agent-runtime 的 CleanStateManager.onSessionEnd() 检查
- 检查 claude-progress.json 中当前 session 完成的功能数
- 如果 > 1，抛出 IronLawViolationError

注意：
- 这是跨 session 追踪，harness 无法单次检查
- 检查逻辑在 agent-runtime 实现，这里只定义`,
    enabled: true,
  },
};

/**
 * Long-Running Agents 指导原则
 */
export const LONG_RUNNING_GUIDELINES: Record<string, Constraint> = {
  /**
   * 功能拆解约束
   * 
   * 实现功能前必须先拆解为可验证的子任务
   * 
   * 检查位置：agent-workflows initializer.yml（workflow 层强制）
   */
  no_feature_without_decomposition: {
    id: 'no_feature_without_decomposition',
    rule: 'FEATURE IMPLEMENTATION REQUIRES DECOMPOSITION',
    message: '实现功能前必须先拆解为可验证的子任务',
    level: 'guideline',
    trigger: 'feature_development',
    enforcement: 'initializer-workflow',
    description: `在 Anthropic Long-Running Agents 模式下，功能开发前必须先拆解。

拆解流程：
1. 使用 initializer.yml 工作流拆解需求
2. 生成 feature_list.json
3. 每个功能包含可验证的测试步骤

例外：
- trivial_change: 简单修改（单行配置）
- bug_fix_only: 纯 bug 修复（不改变功能）
- internal_refactor: 内部重构（不影响对外接口）

注意：
- 这是 workflow 层强制，不是代码层检查
- initializer.yml 会自动拆解，不需要开发者手动`,
    enabled: true,
    exceptions: ['trivial_change', 'bug_fix_only', 'internal_refactor'],
  },

  /**
   * E2E 测试约束
   * 
   * 功能完成必须有端到端测试验证
   * 
   * 检查位置：agent-runtime PassesGate.registerExtension('puppeteer')
   */
  no_feature_completion_without_e2e_test: {
    id: 'no_feature_completion_without_e2e_test',
    rule: 'FEATURE COMPLETION REQUIRES E2E VERIFICATION',
    message: '功能完成必须有端到端测试验证',
    level: 'guideline',
    trigger: 'feature_completion_claim',
    enforcement: 'e2e-puppeteer',
    description: `在 Anthropic Long-Running Agents 模式下，功能完成需要 E2E 测试。

E2E 测试：
- 使用 Puppeteer 自动化浏览器测试
- 按 feature.steps 执行测试步骤
- 截图作为证据

例外：
- backend_only: 纯后端功能（无 UI）
- internal_refactor: 内部重构
- library_code: 库代码（不需要浏览器测试）

注意：
- 这是 PassesGate 扩展点，需要 agent-runtime 注册
- puppeteer-test.yml 会自动执行 E2E 测试`,
    enabled: true,
    exceptions: ['backend_only', 'internal_refactor', 'library_code'],
  },
};

/**
 * Long-Running Agents 提示
 */
export const LONG_RUNNING_TIPS: Record<string, Constraint> = {};

/**
 * 获取所有 Long-Running 约束
 */
export function getAllLongRunningConstraints(): Constraint[] {
  return [
    ...Object.values(LONG_RUNNING_IRON_LAWS),
    ...Object.values(LONG_RUNNING_GUIDELINES),
    ...Object.values(LONG_RUNNING_TIPS),
  ];
}

/**
 * 根据 trigger 查找 Long-Running 约束
 */
export function findLongRunningConstraintsByTrigger(trigger: ConstraintTrigger): Constraint[] {
  return getAllLongRunningConstraints().filter(constraint => {
    const triggers = Array.isArray(constraint.trigger) ? constraint.trigger : [constraint.trigger];
    return triggers.includes(trigger);
  });
}

/**
 * 根据 ID 获取 Long-Running 约束
 */
export function getLongRunningConstraint(id: string): Constraint | undefined {
  return LONG_RUNNING_IRON_LAWS[id] || LONG_RUNNING_GUIDELINES[id] || LONG_RUNNING_TIPS[id];
}