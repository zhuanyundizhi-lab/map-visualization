/**
 * Excel 导入导出模块
 */

class ExcelManager {
    constructor() {
        this.bindEvents();
        this.importedKeys = new Set(); // 记录已导入的数据标识，用于去重
        this.selectedBatches = new Set(); // 记录选中的批次
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

        // 清空数据按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
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
    handleFileImport(event) {
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
        
        reader.onload = (e) => {
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

                // 去重处理 - 以"基站号+时间+经纬度"作为唯一标识
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

                // 添加为新批次（叠加模式）
                const result = dataManager.addBatch(uniqueData, file.name);

                // 自动选中新导入的批次
                this.selectedBatches.add(result.batchId);

                // 更新地图
                mapManager.update(dataManager.filteredData);

                // 显示导入结果
                let msg = `成功导入批次 "${file.name}"\n新增 ${result.count} 条数据`;
                if (duplicateCount > 0) {
                    msg += `\n(已过滤 ${duplicateCount} 条重复数据)`;
                }
                msg += `\n当前总数据: ${dataManager.rawData.length} 条`;
                alert(msg);

                // 更新批次列表显示
                this.updateBatchList();
                
                console.log('导入数据:', jsonData);
                
            } catch (error) {
                console.error('导入失败:', error);
                alert('文件解析失败: ' + error.message);
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
     * 将当前数据保存为示例数据（JSON格式）
     */
    saveAsSample() {
        const data = dataManager.rawData;
        if (data.length === 0) return;

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                       onchange="excelManager.toggleBatchSelection(${batch.id}, this.checked)">
                <div class="batch-info">
                    <span class="batch-name">${batch.name}</span>
                    <span class="batch-count">${batch.count} 条</span>
                </div>
                <button class="btn-batch-delete" onclick="event.stopPropagation(); excelManager.deleteBatch(${batch.id})" title="删除此批次">×</button>
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
        const selectedBatchIds = Array.from(this.selectedBatches).map(String);

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
    deleteBatch(batchId) {
        const batches = dataManager.getBatches();
        const batch = batches.find(b => b.id === batchId);
        if (!batch) return;

        if (confirm(`确定要删除批次 "${batch.name}" 吗？\n该批次包含 ${batch.count} 条数据，此操作不可恢复。`)) {
            const result = dataManager.removeBatch(batchId);
            const removedCount = result.count;
            const batchData = result.data;

            // 从importedKeys中清除该批次的数据标识，允许重新导入
            batchData.forEach(item => {
                const stationId = item['基站号'] || item.stationId || '';
                const time = item['发生时间'] || item.time || '';
                const longitude = item['经度'] || item.longitude || item.lng || '';
                const latitude = item['纬度'] || item.latitude || item.lat || '';
                const uniqueKey = `${stationId}_${time}_${longitude}_${latitude}`;
                this.importedKeys.delete(uniqueKey);
            });

            // 从选中集合中移除
            this.selectedBatches.delete(batchId);

            // 更新地图显示
            if (typeof mapManager !== 'undefined') {
                mapManager.update(dataManager.filteredData);
            }

            // 更新批次列表
            this.updateBatchList();

            alert(`已删除批次 "${batch.name}"，共 ${removedCount} 条数据\n当前剩余数据: ${dataManager.rawData.length} 条`);
        }
    }

    /**
     * 清空所有数据
     */
    clearData() {
        if (dataManager.rawData.length === 0) {
            alert('当前没有数据');
            return;
        }

        if (confirm(`确定要清空所有数据吗？\n当前共有 ${dataManager.rawData.length} 条数据，此操作不可恢复。`)) {
            // 清空数据管理器
            dataManager.clearData();
            
            // 清空导入记录（去重用的key）
            this.importedKeys.clear();
            
            // 更新地图显示
            if (typeof mapManager !== 'undefined') {
                mapManager.update([]);
            }
            
            // 重置筛选UI
            document.getElementById('districtFilter').innerHTML = '<option value="">全部区县</option>';
            document.getElementById('alarmFilter').innerHTML = '<option value="">全部告警</option>';
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            document.getElementById('repeatFilter').value = 0;
            document.getElementById('repeatValue').textContent = '0';
            
            // 更新批次列表
            this.updateBatchList();

            alert('数据已清空');
            console.log('数据已清空');
        }
    }
}

// 创建全局 Excel 管理器实例
const excelManager = new ExcelManager();
