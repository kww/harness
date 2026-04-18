/**
 * @spec HZ-002
 * @acceptance AC-001-1, AC-001-2, AC-001-3, AC-001-4
 * 
 * Progressive Loader 测试
 */

import { ProgressiveLoader } from '../../context/progressive-loader';
import { TokenEstimator, TokenBudget, AdaptiveTokenBudget } from '../../context/token-budget';

describe('TokenEstimator', () => {
  it('should estimate English text', () => {
    const tokens = TokenEstimator.estimateText('Hello World');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should estimate Chinese text', () => {
    const tokens = TokenEstimator.estimateText('你好世界');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should estimate object', () => {
    const tokens = TokenEstimator.estimateObject({ foo: 'bar', num: 123 });
    expect(tokens).toBeGreaterThan(0);
  });
});

describe('TokenBudget', () => {
  it('should manage budget correctly', () => {
    const budget = new TokenBudget(1000);
    expect(budget.total).toBe(1000);
    expect(budget.remaining).toBe(1000);
    
    budget.consume(300);
    expect(budget.used).toBe(300);
    expect(budget.remaining).toBe(700);
    expect(budget.status).toBe('healthy');
  });

  it('should reserve and release budget', () => {
    const budget = new TokenBudget(1000);
    budget.reserve(200);
    expect(budget.remaining).toBe(800);
    
    budget.release(100);
    expect(budget.remaining).toBe(900);
  });

  it('should detect budget exceeded', () => {
    const budget = new TokenBudget(100);
    budget.consume(80);
    expect(budget.status).toBe('critical');
  });
});

describe('ProgressiveLoader', () => {
  it('should load in chunks', async () => {
    const loader = new ProgressiveLoader();
    const items = Array.from({ length: 100 }, (_, i) => i);
    const chunks: number[][] = [];
    
    await loader.loadInChunks(items, {
      chunkSize: 10,
      onChunk: (chunk: number[]) => { chunks.push(chunk); }
    });
    
    expect(chunks.length).toBe(10);
    expect(chunks[0].length).toBe(10);
  });

  it('should respect token budget with truncate', async () => {
    const loader = new ProgressiveLoader();
    const items = [
      { content: 'a'.repeat(100) },
      { content: 'b'.repeat(100) },
      { content: 'c'.repeat(100) },
      { content: 'd'.repeat(100) },
    ];
    
    const result = await loader.loadWithBudget(items, {
      budget: 60,
      estimator: (item: { content: string }) => TokenEstimator.estimateText(item.content),
      onBudgetExceeded: 'truncate',
      minItems: 1
    });
    
    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.truncated).toBe(true);
  });

  it('should respect token budget with skip', async () => {
    const loader = new ProgressiveLoader();
    const items = [
      { content: 'a'.repeat(100) },
      { content: 'b'.repeat(1000) },
      { content: 'c'.repeat(100) },
    ];
    
    const result = await loader.loadWithBudget(items, {
      budget: 60,
      estimator: (item: { content: string }) => TokenEstimator.estimateText(item.content),
      onBudgetExceeded: 'skip',
      minItems: 1
    });
    
    expect(result.skipped).toBeGreaterThan(0);
  });
});

describe('AdaptiveTokenBudget', () => {
  it('should suggest budget adjustment', () => {
    const budget = new AdaptiveTokenBudget(1000);
    
    for (let i = 0; i < 5; i++) {
      budget.recordActualUsage(950);
    }
    
    const suggestion = budget.suggestBudgetAdjustment();
    expect(suggestion.action).toBe('increase');
  });

  it('should predict future needs', () => {
    const budget = new AdaptiveTokenBudget(1000);
    budget.recordActualUsage(500);
    budget.recordActualUsage(600);
    budget.recordActualUsage(550);
    
    const prediction = budget.predictNeed();
    expect(prediction).toBeGreaterThan(0);
  });
});
