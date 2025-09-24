import pandas as pd
from sklearn.cluster import KMeans
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

def perform_clustering(df, n_clusters=3):
    """
    執行 K-Means 分群演算法
    
    Args:
        df (pd.DataFrame): 包含數值特徵的 DataFrame
        n_clusters (int): 分群的數量

    Returns:
        pd.DataFrame: 原始資料加上 'cluster' 標籤
    """
    # 移除非數值欄位，只留下數值特徵進行分群
    # 這一步很重要，因為 K-Means 只能處理數值資料
    numeric_df = df.select_dtypes(include=['number'])
    
    if numeric_df.empty:
        raise ValueError("資料中沒有數值欄位可以進行分群。")

    # 標準化資料
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)
    
    # 執行 K-Means 分群
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
    df['cluster'] = kmeans.fit_predict(scaled_data)
    
    return df

def perform_classification(df, target_field_name):
    """
    執行決策樹分類演算法，並回傳訓練、測試與分析結果。
    Args:
        df (pd.DataFrame): 包含特徵和目標標籤的 DataFrame。
        target_field_name (str): 目標欄位的名稱。
    Returns:
        dict: 包含準確率、訓練集、測試集以及整體分類結果的字典。
    """
    # 檢查目標欄位是否存在
    if target_field_name not in df.columns:
        raise ValueError(f"指定的目標欄位 '{target_field_name}' 不存在於資料中。")

    # 根據目標欄位名稱來分割特徵和目標
    y = df[target_field_name]
    X = df.drop(columns=[target_field_name])

    # --- 1. 目標標籤編碼 ---
    # 檢查目標標籤是否為數值型，如果不是，則進行編碼
    if y.dtype == 'object' or y.dtype == 'string':
        y_encoded, y_labels = pd.factorize(y)
    else:
        y_encoded = y
        y_labels = y.unique()

    # --- 2. 特徵資料預處理 ---
    # 區分數值型和類別型特徵
    numerical_features = X.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'string']).columns.tolist()

    X_processed = X.copy()

    if categorical_features:
        # 使用 One-Hot Encoding 處理類別型特徵
        encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        encoded_features = encoder.fit_transform(X[categorical_features])

        # 取得編碼後的新欄位名稱
        encoded_feature_names = encoder.get_feature_names_out(categorical_features)
        encoded_df = pd.DataFrame(encoded_features, columns=encoded_feature_names, index=X.index)

        # 將編碼後的特徵與數值型特徵合併
        # 這裡使用 pd.concat 並在 axis=1 上處理，可以確保索引對齊
        X_processed = pd.concat([X[numerical_features].reset_index(drop=True), encoded_df.reset_index(drop=True)], axis=1)
    else:
        X_processed = X[numerical_features]

    # 檢查處理後的特徵資料是否為空
    if X_processed.empty:
        raise ValueError("資料中沒有可用的數值或可編碼的類別特徵。")

    # --- 3. 分割資料集 ---
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y_encoded, test_size=0.3, random_state=42)

    # --- 4. 建立並訓練模型 ---
    clf = DecisionTreeClassifier(random_state=42)
    clf.fit(X_train, y_train)

    # --- 5. 進行預測並計算準確率 ---
    y_pred_encoded = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred_encoded)

    # --- 6. 準備回傳資料給前端 ---
    # 由於特徵資料經過 One-Hot Encoding，我們需要將預測結果合併回原始資料
    # 首先確保 X_test 的索引與原始 df 匹配
    original_indices = df.index
    train_indices = X_train.index
    test_indices = X_test.index

    # 建立一個空 DataFrame 來存放所有結果
    combined_results_df = df.copy()
    combined_results_df['is_train'] = False
    combined_results_df.loc[train_indices, 'is_train'] = True

    # 將編碼後的預測結果轉換回原始標籤
    combined_results_df['predicted_class'] = '' # 初始化欄位
    combined_results_df.loc[train_indices, 'predicted_class'] = [y_labels[i] for i in clf.predict(X_train)]
    combined_results_df.loc[test_indices, 'predicted_class'] = [y_labels[i] for i in y_pred_encoded]

    # 計算整體預測結果分佈，方便 chart.js 繪圖
    class_distribution = pd.Series(combined_results_df['predicted_class']).value_counts().to_dict()

    return {
        'accuracy': accuracy,
        'results_table_data': combined_results_df.to_dict('records'),
        'class_distribution': class_distribution
    }
