# AGENTS.md - harness 项目

## 发布流程

**⚠️ 使用 GitHub Actions 自动发布，不尝试本地 `npm publish`**

```bash
# 1. 更新版本
npm version patch --no-git-tag-version

# 2. 提交并推送
git add package.json package-lock.json
git commit -m "chore: bump version"
git push origin master

# 3. 创建 tag（触发发布）
git tag v<version>
git push origin v<version>

# 4. 查看状态
gh run list --limit 1
```

**注意**：版本号已存在 npm 时会失败，需先更新版本号。

## 开发命令

```bash
npm run build    # 编译
npm test         # 测试
npm run lint     # 代码检查
```
