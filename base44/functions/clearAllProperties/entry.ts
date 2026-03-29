import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let totalDeleted = 0;

    // Fetch and delete in batches of 50 until 20,000 are gone or no more records
    while (totalDeleted < 20000) {
      const batch = await base44.asServiceRole.entities.Property.list(null, 50);
      if (!batch || batch.length === 0) break;

      for (const record of batch) {
        await base44.asServiceRole.entities.Property.delete(record.id);
        totalDeleted++;
        await sleep(150);
      }

      console.log(`Deleted ${totalDeleted} so far...`);
      if (batch.length < 50) break;
    }

    return Response.json({
      success: true,
      deleted: totalDeleted,
      done: totalDeleted < 20000,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});