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

      // Delete in groups of 5 with pauses to avoid rate limits
      for (let i = 0; i < batch.length; i += 5) {
        const group = batch.slice(i, i + 5);
        await Promise.all(group.map(r => base44.asServiceRole.entities.Property.delete(r.id)));
        totalDeleted += group.length;
        await sleep(1000);
      }

      console.log(`Round ${rounds}: deleted ${batch.length} records, total: ${totalDeleted}`);

      if (batch.length < 50) break;
    }

    return Response.json({ success: true, deleted: totalDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});