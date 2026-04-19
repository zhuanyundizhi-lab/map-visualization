# 地图数据可视化系统 - Nginx 便携版部署说明

## 快速开始

### 1. 下载 Nginx Windows 版本

访问 https://nginx.org/en/download.html 下载 Stable version 的 Windows 版本，解压后将 `nginx.exe` 及相关文件放入 `nginx` 文件夹。

或者使用以下命令下载：
```powershell
# 下载 Nginx 1.24.0
Invoke-WebRequest -Uri "http://nginx.org/download/nginx-1.24.0.zip" -OutFile "nginx.zip"
Expand-Archive -Path "nginx.zip" -DestinationPath "."
Move-Item -Path "nginx-1.24.0\*" -Destination "nginx"
Remove-Item -Path "nginx.zip"
Remove-Item -Path "nginx-1.24.0" -Recurse
```

### 2. 准备网页文件

确保 `www` 文件夹中包含所有网页文件：
```
www/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── cloudbase-config.js
    ├── data-cloudbase.js
    ├── excel-cloudbase.js
    ├── filter.js
    └── map.js
```

### 3. 启动服务

双击运行 `start.bat`，会自动：
1. 启动 Nginx 服务
2. 打开浏览器访问 http://localhost:8080

### 4. 停止服务

关闭 `start.bat` 窗口，或在窗口中按任意键停止服务。

## 文件结构

```
MAP/
├── nginx/                  # Nginx 服务器
│   ├── nginx.exe          # Nginx 主程序
│   ├── conf/
│   │   └── nginx.conf     # 配置文件
│   └── ...                # 其他 Nginx 文件
├── www/                    # 网站根目录
│   ├── index.html
│   ├── css/
│   └── js/
├── start.bat              # 启动脚本（双击运行）
└── README-部署说明.md     # 本文件
```

## 打包分发

将以下文件夹打包成 zip 即可分发：
- `nginx/` - Nginx 服务器
- `www/` - 网页文件
- `start.bat` - 启动脚本

用户解压后双击 `start.bat` 即可使用，无需安装任何环境。

## 注意事项

1. **端口占用**：默认使用 8080 端口，如果被占用会自动尝试停止原有进程
2. **防火墙**：首次运行可能会被 Windows 防火墙拦截，请点击「允许访问」
3. **数据存储**：数据保存在浏览器 LocalStorage 中，清除浏览器数据会丢失

## 自定义配置

如需修改端口，编辑 `nginx/conf/nginx.conf`：
```nginx
server {
    listen       8080;    # 修改这里的端口号
    ...
}
```

然后修改 `start.bat` 中的对应端口号。
