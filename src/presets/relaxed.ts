/**
 * 宽松预设
 */

import type { IronLawConfig } from '../types';

export const RELAXED_PRESET: IronLawConfig = {
  preset: 'relaxed',
  enabled: true,
  ironLaws: [
    {
      id: 'no_self_approval',
      rule: '禁止自评通过',
      message: '任务建议通过测试验证',
      severity: 'warning',
      enabled: true,
    },
    {
      id: 'test_recommended',
      rule: '建议添加测试',
      message: '修改核心代码时建议添加测试',
      severity: 'info',
      trigger: ['module_modification'],
      enabled: true,
    },
  ],
};
