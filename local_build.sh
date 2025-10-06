#!/bin/zsh
# 设置 Electron 国内镜像
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
nvm use 20
npm install
npm run build:mac-dmg-universal