# Connect

Instaladores e atualizações do Connect para Windows e Android.
O código-fonte é mantido em um repositório privado; este repositório contém
somente informações de instalação e arquivos compilados nas Releases.

## Baixar

[Abrir a versão mais recente](https://github.com/Nidus-ux/connect-releases/releases/latest)

- **Windows 64 bits:** baixe `Connect.Friends-win-Setup.exe`, feche o Connect
  antigo e execute o instalador na sua conta do Windows, sem administrador.
- **Android ARM64:** baixe o arquivo `Connect-...-Android-arm64.apk` e confirme
  a atualização pelo Android. Esta variante é destinada aos celulares ARM64,
  incluindo o aparelho usado no teste inicial.

Você faz essa instalação inicial uma vez. As próximas versões podem ser
verificadas no menu **Organizar interface → Atualizações do app**. O aplicativo
também procura novidades ao abrir; o download e a instalação exigem sua ação.
No Android, o sistema mantém a confirmação final de instalação.

Não desinstale o Connect para atualizar o APK: instale por cima para preservar
o login e as preferências. No Windows, abra o atalho instalado, não a antiga
pasta Release. Encerre a chamada antes de instalar uma atualização.

## Observações

O Connect é um aplicativo privado para um pequeno grupo de amigos; continua
exigindo uma conta e acesso aos servidores compartilhados. Não está distribuído
pela Microsoft Store ou Google Play. O instalador Windows ainda não tem
certificado comercial de assinatura e pode apresentar aviso de reputação;
não é necessário desativar o antivírus ou proteções do sistema.

As atualizações Android usam a mesma chave de assinatura da versão anterior.
Os pacotes são verificados antes da instalação. As credenciais administrativas
dos serviços e a credencial do GitHub não acompanham o aplicativo.

## Estado dos testes

Esta versão foi submetida à análise do código e a testes automatizados. A
instalação e a atualização de uma versão para outra ainda precisam ser
confirmadas nos computadores e celulares usados pelo grupo. Os testes
automatizados não substituem o teste de áudio e transmissão com duas pessoas.
