import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMissingTables1773510000000 implements MigrationInterface {
    name = 'SyncMissingTables1773510000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("user_id" uuid NOT NULL, "device_id" uuid NOT NULL, CONSTRAINT "PK_permission" PRIMARY KEY ("user_id", "device_id"))`);
        await queryRunner.query(`CREATE TABLE "positions" ("id" bigserial NOT NULL, "protocol" character varying(128), "deviceid" uuid NOT NULL, "servertime" TIMESTAMP DEFAULT now(), "devicetime" TIMESTAMP, "fixtime" TIMESTAMP NOT NULL, "latitude" double precision, "longitude" double precision, "altitude" double precision, "speed" double precision, "course" double precision, "accuracy" double precision, "attributes" jsonb, CONSTRAINT "PK_positions" PRIMARY KEY ("id", "fixtime"))`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_permission_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_permission_device" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "positions" ADD CONSTRAINT "FK_positions_device" FOREIGN KEY ("deviceid") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "positions" DROP CONSTRAINT "FK_positions_device"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_permission_device"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_permission_user"`);
        await queryRunner.query(`DROP TABLE "positions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
