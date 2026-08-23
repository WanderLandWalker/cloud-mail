import emailUtils from '../utils/email-utils';

const TELEGRAM_MESSAGE_LIMIT = 3500;
const TRUNCATED_SUFFIX = '...';

function escapeHtml(text = '') {
	return text
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function truncateText(text, maxLength) {
	if (!text || text.length <= maxLength) {
		return text || '';
	}

	if (maxLength <= TRUNCATED_SUFFIX.length) {
		return TRUNCATED_SUFFIX.slice(0, maxLength);
	}

	return text.slice(0, maxLength - TRUNCATED_SUFFIX.length) + TRUNCATED_SUFFIX;
}

export default function emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText) {

	let template = `<b>${email.subject}</b>`
	let template = `<b>${escapeHtml(email.subject || '')}</b>`

if (tgMsgFrom === 'only-name') {
template += `

From\u200B：${email.name}`
From\u200B：${escapeHtml(email.name || '')}`
}

if (tgMsgFrom === 'show') {
template += `

From\u200B：${email.name}  &lt;${email.sendEmail}&gt;`
From\u200B：${escapeHtml(email.name || '')}  &lt;${escapeHtml(email.sendEmail || '')}&gt;`
}

if(tgMsgTo === 'show' && tgMsgFrom === 'hide') {
template += `

To：\u200B${email.toEmail}`
To：\u200B${escapeHtml(email.toEmail || '')}`

} else if(tgMsgTo === 'show') {
template += `
To：\u200B${email.toEmail}`
To：\u200B${escapeHtml(email.toEmail || '')}`
}

	const text = (emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content))
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	const text = escapeHtml(emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content));

if(tgMsgText === 'show') {
		const prefix = `${template}

`;
		const maxTextLength = Math.max(0, TELEGRAM_MESSAGE_LIMIT - prefix.length);
template += `

${text}`
${truncateText(text, maxTextLength)}`
}

return template;
