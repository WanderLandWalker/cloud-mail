import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

export const telegramBotAccount = sqliteTable('telegram_bot_account', {
	botId: integer('bot_id').notNull(),
	accountId: integer('account_id').notNull(),
}, table => ({
	pk: primaryKey({ columns: [table.botId, table.accountId] }),
}));

export default telegramBotAccount;
