/**
 * 预设导出入口
 */

import type { IronLawConfig } from '../types';

export { STRICT_PRESET } from './strict';
export { STANDARD_PRESET } from './standard';
export { RELAXED_PRESET } from './relaxed';

/**
 * 预设类型
 */
export type PresetName = 'strict' | 'standard' | 'relaxed';

/**
 * 获取预设配置
 */
export function getPreset(name: PresetName): IronLawConfig {
  switch (name) {
    case 'strict':
      return (await import('./strict')).STRICT_PRESET;
    case 'standard':
      return (await import('./standard')).STANDARD_PRESET;
    case 'relaxed':
      return (await import('./relaxed')).RELAXED_PRESET;
    default:
      throw new Error(`Unknown preset: ${name}`);
  }
}

/**
 * 预设列表
 */
export const PRESETS: Record<PresetName, IronLawConfig> = {
  strict: null as any, // 延迟加载
  standard: null as any,
  relaxed: null as any,
};
