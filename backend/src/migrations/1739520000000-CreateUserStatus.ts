import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateUserStatus1739520000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_status_enum type
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('ONLINE', 'OFFLINE', 'AWAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        // Create user_status table
        await queryRunner.createTable(
            new Table({
                name: 'user_status',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isUnique: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enumName: 'user_status_enum',
                        enum: ['ONLINE', 'OFFLINE', 'AWAY'],
                        default: `'OFFLINE'`,
                    },
                    {
                        name: 'last_seen',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create foreign key to users table
        await queryRunner.createForeignKey(
            'user_status',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Create index on status for performance (user_id already has unique constraint from column definition)
        await queryRunner.createIndex(
            'user_status',
            new TableIndex({
                name: 'IDX_user_status_status',
                columnNames: ['status'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.dropIndex('user_status', 'IDX_user_status_status');

        // Drop foreign key
        const table = await queryRunner.getTable('user_status');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('user_status', fk);
            }
        }

        // Drop table
        await queryRunner.dropTable('user_status');

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum";`);
    }
}
