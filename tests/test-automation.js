const { test, expect } = require('@playwright/test');

test.describe('地图数据可视化系统测试', () => {
  test('页面加载测试', async ({ page }) => {
    // 启动本地服务器
    await page.goto('http://localhost:3000');
    
    // 验证页面标题
    await expect(page).toHaveTitle('地图数据可视化系统 - CloudBase版');
    
    // 验证页面元素
    await expect(page.locator('h1')).toHaveText('地图数据可视化系统');
    await expect(page.locator('#totalCount')).toHaveText('总数据: 0');
    await expect(page.locator('#filteredCount')).toHaveText('筛选后: 0');
  });

  test('地图初始化测试', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // 等待地图加载完成
    await page.waitForTimeout(3000);
    
    // 验证地图容器存在
    const mapContainer = await page.locator('#map');
    await expect(mapContainer).toBeVisible();
  });

  test('数据操作功能测试', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // 测试导入按钮
    const importButton = await page.locator('button:has-text("导入数据")');
    await expect(importButton).toBeVisible();
    
    // 测试导出按钮
    const exportButton = await page.locator('#exportBtn');
    await expect(exportButton).toBeVisible();
    
    // 测试从数据库导入按钮
    const importFromDbButton = await page.locator('#importFromDbBtn');
    await expect(importFromDbButton).toBeVisible();
    
    // 测试上传到数据库按钮
    const uploadToDbButton = await page.locator('#uploadToDbBtn');
    await expect(uploadToDbButton).toBeVisible();
  });

  test('地图模式切换测试', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // 测试标记点模式按钮
    const markerModeButton = await page.locator('#markerMode');
    await expect(markerModeButton).toBeVisible();
    await expect(markerModeButton).toHaveClass(/active/);
    
    // 测试热力图模式按钮
    const heatmapModeButton = await page.locator('#heatmapMode');
    await expect(heatmapModeButton).toBeVisible();
    
    // 切换到热力图模式
    await heatmapModeButton.click();
    await expect(heatmapModeButton).toHaveClass(/active/);
    await expect(markerModeButton).not.toHaveClass(/active/);
    
    // 验证热力图面板显示
    const heatmapPanel = await page.locator('#heatmapPanel');
    await expect(heatmapPanel).toBeVisible();
  });

  test('地图图层切换测试', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // 测试标准地图按钮
    const normalMapButton = await page.locator('#normalMap');
    await expect(normalMapButton).toBeVisible();
    await expect(normalMapButton).toHaveClass(/active/);
    
    // 测试卫星地图按钮
    const satelliteMapButton = await page.locator('#satelliteMap');
    await expect(satelliteMapButton).toBeVisible();
    
    // 切换到卫星地图
    await satelliteMapButton.click();
    await expect(satelliteMapButton).toHaveClass(/active/);
    await expect(normalMapButton).not.toHaveClass(/active/);
  });

  test('筛选功能测试', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // 测试区县筛选
    const districtFilter = await page.locator('#districtFilter');
    await expect(districtFilter).toBeVisible();
    
    // 测试告警名称筛选
    const alarmFilter = await page.locator('#alarmFilter');
    await expect(alarmFilter).toBeVisible();
    
    // 测试时间范围筛选
    const startDate = await page.locator('#startDate');
    const endDate = await page.locator('#endDate');
    await expect(startDate).toBeVisible();
    await expect(endDate).toBeVisible();
    
    // 测试重复出现数筛选
    const repeatFilter = await page.locator('#repeatFilter');
    await expect(repeatFilter).toBeVisible();
    
    // 测试应用筛选按钮
    const applyFilterButton = await page.locator('#applyFilter');
    await expect(applyFilterButton).toBeVisible();
    
    // 测试重置筛选按钮
    const resetFilterButton = await page.locator('#resetFilter');
    await expect(resetFilterButton).toBeVisible();
  });
});
