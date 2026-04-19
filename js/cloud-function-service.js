/**
 * 云函数调用服务
 * 封装腾讯云 CloudBase 云函数调用
 */

class CloudFunctionService {
    constructor() {
        this.app = null;
        this.isInitialized = false;
    }

    /**
     * 初始化
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // 等待 CloudBase SDK 加载
            await this.waitForCloudBase();

            // 初始化
            this.app = cloudbase.init({
                env: 'map-visualization-001-d6cda2aa5a',
                region: 'ap-shanghai'
            });

            // 匿名登录
            const auth = this.app.auth();
            await auth.signInAnonymously();

            this.isInitialized = true;
            console.log('云函数服务初始化成功');
        } catch (error) {
            console.error('云函数服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 等待 CloudBase SDK 加载
     */
    waitForCloudBase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;

            const check = () => {
                attempts++;
                if (typeof cloudbase !== 'undefined') {
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

    /**
     * 调用云函数上传数据（带查重）
     * @param {Array} batchData - 批次数据
     * @param {String} fileName - 文件名
     */
    async uploadDataWithDeduplication(batchData, fileName) {
        await this.init();

        console.log('调用云函数上传数据:', fileName, '数据条数:', batchData.length);

        try {
            const result = await this.app.callFunction({
                name: 'uploadData',
                data: {
                    batchData: batchData,
                    fileName: fileName
                }
            });

            console.log('云函数返回结果:', result);

            if (result.result && result.result.success) {
                return {
                    success: true,
                    uploadedCount: result.result.uploadedCount,
                    duplicateCount: result.result.duplicateCount,
                    batchId: result.result.batchId,
                    message: result.result.message
                };
            } else {
                throw new Error(result.result?.message || '上传失败');
            }
        } catch (error) {
            console.error('调用云函数失败:', error);
            throw error;
        }
    }

    /**
     * 批量上传多个批次
     * @param {Array} batches - 批次数组
     */
    async uploadBatches(batches) {
        const results = [];
        let totalUploaded = 0;
        let totalDuplicate = 0;

        for (const batch of batches) {
            try {
                const result = await this.uploadDataWithDeduplication(
                    batch.data,
                    batch.name
                );
                results.push({
                    batchName: batch.name,
                    ...result
                });
                totalUploaded += result.uploadedCount;
                totalDuplicate += result.duplicateCount;
            } catch (error) {
                results.push({
                    batchName: batch.name,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            results: results,
            totalUploaded: totalUploaded,
            totalDuplicate: totalDuplicate
        };
    }
}

// 创建全局实例
var cloudFunctionService = new CloudFunctionService();
if (typeof window !== 'undefined') {
    window.cloudFunctionService = cloudFunctionService;
}
