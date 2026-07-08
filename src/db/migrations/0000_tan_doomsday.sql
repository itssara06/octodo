CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Viewer' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
