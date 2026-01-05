from pathlib import Path
s = Path('docs/UINspecificationSchemaV08.json').read_text(encoding='utf-8')
print('len=', len(s))
idx = 12350
start = max(0, idx-80)
end = min(len(s), idx+80)
print('context range', start, end)
print('--- start of context ---')
print(s[start:end])
print('--- end of context ---')
for i, ch in enumerate(s[start:end], start):
    if ord(ch) < 32 and ch not in ['\n','\r','\t']:
        print('control char at', i, ord(ch))
