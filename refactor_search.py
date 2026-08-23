import re

with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    content = f.read()

# 1. Add globalSubjectSearchQuery state
content = content.replace(
    "const [subjectSearchQuery, setSubjectSearchQuery] = useState('');",
    "const [subjectSearchQuery, setSubjectSearchQuery] = useState('');\n  const [globalSubjectSearchQuery, setGlobalSubjectSearchQuery] = useState('');"
)

# 2. Add globalFilteredSubjects memo
global_filter_code = """
  // Filter subjects globally across all shelves
  const globalFilteredSubjects = useMemo(() => {
    if (!globalSubjectSearchQuery.trim()) return [];
    const query = globalSubjectSearchQuery.toLowerCase();
    return subjects.filter((s) => {
      if (s.isDeleted) return false;
      const matchesSearch =
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(query)));
      return matchesSearch;
    });
  }, [subjects, globalSubjectSearchQuery]);
"""
content = content.replace(
    "const activeShelfTags = useMemo(() => {",
    global_filter_code + "\n  const activeShelfTags = useMemo(() => {"
)

# 3. Extract renderSubjectCard function
# Read the extracted subject card code
with open('subject_card_code.tsx', 'r') as f:
    subject_card_code = f.read()

# Remove the trailing '            })}' and leading indentation if any
subject_card_code = subject_card_code.rstrip().replace('            })}', '')

render_function = "  const renderSubjectCard = (subject: Subject) => {\n" + subject_card_code + "  };\n"

# Insert renderSubjectCard before renderStudyGoalTracker
content = content.replace(
    "  const renderStudyGoalTracker = () => {",
    render_function + "\n  const renderStudyGoalTracker = () => {"
)

# 4. Replace the old map code with the function call
# We need to replace:
# {filteredSubjectsInActiveShelf.map((subject) => {
#    const hasDue = subject.dueCount > 0;
#    return (
#      <div
# ...
#              );
#            })}
old_map_code = "            {filteredSubjectsInActiveShelf.map((subject) => {\n" + subject_card_code + "            })}"
# wait, subject_card_code might not match exactly if I modified it. Let's do a regex replacement for the grid contents.
# Actually, I can just replace the old block manually by matching from "{filteredSubjectsInActiveShelf.map((subject) => {" to "})}"

pattern = re.compile(r'\{filteredSubjectsInActiveShelf\.map\(\(subject\) => \{.*?return \(\s*(<div.*?</div\>)\s*\);\s*\}\)\}', re.DOTALL)
content = pattern.sub("{filteredSubjectsInActiveShelf.map(renderSubjectCard)}", content)

# 5. Modify the "Search Shelves" toolbar in View 2
old_toolbar = """      {/* Search Shelves Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-shelves-input"
            data-testid="search-shelves-input"
            type="text"
            placeholder="Search shelves by name or description..."
            value={shelfSearchQuery}
            onChange={(e) => setShelfSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
          />
          {shelfSearchQuery && (
            <button
              onClick={() => setShelfSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>"""

new_toolbar = """      {/* Search Toolbars */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-shelves-input"
            data-testid="search-shelves-input"
            type="text"
            placeholder="Search shelves..."
            value={shelfSearchQuery}
            onChange={(e) => setShelfSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
          />
          {shelfSearchQuery && (
            <button
              onClick={() => setShelfSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all subjects by title or tag..."
            value={globalSubjectSearchQuery}
            onChange={(e) => setGlobalSubjectSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
          />
          {globalSubjectSearchQuery && (
            <button
              onClick={() => setGlobalSubjectSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>"""

content = content.replace(old_toolbar, new_toolbar)

# 6. Render globalFilteredSubjects if globalSubjectSearchQuery is present
old_shelves_render = """      {/* Shelves Grid (Level 1) */}
      {filteredShelves.length === 0 ? ("""

new_shelves_render = """      {/* Shelves Grid (Level 1) or Global Subjects */}
      {globalSubjectSearchQuery.trim() ? (
        globalFilteredSubjects.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                No subjects found
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
                Try adjusting your search query.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {globalFilteredSubjects.map(renderSubjectCard)}
          </div>
        )
      ) : filteredShelves.length === 0 ? ("""

content = content.replace(old_shelves_render, new_shelves_render)

with open('src/components/LibraryShelvesView.tsx', 'w') as f:
    f.write(content)

print("Done refactoring LibraryShelvesView")
