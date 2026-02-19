import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
    TableColumn,
} from 'typeorm';

export class CreateFilesTable1739520150000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable('files');

        if (!tableExists) {
            // Create files table
            await queryRunner.createTable(
                new Table({
                    name: 'files',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'filename',
                            type: 'varchar',
                        },
                        {
                            name: 'storedFilename',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'fileUrl',
                            type: 'varchar',
                        },
                        {
                            name: 'mimeType',
                            type: 'varchar',
                        },
                        {
                            name: 'fileSize',
                            type: 'bigint',
                        },
                        {
                            name: 'uploadedById',
                            type: 'uuid',
                        },
                        {
                            name: 'conversationId',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'messageId',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'createdAt',
                            type: 'timestamptz',
                            default: 'now()',
                        },
                        {
                            name: 'updatedAt',
                            type: 'timestamptz',
                            default: 'now()',
                        },
                        {
                            name: 'deletedAt',
                            type: 'timestamptz',
                            isNullable: true,
                        },
                    ],
                }),
                true,
            );

            // Foreign keys
            await queryRunner.createForeignKey(
                'files',
                new TableForeignKey({
                    columnNames: ['uploadedById'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            await queryRunner.createForeignKey(
                'files',
                new TableForeignKey({
                    columnNames: ['conversationId'],
                    referencedTableName: 'conversations',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            await queryRunner.createForeignKey(
                'files',
                new TableForeignKey({
                    columnNames: ['messageId'],
                    referencedTableName: 'messages',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            // Indexes
            await queryRunner.createIndex(
                'files',
                new TableIndex({
                    name: 'IDX_files_conversationId',
                    columnNames: ['conversationId'],
                }),
            );

            await queryRunner.createIndex(
                'files',
                new TableIndex({
                    name: 'IDX_files_messageId',
                    columnNames: ['messageId'],
                }),
            );

            await queryRunner.createIndex(
                'files',
                new TableIndex({
                    name: 'IDX_files_uploadedById',
                    columnNames: ['uploadedById'],
                }),
            );
        } else {
            // Table exists, check if messageId column exists
            const table = await queryRunner.getTable('files');
            const hasMessageId = table?.columns.some((c) => c.name === 'messageId');

            if (!hasMessageId) {
                // Add messageId column
                await queryRunner.addColumn(
                    'files',
                    new TableColumn({
                        name: 'messageId',
                        type: 'uuid',
                        isNullable: true,
                    }),
                );

                // Add foreign key
                await queryRunner.createForeignKey(
                    'files',
                    new TableForeignKey({
                        columnNames: ['messageId'],
                        referencedTableName: 'messages',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    }),
                );

                // Add index
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_messageId',
                        columnNames: ['messageId'],
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('files');
        if (table) {
            // Drop messageId foreign key and index if they exist
            const messageIdFk = table.foreignKeys.find(
                (fk) => fk.columnNames.includes('messageId'),
            );
            if (messageIdFk) {
                await queryRunner.dropForeignKey('files', messageIdFk);
            }

            const messageIdIndex = table.indices.find(
                (idx) => idx.name === 'IDX_files_messageId',
            );
            if (messageIdIndex) {
                await queryRunner.dropIndex('files', messageIdIndex);
            }

            // Drop messageId column if it exists
            const messageIdColumn = table.columns.find((c) => c.name === 'messageId');
            if (messageIdColumn) {
                await queryRunner.dropColumn('files', 'messageId');
            }
        }
    }
}
