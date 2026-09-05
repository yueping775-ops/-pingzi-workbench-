[README.md](https://github.com/user-attachments/files/31863637/README.md)
# 平子的工作台 · Pingzi Workbench

为一名学校心理老师 + 劳动课老师 + 7 年级行政事务打造的专属云端超级工作台。

---

## 一、快速启动

```bash
# 方式 A：纯静态预览（本地优先，数据存在本机 localStorage）
cd /workspace
python3 -m http.server 8137
# 浏览器打开 http://localhost:8137

# 方式 B：启用可选云同步服务（同端口同时提供静态页面 + 同步接口）
cd /workspace
python3 sync-server.py 8137 ./sync-data
```

---

## 二、部署到公网/云端

### 1）仅前端静态部署

`/workspace` 内是一个纯静态 SPA，可一键部署到：

- Nginx / Apache
- GitHub Pages / Vercel / Netlify / Cloudflare Pages
- 腾讯云 COS / 阿里云 OSS / AWS S3

要求：根目录下 `index.html` 保持为入口，其余文件相对路径加载。

### 2）启用多端同步

如需跨手机/电脑/网页实时同步：

1. 把 `/workspace` 部署到一台公网服务器（例如腾讯云/阿里云轻量服务器）。
2. 在该服务器运行：
   ```bash
   nohup python3 sync-server.py 8137 ./sync-data > sync.log 2>&1 &
   ```
   或配合 `systemd` / `supervisor` 常驻。
3. 在「设置 → 数据·云端同步」中填写：
   - **同步服务器**：`http(s)://你的域名或IP/sync`
   - **同步令牌**：一个复杂字符串（例如 16 位随机字符）
4. 点击「上传到云端」，在其他设备点击「从云端下载」即可同步。

> 安全提示：生产环境请务必使用 HTTPS + 强 token，并设置 Nginx 反向代理。

---

## 三、Service Worker 说明

本系统**已彻底关闭 Service Worker**：

- 代码内没有任何 Service Worker 注册。
- `index.html` 加载时会主动注销任何已存在的旧 Service Worker。
- 所有静态资源均携带 `Cache-Control: no-store` 头（同步服务/代理需保持）。

因此每次打开都会**实时拉取服务器最新文件**，符合需求。

---

## 四、数据存储位置

| 类型 | 位置 | 说明 |
|------|------|------|
| 结构化数据 | 浏览器 localStorage (`pingzi_workbench_v1`) | 本地优先，关闭 SW 后不影响 |
| PDF/PPT/WORD/图片等附件 | 浏览器 IndexedDB (`pingzi_files`) | 纯本地，隐私区附件绝不外传 |
| 云端备份 | `sync-server.py` 的 `./sync-data` 目录 | 按 token 哈希隔离 |

---

## 五、自定义能力

在「设置」中可调整：

- Logo emoji / 工作台名称
- 第 1 教学周起始日期
- 课表节次名称与时间段
- 假期列表
- WPS / 飞书 / IMA 深度链接
- **各板块的自定义字段**（个辅、危机、教研、论文、比赛、7 年级、分享灵感）

---

## 六、10 大板块速览

1. **首页**：时间中枢、教学周、假期倒计时、今日课程/待办、调课管理。
2. **上课**：聚合周课表（心理/社团/延时/劳动）、备课区（支持 PDF/PPT/WORD 附件）、课堂追踪。
3. **个辅**：隐私红线墙、脱敏预约登记、访谈记录。
4. **危机干预**：隐私红线墙、制度归档、高危学生跟进档案（支持多附件）。
5. **教研培训学习**：听课/培训笔记沉淀、WPS/飞书/IMA 链接。
6. **论文和课题**：申报→开题→中期→结题看板、文献库。
7. **比赛**：通知归档、备赛倒计时、参赛材料版本控制。
8. **7年级事务性工作**：看板式任务管理（未开始/进行中/已完成）。
9. **日常分享与灵感**：选题库（他人作品/自己感悟分离）、闪念笔记。
10. **自我关怀**：每日金句、盒式呼吸、放松音视频。

---

## 七、开发结构

```
/workspace
├── index.html              # SPA 入口
├── assets/
│   ├── css/style.css       # 紫色主题、响应式、隐私墙
│   ├── vendor/vue.global.prod.js  # 本地化 Vue 3
│   └── js/
│       ├── store.js        # 数据层（localStorage + IndexedDB）
│       ├── utils.js        # 日期/周次/倒计时/文件图标工具
│       ├── sections-home.js
│       ├── sections-teaching.js
│       ├── sections-privacy.js
│       ├── sections-work.js
│       ├── sections-inspiration.js
│       ├── settings.js
│       └── app.js          # 根应用 + 全局组件
└── sync-server.py          # 可选云同步服务
```

---

## 八、隐私与安全强调

- 个辅 / 危机干预板块有独立视觉隔离墙、全局水印、明确提示。
- 所有隐私数据仅存储于本地 localStorage / IndexedDB。
- 除非用户主动导出/同步，否则不会上传任何数据。
- 建议高危档案坚持使用化名或编号，避免真实姓名落地。
