# Chrome 浏览器访问 CloudBase 问题排查

## 问题现象
- Edge/IE 浏览器正常访问云端数据库
- Chrome 浏览器无法访问，按钮点击无反应

## 根本原因
Chrome 对第三方 Cookie 和跨域请求有更严格的限制（SameSite Cookie 策略）。

## 解决方案

### 方案一：配置 CloudBase 安全域名（推荐）

1. 登录 [腾讯云开发 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入你的环境 `map-visualization-001-d6cda2aa5a`
3. 点击左侧菜单 **环境** → **安全配置**
4. 在 **安全域名** 中添加以下域名：
   - `localhost`
   - `127.0.0.1`
   - `https://map-visualization-001-d6cda2aa5a-1423211882.tcloudbaseapp.com`
   - 如果有自定义域名，也要添加

### 方案二：修改 Chrome 设置（临时方案）

1. 在 Chrome 地址栏输入：`chrome://flags/#same-site-by-default-cookies`
2. 找到 **SameSite by default cookies** 选项
3. 将其设置为 **Disabled**
4. 重启 Chrome

或者：

1. 在 Chrome 地址栏输入：`chrome://settings/cookies`
2. 关闭 **阻止第三方 Cookie**

### 方案三：使用无痕模式测试

1. 按 `Ctrl+Shift+N` 打开 Chrome 无痕窗口
2. 访问云端地址
3. 测试按钮是否正常

### 方案四：检查数据库权限

1. 登录 CloudBase 控制台
2. 进入 **数据库** 页面
3. 选择 `batches` 集合
4. 点击 **权限设置**
5. 确保有 **所有用户可读，仅创建者可写** 或更宽松的权限

## 调试方法

在 Chrome 中按 F12 打开开发者工具，查看 Console 控制台的错误信息：

1. **CORS 错误**：安全域名配置问题
2. **Third-party cookie blocked**：Cookie 策略问题
3. **Permission denied**：数据库权限问题
4. **Network error**：网络连接问题

## 已做的代码改进

1. 添加了 `region: 'ap-shanghai'` 参数
2. 增强了错误处理和日志输出
3. 添加了 CORS 错误检测和提示

## 测试步骤

1. 配置 CloudBase 安全域名
2. 重新部署到 CloudBase
3. 在 Chrome 中访问
4. 按 F12 查看控制台日志
5. 点击"从数据库导入"按钮测试
