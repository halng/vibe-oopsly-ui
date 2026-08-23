import os
import re

directory = "src"

replacements = [
    ("bg-[#8BC34A]", "bg-[var(--theme-accent)]"),
    ("hover:bg-[#7CB342]", "hover:bg-[var(--theme-secondary)]"),
    ("text-[#8BC34A]", "text-[var(--theme-accent)]"),
    ("text-[#558B2F]", "text-[var(--theme-secondary)]"),
    ("border-[#8BC34A]", "border-[var(--theme-accent)]"),
    ("ring-[#8BC34A]", "ring-[var(--theme-accent)]"),
    ("border-t-[#8BC34A]", "border-t-[var(--theme-accent)]"),
    
    # Opacity variants (simplifying them or using color-mix inline might be tricky, so let's use tailwind arbitrary with color-mix if possible, wait, tailwind supports arbitrary values: bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)]
    ("bg-[#8BC34A]/5", "bg-[color-mix(in_srgb,var(--theme-accent)_5%,transparent)]"),
    ("bg-[#8BC34A]/10", "bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)]"),
    ("bg-[#8BC34A]/15", "bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)]"),
    ("bg-[#8BC34A]/20", "bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)]"),
    ("border-[#8BC34A]/40", "border-[color-mix(in_srgb,var(--theme-accent)_40%,transparent)]"),
    ("border-[#8BC34A]/50", "border-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)]"),
    ("shadow-[#8BC34A]/30", "shadow-[var(--theme-accent)]/30"), # shadow color can just use var(--theme-accent) if we drop opacity, actually tailwind doesn't support opacity on shadow easily this way. Let's just remove the custom shadow color or replace it with shadow-stone-500/20.
    ("shadow-[#8BC34A]/20", "shadow-stone-500/20"),
    ("to-[#8BC34A]/15", "to-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)]"),
    ("|| '#8BC34A'", "|| 'var(--theme-accent)'")
]

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            orig = content
            # custom shadow replace first
            content = content.replace("shadow-[#8BC34A]/30", "shadow-stone-500/30")
            content = content.replace("shadow-[#8BC34A]/20", "shadow-stone-500/20")
            
            for old, new in replacements:
                content = content.replace(old, new)
                
            if orig != content:
                with open(filepath, "w") as f:
                    f.write(content)
                print(f"Updated {filepath}")
