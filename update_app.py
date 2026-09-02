with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { BrowserRouter" not in content:
    content = content.replace("import React, { useState", "import { BrowserRouter } from 'react-router-dom';\nimport React, { useState")

# Replace return (
content = content.replace("return (\n    <div\n      id=\"app-root-container\"", "return (\n    <BrowserRouter>\n    <div\n      id=\"app-root-container\"")
content = content.replace("    </div>\n  );\n};", "    </div>\n    </BrowserRouter>\n  );\n};")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")
