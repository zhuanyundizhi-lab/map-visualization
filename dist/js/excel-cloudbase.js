/**
 * Excel 导入导出模块 - CloudBase 版本
 * 本地操作和数据库操作分离
 */

class ExcelManager {
    constructor() {
        this.selectedBatches = new Set();
        this.isLoading = false;
        this.importedKeys = new Set(); // 用于本地查重
        this.cloudBatches = []; // 云端批次列表
        
        // 等待 DOM 加载完成后再绑定事件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded 触发，开始绑定事件');
                this.bindEvents();
            });
        } else {
            // DOM 已经加载完成
            console.log('DOM 已加载，立即绑定事件');
            this.bindEvents();
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        console.log('========================================');
        console.log('开始绑定事件...');
        console.log('当前时间:', new Date().toLocaleString());
        console.log('document.readyState:', document.readyState);
        
        // 本地文件导入
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleLocalFileImport(e));
            console.log('✓ 已绑定: 文件导入 (fileInput)');
        } else {
            console.error('✗ 未找到: fileInput');
        }

        // 本地导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLocalData());
            console.log('✓ 已绑定: 导出按钮 (exportBtn)');
        } else {
            console.error('✗ 未找到: exportBtn');
        }

        // 本地批次全选
        const selectAllBatches = document.getElementById('selectAllBatches');
        if (selectAllBatches) {
            selectAllBatches.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
            console.log('✓ 已绑定: 全选复选框 (selectAllBatches)');
        } else {
            console.error('✗ 未找到: selectAllBatches');
        }

        // 从数据库导入按钮 - 使用 onclick 属性确保兼容性
        const importFromDbBtn = document.getElementById('importFromDbBtn');
        if (importFromDbBtn) {
            console.log('找到 importFromDbBtn 按钮:', importFromDbBtn);
            console.log('按钮当前 onclick:', importFromDbBtn.onclick);
            
            // 使用 onclick 属性绑定，确保在所有浏览器中都能工作
            importFromDbBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('========================================');
                console.log('【点击事件触发】从数据库导入按钮被点击');
                console.log('点击时间:', new Date().toLocaleString());
                this.importFromDatabase();
                return false;
            };
            console.log('✓ 已绑定: 从数据库导入按钮 (importFromDbBtn)');
        } else {
            console.error('✗ 未找到: importFromDbBtn');
            // 尝试通过其他方式查找
            const buttons = document.querySelectorAll('button');
            console.log('页面中所有按钮:', Array.from(buttons).map(b => ({ id: b.id, text: b.textContent.trim() })));
        }

        // 上传到数据库按钮 - 使用 onclick 属性确保兼容性
        const uploadToDbBtn = document.getElementById('uploadToDbBtn');
        if (uploadToDbBtn) {
            console.log('找到 uploadToDbBtn 按钮:', uploadToDbBtn);
            
            // 使用 onclick 属性绑定，确保在所有浏览器中都能工作
            uploadToDbBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('========================================');
                console.log('【点击事件触发】上传到数据库按钮被点击');
                console.log('点击时间:', new Date().toLocaleString());
                this.uploadToDatabase();
                return false;
            };
            console.log('✓ 已绑定: 上传到数据库按钮 (uploadToDbBtn)');
        } else {
            console.error('✗ 未找到: uploadToDbBtn');
        }
        
        console.log('事件绑定完成');
        console.log('========================================');
    }

    /**
     * 处理本地文件导入（不操作数据库）
     */
    async handleLocalFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('请选择 Excel 文件 (.xlsx 或 .xls)');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    alert('文件中没有数据');
                    return;
                }

                const firstRow = jsonData[0];
                const hasLongitude = '经度' in firstRow || 'longitude' in firstRow || 'lng' in firstRow;
                const hasLatitude = '纬度' in firstRow || 'latitude' in firstRow || 'lat' in firstRow;

                if (!hasLongitude || !hasLatitude) {
                    alert('文件缺少经纬度字段，请确保包含"经度"和"纬度"列');
                    return;
                }

                // 本地查重处理
                const uniqueData = [];
                let duplicateCount = 0;

                jsonData.forEach(item => {
                    const stationId = item['基站号'] || item.stationId || '';
                    const time = item['发生时间'] || item.time || '';
                    const longitude = item['经度'] || item.longitude || item.lng || '';
                    const latitude = item['纬度'] || item.latitude || item.lat || '';
                    const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;

                    if (!this.importedKeys.has(uniqueKey)) {
                        this.importedKeys.add(uniqueKey);
                        uniqueData.push(item);
                    } else {
                        duplicateCount++;
                    }
                });

                // 生成本地批次ID
                const batchId = 'local_' + Date.now();
                const batch = {
                    id: batchId,
                    name: file.name,
                    count: uniqueData.length,
                    data: uniqueData
                };

                // 添加到本地数据管理器
                dataManager.addBatchFromCloud(batch);
                this.selectedBatches.add(batchId);
                
                // 更新地图
                mapManager.update(dataManager.filteredData);

                // 显示导入结果
                let msg = `成功导入本地批次 "${file.name}"\n新增 ${uniqueData.length} 条数据`;
                if (duplicateCount > 0) {
                    msg += `\n(已过滤 ${duplicateCount} 条重复数据)`;
                }
                msg += `\n当前本地数据: ${dataManager.rawData.length} 条`;
                alert(msg);
                
                // 更新本地批次列表
                this.updateBatchList();
                
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
        };
        
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    }

    /**
     * 导出本地数据（不操作数据库）
     */
    exportLocalData() {
        const data = dataManager.exportData();
        
        if (data.length === 0) {
            alert('没有本地数据可导出');
            return;
        }

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            
            const colWidths = [
                { wch: 12 }, { wch: 40 }, { wch: 30 }, { wch: 20 },
                { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
            ];
            worksheet['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(workbook, worksheet, '数据导出');
            
            const now = new Date();
            const timestamp = now.getFullYear() + 
                String(now.getMonth() + 1).padStart(2, '0') + 
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') + 
                String(now.getMinutes()).padStart(2, '0');
            const filename = `本地数据导出_${timestamp}.xlsx`;
            
            XLSX.writeFile(workbook, filename);
            alert(`成功导出 ${data.length} 条本地数据`);
            
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }

    /**
     * 从数据库导入（带查重）
     */
    async importFromDatabase() {
        console.log('========================================');
        console.log('【importFromDatabase】方法被调用');
        console.log('cloudBaseService 状态:', cloudBaseService ? '已定义' : '未定义');
        
        try {
            this.isLoading = true;
            console.log('正在从云端数据库读取数据...');
            
            const batches = await cloudBaseService.getAllBatches();
            this.cloudBatches = batches;
            
            // 更新云端批次列表显示
            this.updateCloudBatchList();
            
            // 查重并导入到本地
            let importedCount = 0;
            let duplicateCount = 0;
            
            batches.forEach(batch => {
                // 检查这个批次是否已经导入过（通过批次ID）
                const existingBatch = dataManager.batches.find(b => b.id === batch.id);
                if (existingBatch) {
                    console.log(`批次 "${batch.name}" 已存在，跳过`);
                    return;
                }
                
                // 检查批次内的数据是否有重复
                const uniqueData = [];
                batch.data.forEach(item => {
                    const stationId = item['基站号'] || item.stationId || '';
                    const time = item['发生时间'] || item.time || '';
                    const longitude = item['经度'] || item.longitude || item.lng || '';
                    const latitude = item['纬度'] || item.latitude || item.lat || '';
                    const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;

                    if (!this.importedKeys.has(uniqueKey)) {
                        this.importedKeys.add(uniqueKey);
                        uniqueData.push(item);
                    } else {
                        duplicateCount++;
                    }
                });
                
                if (uniqueData.length > 0) {
                    // 创建新的批次对象，只包含不重复的数据
                    const newBatch = {
                        id: batch.id,
                        name: batch.name,
                        count: uniqueData.length,
                        data: uniqueData
                    };
                    dataManager.addBatchFromCloud(newBatch);
                    this.selectedBatches.add(batch.id);
                    importedCount += uniqueData.length;
                }
            });
            
            // 更新地图
            mapManager.update(dataManager.filteredData);
            
            // 更新本地批次列表
            this.updateBatchList();
            
            let msg = `从数据库导入完成\n成功导入 ${importedCount} 条新数据`;
            if (duplicateCount > 0) {
                msg += `\n(已过滤 ${duplicateCount} 条重复数据)`;
            }
            msg += `\n当前本地总数据: ${dataManager.rawData.length} 条`;
            alert(msg);
            
            console.log(`从数据库导入了 ${importedCount} 条数据，过滤 ${duplicateCount} 条重复数据`);
        } catch (error) {
            console.error('从数据库导入失败:', error);
            console.error('错误详情:', error.message, error.code, error.stack);
            
            let errorMsg = '从数据库导入失败: ' + error.message;
            if (error.message && error.message.includes('permission')) {
                errorMsg += '\n\n可能是权限问题，请检查 CloudBase 数据库权限设置';
            } else if (error.message && error.message.includes('network')) {
                errorMsg += '\n\n网络连接问题，请检查网络';
            } else if (error.message && error.message.includes('CORS')) {
                errorMsg += '\n\n跨域问题，请尝试使用 Edge 浏览器或检查 CloudBase 安全域名设置';
            }
            
            alert(errorMsg);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 上传本地批次到数据库（使用云函数，带服务端查重）
     */
    async uploadToDatabase() {
        console.log('========================================');
        console.log('【uploadToDatabase】方法被调用');
        console.log('cloudFunctionService 状态:', typeof cloudFunctionService !== 'undefined' ? '已定义' : '未定义');
        console.log('dataManager 状态:', typeof dataManager !== 'undefined' ? '已定义' : '未定义');

        const localBatches = dataManager.getBatches().filter(b => b.id.startsWith('local_'));
        console.log('本地批次数量:', localBatches.length);

        if (localBatches.length === 0) {
            alert('没有本地批次需要上传');
            return;
        }

        // 检查是否支持云函数
        const useCloudFunction = typeof cloudFunctionService !== 'undefined';

        if (useCloudFunction) {
            // 使用云函数上传（服务端查重）
            await this.uploadWithCloudFunction(localBatches);
        } else {
            // 使用客户端上传（客户端查重）
            await this.uploadWithClientDeduplication(localBatches);
        }
    }

    /**
     * 使用云函数上传（服务端查重）
     */
    async uploadWithCloudFunction(localBatches) {
        try {
            console.log('使用云函数上传...');

            let totalUploaded = 0;
            let totalDuplicate = 0;
            const results = [];

            for (const batch of localBatches) {
                console.log(`正在上传批次 "${batch.name}"...`);

                if (!batch.data || !Array.isArray(batch.data)) {
                    console.error(`批次 "${batch.name}" 的数据格式不正确`);
                    continue;
                }

                // 调用云函数上传
                const result = await cloudFunctionService.uploadDataWithDeduplication(
                    batch.data,
                    batch.name
                );

                results.push({
                    batchName: batch.name,
                    ...result
                });

                totalUploaded += result.uploadedCount;
                totalDuplicate += result.duplicateCount;

                console.log(`批次 "${batch.name}" 上传结果:`, result);
            }

            // 显示结果
            let msg = `上传完成\n成功上传 ${totalUploaded} 条新数据`;
            if (totalDuplicate > 0) {
                msg += `\n(服务端已过滤 ${totalDuplicate} 条重复数据)`;
            }
            alert(msg);

            // 刷新云端批次列表
            this.cloudBatches = await cloudBaseService.getAllBatches();
            this.updateCloudBatchList();

        } catch (error) {
            console.error('云函数上传失败:', error);
            alert('上传失败: ' + error.message + '\n\n将尝试使用客户端查重上传...');
            // 降级到客户端查重
            await this.uploadWithClientDeduplication(localBatches);
        }
    }

    /**
     * 使用客户端查重上传（备用方案）
     */
    async uploadWithClientDeduplication(localBatches) {
        try {
            console.log('使用客户端查重上传...');

            // 先获取云端所有数据用于查重
            console.log('正在获取云端数据用于查重...');
            const cloudBatches = await cloudBaseService.getAllBatches();

            // 构建云端数据的查重集合
            const cloudKeys = new Set();
            cloudBatches.forEach(batch => {
                if (batch.data && Array.isArray(batch.data)) {
                    batch.data.forEach(item => {
                        const stationId = item['基站号'] || item.stationId || '';
                        const time = item['发生时间'] || item.time || '';
                        const longitude = item['经度'] || item.longitude || item.lng || '';
                        const latitude = item['纬度'] || item.latitude || item.lat || '';
                        const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;
                        cloudKeys.add(uniqueKey);
                    });
                }
            });

            console.log(`云端已有 ${cloudBatches.length} 个批次，${cloudKeys.size} 条数据用于查重`);

            let uploadedCount = 0;
            let duplicateCount = 0;

            for (const batch of localBatches) {
                console.log(`正在处理批次 "${batch.name}"...`);

                if (!batch.data || !Array.isArray(batch.data)) {
                    console.error(`批次 "${batch.name}" 的数据格式不正确`);
                    continue;
                }

                // 查重：过滤掉云端已存在的数据
                const uniqueData = [];
                batch.data.forEach(item => {
                    const stationId = item['基站号'] || item.stationId || '';
                    const time = item['发生时间'] || item.time || '';
                    const longitude = item['经度'] || item.longitude || item.lng || '';
                    const latitude = item['纬度'] || item.latitude || item.lat || '';
                    const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;

                    if (!cloudKeys.has(uniqueKey)) {
                        uniqueData.push(item);
                        cloudKeys.add(uniqueKey);
                    } else {
                        duplicateCount++;
                    }
                });

                if (uniqueData.length === 0) {
                    console.log(`批次 "${batch.name}" 的所有数据都已存在于云端，跳过`);
                    continue;
                }

                console.log(`批次 "${batch.name}" 有 ${uniqueData.length} 条新数据需要上传`);

                // 上传不重复的数据
                const result = await cloudBaseService.saveBatch(uniqueData, batch.name);
                console.log(`批次 "${batch.name}" 上传成功，ID: ${result.id}`);
                uploadedCount++;
            }

            let msg = `上传完成\n成功上传 ${uploadedCount} 个批次到数据库`;
            if (duplicateCount > 0) {
                msg += `\n(已过滤 ${duplicateCount} 条重复数据)`;
            }
            alert(msg);

            // 刷新云端批次列表
            this.cloudBatches = await cloudBaseService.getAllBatches();
            this.updateCloudBatchList();

        } catch (error) {
            console.error('上传到数据库失败:', error);
            console.error('错误详情:', error.message, error.code, error.stack);

            let errorMsg = '上传到数据库失败: ' + error.message;
            if (error.message && error.message.includes('permission')) {
                errorMsg += '\n\n可能是权限问题，请检查 CloudBase 数据库权限设置';
            } else if (error.message && error.message.includes('network')) {
                errorMsg += '\n\n网络连接问题，请检查网络';
            } else if (error.message && error.message.includes('CORS')) {
                errorMsg += '\n\n跨域问题，请尝试使用 Edge 浏览器或检查 CloudBase 安全域名设置';
            }

            alert(errorMsg);
        }
    }

    /**
     * 更新本地批次列表显示
     */
    updateBatchList() {
        const batchListEl = document.getElementById('batchList');
        if (!batchListEl) return;

        const batches = dataManager.getBatches();

        if (batches.length === 0) {
            batchListEl.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">暂无本地批次</p>';
            return;
        }

        batchListEl.innerHTML = batches.map(batch => `
            <div class="batch-item ${this.selectedBatches.has(batch.id) ? 'selected' : ''}" data-batch-id="${batch.id}">
                <input type="checkbox" 
                       class="batch-checkbox" 
                       data-batch-id="${batch.id}" 
                       ${this.selectedBatches.has(batch.id) ? 'checked' : ''}
                       onchange="excelManager.toggleBatchSelection('${batch.id}', this.checked)">
                <div class="batch-info">
                    <span class="batch-name">${batch.name}</span>
                    <span class="batch-count">${batch.count} 条</span>
                </div>
                <button class="btn-batch-delete" onclick="event.stopPropagation(); excelManager.deleteLocalBatch('${batch.id}')" title="删除此批次">×</button>
            </div>
        `).join('');

        this.updateSelectAllCheckbox();
    }

    /**
     * 更新云端批次列表显示
     */
    updateCloudBatchList() {
        const cloudBatchListEl = document.getElementById('cloudBatchList');
        const cloudBatchCountEl = document.getElementById('cloudBatchCount');
        if (!cloudBatchListEl) return;

        if (cloudBatchCountEl) {
            cloudBatchCountEl.textContent = `(${this.cloudBatches.length})`;
        }

        if (this.cloudBatches.length === 0) {
            cloudBatchListEl.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">云端暂无批次</p>';
            return;
        }

        cloudBatchListEl.innerHTML = this.cloudBatches.map(batch => {
            // 检查是否已导入到本地
            const isImported = dataManager.batches.some(b => b.id === batch.id);
            return `
                <div class="batch-item ${isImported ? 'selected' : ''}" data-cloud-batch-id="${batch.id}">
                    <div class="batch-info">
                        <span class="batch-name">${batch.name}</span>
                        <span class="batch-count">${batch.count} 条 ${isImported ? '(已导入)' : ''}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 切换批次选择状态
     */
    toggleBatchSelection(batchId, isSelected) {
        if (isSelected) {
            this.selectedBatches.add(batchId);
        } else {
            this.selectedBatches.delete(batchId);
        }

        const batchItem = document.querySelector(`.batch-item[data-batch-id="${batchId}"]`);
        if (batchItem) {
            batchItem.classList.toggle('selected', isSelected);
        }

        this.updateSelectAllCheckbox();
        this.applyBatchFilter();
    }

    /**
     * 更新全选复选框状态
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllBatches');
        if (!selectAllCheckbox) return;

        const batches = dataManager.getBatches();
        if (batches.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            return;
        }

        const selectedCount = this.selectedBatches.size;
        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === batches.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * 全选/取消全选所有批次
     */
    toggleSelectAll(isSelected) {
        const batches = dataManager.getBatches();

        if (isSelected) {
            batches.forEach(batch => this.selectedBatches.add(batch.id));
        } else {
            this.selectedBatches.clear();
        }

        this.updateBatchList();
        this.applyBatchFilter();
    }

    /**
     * 应用批次筛选
     */
    applyBatchFilter() {
        const selectedBatchIds = Array.from(this.selectedBatches);

        const filteredData = dataManager.applyFilters({
            batchIds: selectedBatchIds
        });

        if (typeof mapManager !== 'undefined') {
            mapManager.update(filteredData);
        }

        console.log('批次筛选应用:', selectedBatchIds, '筛选结果:', filteredData.length, '条数据');
    }

    /**
     * 删除本地批次
     */
    deleteLocalBatch(batchId) {
        const batches = dataManager.getBatches();
        const batch = batches.find(b => b.id === batchId);
        if (!batch) return;

        if (confirm(`确定要删除本地批次 "${batch.name}" 吗？\n该批次包含 ${batch.count} 条数据，此操作不可恢复。`)) {
            // 获取批次数据用于清除 importedKeys
            const result = dataManager.removeBatch(batchId);
            const batchData = result.data;
            
            // 从 importedKeys 中清除
            batchData.forEach(item => {
                const stationId = item['基站号'] || item.stationId || '';
                const time = item['发生时间'] || item.time || '';
                const longitude = item['经度'] || item.longitude || item.lng || '';
                const latitude = item['纬度'] || item.latitude || item.lat || '';
                const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;
                this.importedKeys.delete(uniqueKey);
            });
            
            this.selectedBatches.delete(batchId);

            if (typeof mapManager !== 'undefined') {
                mapManager.update(dataManager.filteredData);
            }

            this.updateBatchList();

            alert(`已删除本地批次 "${batch.name}"，共 ${result.count} 条数据\n当前本地剩余数据: ${dataManager.rawData.length} 条`);
        }
    }
}

// 创建全局 Excel 管理器实例
var excelManager = new ExcelManager();

// 同时挂载到 window 对象，确保兼容性
if (typeof window !== 'undefined') {
    window.excelManager = excelManager;
    console.log('excelManager 已挂载到 window 对象');
}
