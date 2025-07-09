// hourlychime-cli.js - A terminal-based HourlyChime application
// To run: node hourlychime-cli.js

const blessed = require('blessed');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const notifier = require('node-notifier');
const { spawn } = require('child_process');

// --- Configuration ---
const CHIMES_FILE = 'chimes.txt';
const CONFIG_FILE = 'config.json';

// --- Application State ---
let tasks = [];
let alertPoints = [];
let mainInterval;
let beepInterval;
let isBeeping = false;
let lastAlertFired = null;
let showDigitalTime = true;
let calendarVisible = true;
let supportsUnicode = null;

// --- Blessed UI Setup ---
let screen;
let layout;
let timerBox;
let countdownText;
let currentTaskText;
let nextTaskText;
let leftColumn;
let configBox;
let alertHistoryBox;
let calendarBox;
let statusBox;

function createBlessedInterface() {
    screen = blessed.screen({
        smartCSR: true,
        title: 'HourlyChime CLI',
        fullUnicode: true
    });

    // Main layout box
    layout = blessed.box({
        parent: screen,
        width: '100%',
        height: '100%',
    });

    // Title Box
    blessed.box({
        parent: layout,
        top: 0,
        left: 'center',
        width: '98%',
        height: 3,
        content: chalk.bold.cyan('⏰  HourlyChime CLI'),
        align: 'center',
        valign: 'middle',
    });

    // Timer and Status Box
    timerBox = blessed.box({
        parent: layout,
        top: 3,
        left: 'center',
        width: '98%',
        height: 7,
        border: { type: 'line' },
        style: { border: { fg: 'cyan' } },
        label: ' Timer & Status '
    });

    countdownText = blessed.text({
        parent: timerBox,
        top: 'center',
        left: 'center',
        content: '--:--',
        style: { fg: 'yellow', bold: true },
        align: 'center',
        height: 1,
    });

    currentTaskText = blessed.text({ parent: timerBox, top: 1, left: 2 });
    nextTaskText = blessed.text({ parent: timerBox, bottom: 1, left: 2 });

    // Left column for configuration and alerts
    leftColumn = blessed.box({
        parent: layout,
        top: 10,
        left: '1%',
        width: calendarVisible ? '48%' : '98%',
        height: '80%'
    });

    // Configuration box
    configBox = blessed.box({
        parent: leftColumn,
        top: 0,
        left: 0,
        width: '100%',
        height: '60%',
        label: ' Today\'s Schedule ',
        border: { type: 'line' },
        style: {
            fg: 'white',
            border: { fg: 'green' }
        },
        scrollable: true,
        alwaysScroll: true
    });

    // Alert History box
    alertHistoryBox = blessed.box({
        parent: leftColumn,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '40%',
        label: ' Recent Alerts ',
        border: { type: 'line' },
        style: {
            fg: 'gray',
            border: { fg: 'magenta' },
        },
        scrollable: true,
        alwaysScroll: true
    });

    // Right column for Calendar Timeline
    calendarBox = blessed.box({
        parent: layout,
        top: 10,
        left: '50%',
        width: '48%',
        height: '80%',
        label: ' Daily Timeline ',
        border: { type: 'line' },
        style: { border: { fg: 'yellow' } },
        content: '',
        scrollable: true,
        alwaysScroll: true
    });

    // Status box
    statusBox = blessed.box({
        parent: layout,
        bottom: 0,
        height: 3,
        width: '100%',
        align: 'center',
        valign: 'middle',
        content: ''
    });

    // Set up event handlers
    setupEventHandlers();

    // Handle calendar visibility
    if (calendarVisible) {
        calendarBox.show();
    } else {
        calendarBox.hide();
    }

    // Handle resize events
    screen.on('resize', updateUI);
}

// --- Vim Integration Functions ---

function openInVim(filename) {
    return new Promise((resolve, reject) => {
        // Clear the screen
        screen.destroy();
        console.clear();

        // Spawn vim process
        const vim = spawn('vim', [filename], {
            stdio: 'inherit'
        });

        vim.on('close', (code) => {
            // Small delay to ensure terminal is ready
            setTimeout(() => {
                // Recreate the screen
                recreateScreen();

                // Reload data from files
                loadChimes();

                updateUI();
                resolve();
            }, 100);
        });

        vim.on('error', (err) => {
            console.error(chalk.red('Error opening vim:'), err.message);
            console.log(chalk.yellow('Make sure vim is installed and in your PATH'));
            console.log(chalk.gray('Press any key to return to HourlyChime...'));

            // Wait for keypress then recreate screen
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();

                setTimeout(() => {
                    recreateScreen();
                    updateUI();
                    reject(err);
                }, 100);
            });
        });
    });
}

function recreateScreen() {
    // Completely recreate the blessed interface
    createBlessedInterface();
    screen.render();
}

async function editChimes() {
    try {
        await openInVim(CHIMES_FILE);
    } catch (error) {
        // Error already handled in openInVim
    }
}

// --- Core Logic ---

function detectUnicodeSupport() {
    // Cache the result
    if (supportsUnicode !== null) {
        return supportsUnicode;
    }
    
    // Manual override via environment variable
    if (process.env.HOURLYCHIME_ASCII === '1' || process.env.HOURLYCHIME_ASCII === 'true') {
        supportsUnicode = false;
        return false;
    }
    
    // Check various terminal indicators
    const termProgram = process.env.TERM_PROGRAM;
    const term = process.env.TERM;
    const ssh = process.env.SSH_CLIENT || process.env.SSH_TTY || process.env.SSH_CONNECTION;
    
    // Known terminals with poor Unicode support
    const poorUnicodeTerminals = [
        'termius',
        'putty',
        'teraterm'
    ];
    
    // Check if we're in a known problematic terminal
    if (termProgram && poorUnicodeTerminals.some(t => 
        termProgram.toLowerCase().includes(t))) {
        supportsUnicode = false;
        return false;
    }
    
    // Check for Termius-specific environment variables
    if (process.env.TERMIUS || process.env.LC_TERMINAL === 'Termius') {
        supportsUnicode = false;
        return false;
    }
    
    // If TERM_PROGRAM is undefined and we have an SSH connection, likely problematic
    if (!termProgram && ssh) {
        supportsUnicode = false;
        return false;
    }
    
    // SSH connections often have encoding issues
    if (ssh && (!term || term === 'xterm' || term === 'screen')) {
        supportsUnicode = false;
        return false;
    }
    
    // Default to Unicode support for modern terminals
    supportsUnicode = true;
    return true;
}

function parseChimeConfig(text) {
    const lines = text.split('\n');
    const parsed = [];

    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        const match = line.match(/^(\d{2}):(\d{2})\s*(?:-\s*(.*?))?$/);
        if (match) {
            const time = `${match[1]}:${match[2]}`;
            let task = match[3] || 'Untitled Chime';
            let duration = 0;

            const durationMatch = task.match(/(.*?)\s*-\s*(\d+)\s*(min|hour)s?$/i);
            if (durationMatch) {
                task = durationMatch[1].trim();
                const value = parseInt(durationMatch[2], 10);
                const unit = durationMatch[3].toLowerCase();
                duration = unit === 'hour' ? value * 60 : value;
            }

            const date = new Date();
            date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);

            if (task.trim() === '') task = 'Untitled Chime';
            parsed.push({ time, task: task.trim(), date, duration, endDate: null, originalIndex: index });
        }
    });

    const sortedTasks = parsed.sort((a, b) => a.date - b.date);

    // Calculate durations and end dates
    sortedTasks.forEach((task, i) => {
        if (task.duration === 0) {
            if (i < sortedTasks.length - 1) {
                task.duration = (sortedTasks[i+1].date - task.date) / 60000;
            } else {
                task.duration = 15; // Default duration for last task
            }
        }
        task.endDate = new Date(task.date.getTime() + task.duration * 60000);
    });

    // Create alert points
    const newAlertPoints = [];
    sortedTasks.forEach((task, i) => {
        const nextTask = sortedTasks[i+1] || null;

        newAlertPoints.push({ date: task.date, type: 'start', task });

        const isOverlapping = nextTask && task.endDate.getTime() === nextTask.date.getTime();
        if (!isOverlapping) {
            newAlertPoints.push({ date: task.endDate, type: 'end', task });
        }
    });

    const finalAlertPoints = newAlertPoints.sort((a,b) => a.date - b.date);

    return { tasks: sortedTasks, alertPoints: finalAlertPoints };
}

function loadChimes() {
    try {
        if (!fs.existsSync(CHIMES_FILE)) {
            fs.writeFileSync(CHIMES_FILE, '09:00 - Morning standup - 15 min\n12:00 - Lunch break - 1 hour\n15:00 - Afternoon review\n17:30 - Wrap up\n20:00 - Evening planning');
        }
        const fileContent = fs.readFileSync(CHIMES_FILE, 'utf8');
        const result = parseChimeConfig(fileContent);
        tasks = result.tasks;
        alertPoints = result.alertPoints;
    } catch (error) {
        tasks = [];
        alertPoints = [];
    }
}

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        showDigitalTime = config.showDigitalTime !== false;
        calendarVisible = config.calendarVisible !== false;
    } catch (error) {
        showDigitalTime = true;
        calendarVisible = true;
    }
}

function saveConfig() {
    try {
        const config = {
            showDigitalTime,
            calendarVisible
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        // Silently fail if can't save config
    }
}

function findCurrentAndNextTasks(now) {
    let current = null;
    let next = null;

    // Find current task (one that we're inside of)
    for (let i = tasks.length - 1; i >= 0; i--) {
        if (tasks[i].date <= now && tasks[i].endDate > now) {
            current = tasks[i];
            break;
        }
    }

    // Find next task
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].date > now) {
            next = tasks[i];
            break;
        }
    }

    return { current, next };
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatCountdown(seconds) {
    seconds = Math.round(seconds);
    if (seconds < 0) seconds = 0;

    if (showDigitalTime) {
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        } else {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
    } else {
        // Visual progress bars
        const totalSecondsForDisplay = 3600;
        let remainingSecondsForDisplay = seconds % totalSecondsForDisplay;

        if (seconds > 0 && remainingSecondsForDisplay === 0) {
            remainingSecondsForDisplay = totalSecondsForDisplay;
        }

        const fullHoursRemaining = Math.floor(seconds / totalSecondsForDisplay);
        const progressPercentage = remainingSecondsForDisplay / totalSecondsForDisplay;

        const totalBlocks = 20;
        const filledBlocks = Math.round(progressPercentage * totalBlocks);
        const emptyBlocks = totalBlocks - filledBlocks;

        let progressBar = '';

        const useUnicode = detectUnicodeSupport();
        const filledChar = useUnicode ? '█' : '=';
        const emptyChar = useUnicode ? '▓' : '-';
        
        if (fullHoursRemaining >= 3) {
            progressBar = chalk.dim(filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks));
        } else if (fullHoursRemaining >= 2) {
            progressBar = chalk.gray(filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks));
        } else if (fullHoursRemaining >= 1) {
            progressBar = chalk.white(filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks));
        } else {
            progressBar = chalk.yellow(filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks));
        }

        if (fullHoursRemaining > 0) {
            progressBar += chalk.cyan(` +${fullHoursRemaining}h`);
        }

        return progressBar;
    }
}

function renderCalendar() {
    if (!calendarVisible) {
        return;
    }

    const now = new Date();

    // Determine time range for calendar
    let startHour = 0;
    let endHour = 23;

    if (tasks.length > 0) {
        startHour = Math.max(0, tasks[0].date.getHours() - 1);
        const lastTask = tasks[tasks.length - 1];
        endHour = Math.min(23, lastTask.endDate.getHours() + 1);
    }

    const width = 45;
    let lines = [];

    // Create base timeline with 15-minute increments
    const timelineData = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let quarter = 0; quarter < 4; quarter++) {
            const minute = quarter * 15;
            const lineTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

            timelineData.push({
                time: lineTime,
                isHour: minute === 0,
                timeStr: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
                content: null // Will be filled with task data
            });
        }
    }

    // Overlay tasks on the timeline data
    tasks.forEach((task) => {
        const taskStart = task.date;
        const taskEnd = task.endDate;

        // Determine task styling
        const isActive = now >= task.date && now < task.endDate;
        const isPast = task.endDate <= now;

        let taskColor;
        if (isPast) {
            taskColor = chalk.green;
        } else if (isActive) {
            taskColor = chalk.bgYellow.black;
        } else {
            taskColor = chalk.bgBlue.white;
        }

        // Find which timeline entries this task covers
        timelineData.forEach((entry, entryIndex) => {
            if (entry.time >= taskStart && entry.time < taskEnd) {
                // Check if this is the first line of the task
                const isFirstLine = entry.time.getTime() === taskStart.getTime() ||
                                   (entry.time < taskStart && timelineData[entryIndex + 1]?.time > taskStart);

                if (isFirstLine) {
                    const taskText = ` ${formatTime(taskStart)} │ ${task.task} (${task.duration}m)`;
                    entry.content = taskColor(taskText.padEnd(width));
                } else {
                    const continuationText = `        │`;
                    entry.content = taskColor(continuationText.padEnd(width));
                }
            }
        });
    });

    // Build the final output and insert NOW pointer where appropriate
    const nowTime = formatTime(now);
    const nowLine = chalk.bold.red(`     ${nowTime} ◀ NOW`);
    let nowInserted = false;

    timelineData.forEach((entry, index) => {
        // Check if we should insert NOW line before this entry
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const entryMinutes = entry.time.getHours() * 60 + entry.time.getMinutes();
        const prevEntryMinutes = index > 0 ?
            (timelineData[index - 1].time.getHours() * 60 + timelineData[index - 1].time.getMinutes()) :
            -1;

        // Insert NOW if current time falls between previous entry and this entry
        if (!nowInserted && currentMinutes > prevEntryMinutes && currentMinutes <= entryMinutes) {
            lines.push(nowLine);
            nowInserted = true;
        }

        // Add the regular timeline entry
        if (entry.content) {
            // Task block
            lines.push(entry.content);
        } else if (entry.isHour) {
            // Hour marker
            lines.push(chalk.yellow.bold(entry.timeStr) + ' ' + chalk.dim('─'.repeat(width - 6)));
        } else {
            // Quarter hour marker
            lines.push(chalk.gray(entry.timeStr) + ' ' + chalk.dim('·'.repeat(width - 6)));
        }
    });

    // If NOW wasn't inserted yet (current time is after all entries), add it at the end
    if (!nowInserted) {
        lines.push(nowLine);
    }

    calendarBox.setContent(lines.join('\n'));
}

function checkAlerts(now) {
    let alertToFire = null;

    // Find the most recent alert that should have passed
    for (let i = alertPoints.length - 1; i >= 0; i--) {
        const alertPoint = alertPoints[i];
        if (alertPoint.date <= now) {
            // Check if this is a new alert we haven't fired yet
            if (alertPoint.date.getTime() !== lastAlertFired) {
                alertToFire = alertPoint;
            }
            break;
        }
    }

    if (alertToFire) {
        triggerChime(alertToFire);
        lastAlertFired = alertToFire.date.getTime();
    }
}

function triggerChime(alertPoint) {
    const { type, task } = alertPoint;
    startBeep();

    // Find the next task for the notification
    let nextTaskInList = null;
    const currentTaskIndex = tasks.findIndex(t => t.originalIndex === task.originalIndex);
    if (currentTaskIndex > -1 && currentTaskIndex < tasks.length - 1) {
        nextTaskInList = tasks[currentTaskIndex + 1];
    }

    const title = type === 'start' ? `Starting: ${task.task}` : `Finished: ${task.task}`;
    const body = nextTaskInList ? `Next Up: ${nextTaskInList.task} at ${formatTime(nextTaskInList.date)}` : `Next Up: No more tasks today`;

    notifier.notify({
        title: title,
        message: body,
        sound: true,
        wait: false
    });

    // Add to alert history
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertEntry = `[${timeStr}] ${type === 'start' ? 'Started' : 'Finished'}: ${task.task}`;
    const currentHistory = alertHistoryBox.getContent().split('\n').filter(Boolean);
    currentHistory.unshift(alertEntry);
    if (currentHistory.length > 20) currentHistory.pop(); // Keep last 20 alerts
    alertHistoryBox.setContent(currentHistory.join('\n'));

    updateUI();
}

function startBeep() {
    if (beepInterval) return;
    isBeeping = true;

    beepInterval = setInterval(() => {
        if (isBeeping) {
            process.stdout.write('\x07'); // System beep
        } else {
            stopBeep();
        }
    }, 1500);
}

function stopBeep() {
    if (beepInterval) {
        clearInterval(beepInterval);
        beepInterval = null;
    }
    isBeeping = false;
}

function dismissBeep() {
    if (!isBeeping) return;
    stopBeep();
    updateUI();
}

function updateUI() {
    const now = new Date();

    // Update countdown
    const { current, next } = findCurrentAndNextTasks(now);

    currentTaskText.setContent(`${chalk.bold('Current:')} ${current ? `${current.task} (${formatTime(current.date)}-${formatTime(current.endDate)})` : '--'}`);
    nextTaskText.setContent(`${chalk.bold('Next:')} ${next ? `${next.task} at ${formatTime(next.date)}` : '--'}`);

    let targetDate;
    if (current && now < current.endDate) {
        // Inside a task, countdown to its end
        targetDate = current.endDate;
    } else if (next) {
        // Between tasks or before first, countdown to next start
        targetDate = next.date;
    }

    if (targetDate) {
        const remainingSeconds = (targetDate - now) / 1000;
        if (remainingSeconds >= 0) {
            countdownText.setContent(formatCountdown(remainingSeconds));
        }
    } else {
        const fallbackChar = detectUnicodeSupport() ? '■' : '=';
        countdownText.setContent(showDigitalTime ? '--:--' : fallbackChar.repeat(5));
    }

    // Update configuration display
    renderConfigBox();

    // Update calendar
    renderCalendar();

    // Update status bar
    updateStatusBar();

    // Force screen refresh
    screen.render();
}

function renderConfigBox() {
    const lines = fs.readFileSync(CHIMES_FILE, 'utf8').split('\n');
    const now = new Date();
    const currentTime = formatTime(now);

    const displayLines = lines.map((line, index) => {
        if (!line.trim()) return '';

        // Check if this is the current active task
        const task = tasks.find(t => t.originalIndex === index);
        if (task && now >= task.date && now < task.endDate) {
            return chalk.bold.yellow(line);
        }

        return chalk.white(line);
    });

    configBox.setContent(displayLines.join('\n'));
}

function updateStatusBar() {
    let content;

    if (isBeeping) {
        content = '🔔 CHIMING! Press "d" to dismiss alert.';
        statusBox.style = { fg: 'red', bold: true };
    } else {
        content = 'Controls: (e)dit chimes | (d)ismiss | (p)ostpone future | (r)eload | (c)alendar | (t)ime | (q)uit';
        statusBox.style = { fg: 'white' };
    }

    statusBox.setContent(content);
}

function tick() {
    const now = new Date();
    checkAlerts(now);
    updateUI();
}

function postponeFutureTasks() {
    const now = new Date();
    const lines = fs.readFileSync(CHIMES_FILE, 'utf8').split('\n');
    let changed = false;

    const updatedLines = lines.map(line => {
        const timeMatch = line.match(/^(\d{2}):(\d{2})/);
        if (timeMatch) {
            const hour = parseInt(timeMatch[1], 10);
            const minute = parseInt(timeMatch[2], 10);
            const taskDate = new Date();
            taskDate.setHours(hour, minute, 0, 0);

            if (taskDate > now) {
                taskDate.setMinutes(taskDate.getMinutes() + 15);
                const newTime = formatTime(taskDate);
                changed = true;
                return line.replace(/^\d{2}:\d{2}/, newTime);
            }
        }
        return line;
    });

    if (changed) {
        fs.writeFileSync(CHIMES_FILE, updatedLines.join('\n'));
        loadChimes();
        updateUI();
    }
}

function reload() {
    loadChimes();
    updateUI();
}

function toggleCalendar() {
    calendarVisible = !calendarVisible;

    if (calendarVisible) {
        leftColumn.width = '48%';
        calendarBox.show();
        renderCalendar();
    } else {
        leftColumn.width = '98%';
        calendarBox.hide();
    }

    saveConfig();
    screen.render();
}

function toggleDigitalTime() {
    showDigitalTime = !showDigitalTime;
    saveConfig();
    updateUI();
}

function setupEventHandlers() {
    screen.key(['e'], editChimes);
    screen.key(['d'], dismissBeep);
    screen.key(['p'], postponeFutureTasks);
    screen.key(['r'], reload);
    screen.key(['c'], toggleCalendar);
    screen.key(['t'], toggleDigitalTime);
    screen.key(['q', 'C-c'], () => {
        stopBeep();
        process.exit(0);
    });
}

// --- Initial Load ---
loadConfig();
loadChimes();

// Create the blessed interface
createBlessedInterface();

// Start the main loop
mainInterval = setInterval(tick, 1000);

// Wait for screen to be ready before initial render
setTimeout(() => {
    updateUI();
}, 100);