/**
 * Excel 导入导出模块 - CloudBase 版本
 */

class ExcelManager {
    constructor() {
        this.bindEvents();
        this.selectedBatches = new Set();
        this.isLoading = false;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 文件导入
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // 全选批次复选框
        const selectAllBatches = document.getElementById('selectAllBatches');
        if (selectAllBatches) {
            selectAllBatches.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
    }

    /**
     * 处理文件导入
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
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
                
                // 读取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为 JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    alert('文件中没有数据');
                    return;
                }

                // 检查必要的字段
                const firstRow = jsonData[0];
                const hasLongitude = '经度' in firstRow || 'longitude' in firstRow || 'lng' in firstRow;
                const hasLatitude = '纬度' in firstRow || 'latitude' in firstRow || 'lat' in firstRow;

                if (!hasLongitude || !hasLatitude) {
                    alert('文件缺少经纬度字段，请确保包含"经度"和"纬度"列');
                    return;
                }

                // 保存到云端
                const result = await cloudBaseService.saveBatch(jsonData, file.name);
                
                // 添加到本地数据管理器
                dataManager.addBatchFromCloud(result);
                
                // 自动选中新导入的批次
                this.selectedBatches.add(result.id);
                
                // 更新地图
                mapManager.update(dataManager.filteredData);

                // 显示导入结果
                alert(`成功导入批次 "${file.name}"\n新增 ${result.count} 条数据\n当前总数据: ${dataManager.rawData.length} 条`);
                
                // 更新批次列表显示
                this.updateBatchList();
                
                console.log('导入数据:', jsonData);
                
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
        };
        
        reader.readAsArrayBuffer(file);
        
        // 清空 input，允许重复选择同一文件
        event.target.value = '';
    }

    /**
     * 导出数据
     */
    exportData() {
        const data = dataManager.exportData();
        
        if (data.length === 0) {
            alert('没有数据可导出');
            return;
        }

        try {
            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            
            // 创建工作表
            const worksheet = XLSX.utils.json_to_sheet(data);
            
            // 设置列宽
            const colWidths = [
                { wch: 12 },  // 基站号
                { wch: 40 },  // BBU名称
                { wch: 30 },  // 告警名称
                { wch: 20 },  // 发生时间
                { wch: 30 },  // 机房名称
                { wch: 30 },  // 所属站点
                { wch: 15 },  // 所属区县
                { wch: 12 },  // 经度
                { wch: 12 }   // 纬度
            ];
            worksheet['!cols'] = colWidths;
            
            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, '数据导出');
            
            // 生成文件名
            const now = new Date();
            const timestamp = now.getFullYear() + 
                String(now.getMonth() + 1).padStart(2, '0') + 
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') + 
                String(now.getMinutes()).padStart(2, '0');
            const filename = `地图数据导出_${timestamp}.xlsx`;
            
            // 下载文件
            XLSX.writeFile(workbook, filename);
            
            alert(`成功导出 ${data.length} 条数据`);
            
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }

    /**
     * 更新批次列表显示
     */
    updateBatchList() {
        const batchListEl = document.getElementById('batchList');
        if (!batchListEl) return;

        const batches = dataManager.getBatches();

        if (batches.length === 0) {
            batchListEl.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">暂无导入的批次</p>';
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
                <button class="btn-batch-delete" onclick="event.stopPropagation(); excelManager.deleteBatch('${batch.id}')" title="删除此批次">×</button>
            </div>
        `).join('');

        // 更新全选复选框状态
        this.updateSelectAllCheckbox();
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

        // 更新UI
        const batchItem = document.querySelector(`.batch-item[data-batch-id="${batchId}"]`);
        if (batchItem) {
            batchItem.classList.toggle('selected', isSelected);
        }

        // 更新全选复选框状态
        this.updateSelectAllCheckbox();

        // 应用筛选
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

        // 更新UI
        this.updateBatchList();

        // 应用筛选
        this.applyBatchFilter();
    }

    /**
     * 应用批次筛选
     */
    applyBatchFilter() {
        const selectedBatchIds = Array.from(this.selectedBatches);

        // 应用筛选
        const filteredData = dataManager.applyFilters({
            batchIds: selectedBatchIds
        });

        // 更新地图
        if (typeof mapManager !== 'undefined') {
            mapManager.update(filteredData);
        }

        console.log('批次筛选应用:', selectedBatchIds, '筛选结果:', filteredData.length, '条数据');
    }

    /**
     * 删除指定批次
     */
    async deleteBatch(batchId) {
        const batches = dataManager.getBatches();
        const batch = batches.find(b => b.id === batchId);
        if (!batch) return;

        if (confirm(`确定要删除批次 "${batch.name}" 吗？\n该批次包含 ${batch.count} 条数据，此操作不可恢复。`)) {
            try {
                // 从云端删除
                await cloudBaseService.deleteBatch(batchId);
                
                // 从本地数据管理器移除
                dataManager.removeBatch(batchId);
                
                // 从选中集合中移除
                this.selectedBatches.delete(batchId);

                // 更新地图显示
                if (typeof mapManager !== 'undefined') {
                    mapManager.update(dataManager.filteredData);
                }

                // 更新批次列表
                this.updateBatchList();

                alert(`已删除批次 "${batch.name}"，共 ${batch.count} 条数据\n当前剩余数据: ${dataManager.rawData.length} 条`);
            } catch (error) {
                console.error('删除失败:', error);
                alert('删除失败: ' + error.message);
            }
        }
    }

    /**
     * 页面加载时从云端加载数据
     */
    async loadFromCloud() {
        try {
            this.isLoading = true;
            console.log('正在从云端加载数据...');
            
            const batches = await cloudBaseService.getAllBatches();
            
            // 清空本地数据
            dataManager.clearData();
            
            // 加载所有批次
            batches.forEach(batch => {
                dataManager.addBatchFromCloud(batch);
                this.selectedBatches.add(batch.id);
            });
            
            // 更新UI
            this.updateBatchList();
            mapManager.update(dataManager.filteredData);
            
            console.log(`从云端加载了 ${batches.length} 个批次，共 ${dataManager.rawData.length} 条数据`);
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载云端数据失败: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }
}

// 创建全局 Excel 管理器实例
const excelManager = new ExcelManager();

// 页面加载完成后从云端加载数据
window.addEventListener('load', () => {
    // 延迟加载，确保其他组件已初始化
    setTimeout(() => {
        excelManager.loadFromCloud();
    }, 500);
});
