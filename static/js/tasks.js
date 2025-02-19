let currentPage = 1;
let totalPages = 1;

function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请选择文件');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            loadTasks(1);  // 上传成功后返回第一页
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('上传失败');
    });
}

function loadTasks(page = 1) {
    fetch(`/api/tasks?page=${page}`)
    .then(response => response.json())
    .then(data => {
        displayTasks(data.tasks);
        updatePagination(data.pagination);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('加载任务列表失败');
    });
}

function displayTasks(tasks) {
    const container = document.getElementById('task-container');
    container.innerHTML = '';

    Object.entries(tasks).forEach(([filename, task]) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${task.filename}</td>
            <td>${task.upload_time || '-'}</td>
            <td>${task.complete_time || '-'}</td>
            <td>
                <span class="status-badge ${task.status === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${task.status === 'completed' ? '已完成' : '待标注'}
                </span>
            </td>
            <td>
                <a class="task-action" onclick="window.location.href='/annotation/${filename}'">
                    ${task.status === 'completed' ? '查看' : '标注'}
                </a>
            </td>
        `;
        
        container.appendChild(tr);
    });
}

function updatePagination(pagination) {
    currentPage = pagination.current_page;
    totalPages = pagination.total_pages;
    
    document.getElementById('total-tasks').textContent = pagination.total_tasks;
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    // 更新按钮状态
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function changePage(direction) {
    let newPage = currentPage;
    if (direction === 'prev' && currentPage > 1) {
        newPage = currentPage - 1;
    } else if (direction === 'next' && currentPage < totalPages) {
        newPage = currentPage + 1;
    }
    
    if (newPage !== currentPage) {
        loadTasks(newPage);
    }
}

// 页面加载时加载第一页任务列表
document.addEventListener('DOMContentLoaded', () => loadTasks(1)); 