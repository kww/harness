/**
 * PassesGate - 测试门控（简化版）
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  PassesGateConfig,
  PassesGateResult,
  TaskTestResult,
  TestFailure,
} from '../../types/passes-gate';

const execAsync = promisify(exec);

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<PassesGateConfig> = {
  enabled: true,
  testCommand: 'npm test',
  requireEvidence: false,
  allowPartialPass: false,
  maxRetries: 2,
  retryDelay: 1000,
};

/**
 * PassesGate 类
 */
export class PassesGate {
  private config: Required<PassesGateConfig>;

  constructor(config: Partial<PassesGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 运行测试
   */
  async runTests(): Promise<PassesGateResult> {
    const startTime = Date.now();
    const workDir = process.cwd();
    
    const testCommand = this.config.testCommand || await this.detectTestCommand(workDir);
    
    if (!testCommand) {
      return this.createResult(false, 0, 0, 0, Date.now() - startTime, '未检测到测试命令');
    }

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: workDir,
        maxBuffer: 1024 * 1024 * 10,
      });

      return this.parseTestOutput(stdout + stderr, true, Date.now() - startTime);
    } catch (error: any) {
      const output = error.stdout + error.stderr || error.message;
      return this.parseTestOutput(output, false, Date.now() - startTime);
    }
  }

  /**
   * 检测测试命令
   */
  private async detectTestCommand(workDir: string): Promise<string> {
    try {
      const pkgPath = path.join(workDir, 'package.json');
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      if (pkg.scripts?.test && !pkg.scripts.test.includes('no test specified')) {
        return 'npm test';
      }
    } catch {}
    
    // 检查 pytest
    try {
      await fs.access(path.join(workDir, 'pytest.ini'));
      return 'pytest';
    } catch {}
    
    return 'npm test';
  }

  /**
   * 解析测试输出
   */
  private parseTestOutput(output: string, success: boolean, duration: number): PassesGateResult {
    // 解析 Jest/Vitest 输出
    const passedMatch = output.match(/(\d+) passed/i) || output.match(/Tests:\s+(\d+) passed/i);
    const failedMatch = output.match(/(\d+) failed/i);
    
    const passedTests = passedMatch?.[1] ? parseInt(passedMatch[1], 10) : (success ? 1 : 0);
    const failedTests = failedMatch?.[1] ? parseInt(failedMatch[1], 10) : (success ? 0 : 1);
    const totalTests = passedTests + failedTests;

    // 解析失败信息
    const failures: TestFailure[] = [];
    if (!success && output) {
      const lines = output.split('\n').filter(l => l.includes('FAIL') || l.includes('Error'));
      for (const line of lines.slice(0, 5)) {
        failures.push({ name: line.trim().slice(0, 50), message: line.trim() });
      }
    }

    return {
      passed: success && failedTests === 0,
      testResults: [{
        passed: success,
        command: this.config.testCommand,
        output,
        duration,
      }],
      passedTests,
      failedTests,
      totalTests,
      duration,
      timestamp: Date.now(),
      failures: failures.length > 0 ? failures : undefined,
    };
  }

  /**
   * 创建结果对象
   */
  private createResult(
    passed: boolean,
    passedTests: number,
    failedTests: number,
    totalTests: number,
    duration: number,
    message?: string
  ): PassesGateResult {
    return {
      passed,
      testResults: [],
      passedTests,
      failedTests,
      totalTests,
      duration,
      timestamp: Date.now(),
      message,
    };
  }
}