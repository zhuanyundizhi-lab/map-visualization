/**
 * 云函数：处理数据上传，自动查重
 * 部署到腾讯云 CloudBase 云函数
 */

const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 使用管理员权限访问数据库
const db = cloud.database();
const _ = db.command;

/**
 * 生成数据的唯一标识
 * @param {Object} item - 数据项
 * @returns {String} - 唯一键
 */
function generateUniqueKey(item) {
  const stationId = item['基站号'] || item.stationId || '';
  const time = item['发生时间'] || item.time || '';
  const longitude = item['经度'] || item.longitude || item.lng || '';
  const latitude = item['纬度'] || item.latitude || item.lat || '';
  return `${stationId}_${time}_${longitude}_${latitude}`;
}

/**
 * 主函数
 */
exports.main = async (event, context) => {
  const { batchData, fileName } = event;
  
  console.log('收到上传请求:', fileName, '数据条数:', batchData ? batchData.length : 0);
  
  // 参数校验
  if (!batchData || !Array.isArray(batchData)) {
    return {
      success: false,
      message: '数据格式错误：batchData 必须是数组'
    };
  }
  
  if (!fileName) {
    return {
      success: false,
      message: '参数错误：fileName 不能为空'
    };
  }
  
  try {
    // 1. 获取云端所有现有数据
    const existingBatches = await db.collection('batches').get();
    const existingData = existingBatches.data || [];
    
    // 2. 构建云端数据的查重集合
    const cloudKeys = new Set();
    existingData.forEach(batch => {
      if (batch.data && Array.isArray(batch.data)) {
        batch.data.forEach(item => {
          cloudKeys.add(generateUniqueKey(item));
        });
      }
    });
    
    console.log('云端已有数据条数:', cloudKeys.size);
    
    // 3. 过滤重复数据
    const uniqueData = [];
    const duplicateKeys = [];
    
    batchData.forEach(item => {
      const key = generateUniqueKey(item);
      if (!cloudKeys.has(key)) {
        uniqueData.push(item);
        cloudKeys.add(key); // 防止同一批上传中有重复
      } else {
        duplicateKeys.push(key);
      }
    });
    
    console.log('新数据条数:', uniqueData.length, '重复条数:', duplicateKeys.length);
    
    // 4. 如果没有新数据，直接返回
    if (uniqueData.length === 0) {
      return {
        success: true,
        message: '所有数据都已存在于云端',
        uploadedCount: 0,
        duplicateCount: duplicateKeys.length,
        batchId: null
      };
    }
    
    // 5. 保存到云端
    const result = await db.collection('batches').add({
      data: {
        name: fileName,
        data: uniqueData,
        count: uniqueData.length,
        createTime: db.serverDate(),
        originalCount: batchData.length,
        duplicateCount: duplicateKeys.length
      }
    });
    
    console.log('保存成功，ID:', result._id);
    
    return {
      success: true,
      message: '上传成功',
      uploadedCount: uniqueData.length,
      duplicateCount: duplicateKeys.length,
      batchId: result._id
    };
    
  } catch (error) {
    console.error('上传失败:', error);
    return {
      success: false,
      message: error.message || '上传失败',
      error: error.toString()
    };
  }
};
