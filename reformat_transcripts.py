import re

def reformat_transcript(transcript):
    """
    Reformat transcript to have speaker name before timestamp.
    
    Input format:
    [00:00:23] Marcie: Welcome to...
    
    Output format:
    Marcie: [00:00:23] Welcome to...
    """
    
    # Pattern: [timestamp] Speaker: text
    pattern = r'\[(\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.+?)(?=\n\[|\Z)'
    
    def replace_func(match):
        timestamp = match.group(1)
        speaker = match.group(2).strip()
        text = match.group(3).strip()
        return f"{speaker}: [{timestamp}] {text}"
    
    # Apply the transformation
    reformatted = re.sub(pattern, replace_func, transcript, flags=re.DOTALL)
    
    return reformatted

# Test with the example
test_input = """[00:00:23] Marcie: Welcome to CEO actions, day of understanding, real talk dialogue podcast. I'm Marci Mara Comey. This series aims to inspire inclusive behaviors and a sense of belonging through powerful and provocative dialogue. While the terms equity and equality may sound similar, the implementation of one versus the other can lead to dramatically different outcomes for marginalized people.

[00:00:45] During this conversation, we will be joined by a variety of voices."""

print("Input:")
print(test_input)
print("\nOutput:")
print(reformat_transcript(test_input))
