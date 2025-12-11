
FROM ghcr.io/lslove10010/choreows:latest

# 1) 固定工作目录
WORKDIR /app

# 2) 先复制包清单并安装依赖（优先锁文件）
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --only=production; \
    fi

# 3) 复制应用源码（不要在同一行尾部加注释）
COPY index.js ./

# 4) 环境变量
ENV UUID=28732a5f-8e04-4dd4-b97c-ddde74ee1f02 \
    PORT=8080 \
    NAME=choreo \
    SUB_PATH=websub \
    DOMAIN=choreo.cnav.cn.eu.org

# 5) 切换到非 root 用户（确保有读权限）
USER 10014

# 6) 端口声明
EXPOSE 3000

# 7) 启动命令
CMD ["node", "index.js"]
