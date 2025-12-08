import os
import json
import openai
from docx import Document
from datetime import datetime
import re

# Set your OpenAI API key here
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Loaded from environment
openai.api_key = OPENAI_API_KEY

def extract_text_from_docx(file_path):
    """Extract text content from DOCX file"""
    doc = Document(file_path)
    text = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text.strip())
    return '\n'.join(text)

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

def extract_podcast_data_with_ai(transcript_text, filename):
    """Use OpenAI to extract structured data from podcast transcript"""

    prompt = f"""
    Extract the following information from this podcast transcript and return it as valid JSON:

    {{
        "id": "{filename}",
        "fileName": "{filename}",
        "date": "YYYY-MM-DD format from filename or transcript",
        "series": "podcast series name (e.g., CLS, PULSE, MBS, NIH, Present)",
        "episodeNumber": "episode number if mentioned",
        "episodeTitle": "full episode title",
        "hosts": ["array of host names"],
        "guests": ["array of guest names"],
        "guestWorkExperience": [
            {{
                "name": "guest name",
                "title": "job title",
                "company": "company name"
            }}
        ],
        "transcript": "full transcript text",
        "audioLink": "",
        "wordCount": word_count_number,
        "extractedAt": "{datetime.now().isoformat()}"
    }}

    Rules:
    1. Identify hosts vs guests based on who introduces the show or says "welcome to"
    2. Extract guest work experience from introductions or conversations
    3. For series name, look for the actual podcast name in the transcript (e.g., "My Best Shift podcast", "Present Navigating and Enduring Life Events", "Heidrick & Struggles Leadership Podcast", "PWC Pulse", "Next in Health")
    4. IMPORTANT: If you see "Mya Shift" or similar, the correct name is "My Best Shift podcast"
    5. IMPORTANT: Do NOT use "Unknown" as a series name - always extract the actual podcast name from the transcript
    6. If series/episode info is in filename, use it, but verify against transcript content
    7. Return only valid JSON, no extra text
    8. If information is missing, use empty string or empty array

    Transcript:
    {transcript_text[:4000]}...
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a data extraction expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip()
        
        # Clean up response to ensure valid JSON
        if result.startswith('```json'):
            result = result[7:]
        if result.endswith('```'):
            result = result[:-3]
            
        return json.loads(result)
        
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return None

def process_test_scripts():
    """Process all DOCX files in Test Scripts folder"""

    test_scripts_path = "Test Scripts"
    output_file = "public/data/extracted_data.json"

    if not os.path.exists(test_scripts_path):
        print(f"Test Scripts folder not found at {test_scripts_path}")
        return

    extracted_data = []

    # Process each DOCX file
    for filename in os.listdir(test_scripts_path):
        if filename.endswith('.docx'):
            print(f"Processing: {filename}")

            file_path = os.path.join(test_scripts_path, filename)
            base_name = filename.replace('.docx', '')

            try:
                # Extract text from DOCX
                transcript_text = extract_text_from_docx(file_path)

                if not transcript_text:
                    print(f"No text found in {filename}")
                    continue

                # Parse filename for date, series, episode number
                file_info = parse_filename_info(filename)

                # Extract data using AI
                podcast_data = extract_podcast_data_with_ai(transcript_text, base_name)

                if podcast_data:
                    # Add full transcript and word count
                    podcast_data['transcript'] = transcript_text
                    podcast_data['wordCount'] = len(transcript_text.split())

                    # Override with filename info if AI didn't extract it or if filename has better info
                    if file_info['series'] and not podcast_data.get('series'):
                        podcast_data['series'] = file_info['series']
                    if file_info['episode_number'] and not podcast_data.get('episodeNumber'):
                        podcast_data['episodeNumber'] = file_info['episode_number']
                    if file_info['date'] and not podcast_data.get('date'):
                        podcast_data['date'] = file_info['date']

                    extracted_data.append(podcast_data)
                    print(f"✓ Successfully processed {filename}")
                else:
                    print(f"✗ Failed to process {filename}")

            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    # Save extracted data
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Extraction complete! Saved {len(extracted_data)} episodes to {output_file}")
    
    # Print summary
    print(f"\nSummary:")
    print(f"- Total episodes: {len(extracted_data)}")
    print(f"- Total hosts: {len(set([host for ep in extracted_data for host in ep.get('hosts', [])]))}")
    print(f"- Total guests: {len(set([guest for ep in extracted_data for guest in ep.get('guests', [])]))}")
    print(f"- Series found: {set([ep.get('series', 'Unknown') for ep in extracted_data])}")

if __name__ == "__main__":
    print("Starting podcast data extraction...")
    print("Make sure to set your OpenAI API key in the script!")
    
    # Check if API key is set
    if OPENAI_API_KEY == "your-api-key-here":
        print("❌ Please set your OpenAI API key in the script first!")
        exit(1)
    
    process_test_scripts()