import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const telegramBot = sqliteTable('telegram_bot', {
	botId: integer('bot_id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().default(''),
	token: text('token').notNull().default(''),
	chatIds: text('chat_ids').notNull().default(''),
	status: integer('status').notNull().default(1),
	customDomain: text('custom_domain').notNull().default(''),
	msgFrom: text('msg_from').notNull().default('only-name'),
	msgTo: text('msg_to').notNull().default('show'),
	msgText: text('msg_text').notNull().default('hide'),
	routeType: text('route_type').notNull().default('receive'),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`),
});

export default telegramBot;
