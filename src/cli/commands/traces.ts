/**
 * Trace CLI 命令
 *
 * 查看和分析 Execution Traces
 */

import * as fs from 'fs';
import * as path from 'path';
import { TraceCollector, getTraceCollector } from '../../monitoring/traces';
import { TraceAnalyzer, createAnalyzer } from '../../monitoring/trace-analyzer';
import type { TraceSummary, TraceAnomaly } from '../../types/trace';

/**
 * trace 命令
 */
export async function tracesCommand(
  subcommand: string,
  options: {
    hours?: number;
    constraintId?: string;
    format?: 'json' | 'text';
    maxAgeDays?: number;
  }
): Promise<void> {
  switch (subcommand) {
    case 'stats':
      await showStats(options);
      break;

    case 'summary':
      await showSummary(options);
      break;

    case 'anomalies':
      await showAnomalies(options);
      break;

    case 'report':
      await generateReport(options);
      break;

    case 'clean':
      await cleanTraces(options);
      break;

    default:
      console.log('Usage: harness traces <subcommand>');
      console.log('');
      console.log('Subcommands:');
      console.log('  stats     Show trace file statistics');
      console.log('  summary   Show constraint summaries');
      console.log('  anomalies Show detected anomalies');
      console.log('  report    Generate full report');
      console.log('  clean     Clean old trace files');
      console.log('');
      console.log('Options:');
      console.log('  --hours <n>       Analyze last N hours (default: 1)');
      console.log('  --constraint <id> Filter by constraint ID');
      console.log('  --format <format> Output format: json or text (default: text)');
  }
}

/**
 * 显示 trace 文件统计
 */
async function showStats(options: { format?: 'json' | 'text' }): Promise<void> {
  const collector = getTraceCollector();
  const stats = collector.getStats();

  if (options.format === 'json') {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log('📊 Trace File Statistics');
    console.log('');
    console.log(`File: ${collector.getStats().fileExists ? '✅ exists' : '❌ not found'}`);
    if (stats.fileExists) {
      console.log(`Size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
      console.log(`Lines: ${stats.totalLines}`);
      if (stats.oldestTrace) {
        console.log(`Oldest: ${new Date(stats.oldestTrace).toISOString()}`);
      }
      if (stats.newestTrace) {
        console.log(`Newest: ${new Date(stats.newestTrace).toISOString()}`);
      }
    }
  }
}

/**
 * 显示约束汇总
 */
async function showSummary(options: {
  hours?: number;
  constraintId?: string;
  format?: 'json' | 'text';
}): Promise<void> {
  const hours = options.hours || 1;
  const analyzer = createAnalyzer();

  let summaries: TraceSummary[];

  if (options.constraintId) {
    summaries = analyzer.analyzeConstraint(options.constraintId);
  } else {
    summaries = analyzer.analyzeRecent(hours);
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(summaries, null, 2));
  } else {
    console.log(`📈 Constraint Summaries (last ${hours}h)`);
    console.log('');

    if (summaries.length === 0) {
      console.log('No traces found.');
      return;
    }

    for (const summary of summaries) {
      const levelEmoji = {
        iron_law: '🔴',
        guideline: '🟡',
        tip: '🔵',
      }[summary.level];

      const trendEmoji = {
        rising: '📈',
        falling: '📉',
        stable: '➡️',
      }[summary.recentTrend];

      console.log(`${levelEmoji} ${summary.constraintId}`);
      console.log(`   Checks: ${summary.totalChecks}`);
      console.log(`   Pass: ${Math.round(summary.passRate * 100)}%`);
      console.log(`   Fail: ${Math.round(summary.failRate * 100)}%`);
      console.log(`   Bypass: ${Math.round(summary.bypassRate * 100)}%`);
      console.log(`   Trend: ${trendEmoji} ${summary.recentTrend}`);
      console.log('');
    }
  }
}

/**
 * 显示异常检测结果
 */
async function showAnomalies(options: {
  hours?: number;
  format?: 'json' | 'text';
}): Promise<void> {
  const hours = options.hours || 24;
  const analyzer = createAnalyzer();
  const anomalies = analyzer.runDailyAnomalyCheck();

  if (options.format === 'json') {
    console.log(JSON.stringify(anomalies, null, 2));
  } else {
    console.log(`⚠️ Anomalies Detected (last ${hours}h)`);
    console.log('');

    if (anomalies.length === 0) {
      console.log('✅ No anomalies detected.');
      return;
    }

    for (const anomaly of anomalies) {
      console.log(`⚠️ ${anomaly.type}: ${anomaly.constraintId}`);
      console.log(`   ${anomaly.message}`);
      console.log(`   Suggested: ${anomaly.suggestedAction}`);
      console.log('');
    }

    console.log(`Total: ${anomalies.length} anomalies`);
  }
}

/**
 * 生成完整报告
 */
async function generateReport(options: {
  hours?: number;
  format?: 'json' | 'text';
}): Promise<void> {
  const hours = options.hours || 24;
  const analyzer = createAnalyzer();

  const summaries = analyzer.analyzeRecent(hours);
  const anomalies = analyzer.detectAnomalies(summaries);

  if (options.format === 'json') {
    console.log(JSON.stringify({ summaries, anomalies }, null, 2));
  } else {
    const report = analyzer.generateReport(summaries, anomalies);
    console.log(report);
  }
}

/**
 * 清理旧 trace 文件
 */
async function cleanTraces(options: {
  maxAgeDays?: number;
}): Promise<void> {
  const maxAgeDays = options.maxAgeDays || 30;
  const collector = getTraceCollector();
  const deletedCount = collector.cleanupOldFiles(maxAgeDays);

  console.log(`🧹 Cleaned ${deletedCount} old trace files (older than ${maxAgeDays} days)`);
}