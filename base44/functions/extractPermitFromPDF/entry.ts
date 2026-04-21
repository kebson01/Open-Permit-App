import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `You are a permit data extraction assistant. Extract structured permit information from a city building department document URL. Return a JSON object with these exact fields: name (string), category (one of: building/electrical/plumbing/fire/certificate/planning/engineering/additional), map_zone (one of: garage/roof/windows/pool/backyard/fence/hvac/electrical/interior/driveway/structure), description (1 sentence plain English), typical_requirements (array of strings), documents_needed (array of strings), inspections_required (array of strings), typical_timeline (string like '2-3 business days'), noc_threshold (number - dollar amount as integer only e.g. 2500). Return ONLY valid JSON, no other text.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { pdfUrl, city } = await req.json();

    if (!pdfUrl) {
      return Response.json({ error: 'pdfUrl is required' }, { status: 400 });
    }

    // Try fetching the document content first
    let documentContext = `City: ${city || 'unknown'}\nDocument URL: ${pdfUrl}`;
    try {
      const fetchRes = await fetch(pdfUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenPermit/1.0)', 'Accept': 'text/html,*/*' },
        signal: AbortSignal.timeout(8000),
      });
      const contentType = fetchRes.headers.get('content-type') || '';
      if (!contentType.includes('pdf')) {
        const text = await fetchRes.text();
        const cleaned = text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{3,}/g, '\n')
          .trim()
          .slice(0, 10000);
        documentContext += `\n\nDocument Content:\n${cleaned}`;
      }
    } catch {
      // proceed without content
    }

    const prompt = `${SYSTEM_PROMPT}\n\nExtract permit data from this building department document.\n\n${documentContext}\n\nReturn ONLY valid JSON.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: ['building', 'electrical', 'plumbing', 'fire', 'certificate', 'planning', 'engineering', 'additional'] },
          map_zone: { type: 'string', enum: ['garage', 'roof', 'windows', 'pool', 'backyard', 'fence', 'hvac', 'electrical', 'interior', 'driveway', 'structure'] },
          description: { type: 'string' },
          typical_requirements: { type: 'array', items: { type: 'string' } },
          documents_needed: { type: 'array', items: { type: 'string' } },
          inspections_required: { type: 'array', items: { type: 'string' } },
          typical_timeline: { type: 'string' },
          noc_threshold: { type: 'number' },
        },
        required: ['name', 'category', 'map_zone', 'description', 'typical_requirements', 'documents_needed', 'inspections_required', 'typical_timeline', 'noc_threshold'],
      },
    });

    // Normalize arrays
    const normalizeArray = (val) => {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') return val.split('\n').filter(Boolean);
      return [];
    };

    // InvokeLLM may wrap the result under a 'response' key
    const raw = typeof result === 'object' ? result : {};
    const data = raw.response && typeof raw.response === 'object' ? raw.response : raw;
    data.typical_requirements = normalizeArray(data.typical_requirements);
    data.documents_needed = normalizeArray(data.documents_needed);
    data.inspections_required = normalizeArray(data.inspections_required);
    data.noc_threshold = Number(data.noc_threshold) || 2500;
    data.typical_timeline = data.typical_timeline || '3-5 business days';
    data.category = data.category || 'building';
    data.map_zone = data.map_zone || 'structure';

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});