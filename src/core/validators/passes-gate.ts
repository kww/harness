/**
 * PassesGate - 测试门控
 * 
 * 确保 task.passes 字段只能通过测试结果修改
 * 禁止 Agent 自评通过
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  PassesGateConfig,
  PassesGateResult,
  TaskTestResult,
  DynamicTask
} from './types';

const execAsync = promisify(exec);

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<PassesGateConfig> = {
  enabled: true,
  testCommand: '',
  requireEvidence: true,
  allowPartialPass: false,
  maxRetries: 2,
  retryDelay: 1000,
};

/**
 * 测试文件保护模式
 */
const PROTECTED_TEST_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.spec.js',
  '**/tests/**',
  '**/__tests__/**',
];

/**
 * PassesGate 类
 */
export class PassesGate {
  private config: Required<PassesGateConfig>;
  private testResults: Map<string, TaskTestResult> = new Map();

  constructor(config: Partial<PassesGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置任务通过状态
   * 核心方法：强制测试验证
   */
  async setPasses(
    taskId: string,
    value: boolean,
    workDir: string,
    task?: DynamicTask
  ): Promise<PassesGateResult> {
    if (!this.config.enabled) {
      return {
        taskId,
        allowed: true,
        attempts: 0,
      };
    }

    // 如果设置为 false，直接允许
    if (value === false) {
      return {
        taskId,
        allowed: true,
        testResult: {
          passed: false,
          command: 'manual',
          timestamp: new Date(),
        },
        attempts: 0,
      };
    }

    // 如果设置为 true，必须运行测试
    let attempts = 0;
    let lastError: string | undefined;
    let testResult: TaskTestResult | undefined;

    while (attempts <= this.config.maxRetries) {
      attempts++;
      
      try {
        testResult = await this.runTest(workDir, task);
        
        if (testResult.passed) {
          // 记录测试结果
          this.testResults.set(taskId, testResult);
          
          // 如果要求证据，验证证据存在
          if (this.config.requireEvidence && testResult.evidence) {
            const evidenceExists = await this.verifyEvidence(testResult.evidence, workDir);
            if (!evidenceExists) {
              return {
                taskId,
                allowed: false,
                error: 'Test evidence not found',
                testResult,
                attempts,
              };
            }
          }
          
          return {
            taskId,
            allowed: true,
            testResult,
            attempts,
          };
        }
        
        lastError = `Tests failed: ${testResult.failures?.join(', ') || 'Unknown error'}`;
        
        // 等待后重试
        if (attempts <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      } catch (error: any) {
        lastError = error.message;
        
        if (attempts <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    return {
      taskId,
      allowed: false,
      error: lastError,
      testResult,
      attempts,
    };
  }

  /**
   * 运行测试
   */
  private async runTest(workDir: string, task?: DynamicTask): Promise<TaskTestResult> {
    const testCommand = await this.detectTestCommand(workDir);
    const timestamp = new Date();

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: workDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      const passed = true;
      const coverage = this.extractCoverage(stdout);
      const failures: string[] = [];

      return {
        passed,
        command: testCommand,
        output: stdout,
        failures,
        coverage,
        timestamp,
        evidence: await this.generateEvidence(workDir, stdout),
      };
    } catch (error: any) {
      const output = error.stdout || '';
      const stderrOutput = error.stderr || '';
      const combinedOutput = output + '\n' + stderrOutput;

      const failures = this.extractFailures(combinedOutput);
      const passed = this.config.allowPartialPass && failures.length === 0;

      return {
        passed,
        command: testCommand,
        output: combinedOutput,
        failures,
        coverage: this.extractCoverage(output),
        timestamp,
        evidence: await this.generateEvidence(workDir, combinedOutput),
      };
    }
  }

  /**
   * 检测测试命令
   */
  private async detectTestCommand(workDir: string): Promise<string> {
    if (this.config.testCommand) {
      return this.config.testCommand;
    }

    // 尝试读取 package.json
    try {
      const packageJsonPath = path.join(workDir, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      // 优先使用 e2e 测试
      if (packageJson.scripts?.['test:e2e']) {
        return 'npm run test:e2e';
      }
      if (packageJson.scripts?.['test:coverage']) {
        return 'npm run test:coverage';
      }
      if (packageJson.scripts?.test) {
        return 'npm test';
      }
    } catch {
      // package.json 不存在，尝试其他检测
    }

    // 尝试 Python 项目
    try {
      const pyprojectPath = path.join(workDir, 'pyproject.toml');
      await fs.access(pyprojectPath);
      return 'pytest';
    } catch {
      // 不是 Python 项目
    }

    // 尝试 Go 项目
    try {
      const goModPath = path.join(workDir, 'go.mod');
      await fs.access(goModPath);
      return 'go test ./...';
    } catch {
      // 不是 Go 项目
    }

    // 默认命令
    return 'npm test';
  }

  /**
   * 从输出中提取覆盖率
   */
  private extractCoverage(output: string): number | undefined {
    // Jest 格式: All files | 80.5 | 70.2 | ...
    const jestMatch = output.match(/All files[|\s]+(\d+\.?\d*)/);
    if (jestMatch) {
      return parseFloat(jestMatch[1]);
    }

    // Istanbul/nyc 格式: Statements   : 80.5% ( 100/124 )
    const istanbulMatch = output.match(/Statements\s*:\s*(\d+\.?\d*)%/);
    if (istanbulMatch) {
      return parseFloat(istanbulMatch[1]);
    }

    // pytest-cov 格式: TOTAL  1234  80%
    const pytestMatch = output.match(/TOTAL\s+\d+\s+(\d+)%/);
    if (pytestMatch) {
      return parseInt(pytestMatch[1]);
    }

    return undefined;
  }

  /**
   * 从输出中提取失败信息
   */
  private extractFailures(output: string): string[] {
    const failures: string[] = [];

    // Jest 格式
    const jestMatches = output.matchAll(/✕\s+(.+?)\s+\(/g);
    for (const match of jestMatches) {
      failures.push(match[1]);
    }

    // Mocha 格式
    const mochaMatches = output.matchAll(/\d+\)\s+(.+?):/g);
    for (const match of mochaMatches) {
      failures.push(match[1]);
    }

    // pytest 格式
    const pytestMatches = output.matchAll(/FAILED\s+(.+?)::/g);
    for (const match of pytestMatches) {
      failures.push(match[1]);
    }

    // Go test 格式
    const goMatches = output.matchAll(/--- FAIL:\s+(.+?)\s+\(/g);
    for (const match of goMatches) {
      failures.push(match[1]);
    }

    return failures;
  }

  /**
   * 生成测试证据
   */
  private async generateEvidence(workDir: string, output: string): Promise<string> {
    const evidenceDir = path.join(workDir, '.agent', 'evidence');
    await fs.mkdir(evidenceDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const evidenceFile = path.join(evidenceDir, `test-${timestamp}.log`);

    await fs.writeFile(evidenceFile, output);

    return evidenceFile;
  }

  /**
   * 验证证据存在
   */
  private async verifyEvidence(evidencePath: string, workDir: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(evidencePath)
        ? evidencePath
        : path.join(workDir, evidencePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检测是否修改了测试文件
   */
  async checkTestFileChanges(workDir: string): Promise<string[]> {
    const changedTestFiles: string[] = [];

    try {
      const { stdout } = await execAsync('git diff --name-only', { cwd: workDir });
      const changedFiles = stdout.split('\n').filter(Boolean);

      // 简单的模式匹配（未使用 minimatch 库）
      for (const file of changedFiles) {
        const isTestFile = PROTECTED_TEST_PATTERNS.some(pattern => {
          // 简化匹配：检查文件路径是否包含测试相关关键字
          return file.includes('.test.') ||
                 file.includes('.spec.') ||
                 file.includes('/tests/') ||
                 file.includes('/__tests__/');
        });

        if (isTestFile) {
          changedTestFiles.push(file);
        }
      }
    } catch (error) {
      // Git 不可用，跳过检查
    }

    return changedTestFiles;
  }

  /**
   * 获取任务的测试结果
   */
  getTestResult(taskId: string): TaskTestResult | undefined {
    return this.testResults.get(taskId);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建 PassesGate 实例
 */
export function createPassesGate(config?: Partial<PassesGateConfig>): PassesGate {
  return new PassesGate(config);
}
