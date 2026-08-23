with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if line.startswith("  if (activeShelf) {"):
        start_idx = i
        break

if start_idx != -1:
    # 1. Replace the start
    lines[start_idx] = """  const activeShelfStats = activeShelf 
    ? (shelfStatsMap.get(activeShelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 }) 
    : { subjectCount: 0, cardCount: 0, dueCount: 0 };
  const stats = activeShelfStats;

  return (
    <>
      {activeShelf ? (
"""
    # Remove the next line which was `const stats = shelfStatsMap.get(activeShelf.id)...`
    del lines[start_idx+1]
    
    # 2. Find the return ( inside Level 2 and remove it
    for i in range(start_idx+1, len(lines)):
        if "return (" in lines[i]:
            del lines[i]
            break
            
    # 3. Find the end of Level 2 which is 
    #     );
    #   }
    for i in range(start_idx+1, len(lines)):
        if lines[i].strip() == "// VIEW 2: ALL SHELVES (LEVEL 1)":
            # The previous lines should be `  }` and `    );`
            if lines[i-1].strip() == "}":
                del lines[i-1]
            if lines[i-2].strip() == ");":
                lines[i-2] = "      ) : (\n"
            break
            
    # 4. Find the start of Level 1 return and remove it
    for i in range(start_idx+1, len(lines)):
        if lines[i].strip() == "// VIEW 2: ALL SHELVES (LEVEL 1)":
            for j in range(i, len(lines)):
                if "return (" in lines[j]:
                    del lines[j]
                    break
            break
            
    # 5. Find Direct Import Cards Modal and insert `)}`
    for i in range(start_idx+1, len(lines)):
        if "{/* Direct Import Cards Modal */}" in lines[i]:
            # insert )} before it
            lines.insert(i, "      )}\n")
            # also, there is a `</div>` for Level 1 right before this. It's fine.
            break
            
    # 6. Change the very last `</div>` to `</>`
    for i in range(len(lines)-1, -1, -1):
        if "</div>" in lines[i]:
            lines[i] = lines[i].replace("</div>", "</>")
            break
            
    with open('src/components/LibraryShelvesView.tsx', 'w') as f:
        f.writelines(lines)
    print("Fixed structure!")
else:
    print("Could not find start")
