import { MigrationInterface, QueryRunner } from "typeorm";

export class EnterpriseFeatures1773550000000 implements MigrationInterface {
    name = 'EnterpriseFeatures1773550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Audit Logs
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "user_id" integer, "action" character varying NOT NULL, "resource_id" character varying, "details" text, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"))`);
        
        // Billing Plans (New table for dynamic pricing)
        await queryRunner.query(`CREATE TABLE "billing_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying, "amount" decimal NOT NULL, "currency" character varying DEFAULT 'INR', "validityMonths" integer DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_billing_plans_name" UNIQUE ("name"), CONSTRAINT "PK_billing_plans" PRIMARY KEY ("id"))`);

        // Hardware Whitelist (Prefix based)
        await queryRunner.query(`CREATE TABLE "hardware_whitelist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "imeiPrefix" character varying NOT NULL, "vendor" character varying, "active" boolean DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_hardware_whitelist_prefix" UNIQUE ("imeiPrefix"), CONSTRAINT "PK_hardware_whitelist" PRIMARY KEY ("id"))`);

        // Tactical Expenses
        await queryRunner.query(`CREATE TABLE "tactical_expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "deviceId" character varying NOT NULL, "amount" decimal(10,2) NOT NULL, "category" character varying NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tactical_expenses" PRIMARY KEY ("id"))`);

        // Tactical Documents
        await queryRunner.query(`CREATE TABLE "tactical_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "deviceId" character varying NOT NULL, "title" character varying NOT NULL, "type" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "fileUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tactical_documents" PRIMARY KEY ("id"))`);

        // Route Geofences
        await queryRunner.query(`CREATE TABLE "route_geofences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "deviceId" character varying NOT NULL, "name" character varying NOT NULL, "polyline" text NOT NULL, "buffer" integer DEFAULT 100, "active" boolean DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_route_geofences" PRIMARY KEY ("id"))`);

        // Share Tokens
        await queryRunner.query(`CREATE TABLE "share_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deviceId" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "active" boolean DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_share_tokens" UNIQUE ("token"), CONSTRAINT "PK_share_tokens" PRIMARY KEY ("id"))`);

        // System Settings
        await queryRunner.query(`CREATE TABLE "system_settings" ("key" character varying NOT NULL, "value" text, "description" text, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_system_settings" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(`DROP TABLE "share_tokens"`);
        await queryRunner.query(`DROP TABLE "route_geofences"`);
        await queryRunner.query(`DROP TABLE "tactical_documents"`);
        await queryRunner.query(`DROP TABLE "tactical_expenses"`);
        await queryRunner.query(`DROP TABLE "hardware_whitelist"`);
        await queryRunner.query(`DROP TABLE "billing_plans"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }
}
