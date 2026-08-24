import app from '../hono/hono';
import telegramService from '../service/telegram-service';
import telegramBotService from '../service/telegram-bot-service';
import result from '../model/result';

app.get('/telegram/getEmail/:token', async (c) => {
	const content = await telegramService.getEmailContent(c, c.req.param());
	c.header('Cache-Control', 'public, max-age=604800, immutable');
	return c.html(content)
});

app.get('/telegram/bot/list', async (c) => {
	return c.json(result.ok(await telegramBotService.list(c)));
});

app.get('/telegram/bot/accounts', async (c) => {
	return c.json(result.ok(await telegramBotService.accountList(c)));
});

app.post('/telegram/bot/save', async (c) => {
	return c.json(result.ok(await telegramBotService.save(c, await c.req.json())));
});

app.delete('/telegram/bot/delete', async (c) => {
	await telegramBotService.delete(c, c.req.query());
	return c.json(result.ok());
});

