import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateChatEntities1739200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // conversations table
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_type_enum" AS ENUM ('DIRECT', 'GROUP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'conversation_type_enum',
            enum: ['DIRECT', 'GROUP'],
            default: `'DIRECT'`,
          },
          {
            name: 'createdById',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // messages table
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "message_type_enum" AS ENUM ('TEXT', 'IMAGE', 'FILE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'senderId',
            type: 'uuid',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'message_type',
            type: 'enum',
            enumName: 'message_type_enum',
            enum: ['TEXT', 'IMAGE', 'FILE'],
            default: `'TEXT'`,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_edited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('messages', [
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // conversation_participants table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'joined_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'last_read_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'is_muted',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('conversation_participants', [
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createUniqueConstraint(
      'conversation_participants',
      new TableUnique({
        name: 'UQ_conversation_participant',
        columnNames: ['conversationId', 'userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints first
    const convPartTable = await queryRunner.getTable('conversation_participants');
    if (convPartTable) {
      const foreignKeys = convPartTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('conversation_participants', fk);
      }
      const uniques = convPartTable.uniques;
      for (const uq of uniques) {
        await queryRunner.dropUniqueConstraint('conversation_participants', uq);
      }
      await queryRunner.dropTable('conversation_participants');
    }

    const messagesTable = await queryRunner.getTable('messages');
    if (messagesTable) {
      for (const fk of messagesTable.foreignKeys) {
        await queryRunner.dropForeignKey('messages', fk);
      }
      await queryRunner.dropTable('messages');
    }

    const conversationsTable = await queryRunner.getTable('conversations');
    if (conversationsTable) {
      for (const fk of conversationsTable.foreignKeys) {
        await queryRunner.dropForeignKey('conversations', fk);
      }
      await queryRunner.dropTable('conversations');
    }

    await queryRunner.query(`DROP TYPE IF EXISTS "message_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_type_enum";`);
  }
}

