# algorithms.py

import time
import sys

sys.setrecursionlimit(2000)

# 輔助函式：記錄動畫步驟
def record_step(arr, animation_steps, compared=None, swapped=None, sorted_indices=None, pivot=None, active=None):
    step = {
        'array': list(arr),   # 紀錄當前陣列狀態
        'compared': compared, # 標示被比較的索引 (例如 [j, j+1])
        'swapped': swapped,   # 標示被交換的索引 (例如 [j, j+1])
        'sorted_indices': sorted_indices, # 標示已排序完成的索引
        'pivot': pivot,       # 標示快速排序的基準點索引
        'active': active      # 標示當前活躍的索引 (例如插入排序的插入位置)
    }
    animation_steps.append(step)


# ==================================
# -------------氣泡排序--------------
# ==================================
def bubble_sort(array):
    arr_copy = list(array)
    n = len(arr_copy)
    swaps = 0
    comparisons = 0
    animation_steps = []
    
    start_time = time.perf_counter()
    
    # 紀錄初始狀態
    record_step(arr_copy, animation_steps)
    
    for i in range(n - 1):
        swapped_in_pass = False
        sorted_indices_in_pass = list(range(n - i, n)) # 紀錄已排序的尾部
        
        for j in range(0, n - i - 1):
            comparisons += 1
            # 紀錄比較步驟
            record_step(arr_copy, animation_steps, compared=[j, j+1], sorted_indices=sorted_indices_in_pass)
            
            if arr_copy[j] > arr_copy[j + 1]:
                arr_copy[j], arr_copy[j + 1] = arr_copy[j + 1], arr_copy[j]
                swaps += 1
                swapped_in_pass = True
                # 紀錄交換步驟
                record_step(arr_copy, animation_steps, swapped=[j, j+1], sorted_indices=sorted_indices_in_pass)
        
        # 每完成一輪，最右邊的元素就確定了
        sorted_indices_in_pass = list(range(n - i - 1, n)) # 更新已排序的尾部
        record_step(arr_copy, animation_steps, sorted_indices=sorted_indices_in_pass) # 標記本輪已排序
        
        if not swapped_in_pass:
            break
            
    # 標記所有元素為已排序
    record_step(arr_copy, animation_steps, sorted_indices=list(range(n)))
    
    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000
    
    return arr_copy, exe_time, comparisons, swaps, animation_steps

# ==================================
# -------------插入排序--------------
# ==================================
def insertion_sort(array):
    arr_copy = list(array)
    length = len(arr_copy)
    swaps = 0 # 這裡的交換次數可能與移動次數不同，看你如何定義
    comparisons = 0
    animation_steps = []

    start_time = time.perf_counter()

    record_step(arr_copy, animation_steps, active=[0]) # 初始第一個元素視為已排序

    for i in range(1, length):
        key = arr_copy[i]
        j = i - 1
        
        # 紀錄當前要插入的元素
        record_step(arr_copy, animation_steps, active=[i], sorted_indices=list(range(i)))

        while j >= 0 and key < arr_copy[j]:
            comparisons += 1
            # 紀錄比較和移動
            record_step(arr_copy, animation_steps, compared=[j, i], active=[j, i], sorted_indices=list(range(i)))
            
            arr_copy[j + 1] = arr_copy[j]
            swaps += 1 # 這裡計數為移動
            j -= 1
            record_step(arr_copy, animation_steps, active=[j+1], sorted_indices=list(range(i))) # 紀錄移動後的狀態

        arr_copy[j + 1] = key
        # 紀錄插入位置
        record_step(arr_copy, animation_steps, active=[j+1], sorted_indices=list(range(i+1)))


    record_step(arr_copy, animation_steps, sorted_indices=list(range(length))) # 標記所有元素為已排序
    
    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000

    return arr_copy,  exe_time, comparisons, swaps, animation_steps


# ==================================
# -------------快速排序--------------
# ==================================
# 快速排序由於是遞迴，需要修改輔助函式來傳遞 animation_steps
def quick_sort(array):
    arr_copy = list(array)
    comparisons = [0] # 用列表傳遞，以便在遞迴中修改
    swaps = [0]
    animation_steps = []
    
    start_time = time.perf_counter()
    
    record_step(arr_copy, animation_steps) # 紀錄初始狀態
    
    _quick_sort_recursive_with_steps(arr_copy, 0, len(arr_copy) - 1, comparisons, swaps, animation_steps)
    
    # 標記所有元素為已排序
    record_step(arr_copy, animation_steps, sorted_indices=list(range(len(arr_copy))))
    
    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000
    
    return arr_copy,  exe_time, comparisons[0], swaps[0], animation_steps

def _quick_sort_recursive_with_steps(arr, low, high, comparisons, swaps, animation_steps, sorted_indices=None):
    if sorted_indices is None:
        sorted_indices = []

    if low < high:
        pi = _partition_with_steps(arr, low, high, comparisons, swaps, animation_steps, sorted_indices)
        _quick_sort_recursive_with_steps(arr, low, pi - 1, comparisons, swaps, animation_steps, sorted_indices)
        _quick_sort_recursive_with_steps(arr, pi + 1, high, comparisons, swaps, animation_steps, sorted_indices)
    else:
        # 單一元素或空區間，視為已排序
        if low == high and low not in sorted_indices:
            sorted_indices.append(low)
            record_step(arr, animation_steps, sorted_indices=sorted_indices)


def _partition_with_steps(arr, low, high, comparisons, swaps, animation_steps, sorted_indices):
    pivot_val = arr[high]
    i = low - 1
    
    # 紀錄基準點
    record_step(arr, animation_steps, pivot=high, active=list(range(low, high + 1)), sorted_indices=sorted_indices)

    for j in range(low, high):
        comparisons[0] += 1
        # 紀錄比較
        record_step(arr, animation_steps, compared=[j, high], active=[i + 1, j], pivot=high, sorted_indices=sorted_indices)
        
        if arr[j] <= pivot_val:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
            swaps[0] += 1
            # 紀錄交換
            record_step(arr, animation_steps, swapped=[i, j], active=[i + 1, j], pivot=high, sorted_indices=sorted_indices)
    
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    swaps[0] += 1
    
    # 基準點歸位
    record_step(arr, animation_steps, swapped=[i + 1, high], pivot=i+1, sorted_indices=sorted_indices)
    
    # 基準點現在已在最終位置
    if (i + 1) not in sorted_indices:
        sorted_indices.append(i + 1)
        record_step(arr, animation_steps, sorted_indices=sorted_indices)


    return i + 1

# ==================================
# -------------選擇排序--------------
# ==================================
def selection_sort(array):
    arr_copy = list(array)
    n = len(arr_copy)
    swaps = 0
    comparisons = 0
    animation_steps = []

    start_time = time.perf_counter()
    record_step(arr_copy, animation_steps) # 紀錄初始狀態

    for i in range(n - 1):
        min_idx = i
        # 紀錄當前回合的起始元素為活躍
        record_step(arr_copy, animation_steps, active=[i], sorted_indices=list(range(i)))

        for j in range(i + 1, n):
            comparisons += 1
            # 紀錄比較步驟
            record_step(arr_copy, animation_steps, compared=[min_idx, j], active=[i], sorted_indices=list(range(i)))
            
            if arr_copy[j] < arr_copy[min_idx]:
                min_idx = j
                # 紀錄新的最小元素 (可選擇是否要特別標記)
                record_step(arr_copy, animation_steps, active=[i, min_idx], sorted_indices=list(range(i)))
        
        if min_idx != i:
            arr_copy[i], arr_copy[min_idx] = arr_copy[min_idx], arr_copy[i]
            swaps += 1
            # 紀錄交換步驟
            record_step(arr_copy, animation_steps, swapped=[i, min_idx], sorted_indices=list(range(i)))
        
        # 紀錄當前元素已排序
        record_step(arr_copy, animation_steps, sorted_indices=list(range(i + 1)))

    # 標記所有元素為已排序
    record_step(arr_copy, animation_steps, sorted_indices=list(range(n)))
    
    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000

    return arr_copy,  exe_time, comparisons, swaps, animation_steps


# ==================================
# -------------合併排序--------------
# ==================================
def merge_sort(array):
    arr_copy = list(array)
    comparisons = [0]
    swaps = [0] # 合併排序通常不算"交換"，而是移動，這裡計數移動次數
    animation_steps = []

    start_time = time.perf_counter()
    record_step(arr_copy, animation_steps) # 紀錄初始狀態

    _merge_sort_recursive_with_steps(arr_copy, 0, len(arr_copy) - 1, comparisons, swaps, animation_steps)
    
    # 合併排序後，最終的 arr_copy 已經是排序好的，所以可以直接標記
    record_step(arr_copy, animation_steps, sorted_indices=list(range(len(arr_copy))))

    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000

    return arr_copy,  exe_time, comparisons[0], swaps[0], animation_steps


def _merge_sort_recursive_with_steps(arr, start_idx, end_idx, comparisons, swaps, animation_steps):
    if start_idx < end_idx:
        mid_idx = (start_idx + end_idx) // 2
        
        # 紀錄遞迴分割的活躍區間
        record_step(arr, animation_steps, active=list(range(start_idx, end_idx + 1)))

        _merge_sort_recursive_with_steps(arr, start_idx, mid_idx, comparisons, swaps, animation_steps)
        _merge_sort_recursive_with_steps(arr, mid_idx + 1, end_idx, comparisons, swaps, animation_steps)
        
        _merge_with_steps(arr, start_idx, mid_idx, end_idx, comparisons, swaps, animation_steps)


def _merge_with_steps(arr, start_idx, mid_idx, end_idx, comparisons, swaps, animation_steps):
    left_half = arr[start_idx : mid_idx + 1]
    right_half = arr[mid_idx + 1 : end_idx + 1]

    i = 0  # index for left_half
    j = 0  # index for right_half
    k = start_idx  # index for merged_array (original arr)

    # 紀錄合併操作的活躍區間
    record_step(arr, animation_steps, active=list(range(start_idx, end_idx + 1)))

    while i < len(left_half) and j < len(right_half):
        comparisons[0] += 1
        
        # 紀錄比較兩個子陣列的元素
        record_step(arr, animation_steps, compared=[start_idx + i, mid_idx + 1 + j], active=list(range(start_idx, end_idx + 1)))

        if left_half[i] <= right_half[j]:
            arr[k] = left_half[i]
            i += 1
        else:
            arr[k] = right_half[j]
            j += 1
        swaps[0] += 1 # 這裡計數為移動操作
        k += 1
        # 紀錄合併後的狀態
        record_step(arr, animation_steps, active=list(range(start_idx, k)), sorted_indices=list(range(start_idx,k)))


    while i < len(left_half):
        arr[k] = left_half[i]
        swaps[0] += 1
        i += 1
        k += 1
        record_step(arr, animation_steps, active=list(range(start_idx, k)), sorted_indices=list(range(start_idx,k)))


    while j < len(right_half):
        arr[k] = right_half[j]
        swaps[0] += 1
        j += 1
        k += 1
        record_step(arr, animation_steps, active=list(range(start_idx, k)), sorted_indices=list(range(start_idx,k)))

    # 標記合併完成的區間為已排序
    record_step(arr, animation_steps, sorted_indices=list(range(start_idx, end_idx + 1)))


# ==================================
# -------------堆積排序--------------
# ==================================
def heap_sort(array):
    arr_copy = list(array)
    n = len(arr_copy)
    comparisons = [0]
    swaps = [0]
    animation_steps = []

    start_time = time.perf_counter()
    record_step(arr_copy, animation_steps) # 紀錄初始狀態

    # 建立最大堆積
    for i in range(n // 2 - 1, -1, -1):
        _heapify_with_steps(arr_copy, n, i, comparisons, swaps, animation_steps)
        record_step(arr_copy, animation_steps, active=[i]) # 標記當前處理的根節點

    # 一個個將元素從堆積中取出
    for i in range(n - 1, 0, -1):
        arr_copy[i], arr_copy[0] = arr_copy[0], arr_copy[i]
        swaps[0] += 1
        # 紀錄交換堆頂元素和最後一個元素
        record_step(arr_copy, animation_steps, swapped=[i, 0], sorted_indices=list(range(i+1, n)))
        
        _heapify_with_steps(arr_copy, i, 0, comparisons, swaps, animation_steps, sorted_indices=list(range(i+1, n)))
        
        # 標記當前元素已排序
        record_step(arr_copy, animation_steps, sorted_indices=list(range(i, n)))


    record_step(arr_copy, animation_steps, sorted_indices=list(range(n))) # 標記所有元素為已排序

    end_time = time.perf_counter()
    exe_time = (end_time - start_time) * 1000000

    return arr_copy, exe_time, comparisons[0], swaps[0], animation_steps

def _heapify_with_steps(arr, n, i, comparisons, swaps, animation_steps, sorted_indices=None):
    if sorted_indices is None:
        sorted_indices = []

    largest = i
    left = 2 * i + 1
    right = 2 * i + 2
    
    # 紀錄比較父節點與左右子節點
    record_step(arr, animation_steps, compared=[i], active=[left, right] if left < n or right < n else None, sorted_indices=sorted_indices)

    if left < n:
        comparisons[0] += 1
        if arr[left] > arr[largest]:
            largest = left
    
    if right < n:
        comparisons[0] += 1
        if arr[right] > arr[largest]:
            largest = right
    
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        swaps[0] += 1
        # 紀錄交換
        record_step(arr, animation_steps, swapped=[i, largest], sorted_indices=sorted_indices)
        _heapify_with_steps(arr, n, largest, comparisons, swaps, animation_steps, sorted_indices)