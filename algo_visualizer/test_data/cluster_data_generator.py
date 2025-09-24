import numpy as np
import pandas as pd

def generate_cluster_data(n_samples=500, n_clusters=5, random_state=42):
    """
    生成多個群集的分群測試資料。
    
    Args:
        n_samples (int): 總資料點數量。
        n_clusters (int): 要生成的群集數量。
        random_state (int): 隨機種子，確保結果可重現。
        
    Returns:
        pd.DataFrame: 包含 'x' 和 'y' 欄位的 DataFrame。
    """
    np.random.seed(random_state)
    
    data = []
    # 為每個群集生成不同的中心點
    centers = np.random.uniform(low=1, high=10, size=(n_clusters, 2))
    
    # 每個群集的樣本數
    samples_per_cluster = n_samples // n_clusters
    
    for i in range(n_clusters):
        # 圍繞中心點生成資料，並加入一些隨機雜訊
        cluster_x = centers[i, 0] + np.random.randn(samples_per_cluster) * 0.5
        cluster_y = centers[i, 1] + np.random.randn(samples_per_cluster) * 0.5
        
        for j in range(samples_per_cluster):
            data.append([cluster_x[j], cluster_y[j]])
            
    df = pd.DataFrame(data, columns=['x', 'y'])
    
    # 打亂資料順序，以避免K-Means初始值問題
    df = df.sample(frac=1).reset_index(drop=True)
    
    return df

# 生成並儲存為 CSV 檔案
df_5_clusters = generate_cluster_data(n_clusters=5)
df_5_clusters.to_csv('clustering_data_5_clusters.csv', index=False)
print("已成功生成 'clustering_data_5_clusters.csv' 檔案。")
print(df_5_clusters.head())