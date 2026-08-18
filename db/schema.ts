import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Aggregated CDN health reports. Each row is one playback outcome reported
// by a client. The /api/cdn-health function aggregates these into
// success-rate stats that reorder the client fallback chain.
export const cdnHealthEvents = pgTable(
  "cdn_health_events",
  {
    id: serial().primaryKey(),
    cdnId: text("cdn_id").notNull(),
    cdnName: text("cdn_name").notNull(),
    outcome: text("outcome").notNull(), // 'success' | 'fail'
    reportedAt: timestamp("reported_at").defaultNow(),
  },
  (table) => ({
    cdnIdx: index("cdn_health_events_cdn_idx").on(table.cdnId),
    reportedIdx: index("cdn_health_events_reported_idx").on(table.reportedAt),
  })
);
