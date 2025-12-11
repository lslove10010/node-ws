
# 仍然使用你的基础镜像
FROM ghcr.io/lslove10010/choreows:latest

# 设置工作目录（避免使用 /tmp）
WORKDIR /app

# 复制 index.js 到 /app，并把属主设为运行用户（可选）
# 如果基础镜像里没有 10014 这个用户，请先确认或改成存在的用户/组
COPY --chown=10014:10014 index.js /app/index.js

# 保持你的环境变量
ENV UUID=28732a5f-8e04-4dd4-b97c-ddde74ee1f02 \
    PORT=8080 \
    NAME=choreo \
    SUB_PATH=websub \
    DOMAIN=choreo.cnav.cn.eu.org

# 切换到非 root 用户
USER 10014

# 暴露端口（声明作用）
EXPOSE 8080

# 如果基础镜像没有指定 ENTRYPOINT/CMD，明确给出启动命令：
# （如果基础镜像已经有 ENTRYPOINT 指向其他 Node 脚本，你可以用 --entrypoint 覆盖；见下文）
CMD ["node", "index.js"]
