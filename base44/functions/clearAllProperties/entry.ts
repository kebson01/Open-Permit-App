import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Fetch a small batch
    const batch = await base44.asServiceRole.entities.Property.list(null, 25);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    // Delete sequentially, ignoring 404s (already deleted by another worker)
    let deleted = 0;
    for (const record of batch) {
      try {
        await base44.asServiceRole.entities.Property.delete(record.id);
        deleted++;
      } catch (e) {
        if (!e.message?.includes('not found') && !e.message?.includes('404')) throw e;
        // Already deleted by another parallel worker — skip
      }
      await sleep(100);
    }

    return Response.json({
      success: true,
      deleted,
      done: batch.length < 25,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});