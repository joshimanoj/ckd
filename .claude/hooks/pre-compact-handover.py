import datetime, os, subprocess

def safety_net_handover():
    handover = "HANDOVER.md"
    if os.path.exists(handover):
        mtime = os.path.getmtime(handover)
        age_hours = (datetime.datetime.now().timestamp() - mtime) / 3600
        if age_hours < 8:
            print("Checkpoint exists — skipping subprocess.")
            return

    filename = "HANDOVER.md"
    prompt = f'''
You are a technical lead doing a session handover. Using the full session transcript, generate {filename} with:
1. Executive Summary
2. Progress
3. Debugging Log
4. Architectural Decisions
5. Environment
6. Unresolved Threads
7. Immediate Next Steps (priority ordered)
'''
    try:
        result = subprocess.run(['claude', '-p', prompt],
            capture_output=True, text=True, check=True)
        with open(filename, 'w') as f:
            f.write(result.stdout)
        print(f'Saved: {filename}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    safety_net_handover()
