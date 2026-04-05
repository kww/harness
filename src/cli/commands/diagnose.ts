/**
 * Diagnose CLI 命令
 *
 * 运行诊断分析异常
 */

import * as fs from 'fs';
import * as path from 'path';
import { TraceCollector, getTraceCollector } from '../../monitoring/traces';
import { TraceAnalyzer, createAnalyzer } from '../../monitoring/trace-analyzer';
import { ConstraintDoctor, createDoctor } from '../../monitoring/constraint-doctor';
import type { Diagnosis } from '../../monitoring/constraint-doctor';
import type { TraceAnomaly } from '../../types/trace';

/**
 * diagnose 命令
 */
export async function diagnoseCommand(
  subcommand: string,
  options: {
    hours?: number;
    constraintId?: string;
    anomalyId?: string;
    format?: 'json' | 'text';
    save?: boolean;
  }
): Promise<void> {
  switch (subcommand) {
    case 'run':
      await runDiagnose(options);
      break;

    case 'show':
      await showDiagnose(options);
      break;

    case 'list':
      await listDiagnoses(options);
      break;

    default:
      console.log('Usage: harness diagnose <subcommand>');
      console.log('');
      console.log('Subcommands:');
      console.log('  run    Run diagnosis on detected anomalies');
      console.log('  show   Show a specific diagnosis result');
      console.log('  list   List all diagnosis results');
      console.log('');
      console.log('Options:');
      console.log('  --hours <n>       Analyze last N hours (default: 24)');
      console.log('  --constraint <id> Filter by constraint ID');
      console.log('  --anomaly <id>    Show specific anomaly diagnosis');
      console.log('  --format <format> Output format: json or text (default: text)');
      console.log('  --save            Save diagnosis to file');
  }
}

/**
 * 运行诊断
 */
async function runDiagnose(options: {
  hours?: number;
  constraintId?: string;
  format?: 'json' | 'text';
  save?: boolean;
}): Promise<void> {
  const hours = options.hours || 24;
  const analyzer = createAnalyzer();
  const doctor = createDoctor();

  // 1. 检测异常
  const anomalies = analyzer.runDailyAnomalyCheck();

  // 过滤特定约束
  let filteredAnomalies = anomalies;
  if (options.constraintId) {
    filteredAnomalies = anomalies.filter(a => a.constraintId === options.constraintId);
  }

  if (filteredAnomalies.length === 0) {
    console.log('✅ No anomalies detected. No diagnosis needed.');
    return;
  }

  console.log(`🔍 Detected ${filteredAnomalies.length} anomalies, running diagnosis...`);
  console.log('');

  // 2. 获取 traces
  const collector = getTraceCollector();
  const traces = collector.readRecent(hours);

  // 3. 运行诊断
  const diagnoses: Diagnosis[] = [];

  for (const anomaly of filteredAnomalies) {
    doctor.setData(traces.filter(t => t.constraintId === anomaly.constraintId));
    const diagnosis = await doctor.diagnose(anomaly);
    diagnoses.push(diagnosis);

    // 保存诊断
    if (options.save) {
      const outputPath = `.harness/diagnoses/${diagnosis.anomalyId}.json`;
      doctor.saveDiagnosis(diagnosis, outputPath);
    }
  }

  // 4. 输出结果
  if (options.format === 'json') {
    console.log(JSON.stringify(diagnoses, null, 2));
  } else {
    for (const diagnosis of diagnoses) {
      console.log(doctor.generateReport(diagnosis));
      console.log('---');
    }
  }

  // 5. 统计
  const needsChange = diagnoses.filter(d => d.needsChange).length;
  console.log('');
  console.log(`📊 Summary: ${needsChange} diagnoses need constraint changes`);
}

/**
 * 显示特定诊断
 */
async function showDiagnose(options: {
  anomalyId?: string;
  format?: 'json' | 'text';
}): Promise<void> {
  if (!options.anomalyId) {
    console.log('❌ Please specify --anomaly <id>');
    return;
  }

  const doctor = createDoctor();
  const diagnosisPath = `.harness/diagnoses/${options.anomalyId}.json`;

  if (!fs.existsSync(diagnosisPath)) {
    console.log(`❌ Diagnosis not found: ${options.anomalyId}`);
    return;
  }

  const diagnosis = doctor.loadDiagnosis(diagnosisPath);

  if (options.format === 'json') {
    console.log(JSON.stringify(diagnosis, null, 2));
  } else {
    console.log(doctor.generateReport(diagnosis));
  }
}

/**
 * 列出所有诊断
 */
async function listDiagnoses(options: {
  format?: 'json' | 'text';
}): Promise<void> {
  const diagnosesDir = '.harness/diagnoses';

  if (!fs.existsSync(diagnosesDir)) {
    console.log('❌ No diagnoses found. Run `harness diagnose run` first.');
    return;
  }

  const files = fs.readdirSync(diagnosesDir)
    .filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('❌ No diagnoses found.');
    return;
  }

  const doctor = createDoctor();
  const diagnoses = files.map(f => {
    const content = fs.readFileSync(path.join(diagnosesDir, f), 'utf-8');
    return JSON.parse(content) as Diagnosis;
  });

  if (options.format === 'json') {
    console.log(JSON.stringify(diagnoses.map(d => ({
      anomalyId: d.anomalyId,
      constraintId: d.constraintId,
      needsChange: d.needsChange,
      urgency: d.urgency,
    })), null, 2));
  } else {
    console.log('📋 Diagnosis List');
    console.log('');

    for (const diagnosis of diagnoses) {
      const urgencyEmoji: string = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
      }[diagnosis.urgency] || '⚪';

      console.log(`${urgencyEmoji} ${diagnosis.anomalyId}`);
      console.log(`   Constraint: ${diagnosis.constraintId}`);
      console.log(`   Needs Change: ${diagnosis.needsChange ? 'Yes' : 'No'}`);
      console.log(`   Urgency: ${diagnosis.urgency}`);
      console.log('');
    }

    console.log(`Total: ${diagnoses.length} diagnoses`);
  }
}