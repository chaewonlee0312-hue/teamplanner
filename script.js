// Team Planner (팀플래너) JavaScript logic

document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let state = {
    user: null,             // { name, email }
    team: {
      teamName: "",
      projectTitle: "",
      members: []           // Array of strings (names)
    },
    roles: {},              // { memberName: roleString }
    schedules: [],          // Array of { id, memberName, date, time }
    meetings: [],           // Array of { id, title, date, time }
    tasks: [],              // Array of { id, title, assignee, completed }
    files: [],              // Array of { id, name, link }
    presentation: []        // Array of { id, memberName, part, order }
  };

  // --- LOCALSTORAGE KEYS ---
  const STORAGE_KEY = "team_planner_state";

  // --- TIMER STATE ---
  let timerInterval = null;
  let timerStartTime = 0;
  let timerElapsedTime = 0;
  let isTimerRunning = false;

  // --- DOM ELEMENTS ---
  const loginContainer = document.getElementById("login-container");
  const appContainer = document.getElementById("app-container");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const userNameDisplay = document.getElementById("user-name-display");

  // Navigation
  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");

  // Team & Roles
  const teamInfoForm = document.getElementById("team-info-form");
  const teamNameInput = document.getElementById("team-name-input");
  const projectTitleInput = document.getElementById("project-title-input");
  const addMemberForm = document.getElementById("add-member-form");
  const memberNameInput = document.getElementById("member-name-input");
  const memberCountDisp = document.getElementById("member-count");
  const membersListContainer = document.getElementById("members-list");

  const assignRoleForm = document.getElementById("assign-role-form");
  const roleMemberSelect = document.getElementById("role-member-select");
  const roleSelect = document.getElementById("role-select");
  const roleTableBody = document.getElementById("role-table-body");

  // Schedule
  const scheduleForm = document.getElementById("schedule-form");
  const scheduleMemberSelect = document.getElementById("schedule-member-select");
  const scheduleDateInput = document.getElementById("schedule-date");
  const scheduleTimeInput = document.getElementById("schedule-time");
  const availabilityListContainer = document.getElementById("availability-list");

  const meetingForm = document.getElementById("meeting-form");
  const meetingTitleInput = document.getElementById("meeting-title");
  const meetingDateInput = document.getElementById("meeting-date");
  const meetingTimeInput = document.getElementById("meeting-time");
  const meetingsListContainer = document.getElementById("meetings-list");

  // Tasks & Progress
  const taskForm = document.getElementById("task-form");
  const taskTitleInput = document.getElementById("task-title");
  const taskAssigneeSelect = document.getElementById("task-assignee");
  const progressPercentageLarge = document.getElementById("progress-percentage-large");
  const progressFillLarge = document.getElementById("progress-fill-large");
  const progressStatsText = document.getElementById("progress-stats-text");
  const todoItemsList = document.getElementById("todo-items-list");
  const filterBtns = document.querySelectorAll(".filter-btn");
  let currentTaskFilter = "all";

  // Files
  const fileShareForm = document.getElementById("file-share-form");
  const fileNameInput = document.getElementById("file-name");
  const fileLinkInput = document.getElementById("file-link");
  const sharedFilesList = document.getElementById("shared-files-list");

  // Presentation
  const presentationForm = document.getElementById("presentation-form");
  const presMemberSelect = document.getElementById("pres-member-select");
  const presPartInput = document.getElementById("pres-part");
  const presOrderInput = document.getElementById("pres-order");
  const presentationTimelineList = document.getElementById("presentation-timeline-list");

  // Stopwatch/Timer
  const timerDisplayMain = document.getElementById("timer-display-main");
  const timerDisplayDash = document.getElementById("timer-display-dash");
  const timerStartMain = document.getElementById("timer-start-main");
  const timerStopMain = document.getElementById("timer-stop-main");
  const timerResetMain = document.getElementById("timer-reset-main");
  const timerStartDash = document.getElementById("timer-start-dash");
  const timerStopDash = document.getElementById("timer-stop-dash");
  const timerResetDash = document.getElementById("timer-reset-dash");

  // Dashboard Summary Elements
  const dashNoTeam = document.getElementById("dash-no-team");
  const dashTeamInfo = document.getElementById("dash-team-info");
  const dashProjectTitle = document.getElementById("dash-project-title");
  const dashTeamName = document.getElementById("dash-team-name");
  const dashMembersList = document.getElementById("dash-members-list");
  const dashProgressFill = document.getElementById("dash-progress-fill");
  const dashProgressPercent = document.getElementById("dash-progress-percent");
  const dashProgressRatio = document.getElementById("dash-progress-ratio");
  const dashTasksList = document.getElementById("dash-tasks-list");
  const dashMeetingsList = document.getElementById("dash-meetings-list");

  // --- INIT & LOCAL STORAGE LOAD ---
  function init() {
    loadState();
    
    // Check if user is logged in
    if (state.user) {
      showApp();
    } else {
      showLogin();
    }
    
    setupEventListeners();
    updateUI();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        state = JSON.parse(saved);
        // Ensure arrays exist
        if (!state.team) state.team = { teamName: "", projectTitle: "", members: [] };
        if (!state.team.members) state.team.members = [];
        if (!state.roles) state.roles = {};
        if (!state.schedules) state.schedules = [];
        if (!state.meetings) state.meetings = [];
        if (!state.tasks) state.tasks = [];
        if (!state.files) state.files = [];
        if (!state.presentation) state.presentation = [];
      } catch (e) {
        console.error("Error parsing saved state: ", e);
      }
    }
  }

  // --- UI TRANSITIONS ---
  function showLogin() {
    loginContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
  }

  function showApp() {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    userNameDisplay.textContent = state.user.name;
    
    // Initialize Lucide Icons inside the app
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Tab switching logic
  function switchTab(tabId) {
    // Deactivate all nav items
    navItems.forEach(item => {
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Hide all tabs, show target tab
    tabContents.forEach(content => {
      if (content.id === `tab-${tabId}`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    // On mobile, close navigation menu after click
    navMenu.classList.remove("active");

    // Recalculate icons in the newly opened tab
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Login Submission
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("login-name").value.trim();
      const email = document.getElementById("login-email").value.trim();
      
      state.user = { name, email };
      saveState();
      showApp();
    });

    // Logout
    logoutBtn.addEventListener("click", logout);

    // Mobile Hamburger
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });

    // Tab Navigation clicks
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const tabId = item.getAttribute("data-tab");
        switchTab(tabId);
      });
    });

    // Navigation Shortcuts (Dashboard quick buttons)
    document.querySelectorAll(".nav-shortcut").forEach(button => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });

    // Team Information Submission
    teamInfoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      state.team.teamName = teamNameInput.value.trim();
      state.team.projectTitle = projectTitleInput.value.trim();
      saveState();
      alert("팀 정보가 저장되었습니다.");
      updateUI();
    });

    // Add Team Member
    addMemberForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = memberNameInput.value.trim();
      
      if (!name) return;
      if (state.team.members.includes(name)) {
        alert("이미 등록된 팀원 이름입니다.");
        return;
      }

      state.team.members.push(name);
      memberNameInput.value = "";
      saveState();
      updateUI();
    });

    // Assign Role Form Submission
    assignRoleForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const member = roleMemberSelect.value;
      const role = roleSelect.value;

      if (!member || !role) {
        alert("팀원과 역할을 선택해 주세요.");
        return;
      }

      state.roles[member] = role;
      saveState();
      alert(`${member}님의 역할이 '${role}'(으)로 지정되었습니다.`);
      
      // Reset selects
      roleMemberSelect.selectedIndex = 0;
      roleSelect.selectedIndex = 0;
      updateUI();
    });

    // Schedule: Add Availability
    scheduleForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const member = scheduleMemberSelect.value;
      const date = scheduleDateInput.value;
      const time = scheduleTimeInput.value.trim();

      if (!member || !date || !time) return;

      const newSchedule = {
        id: "sched_" + Date.now(),
        memberName: member,
        date: date,
        time: time
      };

      state.schedules.push(newSchedule);
      saveState();
      
      // Reset Inputs
      scheduleDateInput.value = "";
      scheduleTimeInput.value = "";
      scheduleMemberSelect.selectedIndex = 0;
      updateUI();
    });

    // Schedule: Register Meeting
    meetingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = meetingTitleInput.value.trim();
      const date = meetingDateInput.value;
      const time = meetingTimeInput.value;

      if (!title || !date || !time) return;

      const newMeeting = {
        id: "meet_" + Date.now(),
        title: title,
        date: date,
        time: time
      };

      state.meetings.push(newMeeting);
      saveState();
      
      // Reset Inputs
      meetingTitleInput.value = "";
      meetingDateInput.value = "";
      meetingTimeInput.value = "";
      updateUI();
    });

    // Tasks: Add Task
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = taskTitleInput.value.trim();
      const assignee = taskAssigneeSelect.value;

      if (!title || !assignee) return;

      const newTask = {
        id: "task_" + Date.now(),
        title: title,
        assignee: assignee,
        completed: false
      };

      state.tasks.push(newTask);
      saveState();
      
      // Reset Inputs
      taskTitleInput.value = "";
      taskAssigneeSelect.selectedIndex = 0;
      updateUI();
    });

    // Tasks: Filter clicks
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => {
          b.classList.remove("btn-primary");
          b.classList.add("btn-outline");
        });
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-outline");

        currentTaskFilter = btn.getAttribute("data-filter");
        renderTasksList();
      });
    });

    // File Sharing Submission
    fileShareForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = fileNameInput.value.trim();
      const link = fileLinkInput.value.trim();

      if (!name || !link) return;

      const newFile = {
        id: "file_" + Date.now(),
        name: name,
        link: link
      };

      state.files.push(newFile);
      saveState();
      
      // Reset Inputs
      fileNameInput.value = "";
      fileLinkInput.value = "";
      updateUI();
    });

    // Presentation: Add Order & Part
    presentationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const member = presMemberSelect.value;
      const part = presPartInput.value.trim();
      const order = parseInt(presOrderInput.value);

      if (!member || !part || isNaN(order)) return;

      // Remove previous entry for the same member if exists, to avoid duplicates
      state.presentation = state.presentation.filter(p => p.memberName !== member);

      const newPres = {
        id: "pres_" + Date.now(),
        memberName: member,
        part: part,
        order: order
      };

      state.presentation.push(newPres);
      
      // Sort presentation array by order ascending
      state.presentation.sort((a, b) => a.order - b.order);
      
      saveState();
      
      // Reset Inputs
      presPartInput.value = "";
      presOrderInput.value = "";
      presMemberSelect.selectedIndex = 0;
      updateUI();
    });

    // Timer Event Listeners
    timerStartMain.addEventListener("click", startTimer);
    timerStartDash.addEventListener("click", startTimer);

    timerStopMain.addEventListener("click", stopTimer);
    timerStopDash.addEventListener("click", stopTimer);

    timerResetMain.addEventListener("click", resetTimer);
    timerResetDash.addEventListener("click", resetTimer);
  }

  function logout() {
    if (confirm("로그아웃 하시겠습니까? 데이터는 유지됩니다.")) {
      state.user = null;
      saveState();
      // stop timer if running
      stopTimer();
      resetTimer();
      showLogin();
    }
  }

  // --- TIMER FUNCTIONS (Stopwatch) ---
  function startTimer() {
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    timerStartTime = Date.now() - timerElapsedTime;
    
    timerInterval = setInterval(updateTimerDisplay, 10); // Check every 10ms (1 centisecond)
    
    // Toggle start/stop button active states if needed
    timerStartMain.classList.add("hidden");
    timerStopMain.classList.remove("hidden");
    timerStartDash.classList.add("hidden");
    timerStopDash.classList.remove("hidden");
  }

  function stopTimer() {
    if (!isTimerRunning) return;
    
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerElapsedTime = Date.now() - timerStartTime;
    
    timerStartMain.classList.remove("hidden");
    timerStopMain.classList.add("hidden");
    timerStartDash.classList.remove("hidden");
    timerStopDash.classList.add("hidden");
  }

  function resetTimer() {
    stopTimer();
    timerElapsedTime = 0;
    
    // Reset display
    timerDisplayMain.textContent = "00:00.00";
    timerDisplayDash.textContent = "00:00";
  }

  function updateTimerDisplay() {
    timerElapsedTime = Date.now() - timerStartTime;
    
    const minutes = Math.floor(timerElapsedTime / 60000);
    const seconds = Math.floor((timerElapsedTime % 60000) / 1000);
    const centiseconds = Math.floor((timerElapsedTime % 1000) / 10);
    
    // Format helper
    const padZero = (num, size = 2) => num.toString().padStart(size, "0");
    
    timerDisplayMain.textContent = `${padZero(minutes)}:${padZero(seconds)}.${padZero(centiseconds)}`;
    timerDisplayDash.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
  }

  // --- UI RENDER ROUTINES ---
  function updateUI() {
    // 1. Populate Dropdowns (Members list dependency)
    populateMemberDropdowns();

    // 2. Render Team Name & Project Form Inputs
    if (state.team.teamName) {
      teamNameInput.value = state.team.teamName;
    }
    if (state.team.projectTitle) {
      projectTitleInput.value = state.team.projectTitle;
    }

    // 3. Render Dashboard Tab
    renderDashboard();

    // 4. Render Team & Roles Tab
    renderMembersList();
    renderRolesTable();

    // 5. Render Schedule Tab
    renderAvailabilityList();
    renderMeetingsList();

    // 6. Render Tasks Tab
    renderTasksProgress();
    renderTasksList();

    // 7. Render Files Tab
    renderFilesList();

    // 8. Render Presentation Tab
    renderPresentationTimeline();

    // Reinitialize Lucide Icons across all rendered structures
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Helper to dynamically refresh member dropdown selectors
  function populateMemberDropdowns() {
    const members = state.team.members;
    
    const dropdowns = [
      { element: roleMemberSelect, placeholder: "역할 지정할 팀원 선택" },
      { element: scheduleMemberSelect, placeholder: "가능 여부를 입력할 팀원 선택" },
      { element: taskAssigneeSelect, placeholder: "담당자 선택" },
      { element: presMemberSelect, placeholder: "발표자 선택" }
    ];

    dropdowns.forEach(dropdown => {
      if (!dropdown.element) return;
      
      const currentSelectedVal = dropdown.element.value;
      dropdown.element.innerHTML = `<option value="" disabled selected>${dropdown.placeholder}</option>`;
      
      members.forEach(member => {
        const option = document.createElement("option");
        option.value = member;
        if (dropdown.element === taskAssigneeSelect) {
          const role = state.roles[member] ? ` (${state.roles[member]})` : " (역할 미지정)";
          option.textContent = `${member}${role}`;
        } else {
          option.textContent = member;
        }
        dropdown.element.appendChild(option);
      });

      // Keep user choice if they were previously selecting a valid existing member
      if (members.includes(currentSelectedVal)) {
        dropdown.element.value = currentSelectedVal;
      }
    });
  }

  // Dashboard Renderer
  function renderDashboard() {
    const hasTeam = state.team.teamName || state.team.projectTitle;
    
    if (hasTeam) {
      dashNoTeam.classList.add("hidden");
      dashTeamInfo.classList.remove("hidden");
      
      dashProjectTitle.textContent = state.team.projectTitle || "(프로젝트 제목 없음)";
      dashTeamName.textContent = state.team.teamName || "(팀명 없음)";
      
      // Render member chips on dashboard
      dashMembersList.innerHTML = "";
      if (state.team.members.length === 0) {
        dashMembersList.innerHTML = `<span class="text-muted text-sm">등록된 팀원이 없습니다.</span>`;
      } else {
        state.team.members.forEach(member => {
          const chip = document.createElement("div");
          chip.className = "member-chip";
          
          const role = state.roles[member] || "역할 미지정";
          let badgeClass = "badge-neutral";
          if (role === "발표") badgeClass = "badge-primary";
          else if (role === "PPT") badgeClass = "badge-success";
          else if (role === "자료조사") badgeClass = "badge-warning";
          else if (role === "보고서 작성") badgeClass = "badge-danger";
          
          chip.innerHTML = `
            <div class="member-avatar">${member.charAt(0)}</div>
            <span>${member}</span>
            <span class="badge ${badgeClass}">${role}</span>
          `;
          dashMembersList.appendChild(chip);
        });
      }
    } else {
      dashNoTeam.classList.remove("hidden");
      dashTeamInfo.classList.add("hidden");
    }

    // Dashboard Project Progress Calculations
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    dashProgressFill.style.width = `${progressPercent}%`;
    dashProgressPercent.textContent = `${progressPercent}%`;
    dashProgressRatio.textContent = `(총 ${totalTasks}개 중 ${completedTasks}개 완료)`;

    // Dashboard Recent Tasks (Uncompleted)
    dashTasksList.innerHTML = "";
    const uncompletedTasks = state.tasks.filter(t => !t.completed).slice(0, 4); // Limit to 4
    
    if (uncompletedTasks.length === 0) {
      dashTasksList.innerHTML = `<li class="text-muted text-sm text-center py-2">남아있는 할 일이 없습니다!</li>`;
    } else {
      uncompletedTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "dash-list-item";
        const role = state.roles[task.assignee] ? ` (${state.roles[task.assignee]})` : "";
        li.innerHTML = `
          <span>${task.title}</span>
          <span class="badge badge-primary">${task.assignee}${role}</span>
        `;
        dashTasksList.appendChild(li);
      });
    }

    // Dashboard Upcoming Meetings
    dashMeetingsList.innerHTML = "";
    const sortedMeetings = [...state.meetings].sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time}`;
      const dateTimeB = `${b.date}T${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });
    
    if (sortedMeetings.length === 0) {
      dashMeetingsList.innerHTML = `<li class="text-muted text-sm text-center py-2">등록된 회의 일정이 없습니다.</li>`;
    } else {
      // Show top 3 meetings
      sortedMeetings.slice(0, 3).forEach(meeting => {
        const li = document.createElement("li");
        li.className = "meeting-timeline-item";
        li.innerHTML = `
          <div class="meeting-timeline-details">
            <span class="meeting-time-lbl">${formatDateKorean(meeting.date)} ${meeting.time}</span>
            <span class="meeting-title-lbl">${meeting.title}</span>
          </div>
        `;
        dashMeetingsList.appendChild(li);
      });
    }
  }

  // Helper date formatter (Timezone-safe)
  function formatDateKorean(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    
    const mm = parts[1];
    const dd = parts[2];
    
    // Construct local date to find day of the week correctly
    const date = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const day = days[date.getDay()];
    return `${mm}월 ${dd}일(${day})`;
  }

  // Team & Roles Tab Renderers
  function renderMembersList() {
    const members = state.team.members;
    memberCountDisp.textContent = members.length;
    membersListContainer.innerHTML = "";
    
    if (members.length === 0) {
      membersListContainer.innerHTML = `<div class="empty-text">등록된 팀원이 없습니다. 팀원을 추가해 주세요.</div>`;
      return;
    }

    members.forEach(member => {
      const chip = document.createElement("div");
      chip.className = "member-chip";
      
      const avatar = document.createElement("div");
      avatar.className = "member-avatar";
      avatar.textContent = member.charAt(0);
      
      const text = document.createElement("span");
      text.textContent = member;
      
      const delBtn = document.createElement("button");
      delBtn.className = "btn-remove-member";
      delBtn.innerHTML = "&times;";
      delBtn.title = "삭제";
      delBtn.addEventListener("click", () => {
        removeMember(member);
      });

      chip.appendChild(avatar);
      chip.appendChild(text);
      chip.appendChild(delBtn);
      membersListContainer.appendChild(chip);
    });
  }

  function removeMember(name) {
    if (confirm(`팀원 '${name}'님을 프로젝트에서 제외하시겠습니까?\n해당 팀원이 배정된 역할 및 할 일 담당자 정보도 미지정 상태로 변경됩니다.`)) {
      // 1. Remove from members array
      state.team.members = state.team.members.filter(m => m !== name);

      // 2. Remove role assignment
      if (state.roles[name]) {
        delete state.roles[name];
      }

      // 3. Remove/clean task assignee
      state.tasks.forEach(task => {
        if (task.assignee === name) {
          task.assignee = "(미지정)";
        }
      });

      // 4. Remove schedule availabilities
      state.schedules = state.schedules.filter(s => s.memberName !== name);

      // 5. Remove presentation setup
      state.presentation = state.presentation.filter(p => p.memberName !== name);

      saveState();
      updateUI();
    }
  }

  function renderRolesTable() {
    roleTableBody.innerHTML = "";
    const members = state.team.members;

    if (members.length === 0) {
      roleTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">등록된 팀원이 없어 역할 분배가 불가능합니다.</td>
        </tr>
      `;
      return;
    }

    members.forEach(member => {
      const role = state.roles[member] || "(역할 미지정)";
      
      // Determine badge class
      let badgeClass = "badge-neutral";
      if (role === "발표") badgeClass = "badge-primary";
      else if (role === "PPT") badgeClass = "badge-success";
      else if (role === "자료조사") badgeClass = "badge-warning";
      else if (role === "보고서 작성") badgeClass = "badge-danger";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${member}</strong></td>
        <td>${role}</td>
        <td><span class="badge ${badgeClass}">${role}</span></td>
        <td>
          <button class="btn btn-xs btn-outline btn-clear-role" data-member="${member}">역할 해제</button>
        </td>
      `;

      // Event listener for clearing role
      tr.querySelector(".btn-clear-role").addEventListener("click", () => {
        if (state.roles[member]) {
          delete state.roles[member];
          saveState();
          updateUI();
        }
      });

      roleTableBody.appendChild(tr);
    });
  }

  // Schedule Tab Renderers
  function renderAvailabilityList() {
    availabilityListContainer.innerHTML = "";

    if (state.schedules.length === 0) {
      availabilityListContainer.innerHTML = `<div class="empty-text">등록된 가능 일정이 없습니다.</div>`;
      return;
    }

    // Sort schedules by date
    const sorted = [...state.schedules].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(item => {
      const card = document.createElement("div");
      card.className = "avail-card";
      card.innerHTML = `
        <div class="avail-info-left">
          <span class="avail-member">${item.memberName}</span>
          <span class="avail-datetime"><i data-lucide="calendar" class="inline-icon"></i> ${formatDateKorean(item.date)} | <i data-lucide="clock" class="inline-icon"></i> ${item.time}</span>
        </div>
        <button class="btn-icon-del btn-delete-sched" data-id="${item.id}" title="삭제">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      card.querySelector(".btn-delete-sched").addEventListener("click", () => {
        deleteSchedule(item.id);
      });

      availabilityListContainer.appendChild(card);
    });
  }

  function deleteSchedule(id) {
    state.schedules = state.schedules.filter(s => s.id !== id);
    saveState();
    updateUI();
  }

  function renderMeetingsList() {
    meetingsListContainer.innerHTML = "";

    if (state.meetings.length === 0) {
      meetingsListContainer.innerHTML = `<div class="empty-text">확정된 회의 일정이 없습니다. 회의를 등록해 주세요.</div>`;
      return;
    }

    // Sort meetings by date/time ascending
    const sorted = [...state.meetings].sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time}`;
      const dateTimeB = `${b.date}T${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    sorted.forEach(meeting => {
      const card = document.createElement("div");
      card.className = "meeting-card-item";
      card.innerHTML = `
        <div class="meeting-card-title">${meeting.title}</div>
        <div class="meeting-card-datetime">
          <i data-lucide="calendar" class="inline-icon"></i> ${formatDateKorean(meeting.date)} ${meeting.time}
        </div>
        <button class="meeting-card-delete btn-delete-meet" data-id="${meeting.id}">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      card.querySelector(".btn-delete-meet").addEventListener("click", () => {
        deleteMeeting(meeting.id);
      });

      meetingsListContainer.appendChild(card);
    });
  }

  function deleteMeeting(id) {
    if (confirm("회의 일정을 삭제하시겠습니까?")) {
      state.meetings = state.meetings.filter(m => m.id !== id);
      saveState();
      updateUI();
    }
  }

  // Tasks Tab Renderers
  function renderTasksProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressPercentageLarge.textContent = `${pct}%`;
    progressFillLarge.style.width = `${pct}%`;
    progressStatsText.textContent = `총 ${total}개의 할 일 중 ${completed}개 완료됨`;
  }

  function renderTasksList() {
    todoItemsList.innerHTML = "";

    let filteredTasks = state.tasks;
    if (currentTaskFilter === "active") {
      filteredTasks = state.tasks.filter(t => !t.completed);
    } else if (currentTaskFilter === "completed") {
      filteredTasks = state.tasks.filter(t => t.completed);
    }

    if (filteredTasks.length === 0) {
      const text = currentTaskFilter === "all" 
        ? "아직 등록된 할 일이 없습니다." 
        : currentTaskFilter === "active" 
          ? "진행 중인 할 일이 없습니다." 
          : "완료된 할 일이 없습니다.";
      
      todoItemsList.innerHTML = `
        <li class="empty-state-item text-center text-muted py-4">
          <p>${text}</p>
        </li>
      `;
      return;
    }

    filteredTasks.forEach(task => {
      const role = state.roles[task.assignee] || "";
      let badgeHtml = "";
      if (role) {
        let badgeClass = "badge-neutral";
        if (role === "발표") badgeClass = "badge-primary";
        else if (role === "PPT") badgeClass = "badge-success";
        else if (role === "자료조사") badgeClass = "badge-warning";
        else if (role === "보고서 작성") badgeClass = "badge-danger";
        
        badgeHtml = ` <span class="badge ${badgeClass}" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; margin-left: 0.4rem; vertical-align: middle;">${role}</span>`;
      }

      const li = document.createElement("li");
      li.className = `todo-item ${task.completed ? "completed" : ""}`;
      li.innerHTML = `
        <div class="todo-item-left">
          <input type="checkbox" class="todo-checkbox" ${task.completed ? "checked" : ""}>
          <div class="todo-text-wrapper">
            <span class="todo-title">${task.title}</span>
            <span class="todo-assignee"><i data-lucide="user" class="inline-icon"></i> 담당자: <strong>${task.assignee}</strong>${badgeHtml}</span>
          </div>
        </div>
        <div class="todo-item-right">
          <button class="btn-icon-del btn-delete-task" data-id="${task.id}" title="할 일 삭제">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      // Checkbox listener
      li.querySelector(".todo-checkbox").addEventListener("change", (e) => {
        toggleTaskCompletion(task.id, e.target.checked);
      });

      // Delete listener
      li.querySelector(".btn-delete-task").addEventListener("click", () => {
        deleteTask(task.id);
      });

      todoItemsList.appendChild(li);
    });
  }

  function toggleTaskCompletion(id, isCompleted) {
    state.tasks = state.tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: isCompleted };
      }
      return task;
    });
    saveState();
    updateUI();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    updateUI();
  }

  // Files Tab Renderers
  function renderFilesList() {
    sharedFilesList.innerHTML = "";

    if (state.files.length === 0) {
      sharedFilesList.innerHTML = `<div class="empty-text">등록된 공유 자료가 없습니다.</div>`;
      return;
    }

    state.files.forEach(file => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.innerHTML = `
        <div class="file-info-left">
          <div class="file-icon-wrapper">
            <i data-lucide="file-text"></i>
          </div>
          <div class="file-meta">
            <span class="file-name-txt">${file.name}</span>
            <span class="file-url-txt">${file.link}</span>
          </div>
        </div>
        <div class="file-actions">
          <a href="${file.link}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline"><i data-lucide="external-link"></i> 열기</a>
          <button class="btn-icon-del btn-delete-file" data-id="${file.id}" title="삭제">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      li.querySelector(".btn-delete-file").addEventListener("click", () => {
        deleteFile(file.id);
      });

      sharedFilesList.appendChild(li);
    });
  }

  function deleteFile(id) {
    if (confirm("공유 링크를 삭제하시겠습니까?")) {
      state.files = state.files.filter(f => f.id !== id);
      saveState();
      updateUI();
    }
  }

  // Presentation Tab Renderers
  function renderPresentationTimeline() {
    presentationTimelineList.innerHTML = "";

    if (state.presentation.length === 0) {
      presentationTimelineList.innerHTML = `<div class="empty-text">설정된 발표 순서가 없습니다. 발표 설정을 추가해 주세요.</div>`;
      return;
    }

    state.presentation.forEach(item => {
      const card = document.createElement("div");
      card.className = "timeline-card";
      card.innerHTML = `
        <div class="timeline-badge-order">${item.order}</div>
        <div class="timeline-info">
          <span class="timeline-member-name">${item.memberName} <span class="badge badge-primary">${state.roles[item.memberName] || "발표자"}</span></span>
          <span class="timeline-part-desc"><i data-lucide="book-open" class="inline-icon"></i> ${item.part}</span>
        </div>
        <button class="btn-icon-del btn-delete-pres" data-id="${item.id}" title="삭제">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      card.querySelector(".btn-delete-pres").addEventListener("click", () => {
        deletePresentationItem(item.id);
      });

      presentationTimelineList.appendChild(card);
    });
  }

  function deletePresentationItem(id) {
    state.presentation = state.presentation.filter(p => p.id !== id);
    saveState();
    updateUI();
  }

  // --- INITIALIZE APPLICATION ---
  init();
});
