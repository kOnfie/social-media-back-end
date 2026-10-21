import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFollowerIndex1792490971350 implements MigrationInterface {
  name = 'AddFollowerIndex1792490971350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_fdb91868b03a2040db408a5333" ON "follows"  ("followerId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fdb91868b03a2040db408a5333"`,
    );
  }
}
