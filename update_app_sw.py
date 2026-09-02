with open('src/App.tsx', 'r') as f:
    content = f.read()

if "registerServiceWorker" not in content:
    content = content.replace(
        "import React, { useState", 
        "import { registerServiceWorker } from './serviceWorkerRegistration';\nimport React, { useState"
    )
    content = content.replace(
        "export const App: React.FC = () => {", 
        "export const App: React.FC = () => {\n  React.useEffect(() => { registerServiceWorker(); }, []);"
    )

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated SW in App.tsx")
