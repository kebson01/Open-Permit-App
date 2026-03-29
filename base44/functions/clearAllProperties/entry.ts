import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Delete in chunks of CONCURRENCY at a time to avoid rate limits
async function deleteChunked(base44, records, concurrency = 20) {
  for (let i = 0; i < records.length; i += concurrency) {
    const chunk = records.slice(i, i + concurrency);
    await Promise.all(chunk.map(r => base44.asServiceRole.entities.Property.delete(r.id)));
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch 200 records per call
    const batch = await base44.asServiceRole.entities.Property.list(null, 200);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    // Delete in parallel chunks of 20
    await deleteChunked(base44, batch, 20);

    return Response.json({
      success: true,
      deleted: batch.length,
      done: batch.length < 200,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});