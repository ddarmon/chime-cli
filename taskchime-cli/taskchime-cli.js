// cli.js - A terminal-based TaskChime application
// To run: node cli.js

const blessed = require('blessed');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const notifier = require('node-notifier');
const { spawn } = require('child_process');

// --- Configuration ---
const TASKS_FILE = 'tasks.txt';
const COMPLETED_FILE = 'completed.txt';
const CONFIG_FILE = 'config.json';

// --- Application State ---
let tasks = []; // { name, duration, startTime?, endTime? }
let completedTasksLog = [];
let isRunning = false;
let isPaused = false;
let isChiming = false;
let currentTaskIndex = -1;
let queueStartTime = null;
let lastPauseTime = null;
let pausedDuration = 0;         // Total time spent paused in ms
let completedTasksDuration = 0; // Total duration of completed tasks in minutes
let mainInterval;
let beepInterval;               // For persistent completion alert
let lastCompletedTask = null;   // Track the task that just completed
let calendarVisible = true;
let showDigitalTime = true;     // Toggleable digital time display
let supportsUnicode = null;

// --- Blessed UI Setup ---
let screen;
let layout;
let timerBox;
let countdownText;
let currentTaskText;
let nextTaskText;
let leftColumn;
let activeTasksBox;
let completedTasksBox;
let calendarBox;
let statusBox;

function createBlessedInterface() {
    screen = blessed.screen({
        smartCSR: true,
        title: 'TaskChime CLI',
        fullUnicode: true // For block characters
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
        content: chalk.bold.cyan('⏱️  TaskChime CLI'),
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

    // Left column for task lists
    leftColumn = blessed.box({
        parent: layout,
        top: 10,
        left: '1%',
        width: calendarVisible ? '38%' : '98%',
        height: '80%'
    });

    // Tasks columns
    activeTasksBox = blessed.box({
        parent: leftColumn,
        top: 0,
        left: 0,
        width: '100%',
        height: '50%',
        label: ' Active Tasks ',
        border: { type: 'line' },
        style: {
            fg: 'white',
            border: { fg: 'green' }
        },
        scrollable: true,
        alwaysScroll: true
    });

    completedTasksBox = blessed.box({
        parent: leftColumn,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '50%',
        label: ' Completed Tasks ',
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
        left: '40%',
        width: '58%',
        height: '80%',
        label: ' Daily Timeline ',
        border: { type: 'line' },
        style: { border: { fg: 'yellow' } },
        content: '',
        scrollable: true,
        alwaysScroll: true
    });

    // Single status box that changes content based on state
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
        // Save current state if timer is running
        const wasRunning = isRunning;
        const wasPaused = isPaused;
        const savedPauseTime = lastPauseTime;

        // Pause the timer if running and not already paused
        if (isRunning && !isPaused) {
            isPaused = true;
            lastPauseTime = new Date();
            if (mainInterval) {
                clearInterval(mainInterval);
                mainInterval = null;
            }
        }

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
                loadTasks();
                loadCompletedTasks();

                // Restore timer state if it was running
                if (wasRunning) {
                    if (wasPaused || isPaused) {
                        // If we were paused or we paused for vim, account for vim time
                        const vimTime = new Date() - (savedPauseTime || lastPauseTime);
                        pausedDuration += vimTime;
                        // Keep it paused - user can resume manually
                        isPaused = true;
                        lastPauseTime = new Date();
                    } else {
                        // Resume if we weren't originally paused
                        isPaused = false;
                        lastPauseTime = null;
                        mainInterval = setInterval(tick, 1000);
                    }
                    calculateSchedule();
                }

                updateUI();
                resolve();
            }, 100);
        });

        vim.on('error', (err) => {
            console.error(chalk.red('Error opening vim:'), err.message);
            console.log(chalk.yellow('Make sure vim is installed and in your PATH'));
            console.log(chalk.gray('Press any key to return to TaskChime...'));

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

async function editTasks() {
    try {
        await openInVim(TASKS_FILE);
    } catch (error) {
        // Error already handled in openInVim
    }
}

async function editCompleted() {
    try {
        // Ensure completed.txt exists before opening
        if (!fs.existsSync(COMPLETED_FILE)) {
            fs.writeFileSync(COMPLETED_FILE, '');
        }
        await openInVim(COMPLETED_FILE);
    } catch (error) {
        // Error already handled in openInVim
    }
}

// --- Core Logic (unchanged from original) ---

function detectUnicodeSupport() {
    // Cache the result
    if (supportsUnicode !== null) {
        return supportsUnicode;
    }
    
    // Manual override via environment variable
    if (process.env.TASKCHIME_ASCII === '1' || process.env.TASKCHIME_ASCII === 'true') {
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

function parseDuration(str) {
    str = str.toLowerCase();
    let totalMinutes = 0;
    const hourMatch = str.match(/(\d+(\.\d+)?)\s*hour(s?)/);
    if (hourMatch) totalMinutes += parseFloat(hourMatch[1]) * 60;
    const minMatch = str.match(/(\d+)\s*min(s?|ute?s?)/);
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    return totalMinutes > 0 ? totalMinutes : null;
}

function parseTaskLine(line) {
    const match = line.match(/^(.+?)\s*-\s*(.+)$/);
    if (!match) return null;
    const name = match[1].trim();
    const duration = parseDuration(match[2].trim());
    if (duration === null) return null;
    return { name, duration };
}

function loadTasks() {
    try {
        if (!fs.existsSync(TASKS_FILE)) {
            fs.writeFileSync(TASKS_FILE, 'Sample Task - 5 min\nAnother Task - 10 min');
        }
        const fileContent = fs.readFileSync(TASKS_FILE, 'utf8');
        tasks = fileContent.split('\n').map(parseTaskLine).filter(Boolean);
    } catch (error) { tasks = []; }
}

function loadCompletedTasks() {
    try {
        if (!fs.existsSync(COMPLETED_FILE)) return;
        const fileContent = fs.readFileSync(COMPLETED_FILE, 'utf8');
        completedTasksLog = fileContent.split('\n').filter(Boolean);
    } catch (error) { completedTasksLog = []; }
}

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        showDigitalTime = config.showDigitalTime !== false; // Default to true
        calendarVisible = config.calendarVisible !== false; // Default to true
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

/**
 * Calculates and assigns startTime and endTime for all scheduled tasks.
 */
function calculateSchedule() {
    if (!isRunning && !isPaused) {
        tasks.forEach(task => {
            delete task.startTime;
            delete task.endTime;
        });
        return;
    }

    let cumulativeTime = new Date(queueStartTime.getTime() + (completedTasksDuration * 60000) + pausedDuration);

    tasks.forEach(task => {
        task.startTime = new Date(cumulativeTime);
        task.endTime = new Date(cumulativeTime.getTime() + task.duration * 60000);
        cumulativeTime = task.endTime;
    });
}

function renderCalendar() {
    if (!calendarVisible) {
        return;
    }

    const now = new Date();

    // Determine time range for calendar
    let startHour = now.getHours();
    let endHour = startHour + 6; // Show 6 hours by default

    // If tasks are scheduled, adjust range to include them
    if (tasks.length > 0) {
        let earliestTask, latestTask;

        if (isRunning || isPaused) {
            // Use actual scheduled times
            earliestTask = tasks[0]?.startTime || now;
            latestTask = tasks[tasks.length - 1]?.endTime || now;
        } else {
            // Project where tasks would be if started now
            earliestTask = now;
            const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
            latestTask = new Date(now.getTime() + totalDuration * 60000);
        }

        startHour = Math.max(0, Math.min(startHour, earliestTask.getHours() - 1));
        endHour = Math.min(23, Math.max(endHour, latestTask.getHours() + 2));
    }

    const width = 45;
    let lines = [];

    // Create base timeline with clean formatting
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
    if (tasks.length > 0) {
        let schedule;

        if (isRunning || isPaused) {
            schedule = tasks;
        } else {
            // Create projected schedule
            schedule = JSON.parse(JSON.stringify(tasks));
            let cumulativeTime = new Date();
            schedule.forEach(task => {
                task.startTime = new Date(cumulativeTime);
                task.endTime = new Date(cumulativeTime.getTime() + task.duration * 60000);
                cumulativeTime = task.endTime;
            });
        }

        schedule.forEach((task, index) => {
            if (!task.startTime || !task.endTime) return;

            const taskStart = task.startTime;
            const taskEnd = task.endTime;

            // Find which timeline entries this task covers
            timelineData.forEach((entry, entryIndex) => {
                if (entry.time >= taskStart && entry.time < taskEnd) {
                    // Determine task styling
                    const isCurrent = (isRunning || isPaused) && (index === currentTaskIndex);
                    const isCompleted = index < currentTaskIndex && isRunning;

                    let taskColor;
                    if (isCompleted) {
                        taskColor = chalk.green;
                    } else if (isCurrent) {
                        taskColor = chalk.bgYellow.black;
                    } else {
                        taskColor = chalk.bgBlue.white;
                    }

                    const isFirstLine = entry.time.getTime() === taskStart.getTime() ||
                                       (entry.time < taskStart && timelineData[entryIndex + 1]?.time > taskStart);

                    if (isFirstLine) {
                        entry.content = taskColor(` ${entry.timeStr} │ ${task.name.substring(0, 25).padEnd(25)} `);
                    } else {
                        entry.content = taskColor(`        │ ${task.name.substring(0, 25).padEnd(25)} `);
                    }
                }
            });
        });
    }

    // Build the final output and insert NOW pointer where appropriate
    const nowTime = now.toTimeString().substring(0, 5);
    const nowLine = chalk.bold.red(`${nowTime} ◀ NOW`);
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

function updateStatusBar() {
    let content;

    if (isChiming) {
        // Alert state - show dismissal message with plain text (no chalk in blessed content)
        content = '🔔 TASK COMPLETED! Press "d" to dismiss alert and continue.';
        statusBox.style = { fg: 'red', bold: true };
    } else {
        // Normal state - show controls (now includes edit options)
        content = 'Controls: (s)tart | (p)ause | (d)ismiss | (r)estart | (e)dit tasks | (E)dit completed | (c)alendar | (t)ime | (q)uit';
        statusBox.style = { fg: 'white' };
    }

    statusBox.setContent(content);
}

function updateUI() {
    // Active tasks
    const activeItems = tasks.map((task, index) => {
        const text = `${task.name} - ${task.duration} min`;
        if (isRunning && !isPaused && index === currentTaskIndex) {
            return chalk.bold.yellow(text);
        } else {
            return chalk.white(text);
        }
    });
    activeTasksBox.setContent(activeItems.join('\n'));

    // Completed tasks
    const completedItems = completedTasksLog.map(log => chalk.gray(log));
    completedTasksBox.setContent(completedItems.join('\n'));

    // Timer with hour-based countdown logic
    if (!isRunning || currentTaskIndex < 0 || currentTaskIndex >= tasks.length) {
        if (showDigitalTime) {
            countdownText.setContent('--:--');
        } else {
            const fallbackChar = detectUnicodeSupport() ? '■' : '=';
            countdownText.setContent(fallbackChar.repeat(5));
        }
        currentTaskText.setContent(`${chalk.bold('Current:')} --`);
        nextTaskText.setContent(`${chalk.bold('Next:')} ${tasks.length > 0 ? tasks[0].name : '--'}`);
    } else {
        const currentTask = tasks[currentTaskIndex];
        const nextTask = tasks[currentTaskIndex + 1];

        currentTaskText.setContent(`${chalk.bold('Current:')} ${currentTask.name}`);
        nextTaskText.setContent(`${chalk.bold('Next:')} ${nextTask ? nextTask.name : '--'}`);

        if (isChiming && lastCompletedTask) {
            countdownText.setContent(chalk.bold.red('!!! TASK COMPLETE - Press "d" to dismiss !!!'));
            currentTaskText.setContent(`${chalk.bold('Completed:')} ${lastCompletedTask.name}`);
            nextTaskText.setContent(`${chalk.bold('Current:')} ${currentTask.name}`);
        } else {
            const taskStartTime = currentTask.startTime;
            if (!taskStartTime) return;
            const effectiveNow = isPaused ? lastPauseTime : new Date();
            const elapsedMs = Math.max(0, effectiveNow - taskStartTime);
            const remainingMs = (currentTask.duration * 60000) - elapsedMs;
            const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

            if (showDigitalTime) {
                // Show digital countdown
                if (remainingSeconds >= 3600) {
                    // Over 1 hour: show HH:MM format
                    const h = Math.floor(remainingSeconds / 3600);
                    const m = Math.floor((remainingSeconds % 3600) / 60);
                    countdownText.setContent(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                } else {
                    // Under 1 hour: show MM:SS format
                    const m = Math.floor(remainingSeconds / 60);
                    const s = remainingSeconds % 60;
                    countdownText.setContent(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
                }
            } else {
                // Show visual progress bars using hour-based calculation
                const totalSecondsForDisplay = 3600; // Always use 1 hour as base
                let remainingSecondsForDisplay = remainingSeconds % totalSecondsForDisplay;

                if (remainingSeconds > 0 && remainingSecondsForDisplay === 0) {
                    remainingSecondsForDisplay = totalSecondsForDisplay;
                }

                const fullHoursRemaining = Math.floor(remainingSeconds / totalSecondsForDisplay);
                const progressPercentage = remainingSecondsForDisplay / totalSecondsForDisplay;

                // Create visual progress representation
                const totalBlocks = 20;
                const filledBlocks = Math.round(progressPercentage * totalBlocks);
                const emptyBlocks = totalBlocks - filledBlocks;

                let progressBar = '';

                // Determine opacity/style based on hours remaining
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

                // Add hour indicator if more than 1 hour remaining
                if (fullHoursRemaining > 0) {
                    progressBar += chalk.cyan(` +${fullHoursRemaining}h`);
                }

                countdownText.setContent(progressBar);
            }
        }
    }

    // Update status bar
    updateStatusBar();

    // Update calendar
    renderCalendar();

    // Force screen refresh
    screen.render();
}

function tick() {
    if (!isRunning) return;
    if (!isPaused && !isChiming) {
        const currentTask = tasks[currentTaskIndex];
        if (!currentTask || !currentTask.endTime) return;
        if (new Date() >= currentTask.endTime) {
            completeCurrentTask();
        }
    }
    updateUI();
}

function startPersistentBeep() {
    if (beepInterval) return; // Already beeping

    beepInterval = setInterval(() => {
        if (isChiming) {
            // Create a simple repeating beep pattern using console bell
            process.stdout.write('\x07'); // System beep
        } else {
            stopPersistentBeep();
        }
    }, 1500); // Beep every 1500ms
}

function stopPersistentBeep() {
    if (beepInterval) {
        clearInterval(beepInterval);
        beepInterval = null;
    }
}

function completeCurrentTask() {
    const completedTask = tasks[currentTaskIndex];
    lastCompletedTask = completedTask;
    isChiming = true;

    // Log the completed task
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completedEntry = `[${timeStr}] ${completedTask.name} - ${completedTask.duration} min`;
    completedTasksLog.push(completedEntry);
    fs.appendFileSync(COMPLETED_FILE, completedEntry + '\n');

    // Remove completed task from active list and update file
    tasks.shift();
    completedTasksDuration += completedTask.duration;
    const newTasksContent = tasks.map(t => `${t.name} - ${t.duration} min`).join('\n');
    fs.writeFileSync(TASKS_FILE, newTasksContent);

    // Auto-advance to next task or end session
    if (tasks.length === 0) {
        isRunning = false;
        currentTaskIndex = -1;
    } else {
        // Continue with next task (currentTaskIndex stays 0 since we shifted the array)
        calculateSchedule();
    }

    // Start persistent beeping and show notification
    startPersistentBeep();

    const nextTask = tasks[0];
    notifier.notify({
        title: 'TaskChime: Task Complete!',
        message: `Finished: ${completedTask.name}\n${nextTask ? `Now running: ${nextTask.name}` : 'All tasks complete!'}`,
        sound: false, // We handle our own sound
        wait: false
    });

    updateUI();
}

function dismissAndContinue() {
    if (!isChiming) return;

    // Stop the alert
    isChiming = false;
    lastCompletedTask = null;
    stopPersistentBeep();

    // Update UI to reflect current state
    updateUI();
}

function start() {
    if (isRunning || tasks.length === 0) return;
    isRunning = true;
    isPaused = false;
    currentTaskIndex = 0;
    queueStartTime = new Date();
    pausedDuration = 0;
    completedTasksDuration = 0;
    calculateSchedule();
    mainInterval = setInterval(tick, 1000);
    updateUI();
}

function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    if (isPaused) {
        lastPauseTime = new Date();
        clearInterval(mainInterval);
    } else {
        pausedDuration += new Date() - lastPauseTime;
        lastPauseTime = null;
        calculateSchedule(); // Recalculate schedule on resume
        mainInterval = setInterval(tick, 1000);
    }
    updateUI();
}

function restart() {
    if (mainInterval) clearInterval(mainInterval);
    stopPersistentBeep();
    isRunning = false;
    isPaused = false;
    isChiming = false;
    currentTaskIndex = -1;
    pausedDuration = 0;
    completedTasksDuration = 0;
    lastCompletedTask = null;

    if (fs.existsSync(COMPLETED_FILE)) fs.unlinkSync(COMPLETED_FILE);
    completedTasksLog = [];

    loadTasks();
    calculateSchedule();
    updateUI();
}

function toggleCalendar() {
    calendarVisible = !calendarVisible;

    if (calendarVisible) {
        // Show the calendar panel and adjust left column
        leftColumn.width = '38%';
        calendarBox.show();
        renderCalendar();
    } else {
        // Hide the calendar panel and expand left column
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
    // --- Event Handlers ---
    screen.key(['s'], start);
    screen.key(['p'], togglePause);
    screen.key(['d'], dismissAndContinue);
    screen.key(['r'], restart);
    screen.key(['c'], toggleCalendar);
    screen.key(['t'], toggleDigitalTime);
    screen.key(['e'], editTasks);          // Edit tasks.txt
    screen.key(['S-e'], editCompleted);     // Edit completed.txt (Shift+E)
    screen.key(['q', 'C-c'], () => {
        stopPersistentBeep();
        process.exit(0);
    });
}

// --- Initial Load ---
loadConfig();
loadTasks();
loadCompletedTasks();

// Create the blessed interface
createBlessedInterface();

// Wait for screen to be ready before initial render
setTimeout(() => {
    calculateSchedule();
    updateUI();
}, 100);