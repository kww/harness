/**
 * 检查点验证引擎（简化版）
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  Checkpoint,
  CheckpointResult,
  CheckResult,
  CheckpointContext,
} from '../../types/checkpoint';

const execAsync = promisify(exec);

/**
 * 检查点验证器
 */
export class CheckpointValidator {
  private static instance: CheckpointValidator;

  private constructor() {}

  static getInstance(): CheckpointValidator {
    if (!CheckpointValidator.instance) {
      CheckpointValidator.instance = new CheckpointValidator();
    }
    return CheckpointValidator.instance;
  }

  /**
   * 验证检查点
   */
  async validate(checkpoint: Checkpoint, context: CheckpointContext): Promise<CheckpointResult> {
    if (!checkpoint?.checks?.length) {
      return {
        checkpointId: checkpoint?.id || 'unknown',
        passed: true,
        checks: [],
        message: '无检查点要求',
        validatedAt: new Date(),
      };
    }

    const results: CheckResult[] = [];

    for (const check of checkpoint.checks) {
      const result = await this.runCheck(check, context);
      results.push(result);
    }

    const passed = results.every(r => r.passed);

    return {
      checkpointId: checkpoint.id,
      passed,
      checks: results,
      message: passed ? '所有检查通过' : '部分检查未通过',
      validatedAt: new Date(),
    };
  }

  /**
   * 执行单个检查
   */
  private async runCheck(check: { id: string; type: string; config?: any; message?: string }, context: CheckpointContext): Promise<CheckResult> {
    const workdir = context.workdir || context.projectPath || process.cwd();

    try {
      switch (check.type) {
        case 'file_exists':
          return await this.checkFileExists(check, workdir);
        
        case 'file_not_empty':
          return await this.checkFileNotEmpty(check, workdir);
        
        case 'file_contains':
          return await this.checkFileContains(check, workdir);
        
        case 'command_success':
          return await this.checkCommandSuccess(check, workdir);
        
        case 'output_contains':
          return await this.checkOutputContains(check, workdir);
        
        default:
          return {
            checkId: check.id,
            passed: true,
            message: `未知检查类型: ${check.type}`,
          };
      }
    } catch (error: any) {
      return {
        checkId: check.id,
        passed: false,
        error: error.message,
        message: check.message || '检查失败',
      };
    }
  }

  /**
   * 文件存在检查
   */
  private async checkFileExists(check: { id: string; config?: any; message?: string }, workdir: string): Promise<CheckResult> {
    const filePath = check.config?.path;
    if (!filePath) {
      return { checkId: check.id, passed: false, message: '缺少 path 配置' };
    }

    const fullPath = path.join(workdir, filePath);
    try {
      await fs.access(fullPath);
      return { checkId: check.id, passed: true, message: `文件存在: ${filePath}` };
    } catch {
      return { checkId: check.id, passed: false, message: check.message || `文件不存在: ${filePath}` };
    }
  }

  /**
   * 文件非空检查
   */
  private async checkFileNotEmpty(check: { id: string; config?: any; message?: string }, workdir: string): Promise<CheckResult> {
    const filePath = check.config?.path;
    if (!filePath) {
      return { checkId: check.id, passed: false, message: '缺少 path 配置' };
    }

    const fullPath = path.join(workdir, filePath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (content.trim().length > 0) {
        return { checkId: check.id, passed: true, message: `文件非空: ${filePath}` };
      }
      return { checkId: check.id, passed: false, message: check.message || `文件为空: ${filePath}` };
    } catch {
      return { checkId: check.id, passed: false, message: check.message || `文件不存在: ${filePath}` };
    }
  }

  /**
   * 文件内容检查
   */
  private async checkFileContains(check: { id: string; config?: any; message?: string }, workdir: string): Promise<CheckResult> {
    const filePath = check.config?.path;
    const expected = check.config?.expected;
    
    if (!filePath || !expected) {
      return { checkId: check.id, passed: false, message: '缺少 path 或 expected 配置' };
    }

    const fullPath = path.join(workdir, filePath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (content.includes(expected)) {
        return { checkId: check.id, passed: true, message: `找到内容: ${expected}` };
      }
      return { checkId: check.id, passed: false, message: check.message || `未找到内容: ${expected}` };
    } catch {
      return { checkId: check.id, passed: false, message: check.message || `文件不存在: ${filePath}` };
    }
  }

  /**
   * 命令成功检查
   */
  private async checkCommandSuccess(check: { id: string; config?: any; message?: string }, workdir: string): Promise<CheckResult> {
    const command = check.config?.command;
    if (!command) {
      return { checkId: check.id, passed: false, message: '缺少 command 配置' };
    }

    try {
      await execAsync(command, { cwd: workdir });
      return { checkId: check.id, passed: true, message: `命令成功: ${command}` };
    } catch (error: any) {
      return { checkId: check.id, passed: false, message: check.message || `命令失败: ${command}`, error: error.message };
    }
  }

  /**
   * 输出内容检查
   */
  private async checkOutputContains(check: { id: string; config?: any; message?: string }, workdir: string): Promise<CheckResult> {
    const command = check.config?.command;
    const expected = check.config?.expected;
    
    if (!command) {
      return { checkId: check.id, passed: false, message: '缺少 command 配置' };
    }

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: workdir });
      const output = stdout + stderr;
      
      if (!expected || output.includes(expected)) {
        return { checkId: check.id, passed: true, message: `输出符合预期` };
      }
      return { checkId: check.id, passed: false, message: check.message || `输出未包含: ${expected}` };
    } catch (error: any) {
      const output = error.stdout + error.stderr || error.message;
      if (!expected || output.includes(expected)) {
        return { checkId: check.id, passed: true, message: `输出符合预期（命令有错误但输出匹配）` };
      }
      return { checkId: check.id, passed: false, message: check.message || `命令失败`, error: error.message };
    }
  }
}