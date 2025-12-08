import json
import re
from datetime import datetime

def enhance_episode_data():
    """Enhance existing episode data with additional fields"""
    
    # Load existing data
    with open("public/data/extracted_data.json", 'r', encoding='utf-8') as f:
        episodes = json.load(f)
    
    # Enhance each episode with additional metadata
    for episode in episodes:
        # Extract key topics from transcript (simple keyword extraction)
        transcript = episode.get('transcript', '')
        
        # Common business/podcast topics
        topics = []
        topic_keywords = {
            'Leadership': ['leadership', 'leader', 'leading', 'management', 'manager'],
            'Technology': ['technology', 'tech', 'AI', 'artificial intelligence', 'digital', 'innovation'],
            'Healthcare': ['health', 'healthcare', 'medical', 'patient', 'clinical', 'hospital'],
            'Business Strategy': ['strategy', 'strategic', 'business', 'growth', 'transformation'],
            'Procurement': ['procurement', 'sourcing', 'supplier', 'vendor', 'supply chain'],
            'Career Development': ['career', 'professional', 'development', 'skills', 'training'],
            'Culture': ['culture', 'cultural', 'organizational', 'workplace', 'team'],
            'Purpose & Faith': ['purpose', 'faith', 'calling', 'spiritual', 'God', 'belief'],
            'Diversity & Inclusion': ['diversity', 'inclusion', 'diverse', 'inclusive', 'equity'],
            'Consulting': ['consulting', 'consultant', 'advisory', 'client', 'engagement']
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword.lower() in transcript.lower() for keyword in keywords):
                topics.append(topic)
        
        episode['keyTopics'] = topics[:6]  # Limit to 6 topics
        
        # Extract notable quotes (simple approach - look for quoted text)
        quotes = []
        quote_patterns = [
            r'"([^"]{50,200})"',  # Text in quotes
            r'culture eating strategy for breakfast',  # Known quote
            r'trusted advisors',
            r'iron sharpens iron'
        ]
        
        for pattern in quote_patterns:
            matches = re.findall(pattern, transcript, re.IGNORECASE)
            for match in matches[:2]:  # Limit to 2 quotes per pattern
                if len(match) > 30:  # Only meaningful quotes
                    quotes.append({
                        'quote': match.strip(),
                        'speaker': episode['guests'][0] if episode['guests'] else episode['hosts'][0] if episode['hosts'] else 'Unknown'
                    })
        
        episode['notableQuotes'] = quotes[:3]  # Limit to 3 quotes
        
        # Generate summary based on episode title and topics
        if episode.get('episodeTitle') and topics:
            summary = f"In this episode of {episode['episodeTitle']}, "
            if episode['guests']:
                summary += f"host(s) {', '.join(episode['hosts'])} interview {', '.join(episode['guests'])} "
            else:
                summary += f"{', '.join(episode['hosts'])} discuss "
            
            summary += f"key topics including {', '.join(topics[:3])}. "
            
            if episode['guestWorkExperience']:
                companies = list(set([exp['company'] for exp in episode['guestWorkExperience']]))
                summary += f"The conversation covers insights from experience at {', '.join(companies[:2])}."
            
            episode['summary'] = summary
        else:
            episode['summary'] = f"A podcast episode featuring discussions on business and professional topics."
        
        # Update extraction timestamp
        episode['extractedAt'] = datetime.now().isoformat()
    
    # Save enhanced data
    with open("public/data/extracted_data.json", 'w', encoding='utf-8') as f:
        json.dump(episodes, f, indent=2, ensure_ascii=False)
    
    print(f"Enhanced {len(episodes)} episodes with key topics, quotes, and summaries")
    
    # Print summary of enhancements
    for episode in episodes:
        print(f"\n{episode['id']}:")
        print(f"  Topics: {', '.join(episode['keyTopics'])}")
        print(f"  Quotes: {len(episode['notableQuotes'])}")
        print(f"  Summary: {episode['summary'][:100]}...")

if __name__ == "__main__":
    enhance_episode_data()