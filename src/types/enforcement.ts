/**
 * Enforcement 执行器类型定义
 */

import type { Constraint, ConstraintContext } from './constraint';

export type EnforcementId = string;

export interface EnforcementContext extends ConstraintContext {
  enforcementId: EnforcementId;
  constraint: Constraint;
  params?: Record<string, any>;
}

export interface EnforcementResult {
  passed: boolean;
  evidence?: string;
  message?: string;
  error?: string;
  duration?: number;
  validatedAt?: Date;
}

export interface EnforcementExecutor {
  execute(context: EnforcementContext): Promise<EnforcementResult>;
  description?: string;
  supportedParams?: string[];
}

export interface EnforcementRegistration {
  id: EnforcementId;
  executor: EnforcementExecutor;
  registeredAt: Date;
  source?: string;
}

export interface InterceptionResult {
  passed: boolean;
  constraints: {
    constraint: Constraint;
    enforcementResult?: EnforcementResult;
    skipped?: boolean;
    skipReason?: string;
  }[];
  violations: Constraint[];
  message?: string;
  interceptedAt: Date;
}