"""
Fix transcript format: Move speaker names before timestamps
From: [00:00:23] Speaker: text
To: Speaker: [00:00:23] text
"""

import firebase_admin
from firebase_admin import credentials, firestore
import re

# Initialize Firebase
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": "podcast-database-3c8ad",
    "private_key_id": "your-private-key-id",
    "private_key": "your-private-key",
    "client_email": "your-client-email",
    "client_id": "your-client-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "your-cert-url"
})

firebase_admin.initialize_app(cred)
db = firestore.client()

def reformat_transcript(transcript):
    """Reformat transcript: Speaker name before timestamp"""
    # Pattern: [HH:MM:SS] Speaker: text
    pattern = r'\[(\d{2}:\d{2}:\d{2})\]\s*([^:\n]+):\s*'
    
    def replace_func(match):
        timestamp = match.group(1)
        speaker = match.group(2).strip()
        return f"{speaker}: [{timestamp}] "
    
    return re.sub(pattern, replace_func, transcript)

def fix_all_transcripts():
    """Update all episode transcripts in Firestore"""
    episodes_ref = db.collection('episodes')
    docs = episodes_ref.stream()
    
    count = 0
    fixed = 0
    
    for doc in docs:
        count += 1
        episode = doc.to_dict()
        transcript = episode.get('transcript', '')
        
        # Check if transcript needs fixing (has [timestamp] Speaker: format)
        if re.search(r'\[\d{2}:\d{2}:\d{2}\]\s*[^:\n]+:', transcript):
            reformatted = reformat_transcript(transcript)
            
            # Update Firestore
            doc.reference.update({'transcript': reformatted})
            fixed += 1
            print(f"✓ Fixed: {episode.get('episodeTitle', doc.id)}")
    
    print(f"\n✅ Complete! Fixed {fixed} of {count} episodes")

if __name__ == "__main__":
    print("⚠️  This script requires Firebase Admin SDK credentials")
    print("Update the credentials in the script before running\n")
    # Uncomment to run:
    # fix_all_transcripts()
