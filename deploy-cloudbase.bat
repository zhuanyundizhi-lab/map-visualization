@echo off
chcp 65001 >nul
title 部署到腾讯云开发 CloudBase

echo ==========================================
echo  部署到腾讯云开发 CloudBase
echo ==========================================
echo.

:: 检查是否安装了 cloudbase CLI
where tcb >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 cloudbase CLI (tcb)
    echo 请先安装: npm install -g @cloudbase/cli
    pause
    exit /b 1
)

:: 使用 index-cloudbase.html 作为入口文件
echo [1/3] 准备部署文件...
copy /Y index-cloudbase.html index.html >nul
echo      已更新 index.html
echo.

:: 部署到 CloudBase
echo [2/3] 开始部署到 CloudBase...
tcb hosting deploy . -e map-visualization-001-d6cda2aa5a
if %errorlevel% neq 0 (
    echo [错误] 部署失败
    pause
    exit /b 1
)
echo.

echo [3/3] 部署完成！
echo.
echo ==========================================
echo  访问地址:
echo  https://map-visualization-001-d6cda2aa5a-1423211882.tcloudbaseapp.com
echo ==========================================
echo.
pause
