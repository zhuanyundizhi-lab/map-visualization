import pandas as pd
import json

# 读取 Excel 文件
file_path = '3月15日后锁星不足告警清单.xlsx'
df = pd.read_excel(file_path, sheet_name='3月15日后锁星不足告警清单')

# 转换为字典列表
data = df.to_dict('records')

# 保存为 JSON
with open('data/sample.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'成功转换 {len(data)} 条数据到 data/sample.json')

# 显示数据示例
print('\n数据示例（前3条）:')
for i, item in enumerate(data[:3]):
    print(f'\n[{i+1}] {item}')
