from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)
# 修改保存目录为saves
SAVES_FOLDER = 'saves'
if not os.path.exists(SAVES_FOLDER):
    os.makedirs(SAVES_FOLDER)

# 存储任务状态
tasks = {}

# 每页显示的任务数量
TASKS_PER_PAGE = 10

@app.route('/')
def tasks_page():
    return render_template('tasks.html')

@app.route('/annotation/<filename>')
def annotation_page(filename):
    return render_template('annotation.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    page = request.args.get('page', 1, type=int)
    
    # 获取所有任务并按上传时间倒序排序
    sorted_tasks = sorted(
        tasks.items(),
        key=lambda x: x[1]['upload_time'],
        reverse=True
    )
    
    # 计算总页数
    total_tasks = len(sorted_tasks)
    total_pages = (total_tasks + TASKS_PER_PAGE - 1) // TASKS_PER_PAGE
    
    # 获取当前页的任务
    start_idx = (page - 1) * TASKS_PER_PAGE
    end_idx = start_idx + TASKS_PER_PAGE
    current_tasks = dict(sorted_tasks[start_idx:end_idx])
    
    return jsonify({
        'tasks': current_tasks,
        'pagination': {
            'current_page': page,
            'total_pages': total_pages,
            'total_tasks': total_tasks,
            'tasks_per_page': TASKS_PER_PAGE
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    files = request.files.getlist('files[]')
    uploaded_files = []
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for file in files:
        if file.filename == '':
            continue
            
        if file.filename.endswith('.json'):
            try:
                # 保存文件
                filepath = os.path.join(SAVES_FOLDER, file.filename)
                file.save(filepath)
                
                # 添加到任务列表
                tasks[file.filename] = {
                    'filename': file.filename,
                    'status': 'pending',
                    'upload_time': current_time,
                    'complete_time': None
                }
                
                uploaded_files.append(file.filename)
            except Exception as e:
                return jsonify({'error': f'处理文件 {file.filename} 时出错: {str(e)}'}), 400
    
    return jsonify({
        'message': f'成功上传 {len(uploaded_files)} 个文件',
        'files': uploaded_files
    })

@app.route('/api/file/<filename>')
def get_file_content(filename):
    filepath = os.path.join(SAVES_FOLDER, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = json.load(f)
        return jsonify({
            'conversations': content,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'error': f'读取文件失败: {str(e)}'}), 400

@app.route('/api/save', methods=['POST'])
def save_conversations():
    data = request.json
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': '未指定文件名'}), 400
        
    filepath = os.path.join(SAVES_FOLDER, filename)
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data['conversations'], f, ensure_ascii=False, indent=2)
        
        # 更新任务状态和完成时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        tasks[filename]['status'] = 'completed'
        tasks[filename]['complete_time'] = current_time
        
        return jsonify({'message': '保存成功', 'filename': filename})
    except Exception as e:
        return jsonify({'error': f'保存失败: {str(e)}'}), 400

if __name__ == '__main__':
    app.run(debug=True)