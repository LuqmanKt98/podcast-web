export function parseFilename(filename: string) {
  const base = filename.replace(/\.(docx?|txt|pdf)$/i, '');
  const dateMatch = base.match(/(\d{8})/);
  const seriesMatch = base.match(/-([A-Z]+)-(\d+)/i);
  const presentMatch = base.match(/Present_(\d+)/i);
  
  let date = '';
  if (dateMatch) {
    const d = dateMatch[1];
    date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  }
  
  let series = '';
  let episodeNumber = '';
  
  if (seriesMatch) {
    series = seriesMatch[1].toUpperCase();
    episodeNumber = seriesMatch[2];
  } else if (presentMatch) {
    series = 'Present';
    episodeNumber = presentMatch[1];
  }
  
  return { date, series, episodeNumber };
}

export function extractFromText(text: string) {
  const lines = text.split('\n');
  
  const hosts: string[] = [];
  const guests: string[] = [];
  let episodeTitle = '';
  
  const titlePatterns = [
    /Welcome to (.+?) podcast/i,
    /This is (.+?) podcast/i,
    /You're listening to (.+?) podcast/i,
  ];
  
  for (const line of lines) {
    for (const pattern of titlePatterns) {
      const match = line.match(pattern);
      if (match) {
        episodeTitle = match[1].trim();
        break;
      }
    }
    
    if (line.match(/I'm|My name is|This is/i)) {
      const names = line.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g);
      if (names) hosts.push(...names);
    }
    
    if (line.match(/joined by|with us today|welcome|guest/i)) {
      const names = line.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g);
      if (names) guests.push(...names);
    }
  }
  
  return {
    episodeTitle,
    hosts: [...new Set(hosts)],
    guests: [...new Set(guests)],
  };
}
