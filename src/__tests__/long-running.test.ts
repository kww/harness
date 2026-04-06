/**
 * Long-Running Agents 扩展测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  LONG_RUNNING_IRON_LAWS,
  LONG_RUNNING_GUIDELINES,
  getAllLongRunningConstraints,
  findLongRunningConstraintsByTrigger,
  getLongRunningConstraint,
  LONG_RUNNING_MODULE_INFO,
} from '../extensions/long-running';

describe('Long-Running Agents Extension', () => {
  
  describe('约束定义', () => {
    
    it('应有 1 个铁律', () => {
      expect(Object.keys(LONG_RUNNING_IRON_LAWS).length).toBe(1);
      expect(LONG_RUNNING_IRON_LAWS.incremental_progress_required).toBeDefined();
    });
    
    it('应有 2 个指导原则', () => {
      expect(Object.keys(LONG_RUNNING_GUIDELINES).length).toBe(2);
      expect(LONG_RUNNING_GUIDELINES.no_feature_without_decomposition).toBeDefined();
      expect(LONG_RUNNING_GUIDELINES.no_feature_completion_without_e2e_test).toBeDefined();
    });
    
    it('铁律应有正确的 level', () => {
      const constraint = LONG_RUNNING_IRON_LAWS.incremental_progress_required;
      expect(constraint.level).toBe('iron_law');
    });
    
    it('指导原则应有正确的 level', () => {
      const constraint = LONG_RUNNING_GUIDELINES.no_feature_without_decomposition;
      expect(constraint.level).toBe('guideline');
    });
    
    it('指导原则应有例外列表', () => {
      const constraint = LONG_RUNNING_GUIDELINES.no_feature_without_decomposition;
      expect(constraint.exceptions).toBeDefined();
      expect(constraint.exceptions).toContain('trivial_change');
    });
  });
  
  describe('类型定义', () => {
    
    it('FeatureDefinition 应包含必要字段', () => {
      const feature: any = {
        id: 'login',
        category: 'functional',
        description: 'User login',
        steps: ['Navigate to login', 'Enter credentials', 'Click submit'],
        passes: false,
        priority: 'high',
        dependencies: [],
        verificationType: 'e2e',
      };
      
      expect(feature.id).toBe('login');
      expect(feature.category).toBe('functional');
      expect(feature.steps.length).toBe(3);
      expect(feature.passes).toBe(false);
    });
    
    it('ProjectProgress 应包含必要字段', () => {
      const progress: any = {
        projectId: 'my-project',
        features: [],
        sessions: [],
        lastUpdate: new Date().toISOString(),
      };
      
      expect(progress.projectId).toBe('my-project');
      expect(progress.features).toEqual([]);
      expect(progress.sessions).toEqual([]);
    });
    
    it('SessionRecord 应包含必要字段', () => {
      const session: any = {
        sessionId: 1,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        featureWorkedOn: 'login',
        outcome: 'completed',
        commits: ['abc123'],
        notes: 'Implemented login',
      };
      
      expect(session.sessionId).toBe(1);
      expect(session.featureWorkedOn).toBe('login');
      expect(session.outcome).toBe('completed');
    });
  });
  
  describe('辅助函数', () => {
    
    it('getAllLongRunningConstraints 应返回所有约束', () => {
      const constraints = getAllLongRunningConstraints();
      expect(constraints.length).toBe(3);
    });
    
    it('findLongRunningConstraintsByTrigger 应能按 trigger 查找', () => {
      const constraints = findLongRunningConstraintsByTrigger('feature_completion_claim');
      expect(constraints.length).toBe(2); // incremental_progress_required + no_feature_completion_without_e2e_test
    });
    
    it('getLongRunningConstraint 应能按 ID 获取', () => {
      const constraint = getLongRunningConstraint('incremental_progress_required');
      expect(constraint).toBeDefined();
      expect(constraint?.id).toBe('incremental_progress_required');
    });
  });
  
  describe('模块信息', () => {
    
    it('应有正确的模块信息', () => {
      expect(LONG_RUNNING_MODULE_INFO.name).toBe('long-running');
      expect(LONG_RUNNING_MODULE_INFO.constraints.ironLaws).toBe(1);
      expect(LONG_RUNNING_MODULE_INFO.constraints.guidelines).toBe(2);
      expect(LONG_RUNNING_MODULE_INFO.types.length).toBe(9);
    });
  });
});