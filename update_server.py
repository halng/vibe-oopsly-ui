import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add import next from 'next' if not present
if "import next from 'next';" not in content:
    content = content.replace("import express", "import next from 'next';\nimport express")

old_block = """  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }"""

new_block = """  // Next.js Integration
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  app.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });"""

content = content.replace(old_block, new_block)

# Remove createViteServer import
content = re.sub(r"import\s*\{\s*createServer\s*as\s*createViteServer\s*\}\s*from\s*'vite';\n?", "", content)

with open('server.ts', 'w') as f:
    f.write(content)
print("Updated server.ts")
