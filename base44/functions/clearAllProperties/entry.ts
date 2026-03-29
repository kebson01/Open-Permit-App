import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function deleteWithRetry(base44, id) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await base44.asServiceRole.entities.Property.delete(id);
      return true;
    } catch (e) {
      if (e.message?.includes('not found') || e.message?.includes('404')) return false; // already gone
      if (e.message?.includes('Rate limit') || e.message?.includes('429')) {
        await sleep(500 * (attempt + 1)); // back off and retry
        continue;
      }
      throw e;
    }
  }
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const batch = await base44.asServiceRole.entities.Property.list(null, 50);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    let deleted = 0;
    for (const record of batch) {
      const ok = await deleteWithRetry(base44, record.id);
      if (ok) deleted++;
      await sleep(150); // steady pace to avoid rate limits
    }

    return Response.json({
      success: true,
      deleted,
      done: batch.length < 50,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});