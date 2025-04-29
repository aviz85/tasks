class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        
        // DOM Elements
        this.taskForm = document.getElementById('task-form');
        this.taskInput = document.getElementById('task-input');
        this.taskList = document.getElementById('task-list');
        this.tasksCounter = document.getElementById('tasks-counter');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clear-completed');

        // Bind event listeners
        this.taskForm.addEventListener('submit', this.addTask.bind(this));
        this.taskList.addEventListener('click', this.handleTaskClick.bind(this));
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', this.handleFilter.bind(this));
        });
        this.clearCompletedBtn.addEventListener('click', this.clearCompleted.bind(this));

        // Initial render
        this.renderTasks();
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(e) {
        e.preventDefault();
        const taskText = this.taskInput.value.trim();
        
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date()
            };

            this.tasks.unshift(newTask);
            this.saveToLocalStorage();
            this.renderTasks();
            this.taskInput.value = '';
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveToLocalStorage();
        this.renderTasks();
    }

    toggleTask(taskId) {
        this.tasks = this.tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        this.saveToLocalStorage();
        this.renderTasks();
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveToLocalStorage();
        this.renderTasks();
    }

    handleTaskClick(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);
        const deleteButton = e.target.closest('.delete-btn');

        if (deleteButton) {
            this.deleteTask(taskId);
        } else if (e.target.classList.contains('task-checkbox')) {
            this.toggleTask(taskId);
        }
    }

    handleFilter(e) {
        const filterType = e.target.dataset.filter;
        this.currentFilter = filterType;

        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });

        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');

        // Update counter
        const activeTasks = this.tasks.filter(task => !task.completed).length;
        this.tasksCounter.textContent = `${activeTasks} משימות נותרו`;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 