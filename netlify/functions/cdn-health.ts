import type { Config } from "@netlify/functions";
import { desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cdnHealthEvents } from "../../db/schema.js";

// GET  /api/cdn-health  -> aggregated success-rate stats per CDN (last 7 days)
// POST /api/cdn-health  -> record a single playback outcome { cdn_id, cdn_name, outcome }

export default async (req: Request) => {
  if (req.method === "GET") {
    const rows = await db
      .select({
        name: cdnHealthEvents.cdnName,
        success_count:
          sql<number>`count(*) filter (where ${cdnHealthEvents.outcome} = 'success')`.as(
            "success_count"
          ),
        fail_count:
          sql<number>`count(*) filter (where ${cdnHealthEvents.outcome} = 'fail')`.as(
            "fail_count"
          ),
      })
      .from(cdnHealthEvents)
      .where(
        sql`${cdnHealthEvents.reportedAt} > now() - interval '7 days'`
      )
      .groupBy(cdnHealthEvents.cdnName)
      .orderBy(desc(sql`success_count`));

    const stats = rows.map((r) => {
      const success = Number(r.success_count);
      const fail = Number(r.fail_count);
      const total = success + fail;
      return {
        name: r.name,
        success_count: success,
        fail_count: fail,
        success_rate: total > 0 ? Math.round((success / total) * 100) / 100 : 1,
      };
    });

    return Response.json(
      { stats },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  if (req.method === "POST") {
    try {
      const body = (await req.json()) as {
        cdn_id?: string;
        cdn_name?: string;
        outcome?: string;
      };
      if (
        !body.cdn_id ||
        !body.cdn_name ||
        (body.outcome !== "success" && body.outcome !== "fail")
      ) {
        return Response.json({ error: "Invalid payload" }, { status: 400 });
      }
      await db.insert(cdnHealthEvents).values({
        cdnId: String(body.cdn_id).slice(0, 64),
        cdnName: String(body.cdn_name).slice(0, 64),
        outcome: body.outcome,
      });
      return Response.json({ ok: true }, { status: 201 });
    } catch {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/cdn-health",
};
