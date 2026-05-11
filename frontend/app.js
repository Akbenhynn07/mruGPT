// SET YOUR LIVE RENDER URL HERE (e.g., https://your-app-name.onrender.com)
// For local testing, keep it as http://localhost:8080
const API_BASE_URL = "https://mrugpt-api.onrender.com"; // UPDATE THIS

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('micBtn');
    
    const attendanceBtn = document.getElementById('attendanceBtn');
    const timetableBtn = document.getElementById('timetableBtn');
    
    // New UI Elements
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const initialView = document.getElementById('initialView');
    const inputArea = document.getElementById('inputArea');
    const suggestionChips = document.getElementById('suggestionChips');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const greetingHeader = document.getElementById('greetingHeader');
    const greetingSubheader = document.getElementById('greetingSubheader');

    // AI Dynamic Greeting
    // Generate Background Particles
    const particlesContainer = document.getElementById('particlesContainer');
    if (particlesContainer) {
        const colors = ['#00e5ff', '#9b72cb', '#d96570'];
        for (let i = 0; i < 50; i++) {
            const ball = document.createElement('div');
            ball.className = 'small-ball';
            
            // Randomize properties
            const size = Math.random() * 15 + 5; // 5px to 20px
            const left = Math.random() * 100; // 0% to 100%
            const duration = Math.random() * 5 + 3; // 3s to 8s (faster speed)
            const delay = Math.random() * 5; // 0s to 5s
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ball.style.width = `${size}px`;
            ball.style.height = `${size}px`;
            ball.style.left = `${left}%`;
            ball.style.animationDuration = `${duration}s`;
            ball.style.animationDelay = `${delay}s`;
            ball.style.backgroundColor = color;
            
            particlesContainer.appendChild(ball);
        }
    }

    // AI Dynamic Greeting Loading States
    if (greetingHeader && greetingSubheader) {
        const loadingStates = [
            { header: "Waking up mruGPT...", sub: "Crafting a unique greeting just for you." },
            { header: "Initializing AI core...", sub: "Gathering your personalized college updates." },
            { header: "Connecting to neural net...", sub: "Cooking up something motivational." },
            { header: "Booting up mruGPT...", sub: "Scanning the university database for you." },
            { header: "Warming up servers...", sub: "Preparing your personal AI assistant." },
            { header: "Syncing data streams...", sub: "Fetching the latest college intel." },
            { header: "Powering on...", sub: "Getting ready to crush today's tasks." }
        ];
        const randomLoad = loadingStates[Math.floor(Math.random() * loadingStates.length)];
        
        greetingHeader.innerHTML = `<span class="gradient-text">${randomLoad.header}</span>`;
        greetingSubheader.textContent = randomLoad.sub;
        
        fetch(`${API_BASE_URL}/greeting`)
            .then(res => res.json())
            .then(data => {
                greetingHeader.innerHTML = `<span class="gradient-text">${data.header}</span>`;
                greetingSubheader.textContent = data.subheader;
            })
            .catch(err => {
                console.error("Failed to fetch greeting:", err);
                greetingHeader.innerHTML = `<span class="gradient-text">Hi Student</span>`;
                greetingSubheader.textContent = "What can we get done today?";
            });
    }

    let chatStarted = false;

    // Theme logic
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            if (themeIcon) themeIcon.textContent = isLight ? 'dark_mode' : 'light_mode';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }


    // Account Menu logic
    const avatarBtn = document.getElementById('avatarBtn');
    const accountMenu = document.getElementById('accountMenu');
    const currentAccountHeader = document.getElementById('currentAccountHeader');
    const accountListContainer = document.getElementById('accountListContainer');
    const addAccountBtn = document.getElementById('addAccountBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const manageAccountBtn = document.getElementById('manageAccountBtn');
    const toggleAccountsBtn = document.getElementById('toggleAccountsBtn');
    const toggleAccountsIcon = document.getElementById('toggleAccountsIcon');
    
    // Login Overlay Elements
    const loginOverlay = document.getElementById('loginOverlay');
    const appContainer = document.getElementById('appContainer');

    let accounts = JSON.parse(localStorage.getItem('mru_accounts')) || [];
    let activeAccountId = localStorage.getItem('mru_active_account');

    function decodeJwtResponse(token) {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    window.handleCredentialResponse = function(response) {
        const responsePayload = decodeJwtResponse(response.credential);
        
        // Validate College Email
        if (!responsePayload.email.endsWith('@mallareddyuniversity.ac.in')) {
            alert('Please provide your college mail id. Only @mallareddyuniversity.ac.in accounts are allowed.');
            if (window.google && window.google.accounts) {
                google.accounts.id.disableAutoSelect();
            }
            return;
        }

        const newAcc = {
            id: responsePayload.sub,
            name: responsePayload.name,
            email: responsePayload.email,
            picture: responsePayload.picture,
            initial: responsePayload.name.charAt(0).toUpperCase()
        };
        
        // Add if not exists
        if (!accounts.find(a => a.id === newAcc.id)) {
            accounts.push(newAcc);
        }
        
        activeAccountId = newAcc.id;
        
        localStorage.setItem('mru_accounts', JSON.stringify(accounts));
        localStorage.setItem('mru_active_account', activeAccountId);
        localStorage.setItem('google_jwt', response.credential);
        
        // Save to Database
        fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: newAcc.id,
                name: newAcc.name,
                email: newAcc.email
            })
        })
        .then(() => fetch(`${API_BASE_URL}/student/${newAcc.email}`))
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                window.currentStudentContext = JSON.stringify(data);
            }
        })
        .catch(err => console.error('Failed to save user to DB:', err));
        
        renderAccounts();
        
        loginOverlay.classList.add('hidden');
        appContainer.classList.remove('hidden');
    }

    function initGoogleAuth() {
        if (window.google && window.google.accounts) {
            google.accounts.id.initialize({
                client_id: "1094627117317-aa3bessmgc2hv3cncvbt3m7dce7rsai0.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("googleSignInContainer"),
                { theme: "filled_black", size: "large", width: 360 }
            );
        } else {
            setTimeout(initGoogleAuth, 100);
        }
    }

    // Check auth state on load
    if (localStorage.getItem('google_jwt') && accounts.length > 0) {
        loginOverlay.classList.add('hidden');
        appContainer.classList.remove('hidden');
    } else {
        loginOverlay.classList.remove('hidden');
        appContainer.classList.add('hidden');
        initGoogleAuth();
    }

    const devLoginBtn = document.getElementById('devLoginBtn');
    if (devLoginBtn) {
        devLoginBtn.addEventListener('click', () => {
            const devAcc = {
                id: 'dev_user_123',
                name: 'Guest Developer',
                email: 'developer@mallareddyuniversity.ac.in',
                picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
                initial: 'G'
            };
            
            if (!accounts.find(a => a.id === devAcc.id)) {
                accounts.push(devAcc);
            }
            
            activeAccountId = devAcc.id;
            
            localStorage.setItem('mru_accounts', JSON.stringify(accounts));
            localStorage.setItem('mru_active_account', activeAccountId);
            localStorage.setItem('google_jwt', 'dev_mock_jwt');

            // Save to Database
            fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: devAcc.id,
                    name: devAcc.name,
                    email: devAcc.email
                })
            })
            .then(() => fetch(`${API_BASE_URL}/student/${devAcc.email}`))
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    window.currentStudentContext = JSON.stringify(data);
                }
            })
            .catch(err => console.error('Failed to save dev user to DB:', err));
            
            renderAccounts();
            
            loginOverlay.classList.add('hidden');
            appContainer.classList.remove('hidden');
        });
    }

    function renderAccounts() {
        if (!currentAccountHeader) return;
        const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
        
        if (!activeAccount) return;

        // Update Top Right Avatar
        if (avatarBtn) {
            if (activeAccount.picture) {
                avatarBtn.innerHTML = `<img src="${activeAccount.picture}" alt="Profile" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                avatarBtn.style.backgroundColor = 'transparent';
            } else {
                avatarBtn.textContent = activeAccount.initial;
            }
        }

        // Render Current Account
        const avatarHtml = activeAccount.picture ? 
            `<img src="${activeAccount.picture}" class="avatar large-avatar" style="border-radius:50%; object-fit:cover;">` : 
            `<div class="avatar large-avatar">${activeAccount.initial}</div>`;

        currentAccountHeader.innerHTML = `
            ${avatarHtml}
            <div class="account-details">
                <div class="account-name">Hi, ${activeAccount.name}!</div>
                <div class="account-email">${activeAccount.email}</div>
            </div>
        `;

        // Render Other Accounts
        accountListContainer.innerHTML = '';
        const otherAccounts = accounts.filter(a => a.id !== activeAccount.id);
        
        otherAccounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'account-item';
            const itemAvatar = acc.picture ? 
                `<img src="${acc.picture}" class="avatar" style="border-radius:50%; object-fit:cover;">` : 
                `<div class="avatar">${acc.initial}</div>`;
                
            item.innerHTML = `
                ${itemAvatar}
                <div class="account-details">
                    <div class="account-name">${acc.name}</div>
                    <div class="account-email">${acc.email}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                activeAccountId = acc.id;
                localStorage.setItem('mru_active_account', activeAccountId);
                renderAccounts();
                accountMenu.classList.add('hidden');
            });
            accountListContainer.appendChild(item);
        });
    }

    if (avatarBtn && accountMenu) {
        renderAccounts();

        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accountMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!accountMenu.contains(e.target) && !avatarBtn.contains(e.target)) {
                accountMenu.classList.add('hidden');
            }
        });

        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => {
                if (window.google && window.google.accounts) {
                    google.accounts.id.prompt();
                }
            });
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                accounts = accounts.filter(a => a.id !== activeAccountId);
                if (accounts.length > 0) {
                    activeAccountId = accounts[0].id;
                    localStorage.setItem('mru_accounts', JSON.stringify(accounts));
                    localStorage.setItem('mru_active_account', activeAccountId);
                    renderAccounts();
                } else {
                    activeAccountId = null;
                    localStorage.removeItem('mru_accounts');
                    localStorage.removeItem('mru_active_account');
                    localStorage.removeItem('google_jwt');
                    loginOverlay.classList.remove('hidden');
                    appContainer.classList.add('hidden');
                    initGoogleAuth();
                }
                
                if (window.google && window.google.accounts) {
                    google.accounts.id.disableAutoSelect();
                }
                accountMenu.classList.add('hidden');
            });
        }

        if (manageAccountBtn) {
            manageAccountBtn.addEventListener('click', () => {
                window.open('https://myaccount.google.com/', '_blank');
            });
        }

        if (toggleAccountsBtn) {
            toggleAccountsBtn.addEventListener('click', () => {
                if (accountListContainer.style.display === 'none') {
                    accountListContainer.style.display = 'block';
                    toggleAccountsIcon.textContent = 'expand_less';
                } else {
                    accountListContainer.style.display = 'none';
                    toggleAccountsIcon.textContent = 'expand_more';
                }
            });
        }
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                console.log('SW registered:', registration);
            }).catch(error => {
                console.log('SW registration failed:', error);
            });
        });
    }

    // Transition to chat view
    function startChat() {
        if (!chatStarted) {
            chatStarted = true;
            initialView.classList.add('hidden');
            chatWindow.classList.remove('hidden');
            inputArea.classList.remove('initial-state');
            suggestionChips.classList.add('hidden');
        }
    }

    // Toggle send button based on input
    userInput.addEventListener('input', () => {
        const hasText = userInput.value.trim() !== '';
        sendBtn.disabled = !hasText;
        if (hasText) {
            micBtn.classList.add('hidden');
            sendBtn.classList.remove('hidden');
        } else {
            micBtn.classList.remove('hidden');
            sendBtn.classList.add('hidden');
        }
    });

    // Form submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (text) {
            startChat();
            addUserMessage(text);
            userInput.value = '';
            sendBtn.disabled = true;
            micBtn.classList.remove('hidden');
            sendBtn.classList.add('hidden');
            
            processUserInput(text);
        }
    });

    // Button listeners
    attendanceBtn.addEventListener('click', () => {
        startChat();
        addUserMessage("Show my attendance");
        fetchAttendance();
    });

    timetableBtn.addEventListener('click', () => {
        startChat();
        addUserMessage("What are my classes today?");
        fetchTimetable();
    });

    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user';
        msgDiv.innerHTML = `
            <div class="avatar">U</div>
            <div class="content"><p>${escapeHTML(text)}</p></div>
        `;
        chatWindow.appendChild(msgDiv);
        scrollToBottom();
    }

    function addBotMessage(contentHTML) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.innerHTML = `
            <div class="avatar"><span class="material-symbols-outlined">temp_preferences_custom</span></div>
            <div class="content">${contentHTML}</div>
        `;
        chatWindow.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="avatar"><span class="material-symbols-outlined">temp_preferences_custom</span></div>
            <div class="content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatWindow.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    async function processUserInput(text) {
        const lower = text.toLowerCase();
        if (lower.includes('attendance')) {
            await fetchAttendance();
        } else if (lower.includes('class') || lower.includes('timetable') || lower.includes('schedule')) {
            await fetchTimetable();
        } else {
            const typingId = showTypingIndicator();
            try {
                // Call the actual backend API on port 8080
                const response = await fetch(`${API_BASE_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: text,
                        context: window.currentStudentContext || ""
                    })
                });
                if (!response.ok) throw new Error('Backend not available');
                const data = await response.json();
                removeTypingIndicator(typingId);
                
                // Format the response slightly if it contains newlines
                const formattedResponse = escapeHTML(data.response).replace(/\n/g, '<br>');
                addBotMessage(`<p>${formattedResponse}</p>`);
            } catch (error) {
                console.error(error);
                removeTypingIndicator(typingId);
                addBotMessage("<p>I'm having trouble connecting to the backend right now. Is it running on port 8080?</p>");
            }
        }
    }

    async function fetchAttendance() {
        const typingId = showTypingIndicator();
        try {
            const response = await fetch('/api/attendance');
            if (!response.ok) throw new Error('API not available');
            const data = await response.json();
            removeTypingIndicator(typingId);
            renderAttendanceCards(data.subjects);
        } catch (error) {
            console.log("Using mock attendance data fallback");
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResponse = {
                subjects: [
                    { name: 'OS', percentage: 63 },
                    { name: 'DBMS', percentage: 78 },
                    { name: 'Networks', percentage: 85 },
                    { name: 'AI', percentage: 92 }
                ]
            };
            removeTypingIndicator(typingId);
            renderAttendanceCards(mockResponse.subjects);
        }
    }

    async function fetchTimetable() {
        const typingId = showTypingIndicator();
        try {
            const response = await fetch('/api/timetable');
            if (!response.ok) throw new Error('API not available');
            const data = await response.json();
            removeTypingIndicator(typingId);
            renderTimetableCards(data.classes);
        } catch (error) {
            console.log("Using mock timetable data fallback");
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResponse = {
                classes: [
                    { subject: 'OS', time: '10:00 AM', room: 'A-204' },
                    { subject: 'DBMS', time: '11:30 AM', room: 'B-101' },
                    { subject: 'AI Lab', time: '02:00 PM', room: 'Lab-3' }
                ]
            };
            removeTypingIndicator(typingId);
            renderTimetableCards(mockResponse.classes);
        }
    }

    function getAttendanceColor(percentage) {
        if (percentage >= 75) return 'var(--success)';
        if (percentage >= 65) return 'var(--warning)';
        return 'var(--danger)';
    }

    function getAttendanceBadgeClass(percentage) {
        if (percentage >= 75) return 'good';
        if (percentage >= 65) return 'warning';
        return 'danger';
    }

    function renderAttendanceCards(subjects) {
        let cardsHTML = `<p>Here is your current attendance report:</p>`;
        cardsHTML += `<div class="cards-container">`;
        
        subjects.forEach(sub => {
            const color = getAttendanceColor(sub.percentage);
            const badgeClass = getAttendanceBadgeClass(sub.percentage);
            let status = sub.percentage >= 75 ? 'On Track' : (sub.percentage >= 65 ? 'Warning' : 'Critical');
            
            cardsHTML += `
                <div class="card">
                    <div class="card-header">
                        <span>Subject</span>
                        <span class="badge ${badgeClass}">${status}</span>
                    </div>
                    <div class="card-title">${escapeHTML(sub.name)}</div>
                    <div class="card-subtitle">${sub.percentage}% Attended</div>
                    <div class="attendance-progress">
                        <div class="progress-bar" style="width: 0%; background-color: ${color}" data-target-width="${sub.percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        cardsHTML += `</div>`;
        addBotMessage(cardsHTML);
        
        setTimeout(() => {
            const bars = document.querySelectorAll('.progress-bar');
            bars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-target-width');
            });
        }, 100);
    }

    function renderTimetableCards(classes) {
        if (classes.length === 0) {
            addBotMessage("<p>You have no classes scheduled for today! 🎉</p>");
            return;
        }

        let cardsHTML = `<p>Here are your classes for today:</p>`;
        cardsHTML += `<div class="cards-container">`;
        
        classes.forEach(cls => {
            cardsHTML += `
                <div class="card">
                    <div class="card-header">
                        <span><span class="material-symbols-outlined" style="font-size: 16px; vertical-align: text-bottom;">schedule</span> ${escapeHTML(cls.time)}</span>
                    </div>
                    <div class="card-title">${escapeHTML(cls.subject)}</div>
                    <div class="card-subtitle">
                        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: text-bottom;">location_on</span> Room: ${escapeHTML(cls.room)}
                    </div>
                </div>
            `;
        });
        
        cardsHTML += `</div>`;
        addBotMessage(cardsHTML);
    }

    // Voice to Text (Web Speech API)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        let isRecording = false;

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
                return;
            }
            
            userInput.placeholder = "Listening...";
            micBtn.style.color = "var(--primary-color)";
            isRecording = true;
            recognition.start();
        });

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript !== '') {
                userInput.value = finalTranscript;
            } else {
                userInput.value = interimTranscript;
            }
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
        };

        recognition.onend = () => {
            isRecording = false;
            userInput.placeholder = "Ask mruGPT";
            micBtn.style.color = ""; // Reset to CSS default
        };
        
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            isRecording = false;
            userInput.placeholder = "Ask mruGPT";
            micBtn.style.color = ""; // Reset
        };
    } else {
        micBtn.addEventListener('click', () => {
            alert("Voice to text is not supported in this browser.");
        });
    }

});
