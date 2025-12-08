import json
import os
from docx import Document
from openai import OpenAI
import re
from datetime import datetime

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

def enhance_extraction_with_ai(transcript_text, filename):
    """Use OpenAI to extract structured data from transcript"""

    prompt = f"""
    Extract the following information from this podcast transcript and return it as JSON:

    1. Episode title (if mentioned)
    2. Series name - Look for the actual podcast name in the transcript (e.g., "My Best Shift podcast", "Present Navigating and Enduring Life Events", "Heidrick & Struggles Leadership Podcast", "PWC Pulse", "Next in Health")
       IMPORTANT: If you see "Mya Shift" or similar, the correct name is "My Best Shift podcast"
       IMPORTANT: Do NOT use "Unknown" as a series name - always extract the actual podcast name from the transcript
    3. Episode number (if mentioned)
    4. Date (parse from filename: {filename})
    5. Host names (list)
    6. Guest names (list)
    7. Guest work experience (name, title, company for each guest)
    8. Key topics discussed (list of 5-10 main topics)
    9. Notable quotes (2-3 impactful quotes with speaker attribution)
    10. Word count (approximate)
    11. Summary (2-3 sentence summary of the episode)

    Transcript:
    {transcript_text[:4000]}...

    Return only valid JSON format.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at extracting structured data from podcast transcripts. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.1
        )

        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error with OpenAI API: {e}")
        return None

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

def process_test_scripts():
    """Process all test script files and extract enhanced data"""
    test_scripts_dir = "Test Scripts"
    enhanced_data = []
    
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
        
        # Use AI to extract enhanced data
        ai_data = enhance_extraction_with_ai(transcript_text, filename)
        
        # Create enhanced episode data
        episode_data = {
            "id": filename.replace('.docx', ''),
            "fileName": filename.replace('.docx', ''),
            "date": file_info['date'] or (ai_data.get('date') if ai_data else None),
            "series": file_info['series'] or (ai_data.get('series') if ai_data else ""),
            "episodeNumber": file_info['episode_number'] or (ai_data.get('episode_number') if ai_data else ""),
            "episodeTitle": ai_data.get('episode_title', '') if ai_data else '',
            "hosts": ai_data.get('hosts', []) if ai_data else [],
            "guests": ai_data.get('guests', []) if ai_data else [],
            "guestWorkExperience": ai_data.get('guest_work_experience', []) if ai_data else [],
            "keyTopics": ai_data.get('key_topics', []) if ai_data else [],
            "notableQuotes": ai_data.get('notable_quotes', []) if ai_data else [],
            "summary": ai_data.get('summary', '') if ai_data else '',
            "transcript": transcript_text,
            "audioLink": "",
            "wordCount": len(transcript_text.split()) if transcript_text else 0,
            "extractedAt": datetime.now().isoformat()
        }
        
        enhanced_data.append(episode_data)
        print(f"Processed {filename}")
    
    return enhanced_data

def merge_with_existing_data(enhanced_data):
    """Merge enhanced data with existing extracted data"""
    existing_file = "public/data/extracted_data.json"
    
    try:
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except:
        existing_data = []
    
    # Create a map of existing data by ID
    existing_map = {item['id']: item for item in existing_data}
    
    # Merge enhanced data
    for enhanced_item in enhanced_data:
        item_id = enhanced_item['id']
        if item_id in existing_map:
            # Update existing item with enhanced data
            existing_item = existing_map[item_id]
            existing_item.update({
                'keyTopics': enhanced_item['keyTopics'],
                'notableQuotes': enhanced_item['notableQuotes'],
                'summary': enhanced_item['summary'],
                'extractedAt': enhanced_item['extractedAt']
            })
        else:
            # Add new item
            existing_data.append(enhanced_item)
    
    return existing_data

def main():
    print("Starting enhanced podcast data extraction...")
    
    # Process test scripts
    enhanced_data = process_test_scripts()
    
    # Merge with existing data
    final_data = merge_with_existing_data(enhanced_data)
    
    # Save enhanced data
    output_file = "public/data/extracted_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
    
    print(f"Enhanced data saved to {output_file}")
    print(f"Total episodes: {len(final_data)}")

if __name__ == "__main__":
    main()