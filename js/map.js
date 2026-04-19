/**
 * 地图模块 - 适配高德地图 API 1.4.15
 */

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markerCluster = null;
        this.heatmap = null;
        this.currentMode = 'marker'; // 'marker' 或 'heatmap'
        this.infoWindow = null;
    }

    /**
     * 初始化地图
     */
    init() {
        // 初始化地图，默认中心点为温州
        this.map = new AMap.Map('map', {
            zoom: 10,
            center: [120.699, 27.994],
            viewMode: '2D'
        });

        // 添加地图控件
        this.map.addControl(new AMap.Scale());
        this.map.addControl(new AMap.ToolBar({
            position: 'RB'
        }));

        // 初始化信息窗口
        this.infoWindow = new AMap.InfoWindow({
            offset: new AMap.Pixel(0, -30),
            content: ''
        });

        // 绑定模式切换事件
        this.bindModeEvents();
        
        // 绑定热力图参数事件
        this.bindHeatmapEvents();
        
        // 绑定地图图层切换事件
        this.bindLayerEvents();

        console.log('地图初始化完成');
        
        // 初始化时间统计图表
        if (typeof timeChartManager !== 'undefined') {
            timeChartManager.init();
        }
    }

    /**
     * 绑定模式切换事件
     */
    bindModeEvents() {
        document.getElementById('markerMode').addEventListener('click', () => {
            this.switchMode('marker');
        });

        document.getElementById('heatmapMode').addEventListener('click', () => {
            this.switchMode('heatmap');
        });
    }
    
    /**
     * 绑定地图图层切换事件
     */
    bindLayerEvents() {
        document.getElementById('normalMap').addEventListener('click', () => {
            this.switchLayer('normal');
        });

        document.getElementById('satelliteMap').addEventListener('click', () => {
            this.switchLayer('satellite');
        });
    }
    
    /**
     * 切换地图图层
     */
    switchLayer(layerType) {
        // 更新按钮状态
        document.getElementById('normalMap').classList.toggle('active', layerType === 'normal');
        document.getElementById('satelliteMap').classList.toggle('active', layerType === 'satellite');
        
        // 切换地图图层
        if (layerType === 'satellite') {
            // 切换到卫星图层
            this.map.setLayers([
                new AMap.TileLayer.Satellite(),
                new AMap.TileLayer.RoadNet() // 显示道路网
            ]);
        } else {
            // 切换回标准图层
            this.map.setLayers([
                new AMap.TileLayer()
            ]);
        }
        
        console.log('地图图层切换为:', layerType);
    }

    /**
     * 绑定热力图参数事件
     */
    bindHeatmapEvents() {
        const radiusSlider = document.getElementById('heatmapRadius');
        const opacitySlider = document.getElementById('heatmapOpacity');

        if (radiusSlider) {
            radiusSlider.addEventListener('input', (e) => {
                document.getElementById('radiusValue').textContent = e.target.value;
                if (this.heatmap && this.currentMode === 'heatmap') {
                    this.heatmap.setRadius(parseInt(e.target.value));
                }
            });
        }

        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                document.getElementById('opacityValue').textContent = e.target.value;
                if (this.heatmap && this.currentMode === 'heatmap') {
                    // 1.4.15 版本热力图透明度设置方式不同
                    this.heatmap.setOptions({
                        opacity: parseFloat(e.target.value)
                    });
                }
            });
        }
    }

    /**
     * 切换地图模式
     */
    switchMode(mode) {
        this.currentMode = mode;
        
        // 更新按钮状态
        document.getElementById('markerMode').classList.toggle('active', mode === 'marker');
        document.getElementById('heatmapMode').classList.toggle('active', mode === 'heatmap');
        
        // 显示/隐藏热力图参数面板
        document.getElementById('heatmapPanel').style.display = mode === 'heatmap' ? 'block' : 'none';

        if (mode === 'marker') {
            this.hideHeatmap();
            this.showMarkers();
        } else {
            this.hideMarkers();
            this.showHeatmap();
        }
    }

    /**
     * 显示标记点
     */
    showMarkers() {
        if (this.markers.length > 0) {
            this.markers.forEach(marker => marker.show());
            if (this.markerCluster) {
                this.markerCluster.setMap(this.map);
            }
        }
    }

    /**
     * 隐藏标记点
     */
    hideMarkers() {
        if (this.markers.length > 0) {
            this.markers.forEach(marker => marker.hide());
            if (this.markerCluster) {
                this.markerCluster.setMap(null);
            }
        }
    }

    /**
     * 显示热力图
     */
    showHeatmap() {
        if (this.heatmap) {
            this.heatmap.show();
        }
    }

    /**
     * 隐藏热力图
     */
    hideHeatmap() {
        if (this.heatmap) {
            this.heatmap.hide();
        }
    }

    /**
     * 更新标记点
     */
    updateMarkers(data) {
        // 清除现有标记
        this.clearMarkers();

        if (data.length === 0) return;

        // 创建标记点（使用高德坐标显示）
        this.markers = data.map(item => {
            // 优先使用高德坐标，如果没有则使用原始坐标
            const displayLng = item.gaodeLongitude || item.longitude;
            const displayLat = item.gaodeLatitude || item.latitude;
            
            const marker = new AMap.Marker({
                position: [displayLng, displayLat],
                title: item['BBU名称'] || item.bbuName || '未知'
            });
            
            // 存储数据到 marker
            marker.setExtData(item);

            // 点击事件
            marker.on('click', () => {
                this.showInfoWindow(item, marker);
            });

            return marker;
        });

        // 添加标记点到地图
        if (this.currentMode === 'marker') {
            // 使用点聚合 - 1.4.15 版本语法
            if (this.markerCluster) {
                this.markerCluster.setMap(null);
            }
            
            // 设置聚合点样式 - 在创建时传入
            var styles = [{
                // 绿色 - 小于50
                url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiM2N2MyM2EiLz48L3N2Zz4=',
                size: new AMap.Size(30, 30),
                offset: new AMap.Pixel(-15, -15),
                textColor: '#fff',
                textSize: 12
            }, {
                // 橙色 - 50-100
                url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNlNmEyM2MiLz48L3N2Zz4=',
                size: new AMap.Size(30, 30),
                offset: new AMap.Pixel(-15, -15),
                textColor: '#fff',
                textSize: 12
            }, {
                // 红色 - 大于100
                url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNmNTZjNmMiLz48L3N2Zz4=',
                size: new AMap.Size(30, 30),
                offset: new AMap.Pixel(-15, -15),
                textColor: '#fff',
                textSize: 12
            }];
            
            // 1.4.15 版本的 MarkerClusterer - 使用 renderClusterMarker 替代 setCalculator
            this.markerCluster = new AMap.MarkerClusterer(this.map, this.markers, {
                gridSize: 60,
                minClusterSize: 2,
                styles: styles,
                renderClusterMarker: function(context) {
                    var count = context.count;
                    var index = count > 100 ? 2 : count > 50 ? 1 : 0;
                    var div = document.createElement('div');
                    var colors = ['#67c23a', '#e6a23c', '#f56c6c'];
                    div.style.backgroundColor = colors[index];
                    div.style.width = '30px';
                    div.style.height = '30px';
                    div.style.borderRadius = '50%';
                    div.style.lineHeight = '30px';
                    div.style.textAlign = 'center';
                    div.style.color = 'white';
                    div.style.fontSize = '12px';
                    div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    div.innerHTML = count;
                    context.marker.setContent(div);
                }
            });
        }

        // 调整地图视野
        if (data.length > 0) {
            this.map.setFitView();
        }
    }

    /**
     * 更新热力图 - 1.4.15 版本
     */
    updateHeatmap(data) {
        // 清除现有热力图
        if (this.heatmap) {
            this.heatmap.setMap(null);
            this.heatmap = null;
        }

        if (data.length === 0) return;

        // 准备热力图数据（使用高德坐标）
        const heatmapData = data.map(item => ({
            lng: item.gaodeLongitude || item.longitude,
            lat: item.gaodeLatitude || item.latitude,
            count: 1
        }));

        // 创建热力图 - 1.4.15 版本语法
        this.heatmap = new AMap.Heatmap(this.map, {
            radius: parseInt(document.getElementById('heatmapRadius').value) || 25,
            opacity: parseFloat(document.getElementById('heatmapOpacity').value) || 0.6,
            zooms: [3, 18]
        });

        this.heatmap.setDataSet({
            data: heatmapData,
            max: 100
        });

        if (this.currentMode !== 'heatmap') {
            this.heatmap.hide();
        }
    }

    /**
     * 显示信息窗口
     */
    showInfoWindow(item, marker) {
        const content = `
            <div class="info-window">
                <h4>${item['BBU名称'] || item.bbuName || '未知'}</h4>
                <p><strong>基站号:</strong> ${item['基站号'] || item.stationId || '-'}</p>
                <p><strong>告警名称:</strong> ${item['告警名称'] || item.alarmName || '-'}</p>
                <p><strong>发生时间:</strong> ${item['发生时间'] || item.time || '-'}</p>
                <p><strong>机房名称:</strong> ${item['机房名称'] || item.roomName || '-'}</p>
                <p><strong>所属站点:</strong> ${item['所属站点'] || item.site || '-'}</p>
                <p><strong>所属区县:</strong> ${item['所属区县'] || item.district || '-'}</p>
                <p><strong>经纬度:</strong> ${item.longitude.toFixed(6)}, ${item.latitude.toFixed(6)}</p>
            </div>
        `;
        
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker.getPosition());
    }

    /**
     * 清除所有标记
     */
    clearMarkers() {
        if (this.markerCluster) {
            this.markerCluster.setMap(null);
            this.markerCluster = null;
        }
        if (this.markers.length > 0) {
            this.markers.forEach(marker => {
                marker.setMap(null);
            });
        }
        this.markers = [];
    }

    /**
     * 更新地图显示
     */
    update(data) {
        this.updateMarkers(data);
        this.updateHeatmap(data);
    }
}

// 创建全局地图管理器实例
const mapManager = new MapManager();

// 页面加载完成后初始化地图
document.addEventListener('DOMContentLoaded', () => {
    // 检查高德地图 API 是否加载
    if (typeof AMap !== 'undefined') {
        mapManager.init();
        
        // 加载示例数据
        loadSampleData();
    } else {
        console.error('高德地图 API 未加载');
        document.getElementById('map').innerHTML = 
            '<div style="padding: 50px; text-align: center; color: #999;">' +
            '<p>地图加载失败，请检查网络连接</p>' +
            '<p>需要申请高德地图 API Key</p>' +
            '</div>';
    }
});

/**
 * 加载示例数据
 */
async function loadSampleData() {
    try {
        // 尝试读取本地示例数据
        const response = await fetch('data/sample.json');
        if (response.ok) {
            const data = await response.json();
            dataManager.setData(data);
            mapManager.update(dataManager.filteredData);
        }
    } catch (e) {
        console.log('未找到示例数据，等待用户导入');
    }
}
