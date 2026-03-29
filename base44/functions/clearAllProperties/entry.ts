import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch a batch of 500 records
    const batch = await base44.asServiceRole.entities.Property.list(null, 500);
    if (!batch || batch.length === 0) {
      return Response.json({ success: true, deleted: 0, done: true });
    }

    // Delete all in parallel (concurrent requests = much faster)
    await Promise.all(batch.map(record =>
      base44.asServiceRole.entities.Property.delete(record.id)
    ));

    return Response.json({
      success: true,
      deleted: batch.length,
      done: batch.length < 500,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});