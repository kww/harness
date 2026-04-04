/**
 * 预设导出
 */

import { STRICT_PRESET } from './strict';
import { STANDARD_PRESET } from './standard';
import { RELAXED_PRESET } from './relaxed';
import type { IronLawConfig } from '../types/iron-law';

export const PRESETS: Record<string, IronLawConfig> = {
  strict: STRICT_PRESET,
  standard: STANDARD_PRESET,
  relaxed: RELAXED_PRESET,
};

export { STRICT_PRESET, STANDARD_PRESET, RELAXED_PRESET };

/**
 * 获取预设配置
 */
export function getPreset(name: string): IronLawConfig {
  return PRESETS[name] || STANDARD_PRESET;
}