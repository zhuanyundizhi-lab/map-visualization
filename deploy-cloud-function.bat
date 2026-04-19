@echo off
chcp 65001 >nul
title 部署云函数到腾讯云 CloudBase

echo ==========================================
echo  部署云函数到腾讯云 CloudBase
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

echo [1/3] 正在部署云函数 uploadData...
tcb fn deploy uploadData -e map-visualization-001-d6cda2aa5a
if %errorlevel% neq 0 (
    echo [错误] 云函数部署失败
    pause
    exit /b 1
)
echo.

echo [2/3] 云函数部署完成！
echo.

echo [3/3] 正在部署前端页面...
copy /Y index-cloudbase.html index.html >nul
tcb hosting deploy . -e map-visualization-001-d6cda2aa5a
if %errorlevel% neq 0 (
    echo [错误] 前端部署失败
    pause
    exit /b 1
)
echo.

echo ==========================================
echo  部署完成！
echo  云函数: uploadData
echo  前端地址: https://map-visualization-001-d6cda2aa5a-1423211882.tcloudbaseapp.com
echo ==========================================
echo.
pause
