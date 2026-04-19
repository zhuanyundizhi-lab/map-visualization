const { chromium } = require('playwright');

async function runTests() {
  console.log('开始测试地图数据可视化系统...');
  
  const browser = await chromium.launch({
    headless: true,
    slowMo: 50
  });
  
  const page = await browser.newPage();
  
  try {
    // 测试1: 页面加载测试
    console.log('测试1: 页面加载测试');
    await page.goto('http://localhost:3000');
    
    // 验证页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    if (title === '地图数据可视化系统 - CloudBase版') {
      console.log('✓ 页面标题验证通过');
    } else {
      console.log('✗ 页面标题验证失败');
    }
    
    // 验证页面元素
    const headerText = await page.locator('h1').textContent();
    console.log(`页面标题文本: ${headerText}`);
    if (headerText === '地图数据可视化系统') {
      console.log('✓ 页面标题文本验证通过');
    } else {
      console.log('✗ 页面标题文本验证失败');
    }
    
    const totalCountText = await page.locator('#totalCount').textContent();
    console.log(`总数据文本: ${totalCountText}`);
    if (totalCountText === '总数据: 0') {
      console.log('✓ 总数据文本验证通过');
    } else {
      console.log('✗ 总数据文本验证失败');
    }
    
    const filteredCountText = await page.locator('#filteredCount').textContent();
    console.log(`筛选后文本: ${filteredCountText}`);
    if (filteredCountText === '筛选后: 0') {
      console.log('✓ 筛选后文本验证通过');
    } else {
      console.log('✗ 筛选后文本验证失败');
    }
    
    // 测试2: 地图初始化测试
    console.log('\n测试2: 地图初始化测试');
    await page.waitForTimeout(3000);
    
    const mapContainer = await page.locator('#map');
    const isMapVisible = await mapContainer.isVisible();
    console.log(`地图容器可见性: ${isMapVisible}`);
    if (isMapVisible) {
      console.log('✓ 地图容器验证通过');
    } else {
      console.log('✗ 地图容器验证失败');
    }
    
    // 测试3: 数据操作功能测试
    console.log('\n测试3: 数据操作功能测试');
    
    const importButton = await page.locator('button:has-text("导入数据")');
    const isImportButtonVisible = await importButton.isVisible();
    console.log(`导入数据按钮可见性: ${isImportButtonVisible}`);
    if (isImportButtonVisible) {
      console.log('✓ 导入数据按钮验证通过');
    } else {
      console.log('✗ 导入数据按钮验证失败');
    }
    
    const exportButton = await page.locator('#exportBtn');
    const isExportButtonVisible = await exportButton.isVisible();
    console.log(`导出数据按钮可见性: ${isExportButtonVisible}`);
    if (isExportButtonVisible) {
      console.log('✓ 导出数据按钮验证通过');
    } else {
      console.log('✗ 导出数据按钮验证失败');
    }
    
    const importFromDbButton = await page.locator('#importFromDbBtn');
    const isImportFromDbButtonVisible = await importFromDbButton.isVisible();
    console.log(`从数据库导入按钮可见性: ${isImportFromDbButtonVisible}`);
    if (isImportFromDbButtonVisible) {
      console.log('✓ 从数据库导入按钮验证通过');
    } else {
      console.log('✗ 从数据库导入按钮验证失败');
    }
    
    const uploadToDbButton = await page.locator('#uploadToDbBtn');
    const isUploadToDbButtonVisible = await uploadToDbButton.isVisible();
    console.log(`上传到数据库按钮可见性: ${isUploadToDbButtonVisible}`);
    if (isUploadToDbButtonVisible) {
      console.log('✓ 上传到数据库按钮验证通过');
    } else {
      console.log('✗ 上传到数据库按钮验证失败');
    }
    
    // 测试4: 地图模式切换测试
    console.log('\n测试4: 地图模式切换测试');
    
    const markerModeButton = await page.locator('#markerMode');
    const isMarkerModeButtonVisible = await markerModeButton.isVisible();
    console.log(`标记点模式按钮可见性: ${isMarkerModeButtonVisible}`);
    if (isMarkerModeButtonVisible) {
      console.log('✓ 标记点模式按钮验证通过');
    } else {
      console.log('✗ 标记点模式按钮验证失败');
    }
    
    const heatmapModeButton = await page.locator('#heatmapMode');
    const isHeatmapModeButtonVisible = await heatmapModeButton.isVisible();
    console.log(`热力图模式按钮可见性: ${isHeatmapModeButtonVisible}`);
    if (isHeatmapModeButtonVisible) {
      console.log('✓ 热力图模式按钮验证通过');
    } else {
      console.log('✗ 热力图模式按钮验证失败');
    }
    
    // 切换到热力图模式
    await heatmapModeButton.click();
    await page.waitForTimeout(1000);
    
    const heatmapPanel = await page.locator('#heatmapPanel');
    const isHeatmapPanelVisible = await heatmapPanel.isVisible();
    console.log(`热力图面板可见性: ${isHeatmapPanelVisible}`);
    if (isHeatmapPanelVisible) {
      console.log('✓ 热力图面板验证通过');
    } else {
      console.log('✗ 热力图面板验证失败');
    }
    
    // 测试5: 地图图层切换测试
    console.log('\n测试5: 地图图层切换测试');
    
    const normalMapButton = await page.locator('#normalMap');
    const isNormalMapButtonVisible = await normalMapButton.isVisible();
    console.log(`标准地图按钮可见性: ${isNormalMapButtonVisible}`);
    if (isNormalMapButtonVisible) {
      console.log('✓ 标准地图按钮验证通过');
    } else {
      console.log('✗ 标准地图按钮验证失败');
    }
    
    const satelliteMapButton = await page.locator('#satelliteMap');
    const isSatelliteMapButtonVisible = await satelliteMapButton.isVisible();
    console.log(`卫星地图按钮可见性: ${isSatelliteMapButtonVisible}`);
    if (isSatelliteMapButtonVisible) {
      console.log('✓ 卫星地图按钮验证通过');
    } else {
      console.log('✗ 卫星地图按钮验证失败');
    }
    
    // 切换到卫星地图
    await satelliteMapButton.click();
    await page.waitForTimeout(1000);
    
    // 测试6: 筛选功能测试
    console.log('\n测试6: 筛选功能测试');
    
    const districtFilter = await page.locator('#districtFilter');
    const isDistrictFilterVisible = await districtFilter.isVisible();
    console.log(`区县筛选可见性: ${isDistrictFilterVisible}`);
    if (isDistrictFilterVisible) {
      console.log('✓ 区县筛选验证通过');
    } else {
      console.log('✗ 区县筛选验证失败');
    }
    
    const alarmFilter = await page.locator('#alarmFilter');
    const isAlarmFilterVisible = await alarmFilter.isVisible();
    console.log(`告警名称筛选可见性: ${isAlarmFilterVisible}`);
    if (isAlarmFilterVisible) {
      console.log('✓ 告警名称筛选验证通过');
    } else {
      console.log('✗ 告警名称筛选验证失败');
    }
    
    const startDate = await page.locator('#startDate');
    const isStartDateVisible = await startDate.isVisible();
    console.log(`开始日期筛选可见性: ${isStartDateVisible}`);
    if (isStartDateVisible) {
      console.log('✓ 开始日期筛选验证通过');
    } else {
      console.log('✗ 开始日期筛选验证失败');
    }
    
    const endDate = await page.locator('#endDate');
    const isEndDateVisible = await endDate.isVisible();
    console.log(`结束日期筛选可见性: ${isEndDateVisible}`);
    if (isEndDateVisible) {
      console.log('✓ 结束日期筛选验证通过');
    } else {
      console.log('✗ 结束日期筛选验证失败');
    }
    
    const repeatFilter = await page.locator('#repeatFilter');
    const isRepeatFilterVisible = await repeatFilter.isVisible();
    console.log(`重复出现数筛选可见性: ${isRepeatFilterVisible}`);
    if (isRepeatFilterVisible) {
      console.log('✓ 重复出现数筛选验证通过');
    } else {
      console.log('✗ 重复出现数筛选验证失败');
    }
    
    const applyFilterButton = await page.locator('#applyFilter');
    const isApplyFilterButtonVisible = await applyFilterButton.isVisible();
    console.log(`应用筛选按钮可见性: ${isApplyFilterButtonVisible}`);
    if (isApplyFilterButtonVisible) {
      console.log('✓ 应用筛选按钮验证通过');
    } else {
      console.log('✗ 应用筛选按钮验证失败');
    }
    
    const resetFilterButton = await page.locator('#resetFilter');
    const isResetFilterButtonVisible = await resetFilterButton.isVisible();
    console.log(`重置筛选按钮可见性: ${isResetFilterButtonVisible}`);
    if (isResetFilterButtonVisible) {
      console.log('✓ 重置筛选按钮验证通过');
    } else {
      console.log('✗ 重置筛选按钮验证失败');
    }
    
    console.log('\n测试完成!');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
}

runTests();
