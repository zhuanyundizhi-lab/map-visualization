import pandas as pd

# 读取 Excel 文件
file_path = '3月15日后锁星不足告警清单.xlsx'
df = pd.read_excel(file_path, sheet_name=None)

# 查看所有 sheet
print("Sheet 列表:")
for sheet_name in df.keys():
    print(f"  - {sheet_name}")

# 查看第一个 sheet 的数据
first_sheet = list(df.keys())[0]
print(f"\n=== {first_sheet} ===")
print(f"行数: {len(df[first_sheet])}")
print(f"列名: {df[first_sheet].columns.tolist()}")
print("\n前5行数据:")
print(df[first_sheet].head())
print("\n数据类型:")
print(df[first_sheet].dtypes)
