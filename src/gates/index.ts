/**
 * 门禁系统导出
 * 
 * 统一导出所有门禁类型
 */

// 类型导出
export type {
  GateResult,
  GateContext,
  PerformanceThresholds,
  ReviewGateConfig,
  SecurityGateConfig,
  PerformanceGateConfig,
  ContractGateConfig,
} from './types';

// 门禁类导出
export { ReviewGate } from './review';
export { SecurityGate } from './security';
export { PerformanceGate } from './performance';
export { ContractGate } from './contract';

// 便捷工厂函数
import { ReviewGate } from './review';
import { SecurityGate } from './security';
import { PerformanceGate } from './performance';
import { ContractGate } from './contract';
import type {
  ReviewGateConfig,
  SecurityGateConfig,
  PerformanceGateConfig,
  ContractGateConfig,
} from './types';

export function createReviewGate(config?: Partial<ReviewGateConfig>): ReviewGate {
  return new ReviewGate(config);
}

export function createSecurityGate(config?: Partial<SecurityGateConfig>): SecurityGate {
  return new SecurityGate(config);
}

export function createPerformanceGate(config?: Partial<PerformanceGateConfig>): PerformanceGate {
  return new PerformanceGate(config);
}

export function createContractGate(config?: Partial<ContractGateConfig>): ContractGate {
  return new ContractGate(config);
}
