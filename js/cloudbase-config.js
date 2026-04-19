/**
 * 腾讯云开发 CloudBase Web SDK 配置
 * 环境ID: map-visualization-001-d6cda2aa5a
 */

// 等待 SDK 加载完成
function waitForCloudBase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        const check = () => {
            attempts++;
            if (typeof cloudbase !== 'undefined') {
                console.log('CloudBase SDK 已加载');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('CloudBase SDK 加载超时'));
            } else {
                setTimeout(check, 100);
            }
        };
        
        check();
    });
}

// 云开发服务类
class CloudBaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.collection = null;
        this.isInitialized = false;
    }

    /**
     * 初始化 CloudBase
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // 等待 SDK 加载
            await waitForCloudBase();

            console.log('开始初始化 CloudBase...');
            console.log('当前域名:', window.location.hostname);
            console.log('当前协议:', window.location.protocol);

            // 初始化 - 添加 region 参数，使用上海区域
            this.app = cloudbase.init({
                env: 'map-visualization-001-d6cda2aa5a',
                region: 'ap-shanghai'
            });

            console.log('CloudBase 初始化成功');

            // 匿名登录 - 添加错误处理
            try {
                const auth = this.app.auth();
                console.log('开始匿名登录...');
                await auth.signInAnonymously();
                console.log('匿名登录成功');
            } catch (authError) {
                console.error('匿名登录失败:', authError);
                console.error('错误详情:', authError.message, authError.code);
                // 继续尝试，因为可能已经有登录状态
            }

            // 获取数据库实例
            try {
                this.db = this.app.database();
                this.collection = this.db.collection('batches');
                this.isInitialized = true;
                console.log('CloudBase 服务准备就绪');
            } catch (dbError) {
                console.error('数据库初始化失败:', dbError);
                throw dbError;
            }
        } catch (error) {
            console.error('CloudBase 初始化失败:', error);
            console.error('错误详情:', error.message, error.code, error.stack);
            
            // 显示用户友好的错误信息
            if (error.message && error.message.includes('CORS')) {
                alert('跨域访问被阻止。请尝试以下解决方案：\n1. 使用 Edge 浏览器访问\n2. 在 Chrome 地址栏输入 chrome://flags/#same-site-by-default-cookies 并禁用该选项\n3. 检查 CloudBase 控制台的安全域名设置');
            }
            
            throw error;
        }
    }

    /**
     * 保存批次数据到云端
     */
    async saveBatch(batchData, fileName) {
        await this.init();
        console.log('开始保存数据到云端:', fileName, '数据条数:', batchData.length);

        try {
            const docData = {
                name: fileName,
                data: batchData,
                count: batchData.length,
                createTime: new Date()
            };
            console.log('准备保存的数据:', docData);
            
            const result = await this.collection.add(docData);
            console.log('保存成功，返回结果:', result);

            return {
                id: result.id,
                name: fileName,
                count: batchData.length,
                data: batchData
            };
        } catch (error) {
            console.error('保存到云端失败:', error);
            console.error('错误详情:', error.message, error.code);
            throw error;
        }
    }

    /**
     * 从云端获取所有批次
     */
    async getAllBatches() {
        await this.init();
        console.log('开始查询数据库...');

        try {
            const result = await this.collection
                .orderBy('createTime', 'desc')
                .get();
            
            console.log('数据库查询结果:', result);
            
            const data = result.data || [];
            console.log('获取到数据条数:', data.length);

            return data.map(item => ({
                id: item._id,
                name: item.name,
                count: item.count,
                data: item.data,
                createTime: item.createTime
            }));
        } catch (error) {
            console.error('从云端获取数据失败:', error);
            console.error('错误详情:', error.message, error.code);
            // 返回空数组而不是抛出错误
            return [];
        }
    }

    /**
     * 从云端删除批次
     */
    async deleteBatch(batchId) {
        await this.init();

        try {
            await this.collection.doc(batchId).remove();
            return true;
        } catch (error) {
            console.error('从云端删除失败:', error);
            throw error;
        }
    }
}

// 全局实例
var cloudBaseService = new CloudBaseService();

// 同时挂载到 window 对象，确保兼容性
if (typeof window !== 'undefined') {
    window.cloudBaseService = cloudBaseService;
}
