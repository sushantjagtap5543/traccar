import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1773501625230 implements MigrationInterface {
    name = 'InitialMigration1773501625230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "name" character varying NOT NULL, "imei" character varying NOT NULL, "traccarDeviceId" integer, "userId" uuid, "model" character varying NOT NULL DEFAULT 'unknown', "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d0a4b8b9b38b6600a92e2edb355" UNIQUE ("imei"), CONSTRAINT "UQ_b73a5cbb4f859c202ef18b5bba2" UNIQUE ("traccarDeviceId"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b48860677afe62cd96e12659482" UNIQUE ("email"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid, "name" character varying, "email" character varying, "mobile" character varying NOT NULL, "company" character varying, "address" text, "password" character varying, "isOtpVerified" boolean NOT NULL DEFAULT false, "otpCode" character varying, "otpExpiresAt" TIMESTAMP, "role" character varying NOT NULL DEFAULT 'CLIENT', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_d376a9f93bba651f32a2c03a7d3" UNIQUE ("mobile"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "imei" character varying NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f15294ea3d6c42fa3c50056819d" UNIQUE ("imei"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL, "orderId" character varying NOT NULL, "paymentId" character varying, "status" character varying NOT NULL DEFAULT 'pending', "attributes" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_af929a5f2a400fdb6913b4967e1" UNIQUE ("orderId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "approved_devices" ("imei" character varying NOT NULL, "model" character varying, "batch" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c03f61801effee04efcfe405ecf" PRIMARY KEY ("imei"))`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_da8be4f620e3fd1c04068576578" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6c3a73bbc9d8a8082816adc870e" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6c3a73bbc9d8a8082816adc870e"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_da8be4f620e3fd1c04068576578"`);
        await queryRunner.query(`DROP TABLE "approved_devices"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "devices"`);
    }

}
