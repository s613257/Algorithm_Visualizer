import random

def generate_and_save_data(filename, num_samples):
    """
    生成數據並存入指定檔案。
    
    參數:
    - filename: 輸出的檔案名稱 (例如: 'data_1000.txt')
    - num_samples: 需要生成的數據筆數
    """
    data = []
    
    # 資料標頭
    header = "feature1,feature2,target_class"
    data.append(header)
    
    # 每個類別生成 1/3 的資料
    samples_per_class = num_samples // 3
    
    # 生成 Class A 的資料
    for _ in range(samples_per_class):
        f1 = random.randint(4, 28)
        f2 = random.randint(13, 38)
        data.append(f"{f1},{f2},class_A")
        
    # 生成 Class B 的資料
    for _ in range(samples_per_class):
        f1 = random.randint(4, 28)
        f2 = random.randint(13, 38)
        data.append(f"{f1},{f2},class_B")
        
    # 生成 Class C 的資料 (處理餘數)
    for _ in range(num_samples - 2 * samples_per_class):
        f1 = random.randint(4, 28)
        f2 = random.randint(13, 38)
        data.append(f"{f1},{f2},class_C")
        
    # 將數據寫入檔案
    try:
        with open(filename, 'w') as f:
            for line in data:
                f.write(line + '\n')
        print(f"成功生成檔案 '{filename}'，共 {num_samples} 筆資料。")
    except Exception as e:
        print(f"寫入檔案時發生錯誤: {e}")

# 執行函式，生成一個名為 data_1000.txt 的檔案
generate_and_save_data('data_1000.txt', 1000)