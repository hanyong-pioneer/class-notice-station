# 班级通知站 📣

把官方通知拆成 **时间轴、操作步骤、材料清单、避坑提醒**,让每一条通知都看得懂、做得了。

纯前端 + 静态 JSON 数据,托管于 GitHub Pages,**零服务器、零备案、零成本**。

## 功能

- **通知列表**:6 大分类筛选(竞赛/社会实践/评奖评优/课程学习/活动/其他)+ 子标签(选课、材料填写…)、全文搜索、⭐ 关注标记、未来 7 天待办速览
- **通知详情**:📅 时间轴(带倒计时)、📝 操作步骤、📂 材料清单(可勾选)、📎 资料区、⚠️ 避坑提醒、原始通知下载入口
- **📅 时间线总览**:全班所有截止节点按日期合并成一屏,一眼看到"接下来该做什么"
- **🖼 长图分享**:一键生成通知长图保存/转发班群
- **📆 日历订阅**:下载 .ics 导入手机日历,截止日期自动提前提醒
- **✏️ 班委编辑**:表单化录入、生成 JSON、自带校验、草稿保存
- **📱 PWA**:手机浏览器打开一次即可"添加到主屏幕",像 App 一样使用

## 快速开始

环境要求:Node.js 18+

```bash
npm install
npm run dev        # 本地预览 http://localhost:5173
npm run build      # 打包到 dist/
npm run validate   # 校验 public/notices.json 格式
```

## 数据文件说明

所有通知数据在 `public/notices.json`:

| 字段 | 说明 |
|---|---|
| id | 数字,全站唯一 |
| title / category / source | 标题、分类、发布单位 |
| category | 枚举:competition 竞赛 / practice 社会实践 / award 评奖评优 / course 课程学习(作业·考试·选课)/ activity 活动 / other 其他 |
| tags | 子标签数组,自由填写,如 `["选课"]`、`["材料填写"]`(选填) |
| publishedAt | 发布日期,YYYY-MM-DD |
| originalUrl | 原始通知查看/下载链接 |
| summary / originalText | 一句话摘要、原文全文(用于全文搜索,也是二期 AI 问答的知识库) |
| timeline | 时间节点数组 `[{date, label}]`(至少 1 条) |
| steps / materials / pitfalls | 字符串数组(可为空数组) |
| attachments | 资料区 `[{name, url}]`(可为空数组) |

## 如何发布 / 修改通知(重要)

网站是"只读展示端",真正的数据源是仓库里的 `public/notices.json`。**发布 = 把新数据提交到 GitHub 仓库**,提交后自动部署、全班同步。三种方式:

- **方式一(推荐,最省事)**:把通知原文(文字/截图/Word/PDF)直接发给 Claude Code,AI 负责拆解、写入、校验、git 提交推送,你只需确认一次拆解结果
- **方式二(网页表单)**:打开网站"班委编辑"页 → 表单录入 → 生成 JSON → 下载后替换 `public/notices.json` → 在 GitHub 网页版(或本地 git)提交
- **方式三(直接改)**:编辑 `public/notices.json`,提交前 `npm run validate` 校验

## 多人管理

GitHub 仓库天然支持多人协作,零成本:

- **推荐**:班委把通知发到管理群,由维护者(你或 Claude)统一发布
- **共同维护**:在仓库 Settings → Collaborators 里添加其他班委的 GitHub 账号,他们即可直接编辑提交(通知数据量小,直接提交冲突很少)
- **审核制**:其他班委从分支提交 Pull Request,由你审核合并(适合之后人多的情况)

## 部署到 GitHub Pages

1. 在 GitHub 新建**公开**仓库,把本项目 push 到 main 分支(注意包含 package-lock.json)
2. Settings → Pages → Source 选择 **GitHub Actions**(工作流已内置,无需其他配置)
3. 等 Actions 跑完,访问 `https://<用户名>.github.io/<仓库名>/`

> 国内访问 GitHub Pages 偶尔较慢,可同时在 Cloudflare Pages / Vercel 部署一份(同样免费免备案),直接使用 dist 目录。

## 路线图

- [ ] **AI 问答(RAG)增强模块(二期)**:同学自愿填自己的大模型 API key(只存本机,项目仍零后端),前端检索 notices.json(含原文全文)后生成带引用来源的回答。**当前一期版本不含任何 AI 功能**
- [ ] 微信推送提醒
- [ ] 班委模式站内一键发布(细粒度 GitHub token)

## 注意

- 仓库为公开状态,**请勿在 notices.json 中存放同学隐私信息**(手机号、身份证号等)
- 示例数据中的链接为占位符,上线前替换为真实链接
