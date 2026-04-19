/**
 * 坐标转换工具模块
 * 支持 GPS (WGS-84) 与高德坐标 (GCJ-02) 之间的转换
 */

class CoordTransform {
    constructor() {
        this.PI = 3.1415926535897932384626;
        this.a = 6378245.0;  // 长半轴
        this.ee = 0.00669342162296594323; // 偏心率平方
    }

    /**
     * 判断坐标是否在中国境外
     * 境外坐标不需要转换
     */
    outOfChina(lng, lat) {
        return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
    }

    /**
     * 转换经度
     */
    transformLng(lng, lat) {
        let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * this.PI) + 40.0 * Math.sin(lng / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * this.PI) + 300.0 * Math.sin(lng / 30.0 * this.PI)) * 2.0 / 3.0;
        return ret;
    }

    /**
     * 转换纬度
     */
    transformLat(lng, lat) {
        let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * this.PI) + 40.0 * Math.sin(lat / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * this.PI) + 320 * Math.sin(lat * this.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    /**
     * WGS-84 (GPS) 转 GCJ-02 (高德/火星坐标)
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @returns {Object} {lng, lat} 转换后的坐标
     */
    wgs84ToGcj02(lng, lat) {
        if (this.outOfChina(lng, lat)) {
            return { lng, lat };
        }
        
        let dLat = this.transformLat(lng - 105.0, lat - 35.0);
        let dLng = this.transformLng(lng - 105.0, lat - 35.0);
        
        let radLat = lat / 180.0 * this.PI;
        let magic = Math.sin(radLat);
        magic = 1 - this.ee * magic * magic;
        let sqrtMagic = Math.sqrt(magic);
        
        dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.PI);
        dLng = (dLng * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.PI);
        
        return {
            lng: lng + dLng,
            lat: lat + dLat
        };
    }

    /**
     * GCJ-02 (高德/火星坐标) 转 WGS-84 (GPS)
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @returns {Object} {lng, lat} 转换后的坐标
     */
    gcj02ToWgs84(lng, lat) {
        if (this.outOfChina(lng, lat)) {
            return { lng, lat };
        }
        
        let dLat = this.transformLat(lng - 105.0, lat - 35.0);
        let dLng = this.transformLng(lng - 105.0, lat - 35.0);
        
        let radLat = lat / 180.0 * this.PI;
        let magic = Math.sin(radLat);
        magic = 1 - this.ee * magic * magic;
        let sqrtMagic = Math.sqrt(magic);
        
        dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.PI);
        dLng = (dLng * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.PI);
        
        return {
            lng: lng - dLng,
            lat: lat - dLat
        };
    }

    /**
     * 转换数据项的坐标（GPS -> 高德）
     * 保留原始 GPS 坐标，添加转换后的高德坐标
     * @param {Object} item - 数据项
     * @returns {Object} 添加了 gaodeLongitude 和 gaodeLatitude 的数据项
     */
    convertItemToGaode(item) {
        const lng = parseFloat(item['经度'] || item.longitude || item.lng || 0);
        const lat = parseFloat(item['纬度'] || item.latitude || item.lat || 0);
        
        if (isNaN(lng) || isNaN(lat) || lng === 0 || lat === 0) {
            return {
                ...item,
                gaodeLongitude: lng,
                gaodeLatitude: lat
            };
        }
        
        const gaodeCoord = this.wgs84ToGcj02(lng, lat);
        
        return {
            ...item,
            // 保留原始 GPS 坐标
            longitude: lng,
            latitude: lat,
            // 添加高德坐标（用于地图显示）
            gaodeLongitude: gaodeCoord.lng,
            gaodeLatitude: gaodeCoord.lat
        };
    }

    /**
     * 批量转换数据坐标
     * @param {Array} data - 数据数组
     * @returns {Array} 转换后的数据数组
     */
    convertBatchToGaode(data) {
        return data.map(item => this.convertItemToGaode(item));
    }
}

// 创建全局坐标转换器实例
const coordTransform = new CoordTransform();

// 同时挂载到 window 对象，确保兼容性
if (typeof window !== 'undefined') {
    window.coordTransform = coordTransform;
}
