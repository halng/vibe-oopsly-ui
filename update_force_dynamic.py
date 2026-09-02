for f in ["src/app/layout.tsx", "src/app/[[...slug]]/page.tsx"]:
    with open(f, 'r') as file:
        content = file.read()
    if "export const dynamic" not in content:
        content = "export const dynamic = 'force-dynamic';\n" + content
    with open(f, 'w') as file:
        file.write(content)
