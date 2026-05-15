#!/usr/bin/env python3
"""
Replace deprecated/verbose Tailwind classes with their modern shorthands.
  flex-shrink-0 -> shrink-0       flex-grow -> grow
  duration-[Nms] -> duration-N    delay-[Nms] -> delay-N
  tracking named equivalents      leading named equivalents
"""
import re, glob

TRACKING = {
    'tracking-[-0.05em]':  'tracking-tighter',
    'tracking-[-0.025em]': 'tracking-tight',
    'tracking-[0em]':      'tracking-normal',
    'tracking-[0.025em]':  'tracking-wide',
    'tracking-[0.05em]':   'tracking-wider',
    'tracking-[0.1em]':    'tracking-widest',
}

LEADING = {
    'leading-[1]':     'leading-none',
    'leading-[1.25]':  'leading-tight',
    'leading-[1.375]': 'leading-snug',
    'leading-[1.5]':   'leading-normal',
    'leading-[1.625]': 'leading-relaxed',
    'leading-[2]':     'leading-loose',
}

def fix(content):
    # flex-shrink / flex-grow aliases
    content = re.sub(r'\bflex-shrink-0\b', 'shrink-0', content)
    content = re.sub(r'\bflex-shrink\b', 'shrink', content)
    content = re.sub(r'\bflex-grow-0\b', 'grow-0', content)
    content = re.sub(r'\bflex-grow\b', 'grow', content)

    # duration-[Nms] -> duration-N, delay-[Nms] -> delay-N
    content = re.sub(r'\bduration-\[(\d+)ms\]', lambda m: f'duration-{m.group(1)}', content)
    content = re.sub(r'\bdelay-\[(\d+)ms\]', lambda m: f'delay-{m.group(1)}', content)

    # named tracking / leading
    for old, new in TRACKING.items():
        content = content.replace(old, new)
    for old, new in LEADING.items():
        content = content.replace(old, new)

    return content

files = glob.glob('/Users/ryanwilliams/Projects/claude-config-editor/client/src/**/*.tsx', recursive=True)
total = 0
for path in sorted(files):
    with open(path) as f:
        original = f.read()
    updated = fix(original)
    if updated != original:
        with open(path, 'w') as f:
            f.write(updated)
        print(f'  updated: {path}')
        total += 1

print(f'\nDone. {total} file(s) changed.')
