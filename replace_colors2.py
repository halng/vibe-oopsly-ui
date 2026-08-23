import os

directory = "src"

replacements = [
    ("fill=\"#8BC34A\"", "fill=\"var(--theme-accent)\""),
    ("stroke=\"#8BC34A\"", "stroke=\"var(--theme-accent)\""),
    ("fill: '#8BC34A'", "fill: 'var(--theme-accent)'"),
    ("accent-[#8BC34A]", "accent-[var(--theme-accent)]"),
    ("from-[#8BC34A]", "from-[var(--theme-accent)]"),
    ("to-[#689F38]", "to-[var(--theme-secondary)]"),
    ("color = '#8BC34A'", "color = 'var(--theme-accent)'")
]

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            orig = content
            for old, new in replacements:
                content = content.replace(old, new)
                
            if orig != content:
                with open(filepath, "w") as f:
                    f.write(content)
                print(f"Updated {filepath}")
