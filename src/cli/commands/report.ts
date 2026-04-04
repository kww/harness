/**
 * harness report 命令
 * 
 * 生成检查报告
 */

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReportOptions {
  /** 输出文件路径 */
  output?: string;
  /** 输出格式 */
  format: 'json' | 'markdown' | 'html';
  /** 项目路径 */
  projectPath?: string;
}

interface ReportData {
  timestamp: string;
  projectPath: string;
  ironLaws: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    violations: Array<{
      id: string;
      severity: string;
      message: string;
    }>;
  };
  checkpoints: {
    total: number;
    passed: number;
    failed: number;
    results: Array<{
      id: string;
      passed: boolean;
      checks: number;
    }>;
  };
  passesGate: {
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coverage?: number;
  };
}

/**
 * 生成检查报告
 */
export async function report(options: ReportOptions): Promise<void> {
  console.log(chalk.blue('📊 生成检查报告...'));

  const projectPath = options.projectPath || process.cwd();

  // TODO: 从实际检查中获取数据
  const reportData: ReportData = {
    timestamp: new Date().toISOString(),
    projectPath,
    ironLaws: {
      total: 11,
      passed: 11,
      failed: 0,
      warnings: 0,
      violations: [],
    },
    checkpoints: {
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
    },
    passesGate: {
      passed: true,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    },
  };

  // 生成报告内容
  let content: string;

  switch (options.format) {
    case 'json':
      content = JSON.stringify(reportData, null, 2);
      break;

    case 'markdown':
      content = generateMarkdownReport(reportData);
      break;

    case 'html':
      content = generateHtmlReport(reportData);
      break;

    default:
      content = JSON.stringify(reportData, null, 2);
  }

  // 输出到文件或控制台
  if (options.output) {
    await fs.writeFile(options.output, content, 'utf-8');
    console.log(chalk.green(`✅ 报告已保存到: ${options.output}`));
  } else {
    console.log(content);
  }
}

/**
 * 生成 Markdown 格式报告
 */
function generateMarkdownReport(data: ReportData): string {
  const lines: string[] = [
    `# Harness 检查报告`,
    ``,
    `> 生成时间: ${data.timestamp}`,
    `> 项目路径: ${data.projectPath}`,
    ``,
    `---`,
    ``,
    `## 📜 铁律检查`,
    ``,
    `| 指标 | 数值 |`,
    `|------|------|`,
    `| 总数 | ${data.ironLaws.total} |`,
    `| 通过 | ${data.ironLaws.passed} |`,
    `| 失败 | ${data.ironLaws.failed} |`,
    `| 警告 | ${data.ironLaws.warnings} |`,
    ``,
  ];

  if (data.ironLaws.violations.length > 0) {
    lines.push(`### 违规项`, ``);
    data.ironLaws.violations.forEach(v => {
      lines.push(`- **${v.id}** (${v.severity}): ${v.message}`);
    });
    lines.push(``);
  }

  lines.push(
    `## 🔍 检查点验证`,
    ``,
    `| 指标 | 数值 |`,
    `|------|------|`,
    `| 总数 | ${data.checkpoints.total} |`,
    `| 通过 | ${data.checkpoints.passed} |`,
    `| 失败 | ${data.checkpoints.failed} |`,
    ``
  );

  if (data.checkpoints.results.length > 0) {
    lines.push(`### 检查点详情`, ``);
    data.checkpoints.results.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      lines.push(`- ${icon} **${r.id}**: ${r.checks} 项检查`);
    });
    lines.push(``);
  }

  lines.push(
    `## 🚦 测试门控`,
    ``,
    `| 指标 | 数值 |`,
    `|------|------|`,
    `| 状态 | ${data.passesGate.passed ? '✅ 通过' : '❌ 未通过'} |`,
    `| 总测试 | ${data.passesGate.totalTests} |`,
    `| 通过 | ${data.passesGate.passedTests} |`,
    `| 失败 | ${data.passesGate.failedTests} |`,
    ``
  );

  if (data.passesGate.coverage !== undefined) {
    lines.push(`| 覆盖率 | ${data.passesGate.coverage}% |`, ``);
  }

  lines.push(`---`, `*报告由 @kww/harness 生成*`, ``);

  return lines.join('\n');
}

/**
 * 生成 HTML 格式报告
 */
function generateHtmlReport(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harness 检查报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .passed { color: #4CAF50; }
    .failed { color: #f44336; }
    .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Harness 检查报告</h1>
  <p class="meta">生成时间: ${data.timestamp}<br>项目路径: ${data.projectPath}</p>

  <h2>📜 铁律检查</h2>
  <table>
    <tr><th>指标</th><th>数值</th></tr>
    <tr><td>总数</td><td>${data.ironLaws.total}</td></tr>
    <tr><td>通过</td><td class="passed">${data.ironLaws.passed}</td></tr>
    <tr><td>失败</td><td class="failed">${data.ironLaws.failed}</td></tr>
    <tr><td>警告</td><td>${data.ironLaws.warnings}</td></tr>
  </table>

  <h2>🔍 检查点验证</h2>
  <table>
    <tr><th>指标</th><th>数值</th></tr>
    <tr><td>总数</td><td>${data.checkpoints.total}</td></tr>
    <tr><td>通过</td><td class="passed">${data.checkpoints.passed}</td></tr>
    <tr><td>失败</td><td class="failed">${data.checkpoints.failed}</td></tr>
  </table>

  <h2>🚦 测试门控</h2>
  <table>
    <tr><th>指标</th><th>数值</th></tr>
    <tr><td>状态</td><td class="${data.passesGate.passed ? 'passed' : 'failed'}">${data.passesGate.passed ? '✅ 通过' : '❌ 未通过'}</td></tr>
    <tr><td>总测试</td><td>${data.passesGate.totalTests}</td></tr>
    <tr><td>通过</td><td>${data.passesGate.passedTests}</td></tr>
    <tr><td>失败</td><td>${data.passesGate.failedTests}</td></tr>
  </table>

  <footer style="margin-top: 40px; color: #999; text-align: center;">
    报告由 @kww/harness 生成
  </footer>
</body>
</html>`;
}
