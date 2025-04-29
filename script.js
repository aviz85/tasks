// Initialize Supabase client
const supabaseUrl = 'https://cmehmlfpysyyxdocwtex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZWhtbGZweXN5eXhkb2N3dGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTY5MTYsImV4cCI6MjA2MTQ3MjkxNn0.YAVH39c0hqB_jBIMeXzNi-G05jO7pEWkCTqW5hbWtqI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        
        // DOM Elements
        this.taskInput = document.getElementById('task-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskList = document.getElementById('task-list');
        this.tasksCounter = document.getElementById('tasks-counter');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clear-completed');

        // Bind event listeners with console logs for debugging
        this.addTaskBtn.addEventListener('click', () => {
            console.log('Add button clicked');
            this.addTask();
        });
        
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter pressed');
                e.preventDefault();
                this.addTask();
            }
        });
        
        this.taskList.addEventListener('click', this.handleTaskClick.bind(this));
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', this.handleFilter.bind(this));
        });
        this.clearCompletedBtn.addEventListener('click', this.clearCompleted.bind(this));

        // Initial load
        this.loadTasks();
        console.log('TodoApp initialized');
    }

    async loadTasks() {
        try {
            console.log('Loading tasks...');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            this.tasks = data || [];
            this.renderTasks();
            console.log('Tasks loaded:', this.tasks.length);
        } catch (error) {
            console.error('Error loading tasks:', error);
            alert('שגיאה בטעינת המשימות. נסה לרענן את הדף.');
        }
    }

    async addTask() {
        console.log('Adding new task...');
        const taskText = this.taskInput.value.trim();
        if (!taskText) {
            console.log('Task text is empty');
            return;
        }
        
        try {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                created_at: new Date().toISOString()
            };

            console.log('Sending task to Supabase:', newTask);
            const { data, error } = await supabase
                .from('tasks')
                .insert([newTask])
                .select()
                .single();

            if (error) throw error;

            console.log('Task added successfully:', data);
            this.tasks.unshift(data);
            this.renderTasks();
            this.taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
            alert('שגיאה בהוספת המשימה. נסה שוב.');
        }
    }

    async deleteTask(taskId) {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = !task.completed;

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ completed: newStatus })
                .eq('id', taskId);

            if (error) throw error;

            this.tasks = this.tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, completed: newStatus };
                }
                return task;
            });
            this.renderTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    async clearCompleted() {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('completed', true);

            if (error) throw error;

            this.tasks = this.tasks.filter(task => !task.completed);
            this.renderTasks();
        } catch (error) {
            console.error('Error clearing completed tasks:', error);
        }
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