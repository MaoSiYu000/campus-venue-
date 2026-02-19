# Git 版本管理 + 服务器部署 使用说明

针对本仓库（校园场地预约系统）的日常用法：分支、回退、和服务器怎么配合。

---

## 一、先搞清几个概念

| 概念 | 简单理解 |
|------|----------|
| **提交 (commit)** | 一次“存档”，把当前改动的代码存进历史，可以写一句说明（message） |
| **分支 (branch)** | 一条独立的时间线。默认有一条叫 `main`，你可以在上面再开新线（新分支）开发，做完再合并回 main |
| **远程 (remote)** | 网上的仓库，你 push 上去、服务器从上面 pull。我们用的是 Gitee（origin） |

**和服务器的关系：**

- 服务器上的代码 = 从 Gitee **拉取**来的。
- 你**本地**改代码 → **commit** → **push** 到 Gitee → 服务器上 **git pull** 再执行 `scripts/server-update.sh`，服务器就更新了。
- 所以：**谁被 push、谁被 pull，谁就是“线上版本”**。我们约定 **main 分支** 代表要部署到服务器的版本，别的分支只在本地或用来开发新功能。

---

## 二、把改好的界面发布到浏览器（规范流程）

按下面顺序做，就能让线上网站和本地一样。

### 第一步：在本地提交并推送

在 **PowerShell** 里执行（在项目根目录 `E:\2026study\software`）：

```powershell
cd E:\2026study\software

# 1. 看当前改了哪些文件
git status

# 2. 把所有改动加入暂存
git add .

# 3. 提交，写一句说明（可改成你的话）
git commit -m "登录页改版：页眉底栏、背景轮播、白框样式与半透明外框"

# 4. 若你在 msy 分支，先合并到 main 再推送（服务器拉的是 main）
git checkout main
git merge msy
git push

# 若你本来就在 main，上面 merge 可省略，直接：
# git push
```

### 第二步：让 Gitee 和 GitHub 一致（若你平时推的是 GitHub）

- 打开 Gitee 仓库：https://gitee.com/maosiyu26/campus-venue  
- 若仓库里有 **「从 GitHub 同步」** 或 **「刷新」**，点一下，让 Gitee 拿到最新 main。

### 第三步：在服务器上拉代码并更新

用 **SSH** 连上服务器后执行：

```bash
cd ~/software
git pull
bash scripts/server-update.sh
```

等脚本跑完出现「更新完成」。

### 第四步：在浏览器验证

- 打开你的网站（例如 `http://120.26.124.180`），清除缓存或强制刷新（Ctrl+F5）。
- 打开登录页，确认和本地改好的界面一致。

---

## 三、日常最常用：在主分支上改完就推送（你现在这样）

就是一直在 `main` 上改，改完就推，服务器拉 main。

```powershell
# 在项目目录
cd E:\2026study\software

# 看当前在哪个分支（会显示 * main）
git branch

# 改完代码后
git add .
git commit -m "修复了预约页面的 bug"
git push
```

**服务器上更新：**

```bash
cd ~/software
git pull
bash scripts/server-update.sh
```

---

## 四、创建分支：想先单独开发一个功能再合并

适合：想做一个“预约统计”功能，又不想影响当前 main 上的稳定版本。

### 1. 从当前 main 创建并切换到新分支

```powershell
# 创建并切换到新分支（名字自己取，例如 feature/booking-stats）
git checkout -b feature/booking-stats
```

### 2. 在新分支上正常开发、提交

```powershell
# 改代码...
git add .
git commit -m "添加预约统计页面"
# 可以多次 commit
git add .
git commit -m "统计接口联调"
```

### 3. 推送到 Gitee（第一次推这个分支要设上游）

```powershell
git push -u origin feature/booking-stats
```

这样 Gitee 上会多一个分支 `feature/booking-stats`，main 不变。

### 4. 功能做完了，合并回 main

```powershell
# 先切回 main
git checkout main

# 把 feature/booking-stats 合并进来
git merge feature/booking-stats

# 推 main，这样服务器 pull 就会拿到最新
git push
```

### 5. 合并后可选：删掉本地和远程的该分支

```powershell
# 删本地分支
git branch -d feature/booking-stats

# 删 Gitee 上的分支（不删也行，只是保持干净）
git push origin --delete feature/booking-stats
```

**和服务器的关系：** 服务器只拉 `main`。所以你是把分支合并到 main 再 push，服务器 `git pull` 后就会拿到合并后的版本。

---

## 五、回退：改错了想撤销

分两种：**还没 push** 和 **已经 push**。

### 1. 只撤销最后一次 commit，代码改回上次提交的状态（没 push 时常用）

```powershell
# 撤销最后一次 commit，保留工作区的修改（文件还是你改过的样子）
git reset --soft HEAD~1

# 或者：撤销最后一次 commit，并且丢弃工作区修改（完全回到上一次 commit）
git reset --hard HEAD~1
```

`HEAD~1` = 上一个提交。用 `--soft` 更安全（只撤提交，不改文件），用 `--hard` 会连文件一起恢复成上次提交的样子。

### 2. 已经 push 了，想“往回退一个版本”

不要在 main 上乱用 `git reset --hard` 再 force push，容易把别人或服务器搞乱。用 **revert** 更安全：多出一个“反向”的提交，把某次修改抵消掉。

```powershell
# 查看最近几次提交的 hash
git log --oneline -5

# 撤销其中某一次（把 <那次提交的hash> 换成实际值，例如 a1b2c3d）
git revert <那次提交的hash> --no-edit
git push
```

**和服务器的关系：** 你 revert 后 push，服务器 `git pull` 再执行 `server-update.sh`，服务器就也回到“去掉那一次修改”的状态。

### 3. 只是改乱了工作区，想全部丢掉，和上次 commit 一致

```powershell
git checkout -- .
# 或
git restore .
```

---

## 六、查看历史、当前状态

```powershell
# 当前分支、有没有未提交修改
git status

# 最近提交历史（一行一个）
git log --oneline -10

# 所有分支（本地）
git branch

# 所有分支（含远程）
git branch -a
```

---

## 七、和服务器配合：举例时间线

1. **平时**：在 main 上改小 bug → `git add` → `commit` → `push` → 服务器 `git pull` + `bash scripts/server-update.sh`。
2. **做新功能**：`git checkout -b feature/xxx` → 在新分支开发、多次 commit → 觉得没问题了 → `git checkout main` → `git merge feature/xxx` → `git push` → 服务器同样 pull + 运行更新脚本。
3. **推错了**：用 `git revert <hash>` 再 push，服务器再 pull + 更新脚本，就回退了。

记住：**服务器 = 拉 Gitee 的 main（或你部署时选的那一分支）**，所以你要部署什么，就把什么合并到 main 并 push。

---

## 八、一句话速查

| 想做的事 | 命令 |
|----------|------|
| 当前在哪个分支 | `git branch` |
| 新建并切换分支 | `git checkout -b 分支名` |
| 切换分支 | `git checkout main` 或 `git checkout 分支名` |
| 合并某分支到当前分支 | `git merge 分支名`（当前要在 main 上） |
| 撤销最后一次 commit（保留修改） | `git reset --soft HEAD~1` |
| 撤销最后一次 commit（不保留修改） | `git reset --hard HEAD~1` |
| 已 push 的回退 | `git revert <commit的hash>` 再 `git push` |
| 丢弃工作区所有修改 | `git restore .` 或 `git checkout -- .` |
| 服务器更新 | `cd ~/software` → `git pull` → `bash scripts/server-update.sh` |

有需要可以把这份当“说明书”留着，做到哪一步就翻到对应小节用。
