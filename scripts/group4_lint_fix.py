from pathlib import Path

path = Path("src/components/site/ai-assistant.tsx")
text = path.read_text()
old = '''    let cancelled = false;
    setServiceStatus("checking");
    void fetch("/api/ai/chat", { method: "GET", headers: { Accept: "application/json" } })'''
new = '''    let cancelled = false;
    void fetch("/api/ai/chat", { method: "GET", headers: { Accept: "application/json" } })'''
if text.count(old) != 1:
    raise SystemExit(f"Expected one health-effect match, got {text.count(old)}")
text = text.replace(old, new, 1)
old = '''        onClick={() => {
          setOpen((value) => !value);
          window.setTimeout(() => inputRef.current?.focus(), 80);
        }}'''
new = '''        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) setServiceStatus("checking");
          setOpen(nextOpen);
          window.setTimeout(() => inputRef.current?.focus(), 80);
        }}'''
if text.count(old) != 1:
    raise SystemExit(f"Expected one assistant-toggle match, got {text.count(old)}")
path.write_text(text.replace(old, new, 1))
