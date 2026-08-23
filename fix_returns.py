import re

with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    content = f.read()

# The first return is:
#   if (activeShelf) {
#     return (
#       <div id="shelf-detail-view" className="space-y-6 animate-fade-in">
# ...
#       </div>
#     );
#   }
#
#   // ==========================================
#   // VIEW 2: ALL SHELVES (LEVEL 1)
#   // ==========================================
#   return (
#     <div id="library-all-shelves-view" className="space-y-6 animate-fade-in">

# We need to extract the inside of the first return.
match_level2 = re.search(r'  if \(activeShelf\) \{\n    return \(\n(.*?)    \);\n  \}\n\n  // ==========================================\n  // VIEW 2: ALL SHELVES \(LEVEL 1\)', content, re.DOTALL)

if match_level2:
    level2_jsx = match_level2.group(1)
    
    # Remove the first return block
    content = content[:match_level2.start()] + "  // ==========================================\n  // VIEW 2: ALL SHELVES (LEVEL 1)\n" + content[match_level2.end():]
    
    # Now, find the second return:
    #   return (
    #     <div id="library-all-shelves-view" ...>
    
    content = content.replace(
        '  // VIEW 2: ALL SHELVES (LEVEL 1)\n  // ==========================================\n  return (\n    <div id="library-all-shelves-view"',
        '  // VIEW 2: ALL SHELVES (LEVEL 1)\n  // ==========================================\n  return (\n    <>\n      {activeShelf ? (\n' + level2_jsx + '      ) : (\n        <div id="library-all-shelves-view"'
    )
    
    # Now find where the Modals start (around Direct Import Cards Modal)
    #       {/* Direct Import Cards Modal */}
    content = content.replace(
        '      {/* Direct Import Cards Modal */}',
        '      )}\n\n      {/* Direct Import Cards Modal */}',
        1
    )
    
    # And close the fragment at the end
    #     </div>
    #   );
    # };
    # But wait! I replaced the last </div> with Modals already.
    # The end of the file currently is:
    #             )}
    #           </div>
    #         </div>
    #       )}
    #     </div>
    #   );
    # };
    
    # Let's replace the last </div> before ); with </>
    # To be safe, let's just do a string replacement of the very end.
    end_pattern = r'    </div>\n  \);\n\};'
    content = re.sub(end_pattern, '    </>\n  );\n};', content)

    with open('src/components/LibraryShelvesView.tsx', 'w') as f:
        f.write(content)
    print("Successfully refactored returns")
else:
    print("Could not find Level 2 return block")
