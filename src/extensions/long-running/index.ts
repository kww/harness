/**
 * Long-Running Agents 扩展模块
 * 
 * 来源：Anthropic Engineering Blog - Effective Harnesses for Long-Running Agents
 * 参考：~/knowledge-base/projects/harness/anthropic-long-running-agents-roadmap.md
 * 
 * 这个扩展模块提供：
 * - 3 个特定约束（单功能推进、功能拆解、E2E 测试）
 * - 类型定义（FeatureDefinition, ProjectProgress）
 * - Puppeteer 测试相关类型
 * 
 * 使用方式：
 * 1. 选择 preset: 'long-running'
 * 2. agent-runtime 导入并实现检查逻辑
 * 3. agent-workflows 使用 initializer.yml 等工作流
 */

// 导出约束
export {
  LONG_RUNNING_IRON_LAWS,
  LONG_RUNNING_GUIDELINES,
  LONG_RUNNING_TIPS,
  getAllLongRunningConstraints,
  findLongRunningConstraintsByTrigger,
  getLongRunningConstraint,
} from './constraints';

// 导出类型
export {
  FeatureDefinition,
  FeatureList,
  ProjectProgress,
  FeatureStatus,
  SessionRecord,
  TestStep,
  StepResult,
  PuppeteerTestInput,
  PuppeteerTestResult,
} from './types';

// 导出模块信息
export const LONG_RUNNING_MODULE_INFO = {
  name: 'long-running',
  version: '0.7.0',
  description: 'Anthropic Long-Running Agents 扩展',
  constraints: {
    ironLaws: 1,
    guidelines: 2,
    tips: 0,
  },
  types: [
    'FeatureDefinition',
    'FeatureList',
    'ProjectProgress',
    'FeatureStatus',
    'SessionRecord',
    'TestStep',
    'StepResult',
    'PuppeteerTestInput',
    'PuppeteerTestResult',
  ],
};