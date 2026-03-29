import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Fetch one small batch
    const batch = await base44.asServiceRole.entities.Property.list(null, 20);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    // Delete one at a time with small delay to avoid rate limits
    for (const record of batch) {
      await base44.asServiceRole.entities.Property.delete(record.id);
      await sleep(200);
    }

    return Response.json({
      success: true,
      deleted: batch.length,
      done: batch.length < 20,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});