import re

with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    content = f.read()

# 1. Replace the if (activeShelf) { return ...
old_if_start = """  if (activeShelf) {
    const stats = shelfStatsMap.get(activeShelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 };

    return ("""

new_if_start = """  const activeShelfStats = activeShelf 
    ? (shelfStatsMap.get(activeShelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 }) 
    : { subjectCount: 0, cardCount: 0, dueCount: 0 };

  return (
    <>
      {activeShelf ? ("""

content = content.replace(old_if_start, new_if_start)

# 2. Replace 'stats' with 'activeShelfStats' ONLY inside the Level 2 block.
# Actually it's easier to just do:
# const stats = activeShelfStats; right after the new_if_start
new_if_start_with_stats = """  const activeShelfStats = activeShelf 
    ? (shelfStatsMap.get(activeShelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 }) 
    : { subjectCount: 0, cardCount: 0, dueCount: 0 };
  const stats = activeShelfStats;

  return (
    <>
      {activeShelf ? ("""
content = content.replace(new_if_start, new_if_start_with_stats)

# 3. Find the end of Level 2, which was:
#     );
#   }
# 
#   // ==========================================
#   // VIEW 2: ALL SHELVES (LEVEL 1)
#   // ==========================================
#   return (

old_level2_end = """    );
  }

  // ==========================================
  // VIEW 2: ALL SHELVES (LEVEL 1)
  // ==========================================
  return ("""

new_level2_end = """      ) : ("""

content = content.replace(old_level2_end, new_level2_end)

# 4. Now the end of Level 1 (before modals)
#        )}
#      </div>
#
#      {/* Direct Import Cards Modal */}

old_modals_start = """      {/* Direct Import Cards Modal */}"""
new_modals_start = """      )}
      
      {/* Direct Import Cards Modal */}"""

# We need to find the `</div>` that closed the `return (` of Level 1.
# It was right before the Modals. So:
old_modals_context = """        )}
      </div>

      {/* Direct Import Cards Modal */}"""
new_modals_context = """        )}
      </div>
      )}

      {/* Direct Import Cards Modal */}"""

content = content.replace(old_modals_context, new_modals_context)

# 5. Fix the end of the file. 
# Previously:
#       )}
#     </div>
#   );
# };
# But since the very first return was replaced by `return ( <>`, we need to end with `</> ); };`
# However, the original `return ( <div id="library-all-shelves-view"...` was replaced by `) : ( <div...`
# And that div is closed at `old_modals_context`.
# But wait, the modals were inside the `div`!
# Let's check original file structure!
