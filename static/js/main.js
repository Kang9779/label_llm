let currentConversations = [];
let originalFilename = '';

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('请选择文件');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            currentConversations = data.conversations;
            originalFilename = data.filename;  // 保存原始文件名
            displayConversations();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('上传失败');
    });
}

function displayConversations() {
    const container = document.getElementById('conversation-container');
    container.innerHTML = '';

    currentConversations.forEach((conv, index) => {
        const div = document.createElement('div');
        div.className = `conversation-item ${conv.role}-message`;
        
        div.innerHTML = `
            <div class="message-bubble">
                <div class="message-role">${conv.role === 'user' ? '用户' : '助手'}</div>
                <div class="message-content">
                    <p>${conv.content}</p>
                </div>
                <div class="message-actions">
                    <button onclick="editMessage(${index})">编辑</button>
                    <button onclick="deleteMessage(${index})">删除</button>
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function editMessage(index) {
    const messageDiv = document.querySelectorAll('.conversation-item')[index];
    const currentContent = currentConversations[index].content;
    const isUser = currentConversations[index].role === 'user';
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-role">${isUser ? '用户' : '助手'}</div>
            <textarea class="edit-area">${currentContent}</textarea>
            <div class="message-actions">
                <button onclick="saveEdit(${index})">保存</button>
                <button onclick="cancelEdit(${index})">取消</button>
            </div>
        </div>
    `;
}

function saveEdit(index) {
    const textarea = document.querySelector('.edit-area');
    currentConversations[index].content = textarea.value;
    displayConversations();
}

function cancelEdit(index) {
    displayConversations();
}

function deleteMessage(index) {
    if (confirm('确定要删除这条消息吗？')) {
        currentConversations.splice(index, 1);
        displayConversations();
    }
}

function saveConversations() {
    if (!originalFilename) {
        alert('请先上传对话文件');
        return;
    }

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversations: currentConversations,
            filename: originalFilename
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(`保存成功！文件已保存到saves文件夹`);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('保存失败');
    });
} 