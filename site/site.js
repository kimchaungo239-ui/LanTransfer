(function () {
  const languages = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' }
  ];
  const themes = [
    { value: 'system', labelKey: 'preferences.themeSystem' },
    { value: 'light', labelKey: 'preferences.themeLight' },
    { value: 'dark', labelKey: 'preferences.themeDark' }
  ];
  const messages = {
    en: {
      'preferences.languageLabel': 'Language',
      'preferences.themeLabel': 'Theme',
      'preferences.themeSystem': 'System',
      'preferences.themeLight': 'Light',
      'preferences.themeDark': 'Dark',
      'site.navSteps': 'How it works',
      'site.navSecurity': 'Safety',
      'site.navFaq': 'FAQ',
      'site.eyebrow': 'Local first file kit',
      'site.heroTitle': 'As simple as passing a USB drive, without the cable.',
      'site.heroText': 'Run LanTransfer on your computer, scan with your phone, and move files locally over the same Wi-Fi or hotspot.',
      'site.download': 'Download for Windows',
      'site.releaseNote': 'Portable zip, unzip and run the exe',
      'site.previewComputer': 'Computer',
      'site.previewTitle': 'Scan to transfer',
      'site.previewNetwork': 'Same Wi-Fi or hotspot',
      'site.previewRefresh': 'Refresh QR',
      'site.previewCopy': 'Copy URL',
      'site.previewUpload': 'Upload complete',
      'site.previewCollect': 'Collect from multiple people',
      'site.previewCollectText': 'One QR code, temporary transfer on the same network',
      'site.stepsEyebrow': 'Three steps',
      'site.stepsTitle': 'No phone app. No Node install.',
      'site.step1Title': 'Download and run',
      'site.step1Text': 'Unzip the package and double-click LanTransfer.exe. Allow LAN access if Windows Firewall asks.',
      'site.step2Title': 'Scan with phone',
      'site.step2Text': 'Put phone and computer on the same Wi-Fi or hotspot, then scan the QR code on the computer.',
      'site.step3Title': 'Transfer both ways',
      'site.step3Text': 'Upload from phone to computer, or choose files on the computer for phone download.',
      'site.securityEyebrow': 'Local safety',
      'site.securityTitle': 'Files only move through your local network.',
      'site.securityLogin': 'No login:',
      'site.securityLoginText': ' No WeChat, cloud drive, or account system required.',
      'site.securityCloud': 'No cloud relay:',
      'site.securityCloudText': ' The computer starts a temporary local service and phones connect over LAN.',
      'site.securityQr': 'Expiring QR:',
      'site.securityQrText': ' Refresh the QR code on the computer after it expires.',
      'site.securityMulti': 'Multiple uploaders:',
      'site.securityMultiText': ' While the QR is valid, multiple people on the same network can upload.',
      'site.faqTitle': 'Common questions',
      'site.faqNetworkQ': 'Must devices be on the same network?',
      'site.faqNetworkA': 'Yes. The phone and computer need to be on the same Wi-Fi, router network, or phone hotspot.',
      'site.faqSizeQ': 'Is there a file size limit?',
      'site.faqSizeA': 'The tool does not set a file size limit. Real limits come from disk space, browser capability, and network stability.',
      'site.faqExeQ': 'Can I share only the exe?',
      'site.faqExeA': 'Use the full zip package. This version still needs the public assets beside the exe.',
      'site.faqWebQ': 'Why not make it a pure web page?',
      'site.faqWebA': 'A normal web page cannot reliably start a local computer service or write into your chosen folder. LanTransfer keeps the phone side in the browser and gives local capabilities to the Windows tool.'
    },
    zh: {
      'preferences.languageLabel': '语言',
      'preferences.themeLabel': '主题',
      'preferences.themeSystem': '跟随系统',
      'preferences.themeLight': '浅色',
      'preferences.themeDark': '深色',
      'site.navSteps': '使用方法',
      'site.navSecurity': '安全说明',
      'site.navFaq': '常见问题',
      'site.eyebrow': '本地优先的文件工具',
      'site.heroTitle': '像递一只 U 盘一样简单，只是不用插线。',
      'site.heroText': '电脑运行 LanTransfer，手机扫码打开浏览器。在同一个 Wi-Fi 或热点里，文件就能本地互传。',
      'site.download': '下载 Windows 版',
      'site.releaseNote': '便携 zip 包，解压后运行 exe',
      'site.previewComputer': '电脑端',
      'site.previewTitle': '扫码传输',
      'site.previewNetwork': '同一 Wi-Fi 或热点',
      'site.previewRefresh': '刷新二维码',
      'site.previewCopy': '复制链接',
      'site.previewUpload': '上传完成',
      'site.previewCollect': '多人扫码收集',
      'site.previewCollectText': '一个二维码，同网内临时传输',
      'site.stepsEyebrow': '三步开始',
      'site.stepsTitle': '手机不用装 App，电脑不用装 Node。',
      'site.step1Title': '下载并运行',
      'site.step1Text': '解压 zip，双击 LanTransfer.exe。Windows 防火墙提示时允许局域网访问。',
      'site.step2Title': '手机扫码',
      'site.step2Text': '让手机和电脑在同一个 Wi-Fi 或手机热点里，扫描电脑页面上的二维码。',
      'site.step3Title': '双向传输',
      'site.step3Text': '手机可以上传文件到电脑，电脑也可以选择文件供手机下载。',
      'site.securityEyebrow': '本地安全',
      'site.securityTitle': '文件只在你的局域网里流动。',
      'site.securityLogin': '无需登录：',
      'site.securityLoginText': '不依赖微信、网盘或任何账号体系。',
      'site.securityCloud': '不走云端：',
      'site.securityCloudText': '电脑临时启动本地服务，手机通过局域网访问。',
      'site.securityQr': '二维码会失效：',
      'site.securityQrText': '过期后需要在电脑端刷新二维码再连接。',
      'site.securityMulti': '可以多人传：',
      'site.securityMultiText': '二维码未失效时，同网内多个人可以一起上传。',
      'site.faqTitle': '常见问题',
      'site.faqNetworkQ': '必须在同一个网络里吗？',
      'site.faqNetworkA': '是。手机和电脑需要在同一个 Wi-Fi、路由器网络，或电脑连接手机热点。',
      'site.faqSizeQ': '文件大小有限制吗？',
      'site.faqSizeA': '工具当前没有主动限制单文件大小，实际取决于磁盘空间、浏览器能力和网络稳定性。',
      'site.faqExeQ': '我可以只发 exe 吗？',
      'site.faqExeA': '建议发完整的 zip 包。当前版本还需要同目录下的 public 静态资源。',
      'site.faqWebQ': '为什么不做成纯网页？',
      'site.faqWebA': '普通网页不能可靠启动电脑本地服务，也不能直接写入你指定的文件夹。LanTransfer 用 Windows 工具负责本地能力，手机端仍然只需要浏览器。'
    }
  };
  const languageKey = 'lanTransfer.language';
  const themeKey = 'lanTransfer.theme';
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let language = normalizeLanguage(localStorage.getItem(languageKey) || getBrowserLanguage());
  let theme = normalizeTheme(localStorage.getItem(themeKey) || 'system');

  renderControls();
  applyTheme();
  applyLanguage();
  mediaQuery.addEventListener('change', applyTheme);

  function renderControls() {
    const container = document.querySelector('#preferences');
    if (!container) return;
    container.innerHTML = `
      <label><span data-i18n="preferences.languageLabel"></span><select id="languageSelect">${languages.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}</select></label>
      <label><span data-i18n="preferences.themeLabel"></span><select id="themeSelect">${themes.map((item) => `<option value="${item.value}" data-i18n-option="${item.labelKey}"></option>`).join('')}</select></label>
    `;
    document.querySelector('#languageSelect').value = language;
    document.querySelector('#themeSelect').value = theme;
    container.addEventListener('change', (event) => {
      if (event.target.id === 'languageSelect') {
        language = normalizeLanguage(event.target.value);
        localStorage.setItem(languageKey, language);
        applyLanguage();
      }
      if (event.target.id === 'themeSelect') {
        theme = normalizeTheme(event.target.value);
        localStorage.setItem(themeKey, theme);
        applyTheme();
      }
    });
  }

  function applyTheme() {
    const resolved = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = theme;
  }

  function applyLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    for (const element of document.querySelectorAll('[data-i18n]')) {
      element.textContent = t(element.dataset.i18n);
    }
    for (const option of document.querySelectorAll('[data-i18n-option]')) {
      option.textContent = t(option.dataset.i18nOption);
    }
  }

  function t(key) {
    return messages[language]?.[key] || messages.en[key] || key;
  }

  function normalizeLanguage(value) {
    return languages.some((item) => item.value === value) ? value : 'zh';
  }

  function normalizeTheme(value) {
    return themes.some((item) => item.value === value) ? value : 'system';
  }

  function getBrowserLanguage() {
    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
})();
