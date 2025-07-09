# HourlyChime CLI

A terminal-based, cross-platform productivity tool for managing time-based tasks with scheduled alerts, countdown timers, completion notifications, and integrated vim editing. HourlyChime CLI brings the power of time-based task scheduling directly to your command line with a rich, interactive interface and automatic chime alerts.

## Overview

HourlyChime CLI is designed for structured daily schedules where you need to be alerted at specific times throughout the day. Unlike sequential task managers, HourlyChime works with **fixed time schedules**, providing audible and visual alerts when tasks **start and end**, with intelligent countdown timers showing time until the next event.

## Features

### 🖥️ Rich Terminal Interface

-   **Blessed-based UI** with dedicated panes for timer, schedule configuration, alert history, and daily timeline
-   **Real-time countdown** with both digital and visual progress displays
-   **Hour-based progress visualization** showing current hour progress
-   **Collapsible calendar view** showing your complete daily timeline

### ⏰ Smart Time-Based Scheduling

-   **Fixed-time execution** - tasks trigger at specific times of day
-   **Automatic duration calculation** - tasks without explicit durations extend to the next task
-   **Dual alerts** - separate notifications for task starts and ends
-   **Intelligent overlap handling** - when task end coincides with next task start, only one alert fires
-   **Hour-based countdown** that shows current hour progress for any duration

### 📝 Integrated Vim Editing

-   **Live schedule editing** - Edit `chimes.txt` directly from within the app using vim
-   **Seamless transitions** - App automatically pauses and resumes after vim editing
-   **Automatic file reload** - Changes are immediately reflected in the interface after saving
-   **Error recovery** - Graceful handling if vim is unavailable

### 📋 Simple Schedule Management

-   **Plain text configuration** in `chimes.txt` file
-   **Flexible format** supporting times with optional task names and durations
-   **Real-time schedule updates** as you edit
-   **Alert history tracking** showing recent task starts and completions

### 🔔 Cross-Platform Notifications & Alerts

-   **Native desktop notifications** on macOS, Linux, and Windows
-   **Persistent audible alerts** with repeating beeps at task boundaries
-   **Separate start/end notifications** with clear task status
-   **Manual dismissal** required to stop alert sounds
-   **Next task preview** in notifications

### ⌨️ Keyboard-Driven Controls

-   **Simple shortcuts** for all major functions
-   **No mouse required** - fully keyboard accessible
-   **Quick toggles** for display preferences
-   **Integrated vim editing** with seamless transitions
-   **Postpone feature** to shift all future tasks by 15 minutes

### 💾 Configuration Persistence

-   **Settings saved** between sessions
-   **Calendar visibility** preferences remembered
-   **Digital time display** toggle state preserved

## Installation

### Prerequisites

-   **Node.js** (version 14 or higher) installed on your system
-   **npm** (comes with Node.js)
-   **vim** editor installed and available in your PATH

### Setup Steps

1.  **Create application directory:**

    ``` bash
    mkdir hourlychime-cli
    cd hourlychime-cli
    ```

2.  **Create package.json:**

    ``` json
    {
      "name": "hourlychime-cli",
      "version": "1.0.0",
      "description": "Terminal-based time scheduler with chime alerts",
      "main": "hourlychime-cli.js",
      "scripts": {
        "start": "node hourlychime-cli.js"
      },
      "dependencies": {
        "blessed": "^0.1.81",
        "chalk": "^4.1.2",
        "node-notifier": "^10.0.1"
      }
    }
    ```

3.  **Install dependencies:**

    ``` bash
    npm install
    ```

4.  **Add the CLI script** (save the `hourlychime-cli.js` code to this directory)

5.  **Create your schedule file:**

    ``` bash
    touch chimes.txt
    ```

6.  **Verify vim installation:**

    ``` bash
    which vim
    # Should show path to vim, e.g., /usr/bin/vim
    ```

## Schedule Configuration

Create and edit your `chimes.txt` file with one scheduled task per line using this format:

```
HH:MM - Task Name - Duration
```

### Format Options

-   `HH:MM` - Just a time (task extends to next scheduled time)
-   `HH:MM - Task Name` - Time with task name (duration calculated automatically)
-   `HH:MM - Task Name - Duration` - Fully specified task

### Duration Formats Supported

-   `15 min` - Minutes only
-   `1 hour` - Hours only
-   `2 hours` - Multiple hours
-   `1 hour 30 min` - Hours and minutes combined

### Example Schedule File

```
09:00 - Morning standup - 15 min
09:30 - Email review - 30 min
10:00 - Deep work session
12:00 - Lunch break - 1 hour
13:00 - Team meeting - 45 min
14:00 - Project work
16:00 - Code review - 30 min
16:30 - Planning tomorrow
17:00 - Wrap up - 30 min
```

### Automatic Duration Calculation

-   Tasks without explicit durations automatically extend to the start time of the next task
-   The last task of the day defaults to 15 minutes if no duration is specified
-   This allows for flexible scheduling where gaps are automatically filled

## Usage

### Starting the Application

``` bash
node hourlychime-cli.js
```

or

``` bash
npm start
```

### Basic Workflow

1.  **Configure schedule** - Edit `chimes.txt` with your daily tasks (or press `e` to edit within the app)
2.  **Monitor countdown** - Watch the timer count down to your next task or end time
3.  **Respond to alerts** - Press `d` when tasks start/end to dismiss alert sounds
4.  **Track progress** - View completed alerts in the history pane
5.  **Adjust as needed** - Use `p` to postpone future tasks or `e` to edit schedule

### Vim Integration Workflow

The app includes seamless vim integration for editing your schedule:

1. **Edit schedule** - Press `e` to open `chimes.txt` in vim
2. **Make changes** - Use all vim functionality to edit your schedule
3. **Save and return** - Use `:wq` to save and return to HourlyChime
4. **Automatic reload** - Changes are immediately reflected in the interface

#### Vim Editing Features

- **Seamless transitions**: No disruption to the running app
- **File auto-creation**: `chimes.txt` is created automatically if it doesn't exist
- **Error handling**: Graceful recovery if vim isn't available or fails
- **Instant updates**: Schedule changes appear immediately after saving

### How Alerts Work

When a task start or end time is reached:
1. **Alert triggers** - A persistent beeping sound plays
2. **Desktop notification** - Shows task status and next upcoming task
3. **Visual indicator** - Interface shows current active task highlighted
4. **Manual dismissal** - Press `d` to stop the alert sound
5. **History logged** - Alert is added to the recent alerts pane

### Alert Types

- **Start alerts**: Triggered when a task begins
  - Title: "Starting: [Task Name]"
  - Body: Shows next upcoming task

- **End alerts**: Triggered when a task completes
  - Title: "Finished: [Task Name]"
  - Body: Shows next upcoming task

- **Smart overlap handling**: If a task ends exactly when the next begins, only the start alert fires

## Keyboard Controls

| Key | Action           | Description                                      |
|-----|------------------|--------------------------------------------------|
| `e` | **Edit Schedule**| Open `chimes.txt` in vim for live editing       |
| `d` | **Dismiss Alert**| Stop the alert sound when tasks start/end       |
| `p` | **Postpone**     | Shift all future tasks forward by 15 minutes    |
| `r` | **Reload**       | Reload schedule from file                        |
| `c` | **Calendar**     | Toggle calendar/timeline panel visibility        |
| `t` | **Time Toggle**  | Switch between digital and visual countdown      |
| `q` | **Quit**         | Exit application (Ctrl+C also works)             |

## Interface Layout

```
┌────────────────────────────────────────────────────────────────┐
│                     ⏰  HourlyChime CLI                         │
├────────────────────────────────────────────────────────────────┤
│ ┌─ Timer & Status ──────────────────────────────────────────┐ │
│ │              09:45  or  ████████████▓▓▓▓▓▓▓▓                │ │
│ │  Current: Deep work session (10:00-12:00)                   │ │
│ │  Next: Lunch break at 12:00                                 │ │
│ └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────┬──────────────────────────────┤
│ ┌─ Today's Schedule ─────────┐  │ ┌─ Daily Timeline ──────────┐│
│ │ 09:00 - Morning standup    │  │ │ 08:00 ──────────────────── ││
│ │ 09:30 - Email review       │  │ │ 09:00 │ Morning standup   │ ││
│ │ 10:00 - Deep work session  │  │ │    30 │ Email review      │ ││
│ │ 12:00 - Lunch break        │  │ │ 10:00 │ Deep work session │ ││
│ └────────────────────────────┘  │ │    45 ◀ NOW              │ ││
│ ┌─ Recent Alerts ────────────┐  │ │ 11:00 │                   │ ││
│ │ [10:00] Started: Deep work │  │ │ 12:00 │ Lunch break       │ ││
│ │ [09:45] Finished: Email    │  │ └──────────────────────────────┘│
│ └────────────────────────────┘  │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
Controls: (e)dit chimes | (d)ismiss | (p)ostpone future | (r)eload | (c)alendar | (t)ime | (q)uit
```

### Alert State Display

When an alert is active:

```
┌─ Timer & Status ──────────────────────────────────────────┐
│                    !!! CHIMING !!!                         │
│  Current: Deep work session (10:00-12:00)                 │
│  Next: Lunch break at 12:00                               │
└────────────────────────────────────────────────────────────┘

🔔 CHIMING! Press (d) to dismiss alert.
```

### Vim Editing State

When editing the schedule with vim:

```bash
Opening chimes.txt in vim...
Save and quit vim (:wq) to return to HourlyChime CLI

# Vim opens with full terminal control
# After :wq:
✓ Vim closed. Reloading HourlyChime CLI...
# HourlyChime interface returns with updated schedule
```

## Display Modes

### Digital Countdown Mode

-   Shows precise time remaining in `MM:SS` or `HH:MM` format
-   Clear numerical display for exact timing
-   Switches format based on time remaining

### Visual Progress Mode

-   Block-character progress bar showing hour-based completion
-   Color-coded based on remaining time:
    -   **Dim**: 3+ hours remaining
    -   **Gray**: 2+ hours remaining
    -   **White**: 1+ hour remaining
    -   **Yellow**: Less than 1 hour remaining
-   Includes "+Xh" indicator for countdowns over 1 hour

## File Structure

After setup and use, your directory will contain:

```
hourlychime-cli/
├── hourlychime-cli.js  # Main application script
├── package.json        # Node.js dependencies
├── chimes.txt          # Your schedule configuration (editable via 'e')
├── config.json         # UI preferences (auto-generated)
└── node_modules/       # Dependencies (auto-generated)
```

## Advanced Features

### Time-Based Task Management

HourlyChime CLI excels at fixed-schedule management:
-   **Clock-driven execution** - Tasks trigger based on wall clock time
-   **Flexible durations** - Mix explicit and implicit task lengths
-   **Gap-filling logic** - Automatically calculates durations to fill schedule
-   **Day boundary aware** - Handles tasks near midnight correctly

### Postpone Functionality

The postpone feature (`p` key) allows quick schedule adjustments:
-   **Shifts all future tasks** by 15 minutes
-   **Preserves task durations** and relationships
-   **Updates file immediately** for persistence
-   **Useful for delays** when running behind schedule

### Alert History

-   **Recent alerts tracked** in dedicated pane
-   **Timestamped entries** show when tasks started/finished
-   **Limited to 20 entries** to maintain readability
-   **Persists during session** but clears on restart

### Calendar Timeline Features

-   **Hour-by-hour view** of your entire day
-   **Visual task blocks** showing duration and overlap
-   **Current time indicator** with red NOW marker
-   **Color coding**:
    -   **Green**: Completed tasks
    -   **Yellow highlight**: Currently active task
    -   **Blue**: Future tasks
-   **Smart range** - Shows from 1 hour before first task to 1 hour after last

## Troubleshooting

### Common Issues

**Schedule not loading:**
- Ensure `chimes.txt` exists and has correct format
- Check that each line follows "HH:MM - Task - Duration" pattern
- Use `e` key to edit schedule directly within the app

**Vim editing not working:**
- Verify vim is installed: `which vim`
- Install vim if missing:
  - Ubuntu/Debian: `sudo apt install vim`
  - macOS: `brew install vim` (or use built-in vim)
  - Windows: Install vim or use WSL
- Check that vim is in your PATH

**Alerts not working:**
- Verify `node-notifier` installed correctly: `npm list node-notifier`
- Check OS notification permissions
- Ensure system sound is enabled for beeps

**No countdown showing:**
- Verify you have tasks scheduled for today
- Check that task times are in 24-hour format (HH:MM)
- Ensure at least one task is scheduled after current time

**Display issues:**
- Ensure terminal supports Unicode characters
- Try resizing terminal window (minimum 80x24 recommended)
- Use `c` key to toggle calendar if layout appears cramped

### Performance Tips

-   **Terminal size**: Minimum 80x24 characters recommended
-   **Schedule size**: Keep under 50 tasks per day for optimal performance
-   **Alert dismissal**: Dismiss alerts promptly to prevent audio buildup
-   **Vim performance**: Keep task descriptions concise for faster editing

## Integration Ideas

### Shell Aliases

Add to your `.bashrc` or `.zshrc`:

``` bash
alias hc='cd ~/hourlychime-cli && node hourlychime-cli.js'
alias hce='cd ~/hourlychime-cli && vim chimes.txt'  # Or use 'e' key within app
```

### Workflow Integration

-   **Daily templates**: Create template files for different types of days
-   **Time blocking**: Use for strict time-boxed schedules
-   **Meeting reminders**: Set alerts 5 minutes before meetings
-   **Break enforcement**: Schedule regular breaks with end alerts
-   **Pomodoro variant**: Create 25-minute work blocks with breaks

### Example Use Cases

**Workday Schedule:**
```
08:45 - Review agenda - 15 min
09:00 - Team standup - 30 min
09:30 - Focus block
11:00 - Break - 15 min
11:15 - Code review
12:30 - Lunch - 45 min
13:15 - Meetings block
15:00 - Deep work
16:30 - Email/Slack - 30 min
17:00 - Plan tomorrow - 30 min
```

**Study Schedule:**
```
09:00 - Math study - 50 min
09:50 - Break - 10 min
10:00 - Physics problems - 50 min
10:50 - Break - 10 min
11:00 - Reading - 45 min
11:45 - Review notes - 15 min
```

## Contributing

HourlyChime CLI is designed to be simple and focused. When contributing:

1.  **Maintain simplicity** - avoid feature bloat
2.  **Preserve keyboard workflow** - all functions should be keyboard accessible
3.  **Keep dependencies minimal** - only add dependencies for core functionality
4.  **Test cross-platform** - ensure compatibility across macOS, Linux, and Windows
5.  **Respect time-based nature** - ensure features work with fixed schedules
6.  **Test vim integration** - verify that vim features work across different configurations

## License

MIT License - feel free to modify and distribute as needed.

## Comparison with TaskChime CLI

While both tools help manage productivity through timed tasks, they serve different purposes:

**HourlyChime CLI:**
- **Time-based scheduling** - Tasks occur at specific times
- **Dual alerts** - Notifications for both start and end
- **Fixed daily schedule** - Ideal for routine-based work
- **Clock-driven** - Tied to actual time of day

**TaskChime CLI:**
- **Sequential execution** - Tasks run one after another
- **Completion alerts** - Notifications when tasks finish
- **Flexible timing** - Start anytime, tasks flow sequentially
- **Duration-driven** - Focus on task length, not clock time

Choose HourlyChime for structured daily schedules, TaskChime for flexible work sessions.