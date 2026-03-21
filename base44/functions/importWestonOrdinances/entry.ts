import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FILE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/73a8526b2_weston-fl-1.txt";
const WESTON_CITY_ID = "69ac55f8ceadefcf6443132b";

function categorize(chapterTitle, sectionTitle, content) {
  const text = (chapterTitle + " " + sectionTitle + " " + (content || "")).toLowerCase();
  if (/zon|land use|setback|district|density|floor area|lot coverage|height limit|sign|subdivision|plat/.test(text)) return "zoning";
  if (/build|construct|permit|certificate of occupancy|structure|renovation|addition/.test(text)) return "building";
  if (/fire|sprinkler|alarm|hazard|emergency|flammable/.test(text)) return "fire_safety";
  if (/electric|wir|circuit|power/.test(text)) return "electrical";
  if (/plumb|sewer|drain|water|irrigation|utility|potable/.test(text)) return "plumbing";
  if (/environ|tree|landscape|vegetation|stormwater|flood|wetland|natural/.test(text)) return "environmental";
  if (/sign|signage|billboard|poster/.test(text)) return "signs";
  if (/subdivis|plat|lot split/.test(text)) return "subdivision";
  if (/admin|manager|commission|budget|fee|tax|fund|audit|election|charter|personnel/.test(text)) return "administrative";
  if (/land|develop|growth|comprehensive plan/.test(text)) return "land_use";
  return "other";
}

function parseOrdinances(text) {
  const lines = text.split('\n');
  const records = [];

  let currentChapterNum = '';
  let currentChapterTitle = '';
  let currentSectionNum = '';
  let currentSectionTitle = '';
  let currentContent = [];
  let inContent = false;

  // Patterns
  const chapterPattern = /^CHAPTER\s+(\d+):\s*(.+)/i;
  const chapterPattern2 = /^CHAPTER\s+(\d+)\.\s*(.+)/i;
  const sectionPattern = /^§\s*([\d\w\.-]+)\s+([A-Z][^.]*?)\.?\s*$/;
  const sectionPattern2 = /^Section\s+([\d\w\.-]+)\.\s+(.+?)\.?--$/i;
  const articlePattern = /^ARTICLE\s+([IVXLCDM]+)\.\s+(.+)/i;
  const titlePattern = /^TITLE\s+([IVX]+):\s*(.+)/i;

  function flushSection() {
    if (!currentSectionTitle) return;
    const content = currentContent.join(' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
    if (content.length < 20 && currentContent.length < 3) return; // skip stubs
    records.push({
      city_id: WESTON_CITY_ID,
      city_name: "Weston",
      chapter_number: currentChapterNum,
      chapter_title: currentChapterTitle,
      section_number: currentSectionNum,
      section_title: currentSectionTitle.slice(0, 200),
      category: categorize(currentChapterTitle, currentSectionTitle, content),
      content: content,
      is_active: true,
      reference_url: "https://library.municode.com/fl/weston/codes/code_of_ordinances"
    });
    currentContent = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Match TITLE header
    const titleMatch = line.match(titlePattern);
    if (titleMatch) {
      flushSection();
      currentChapterNum = 'Title ' + titleMatch[1];
      currentChapterTitle = titleMatch[2].trim();
      currentSectionNum = '';
      currentSectionTitle = '';
      inContent = false;
      continue;
    }

    // Match CHAPTER header
    const chapMatch = line.match(chapterPattern) || line.match(chapterPattern2);
    if (chapMatch) {
      flushSection();
      currentChapterNum = 'Chapter ' + chapMatch[1];
      currentChapterTitle = chapMatch[2].trim();
      currentSectionNum = '';
      currentSectionTitle = '';
      inContent = false;
      continue;
    }

    // Match ARTICLE header
    const artMatch = line.match(articlePattern);
    if (artMatch) {
      flushSection();
      currentChapterNum = 'Article ' + artMatch[1];
      currentChapterTitle = artMatch[2].trim();
      currentSectionNum = '';
      currentSectionTitle = '';
      inContent = false;
      continue;
    }

    // Match Section X.XX. Title.--
    const secMatch2 = line.match(sectionPattern2);
    if (secMatch2) {
      flushSection();
      currentSectionNum = secMatch2[1];
      currentSectionTitle = secMatch2[2].trim();
      inContent = true;
      continue;
    }

    // Match § X.XX TITLE.
    const secMatch = line.match(sectionPattern);
    if (secMatch) {
      flushSection();
      currentSectionNum = secMatch[1];
      currentSectionTitle = secMatch[2].trim();
      inContent = true;
      continue;
    }

    // Collect content
    if (inContent && currentSectionTitle) {
      // Skip cross-reference and statutory reference lines
      if (/^(Cross-reference|Statutory reference|Editor's note|Ord\.\s*\d|Am\.\s*Ord\.|Statutory Reference)/.test(line)) continue;
      if (line.startsWith('[https://')) continue;
      currentContent.push(line);
    }
  }

  flushSection();
  return records;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch the file
  const res = await fetch(FILE_URL);
  if (!res.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 500 });
  const text = await res.text();

  // Parse ordinances
  const records = parseOrdinances(text);

  // Read offset and limit from payload
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const offset = body.offset || 0;
  const limit = body.limit || 100;
  const slice = records.slice(offset, offset + limit);

  // Insert sequentially with small delay to avoid rate limits
  let created = 0;
  let errors = 0;

  for (const r of slice) {
    try {
      await base44.asServiceRole.entities.CodeOfOrdinance.create(r);
      created++;
      await new Promise(resolve => setTimeout(resolve, 400));
    } catch (e) {
      errors++;
    }
  }

  return Response.json({
    success: true,
    total_parsed: records.length,
    offset,
    limit,
    slice_size: slice.length,
    created,
    errors,
    next_offset: offset + limit < records.length ? offset + limit : null
  });
});