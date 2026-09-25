# 双端同步（Supabase）接入指南

MyLife 的代码已经支持云端同步，你只需要按下面几步配置好 Supabase 即可启用。

## 第 1 步：创建 Supabase 项目

1. 打开 https://supabase.com ，注册 / 登录（可用 GitHub 登录）。
2. 点 **New Project**，填项目名（如 `mylife`），设置数据库密码（自己记好），选一个就近的 Region。
3. 等待项目初始化（约 1 分钟）。

## 第 2 步：建表 + 行级安全

在 Supabase 控制台左侧 **SQL Editor** 里，新建一个查询，粘贴并运行下面这段 SQL：

```sql
-- 所有实体都存为 JSONB 文档（一个表搞定全部）
create table if not exists public.documents (
  id text primary key,
  kind text not null,
  data jsonb not null,
  user_id uuid not null default auth.uid(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_kind_idx on public.documents (kind);
create index if not exists documents_user_idx on public.documents (user_id);

-- 行级安全：每个用户只能读写自己的数据
alter table public.documents enable row level security;

create policy "用户可以读写自己的文档"
  on public.documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 第 3 步：关闭邮箱验证（可选，推荐）

默认情况下注册会发一封确认邮件。个人用的话建议关掉，注册后立刻就能用：

- 左侧 **Authentication → Providers → Email**，把 **Confirm email** 关掉，保存。

## 第 4 步：拿到 URL 和 anon key

- 左侧 **Project Settings → API**。
- 找到 **Project URL**（形如 `https://xxxx.supabase.co`）和 **anon public key**（形如 `eyJhbGciOi...`）。

## 第 5 步：填入 .env

在项目根目录新建 `.env` 文件（把 `.env.example` 复制一份改名即可），填入：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 第 6 步：重启并登录

1. 停掉 dev server，重新 `npm run dev`。
2. 浏览器会先出现登录界面，点「去注册」注册一个邮箱 + 密码。
3. 在另一台设备（或另一个浏览器）用同一个账号登录，就能看到同一份数据了。

## 说明

- **数据隔离**：行级安全保证每个账号只能看到自己的数据。
- **同步方式**：每次改动即时写入云端；切回设备窗口（focus）时自动拉取最新。
- **回退本地**：删掉 `.env`（或留空），就自动退回本地 localStorage 模式。
- **免费额度**：Supabase 免费档对个人使用绰绰有余。
