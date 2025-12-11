FROM ghcr.io/lslove10010/choreows:latest
COPY index.js /tmp/index.js
ENV UUID=28732a5f-8e04-4dd4-b97c-ddde74ee1f02 \
    PORT=8080 \
    NAME=choreo \
    SUB_PATH=websub \
    DOMAIN=choreo.cnav.cn.eu.org
USER 10014
EXPOSE 8080
