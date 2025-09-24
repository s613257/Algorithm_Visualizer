from flask import Flask, render_template, request, jsonify
from algorithms import bubble_sort, insertion_sort, selection_sort, quick_sort, merge_sort, heap_sort
from clustering import perform_clustering, perform_classification
import pandas as pd
import io

# 建立一個 Flask 應用程式實例
app = Flask(__name__)

# 定義一個路由，當使用者訪問根目錄 (/) 時，會執行這個函式
@app.route('/')
def index():
    return render_template('index.html')

# 演算法複雜度資訊
ALGORITHM_COMPLEXITY = {
    'bubble': {
        'time': {
            'best': 'O(n)',
            'average': 'O(n²)',
            'worst': 'O(n²)'
        },
        'space': 'O(1)'
    },
    'insertion': {
        'time': {
            'best': 'O(n)',
            'average': 'O(n²)',
            'worst': 'O(n²)'
        },
        'space': 'O(1)'
    },
    'selection': {
        'time': {
            'best': 'O(n²)',
            'average': 'O(n²)',
            'worst': 'O(n²)'
        },
        'space': 'O(1)'
    },
    'quick': {
        'time': {
            'best': 'O(n log n)',
            'average': 'O(n log n)',
            'worst': 'O(n²)'
        },
        'space': 'O(log n) to O(n)'
    },
    'merge': {
        'time': {
            'best': 'O(n log n)',
            'average': 'O(n log n)',
            'worst': 'O(n log n)'
        },
        'space': 'O(n)'
    },
    'heap': {
        'time': {
            'best': 'O(n log n)',
            'average': 'O(n log n)',
            'worst': 'O(n log n)'
        },
        'space': 'O(1)'
    }
}


def get_complexity_type(algorithm_name, count, n):
    """根據操作次數判斷是最佳、平均或最差情況"""

    # --- 氣泡排序 ---
    if algorithm_name == 'bubble':
        # 最佳: 陣列已排序，只需一輪掃描，比較的次數為 n-1
        if count <= n - 1:
            return '最佳'
        # 最差: 陣列完全逆序，比較的次數約為 n^2/2
        elif count >= n * (n - 1) / 2:
            return '最差'
        else:
            return '平均'

    # --- 插入排序 ---
    elif algorithm_name == 'insertion':
        # 最佳: 陣列已排序，每輪只需一次比較
        if count <= n - 1:
            return '最佳'
        # 最差: 陣列完全逆序，每輪都需從頭比較到尾
        elif count >= n * (n - 1) / 2:
            return '最差'
        else:
            return '平均'

    # --- 選擇排序 ---
    elif algorithm_name == 'selection':
        # 選擇排序的比較次數永遠是固定的，與輸入數據的順序無關
        # 最差/平均/最佳情況的比較次數皆為 n * (n - 1) / 2
        # 我們可以簡化邏輯，直接回傳'平均'，因為它沒有最佳或最差情況
        return '平均'
    
    # --- 快速排序 ---
    elif algorithm_name == 'quick':
        # 最佳/平均: 每次分割都均勻，比較次數約為 n log n
        # 我們會設定一個合理的閾值來判斷
        if count <= n * (n + 1) / 2: # 最差情況的比較次數
            # 由於快排的平均與最佳情況次數相近，這裡可以將其視為一類
            return '平均/最佳'
        else:
            # 當比較次數超過一個合理範圍時，可能進入最差情況
            return '最差'

    # --- 合併排序 ---
    elif algorithm_name == 'merge':
        # 合併排序的比較次數在所有情況下都非常接近 n log n
        # 與選擇排序類似，合併排序沒有明顯的最佳或最差情況
        return '平均'
    
    # --- 堆積排序 ---
    elif algorithm_name == 'heap':
        # 堆積排序的比較次數在所有情況下都約為 n log n
        # 因此，通常不區分最佳、平均、最差情況
        return '平均'
    
    return '無法判斷'

@app.route('/sort', methods=['POST'])
def sort_data():
    try:
        # 從 POST 請求中獲取 JSON 資料
        data = request.get_json()
        numbers = data.get('numbers', [])
        # 取得演算法名稱，預設為 bubble
        algorithm_name = data.get('algorithm', 'bubble') 
        
        # 複製一份原始資料以供回傳
        original_numbers = list(numbers)
        
        # 使用字典來映射演算法名稱到對應的函式
        algorithms_map = {
            'bubble': bubble_sort,
            'insertion': insertion_sort,
            'selection': selection_sort,
            'quick': quick_sort,
            'merge': merge_sort,
            'heap': heap_sort,
        }

        # 根據演算法名稱，從字典中獲取對應的函式
        algorithm_func = algorithms_map.get(algorithm_name)

        # 檢查函式是否存在
        if not algorithm_func:
            return jsonify({'error': '無效的演算法'}), 400

        # 呼叫選定的函式
        sorted_numbers, time_taken, comparisons, swaps, animation_steps = algorithm_func(numbers)
        n = len(numbers)
        time_complexity_type = get_complexity_type(algorithm_name, comparisons, n)

        # 取得複雜度資訊
        complexity_info = ALGORITHM_COMPLEXITY.get(algorithm_name, {}) # 仍然從後端獲取，確保一致性
        space_complexity = complexity_info.get('space')

        # 回傳排序結果、執行時間和複雜度資訊
        return jsonify({
            'original_data': original_numbers,
            'sorted_data': sorted_numbers,
            'time_taken': time_taken,
            'time_complexity_type': time_complexity_type,
            'space_complexity': space_complexity, 
            'comparisons': comparisons,
            'swaps': swaps,
            'animation_steps': animation_steps 
        })
    except Exception as e:
        # 如果發生錯誤，回傳錯誤訊息
        return jsonify({'error': str(e)}), 400
    
@app.route('/analyze', methods=['POST'])
def analyze_data():
    """處理分類與分群的請求"""
    try:
        # 1. 從請求中獲取上傳的檔案和演算法類型
        file = request.files.get('file')
        analysis_type = request.form.get('type')

        if not file or not analysis_type:
            return jsonify({'error': '缺少檔案或演算法類型'}), 400

        # 2. 根據檔案副檔名讀取為 Pandas DataFrame
        filename = file.filename.lower()
        if filename.endswith(('.csv', '.txt')):
            # 使用 utf-8 解碼，並用 io.StringIO 包裝
            df = pd.read_csv(io.StringIO(file.stream.read().decode('utf-8')))
        elif filename.endswith('.json'):
            # 處理 JSON 檔案
            df = pd.read_json(file.stream.read().decode('utf-8'))
        else:
            return jsonify({'error': '不支援的檔案格式，目前只支援 CSV、TXT 和 JSON 檔案'}), 400
        
        # 3. 根據不同的演算法類型執行對應的函式
        if analysis_type == 'clustering':
            
            result_df = perform_clustering(df)
          
            # 將結果轉換為 JSON 格式
            result_json = {
                'analysis_type': 'clustering',
                'results_table': result_df.to_dict('records')
            }

            return jsonify(result_json)
            
        elif analysis_type == 'classification':
            # 從前端獲取目標欄位名稱，如果不存在則使用預設值 'target_class'
            target_field = request.form.get('target_field', 'target_class')
            
            # 呼叫分類函式並傳入目標欄位
            result_data = perform_classification(df, target_field)
            
            # 將結果轉換為 JSON 格式
            result_json = {
                'analysis_type': 'classification',
                # 這裡直接傳回浮點數，由前端負責格式化，這樣更靈活
                'accuracy': result_data['accuracy'], 
                # 將前端 `results_table` 名稱改為 `results_table_data`，
                # 與分群的回傳資料結構保持一致，方便前端處理
                'results_table_data': result_data['results_table_data']
            }
            return jsonify(result_json)

        else:
            return jsonify({'error': '無效的分析類型'}), 400

    except Exception as e:
        # 捕獲更廣泛的錯誤並回傳，提供更詳細的訊息
        return jsonify({'error': f"分析過程發生錯誤: {e}"}), 400

# 判斷是否為主程式執行，如果是就啟動伺服器
if __name__ == '__main__':
    app.run(debug=True)