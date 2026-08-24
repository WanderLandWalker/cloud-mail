import http from '@/axios/index.js';

export function settingSet(setting) {
    return http.put('/setting/set', setting)
}

export function settingQuery() {
    return http.get('/setting/query')
}

export function telegramBotList() {
    return http.get('/telegram/bot/list')
}

export function telegramBotAccounts() {
    return http.get('/telegram/bot/accounts')
}

export function telegramBotSave(params) {
    return http.post('/telegram/bot/save', params)
}

export function telegramBotDelete(botId) {
    return http.delete('/telegram/bot/delete', {params: {botId}})
}

export function websiteConfig() {
    return http.get('/setting/websiteConfig')
}

export function setBackground(background) {
    return http.put('/setting/setBackground',{background})
}

export function deleteBackground() {
    return http.delete('/setting/deleteBackground')
}

export function setBlackList(params) {
    return http.put('/setting/setBlacklist', params)
}
