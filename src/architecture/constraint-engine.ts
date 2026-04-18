/**
 * 架构约束引擎
 *
 * 通用能力：加载规则、执行检查、生成报告
 * 规则定义：由项目提供（.architect/rules.yml）
 */

// 架构约束相关类型（注意：与 constraint 模块的类型区分）
export interface ArchitectureContext {
  files: string[];
  diff: string;
  pr?: {
    number: number;
    changedFiles: number;
    additions: number;
    deletions: number;
  };
}

export interface ArchitectureViolation {
  ruleId: string;
  message: string;
  files?: string[];
  severity: 'error' | 'warning';
}

export interface ArchitectureResult {
  passed: boolean;
  violations: ArchitectureViolation[];
}

export interface ArchitectureRule {
  id: string;
  type: 'forbidden-pattern' | 'file-count' | 'module-boundary' | 'custom';
  severity?: 'error' | 'warning';
  // 通用配置
  scope?: string;           // glob 模式
  message?: string;         // 错误提示
  // forbidden-pattern
  patterns?: string[];      // 禁止的关键词
  // file-count
  threshold?: number;       // 文件数阈值
  // custom
  script?: string;          // 自定义脚本路径
}

export class ArchitectureConstraintEngine {
  constructor(private rules: ArchitectureRule[]) {}

  async check(context: ArchitectureContext): Promise<ArchitectureResult> {
    const violations: ArchitectureViolation[] = [];

    for (const rule of this.rules) {
      const result = await this.checkRule(rule, context);
      violations.push(...result);
    }

    return {
      passed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    };
  }

  private async checkRule(
    rule: ArchitectureRule,
    context: ArchitectureContext
  ): Promise<ArchitectureViolation[]> {
    switch (rule.type) {
      case 'forbidden-pattern':
        return this.checkForbiddenPattern(rule, context);
      case 'file-count':
        return this.checkFileCount(rule, context);
      case 'module-boundary':
        return this.checkModuleBoundary(rule, context);
      default:
        return [];
    }
  }

  private checkForbiddenPattern(
    rule: ArchitectureRule,
    context: ArchitectureContext
  ): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    const patterns = rule.patterns || [];

    for (const file of context.files) {
      // 检查文件路径是否匹配 scope
      if (rule.scope && !this.matchGlob(file, rule.scope)) {
        continue;
      }

      // 检查文件名是否包含禁止模式
      for (const pattern of patterns) {
        if (file.toLowerCase().includes(pattern.toLowerCase())) {
          violations.push({
            ruleId: rule.id,
            message: rule.message || `File contains forbidden pattern: ${pattern}`,
            files: [file],
            severity: rule.severity || 'error',
          });
        }
      }
    }

    return violations;
  }

  private checkFileCount(
    rule: ArchitectureRule,
    context: ArchitectureContext
  ): ArchitectureViolation[] {
    const threshold = rule.threshold || 3;
    const count = context.files.length;

    if (count > threshold) {
      return [{
        ruleId: rule.id,
        message: rule.message || `Too many files changed (${count} > ${threshold}). Reuse check required.`,
        severity: rule.severity || 'warning',
      }];
    }

    return [];
  }

  private checkModuleBoundary(
    rule: ArchitectureRule,
    context: ArchitectureContext
  ): ArchitectureViolation[] {
    // TODO: 实现模块边界检查
    return [];
  }

  private matchGlob(file: string, pattern: string): boolean {
    // 简化的 glob 匹配
    let regexPattern = pattern;
    
    // 处理 **/ 开头（匹配任意前缀路径）
    if (regexPattern.startsWith('**/')) {
      regexPattern = '(?:.*/)?' + regexPattern.slice(3);
    }
    
    // 处理 /**/（匹配任意中间路径）和 **（匹配任意字符）
    regexPattern = regexPattern
      .replace(/\/\*\*\//g, '/(?:.*/)?')  // /**/ -> /(?:.*/)?
      .replace(/\*\*/g, '.*')              // ** -> .*
      .replace(/\*/g, '[^/]*');            // * -> [^/]*
    
    const regex = new RegExp(regexPattern);
    return regex.test(file);
  }
}

// 加载规则的工厂函数（支持 YAML 或 JSON）
export async function loadArchitectureRules(configPath: string): Promise<ArchitectureRule[]> {
  const fs = await import('fs/promises');
  
  const content = await fs.readFile(configPath, 'utf-8');
  
  // 简单 YAML 解析（不依赖外部库）
  let config: { rules?: ArchitectureRule[] };
  
  if (configPath.endsWith('.json')) {
    config = JSON.parse(content);
  } else {
    // 简单 YAML 解析：提取 rules 数组
    config = parseSimpleYaml(content);
  }
  
  return config.rules || [];
}

// 简单的 YAML 子集解析器
function parseSimpleYaml(content: string): { rules?: ArchitectureRule[] } {
  const lines = content.split('\n');
  const result: { rules?: ArchitectureRule[] } = { rules: [] };
  let currentRule: Partial<ArchitectureRule> | null = null;
  let currentArray: string[] | null = null;
  let indentLevel = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过注释和空行
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // 检测缩进级别
    const leadingSpace = line.length - line.trimStart().length;
    
    // 新规则开始
    if (trimmed.startsWith('- id:')) {
      if (currentRule && result.rules) {
        result.rules.push(currentRule as ArchitectureRule);
      }
      currentRule = { id: trimmed.replace('- id:', '').trim() };
      currentArray = null;
      indentLevel = leadingSpace;
    }
    // 规则属性
    else if (currentRule && trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      
      if (key === 'patterns') {
        currentArray = [];
        (currentRule as Record<string, string[]>)[key] = currentArray;
      } else if (value) {
        // 去除引号
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (key === 'threshold') {
          (currentRule as Record<string, number>)[key] = parseInt(cleanValue, 10);
        } else if (key === 'severity') {
          (currentRule as Record<string, 'error' | 'warning'>)[key] = cleanValue as 'error' | 'warning';
        } else {
          (currentRule as Record<string, string>)[key] = cleanValue;
        }
      }
    }
    // 数组元素
    else if (currentArray && trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
      currentArray.push(value);
    }
  }
  
  // 添加最后一个规则
  if (currentRule && result.rules) {
    result.rules.push(currentRule as ArchitectureRule);
  }
  
  return result;
}

// CLI 入口
export async function runArchitectureCheck(
  configPath: string,
  context: ArchitectureContext
): Promise<ArchitectureResult> {
  const rules = await loadArchitectureRules(configPath);
  const engine = new ArchitectureConstraintEngine(rules);
  return engine.check(context);
}
