'use strict';

/**
 * i18n catalogue — plain object, no dependencies.
 * Keys are referenced via data-i18n attributes in HTML.
 * Add new strings to both locales simultaneously.
 */
const strings = {
  en: {
    // ── App / tray ──────────────────────────────────────
    appName: 'OpenPaste',
    trayTooltipWaiting: 'OpenPaste — waiting for iPhone…',
    trayTooltipRunning: 'OpenPaste — listening :{port}',
    trayTooltipStopped: 'OpenPaste — stopped',
    trayRunning: '● Running',
    trayStopped: '○ Stopped',
    trayStopServer: 'Stop server',
    trayStartServer: 'Start server',
    traySettings: 'Settings…',
    trayOpenFolder: 'Open downloads folder',
    trayQuit: 'Quit',

    // ── Notifications ────────────────────────────────────
    notifCopied: 'OpenPaste — Copied!',
    notifImageReceived: 'OpenPaste — Image received',
    notifFileReceived: 'OpenPaste — File received',
    notifErrorTitle: 'OpenPaste — Error',
    notifErrorBody: 'Could not start the server: {message}',

    // ── Settings window ──────────────────────────────────
    settingsTitle: 'OpenPaste — Settings',
    statusRunning: 'Running',
    statusStopped: 'Stopped',
    statusLoading: 'Loading…',
    cardNetwork: 'Network',
    cardSettings: 'Settings',
    cardHistory: 'Session history',
    labelPort: 'Server port',
    labelDownloadPath: 'Downloads folder',
    labelAutoLaunch: 'Start with Windows',
    labelAutoLaunchSub: 'Launches in tray at login',
    labelHttpServer: 'HTTP Server',
    labelLocalIP: 'Local IP',
    labelMdnsHostname: 'mDNS hostname',
    labelFullUrl: 'Full URL',
    hintMdns: 'Use <strong>openpaste.local</strong> in the iOS Shortcut when iPhone and PC are on the same Wi-Fi. If mDNS does not work, use the local IP directly.',
    btnPickFolder: 'Choose folder',
    btnOpenFolder: 'Open in Explorer',
    btnStopServer: 'Stop',
    btnStartServer: 'Start',
    btnSave: 'Save',
    btnOpenFolderFooter: 'Open folder',
    serverSubRunning: 'Port {port} · waiting for connections',
    serverSubStopped: 'Server is not running',
    historyEmpty: 'No items received yet',
    historyItems: '{n} item',
    historyItemsPlural: '{n} items',
    feedbackSaved: '✓ Settings saved',
    feedbackInvalidPort: 'Invalid port (1024–65535)',
    feedbackError: 'Error saving',
    feedbackCopied: '✓ Copied!',
    langLabel: 'Language',

    // ── Onboarding ───────────────────────────────────────
    onboardingTitle: 'OpenPaste — Setup',
    onboardStep1Title: 'Welcome to OpenPaste',
    onboardStep1Sub: 'Send anything from iPhone to Windows in two taps.',
    onboardStep2Title: 'How it works',
    onboardStep2Sub: 'OpenPaste runs on your PC and waits for content from your iPhone over Wi-Fi.',
    onboardStep3Title: 'Network Setup',
    onboardStep3Sub: 'The server is ready to receive content from your iPhone.',
    onboardStep4Title: 'iOS Shortcut',
    onboardStep4Sub: 'Install the shortcut on your iPhone to start sending content.',
    onboardBtnNext: 'Next',
    onboardBtnBack: 'Back',
    onboardBtnFinish: 'Get started',
    onboardBtnSkip: 'Skip',
    onboardLangPrompt: 'Choose your language:',
    onboardHowStep1: 'Open OpenPaste on your PC',
    onboardHowStep1Detail: 'The app announces itself on the network as openpaste.local via Bonjour.',
    onboardHowStep2: 'Share from iPhone',
    onboardHowStep2Detail: 'Tap Share in any app and choose "Send to PC". Works with text, links, photos, PDFs and any file.',
    onboardHowStep3: 'Ready on Windows',
    onboardHowStep3Detail: 'Text and URLs go straight to the clipboard. Files are saved to your downloads folder.',
    onboardNetworkReady: 'Server is running',
    onboardNetworkPort: 'Port',
    onboardNetworkIP: 'Local IP',
    onboardNetworkMdns: 'mDNS hostname',
    onboardShortcutStep1: 'Open the <strong>Shortcuts</strong> app on your iPhone and tap <strong>"+"</strong>.',
    onboardShortcutStep2: 'Under <strong>"Shortcut receives"</strong>, enable: Text, URLs, Images, Files and PDFs.',
    onboardShortcutStep3: 'Add a <strong>"Get contents of URL"</strong> action with the endpoint shown above.',
    onboardShortcutStep4: 'Name the shortcut <strong>"Send to PC"</strong> and save.',
    onboardEndpointLabel: 'Server endpoint',
  },

  'pt-BR': {
    // ── App / tray ──────────────────────────────────────
    appName: 'OpenPaste',
    trayTooltipWaiting: 'OpenPaste — aguardando do iPhone…',
    trayTooltipRunning: 'OpenPaste — escutando :{port}',
    trayTooltipStopped: 'OpenPaste — parado',
    trayRunning: '● Rodando',
    trayStopped: '○ Parado',
    trayStopServer: 'Parar servidor',
    trayStartServer: 'Iniciar servidor',
    traySettings: 'Configurações…',
    trayOpenFolder: 'Abrir pasta de downloads',
    trayQuit: 'Sair',

    // ── Notifications ────────────────────────────────────
    notifCopied: 'OpenPaste — Copiado!',
    notifImageReceived: 'OpenPaste — Imagem recebida',
    notifFileReceived: 'OpenPaste — Arquivo recebido',
    notifErrorTitle: 'OpenPaste — Erro',
    notifErrorBody: 'Não foi possível iniciar o servidor: {message}',

    // ── Settings window ──────────────────────────────────
    settingsTitle: 'OpenPaste — Configurações',
    statusRunning: 'Rodando',
    statusStopped: 'Parado',
    statusLoading: 'Carregando…',
    cardNetwork: 'Rede',
    cardSettings: 'Configurações',
    cardHistory: 'Histórico da sessão',
    labelPort: 'Porta do servidor',
    labelDownloadPath: 'Pasta de downloads',
    labelAutoLaunch: 'Iniciar com o Windows',
    labelAutoLaunchSub: 'Inicia no tray ao fazer login',
    labelHttpServer: 'Servidor HTTP',
    labelLocalIP: 'IP local',
    labelMdnsHostname: 'Hostname mDNS',
    labelFullUrl: 'URL completa',
    hintMdns: 'Use <strong>openpaste.local</strong> no Atalho iOS quando iPhone e PC estiverem na mesma rede Wi-Fi. Caso o mDNS não funcione, use o IP local diretamente.',
    btnPickFolder: 'Escolher pasta',
    btnOpenFolder: 'Abrir no Explorer',
    btnStopServer: 'Parar',
    btnStartServer: 'Iniciar',
    btnSave: 'Salvar',
    btnOpenFolderFooter: 'Abrir pasta',
    serverSubRunning: 'Porta {port} · aguardando conexões',
    serverSubStopped: 'Servidor não está rodando',
    historyEmpty: 'Nenhum item recebido ainda',
    historyItems: '{n} item',
    historyItemsPlural: '{n} itens',
    feedbackSaved: '✓ Configurações salvas',
    feedbackInvalidPort: 'Porta inválida (1024–65535)',
    feedbackError: 'Erro ao salvar',
    feedbackCopied: '✓ Copiado!',
    langLabel: 'Idioma',

    // ── Onboarding ───────────────────────────────────────
    onboardingTitle: 'OpenPaste — Configuração',
    onboardStep1Title: 'Bem-vindo ao OpenPaste',
    onboardStep1Sub: 'Envie qualquer coisa do iPhone para o Windows em dois toques.',
    onboardStep2Title: 'Como funciona',
    onboardStep2Sub: 'O OpenPaste roda no seu PC e aguarda conteúdo do iPhone via Wi-Fi.',
    onboardStep3Title: 'Configuração de rede',
    onboardStep3Sub: 'O servidor está pronto para receber conteúdo do seu iPhone.',
    onboardStep4Title: 'Atalho iOS',
    onboardStep4Sub: 'Instale o atalho no iPhone para começar a enviar conteúdo.',
    onboardBtnNext: 'Próximo',
    onboardBtnBack: 'Voltar',
    onboardBtnFinish: 'Começar',
    onboardBtnSkip: 'Pular',
    onboardLangPrompt: 'Escolha seu idioma:',
    onboardHowStep1: 'Abra o OpenPaste no PC',
    onboardHowStep1Detail: 'O app se anuncia na rede como openpaste.local via Bonjour.',
    onboardHowStep2: 'Compartilhe do iPhone',
    onboardHowStep2Detail: 'Toque em Compartilhar em qualquer app e escolha "Enviar para PC". Funciona com texto, links, fotos, PDFs e qualquer arquivo.',
    onboardHowStep3: 'Pronto no Windows',
    onboardHowStep3Detail: 'Texto e URLs vão direto para o clipboard. Arquivos são salvos na pasta de destino.',
    onboardNetworkReady: 'Servidor rodando',
    onboardNetworkPort: 'Porta',
    onboardNetworkIP: 'IP local',
    onboardNetworkMdns: 'Hostname mDNS',
    onboardShortcutStep1: 'Abra o app <strong>Atalhos</strong> no iPhone e toque em <strong>"+"</strong>.',
    onboardShortcutStep2: 'Em <strong>"Atalho recebe"</strong>, marque: Texto, URLs, Imagens, Arquivos e PDFs.',
    onboardShortcutStep3: 'Adicione uma ação <strong>"Obter Conteúdo da URL"</strong> com o endpoint exibido acima.',
    onboardShortcutStep4: 'Nomeie o atalho <strong>"Enviar para PC"</strong> e salve.',
    onboardEndpointLabel: 'Endpoint do servidor',
  },
};

/**
 * Get a string by key for a given locale.
 * Falls back to 'en' if key is missing in locale.
 * @param {string} locale
 * @param {string} key
 * @param {Record<string,string>} [vars] — placeholder substitutions e.g. {port: '9876'}
 * @returns {string}
 */
function t(locale, key, vars) {
  const catalogue = strings[locale] || strings['en'];
  let str = catalogue[key] ?? strings['en'][key] ?? key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

module.exports = { strings, t };
