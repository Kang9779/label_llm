from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)
# 修改保存目录为saves
SAVES_FOLDER = 'saves'
if not os.path.exists(SAVES_FOLDER):
    os.makedirs(SAVES_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
        
    if file and file.filename.endswith('.json'):
        try:
            conversations = json.load(file)
            return jsonify({
                'conversations': conversations,
                'filename': file.filename  # 返回原始文件名
            })
        except json.JSONDecodeError:
            return jsonify({'error': 'JSON格式错误'}), 400
    else:
        return jsonify({'error': '请上传JSON文件'}), 400

@app.route('/save', methods=['POST'])
def save_conversations():
    data = request.json
    # 直接使用原始文件名保存
    filename = data.get('filename', 'conversation.json')
    filepath = os.path.join(SAVES_FOLDER, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data['conversations'], f, ensure_ascii=False, indent=2)
        
    return jsonify({'message': '保存成功', 'filename': filename})

if __name__ == '__main__':
    app.run(debug=True)