import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
} from 'typeorm';

export class UpdateMessageEntity1739520100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('messages');
        const hasEditedAt = table?.columns.some((c) => c.name === 'edited_at');
        const hasDeletedAt = table?.columns.some((c) => c.name === 'deleted_at');
        const hasDeletedById = table?.columns.some((c) => c.name === 'deleted_by_id');

        if (!hasEditedAt) {
            await queryRunner.addColumn(
                'messages',
                new TableColumn({
                    name: 'edited_at',
                    type: 'timestamptz',
                    isNullable: true,
                }),
            );
        }

        if (!hasDeletedAt) {
            await queryRunner.addColumn(
                'messages',
                new TableColumn({
                    name: 'deleted_at',
                    type: 'timestamptz',
                    isNullable: true,
                }),
            );
        }

        if (!hasDeletedById) {
            await queryRunner.addColumn(
                'messages',
                new TableColumn({
                    name: 'deleted_by_id',
                    type: 'uuid',
                    isNullable: true,
                }),
            );

            await queryRunner.createForeignKey(
                'messages',
                new TableForeignKey({
                    columnNames: ['deleted_by_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            );
        }

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_messages_deleted_at ON messages (deleted_at);
    `);

        // Create GIN index for full-text search (skip if exists)
        const fulltextExists = await queryRunner.query(`
      SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_messages_content_fulltext'
    `);
        if (!fulltextExists?.length) {
            await queryRunner.query(`
        CREATE INDEX IDX_messages_content_fulltext 
        ON messages 
        USING GIN (to_tsvector('english', content));
      `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop full-text search index
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_messages_content_fulltext;`);

        // Drop deleted_at index
        await queryRunner.dropIndex('messages', 'IDX_messages_deleted_at');

        // Drop foreign key
        const table = await queryRunner.getTable('messages');
        if (table) {
            const foreignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('deleted_by_id') !== -1,
            );
            if (foreignKey) {
                await queryRunner.dropForeignKey('messages', foreignKey);
            }
        }

        // Drop columns
        await queryRunner.dropColumn('messages', 'deleted_by_id');
        await queryRunner.dropColumn('messages', 'deleted_at');
        await queryRunner.dropColumn('messages', 'edited_at');
    }
}
