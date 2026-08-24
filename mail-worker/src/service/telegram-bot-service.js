import BizError from '../error/biz-error';
import orm from '../entity/orm';
import account from '../entity/account';
import user from '../entity/user';
import telegramBot from '../entity/telegram-bot';
import telegramBotAccount from '../entity/telegram-bot-account';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { settingConst } from '../const/entity-const';
import { t } from '../i18n/i18n';
import settingService from './setting-service';
import telegramService from './telegram-service';

const maskToken = token => token ? `${token.slice(0, 20)}******` : '';

const normalizeChatIds = value => {
	const values = Array.isArray(value) ? value : String(value || '').split(',');
	return [...new Set(values
		.flatMap(item => String(item).split(/[,，]/))
		.map(item => item.trim())
		.filter(item => item && !Number.isNaN(Number(item))))];
};

const isMissingBotTable = error => error?.message?.includes('no such table: telegram_bot');

const telegramBotService = {

	async list(c) {
		const [botRows, accountRows] = await Promise.all([
			orm(c).select().from(telegramBot).orderBy(asc(telegramBot.botId)).all(),
			orm(c).select().from(telegramBotAccount).all()
		]);

		const accountMap = new Map();
		accountRows.forEach(row => {
			if (!accountMap.has(row.botId)) accountMap.set(row.botId, []);
			accountMap.get(row.botId).push(row.accountId);
		});

		return botRows.map(row => ({
			botId: row.botId,
			name: row.name,
			token: maskToken(row.token),
			chatIds: normalizeChatIds(row.chatIds),
			status: row.status,
			customDomain: row.customDomain,
			msgFrom: row.msgFrom,
			msgTo: row.msgTo,
			msgText: row.msgText,
			accountIds: accountMap.get(row.botId) || [],
		}));
	},

	async accountList(c) {
		return orm(c).select({
			accountId: account.accountId,
			email: account.email,
			userId: account.userId,
			userEmail: user.email,
			isDel: account.isDel,
		}).from(account)
			.innerJoin(user, eq(user.userId, account.userId))
			.orderBy(asc(account.email))
			.all();
	},

	async save(c, params) {
		const botId = Number(params.botId) || 0;
		const existing = botId ? await orm(c).select().from(telegramBot).where(eq(telegramBot.botId, botId)).get() : null;
		if (botId && !existing) throw new BizError(t('telegramBotNotExist'));

		let token = String(params.token || '').trim();
		if (!token || token.includes('******')) token = existing?.token || '';
		if (!token) throw new BizError(t('telegramBotTokenRequired'));

		const chatIds = normalizeChatIds(params.chatIds);
		if (chatIds.length === 0) throw new BizError(t('telegramChatIdRequired'));

		const accountIds = [...new Set((Array.isArray(params.accountIds) ? params.accountIds : [])
			.map(Number)
			.filter(Number.isInteger)
			.filter(accountId => accountId > 0))];
		const validAccounts = accountIds.length === 0 ? [] : await orm(c)
			.select({ accountId: account.accountId })
			.from(account)
			.where(inArray(account.accountId, accountIds));
		const validAccountIds = validAccounts.map(row => row.accountId);

		const data = {
			name: String(params.name || '').trim() || token.slice(0, 12),
			token,
			chatIds: chatIds.join(','),
			status: Number(params.status) === settingConst.tgBotStatus.OPEN ? settingConst.tgBotStatus.OPEN : settingConst.tgBotStatus.CLOSE,
			customDomain: String(params.customDomain || '').trim(),
			msgFrom: params.msgFrom || 'only-name',
			msgTo: params.msgTo || 'show',
			msgText: params.msgText || 'hide',
		};

		let savedBotId = botId;
		if (existing) {
			await orm(c).update(telegramBot).set(data).where(eq(telegramBot.botId, botId)).run();
		} else {
			const row = await orm(c).insert(telegramBot).values(data).returning().get();
			savedBotId = row.botId;
		}

		const statements = [
			c.env.db.prepare('DELETE FROM telegram_bot_account WHERE bot_id = ?').bind(savedBotId),
			...validAccountIds.map(accountId => c.env.db.prepare(
				'INSERT INTO telegram_bot_account (bot_id, account_id) VALUES (?, ?)'
			).bind(savedBotId, accountId))
		];
		await c.env.db.batch(statements);

		return { botId: savedBotId };
	},

	async delete(c, params) {
		const botId = Number(params.botId);
		if (!botId) throw new BizError(t('telegramBotNotExist'));
		await c.env.db.batch([
			c.env.db.prepare('DELETE FROM telegram_bot_account WHERE bot_id = ?').bind(botId),
			c.env.db.prepare('DELETE FROM telegram_bot WHERE bot_id = ?').bind(botId),
		]);
	},

	async listByAccountId(c, accountId) {
		try {
			return await orm(c).select({
				botId: telegramBot.botId,
				token: telegramBot.token,
				chatIds: telegramBot.chatIds,
				status: telegramBot.status,
				customDomain: telegramBot.customDomain,
				msgFrom: telegramBot.msgFrom,
				msgTo: telegramBot.msgTo,
				msgText: telegramBot.msgText,
			}).from(telegramBot)
				.innerJoin(telegramBotAccount, eq(telegramBotAccount.botId, telegramBot.botId))
				.where(and(
					eq(telegramBotAccount.accountId, Number(accountId)),
					eq(telegramBot.status, settingConst.tgBotStatus.OPEN)
				))
				.all();
		} catch (error) {
			if (!isMissingBotTable(error)) throw error;
			return this.legacyConfig(c);
		}
	},

	async legacyConfig(c) {
		const setting = await settingService.query(c);
		if (setting.tgBotStatus !== settingConst.tgBotStatus.OPEN || !setting.tgBotToken || !setting.tgChatId) return [];
		return [{
			botId: 0,
			token: setting.tgBotToken,
			chatIds: setting.tgChatId,
			status: setting.tgBotStatus,
			customDomain: setting.customDomain,
			msgFrom: setting.tgMsgFrom,
			msgTo: setting.tgMsgTo,
			msgText: setting.tgMsgText,
		}];
	},

	async sendForAccount(c, email) {
		if (!email?.accountId) return;
		const bots = await this.listByAccountId(c, email.accountId);
		await Promise.all(bots.map(bot => telegramService.sendEmailToBot(c, email, bot)));
	},
};

export default telegramBotService;
