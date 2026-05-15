#!/usr/bin/env python3
"""
Replace Tailwind arbitrary px values with scale equivalents.
e.g. min-h-[64px] -> min-h-16, gap-[10px] -> gap-2.5
Only replaces values that have an exact match in the Tailwind spacing scale.
Does NOT touch text sizes (px vs rem units differ).
"""
import glob

def px_to_scale(px):
    """Tailwind v4: spacing scale unit = px / 4 (base unit is 0.25rem = 4px).
    Any integer px maps to a valid scale value. Special case: 1px -> 'px'."""
    if px == 1:
        return 'px'
    val = px / 4
    # Format: drop trailing zeros (e.g. 2.0 -> '2', 2.5 -> '2.5', 2.75 -> '2.75')
    if val == int(val):
        return str(int(val))
    return f'{val:.2f}'.rstrip('0')

UTILITIES = [
    'min-w', 'min-h', 'max-w', 'max-h',
    'inset-x', 'inset-y', 'inset',
    'gap-x', 'gap-y', 'gap',
    'space-x', 'space-y',
    'scroll-mt', 'scroll-mb', 'scroll-ml', 'scroll-mr',
    'scroll-pt', 'scroll-pb', 'scroll-pl', 'scroll-pr',
    'translate-x', 'translate-y',
    'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br',
    'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r', 'rounded',
    'basis', 'size',
    'px', 'py', 'pt', 'pb', 'pl', 'pr',
    'mx', 'my', 'mt', 'mb', 'ml', 'mr',
    'top', 'right', 'bottom', 'left',
    'w', 'h', 'p', 'm',
]

def fix(content):
    import re
    # Match any spacing utility followed by an arbitrary px value
    util_pattern = '|'.join(re.escape(u) for u in UTILITIES)
    pattern = re.compile(rf'\b({util_pattern})-\[(\d+)px\]')
    def replace(m):
        util, px = m.group(1), int(m.group(2))
        return f'{util}-{px_to_scale(px)}'
    return pattern.sub(replace, content)

files = glob.glob('/Users/ryanwilliams/Projects/claude-config-editor/client/src/**/*.tsx', recursive=True)
total = 0
for path in sorted(files):
    with open(path) as f:
        original = f.read()
    updated = fix(original)
    if updated != original:
        with open(path, 'w') as f:
            f.write(updated)
        count = original.count('px]')
        print(f'  updated: {path}')
        total += 1

print(f'\nDone. {total} file(s) changed.')
