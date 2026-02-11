// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyBW7q6bEEzZM_0Wo2sBgFlKAgL7QRhS6nU",
    authDomain: "typemaster-pro-a80b6.firebaseapp.com",
    databaseURL: "https://typemaster-pro-a80b6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typemaster-pro-a80b6",
    storageBucket: "typemaster-pro-a80b6.firebasestorage.app",
    messagingSenderId: "142357082930",
    appId: "1:142357082930:web:f9fa7c54064cdef15fdd2b",
    measurementId: "G-WQLLQHT382"
  };

// Initialize Firebase
let app, auth, database;
let useFirebase = false;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    useFirebase = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.log('Firebase not configured, using localStorage', error);
    useFirebase = false;
}

// ===== TYPING TEST DATA =====
const statements = {
    easy: [
        "The cat sat on the mat.",
        "She sells seashells by the seashore.",
        "A quick brown fox jumps over the lazy dog.",
        "Programming is fun and rewarding.",
        "Practice makes perfect in typing."
    ],
    medium: [
        "JavaScript enables interactive web pages and applications.",
        "Modern web development requires HTML, CSS, and JavaScript knowledge.",
        "Responsive design ensures websites work well on all devices.",
        "Clean code is easier to maintain and understand for teams.",
        "Version control systems help developers track code changes."
    ],
    hard: [
        "The Document Object Model represents HTML documents as a tree structure.",
        "Asynchronous JavaScript enables web apps to update without page reloads.",
        "Cross-Origin Resource Sharing is a security feature for web requests.",
        "Callback functions are commonly used in asynchronous programming patterns.",
        "RESTful APIs follow standard HTTP methods for web service communication."
    ],
    expert: [
        "Webpack's module bundling system optimizes JavaScript code distribution efficiently.",
        "Redux provides centralized state management for complex React applications.",
        "WebSocket connections enable real-time bidirectional client-server communication.",
        "Docker containerization ensures consistent deployment across different environments.",
        "CI/CD pipelines automate testing, building, and deployment processes completely."
    ]
};

// ===== STATE VARIABLES =====
let isActive = false;
let isPaused = false;
let timeLimit = 60;
let timeRemaining = 60;
let currentStatementIndex = 0;
let currentStatements = [];
let startTime = null;
let timerInterval = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let totalErrors = 0;
let completedStatements = 0;
let soundEnabled = true;
let currentUser = null;

// ===== DOM ELEMENTS =====
const configSection = document.getElementById('config-section');
const testSection = document.getElementById('test-section');
const resultsSection = document.getElementById('results-section');
const timeLimitSelect = document.getElementById('time-limit-select');
const difficultySelect = document.getElementById('difficulty-select');
const soundToggle = document.getElementById('sound-toggle');
const startTestBtn = document.getElementById('start-test-btn');
const timer = document.getElementById('timer');
const timeProgressFill = document.getElementById('time-progress-fill');
const typingDisplay = document.getElementById('typing-display');
const typingInput = document.getElementById('typing-input');
const currentStatement = document.getElementById('current-statement');
const totalStatementsEl = document.getElementById('total-statements');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const errorsDisplay = document.getElementById('errors');
const pauseBtn = document.getElementById('pause-btn');
const endTestBtn = document.getElementById('end-test-btn');
const restartBtn = document.getElementById('restart-btn');

// Audio elements
const typeSound = document.getElementById('type-sound');
const errorSound = document.getElementById('error-sound');
const completeSound = document.getElementById('complete-sound');

// Auth elements
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const modalClose = document.getElementById('modal-close');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const userMenu = document.getElementById('user-menu');
const authButtons = document.getElementById('auth-buttons');

// Mobile menu
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');

// ===== INITIALIZATION =====
function init() {
    soundEnabled = localStorage.getItem('typingTestSound') !== 'false';
    soundToggle.checked = soundEnabled;
    
    // Event listeners
    startTestBtn.addEventListener('click', startTest);
    pauseBtn.addEventListener('click', togglePause);
    endTestBtn.addEventListener('click', endTest);
    restartBtn.addEventListener('click', restartTest);
    typingInput.addEventListener('input', handleInput);
    
    soundToggle.addEventListener('change', function() {
        soundEnabled = this.checked;
        localStorage.setItem('typingTestSound', soundEnabled);
    });
    
    difficultySelect.addEventListener('change', updateStatementCount);
    
    // Auth listeners
    loginBtn.addEventListener('click', () => openAuthModal('login'));
    signupBtn.addEventListener('click', () => openAuthModal('signup'));
    modalClose.addEventListener('click', closeAuthModal);
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('signup');
    });
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('mobile-logout-btn').addEventListener('click', handleLogout);
    
    document.getElementById('user-avatar-btn').addEventListener('click', () => {
        document.getElementById('user-dropdown').classList.toggle('active');
    });
    
    // Mobile menu
    mobileMenuToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
    mobileMenuClose.addEventListener('click', () => mobileMenu.classList.remove('active'));
    
    document.getElementById('mobile-login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenu.classList.remove('active');
        openAuthModal('login');
    });
    
    document.getElementById('mobile-signup-btn').addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenu.classList.remove('active');
        openAuthModal('signup');
    });
    
    // Download and share
    document.getElementById('download-cert-btn').addEventListener('click', downloadCertificate);
    document.getElementById('share-btn').addEventListener('click', shareResults);
    
    // Close modal on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            document.getElementById('user-dropdown').classList.remove('active');
        }
    });
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                mobileMenu.classList.remove('active');
            }
        });
    });
    
    // Check auth state
    if (useFirebase) {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                updateUIForLoggedInUser();
            } else {
                currentUser = null;
                updateUIForLoggedInUser();
            }
        });
    }
    
    updateStatementCount();
    loadLeaderboard();
    updateStats();
}

// ===== AUTH FUNCTIONS =====
function openAuthModal(type) {
    authModal.classList.add('active');
    switchAuthForm(type);
}

function closeAuthModal() {
    authModal.classList.remove('active');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('signup-error').style.display = 'none';
}

function switchAuthForm(type) {
    const loginContainer = document.getElementById('login-form-container');
    const signupContainer = document.getElementById('signup-form-container');
    
    if (type === 'login') {
        loginContainer.style.display = 'block';
        signupContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        if (useFirebase) {
            await auth.signInWithEmailAndPassword(email, password);
            closeAuthModal();
            showNotification('Login successful!');
        } else {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('typingTestUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = { email: user.email, displayName: user.name, uid: user.id };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                closeAuthModal();
                showNotification('Login successful!');
            } else {
                throw new Error('Invalid credentials');
            }
        }
    } catch (error) {
        errorEl.textContent = 'Invalid email or password';
        errorEl.style.display = 'block';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');
    
    try {
        if (useFirebase) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            closeAuthModal();
            showNotification('Account created successfully!');
        } else {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('typingTestUsers') || '[]');
            
            if (users.find(u => u.email === email)) {
                throw new Error('Email already registered');
            }
            
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password,
                joinDate: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('typingTestUsers', JSON.stringify(users));
            
            currentUser = { email: newUser.email, displayName: newUser.name, uid: newUser.id };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeAuthModal();
            showNotification('Account created successfully!');
        }
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to create account';
        errorEl.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        if (useFirebase) {
            await auth.signOut();
        } else {
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateUIForLoggedInUser();
        }
        showNotification('Logged out successfully');
        mobileMenu.classList.remove('active');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function updateUIForLoggedInUser() {
    const userName = currentUser ? (currentUser.displayName || currentUser.email) : 'Guest';
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        document.getElementById('user-name-display').textContent = userName;
        document.getElementById('cert-name').textContent = userName;
        
        // Mobile menu
        document.getElementById('mobile-auth-section').style.display = 'none';
        document.getElementById('mobile-user-section').style.display = 'block';
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        document.getElementById('cert-name').textContent = 'Guest User';
        
        // Mobile menu
        document.getElementById('mobile-auth-section').style.display = 'block';
        document.getElementById('mobile-user-section').style.display = 'none';
    }
}

// ===== TEST FUNCTIONS =====
function startTest() {
    isActive = true;
    isPaused = false;
    timeLimit = parseInt(timeLimitSelect.value);
    timeRemaining = timeLimit;
    currentStatementIndex = 0;
    startTime = Date.now();
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    totalErrors = 0;
    completedStatements = 0;
    
    const difficulty = difficultySelect.value;
    currentStatements = [...statements[difficulty]];
    shuffleArray(currentStatements);
    
    configSection.style.display = 'none';
    testSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();
    
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';
    errorsDisplay.textContent = '0';
    
    displayStatement();
    startTimer();
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!isPaused && isActive) {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                endTest();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timer.textContent = minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
    
    const progressPercent = (timeRemaining / timeLimit) * 100;
    timeProgressFill.style.width = progressPercent + '%';
    
    timer.classList.remove('warning', 'critical');
    if (timeRemaining <= 10) {
        timer.classList.add('critical');
    } else if (timeRemaining <= 20) {
        timer.classList.add('warning');
    }
}

function displayStatement() {
    if (currentStatementIndex >= currentStatements.length) {
        completeAllStatements();
        return;
    }
    
    const statement = currentStatements[currentStatementIndex];
    const userInput = typingInput.value;
    let html = '';
    
    for (let i = 0; i < statement.length; i++) {
        const char = statement[i];
        const userChar = userInput[i];
        let charClass = 'char';
        
        if (i < userInput.length) {
            charClass = userChar === char ? 'char correct' : 'char incorrect';
        } else if (i === userInput.length) {
            charClass = 'char current';
        }
        
        html += `<span class="${charClass}">${char === ' ' ? '&nbsp;' : char}</span>`;
    }
    
    if (userInput.length < statement.length) {
        html += '<span class="cursor"></span>';
    }
    
    typingDisplay.innerHTML = html;
    currentStatement.textContent = currentStatementIndex + 1;
    totalStatementsEl.textContent = currentStatements.length;
    
    updateStats();
}

function handleInput(e) {
    if (!isActive || isPaused) return;
    
    const userInput = e.target.value;
    const statement = currentStatements[currentStatementIndex];
    
    if (userInput.length > statement.length) {
        e.target.value = statement;
        return;
    }
    
    totalKeystrokes++;
    
    const lastIndex = userInput.length - 1;
    if (lastIndex >= 0 && lastIndex < statement.length) {
        if (userInput[lastIndex] === statement[lastIndex]) {
            correctKeystrokes++;
            if (soundEnabled) {
                typeSound.currentTime = 0;
                typeSound.play().catch(() => {});
            }
        } else {
            totalErrors++;
            if (soundEnabled) {
                errorSound.currentTime = 0;
                errorSound.play().catch(() => {});
            }
        }
    }
    
    displayStatement();
    
    if (userInput === statement) {
        completedStatements++;
        
        if (soundEnabled) {
            completeSound.currentTime = 0;
            completeSound.play().catch(() => {});
        }
        
        setTimeout(() => advanceToNextStatement(), 300);
    }
}

function updateStats() {
    if (!startTime || timeRemaining === timeLimit) {
        wpmDisplay.textContent = '0';
        accuracyDisplay.textContent = '100%';
        errorsDisplay.textContent = '0';
        return;
    }
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    
    let wpm = 0;
    if (timeElapsed > 0 && correctKeystrokes > 0) {
        const words = correctKeystrokes / 5;
        wpm = Math.round(words / timeElapsed);
    }
    wpmDisplay.textContent = wpm;
    
    let accuracy = 100;
    if (totalKeystrokes > 0) {
        accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);
    }
    accuracyDisplay.textContent = accuracy + '%';
    
    errorsDisplay.textContent = totalErrors;
}

function advanceToNextStatement() {
    currentStatementIndex++;
    typingInput.value = '';
    
    if (currentStatementIndex >= currentStatements.length) {
        completeAllStatements();
    } else {
        displayStatement();
        typingInput.focus();
    }
}

function completeAllStatements() {
    typingDisplay.innerHTML = '<div style="text-align: center; padding: 20px;"><h3 style="color: #2563eb;">All sentences completed! ✓</h3><p>Great job!</p></div>';
}

function togglePause() {
    if (!isActive) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        typingInput.disabled = true;
        clearInterval(timerInterval);
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        typingInput.disabled = false;
        typingInput.focus();
        startTimer();
    }
}

function endTest() {
    if (!isActive) return;
    
    isActive = false;
    isPaused = false;
    clearInterval(timerInterval);
    
    const timeTaken = timeLimit - timeRemaining;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    
    let finalWpm = 0;
    if (timeTaken > 0 && correctKeystrokes > 0) {
        const timeElapsed = timeTaken / 60;
        const words = correctKeystrokes / 5;
        finalWpm = Math.round(words / timeElapsed);
    }
    
    let finalAccuracy = 100;
    if (totalKeystrokes > 0) {
        finalAccuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);
    }
    
    let performanceLevel = 'Beginner';
    if (finalWpm >= 30 && finalWpm < 50) {
        performanceLevel = 'Intermediate';
    } else if (finalWpm >= 50 && finalWpm < 80) {
        performanceLevel = 'Advanced';
    } else if (finalWpm >= 80) {
        performanceLevel = 'Expert';
    }
    
    testSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    document.getElementById('cert-wpm').textContent = finalWpm;
    document.getElementById('cert-accuracy').textContent = finalAccuracy + '%';
    document.getElementById('cert-level').textContent = performanceLevel;
    document.getElementById('cert-duration').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    document.getElementById('cert-date').textContent = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    saveResult(finalWpm, finalAccuracy, totalErrors, timeTaken);
    updateLeaderboard(finalWpm, finalAccuracy);
    
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

async function saveResult(wpm, accuracy, errors, timeTaken) {
    const result = {
        wpm,
        accuracy,
        errors,
        timeTaken,
        date: new Date().toISOString(),
        difficulty: difficultySelect.value,
        user: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest'
    };
    
    if (useFirebase && currentUser) {
        try {
            await database.ref('results/' + currentUser.uid).push(result);
            await database.ref('stats/totalTests').transaction(count => (count || 0) + 1);
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }
    
    // Always save to localStorage as backup
    const results = JSON.parse(localStorage.getItem('typingTestResults') || '[]');
    results.push(result);
    if (results.length > 50) results.shift();
    localStorage.setItem('typingTestResults', JSON.stringify(results));
}

function restartTest() {
    resultsSection.style.display = 'none';
    configSection.style.display = 'block';
    typingInput.value = '';
    typingInput.disabled = false;
    isPaused = false;
    isActive = false;
    
    setTimeout(() => {
        document.getElementById('test').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function updateStatementCount() {
    const difficulty = difficultySelect.value;
    totalStatementsEl.textContent = statements[difficulty].length;
}

// ===== LEADERBOARD =====
async function updateLeaderboard(wpm, accuracy) {
    if (!currentUser) return;
    
    const entry = {
        name: currentUser.displayName || currentUser.email.split('@')[0],
        email: currentUser.email,
        wpm,
        accuracy,
        date: new Date().toISOString(),
        uid: currentUser.uid
    };
    
    if (useFirebase) {
        try {
            const userRef = database.ref('leaderboard/' + currentUser.uid);
            const snapshot = await userRef.once('value');
            const existing = snapshot.val();
            
            if (!existing || wpm > existing.wpm) {
                await userRef.set(entry);
            }
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }
    
    // LocalStorage backup
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const existingIndex = leaderboard.findIndex(e => e.email === entry.email);
    
    if (existingIndex >= 0) {
        if (wpm > leaderboard[existingIndex].wpm) {
            leaderboard[existingIndex] = entry;
        }
    } else {
        leaderboard.push(entry);
    }
    
    leaderboard.sort((a, b) => b.wpm - a.wpm);
    if (leaderboard.length > 100) leaderboard.length = 100;
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    loadLeaderboard();
}

async function loadLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    
    let leaderboard = [];
    
    if (useFirebase) {
        try {
            const snapshot = await database.ref('leaderboard').orderByChild('wpm').limitToLast(10).once('value');
            const data = snapshot.val();
            if (data) {
                leaderboard = Object.values(data).sort((a, b) => b.wpm - a.wpm);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }
    
    // Fallback to localStorage
    if (leaderboard.length === 0) {
        leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]').slice(0, 10);
    }
    
    if (leaderboard.length === 0) {
        content.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No entries yet. Be the first!</p>';
        return;
    }
    
    content.innerHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-row">
            <span class="leaderboard-rank">${index + 1}</span>
            <span>${entry.name}</span>
            <span>${entry.wpm}</span>
            <span>${entry.accuracy}%</span>
        </div>
    `).join('');
    
    // Update stats
    updateGlobalStats();
}

async function updateGlobalStats() {
    if (useFirebase) {
        try {
            const statsSnapshot = await database.ref('stats').once('value');
            const stats = statsSnapshot.val();
            if (stats) {
                document.getElementById('total-tests-count').textContent = stats.totalTests || 0;
                document.getElementById('total-users-count').textContent = stats.totalUsers || 0;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Fallback
    const results = JSON.parse(localStorage.getItem('typingTestResults') || '[]');
    const users = JSON.parse(localStorage.getItem('typingTestUsers') || '[]');
    document.getElementById('total-tests-count').textContent = results.length;
    document.getElementById('total-users-count').textContent = users.length;
}

// ===== DOWNLOAD & SHARE =====
async function downloadCertificate() {
    const certificate = document.getElementById('certificate-card');
    
    try {
        const canvas = await html2canvas(certificate, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        });
        
        const link = document.createElement('a');
        link.download = 'typing-test-certificate.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showNotification('Certificate downloaded successfully!');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed. Please try again.', 'error');
    }
}

function shareResults() {
    const wpm = document.getElementById('cert-wpm').textContent;
    const accuracy = document.getElementById('cert-accuracy').textContent;
    const level = document.getElementById('cert-level').textContent;
    
    const shareText = `I just scored ${wpm} WPM with ${accuracy} accuracy on TypeMaster Pro! 🎯\n\nPerformance Level: ${level}\n\nTry it yourself!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'TypeMaster Pro - My Results',
            text: shareText
        }).then(() => {
            showNotification('Results shared successfully!');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Results copied to clipboard!');
}

// ===== UTILITY =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 5000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function scrollToTest() {
    document.getElementById('test').scrollIntoView({ behavior: 'smooth' });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.error-message {
    background: #fee;
    color: #c00;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    font-size: 0.9rem;
}
.loading-spinner {
    text-align: center;
    padding: 40px;
    color: #999;
    font-size: 1.1rem;
}
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', init);
