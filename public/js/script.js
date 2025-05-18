import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAGmVeynu98RqXgwc6UAOm2XY7ptPt6B-4",
    authDomain: "software-design-37ad2.firebaseapp.com",
    projectId: "software-design-37ad2",
    storageBucket: "software-design-37ad2.appspot.com",
    messagingSenderId: "696237853903",
    appId: "1:696237853903:web:11bb6f07d8cbb63e273bba"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    const pomodoroBtn = document.getElementById('pomodoro-btn');
    const shortBreakBtn = document.getElementById('short-break-btn');
    const longBreakBtn = document.getElementById('long-break-btn');
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const selectedTaskDisplay = document.getElementById('selected-task-name');
    const themeBtn = document.getElementById('theme-btn');
    const authBtn = document.getElementById('auth-btn');
    const userEmail = document.getElementById('user-email');
    const timerSound = document.getElementById('timer-sound');
    const completeSound = document.getElementById('complete-sound');
    
    // Auth Modal Elements
    const authModal = document.getElementById('auth-modal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const googleAuthBtn = document.getElementById('google-auth-btn');
    
    // Settings
    const pomodoroTimeInput = document.getElementById('pomodoro-time');
    const shortBreakTimeInput = document.getElementById('short-break-time');
    const longBreakTimeInput = document.getElementById('long-break-time');
    const soundToggle = document.getElementById('sound-toggle');
    
    // State variables
    let timer;
    let timeLeft = 25 * 60;
    let isRunning = false;
    let currentMode = 'pomodoro';
    let selectedTaskId = null;
    let tasks = [];
    let isLightTheme = false;
    
    // Initialize
    updateTimerDisplay();
    loadTheme();
    
    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authBtn.textContent = 'Выйти';
            if (userEmail) {
                userEmail.textContent = user.email;
                userEmail.style.display = 'block';
            }
            loadUserData(user.uid);
            authModal.style.display = 'none';
        } else {
            authBtn.textContent = 'Войти';
            if (userEmail) userEmail.style.display = 'none';
            loadLocalData();
        }
    });
    
    // Timer Event Handlers
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Mode Buttons
    pomodoroBtn.addEventListener('click', () => switchMode('pomodoro'));
    shortBreakBtn.addEventListener('click', () => switchMode('shortBreak'));
    longBreakBtn.addEventListener('click', () => switchMode('longBreak'));
    
    // Task Event Handlers
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    
    // Theme Switcher
    themeBtn.addEventListener('click', toggleTheme);
    
    // Auth Button
    authBtn.addEventListener('click', () => {
        if (auth.currentUser) {
            signOut(auth);
        } else {
            authModal.style.display = 'flex';
        }
    });
    
    // Settings
    pomodoroTimeInput.addEventListener('change', saveSettings);
    shortBreakTimeInput.addEventListener('change', saveSettings);
    longBreakTimeInput.addEventListener('change', saveSettings);
    soundToggle.addEventListener('change', saveSettings);
    
    // Auth Modal Tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.dataset.tab === 'login') {
                loginForm.style.display = 'flex';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'flex';
            }
        });
    });
    
    // Login Form
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Вход выполнен успешно!');
        } catch (error) {
            let errorMessage;
            switch(error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Некорректный email адрес';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Этот аккаунт был отключен';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Аккаунт с таким email не найден';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Неверный пароль';
                    break;
                default:
                    errorMessage = 'Ошибка входа. Попробуйте снова';
            }
            showNotification(errorMessage, 'error');
        }
    });
    
    // Register Form
    registerBtn.addEventListener('click', async () => {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            showNotification('Регистрация успешна! Проверьте email для подтверждения.');
        } catch (error) {
            let errorMessage;
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Этот email уже зарегистрирован';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Некорректный email адрес';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Пароль слишком простой (минимум 6 символов)';
                    break;
                default:
                    errorMessage = 'Ошибка регистрации. Попробуйте снова';
            }
            showNotification(errorMessage, 'error');
        }
    });
    
    // Google Auth
    googleAuthBtn.addEventListener('click', async () => {
        try {
            // Добавляем параметры запроса
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            const result = await signInWithPopup(auth, provider);
            showNotification('Вход через Google выполнен!');
        } catch (error) {
            let errorMessage = 'Ошибка авторизации';
            
            if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'Этот email уже зарегистрирован другим методом';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Вы закрыли окно авторизации';
            }
            
            showNotification(errorMessage, 'error');
            console.error('Google auth error:', error);
        }
    });
    
    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Timer Functions
    function startTimer() {
        const currentTime = currentMode === 'pomodoro' ? parseInt(pomodoroTimeInput.value) :
                          currentMode === 'shortBreak' ? parseInt(shortBreakTimeInput.value) :
                          parseInt(longBreakTimeInput.value);
        
        if (currentTime === 0) {
            alert("Время не может быть 0 минут!");
            return;
        }
    
        if (!isRunning) {
            isRunning = true;
            timeLeft = currentTime * 60;
            timer = setInterval(updateTimer, 1000);
            startBtn.disabled = true;
        }
    }
    
    function stopTimer() {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
    }
    
    function resetTimer() {
        stopTimer();
        switchMode(currentMode, true);
    }
    
    function updateTimer() {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            timerComplete();
        }
        
        if (timeLeft <= 2 && timeLeft > 0 && soundToggle.checked) {
            timerSound.currentTime = 0;
            timerSound.play();
        }
    }
    
    function timerComplete() {
    stopTimer();
    timerDisplay.classList.add('timer-alert');
    
    if (soundToggle.checked) {
        completeSound.play();
    }
    
    if (currentMode === 'pomodoro') {
        // Начисляем помидорку выбранной задаче сразу после завершения таймера
        if (selectedTaskId !== null) {
            const taskIndex = tasks.findIndex(task => task.id === selectedTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].completedPomodoros = (tasks[taskIndex].completedPomodoros || 0) + 1;
                saveTasks();
                renderTasks(); // Обновляем отображение задач, чтобы показать новое количество помидорок
            }
        }
        
        const pomodoroCount = tasks.reduce((sum, task) => sum + (task.completedPomodoros || 0), 0);
        if (pomodoroCount > 0 && pomodoroCount % 4 === 0) {
            setTimeout(() => switchMode('longBreak'), 1000);
        } else {
            setTimeout(() => switchMode('shortBreak'), 1000);
        }
    } else {
        setTimeout(() => switchMode('pomodoro'), 1000);
    }
}
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function switchMode(mode, forceReset = false) {
        if (currentMode === mode && !forceReset) return;
    
        currentMode = mode;
        timerDisplay.classList.remove('timer-alert');
    
        pomodoroBtn.classList.remove('active-mode');
        shortBreakBtn.classList.remove('active-mode');
        longBreakBtn.classList.remove('active-mode');
    
        switch (mode) {
            case 'pomodoro':
                timeLeft = parseInt(pomodoroTimeInput.value) * 60;
                pomodoroBtn.classList.add('active-mode');
                break;
            case 'shortBreak':
                timeLeft = parseInt(shortBreakTimeInput.value) * 60;
                shortBreakBtn.classList.add('active-mode');
                break;
            case 'longBreak':
                timeLeft = parseInt(longBreakTimeInput.value) * 60;
                longBreakBtn.classList.add('active-mode');
                break;
        }
    
        updateTimerDisplay();
        stopTimer();
    }
    
    // Task Functions
    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                completedPomodoros: 0
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            newTaskInput.value = '';
        }
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.id === selectedTaskId ? 'selected-task' : ''}`;
            taskItem.innerHTML = `
                <span>${task.text}</span>
                <div>
                    <span class="pomodoro-count">${task.completedPomodoros || 0} 🍅</span>
                    <button class="delete-btn" data-id="${task.id}">×</button>
                </div>
            `;
            
            taskItem.addEventListener('click', () => selectTask(task.id));
            
            const deleteBtn = taskItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            taskList.appendChild(taskItem);
        });
    }
    
    function selectTask(taskId) {
        selectedTaskId = taskId === selectedTaskId ? null : taskId;
        saveTasks();
        renderTasks();
        updateSelectedTaskDisplay();
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        if (selectedTaskId === taskId) {
            selectedTaskId = null;
        }
        saveTasks();
        renderTasks();
        updateSelectedTaskDisplay();
    }
    
    function updateSelectedTaskDisplay() {
        if (selectedTaskId === null) {
            selectedTaskDisplay.textContent = 'No Selected Task';
        } else {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                selectedTaskDisplay.textContent = `Current Task: ${task.text}`;
            }
        }
    }
    
    // Data Functions
    async function loadUserData(userId) {
        try {
            const docRef = doc(db, "users", userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                tasks = data.tasks || [];
                selectedTaskId = data.selectedTaskId || null;
                
                if (data.settings) {
                    pomodoroTimeInput.value = data.settings.pomodoroTime || 25;
                    shortBreakTimeInput.value = data.settings.shortBreakTime || 5;
                    longBreakTimeInput.value = data.settings.longBreakTime || 15;
                    soundToggle.checked = data.settings.soundEnabled !== false;
                }
                
                renderTasks();
                updateSelectedTaskDisplay();
                switchMode(currentMode, true);
            }
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    }
    
    function loadLocalData() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            pomodoroTimeInput.value = settings.pomodoroTime || 25;
            shortBreakTimeInput.value = settings.shortBreakTime || 5;
            longBreakTimeInput.value = settings.longBreakTime || 15;
            soundToggle.checked = settings.soundEnabled !== false;
        }
        
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
            const data = JSON.parse(savedTasks);
            tasks = data.tasks || [];
            selectedTaskId = data.selectedTaskId || null;
        }
        
        renderTasks();
        updateSelectedTaskDisplay();
    }
    
    async function saveSettings() {
        const settings = {
            pomodoroTime: Math.max(1, parseInt(pomodoroTimeInput.value) || 25),
            shortBreakTime: Math.max(1, parseInt(shortBreakTimeInput.value) || 5),
            longBreakTime: Math.max(1, parseInt(longBreakTimeInput.value) || 15),
            soundEnabled: soundToggle.checked
        };
        
        if (auth.currentUser) {
            try {
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    settings: settings
                }, { merge: true });
            } catch (error) {
                console.error("Ошибка сохранения настроек:", error);
            }
        } else {
            localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        }
    }
    
    async function saveTasks() {
        if (auth.currentUser) {
            try {
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    tasks: tasks,
                    selectedTaskId: selectedTaskId
                }, { merge: true });
            } catch (error) {
                console.error("Ошибка сохранения задач:", error);
            }
        } else {
            localStorage.setItem('pomodoroTasks', JSON.stringify({
                tasks: tasks,
                selectedTaskId: selectedTaskId
            }));
        }
    }
    
    // Theme Functions
    function toggleTheme() {
        isLightTheme = !isLightTheme;
        document.body.classList.toggle('light-theme');
        document.documentElement.setAttribute('data-theme', isLightTheme ? 'light' : 'dark');
        localStorage.setItem('isLightTheme', isLightTheme);
    }
    
    function loadTheme() {
        const savedTheme = localStorage.getItem('isLightTheme');
        if (savedTheme === 'true') {
            isLightTheme = true;
            document.body.classList.add('light-theme');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
    
    // Notification Function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});