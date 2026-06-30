import json
import os
import re

log = r'C:\Users\danie\.gemini\antigravity\brain\76d51cde-f456-423e-9a74-03b055d5c501\.system_generated\logs\transcript_full.jsonl'
files = {}

with open(log, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        
        # We look for MODEL responses that are VIEW_FILE types or have content that looks like a view_file output
        if data.get('type') == 'VIEW_FILE' or 'File Path:' in data.get('content', ''):
            content = data.get('content', '')
            match = re.search(r'File Path: `file:///(.*?)`', content)
            if match:
                path = match.group(1).replace('/', '\\')
                # Extract the code
                # The code is between "The following code has been modified..." and "The above content shows the entire..."
                code_match = re.search(r'remove the line number, colon, and leading space\.\n(.*?)The above content', content, re.DOTALL)
                if code_match:
                    code_lines = code_match.group(1).strip().split('\n')
                    # Remove the "1: " prefix
                    clean_lines = []
                    for cl in code_lines:
                        # find the first colon
                        parts = cl.split(': ', 1)
                        if len(parts) == 2 and parts[0].isdigit():
                            clean_lines.append(parts[1])
                        else:
                            clean_lines.append(cl)
                    files[path.lower()] = (path, '\n'.join(clean_lines))

for k, v in files.items():
    if 'src' in k and 'views' not in k and 'screens' not in k: # Don't overwrite the ones we just restored
        target_path = v[0].replace('src\\screens', 'src\\views')
        print(f"Restoring from view history: {target_path} ({len(v[1])} bytes)")
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'w', encoding='utf-8') as out:
            out.write(v[1])
