# 服务器上传与启动（www.hyxhhh.site）

## 1) 上传压缩包
把 `release/dream-topology-hyxhhh-package.zip` 上传到服务器，例如 `/root/`.

## 2) 解压
```bash
mkdir -p /var/www/dream-topology
cd /var/www/dream-topology
unzip /root/dream-topology-hyxhhh-package.zip -d .
```

## 3) 后端安装与启动
```bash
cd /var/www/dream-topology/dream-topology-backend
npm install
npm run db:push
npm run build
nohup npm run start > /var/log/dream-topology-backend.log 2>&1 &
```

## 4) 前端发布静态文件
```bash
mkdir -p /var/www/dream-topology-web
cp -r /var/www/dream-topology/dream-topology-web/dist /var/www/dream-topology-web/
```

## 5) Nginx 配置
```bash
cp /var/www/dream-topology/deploy/nginx/hyxhhh.site.conf /etc/nginx/conf.d/hyxhhh.site.conf
nginx -t && systemctl reload nginx
```

## 6) SSL 证书（若未配置）
```bash
certbot --nginx -d www.hyxhhh.site -d hyxhhh.site
```

## 7) 验证
- 访问 `https://www.hyxhhh.site`
- 访问 `https://www.hyxhhh.site/api/health/user/stats`
