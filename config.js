window.CONNECT_SITE = {
  // false: botões só mostram aviso, sem baixar
  live: true,

  repository: 'Nidus-ux/connect-releases',
  fallbackVersion: '1.2.6',
  defaultPlatform: 'windows',
  releasesPage: 'https://github.com/Nidus-ux/connect-releases/releases',

  platforms: {
    windows: {
      label: 'Windows',
      station: '98.6',
      lcd: 'CONNECT PARA WINDOWS ★ INSTALADOR COM ATUALIZAÇÃO AUTOMÁTICA ★',
      requirements: 'Windows 10 ou 11 · 64 bits',
      assetPattern: '^Connect\\.Friends-win-Setup\\.exe$',
      fallbackUrl:
        'https://github.com/Nidus-ux/connect-releases/releases/latest/download/Connect.Friends-win-Setup.exe',
      fallbackFile: 'Connect.Friends-win-Setup.exe',
    },
    android: {
      label: 'Android',
      station: '104.2',
      lcd: 'CONNECT PARA ANDROID ★ APK ARM64 ★ ANDROID 8 OU SUPERIOR ★',
      requirements: 'Android 8 ou superior · ARM64',
      assetPattern: '^Connect-[0-9.]+-Android-arm64\\.apk$',
      fallbackUrl: 'https://github.com/Nidus-ux/connect-releases/releases/latest',
      fallbackFile: 'Connect-{version}-Android-arm64.apk',
    },
  },
};
