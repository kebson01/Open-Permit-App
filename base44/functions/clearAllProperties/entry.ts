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
      const batch = await base44.asServiceRole.entities.Property.list(null, 50);
      if (!batch || batch.length === 0) break;

      // Delete one at a time with a pause to avoid rate limits
      for (const record of batch) {
        await base44.asServiceRole.entities.Property.delete(record.id);
        totalDeleted++;
        await sleep(300); // 300ms between each delete
      }

      console.log(`Round ${rounds}: deleted ${batch.length} records, total: ${totalDeleted}`);

      if (batch.length < 50) break;

      // Extra pause between batches
      await sleep(2000);
    }

    return Response.json({ success: true, deleted: totalDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});