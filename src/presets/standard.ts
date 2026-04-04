/**
 * 标准预设
 */

import type { IronLawConfig } from '../types';

export const STANDARD_PRESET: IronLawConfig = {
  preset: 'standard',
  enabled: true,
  ironLaws: [
    {
      id: 'no_self_approval',
      rule: '禁止自评通过',
      message: '任务必须通过测试验证，不能自评完成',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'test_required',
      rule: '代码变更必须有测试',
      message: '修改核心代码时建议添加或更新测试',
      severity: 'warning',
      trigger: ['module_modification'],
      enabled: true,
    },
    {
      id: 'no_bypass_checkpoint',
      rule: '禁止跳过检查点',
      message: '关键检查点必须通过',
      severity: 'warning',
      enabled: true,
    },
    {
      id: 'coverage_recommended',
      rule: '测试覆盖率建议',
      message: '建议测试覆盖率达到 60% 以上',
      severity: 'info',
      enabled: true,
    },
  ],
};
