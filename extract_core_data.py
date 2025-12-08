import json
import os
from docx import Document
import re
from datetime import datetime

def extract_text_from_docx(file_path):
    """Extract text from a Word document"""
    try:
        doc = Document(file_path)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return '\n'.join(text)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def parse_filename_info(filename):
    """Parse date, series, and episode info from filename"""
    # Remove extension
    base_name = filename.replace('.docx', '').replace('.txt', '')

    # Try to extract date (YYYYMMDD format)
    date_match = re.search(r'(\d{8})', base_name)
    date = None
    if date_match:
        date_str = date_match.group(1)
        try:
            date = datetime.strptime(date_str, '%Y%m%d').strftime('%Y-%m-%d')
        except:
            pass

    # Try to extract series and episode number
    # Pattern 1: Standard format like "20241021-cls-062-V1-TRX" or "20250204-MBS-0506-V1"
    series_match = re.search(r'-([A-Z]+)-(\d+)', base_name, re.IGNORECASE)
    series = ""
    episode_number = ""

    if series_match:
        series = series_match.group(1).upper()
        episode_number = series_match.group(2)
    else:
        # Pattern 2: "Present" format like "22_0322_Present_010-V1"
        present_match = re.search(r'Present_(\d+)', base_name, re.IGNORECASE)
        if present_match:
            series = "Present"
            episode_number = present_match.group(1)

    return {
        'date': date,
        'series': series,
        'episode_number': episode_number
    }

def extract_podcast_info(transcript_text):
    """Extract podcast information from transcript text"""
    
    # Extract episode title (look for common podcast title patterns)
    title_patterns = [
        r'Welcome to (.+?) podcast',
        r'Welcome to (.+?)\.',
        r'This is (.+?) podcast',
        r'You\'re listening to (.+?) podcast',
        r'(.+?) Podcast',
        r'(.+?) podcast'
    ]
    
    episode_title = ""
    for pattern in title_patterns:
        match = re.search(pattern, transcript_text, re.IGNORECASE)
        if match:
            episode_title = match.group(1).strip()
            break
    
    # Extract hosts and guests (look for introduction patterns)
    hosts = []
    guests = []
    
    # Common host introduction patterns
    host_patterns = [
        r"I'm ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"My name is ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"This is ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"I am ([A-Z][a-z]+ [A-Z][a-z]+)"
    ]
    
    # Guest introduction patterns
    guest_patterns = [
        r"joined by ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"with us today ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"welcome ([A-Z][a-z]+ [A-Z][a-z]+)",
        r"guest ([A-Z][a-z]+ [A-Z][a-z]+)"
    ]
    
    # Extract names
    all_names = set()
    
    for pattern in host_patterns + guest_patterns:
        matches = re.findall(pattern, transcript_text, re.IGNORECASE)
        for match in matches:
            if len(match.split()) == 2:  # First and last name
                all_names.add(match)
    
    # Try to distinguish hosts from guests based on context
    # This is a simplified approach - in practice, you'd need more sophisticated logic
    names_list = list(all_names)
    if len(names_list) >= 2:
        hosts = names_list[:2]  # Assume first 2 are hosts
        guests = names_list[2:]  # Rest are guests
    else:
        hosts = names_list
    
    # Extract work experience (look for title and company patterns)
    work_experience = []
    
    # Patterns for job titles and companies
    title_company_patterns = [
        r"([A-Z][a-z]+ [A-Z][a-z]+).*?([A-Z][A-Z][A-Z]|[A-Z][a-z]+\s+[A-Z][a-z]+).*?(CEO|CTO|CFO|VP|Vice President|President|Director|Manager|Chief|Senior|Principal)",
        r"([A-Z][a-z]+ [A-Z][a-z]+).*?(CEO|CTO|CFO|VP|Vice President|President|Director|Manager|Chief|Senior|Principal).*?at ([A-Z][a-z]+)",
    ]
    
    for pattern in title_company_patterns:
        matches = re.findall(pattern, transcript_text, re.IGNORECASE)
        for match in matches:
            if len(match) >= 3:
                name = match[0]
                title = match[1] if 'CEO' in match[1] or 'VP' in match[1] else match[2]
                company = match[2] if 'CEO' in match[1] or 'VP' in match[1] else match[1]
                
                work_experience.append({
                    'name': name,
                    'title': title,
                    'company': company
                })
    
    return {
        'episode_title': episode_title,
        'hosts': hosts,
        'guests': guests,
        'work_experience': work_experience
    }

def process_test_scripts():
    """Process all test script files and extract core podcast data"""
    test_scripts_dir = "Test Scripts"
    extracted_data = []
    
    # Get list of docx files
    docx_files = [f for f in os.listdir(test_scripts_dir) if f.endswith('.docx')]
    
    for filename in docx_files:
        print(f"Processing {filename}...")
        
        file_path = os.path.join(test_scripts_dir, filename)
        transcript_text = extract_text_from_docx(file_path)
        
        if not transcript_text:
            continue
            
        # Parse basic info from filename
        file_info = parse_filename_info(filename)
        
        # Extract podcast information from transcript
        podcast_info = extract_podcast_info(transcript_text)
        
        # Create episode data with only the requested fields
        episode_data = {
            "id": filename.replace('.docx', ''),
            "fileName": filename.replace('.docx', ''),
            "date": file_info['date'],
            "series": file_info['series'],
            "episodeNumber": file_info['episode_number'],
            "episodeTitle": podcast_info['episode_title'],
            "hosts": podcast_info['hosts'],
            "guests": podcast_info['guests'],
            "guestWorkExperience": podcast_info['work_experience'],
            "transcript": transcript_text,
            "audioLink": "",  # To be filled in later when audio links are available
            "wordCount": len(transcript_text.split()) if transcript_text else 0,
            "extractedAt": datetime.now().isoformat()
        }
        
        extracted_data.append(episode_data)
        print(f"Processed {filename}")
    
    return extracted_data

def main():
    print("Extracting core podcast data as specified in the chat...")
    
    # Process test scripts
    extracted_data = process_test_scripts()
    
    # Save extracted data
    output_file = "public/data/extracted_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)
    
    print(f"Core data extracted and saved to {output_file}")
    print(f"Total episodes: {len(extracted_data)}")
    
    # Print summary
    for episode in extracted_data:
        print(f"\n{episode['id']}:")
        print(f"  Title: {episode['episodeTitle']}")
        print(f"  Series: {episode['series']} #{episode['episodeNumber']}")
        print(f"  Date: {episode['date']}")
        print(f"  Hosts: {', '.join(episode['hosts'])}")
        print(f"  Guests: {', '.join(episode['guests'])}")
        print(f"  Work Experience entries: {len(episode['guestWorkExperience'])}")
        print(f"  Word Count: {episode['wordCount']}")

if __name__ == "__main__":
    main()