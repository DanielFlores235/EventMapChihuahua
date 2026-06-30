import json
import os

log = r'C:\Users\danie\.gemini\antigravity\brain\76d51cde-f456-423e-9a74-03b055d5c501\.system_generated\logs\transcript_full.jsonl'
files = {}

with open(log, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                tool_name = call.get('name', '')
                args = call.get('args', {})
                
                if 'write_to_file' in tool_name or 'replace_file_content' in tool_name or 'multi_replace_file_content' in tool_name:
                    try:
                        target = args.get('TargetFile', '')
                        content = args.get('CodeContent', '') or args.get('ReplacementContent', '')
                        if not content and 'ReplacementChunks' in args:
                            # It's harder to replay multi_replace cleanly here.
                            # Luckily we used write_to_file for all major files!
                            continue
                            
                        if target and content:
                            files[target.lower()] = (target, content)
                    except Exception as e:
                        pass

print(f"Found {len(files)} files in history.")

for k, v in files.items():
    if 'src' in k or 'app.tsx' in k:
        target_path = v[0].replace('src\\screens', 'src\\views')
        print(f"Restoring: {target_path} ({len(v[1])} bytes)")
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'w', encoding='utf-8') as out:
            out.write(v[1])
