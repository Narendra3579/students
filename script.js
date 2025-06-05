// Data storage (using localStorage for persistence between separate apps)
function getLocalStorageData(key, defaultValue) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return defaultValue;
    }
}

function setLocalStorageData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Data arrays - initialized from localStorage
let students = getLocalStorageData('students', []);
let homeworks = getLocalStorageData('homeworks', []);
let attendanceRecords = getLocalStorageData('attendanceRecords', []); // Currently not used in Student App display
let csrSubmissions = getLocalStorageData('csrSubmissions', []);
let studentNotifications = getLocalStorageData('studentNotifications', {}); // { studentId: [{...notification, isRead: true/false}]}


// Notification count for this app (local to the selected student)
let studentUnreadNotificationCount = 0; // This will be calculated per currentStudentId

// Current student (simulating login)
let currentStudentId = getLocalStorageData('currentStudentId_studentApp', null); // Persist last selected student
let isLoggedIn = getLocalStorageData('student_isLoggedIn', false); // New login state for student app


// DOM elements (Login Page)
const loginPage = document.getElementById('login-page');
const studentUserIdInput = document.getElementById('student-user-id');
const studentPasswordInput = document.getElementById('student-password');
const studentLoginButton = document.getElementById('student-login-button');
const loginMessage = document.getElementById('login-message');
const newRegistrationButton = document.getElementById('new-registration-button');
const forgotPasswordButton = document.getElementById('forgot-password-button');

// DOM elements (App Content)
const appContent = document.getElementById('app-content');
const logoutButton = document.getElementById('logout-button');
const selectedStudentInfo = document.getElementById('selected-student-info');
const studentNotificationsList = document.getElementById('student-notifications-list');
const studentHomeworkList = document.getElementById('student-homework-list');
const studentExamResultsList = document.getElementById('student-exam-results-list');
const studentEventsList = document.getElementById('student-events-list'); // Static content currently
const csrTypeSelect = document.getElementById('csr-type');
const csrMessageTextarea = document.getElementById('csr-message');
const submitCsrButton = document.getElementById('submit-csr-button');
const csrSubmissionsList = document.getElementById('csr-submissions-list');
const studentsBadge = document.getElementById('students-badge');


/**
 * Initializes the application.
 */
function initializeApp() {
    // Check login status on app load
    checkLoginStatus();

    // Add event listeners for login/logout
    studentLoginButton.addEventListener('click', handleStudentLogin);
    logoutButton.addEventListener('click', handleLogout);

    // Add event listeners for new registration and forgot password (new)
    newRegistrationButton.addEventListener('click', handleNewRegistration);
    forgotPasswordButton.addEventListener('click', handleForgotPassword);

    if (isLoggedIn) {
        initializeAppContent();
    } else {
        // If not logged in, but a student ID was previously selected, pre-fill the input
        if (currentStudentId) {
            studentUserIdInput.value = currentStudentId;
            // No pre-filling password for security
        }
    }
}

/**
 * Checks the current login status and displays the appropriate UI.
 */
function checkLoginStatus() {
    if (isLoggedIn) {
        loginPage.style.display = 'none';
        appContent.style.display = 'flex'; // Use flex for app-content to maintain layout
    } else {
        loginPage.style.display = 'flex';
        appContent.style.display = 'none';
    }
}

/**
 * Handles the student login attempt (entering a User ID and Password).
 */
function handleStudentLogin() {
    const enteredUserId = parseInt(studentUserIdInput.value.trim());
    const enteredPassword = studentPasswordInput.value.trim();

    // Find the student by ID
    const student = students.find(s => s.id === enteredUserId);

    // Hardcoded password for demo purposes: assume password is 'student' + user ID
    // In a real app, you'd fetch the hashed password from a backend and compare.
    const expectedPassword = student ? `student${student.id}` : '';

    if (student && enteredPassword === expectedPassword) {
        currentStudentId = enteredUserId;
        isLoggedIn = true;
        setLocalStorageData('currentStudentId_studentApp', currentStudentId); // Persist selection
        setLocalStorageData('student_isLoggedIn', true); // Persist login state
        loginMessage.classList.add('hidden');
        checkLoginStatus(); // Switch to app content
        initializeAppContent(); // Initialize app content elements
        alertUser('Logged in successfully!');

        // Mark notifications as read when student logs in
        if (studentNotifications[currentStudentId]) {
            studentNotifications[currentStudentId].forEach(notif => notif.isRead = true);
            setLocalStorageData('studentNotifications', studentNotifications); // Save changes
        }
        updateStudentsBadge(); // Update badge after marking as read

    } else {
        loginMessage.textContent = 'Invalid User ID or password. Please try again.';
        loginMessage.classList.remove('hidden');
        isLoggedIn = false;
        setLocalStorageData('student_isLoggedIn', false);
    }
}

/**
 * Handles the logout action.
 */
function handleLogout() {
    isLoggedIn = false;
    setLocalStorageData('student_isLoggedIn', false);
    // Optionally clear current student selection on logout
    currentStudentId = null;
    setLocalStorageData('currentStudentId_studentApp', null);
    studentUserIdInput.value = ''; // Clear the User ID input field
    studentPasswordInput.value = ''; // Clear the password input field
    alertUser('Logged out successfully!');
    checkLoginStatus(); // Switch back to login page
    // Clear content when logged out
    updateStudentContent();
}

/**
 * Handles the New Registration button click. (Demo placeholder)
 */
function handleNewRegistration() {
    alertUser('New Registration: In a real application, this would redirect to a registration form where new student accounts could be created, possibly with parent approval. For this demo, please ask the school management to add your student profile. Your password will be "student" followed by your User ID (e.g., student12345).');
}

/**
 * Handles the Forgot/Reset Password button click. (Demo placeholder)
 */
function handleForgotPassword() {
    alertUser('Forgot/Reset Password: In a real application, this would initiate a password reset process (e.g., sending an email/SMS). For this demo, your password is "student" followed by your User ID. Please contact your school administrator if you forget it.');
}

/**
 * Initializes elements and listeners specific to the app content after login.
 */
function initializeAppContent() {
    updateStudentContent(); // Ensure data is loaded and displayed for the selected student
    // No need to re-attach static listeners here as they are attached once on DOMContentLoaded
}

/**
 * Updates the content displayed in the Students App based on `currentStudentId`.
 */
function updateStudentContent() {
    studentNotificationsList.innerHTML = '';
    studentHomeworkList.innerHTML = '';
    studentExamResultsList.innerHTML = '';
    csrSubmissionsList.innerHTML = '';

    if (!isLoggedIn || !currentStudentId) {
        selectedStudentInfo.textContent = 'No student selected.';
        studentNotificationsList.innerHTML = `<li class="list-item text-gray-500">Please log in with your User ID and password to view personalized data.</li>`;
        studentHomeworkList.innerHTML = `<li class="list-item text-gray-500">No homework data.</li>`;
        studentExamResultsList.innerHTML = `<li class="list-item text-gray-500">No exam results.</li>`;
        csrSubmissionsList.innerHTML = `<li class="text-gray-500">No submissions yet.</li>`;
        studentUnreadNotificationCount = 0;
        updateStudentsBadge();
        return;
    }

    const currentStudent = students.find(s => s.id === currentStudentId);
    if (!currentStudent) {
        selectedStudentInfo.textContent = 'Error: Student data not found for this User ID. Please try again or ask admin to add.';
        studentNotificationsList.innerHTML = `<li class="list-item text-gray-500">Error: Student data not found.</li>`;
        studentUnreadNotificationCount = 0;
        updateStudentsBadge();
        return;
    }

    selectedStudentInfo.textContent = `Displaying data for ${currentStudent.name} (Class: ${currentStudent.class})`;

    // Display notifications
    const notificationsForStudent = studentNotifications[currentStudentId] || [];
    if (notificationsForStudent.length > 0) {
        notificationsForStudent.slice().reverse().forEach(notif => { // Display latest first
            const li = document.createElement('li');
            li.classList.add('list-item');
            if (!notif.isRead) {
                li.classList.add('unread'); // Apply unread styling
            }
            li.innerHTML = `
                <span class="font-medium">${notif.message}</span>
                <span class="text-xs text-gray-500">${notif.timestamp}</span>
            `;
            studentNotificationsList.appendChild(li);
        });
    } else {
        studentNotificationsList.innerHTML = `<li class="list-item text-gray-500">No new notifications.</li>`;
    }

    // Display homeworks for the student's class
    const homeworksForStudent = homeworks.filter(hw => hw.class === currentStudent.class);
    if (homeworksForStudent.length > 0) {
        homeworksForStudent.forEach(hw => {
            const li = document.createElement('li');
            li.classList.add('list-item');
            li.textContent = `${hw.class}: ${hw.description} (Due: ${hw.dueDate})`;
            studentHomeworkList.appendChild(li);
        });
    } else {
        studentHomeworkList.innerHTML = `<li class="list-item text-gray-500">No homework assigned to your class.</li>`;
    }

    // Display sample exam results (static for now)
    const sampleExamResults = [
        { subject: "Mathematics", score: "85%", grade: "A-", exam: "Mid-Term" },
        { subject: "Science", score: "78%", grade: "B+", exam: "Mid-Term" }
    ];
    if (sampleExamResults.length > 0) {
        sampleExamResults.forEach(res => {
            const li = document.createElement('li');
            li.classList.add('list-item');
            li.textContent = `${res.subject}: ${res.score} (${res.grade}) - ${res.exam}`;
            studentExamResultsList.appendChild(li);
        });
    } else {
        studentExamResultsList.innerHTML = `<li class="list-item text-gray-500">No exam results available yet.</li>`;
    }

    // Display CSR Submissions for the current student
    const submissionsForStudent = csrSubmissions.filter(sub => sub.studentId === currentStudent.id);
    if (submissionsForStudent.length > 0) {
        csrSubmissionsList.innerHTML = ''; // Clear initial message
        submissionsForStudent.slice().reverse().forEach(sub => { // Display latest first
            const li = document.createElement('li');
            li.classList.add('list-item', 'csr-item'); // Adjust for multi-line content
            li.innerHTML = `
                <div class="header-row">
                    <span class="font-bold text-base">${sub.type}</span>
                    <span class="text-xs text-gray-500">${sub.timestamp}</span>
                </div>
                <p class="text-sm text-gray-700">${sub.message}</p>
            `;
            csrSubmissionsList.appendChild(li);
        });
    } else {
        csrSubmissionsList.innerHTML = `<li class="text-gray-500">No submissions yet.</li>`;
    }

    // Recalculate unread count for badge after content update
    studentUnreadNotificationCount = notificationsForStudent.filter(notif => !notif.isRead).length;
    updateStudentsBadge();
}

/**
 * Handles the submission of Feedback, Suggestion, or Complaint.
 */
submitCsrButton.addEventListener('click', () => {
    if (!currentStudentId) {
        alertUser("Please log in with your User ID and password to submit feedback/suggestion/complaint.");
        return;
    }

    const type = csrTypeSelect.value;
    const message = csrMessageTextarea.value.trim();

    if (message) {
        const currentStudent = students.find(s => s.id === currentStudentId);
        const newSubmission = {
            id: Date.now(),
            studentId: currentStudentId,
            studentName: currentStudent ? currentStudent.name : 'Unknown Student',
            type: type,
            message: message,
            timestamp: new Date().toLocaleString(),
            isRead: false // Marked unread for School Management app
        };
        csrSubmissions.push(newSubmission);
        setLocalStorageData('csrSubmissions', csrSubmissions); // Save to localStorage

        csrMessageTextarea.value = '';
        alertUser(`${type} submitted successfully!`);
        updateStudentContent(); // Re-render student content to show new submission

        // Increment school management unread count
        let smCount = getLocalStorageData('schoolManagementUnreadCsrCount', 0);
        smCount++;
        setLocalStorageData('schoolManagementUnreadCsrCount', smCount);

    } else {
        alertUser("Please enter your message.");
    }
});

/**
 * Updates the Students app's notification badge.
 */
function updateStudentsBadge() {
    if (studentUnreadNotificationCount > 0) {
        studentsBadge.textContent = studentUnreadNotificationCount;
        studentsBadge.classList.remove('hidden');
    } else {
        studentsBadge.classList.add('hidden');
    }
}


/**
 * Displays a temporary message to the user instead of alert().
 * @param {string} message - The message to display.
 */
function alertUser(message) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert-message');
    alertDiv.textContent = message;
    document.querySelector('.main-content').prepend(alertDiv); // Add to the top of main content
    setTimeout(() => {
        alertDiv.remove(); // Remove after 3 seconds
    }, 3000);
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Listen for changes in localStorage for real-time updates (simulated)
window.addEventListener('storage', (event) => {
    if (event.key === 'students') {
        students = getLocalStorageData('students', []);
        // If the currently logged-in student's data changes or they are removed
        if (isLoggedIn && currentStudentId && !students.some(s => s.id === currentStudentId)) {
            handleLogout(); // Force logout if current student is removed
        } else if (!isLoggedIn && currentStudentId) {
             // If not logged in but an ID was present, update input
             if (students.some(s => s.id === currentStudentId)) {
                studentUserIdInput.value = currentStudentId;
             } else {
                studentUserIdInput.value = '';
                currentStudentId = null;
                setLocalStorageData('currentStudentId_studentApp', null);
             }
        }
        if (isLoggedIn) {
            updateStudentContent(); // Update content for logged-in student
        }
    }
    if (event.key === 'homeworks') {
        homeworks = getLocalStorageData('homeworks', []);
        if (isLoggedIn) {
            updateStudentContent(); // Re-render homework list
        }
    }
    if (event.key === 'attendanceRecords') {
        attendanceRecords = getLocalStorageData('attendanceRecords', []);
        // No direct display of all attendance in student app, but notification logic could be affected
        // For simplicity, we assume notifications are generated by teachers app and stored in studentNotifications
    }
    if (event.key === 'csrSubmissions') {
        csrSubmissions = getLocalStorageData('csrSubmissions', []);
        if (isLoggedIn) {
            updateStudentContent(); // Re-render CSR list
        }
    }
    if (event.key === 'studentNotifications') {
         studentNotifications = getLocalStorageData('studentNotifications', {});
         if (isLoggedIn) {
            updateStudentContent(); // Re-render notifications and update badge
         } else if (currentStudentId) { // If a student is pre-selected but not logged in, update potential badge count
             const notificationsForSelectedStudent = studentNotifications[currentStudentId] || [];
             studentUnreadNotificationCount = notificationsForSelectedStudent.filter(notif => !notif.isRead).length;
             updateStudentsBadge();
         }
    }
    // Update login state if it changes externally (e.g., user clears localStorage)
    if (event.key === 'student_isLoggedIn') {
        const newLoginState = getLocalStorageData('student_isLoggedIn', false);
        if (newLoginState !== isLoggedIn) { // Only re-evaluate if state actually changed
            isLoggedIn = newLoginState;
            checkLoginStatus();
            if (isLoggedIn) { // If just logged in, call app content init
                initializeAppContent();
            }
        }
    }
    if (event.key === 'currentStudentId_studentApp') {
         const newStudentId = getLocalStorageData('currentStudentId_studentApp', null);
         if (newStudentId !== currentStudentId) {
             currentStudentId = newStudentId;
             if (isLoggedIn) {
                 updateStudentContent();
             } else {
                 // If a student ID is set but not logged in, update the login dropdown
                 if (currentStudentId) {
                     studentUserIdInput.value = currentStudentId;
                 } else {
                     studentUserIdInput.value = '';
                 }
             }
         }
    }
});
