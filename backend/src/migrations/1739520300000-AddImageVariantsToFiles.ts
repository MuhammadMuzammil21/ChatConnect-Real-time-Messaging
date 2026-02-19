import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
} from 'typeorm';

export class AddImageVariantsToFiles1739520300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('files');

        if (table) {
            // Add image variant columns
            const columnsToAdd = [
                new TableColumn({
                    name: 'thumbnailUrl',
                    type: 'varchar',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'mediumUrl',
                    type: 'varchar',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'fullUrl',
                    type: 'varchar',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'imageWidth',
                    type: 'int',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'imageHeight',
                    type: 'int',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'videoDuration',
                    type: 'int',
                    isNullable: true,
                }),
                new TableColumn({
                    name: 'videoThumbnailUrl',
                    type: 'varchar',
                    isNullable: true,
                }),
            ];

            for (const column of columnsToAdd) {
                const columnExists = table.columns.some((c) => c.name === column.name);
                if (!columnExists) {
                    await queryRunner.addColumn('files', column);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('files');

        if (table) {
            const columnsToRemove = [
                'thumbnailUrl',
                'mediumUrl',
                'fullUrl',
                'imageWidth',
                'imageHeight',
                'videoDuration',
                'videoThumbnailUrl',
            ];

            for (const columnName of columnsToRemove) {
                const column = table.columns.find((c) => c.name === columnName);
                if (column) {
                    await queryRunner.dropColumn('files', columnName);
                }
            }
        }
    }
}
