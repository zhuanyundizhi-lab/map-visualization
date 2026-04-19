@echo off
chcp 65001 >nul
echo ==========================================
echo  GitHub Pages 部署脚本
echo ==========================================
echo.

REM 检查是否输入了GitHub用户名和仓库名
if "%~1"=="" (
    echo 使用方法: deploy-to-github.bat ^<GitHub用户名^> ^<仓库名^>
    echo 例如: deploy-to-github.bat zhangsan map-visualization
    pause
    exit /b 1
)

if "%~2"=="" (
    echo 使用方法: deploy-to-github.bat ^<GitHub用户名^> ^<仓库名^>
    echo 例如: deploy-to-github.bat zhangsan map-visualization
    pause
    exit /b 1
)

set USERNAME=%~1
set REPO=%~2
set REPO_URL=https://github.com/%USERNAME%/%REPO%.git

echo GitHub用户名: %USERNAME%
echo 仓库名: %REPO%
echo 仓库地址: %REPO_URL%
echo.

REM 检查Git是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Git未安装，请先安装Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/5] Git已安装，继续...

REM 初始化Git仓库
if exist ".git" (
    echo [2/5] Git仓库已存在，跳过初始化
) else (
    echo [2/5] 初始化Git仓库...
    git init
    if errorlevel 1 (
        echo [错误] Git初始化失败
        pause
        exit /b 1
    )
)

REM 添加所有文件
echo [3/5] 添加文件到Git...
git add .
if errorlevel 1 (
    echo [错误] 添加文件失败
    pause
    exit /b 1
)

REM 提交更改
echo [4/5] 提交更改...
git commit -m "Initial commit - 地图数据可视化系统"
if errorlevel 1 (
    echo [注意] 没有需要提交的更改，或提交失败
)

REM 设置远程仓库并推送
echo [5/5] 推送到GitHub...
git branch -M main

REM 检查远程仓库是否已存在
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
)

git push -u origin main
if errorlevel 1 (
    echo.
    echo [错误] 推送失败，可能原因：
    echo 1. 你还没有在GitHub上创建仓库 "%REPO%"
    echo 2. 没有配置GitHub账号的SSH密钥或登录凭据
    echo.
    echo 请按以下步骤操作：
    echo 1. 访问 https://github.com/new 创建新仓库，名称为 "%REPO%"
    echo 2. 确保已配置GitHub凭据（运行: git config --global user.name "你的用户名"）
    echo 3. 确保已配置GitHub凭据（运行: git config --global user.email "你的邮箱"）
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  部署完成！
echo ==========================================
echo.
echo 接下来请在GitHub上启用Pages：
echo 1. 访问: https://github.com/%USERNAME%/%REPO%/settings/pages
echo 2. Source 选择 "Deploy from a branch"
echo 3. Branch 选择 "main"，文件夹选择 "/ (root)"
echo 4. 点击 Save
echo.
echo 部署完成后，访问地址：
echo https://%USERNAME%.github.io/%REPO%
echo.
pause
