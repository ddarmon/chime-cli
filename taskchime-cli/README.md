# TaskChime CLI

A terminal-based, cross-platform productivity tool for managing sequential tasks
with timed intervals, automatic progression, completion alerts, and integrated vim editing. TaskChime CLI brings the power of
structured task timing directly to your command line with a rich, interactive
interface and seamless task flow.

## Overview

TaskChime CLI is designed for focused work sessions where you need to execute
tasks one after another with no gaps. Unlike traditional schedulers that work
with fixed times, TaskChime executes tasks sequentially with **automatic advancement**,
providing audible and visual alerts when each task completes while continuing to the next task.

## Features

### 🖥️ Rich Terminal Interface

-   **Blessed-based UI** with dedicated panes for timer, active tasks, completed
    tasks, and daily timeline
-   **Real-time countdown** with both digital and visual progress displays
-   **Hour-based progress calculation** similar to traditional productivity
    timers
-   **Collapsible calendar view** showing your daily task timeline

### ⏱️ Smart Task Timing

-   **Sequential execution** - tasks run one after another with no gaps
-   **Automatic progression** - completed tasks automatically advance to the next task
-   **Precise timing** with millisecond accuracy
-   **Pause/Resume functionality** that preserves elapsed time
-   **Hour-based countdown** that shows current hour progress for long tasks

### 📝 Integrated Vim Editing

-   **Live task editing** - Edit `tasks.txt` directly from within the app using vim
-   **Completion history editing** - Modify `completed.txt` to clean up or adjust completion logs
-   **Smart timer preservation** - Timer automatically pauses during editing and resumes seamlessly
-   **Automatic file reload** - Changes are immediately reflected in the interface after saving
-   **State preservation** - All timing data, pause state, and progress are maintained during editing

### 📋 Simple Task Management

-   **Plain text configuration** in `tasks.txt` file
-   **Automatic task movement** from active to completed lists
-   **Real-time list updates** as tasks progress
-   **Persistent completion history** with timestamps

### 🔔 Cross-Platform Notifications & Alerts

-   **Native desktop notifications** on macOS, Linux, and Windows
-   **Persistent audible alerts** with repeating beeps when tasks complete
-   **Automatic task continuation** while maintaining completion alerts
-   **Manual dismissal** required to clear alerts (tasks continue automatically)

### ⌨️ Keyboard-Driven Controls

-   **Simple shortcuts** for all major functions
-   **No mouse required** - fully keyboard accessible
-   **Quick toggles** for display preferences
-   **Integrated vim editing** with seamless transitions
-   **Clear dismissal workflow** for completion alerts

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
    mkdir taskchime-cli
    cd taskchime-cli
    ```

2.  **Create package.json:**

    ``` json
    {
      "name": "taskchime-cli",
      "version": "1.0.0",
      "description": "Terminal-based task timer with sequential execution",
      "main": "taskchime-cli.js",
      "scripts": {
        "start": "node taskchime-cli.js"
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

4.  **Add the CLI script** (save the updated `taskchime-cli.js` code to this directory)

5.  **Create your task file:**

    ``` bash
    touch tasks.txt
    ```

6.  **Verify vim installation:**

    ``` bash
    which vim
    # Should show path to vim, e.g., /usr/bin/vim
    ```

## Task Configuration

Create and edit your `tasks.txt` file with one task per line using this format:

```
Task Name - Duration
```

### Duration Formats Supported

-   `15 min` - Minutes only
-   `1 hour` - Hours only
-   `2 hours` - Multiple hours
-   `1 hour 30 min` - Hours and minutes combined

### Example Task File

```
Review morning emails - 15 min
Team standup meeting - 30 min
Code review session - 1 hour
Lunch break - 45 min
Project planning - 1 hour 30 min
Documentation update - 20 min
End-of-day review - 10 min
```

## Usage

### Starting the Application

``` bash
node taskchime-cli.js
```

or

``` bash
npm start
```

### Basic Workflow

1.  **Configure tasks** - Edit `tasks.txt` with your task list (or press `e` to edit within the app)
2.  **Start tasks** - Press `s` to begin the sequence
3.  **Monitor progress** - Watch the countdown and timeline as tasks auto-advance
4.  **Edit on-the-fly** - Press `e` to modify tasks during execution
5.  **Handle completion alerts** - Press `d` when tasks complete to dismiss alerts
6.  **Manage session** - Use `p` to pause, `r` to restart as needed

### Vim Integration Workflow

The app includes seamless vim integration for editing task files:

1. **Edit active tasks** - Press `e` to open `tasks.txt` in vim
2. **Edit completion history** - Press `E` (capital E) to open `completed.txt` in vim
3. **Make changes** - Use all vim functionality to edit your files
4. **Save and return** - Use `:wq` to save and return to TaskChime
5. **Automatic reload** - Changes are immediately reflected in the interface

#### Vim Editing Features

- **Timer preservation**: If a timer is running, it automatically pauses during editing
- **State consistency**: All timing data and progress are maintained
- **File auto-creation**: `completed.txt` is created automatically if it doesn't exist
- **Error handling**: Graceful recovery if vim isn't available or fails
- **Seamless transition**: No manual reloading needed - everything updates automatically

### How Task Completion Works

When a task completes:
1. **Automatic advancement** - The next task starts immediately
2. **Completion alert** - A persistent beeping sound plays and the UI shows completion status
3. **Desktop notification** - A system notification displays the completed and current tasks
4. **Manual dismissal** - Press `d` to stop the alert sound and clear the completion message
5. **Seamless continuation** - The current task continues running in the background

## Keyboard Controls

| Key | Action           | Description                                      |
|-----|------------------|--------------------------------------------------|
| `s` | **Start**        | Begin the task sequence from the first task      |
| `p` | **Pause/Resume** | Toggle timer (preserves elapsed time)            |
| `d` | **Dismiss Alert**| Dismiss completion alert and stop alert sound    |
| `r` | **Restart**      | Reset entire queue and start over                |
| `e` | **Edit Tasks**   | Open `tasks.txt` in vim for live editing         |
| `E` | **Edit Completed**| Open `completed.txt` in vim for history editing |
| `c` | **Calendar**     | Toggle calendar/timeline panel visibility        |
| `t` | **Time Toggle**  | Switch between digital and visual countdown      |
| `q` | **Quit**         | Exit application (Ctrl+C also works)             |

## Interface Layout

```
┌────────────────────────────────────────────────────────────────┐
│                     ⏱️  TaskChime CLI                          │
├────────────────────────────────────────────────────────────────┤
│ ┌─ Timer & Status ──────────────────────────────────────────┐ │
│ │              15:30  or  ████████████▓▓▓▓▓▓▓▓                │ │
│ │  Current: Code review session                              │ │
│ │  Next: Lunch break                                         │ │
│ └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────┬──────────────────────────────┤
│ ┌─ Active Tasks ─────────────┐  │ ┌─ Daily Timeline ───────────┐│
│ │ Code review - 1 hour       │  │ │ 14:00 ──────────────────── ││
│ │ Lunch break - 45 min       │  │ │ 14:15 │ Code review      │ ││
│ │ Project work - 2 hours     │  │ │       │                  │ ││
│ └────────────────────────────┘  │ │ 15:00 │                  │ ││
│ ┌─ Completed Tasks ──────────┐  │ │ 15:15 ◀ NOW              │ ││
│ │ [14:00] Standup - 15 min   │  │ │ 15:30 ─────────────────── ││
│ │ [14:15] Email - 30 min     │  │ │ 15:45 │ Lunch break      │ ││
│ └────────────────────────────┘  │ └──────────────────────────────┘│
└─────────────────────────────────┴──────────────────────────────┘
Controls: (s)tart | (p)ause | (d)ismiss | (r)estart | (e)dit tasks | (E)dit completed | (c)alendar | (t)ime | (q)uit
```

### Completion Alert State

When a task completes, the interface shows:

```
┌─ Timer & Status ──────────────────────────────────────────┐
│      !!! TASK COMPLETE - Press "d" to dismiss !!!         │
│  Completed: Code review session                           │
│  Current: Lunch break                                     │
└────────────────────────────────────────────────────────────┘

🔔 TASK COMPLETED! Press (d) to dismiss alert and continue.
```

### Vim Editing State

When editing files with vim:

```bash
Opening tasks.txt in vim...
Save and quit vim (:wq) to return to TaskChime CLI

# Vim opens with full terminal control
# After :wq:
✓ Vim closed. Reloading TaskChime CLI...
# TaskChime interface returns with updated content
```

## Display Modes

### Digital Countdown Mode

-   Shows precise time remaining in `MM:SS` or `HH:MM` format
-   Clear numerical display for exact timing
-   Default mode for precise work tracking

### Visual Progress Mode

-   Block-character progress bar showing hour-based completion
-   Color-coded based on remaining time:
    -   **Dim**: 3+ hours remaining
    -   **Gray**: 2+ hours remaining
    -   **White**: 1+ hour remaining
    -   **Yellow**: Less than 1 hour remaining
-   Includes "+Xh" indicator for tasks over 1 hour

## File Structure

After setup and use, your directory will contain:

```
taskchime-cli/
├── taskchime-cli.js    # Main application script
├── package.json        # Node.js dependencies
├── tasks.txt           # Your task configuration (editable via 'e')
├── completed.txt       # Completion history (editable via 'E')
├── config.json         # UI preferences (auto-generated)
└── node_modules/       # Dependencies (auto-generated)
```

## Advanced Features

### Automatic Task Progression

TaskChime CLI features seamless task flow:
-   **Zero downtime** - Tasks advance immediately when completed
-   **Background continuation** - Next task starts while completion alert plays
-   **Non-blocking alerts** - Dismissing alerts doesn't affect task timing
-   **Persistent notifications** - Completion alerts remain until manually dismissed

### Live Vim Integration

TaskChime CLI includes sophisticated vim integration:

-   **Smart timer handling** - Automatically pauses timers during editing, preserves all state
-   **File auto-creation** - Creates missing files automatically before opening vim
-   **Seamless transitions** - No disruption to workflow when switching between editing and timing
-   **Error recovery** - Graceful handling of vim errors or missing vim installation
-   **Instant updates** - File changes are immediately reflected in the interface

### Hour-Based Progress Calculation

TaskChime CLI uses a sophisticated hour-based countdown system:

-   **Tasks under 1 hour**: Show as portion of the hour ring
-   **Tasks over 1 hour**: Show current hour portion with additional hour
    indicators
-   **Always uses 3600 seconds** (1 hour) as the base calculation
-   **Maintains visual consistency** regardless of task duration

### Real-Time Task Management

-   **Immediate task movement**: Completed tasks instantly move to "Completed"
    list
-   **Dynamic active queue**: Active list shrinks progressively showing
    remaining work
-   **Smart index management**: Current task tracking remains stable during
    updates
-   **Live visual feedback**: See progress through changing list sizes
-   **Edit-time preservation**: Task timing continues accurately even during vim editing sessions

### Calendar Timeline Features

-   **Extended timeline view**: Shows 1 hour before and 3 hours after tasks
-   **Dynamic scaling**: Automatically adjusts to available terminal space
-   **Current time indicator**: Red line showing present moment
-   **Task visualization**: Color-coded blocks for current, completed, and
    future tasks

## Troubleshooting

### Common Issues

**Tasks not loading:**
- Ensure `tasks.txt` exists and has correct format
- Check that each line follows "Task Name - Duration" pattern
- Use `e` key to edit tasks directly within the app

**Vim editing not working:**
- Verify vim is installed: `which vim`
- Install vim if missing:
  - Ubuntu/Debian: `sudo apt install vim`
  - macOS: `brew install vim` (or use built-in vim)
  - Windows: Install vim or use WSL
- Check that vim is in your PATH

**Capital E not working:**
- This edits `completed.txt` which may not exist initially
- Try completing a task first, or the app will create the file automatically
- If issues persist, manually create: `touch completed.txt`

**App exits after vim:**
- This should be fixed in the latest version
- Ensure you're using `:wq` to save and quit vim
- Try `:q!` to quit without saving if stuck

**Notifications not working:**
- Verify `node-notifier` installed correctly: `npm list node-notifier`
- Check OS notification permissions

**Persistent beeping:**
- Press `d` to dismiss completion alerts and stop audio
- Check terminal audio capabilities if beeping is too quiet

**Display issues:**
- Ensure terminal supports Unicode characters
- Try resizing terminal window
- Use `c` key to toggle calendar if layout appears cramped

**Timer accuracy:**
- TaskChime maintains millisecond precision
- Pause/resume preserves exact elapsed time
- System sleep may affect timing (resume to recalibrate)
- Vim editing time is automatically excluded from task timing

### Performance Tips

-   **Terminal size**: Minimum 80x24 characters recommended
-   **File size**: Keep task lists under 100 items for optimal performance
-   **History management**: Use `E` key to edit and clean `completed.txt` if it grows large
-   **Audio responsiveness**: Use `d` immediately when alerts sound to prevent audio buildup
-   **Vim performance**: Large files may slow vim opening - keep task descriptions concise

## Integration Ideas

### Shell Aliases

Add to your `.bashrc` or `.zshrc`:

``` bash
alias tc='cd ~/taskchime-cli && node taskchime-cli.js'
alias tce='cd ~/taskchime-cli && vim tasks.txt'  # Or use 'e' key within app
alias tcl='cd ~/taskchime-cli && vim completed.txt'  # Or use 'E' key within app
```

### Workflow Integration

-   **Morning routine**: Create task files for different types of work sessions
-   **Pomodoro technique**: Use 25-minute work blocks with 5-minute breaks
-   **Meeting schedules**: Load agenda items as sequential tasks with auto-flow
-   **Project planning**: Break large projects into timed components with seamless transitions
-   **Live editing**: Use vim integration to adjust tasks based on changing priorities
-   **Session review**: Edit completion history to add notes or adjust records

### Vim Power User Tips

Since TaskChime integrates vim directly:

-   **Vim shortcuts work**: Use all your familiar vim commands and shortcuts
-   **Multiple edits**: Edit tasks, save with `:w`, continue editing, then `:q` to return
-   **Vim plugins**: Your vim configuration and plugins work normally
-   **Search and replace**: Use vim's powerful editing features for batch task updates
-   **Copy/paste**: Use vim's registers to duplicate or rearrange tasks efficiently

## Contributing

TaskChime CLI is designed to be simple and focused. When contributing:

1.  **Maintain simplicity** - avoid feature bloat
2.  **Preserve keyboard workflow** - all functions should be keyboard accessible
3.  **Keep dependencies minimal** - only add dependencies for core functionality
4.  **Test cross-platform** - ensure compatibility across macOS, Linux, and
    Windows
5.  **Respect auto-flow** - ensure new features work with automatic task progression
6.  **Test vim integration** - verify that vim features work across different vim configurations

## License

MIT License - feel free to modify and distribute as needed.

## Related Projects

-   **TaskChime Desktop**: Full-featured Electron app with GUI interface
-   **HourlyChime**: Original inspiration for hour-based timing methodology