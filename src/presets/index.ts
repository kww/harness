/**
 * 预设模块入口
 */

export {
  STRICT_PRESET,
  STANDARD_PRESET,
  RELAXED_PRESET,
  getPreset,
  // 向后兼容
  STANDARD_IRON_LAWS_CONFIG,
  getIronLawPreset,
} from './standard';

export type { PresetConfig } from './standard';

// Long-Running Agents 预设
export {
  LONG_RUNNING_PRESET,
  LONG_RUNNING_PRESET_INFO,
  getLongRunningPresetConstraints,
} from './long-running';