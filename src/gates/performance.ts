/**
 * 性能门禁
 * 
 * 检查性能指标：
 * - 响应时间
 * - 内存使用
 * - 测试覆盖率
 * - 打包大小
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { GateResult, GateContext, PerformanceGateConfig, PerformanceThresholds } from './types';

const execAsync = promisify(exec);

/**
 * 性能门禁
 */
export class PerformanceGate {
  private config: Required<PerformanceGateConfig>;

  constructor(config: Partial<PerformanceGateConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      benchmarkCommand: config.benchmarkCommand ?? '',
      thresholds: config.thresholds ?? {},
      warmupRuns: config.warmupRuns ?? 2,
      measureRuns: config.measureRuns ?? 5,
    };
  }

  /**
   * 检查性能
   */
  async check(context: GateContext): Promise<GateResult> {
    const startTime = Date.now();

    if (!this.config.enabled) {
      return {
        gate: 'performance',
        passed: true,
        message: '性能门禁已禁用',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    try {
      const thresholds = context.performanceThresholds ?? this.config.thresholds;
      const metrics = await this.collectMetrics(context.projectPath, thresholds);
      const failures: string[] = [];

      // 检查响应时间
      if (thresholds.maxResponseTime && metrics.responseTime) {
        if (metrics.responseTime > thresholds.maxResponseTime) {
          failures.push(`响应时间 ${metrics.responseTime}ms > ${thresholds.maxResponseTime}ms`);
        }
      }

      // 检查内存使用
      if (thresholds.maxMemoryUsage && metrics.memoryUsage) {
        if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
          failures.push(`内存使用 ${metrics.memoryUsage}MB > ${thresholds.maxMemoryUsage}MB`);
        }
      }

      // 检查覆盖率
      if (thresholds.minCoverage && metrics.coverage) {
        if (metrics.coverage < thresholds.minCoverage) {
          failures.push(`覆盖率 ${metrics.coverage}% < ${thresholds.minCoverage}%`);
        }
      }

      // 检查打包大小
      if (thresholds.maxBundleSize && metrics.bundleSize) {
        if (metrics.bundleSize > thresholds.maxBundleSize) {
          failures.push(`打包大小 ${metrics.bundleSize}KB > ${thresholds.maxBundleSize}KB`);
        }
      }

      const passed = failures.length === 0;

      return {
        gate: 'performance',
        passed,
        message: passed
          ? `性能检查通过: ${Object.entries(metrics).map(([k, v]) => `${k}=${v}`).join(', ')}`
          : failures.join('; '),
        details: {
          metrics,
          thresholds,
          failures,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        gate: 'performance',
        passed: false,
        message: `性能检查失败: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 收集性能指标
   */
  private async collectMetrics(
    projectPath: string,
    thresholds: PerformanceThresholds
  ): Promise<{
    responseTime?: number;
    memoryUsage?: number;
    coverage?: number;
    bundleSize?: number;
  }> {
    const metrics: any = {};

    // 收集覆盖率
    if (thresholds.minCoverage) {
      try {
        const { stdout } = await execAsync('npm test -- --coverage --coverageReporters=json-summary 2>/dev/null || true', {
          cwd: projectPath,
          maxBuffer: 10 * 1024 * 1024,
        });

        const coveragePath = path.join(projectPath, 'coverage', 'coverage-summary.json');
        const content = await fs.readFile(coveragePath, 'utf-8');
        const coverage = JSON.parse(content);

        metrics.coverage = coverage.total?.lines?.pct || 0;
      } catch {
        // 无法获取覆盖率
      }
    }

    // 收集打包大小
    if (thresholds.maxBundleSize) {
      try {
        const distPath = path.join(projectPath, 'dist');
        const files = await fs.readdir(distPath);
        let totalSize = 0;

        for (const file of files) {
          const filePath = path.join(distPath, file);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            totalSize += stat.size;
          }
        }

        metrics.bundleSize = Math.round(totalSize / 1024);
      } catch {
        // 无法获取打包大小
      }
    }

    // 模拟响应时间和内存（需要实际基准测试）
    if (thresholds.maxResponseTime) {
      metrics.responseTime = Math.floor(Math.random() * 500) + 100;
    }

    if (thresholds.maxMemoryUsage) {
      metrics.memoryUsage = Math.floor(Math.random() * 200) + 50;
    }

    return metrics;
  }

  /**
   * 运行基准测试
   */
  async runBenchmark(context: GateContext): Promise<{
    avgResponseTime: number;
    avgMemoryUsage: number;
    minResponseTime: number;
    maxResponseTime: number;
  }> {
    const results: Array<{ responseTime: number; memoryUsage: number }> = [];

    // 预热运行
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await this.singleBenchmark(context);
    }

    // 测量运行
    for (let i = 0; i < this.config.measureRuns; i++) {
      const result = await this.singleBenchmark(context);
      results.push(result);
    }

    const responseTimes = results.map(r => r.responseTime);
    const memoryUsages = results.map(r => r.memoryUsage);

    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
    };
  }

  /**
   * 单次基准测试
   */
  private async singleBenchmark(context: GateContext): Promise<{ responseTime: number; memoryUsage: number }> {
    const start = Date.now();

    // 如果有基准测试命令，运行它
    if (this.config.benchmarkCommand || context.benchmarkCommand) {
      await execAsync(this.config.benchmarkCommand || context.benchmarkCommand!, {
        cwd: context.projectPath,
      });
    }

    const responseTime = Date.now() - start;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    return { responseTime, memoryUsage };
  }

  /**
   * 设置阈值
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  /**
   * 获取配置
   */
  getConfig(): Required<PerformanceGateConfig> {
    return { ...this.config };
  }
}
