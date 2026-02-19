import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateFileDownload1739520200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'file_downloads',
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
                        name: 'userId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'ipAddress',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'downloaded_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Foreign keys
        await queryRunner.createForeignKey(
            'file_downloads',
            new TableForeignKey({
                columnNames: ['fileId'],
                referencedTableName: 'files',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'file_downloads',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Indexes
        await queryRunner.createIndex(
            'file_downloads',
            new TableIndex({
                name: 'IDX_file_downloads_fileId_downloadedAt',
                columnNames: ['fileId', 'downloaded_at'],
            }),
        );

        await queryRunner.createIndex(
            'file_downloads',
            new TableIndex({
                name: 'IDX_file_downloads_userId_downloadedAt',
                columnNames: ['userId', 'downloaded_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('file_downloads');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('file_downloads', fk);
            }
            await queryRunner.dropTable('file_downloads');
        }
    }
}
