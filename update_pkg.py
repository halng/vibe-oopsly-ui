import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

# Update scripts
pkg['scripts']['dev'] = "tsx server.ts"
pkg['scripts']['build'] = "next build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
pkg['scripts']['start'] = "NODE_ENV=production node dist/server.cjs"
pkg['scripts']['lint'] = "next lint"

# Ensure next is in deps
if 'next' not in pkg['dependencies']:
    pkg['dependencies']['next'] = "latest"

# Remove vite dependencies if we want, but tests might need them. We can leave them for tests.
# But we should remove `@tailwindcss/vite` from vite.config.ts if it exists to avoid conflicts.

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
print("Updated package.json")
