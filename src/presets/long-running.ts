/**
 * Long-Running Agents 预设
 * 
 * 适用于 Anthropic Long-Running Agents 模式的项目
 */

import type { PresetConfig } from './standard';
import {
  LONG_RUNNING_IRON_LAWS,
  LONG_RUNNING_GUIDELINES,
  getAllLongRunningConstraints,
} from '../extensions/long-running';

/**
 * Long-Running 预设
 * 
 * 包含：
 * - 核心约束（standard preset）
 * - Long-Running 扩展约束
 */
export const LONG_RUNNING_PRESET: PresetConfig = {
  name: 'long-running',
  ironLaws: null,    // 全部启用（包括扩展）
  guidelines: null,  // 全部启用（包括扩展）
  tips: null,        // 全部启用
};

/**
 * 获取 Long-Running 预设的约束列表
 */
export function getLongRunningPresetConstraints(): {
  ironLaws: string[];
  guidelines: string[];
  tips: string[];
} {
  const constraints = getAllLongRunningConstraints();
  
  return {
    ironLaws: constraints.filter(c => c.level === 'iron_law').map(c => c.id),
    guidelines: constraints.filter(c => c.level === 'guideline').map(c => c.id),
    tips: constraints.filter(c => c.level === 'tip').map(c => c.id),
  };
}

/**
 * 预设说明
 */
export const LONG_RUNNING_PRESET_INFO = {
  name: 'long-running',
  description: 'Anthropic Long-Running Agents 模式预设',
  usage: '适用于使用 feature_list.json 和跨 session 追踪的项目',
  features: [
    '单功能推进（每次 session 只做一个功能）',
    '功能拆解（initializer.yml 自动拆解需求）',
    'E2E 测试（Puppeteer 自动化验证）',
  ],
  requires: [
    'agent-workflows: initializer.yml, coding-agent.yml, puppeteer-test.yml',
    'agent-runtime: CleanStateManager, PuppeteerTool, PassesGate extension',
  ],
};