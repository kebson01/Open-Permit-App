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
    let rounds = 0;

    while (true) {
      rounds++;
      // Fetch a batch of records
      const batch = await base44.asServiceRole.entities.Property.list(null, 200);
      if (!batch || batch.length === 0) break;

      // Delete each record individually in small groups
      for (const record of batch) {
        await base44.asServiceRole.entities.Property.delete(record.id);
        totalDeleted++;
      }

      console.log(`Round ${rounds}: deleted ${batch.length} records, total: ${totalDeleted}`);
      await sleep(500);

      if (batch.length < 200) break;
    }

    return Response.json({ success: true, deleted: totalDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});