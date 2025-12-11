
FROM ghcr.io/lslove10010/choreows:latest

# 固定工作目录
WORKDIR /app

# 先复制包清单和锁文件（如有）
COPY package.json package-lock.json* ./

# 安装依赖（优先使用锁文件）
# 如果没有 package-lock.json，用 npm install；有的话用 npm ci
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --only=production; \
    fi

# 复制应用源码
COPY index.js ./  # 如果还有其它源码/目录，一并复制

# 环境变量照旧
ENV UUID=28732a5f-8e04-4dd4-b97c-ddde74ee1f02 \
    PORT=8080 \
    NAME=choreo \
    SUB_PATH=websub \
    DOMAIN=choreo.cnav.cn.eu.org

# 切换到非 root 用户（确保之后运行时有读权限）
USER 10014

EXPOSE 8080

# 明确启动命令

CMD ["node", "index.js"]
