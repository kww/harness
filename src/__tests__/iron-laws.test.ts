/**
 * 铁律系统测试
 */

import { describe, it, expect } from '@jest/globals';
import { IRON_LAWS, findLawsByTrigger, getAllLaws, getLaw } from '../core/iron-laws/definitions';
import { IronLawChecker } from '../core/iron-laws/checker';
import type { IronLawContext } from '../types/iron-law';

describe('Iron Law Definitions', () => {
  it('should have 13 iron laws defined', () => {
    expect(Object.keys(IRON_LAWS)).toHaveLength(13);
  });

  it('should find laws by trigger', () => {
    const laws = findLawsByTrigger('bug_fix_attempt');
    expect(laws.length).toBeGreaterThan(0);
    expect(laws[0]?.id).toBe('no_fix_without_root_cause');
  });

  it('should get all laws', () => {
    const laws = getAllLaws();
    expect(laws.length).toBe(13);
  });

  it('should get single law by id', () => {
    const law = getLaw('no_fix_without_root_cause');
    expect(law).toBeDefined();
    expect(law?.id).toBe('no_fix_without_root_cause');
    expect(law?.severity).toBe('error');
  });

  it('should return undefined for unknown law', () => {
    const law = getLaw('unknown_law');
    expect(law).toBeUndefined();
  });
});

describe('Iron Law Checker', () => {
  it('should return singleton instance', () => {
    const instance1 = IronLawChecker.getInstance();
    const instance2 = IronLawChecker.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should find applicable laws for context', () => {
    const checker = IronLawChecker.getInstance();
    const context: IronLawContext = {
      operation: 'bug_fix_attempt',
    };

    const laws = checker.findApplicableLaws(context);
    expect(laws).toContain('no_fix_without_root_cause');
  });

  it('should check iron law', async () => {
    const checker = IronLawChecker.getInstance();

    // 检查未满足前置条件的情况
    const result = await checker.check('no_fix_without_root_cause', {
      operation: 'bug_fix_attempt',
      hasRootCauseInvestigation: false,
    });

    expect(result.satisfied).toBe(false);
    expect(result.law?.id).toBe('no_fix_without_root_cause');
  });

  it('should check iron law with satisfied precondition', async () => {
    const checker = IronLawChecker.getInstance();

    // 检查满足前置条件的情况
    const result = await checker.check('no_fix_without_root_cause', {
      operation: 'bug_fix_attempt',
      hasRootCauseInvestigation: true,
    });

    expect(result.satisfied).toBe(true);
  });

  it('should return error for unknown law', async () => {
    const checker = IronLawChecker.getInstance();

    const result = await checker.check('unknown_law', {
      operation: 'bug_fix_attempt',
    });

    expect(result.satisfied).toBe(false);
    expect(result.message).toContain('未知的铁律');
  });

  it('should check all iron laws', async () => {
    const checker = IronLawChecker.getInstance();
    const context: IronLawContext = {
      operation: 'code_implementation',
    };

    const results = await checker.checkAll(context);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Iron Law Severity', () => {
  it('should have correct severity levels', () => {
    const errorLaws = Object.values(IRON_LAWS).filter(l => l.severity === 'error');
    const warningLaws = Object.values(IRON_LAWS).filter(l => l.severity === 'warning');

    expect(errorLaws.length).toBeGreaterThan(0);
    expect(warningLaws.length).toBeGreaterThan(0);
  });

  it('should have error severity for critical laws', () => {
    expect(IRON_LAWS['no_fix_without_root_cause']?.severity).toBe('error');
    expect(IRON_LAWS['no_completion_without_verification']?.severity).toBe('error');
    expect(IRON_LAWS['no_code_without_test']?.severity).toBe('error');
    expect(IRON_LAWS['no_self_approval']?.severity).toBe('error');
    expect(IRON_LAWS['no_bypass_checkpoint']?.severity).toBe('error');
  });
});
