# 每日打卡

给 iPhone H5 使用的家庭私用任务打卡系统。前端使用 Vue 3，后端使用 NestJS，数据保存到 MySQL，Redis 用于提醒去重，Docker Compose 在本机 80 端口部署。注册只需要用户名和密码，登录支持用户名或用户 ID。

现在任务分两类：

- 常驻任务：长期每天出现，例如喝水、运动、早睡。
- 当天任务：点日历中的某一天后，只给那一天添加的任务，例如买花、体检、整理房间。

## 本机运行

```bash
cp .env.example .env
pnpm install
pnpm --filter @wife-checkin/api prisma:generate
pnpm test:run
pnpm build
```

## Docker 部署

```bash
cp .env.example .env
docker compose up -d --build
```

访问：

- 本机：`http://localhost/`
- iPhone：同一局域网内访问本机 IP，例如 `http://192.168.1.10/`

默认按本机 HTTP 部署，`COOKIE_SECURE=false`。如果以后放到 HTTPS 域名下，再改成 `COOKIE_SECURE=true`。

如果本机 80 端口已被其他服务占用，可以临时指定端口：

```bash
WEB_PORT=18080 docker compose up -d --build
```

## 当前公网部署

当前这台腾讯云机器使用本机 Node + MySQL/Redis 容器部署，公网入口是：

```text
http://42.194.251.188/
```

使用方式：

- 今日页：打今天的常驻任务和今天的当天任务。
- 日历页：点击任意一天，给该日期添加任务，也可以补打卡。
- 常驻任务页：维护每天都会出现的中长期任务。

服务管理：

```bash
sudo systemctl status wife-checkin-api wife-checkin-public
sudo systemctl restart wife-checkin-api wife-checkin-public
docker start wife-checkin-mysql wife-checkin-redis
```

运行时配置在 `/etc/wife-checkin.env`，模板在 `deploy/wife-checkin.env.example`。

原先占用 80 端口的 `sub2api` 容器已停止但未删除，需要恢复时运行：

```bash
docker start sub2api
```

## 邮件提醒

在 `.env` 配置 SMTP：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_FROM="打卡提醒 <noreply@example.com>"
```

未配置 SMTP 时，注册、登录、建任务、打卡、日历和统计仍可正常使用，只是不发送邮件提醒。
