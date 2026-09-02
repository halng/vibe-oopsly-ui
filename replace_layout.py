import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the beginning of the return statement
start_pattern = r'<BrowserRouter>\s*<div\s+id="app-root-container".*?\{/\* Main Content Area \*/\}\s*<main className="[^"]+">'

# Using regex to match from `<BrowserRouter>` to `<main ...>`
start_replacement = """<BrowserRouter>
      <Layout
        user={user}
        onOpenNewShelf={() => {
          setEditingShelf(null);
          setIsShelfModalOpen(true);
        }}
        modals={
          <>"""

content_sub = re.sub(start_pattern, start_replacement, content, flags=re.DOTALL)

# Now replace the closing parts.
# Search for `</Routes>\n      </main>\n\n      {/* Footer */}\n      <footer ... </footer>\n`
# And replace with `</Routes>\n      </Layout>\n` ? No, the modals are going in the `modals` prop.
# Let's match from `</Routes>` to the first `{/* Full-screen Flashcard Review Mode */}`
mid_pattern = r'</Routes>\s*</main>\s*\{/\* Footer \*/\}.*?</footer>\s*(?=\{/\* Full-screen Flashcard Review Mode \*/\})'
mid_replacement = "</Routes>\n        }\n      >\n        <Routes>\n"

# Actually, the `<Routes>` should be the children, and the Modals should be the `modals` prop.
# So the structure should be:
# <BrowserRouter>
#   <Layout user={user} onOpenNewShelf={...} modals={<> {MODALS} </>}>
#     <Routes>
#       ...
#     </Routes>
#   </Layout>
# </BrowserRouter>

# Let's do it with exact string splits to avoid regex issues.

part1 = content.split('      {/* Main Content Area */}')
if len(part1) == 2:
    before_main = part1[0]
    rest1 = part1[1]
    
    part2 = rest1.split('</Routes>\n      </main>')
    routes_block = part2[0].replace('<main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">\n        <Routes>', '<Routes>')
    
    rest2 = part2[1]
    part3 = rest2.split('</footer>')
    modals_block = part3[1]
    
    # Extract modals up to the final </div>
    modals_only = modals_block.rsplit('</div>', 1)[0]
    
    new_content = before_main.split('<div\n      id="app-root-container"')[0] + """
      <Layout
        user={user}
        onOpenNewShelf={() => {
          setEditingShelf(null);
          setIsShelfModalOpen(true);
        }}
        modals={
          <>""" + modals_only + """          </>
        }
      >
        <Routes>""" + routes_block + """</Routes>
      </Layout>
    </BrowserRouter>
  );
};
"""
    
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Failed")
