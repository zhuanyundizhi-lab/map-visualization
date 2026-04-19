const { chromium } = require('playwright');

async function runCloudTests() {
  const targetUrl = 'https://map-visualization-001-d6cda2aa5a-1423211882.tcloudbaseapp.com/';
  
  console.log('========================================');
  console.log('开始测试云端地图数据可视化系统');
  console.log(`目标URL: ${targetUrl}`);
  console.log('========================================\n');
  
  const browser = await chromium.launch({
    headless: true,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // 记录测试结果
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  function recordTest(testName, passed, message = '') {
    const status = passed ? '✓ 通过' : '✗ 失败';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    testResults.details.push({ testName, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }
  
  try {
    // 测试1: 页面加载和基本结构
    console.log('【测试1】页面加载和基本结构');
    console.log('----------------------------------------');
    
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const statusCode = response.status();
    recordTest('页面可访问', statusCode === 200, `状态码: ${statusCode}`);
    
    const title = await page.title();
    recordTest('页面标题正确', title === '地图数据可视化系统 - CloudBase版', `标题: ${title}`);
    
    const headerText = await page.locator('h1').textContent();
    recordTest('页面主标题存在', headerText === '地图数据可视化系统');
    
    // 测试2: 统计数据面板
    console.log('\n【测试2】统计数据面板');
    console.log('----------------------------------------');
    
    const totalCount = await page.locator('#totalCount').textContent();
    recordTest('总数据计数器存在', totalCount.includes('总数据:'));
    
    const filteredCount = await page.locator('#filteredCount').textContent();
    recordTest('筛选后计数器存在', filteredCount.includes('筛选后:'));
    
    // 测试3: 本地数据操作面板
    console.log('\n【测试3】本地数据操作面板');
    console.log('----------------------------------------');
    
    const importBtn = await page.locator('button:has-text("导入数据")');
    recordTest('导入数据按钮可见', await importBtn.isVisible().catch(() => false));
    
    const exportBtn = await page.locator('#exportBtn');
    recordTest('导出数据按钮可见', await exportBtn.isVisible().catch(() => false));
    
    const fileInput = await page.locator('#fileInput');
    recordTest('文件输入框存在', await fileInput.count() > 0);
    
    // 测试4: 云端数据库操作面板
    console.log('\n【测试4】云端数据库操作面板');
    console.log('----------------------------------------');
    
    const importFromDbBtn = await page.locator('#importFromDbBtn');
    recordTest('从数据库导入按钮可见', await importFromDbBtn.isVisible().catch(() => false));
    
    const importBtnText = await importFromDbBtn.textContent().catch(() => '');
    recordTest('导入按钮文本正确', importBtnText === '从数据库导入');
    
    const uploadToDbBtn = await page.locator('#uploadToDbBtn');
    recordTest('上传到数据库按钮可见', await uploadToDbBtn.isVisible().catch(() => false));
    
    const uploadBtnText = await uploadToDbBtn.textContent().catch(() => '');
    recordTest('上传按钮文本正确', uploadBtnText === '上传到数据库');
    
    // 测试5: 批次列表面板
    console.log('\n【测试5】批次列表面板');
    console.log('----------------------------------------');
    
    const batchCount = await page.locator('#batchCount');
    recordTest('本地批次计数器存在', await batchCount.isVisible().catch(() => false));
    
    const cloudBatchCount = await page.locator('#cloudBatchCount');
    recordTest('云端批次计数器存在', await cloudBatchCount.isVisible().catch(() => false));
    
    const batchList = await page.locator('#batchList');
    recordTest('本地批次列表容器存在', await batchList.isVisible().catch(() => false));
    
    const cloudBatchList = await page.locator('#cloudBatchList');
    recordTest('云端批次列表容器存在', await cloudBatchList.isVisible().catch(() => false));
    
    // 测试6: 地图显示区域
    console.log('\n【测试6】地图显示区域');
    console.log('----------------------------------------');
    
    await page.waitForTimeout(3000);
    
    const mapContainer = await page.locator('#map');
    recordTest('地图容器存在', await mapContainer.count() > 0);
    recordTest('地图容器可见', await mapContainer.isVisible().catch(() => false));
    
    const mapLayerControl = await page.locator('.map-layer-control');
    recordTest('地图图层控制面板存在', await mapLayerControl.isVisible().catch(() => false));
    
    // 测试7: 地图模式切换
    console.log('\n【测试7】地图模式切换');
    console.log('----------------------------------------');
    
    const markerModeBtn = await page.locator('#markerMode');
    recordTest('标记点模式按钮存在', await markerModeBtn.isVisible().catch(() => false));
    
    const heatmapModeBtn = await page.locator('#heatmapMode');
    recordTest('热力图模式按钮存在', await heatmapModeBtn.isVisible().catch(() => false));
    
    // 测试默认激活状态
    const isMarkerActive = await markerModeBtn.evaluate(el => el.classList.contains('active'));
    recordTest('标记点模式默认激活', isMarkerActive);
    
    // 切换到热力图模式
    await heatmapModeBtn.click();
    await page.waitForTimeout(500);
    
    const isHeatmapActive = await heatmapModeBtn.evaluate(el => el.classList.contains('active'));
    recordTest('热力图模式可切换', isHeatmapActive);
    
    const heatmapPanel = await page.locator('#heatmapPanel');
    recordTest('热力图参数面板显示', await heatmapPanel.isVisible().catch(() => false));
    
    // 测试8: 地图图层切换
    console.log('\n【测试8】地图图层切换');
    console.log('----------------------------------------');
    
    const normalMapBtn = await page.locator('#normalMap');
    recordTest('标准地图按钮存在', await normalMapBtn.isVisible().catch(() => false));
    
    const satelliteMapBtn = await page.locator('#satelliteMap');
    recordTest('卫星地图按钮存在', await satelliteMapBtn.isVisible().catch(() => false));
    
    const isNormalActive = await normalMapBtn.evaluate(el => el.classList.contains('active'));
    recordTest('标准地图默认激活', isNormalActive);
    
    // 切换到卫星地图
    await satelliteMapBtn.click();
    await page.waitForTimeout(500);
    
    const isSatelliteActive = await satelliteMapBtn.evaluate(el => el.classList.contains('active'));
    recordTest('卫星地图可切换', isSatelliteActive);
    
    // 测试9: 筛选功能
    console.log('\n【测试9】筛选功能');
    console.log('----------------------------------------');
    
    const districtFilter = await page.locator('#districtFilter');
    recordTest('区县筛选下拉框存在', await districtFilter.isVisible().catch(() => false));
    
    const alarmFilter = await page.locator('#alarmFilter');
    recordTest('告警名称筛选下拉框存在', await alarmFilter.isVisible().catch(() => false));
    
    const startDate = await page.locator('#startDate');
    recordTest('开始日期输入框存在', await startDate.isVisible().catch(() => false));
    
    const endDate = await page.locator('#endDate');
    recordTest('结束日期输入框存在', await endDate.isVisible().catch(() => false));
    
    const repeatFilter = await page.locator('#repeatFilter');
    recordTest('重复出现数滑块存在', await repeatFilter.isVisible().catch(() => false));
    
    const repeatValue = await page.locator('#repeatValue');
    recordTest('重复出现数值显示存在', await repeatValue.isVisible().catch(() => false));
    
    const applyFilterBtn = await page.locator('#applyFilter');
    recordTest('应用筛选按钮存在', await applyFilterBtn.isVisible().catch(() => false));
    
    const resetFilterBtn = await page.locator('#resetFilter');
    recordTest('重置筛选按钮存在', await resetFilterBtn.isVisible().catch(() => false));
    
    // 测试10: 热力图参数面板
    console.log('\n【测试10】热力图参数面板');
    console.log('----------------------------------------');
    
    const heatmapRadius = await page.locator('#heatmapRadius');
    recordTest('热力图半径滑块存在', await heatmapRadius.isVisible().catch(() => false));
    
    const radiusValue = await page.locator('#radiusValue');
    recordTest('半径值显示存在', await radiusValue.isVisible().catch(() => false));
    
    const heatmapOpacity = await page.locator('#heatmapOpacity');
    recordTest('热力图透明度滑块存在', await heatmapOpacity.isVisible().catch(() => false));
    
    const opacityValue = await page.locator('#opacityValue');
    recordTest('透明度值显示存在', await opacityValue.isVisible().catch(() => false));
    
    // 测试11: 弹窗组件
    console.log('\n【测试11】弹窗组件');
    console.log('----------------------------------------');
    
    const detailModal = await page.locator('#detailModal');
    recordTest('详情弹窗容器存在', await detailModal.count() > 0);
    
    // 测试12: 响应式布局检查
    console.log('\n【测试12】响应式布局检查');
    console.log('----------------------------------------');
    
    const container = await page.locator('.container');
    recordTest('主容器存在', await container.count() > 0);
    
    const sidebar = await page.locator('.sidebar');
    recordTest('侧边栏存在', await sidebar.isVisible().catch(() => false));
    
    const mapContainer2 = await page.locator('.map-container');
    recordTest('地图容器存在', await mapContainer2.isVisible().catch(() => false));
    
    // 测试13: 控制台错误检查
    console.log('\n【测试13】控制台错误检查');
    console.log('----------------------------------------');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    recordTest('页面加载无严重错误', consoleErrors.length === 0, 
      consoleErrors.length > 0 ? `发现 ${consoleErrors.length} 个错误` : '');
    
    if (consoleErrors.length > 0) {
      console.log('  错误详情:');
      consoleErrors.slice(0, 3).forEach((err, i) => {
        console.log(`    ${i + 1}. ${err.substring(0, 100)}...`);
      });
    }
    
    // 测试14: 网络请求检查
    console.log('\n【测试14】网络请求检查');
    console.log('----------------------------------------');
    
    const failedRequests = [];
    page.on('requestfinished', async request => {
      const response = await request.response();
      if (response && response.status() >= 400) {
        failedRequests.push({
          url: request.url(),
          status: response.status()
        });
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 过滤掉预期的请求失败（如 CloudBase 相关）
    const criticalFailures = failedRequests.filter(req => 
      !req.url.includes('cloudbase') && 
      !req.url.includes('amap') &&
      req.status >= 500
    );
    
    recordTest('关键资源加载成功', criticalFailures.length === 0,
      criticalFailures.length > 0 ? `${criticalFailures.length} 个关键请求失败` : '');
    
    // 输出测试总结
    console.log('\n========================================');
    console.log('测试总结');
    console.log('========================================');
    console.log(`总测试数: ${testResults.passed + testResults.failed}`);
    console.log(`通过: ${testResults.passed}`);
    console.log(`失败: ${testResults.failed}`);
    console.log(`通过率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('========================================');
    
    if (testResults.failed > 0) {
      console.log('\n失败的测试:');
      testResults.details
        .filter(d => !d.passed)
        .forEach(d => console.log(`  - ${d.testName}: ${d.message}`));
    }
    
  } catch (error) {
    console.error('\n测试过程中发生严重错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n测试完成，浏览器已关闭');
  }
}

runCloudTests();
