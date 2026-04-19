/**
 * 数据管理模块 - CloudBase 版本
 */

class DataManager {
    constructor() {
        this.rawData = [];      // 原始数据
        this.filteredData = []; // 筛选后的数据
        this.siteRepeatCount = {}; // 站点重复出现次数统计
        this.batches = [];      // 存储各批次数据
        this.filters = {
            districts: [],
            alarms: [],
            startDate: null,
            endDate: null,
            minRepeatCount: 0,  // 最小重复出现数
            batchIds: []  // 批次筛选
        };
    }

    /**
     * 从云端添加批次
     */
    addBatchFromCloud(batch) {
        const batchData = batch.data.map((item, index) => {
            // 获取原始 GPS 坐标
            const originalLng = parseFloat(item['经度'] || item.longitude || item.lng || 0);
            const originalLat = parseFloat(item['纬度'] || item.latitude || item.lat || 0);
            
            // 转换为高德坐标
            let gaodeLng = originalLng;
            let gaodeLat = originalLat;
            
            if (typeof coordTransform !== 'undefined' && 
                !isNaN(originalLng) && !isNaN(originalLat) && 
                originalLng !== 0 && originalLat !== 0) {
                const gaodeCoord = coordTransform.wgs84ToGcj02(originalLng, originalLat);
                gaodeLng = gaodeCoord.lng;
                gaodeLat = gaodeCoord.lat;
            }
            
            return {
                ...item,
                id: `${batch.id}_${index}`,
                batchId: batch.id,
                batchName: batch.name,
                // 保留原始 GPS 坐标（用于查重和导出）
                longitude: originalLng,
                latitude: originalLat,
                // 添加高德坐标（用于地图显示）
                gaodeLongitude: gaodeLng,
                gaodeLatitude: gaodeLat
            };
        }).filter(item => {
            // 过滤掉无效坐标
            return !isNaN(item.longitude) && !isNaN(item.latitude) && 
                   item.longitude !== 0 && item.latitude !== 0;
        });
        
        // 检查是否已存在
        const existingIndex = this.batches.findIndex(b => b.id === batch.id);
        if (existingIndex !== -1) {
            // 更新现有批次
            this.batches[existingIndex] = {
                id: batch.id,
                name: batch.name,
                count: batch.count,
                data: batchData
            };
            // 重新构建 rawData
            this.rebuildRawData();
        } else {
            // 添加新批次
            this.batches.push({
                id: batch.id,
                name: batch.name,
                count: batch.count,
                data: batchData
            });
            this.rawData = [...this.rawData, ...batchData];
        }
        
        // 统计站点重复出现次数
        this.calculateSiteRepeatCount();
        
        // 更新重复筛选器的最大值
        this.updateRepeatFilterMax();
        
        this.filteredData = [...this.rawData];
        this.updateFilterOptions();
        this.updateStats();
        
        // 更新时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.updateChart(this.filteredData);
        }
        
        return { batchId: batch.id, count: batch.count };
    }

    /**
     * 重新构建原始数据
     */
    rebuildRawData() {
        this.rawData = [];
        this.batches.forEach(batch => {
            this.rawData = [...this.rawData, ...batch.data];
        });
    }

    /**
     * 删除指定批次
     */
    removeBatch(batchId) {
        const batchIndex = this.batches.findIndex(b => b.id === batchId);
        if (batchIndex === -1) return false;

        // 从批次列表中移除
        const batch = this.batches.splice(batchIndex, 1)[0];

        // 获取该批次的数据
        const batchData = batch.data || [];

        // 重新构建 rawData
        this.rebuildRawData();

        // 重新统计
        this.calculateSiteRepeatCount();
        this.updateRepeatFilterMax();

        this.filteredData = [...this.rawData];
        this.updateFilterOptions();
        this.updateStats();

        // 更新时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.updateChart(this.filteredData);
        }

        // 返回批次信息和数据
        return {
            count: batch.count,
            data: batchData
        };
    }

    /**
     * 获取所有批次列表
     */
    getBatches() {
        return this.batches.map(b => ({
            id: b.id,
            name: b.name,
            count: b.count,
            data: b.data
        }));
    }

    /**
     * 计算站点重复出现次数
     */
    calculateSiteRepeatCount() {
        this.siteRepeatCount = {};
        this.rawData.forEach(item => {
            // 使用基站号作为站点唯一标识
            const siteId = item['基站号'] || item.stationId || item.id;
            if (siteId) {
                this.siteRepeatCount[siteId] = (this.siteRepeatCount[siteId] || 0) + 1;
            }
        });
        
        // 将重复次数添加到每个数据项
        this.rawData.forEach(item => {
            const siteId = item['基站号'] || item.stationId || item.id;
            item.repeatCount = this.siteRepeatCount[siteId] || 1;
        });
    }

    /**
     * 更新重复筛选器的最大值
     */
    updateRepeatFilterMax() {
        const repeatFilter = document.getElementById('repeatFilter');
        if (repeatFilter) {
            const maxCount = Math.max(...Object.values(this.siteRepeatCount), 10);
            repeatFilter.max = maxCount;
        }
    }

    /**
     * 获取所有区县列表
     */
    getDistricts() {
        const districts = new Set();
        this.rawData.forEach(item => {
            const district = item['所属区县'] || item.district;
            if (district) districts.add(district);
        });
        return Array.from(districts).sort();
    }

    /**
     * 获取所有告警类型列表
     */
    getAlarmTypes() {
        const alarms = new Set();
        this.rawData.forEach(item => {
            const alarm = item['告警名称'] || item.alarmName || item.alarm;
            if (alarm) alarms.add(alarm);
        });
        return Array.from(alarms).sort();
    }

    /**
     * 更新筛选选项
     */
    updateFilterOptions() {
        // 更新区县选择器
        const districtSelect = document.getElementById('districtFilter');
        if (districtSelect) {
            const districts = this.getDistricts();
            districtSelect.innerHTML = districts.map(d =>
                `<option value="${d}">${d}</option>`
            ).join('');
        }

        // 更新告警选择器
        const alarmSelect = document.getElementById('alarmFilter');
        if (alarmSelect) {
            const alarms = this.getAlarmTypes();
            alarmSelect.innerHTML = alarms.map(a =>
                `<option value="${a}">${a}</option>`
            ).join('');
        }

        // 更新批次计数显示
        const batchCountEl = document.getElementById('batchCount');
        if (batchCountEl) {
            const batches = this.getBatches();
            batchCountEl.textContent = `(${batches.length})`;
        }
    }

    /**
     * 应用筛选
     */
    applyFilters(filters) {
        this.filters = { ...this.filters, ...filters };

        this.filteredData = this.rawData.filter(item => {
            // 批次筛选
            if (this.filters.batchIds && this.filters.batchIds.length > 0) {
                if (!this.filters.batchIds.includes(String(item.batchId))) return false;
            }

            // 区县筛选
            if (this.filters.districts && this.filters.districts.length > 0) {
                const district = item['所属区县'] || item.district;
                if (!this.filters.districts.includes(district)) return false;
            }

            // 告警类型筛选
            if (this.filters.alarms && this.filters.alarms.length > 0) {
                const alarm = item['告警名称'] || item.alarmName || item.alarm;
                if (!this.filters.alarms.includes(alarm)) return false;
            }

            // 时间筛选
            if (this.filters.startDate || this.filters.endDate) {
                const timeStr = item['发生时间'] || item.time || item.date;
                if (timeStr) {
                    const itemDate = new Date(timeStr);
                    if (this.filters.startDate) {
                        const start = new Date(this.filters.startDate);
                        if (itemDate < start) return false;
                    }
                    if (this.filters.endDate) {
                        const end = new Date(this.filters.endDate);
                        end.setHours(23, 59, 59);
                        if (itemDate > end) return false;
                    }
                }
            }

            // 重复出现数筛选
            if (this.filters.minRepeatCount > 0) {
                const siteId = item['基站号'] || item.stationId || item.id;
                const repeatCount = this.siteRepeatCount[siteId] || 1;
                if (repeatCount <= this.filters.minRepeatCount) return false;
            }

            return true;
        });

        this.updateStats();
        return this.filteredData;
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        this.filters = {
            districts: [],
            alarms: [],
            startDate: null,
            endDate: null,
            minRepeatCount: 0,
            batchIds: []
        };
        this.filteredData = [...this.rawData];
        this.updateStats();

        // 重置UI
        document.getElementById('districtFilter').selectedIndex = -1;
        document.getElementById('alarmFilter').selectedIndex = -1;
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        return this.filteredData;
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const totalEl = document.getElementById('totalCount');
        const filteredEl = document.getElementById('filteredCount');
        
        if (totalEl) totalEl.textContent = `总数据: ${this.rawData.length}`;
        if (filteredEl) filteredEl.textContent = `筛选后: ${this.filteredData.length}`;
    }

    /**
     * 获取热力图数据
     */
    getHeatmapData() {
        return this.filteredData.map(item => ({
            lng: item.gaodeLongitude || item.longitude,
            lat: item.gaodeLatitude || item.latitude,
            count: 1
        }));
    }

    /**
     * 导出数据
     */
    exportData() {
        return this.filteredData.map(item => ({
            '基站号': item['基站号'] || item.stationId,
            'BBU名称': item['BBU名称'] || item.bbuName,
            '告警名称': item['告警名称'] || item.alarmName,
            '发生时间': item['发生时间'] || item.time,
            '机房名称': item['机房名称'] || item.roomName,
            '所属站点': item['所属站点'] || item.site,
            '所属区县': item['所属区县'] || item.district,
            '经度': item.longitude,
            '纬度': item.latitude
        }));
    }

    /**
     * 清空所有数据
     */
    clearData() {
        this.rawData = [];
        this.filteredData = [];
        this.siteRepeatCount = {};
        this.batches = [];
        this.filters = {
            districts: [],
            alarms: [],
            startDate: null,
            endDate: null,
            minRepeatCount: 0
        };
        this.updateStats();
        this.updateFilterOptions();
        
        // 清空时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.clear();
        }
        
        return true;
    }
}

// 创建全局数据管理器实例
var dataManager = new DataManager();

// 同时挂载到 window 对象，确保兼容性
if (typeof window !== 'undefined') {
    window.dataManager = dataManager;
}
