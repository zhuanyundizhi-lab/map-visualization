/**
 * 筛选模块
 */

class FilterManager {
    constructor() {
        this.bindEvents();
        this.bindRepeatFilterEvent();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 应用筛选按钮
        const applyBtn = document.getElementById('applyFilter');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }

        // 重置筛选按钮
        const resetBtn = document.getElementById('resetFilter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // 批次筛选器实时筛选
        const batchFilter = document.getElementById('batchFilter');
        if (batchFilter) {
            batchFilter.addEventListener('change', () => this.applyFilters());
        }

        // 时间范围筛选器实时筛选
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', () => this.applyFilters());
        }
        
        if (endDate) {
            endDate.addEventListener('change', () => this.applyFilters());
        }
    }

    /**
     * 绑定重复筛选器事件
     */
    bindRepeatFilterEvent() {
        const repeatFilter = document.getElementById('repeatFilter');
        const repeatValue = document.getElementById('repeatValue');
        
        if (repeatFilter && repeatValue) {
            repeatFilter.addEventListener('input', (e) => {
                repeatValue.textContent = e.target.value;
            });
        }
    }

    /**
     * 获取选中的值（支持多选）
     */
    getSelectedValues(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return [];
        
        const selected = [];
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].selected) {
                selected.push(select.options[i].value);
            }
        }
        return selected;
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        const repeatFilter = document.getElementById('repeatFilter');
        const minRepeatCount = repeatFilter ? parseInt(repeatFilter.value) || 0 : 0;

        const filters = {
            batchIds: this.getSelectedValues('batchFilter'),
            districts: this.getSelectedValues('districtFilter'),
            alarms: this.getSelectedValues('alarmFilter'),
            startDate: document.getElementById('startDate').value || null,
            endDate: document.getElementById('endDate').value || null,
            minRepeatCount: minRepeatCount
        };

        // 应用筛选
        const filteredData = dataManager.applyFilters(filters);

        // 更新地图
        mapManager.update(filteredData);

        // 更新时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.updateChart(filteredData);
        }

        console.log('筛选应用:', filters);
        console.log('筛选结果:', filteredData.length, '条数据');
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        // 重置重复筛选器
        const repeatFilter = document.getElementById('repeatFilter');
        const repeatValue = document.getElementById('repeatValue');
        if (repeatFilter) {
            repeatFilter.value = 0;
        }
        if (repeatValue) {
            repeatValue.textContent = '0';
        }

        // 重置批次筛选器
        const batchFilter = document.getElementById('batchFilter');
        if (batchFilter) {
            batchFilter.selectedIndex = -1;
        }

        const filteredData = dataManager.resetFilters();

        // 更新地图
        mapManager.update(filteredData);

        // 更新时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.updateChart(filteredData);
        }

        console.log('筛选已重置');
    }
}

// 创建全局筛选管理器实例
const filterManager = new FilterManager();
