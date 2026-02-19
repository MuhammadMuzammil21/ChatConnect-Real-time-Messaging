import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableColumn,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class AddFileSharingAndVersioning1739520400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add columns to files table
        const filesTable = await queryRunner.getTable('files');
        if (filesTable) {
            const columnsToAdd = [
                new TableColumn({
                    name: 'version',
                    type: 'int',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'parentFileId',
                    type: 'uuid',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                }),
            ];

            for (const column of columnsToAdd) {
                const columnExists = filesTable.columns.some((c) => c.name === column.name);
                if (!columnExists) {
                    await queryRunner.addColumn('files', column);
                }
            }

            // Add index for parentFileId
            const parentFileIdIndexExists = filesTable.indices.some(
                (idx) => idx.name === 'IDX_files_parentFileId',
            );
            if (!parentFileIdIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_parentFileId',
                        columnNames: ['parentFileId'],
                    }),
                );
            }
        }

        // Add columns to users table
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            const storageQuotaExists = usersTable.columns.some((c) => c.name === 'storage_quota');
            const storageUsedExists = usersTable.columns.some((c) => c.name === 'storage_used');

            if (!storageQuotaExists) {
                await queryRunner.addColumn(
                    'users',
                    new TableColumn({
                        name: 'storage_quota',
                        type: 'bigint',
                        default: 10737418240, // 10GB
                    }),
                );
            }

            if (!storageUsedExists) {
                await queryRunner.addColumn(
                    'users',
                    new TableColumn({
                        name: 'storage_used',
                        type: 'bigint',
                        default: 0,
                    }),
                );
            }
        }

        // Create file_share_links table
        const shareLinksTableExists = await queryRunner.hasTable('file_share_links');
        if (!shareLinksTableExists) {
            await queryRunner.createTable(
                new Table({
                    name: 'file_share_links',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'fileId',
                            type: 'uuid',
                        },
                        {
                            name: 'createdById',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'token',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'expiresAt',
                            type: 'timestamptz',
                            isNullable: true,
                        },
                        {
                            name: 'accessCount',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'lastAccessedAt',
                            type: 'timestamptz',
                            isNullable: true,
                        },
                        {
                            name: 'isActive',
                            type: 'boolean',
                            default: true,
                        },
                        {
                            name: 'created_at',
                            type: 'timestamptz',
                            default: 'now()',
                        },
                    ],
                }),
                true,
            );

            // Foreign keys
            await queryRunner.createForeignKey(
                'file_share_links',
                new TableForeignKey({
                    columnNames: ['fileId'],
                    referencedTableName: 'files',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            await queryRunner.createForeignKey(
                'file_share_links',
                new TableForeignKey({
                    columnNames: ['createdById'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            );

            // Indexes
            await queryRunner.createIndex(
                'file_share_links',
                new TableIndex({
                    name: 'IDX_file_share_links_token',
                    columnNames: ['token'],
                    isUnique: true,
                }),
            );

            await queryRunner.createIndex(
                'file_share_links',
                new TableIndex({
                    name: 'IDX_file_share_links_fileId_expiresAt',
                    columnNames: ['fileId', 'expiresAt'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop file_share_links table
        const shareLinksTable = await queryRunner.getTable('file_share_links');
        if (shareLinksTable) {
            const foreignKeys = shareLinksTable.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('file_share_links', fk);
            }
            await queryRunner.dropTable('file_share_links');
        }

        // Remove columns from files table
        const filesTable = await queryRunner.getTable('files');
        if (filesTable) {
            const parentFileIdIndex = filesTable.indices.find(
                (idx) => idx.name === 'IDX_files_parentFileId',
            );
            if (parentFileIdIndex) {
                await queryRunner.dropIndex('files', parentFileIdIndex);
            }

            const columnsToRemove = ['version', 'parentFileId', 'description'];
            for (const columnName of columnsToRemove) {
                const column = filesTable.columns.find((c) => c.name === columnName);
                if (column) {
                    await queryRunner.dropColumn('files', columnName);
                }
            }
        }

        // Remove columns from users table
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            const columnsToRemove = ['storage_quota', 'storage_used'];
            for (const columnName of columnsToRemove) {
                const column = usersTable.columns.find((c) => c.name === columnName);
                if (column) {
                    await queryRunner.dropColumn('users', columnName);
                }
            }
        }
    }
}
