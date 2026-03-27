import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774598538877 implements MigrationInterface {
    name = 'InitialSchema1774598538877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event" ("id" varchar PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "source" varchar NOT NULL, "type" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "payload" text NOT NULL, "traceId" varchar NOT NULL, "errorMessage" varchar, "processedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "timestamp" varchar NOT NULL, "retryCount" integer NOT NULL DEFAULT (0), CONSTRAINT "UQ_4ee8fd974a5681971c4eb5bb585" UNIQUE ("eventId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "event"`);
    }

}
