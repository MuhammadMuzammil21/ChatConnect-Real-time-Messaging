import {
    MigrationInterface,
    QueryRunner,
    TableIndex,
} from 'typeorm';

export class AddFileIndexes1739520500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('files');

        if (table) {
            // Index for uploadedById queries
            const uploadedByIdIndexExists = table.indices.some(
                (idx) => idx.name === 'IDX_files_uploadedById_createdAt',
            );
            if (!uploadedByIdIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_uploadedById_createdAt',
                        columnNames: ['uploadedById', 'createdAt'],
                    }),
                );
            }

            // Index for conversationId queries
            const conversationIdIndexExists = table.indices.some(
                (idx) => idx.name === 'IDX_files_conversationId_createdAt',
            );
            if (!conversationIdIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_conversationId_createdAt',
                        columnNames: ['conversationId', 'createdAt'],
                    }),
                );
            }

            // Index for messageId queries
            const messageIdIndexExists = table.indices.some(
                (idx) => idx.name === 'IDX_files_messageId',
            );
            if (!messageIdIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_messageId',
                        columnNames: ['messageId'],
                    }),
                );
            }

            // Index for mimeType filtering
            const mimeTypeIndexExists = table.indices.some(
                (idx) => idx.name === 'IDX_files_mimeType',
            );
            if (!mimeTypeIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_mimeType',
                        columnNames: ['mimeType'],
                    }),
                );
            }

            // Composite index for deleted files cleanup
            const deletedAtIndexExists = table.indices.some(
                (idx) => idx.name === 'IDX_files_deletedAt',
            );
            if (!deletedAtIndexExists) {
                await queryRunner.createIndex(
                    'files',
                    new TableIndex({
                        name: 'IDX_files_deletedAt',
                        columnNames: ['deletedAt'],
                    }),
                );
            }
        }

        // Indexes for messages table
        const messagesTable = await queryRunner.getTable('messages');
        if (messagesTable) {
            // Index for conversation messages with attachments
            const conversationCreatedAtIndexExists = messagesTable.indices.some(
                (idx) => idx.name === 'IDX_messages_conversationId_createdAt',
            );
            if (!conversationCreatedAtIndexExists) {
                await queryRunner.createIndex(
                    'messages',
                    new TableIndex({
                        name: 'IDX_messages_conversationId_createdAt',
                        columnNames: ['conversationId', 'createdAt'],
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('files');
        if (table) {
            const indexesToRemove = [
                'IDX_files_uploadedById_createdAt',
                'IDX_files_conversationId_createdAt',
                'IDX_files_messageId',
                'IDX_files_mimeType',
                'IDX_files_deletedAt',
            ];

            for (const indexName of indexesToRemove) {
                const index = table.indices.find((idx) => idx.name === indexName);
                if (index) {
                    await queryRunner.dropIndex('files', index);
                }
            }
        }

        const messagesTable = await queryRunner.getTable('messages');
        if (messagesTable) {
            const index = messagesTable.indices.find(
                (idx) => idx.name === 'IDX_messages_conversationId_createdAt',
            );
            if (index) {
                await queryRunner.dropIndex('messages', index);
            }
        }
    }
}
