import { NextRequest, NextResponse } from 'next/server';

function formatTranscript(text: string, hosts: string[] = [], guests: string[] = []): string {
  // First, convert [timestamp] Speaker: format to Speaker: [timestamp] format
  let formatted = text.replace(/\[(\d{2}:\d{2}:\d{2})\]\s*([^:\n]+):\s*/g, '$2: [$1] ');

  // Add missing speaker names to lines starting with just timestamps
  const lines = formatted.split('\n\n');
  let lastSpeaker = null;
  const fixedLines = [];

  for (let line of lines) {
    if (/^\[(\d{2}:\d{2}:\d{2})\]/.test(line) && lastSpeaker) {
      line = `${lastSpeaker}: ${line}`;
    } else {
      const match = line.match(/^([^:\[]+):/);
      if (match) lastSpeaker = match[1].trim();
    }
    fixedLines.push(line);
  }

  return fixedLines.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const { text, docTitle } = await request.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract podcast data as JSON. Return only valid JSON with: episodeTitle, series, episodeNumber, hosts (array), guests (array), guestWorkExperience (array of {name, title, company}), date (YYYY-MM-DD format if found). Look at document title and content for all fields.',
          },
          {
            role: 'user',
            content: `Document title: ${docTitle || 'N/A'}\n\nExtract from this transcript:\n\n${text.slice(0, 4000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      ...extracted,
      transcript: formatTranscript(text, extracted.hosts, extracted.guests)
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
