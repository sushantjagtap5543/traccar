import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTestDevice1773530000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed the test IMEI into approved_devices
        await queryRunner.query(`
            INSERT INTO "approved_devices" ("imei", "model", "batch")
            VALUES ('869727079043558', 'GeoSure Ultra', 'B1-2024')
            ON CONFLICT ("imei") DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "approved_devices" WHERE "imei" = '869727079043558'`);
    }
}
