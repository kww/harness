/**
 * 宽松预设
 * 
 * 只保留最核心的铁律，warning 可跳过
 */

import type { IronLaw, IronLawConfig } from '../types/iron-law';

export const RELAXED_PRESET: IronLawConfig = {
  preset: 'relaxed',
  enabled: true,
  ironLaws: [
    {
      id: 'no_fix_without_root_cause',
      rule: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
      message: '在修复问题之前，必须先进行根本原因调查',
      trigger: 'bug_fix_attempt',
      enforcement: 'debug-systematic',
      severity: 'warning',
      enabled: true,
    },
  ],
};