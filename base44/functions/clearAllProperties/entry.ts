import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch a small batch of IDs
    const batch = await base44.asServiceRole.entities.Property.list(null, 5);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    let deleted = 0;
    for (const record of batch) {
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          await base44.asServiceRole.entities.Property.delete(record.id);
          deleted++;
          break;
        } catch (e) {
          const msg = e.message || '';
          // Already gone — count as success
          if (msg.includes('not found') || msg.includes('404')) {
            deleted++;
            break;
          }
          // Transient error (timeout, rate limit) — wait longer each attempt
          if (msg.includes('timeout') || msg.includes('timed out') ||
              msg.includes('NetworkTimeout') || msg.includes('429') ||
              msg.includes('Rate limit')) {
            const wait = 3000 * (attempt + 1); // 3s, 6s, 9s ... up to 24s
            await sleep(wait);
            continue;
          }
          // Unknown error — stop retrying this record
          break;
        }
      }
      // Pause between each delete to avoid overwhelming the DB
      await sleep(500);
    }

    return Response.json({
      success: true,
      deleted,
      done: batch.length < 5,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});