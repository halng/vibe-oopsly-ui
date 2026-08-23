import os
import re

directory = "src"

# We want to match patterns like:
# Prefix-[var(--theme-accent)]/Number
# e.g. bg-[var(--theme-accent)]/20
# And replace with Prefix-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)]

pattern = re.compile(r'([a-z-]+)-\[var\(--theme-([a-z-]+)\)\]/(\d+)')

def replace_func(match):
    prefix = match.group(1)
    theme_var = match.group(2)
    opacity = match.group(3)
    return f"{prefix}-[color-mix(in_srgb,var(--theme-{theme_var})_{opacity}%,transparent)]"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            new_content = pattern.sub(replace_func, content)
            
            if content != new_content:
                with open(filepath, "w") as f:
                    f.write(new_content)
                print(f"Fixed opacities in {filepath}")
