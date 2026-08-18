CREATE TABLE "cdn_health_events" (
	"id" serial PRIMARY KEY,
	"cdn_id" text NOT NULL,
	"cdn_name" text NOT NULL,
	"outcome" text NOT NULL,
	"reported_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "cdn_health_events_cdn_idx" ON "cdn_health_events" ("cdn_id");--> statement-breakpoint
CREATE INDEX "cdn_health_events_reported_idx" ON "cdn_health_events" ("reported_at");