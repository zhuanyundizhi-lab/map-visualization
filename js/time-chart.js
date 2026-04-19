/**
 * 时间分布统计图表模块
 * 使用 ECharts 展示数据的时间分布
 */

class TimeChartManager {
    constructor() {
        this.chart = null;
        this.currentGranularity = 'day'; // 默认按天
        this.currentData = [];
    }

    /**
     * 初始化图表
     */
    init() {
        const chartDom = document.getElementById('timeChart');
        if (!chartDom) {
            console.error('未找到图表容器 #timeChart');
            return;
        }

        this.chart = echarts.init(chartDom);
        
        // 绑定时间颗粒度切换事件
        const granularitySelect = document.getElementById('timeGranularity');
        if (granularitySelect) {
            granularitySelect.addEventListener('change', (e) => {
                this.currentGranularity = e.target.value;
                this.updateChart(this.currentData);
            });
        }

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.chart && this.chart.resize();
        });

        console.log('时间统计图表初始化完成');
    }

    /**
     * 从数据项中提取时间
     */
    extractTime(item) {
        const timeStr = item['发生时间'] || item.time || item.date || item.timestamp;
        if (!timeStr) return null;
        
        const date = new Date(timeStr);
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * 获取时间键值（根据颗粒度）
     */
    getTimeKey(date, granularity) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        
        switch (granularity) {
            case 'hour':
                return `${year}-${month}-${day} ${hour}:00`;
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week': {
                // 获取该周的起始日期（周一）
                const d = new Date(date);
                const dayOfWeek = d.getDay() || 7; // 周日为0，转为7
                d.setDate(d.getDate() - dayOfWeek + 1);
                const weekYear = d.getFullYear();
                const weekMonth = String(d.getMonth() + 1).padStart(2, '0');
                const weekDay = String(d.getDate()).padStart(2, '0');
                return `${weekYear}-${weekMonth}-${weekDay}`;
            }
            case 'month':
                return `${year}-${month}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    /**
     * 获取时间显示格式
     */
    getTimeDisplayLabel(timeKey, granularity) {
        switch (granularity) {
            case 'hour':
                // 显示为 "MM-DD HH:00"
                return timeKey.substring(5, 13) + '时';
            case 'day':
                // 显示为 "MM-DD"
                return timeKey.substring(5);
            case 'week':
                // 显示为 "MM-DD"
                return timeKey.substring(5);
            case 'month':
                // 显示为 "YYYY-MM"
                return timeKey;
            default:
                return timeKey;
        }
    }

    /**
     * 统计数据分布
     */
    calculateTimeDistribution(data, granularity) {
        const distribution = {};
        let validCount = 0;
        let minTime = null;
        let maxTime = null;

        data.forEach(item => {
            const time = this.extractTime(item);
            if (!time) return;

            validCount++;
            
            // 更新最小和最大时间
            if (!minTime || time < minTime) minTime = time;
            if (!maxTime || time > maxTime) maxTime = time;

            const timeKey = this.getTimeKey(time, granularity);
            distribution[timeKey] = (distribution[timeKey] || 0) + 1;
        });

        // 按时间排序
        const sortedKeys = Object.keys(distribution).sort();
        const sortedData = sortedKeys.map(key => ({
            timeKey: key,
            label: this.getTimeDisplayLabel(key, granularity),
            count: distribution[key]
        }));

        return {
            data: sortedData,
            totalCount: validCount,
            minTime,
            maxTime
        };
    }

    /**
     * 格式化时间显示
     */
    formatTime(date) {
        if (!date) return '-';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    /**
     * 更新图表
     */
    updateChart(data) {
        this.currentData = data || [];

        if (!this.chart) {
            console.warn('图表未初始化');
            return;
        }

        if (this.currentData.length === 0) {
            this.chart.clear();
            this.updateStats(null, null, 0);
            return;
        }

        const result = this.calculateTimeDistribution(this.currentData, this.currentGranularity);
        
        // 更新统计信息
        this.updateStats(result.minTime, result.maxTime, result.totalCount);

        // 准备图表数据
        const xData = result.data.map(item => item.label);
        const yData = result.data.map(item => item.count);

        // 配置图表选项
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function(params) {
                    const data = params[0];
                    return `${data.name}<br/>数据量: <strong>${data.value}</strong> 条`;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLabel: {
                    fontSize: 10,
                    rotate: xData.length > 10 ? 45 : 0,
                    interval: xData.length > 20 ? Math.floor(xData.length / 10) : 0
                },
                axisLine: {
                    lineStyle: {
                        color: '#ccc'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '数据量',
                nameTextStyle: {
                    fontSize: 11,
                    color: '#666'
                },
                axisLabel: {
                    fontSize: 10
                },
                splitLine: {
                    lineStyle: {
                        color: '#f0f0f0'
                    }
                }
            },
            series: [{
                name: '数据量',
                type: 'bar',
                data: yData,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#667eea' },
                        { offset: 1, color: '#764ba2' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: '#5a6fd6'
                    }
                },
                barWidth: '60%'
            }],
            animationDuration: 500
        };

        this.chart.setOption(option, true);
    }

    /**
     * 更新统计信息显示
     */
    updateStats(minTime, maxTime, totalCount) {
        const startTimeEl = document.getElementById('chartStartTime');
        const endTimeEl = document.getElementById('chartEndTime');
        const totalCountEl = document.getElementById('chartTotalCount');

        if (startTimeEl) startTimeEl.textContent = this.formatTime(minTime);
        if (endTimeEl) endTimeEl.textContent = this.formatTime(maxTime);
        if (totalCountEl) totalCountEl.textContent = totalCount || 0;
    }

    /**
     * 清空图表
     */
    clear() {
        if (this.chart) {
            this.chart.clear();
        }
        this.currentData = [];
        this.updateStats(null, null, 0);
    }

    /**
     * 销毁图表
     */
    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}

// 创建全局时间图表管理器实例
const timeChartManager = new TimeChartManager();

// 同时挂载到 window 对象，确保兼容性
if (typeof window !== 'undefined') {
    window.timeChartManager = timeChartManager;
}
