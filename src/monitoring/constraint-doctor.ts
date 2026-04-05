/**
 * Agent 诊断接口
 *
 * 当检测到异常时，提供 Agent 分析 traces 的能力
 *
 * 成本控制：
 * - 仅在有异常时触发
 * - 精简 prompt，不喂全部 traces
 * - ~2000 Token/次
 */

import type {
  ExecutionTrace,
  TraceAnomaly,
  TraceSummary,
} from '../types/trace';

/**
 * 诊断结果
 */
export interface Diagnosis {
  /** 异常 ID */
  anomalyId: string;

  /** 约束 ID */
  constraintId: string;

  /** 诊断时间 */
  diagnosedAt: number;

  /** 根因分析 */
  rootCause: {
    /** 主要原因 */
    primary: string;

    /** 次要原因 */
    secondary?: string[];

    /** 相关 traces */
    evidence: ExecutionTrace[];
  };

  /** 影响评估 */
  impact: {
    /** 影响程度 */
    severity: 'low' | 'medium' | 'high';

    /** 影响范围 */
    scope: 'single_project' | 'multiple_projects' | 'team';

    /** 用户影响 */
    userImpact: string;
  };

  /** 改进建议 */
  recommendations: {
    /** 建议类型 */
    type: 'add_exception' | 'adjust_threshold' | 'modify_constraint' | 'user_training';

    /** 建议内容 */
    content: string;

    /** 预期效果 */
    expectedOutcome: string;

    /** 实施成本 */
    implementationCost: 'low' | 'medium' | 'high';
  }[];

  /** 是否需要变更 */
  needsChange: boolean;

  /** 紧急程度 */
  urgency: 'low' | 'medium' | 'high';
}

/**
 * 诊断配置
 */
export interface ConstraintDoctorConfig {
  /** 是否启用 Agent 诊断（默认 false，需要显式启用） */
  enabled?: boolean;

  /** Agent 类型（预留，后续对接） */
  agentType?: 'claude-code' | 'codex' | 'openai';

  /** 最大 traces 数量（用于构造 prompt） */
  maxTracesInPrompt?: number;

  /** 是否自动生成提案 */
  autoGenerateProposal?: boolean;
}

/**
 * Constraint Doctor - 约束诊断器
 *
 * 使用方式：
 * ```typescript
 * const doctor = new ConstraintDoctor(analyzer);
 * const diagnosis = await doctor.diagnose(anomaly);
 *
 * if (diagnosis.needsChange) {
 *   const proposal = await evolver.propose(diagnosis);
 * }
 * ```
 */
export class ConstraintDoctor {
  private config: ConstraintDoctorConfig;
  private traces: ExecutionTrace[];
  private summary: TraceSummary | null;

  constructor(config?: ConstraintDoctorConfig) {
    this.config = {
      enabled: false,
      maxTracesInPrompt: 20,
      autoGenerateProposal: false,
      ...config,
    };
    this.traces = [];
    this.summary = null;
  }

  /**
   * 设置诊断数据
   */
  setData(traces: ExecutionTrace[], summary?: TraceSummary): void {
    this.traces = traces;
    this.summary = summary || null;
  }

  /**
   * 诊断异常
 *
   * 如果 Agent 未启用，返回基于规则的诊断
   */
  async diagnose(anomaly: TraceAnomaly): Promise<Diagnosis> {
    // 过滤相关 traces
    const relevantTraces = this.filterRelevantTraces(anomaly);

    // 基于规则的初步诊断（不消耗 Token）
    const ruleBasedDiagnosis = this.ruleBasedDiagnose(anomaly, relevantTraces);

    // 如果 Agent 启用，可以进一步分析（预留）
    if (this.config.enabled && this.config.agentType) {
      // TODO: 调用 Agent 进行深度分析
      // const agentDiagnosis = await this.agentDiagnose(anomaly, relevantTraces);
      // return agentDiagnosis;
    }

    return ruleBasedDiagnosis;
  }

  /**
   * 基于规则的诊断（零 Token）
 *
   * 根据异常类型应用预设的诊断规则
   */
  private ruleBasedDiagnose(
    anomaly: TraceAnomaly,
    traces: ExecutionTrace[]
  ): Diagnosis {
    const diagnosis: Diagnosis = {
      anomalyId: `${anomaly.constraintId}-${anomaly.type}-${Date.now()}`,
      constraintId: anomaly.constraintId,
      diagnosedAt: Date.now(),
      rootCause: {
        primary: '',
        secondary: [],
        evidence: traces.slice(0, this.config.maxTracesInPrompt!),
      },
      impact: {
        severity: 'medium',
        scope: 'single_project',
        userImpact: '',
      },
      recommendations: [],
      needsChange: false,
      urgency: 'low',
    };

    // 根据异常类型诊断
    switch (anomaly.type) {
      case 'high_bypass_rate':
        diagnosis.rootCause.primary = '约束过于严格，用户频繁绕过';
        diagnosis.rootCause.secondary = [
          '约束触发条件过于宽泛',
          '缺乏必要的例外条件',
          '约束定义与实际场景不匹配',
        ];
        diagnosis.impact.userImpact = '用户被迫绕过约束，降低信任度';
        diagnosis.recommendations = [
          {
            type: 'add_exception',
            content: `为约束 ${anomaly.constraintId} 添加常见例外条件`,
            expectedOutcome: '绕过率降低至 20% 以下',
            implementationCost: 'low',
          },
          {
            type: 'adjust_threshold',
            content: '调整触发条件，减少误触发',
            expectedOutcome: '减少不必要的约束检查',
            implementationCost: 'medium',
          },
        ];
        diagnosis.needsChange = true;
        diagnosis.urgency = anomaly.data.currentRate > 0.5 ? 'high' : 'medium';
        break;

      case 'rising_fail_rate':
        diagnosis.rootCause.primary = '约束失败率呈上升趋势';
        diagnosis.rootCause.secondary = [
          '代码质量下降',
          '约束检查逻辑存在 bug',
          '环境变化导致约束不再适用',
        ];
        diagnosis.impact.userImpact = '开发效率下降，约束频繁阻止正常操作';
        diagnosis.recommendations = [
          {
            type: 'modify_constraint',
            content: '审查约束逻辑，确认是否符合预期',
            expectedOutcome: '恢复正常的失败率水平',
            implementationCost: 'medium',
          },
          {
            type: 'user_training',
            content: '指导用户正确理解约束要求',
            expectedOutcome: '减少因误解导致的失败',
            implementationCost: 'low',
          },
        ];
        diagnosis.needsChange = true;
        diagnosis.urgency = 'medium';
        break;

      case 'rising_bypass_rate':
        diagnosis.rootCause.primary = '绕过率呈上升趋势';
        diagnosis.rootCause.secondary = [
          '用户对约束的接受度下降',
          '约束规则逐渐不适应新的开发模式',
          '用户发现了绕过约束的"捷径"',
        ];
        diagnosis.impact.userImpact = '约束逐渐失去约束力';
        diagnosis.recommendations = [
          {
            type: 'modify_constraint',
            content: '重新评估约束的必要性',
            expectedOutcome: '恢复约束的权威性',
            implementationCost: 'high',
          },
        ];
        diagnosis.needsChange = true;
        diagnosis.urgency = 'high';
        break;

      case 'low_pass_rate':
        diagnosis.rootCause.primary = '约束通过率过低';
        diagnosis.rootCause.secondary = [
          '约束要求过于严格',
          '实际代码质量不达标',
          '约束定义存在歧义',
        ];
        diagnosis.impact.userImpact = '几乎所有操作都被阻止，开发受阻';
        diagnosis.recommendations = [
          {
            type: 'adjust_threshold',
            content: '放宽约束要求，设置合理阈值',
            expectedOutcome: '通过率提升至 50% 以上',
            implementationCost: 'low',
          },
        ];
        diagnosis.needsChange = true;
        diagnosis.urgency = 'high';
        break;

      case 'exception_overuse':
        diagnosis.rootCause.primary = '例外条件被过度使用';
        diagnosis.rootCause.secondary = [
          '例外条件过于宽泛',
          '例外条件定义不够精确',
          '用户习惯性申请例外',
        ];
        diagnosis.impact.userImpact = '例外成为常态，约束失去意义';
        diagnosis.recommendations = [
          {
            type: 'modify_constraint',
            content: '缩小例外条件范围，提高例外门槛',
            expectedOutcome: '例外使用率降低至 20% 以下',
            implementationCost: 'medium',
          },
        ];
        diagnosis.needsChange = true;
        diagnosis.urgency = 'medium';
        break;
    }

    // 根据约束层级调整严重性
    if (anomaly.level === 'iron_law') {
      diagnosis.impact.severity = 'high';
      diagnosis.urgency = 'medium'; // Iron law 总是至少 medium
    }

    return diagnosis;
  }

  /**
   * 过滤相关 traces
 *
   * 只保留与异常相关的 traces，减少 prompt 内容
   */
  private filterRelevantTraces(anomaly: TraceAnomaly): ExecutionTrace[] {
    return this.traces.filter(t => {
      // 必须是同一个约束
      if (t.constraintId !== anomaly.constraintId) return false;

      // 失败或绕过的更有诊断价值
      if (t.result === 'fail' || t.result === 'bypassed') return true;

      // 保留少量通过的作为对比
      return true;
    });
  }

  /**
   * 批量诊断多个异常
   */
  async diagnoseBatch(anomalies: TraceAnomaly[]): Promise<Diagnosis[]> {
    return Promise.all(anomalies.map(a => this.diagnose(a)));
  }

  /**
   * 生成诊断报告（文本格式）
   */
  generateReport(diagnosis: Diagnosis): string {
    const lines: string[] = [];

    lines.push(`# Diagnosis Report`);
    lines.push(`Constraint: ${diagnosis.constraintId}`);
    lines.push(`Anomaly: ${diagnosis.anomalyId}`);
    lines.push(`Diagnosed: ${new Date(diagnosis.diagnosedAt).toISOString()}`);
    lines.push('');

    // 根因
    lines.push(`## Root Cause`);
    lines.push('');
    lines.push(`**Primary**: ${diagnosis.rootCause.primary}`);
    if (diagnosis.rootCause.secondary?.length) {
      lines.push('');
      lines.push('**Secondary**:');
      for (const s of diagnosis.rootCause.secondary) {
        lines.push(`- ${s}`);
      }
    }
    lines.push('');

    // 影响
    lines.push(`## Impact`);
    lines.push('');
    lines.push(`- Severity: ${diagnosis.impact.severity}`);
    lines.push(`- Scope: ${diagnosis.impact.scope}`);
    lines.push(`- User Impact: ${diagnosis.impact.userImpact}`);
    lines.push('');

    // 建议
    lines.push(`## Recommendations`);
    lines.push('');

    for (const r of diagnosis.recommendations) {
      lines.push(`### ${r.type}`);
      lines.push(`- Content: ${r.content}`);
      lines.push(`- Expected: ${r.expectedOutcome}`);
      lines.push(`- Cost: ${r.implementationCost}`);
      lines.push('');
    }

    // 决策
    lines.push(`## Decision`);
    lines.push('');
    lines.push(`- Needs Change: ${diagnosis.needsChange ? '✅ Yes' : '❌ No'}`);
    lines.push(`- Urgency: ${diagnosis.urgency}`);

    return lines.join('\n');
  }

  /**
   * 保存诊断结果
   */
  saveDiagnosis(diagnosis: Diagnosis, outputPath: string): void {
    const fs = require('fs');
    const path = require('path');

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(diagnosis, null, 2), 'utf-8');
  }

  /**
   * 加载诊断结果
   */
  loadDiagnosis(inputPath: string): Diagnosis {
    const fs = require('fs');
    const content = fs.readFileSync(inputPath, 'utf-8');
    return JSON.parse(content) as Diagnosis;
  }
}

/**
 * 创建诊断器
 */
export function createDoctor(config?: ConstraintDoctorConfig): ConstraintDoctor {
  return new ConstraintDoctor(config);
}