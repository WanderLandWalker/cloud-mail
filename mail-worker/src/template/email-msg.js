import emailUtils from '../utils/email-utils';

function getToEmail(email) {
	if (email.toEmail) {
		return email.toEmail;
	}

	if (!email.recipient) {
		return '';
	}

	try {
		const recipients = typeof email.recipient === 'string'
			? JSON.parse(email.recipient)
			: email.recipient;

		if (Array.isArray(recipients)) {
			return recipients
				.map(item => {
					if (typeof item === 'string') return item;
					return item.address || item.email || '';
				})
				.filter(Boolean)
				.join(', ');
		}
	} catch {
		return '';
	}

	return '';
}

export default function emailMsgTemplate(
	email,
	tgMsgTo,
	tgMsgFrom,
	tgMsgText
) {
	let template = `${email.subject || ''}`;
	const toEmail = getToEmail(email);

	if (tgMsgFrom === 'only-name') {
		template += ` From：${email.name || ''}`;
	}

	if (tgMsgFrom === 'show') {
		template += ` From：${email.name || ''} <${email.sendEmail || ''}>`;
	}

	if (tgMsgTo === 'show') {
		template += ` To：${toEmail}`;
	}

	const text = (
		emailUtils.formatText(email.text) ||
		emailUtils.htmlToText(email.content) ||
		''
	).replace(/</g, '&lt;');

	if (tgMsgText === 'show') {
		template += ` ${text}`;
	}

	return template;
}
