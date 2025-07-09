#!/usr/bin/env python3
"""
generate_clock_pomodoro.py

Generates a Pomodoro schedule in HourlyChime CLI's chimes.txt format.

Usage:
  python generate_clock_pomodoro.py

The script will interactively prompt for all parameters and append
the generated schedule to chimes.txt.
"""

import argparse
from datetime import datetime, timedelta


def parse_time(tstr):
    return datetime.strptime(tstr, "%H:%M")


def format_entry(dt, name, duration_min=None):
    hhmm = dt.strftime("%H:%M")
    if duration_min:
        # e.g. 09:00 - Work 1 - 25 min
        return f"{hhmm} - {name} - {duration_min} min"
    else:
        # e.g. 10:00 - Meeting
        return f"{hhmm} - {name}"


def build_pomodoro(start_time, cycles, work, short_break, long_break, long_every):
    schedule = []
    now = start_time
    for i in range(1, cycles + 1):
        # Work interval
        schedule.append(format_entry(now, f"Work {i}", work))
        now += timedelta(minutes=work)

        # Decide break length
        if i < cycles:
            is_long = (i % long_every == 0)
            brk = long_break if is_long else short_break
            schedule.append(format_entry(now, "Break", brk))
            now += timedelta(minutes=brk)
    return schedule


def get_default_start_time():
    now = datetime.now()
    minute = now.minute

    if minute < 30:
        # Round down to the hour
        default = now.replace(minute=0, second=0, microsecond=0)
    else:
        # Round down to 30 minutes past
        default = now.replace(minute=30, second=0, microsecond=0)

    return default.strftime("%H:%M")


def get_input(prompt, default=None, type_fn=str):
    if default is not None:
        full_prompt = f"{prompt} [{default}]: "
    else:
        full_prompt = f"{prompt}: "

    user_input = input(full_prompt).strip()
    if not user_input and default is not None:
        return type_fn(default)
    return type_fn(user_input)


def main():
    print("=== Pomodoro Schedule Generator ===")
    print("This will generate a Pomodoro schedule and append it to chimes.txt")
    print()

    # Interactive prompts
    default_start = get_default_start_time()
    start_str = get_input("Start time (HH:MM in 24-hour format)", default=default_start)
    start = parse_time(start_str)

    cycles = get_input("Number of Pomodoro cycles", default=4, type_fn=int)
    work = get_input("Work duration in minutes", default=25, type_fn=int)
    short_break = get_input("Short break duration in minutes", default=5, type_fn=int)
    long_break = get_input("Long break duration in minutes", default=15, type_fn=int)
    long_every = get_input("Long break after how many cycles", default=4, type_fn=int)

    # Build the schedule
    schedule = build_pomodoro(
        start_time=start,
        cycles=cycles,
        work=work,
        short_break=short_break,
        long_break=long_break,
        long_every=long_every
    )

    # Preview
    print("\n=== Generated Schedule ===")
    for entry in schedule:
        print(entry)

    # Confirm and append
    confirm = input("\nAppend this schedule to chimes.txt? (y/n): ").strip().lower()
    if confirm == 'y':
        with open("/Users/daviddarmon/Dropbox/Reference/T/timer/hourlychime-cli/chimes.txt", "a") as f:
            f.write("\n".join(schedule) + "\n")
        print(f"Appended {len(schedule)} entries to chimes.txt")
    else:
        print("Cancelled.")


if __name__ == "__main__":
    main()
