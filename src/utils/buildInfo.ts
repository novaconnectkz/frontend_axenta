// Информация о сборке приложения

// Получаем версию из package.json
import packageJson from '../../package.json';

// Объявляем глобальные переменные, которые подставляются во время сборки
declare const __BUILD_TIME__: string;
declare const __COMMIT_HASH__: string;

// Получаем время сборки (подставляется во время сборки)
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : new Date().toISOString();

// Получаем хеш коммита (подставляется во время сборки)
const COMMIT_HASH = (typeof __COMMIT_HASH__ !== 'undefined') ? __COMMIT_HASH__ : 'dev';

export interface BuildInfo {
  version: string;
  buildTime: string;
  commitHash: string;
  environment: string;
}

export function getBuildInfo(): BuildInfo {
  // Определяем режим более надежным способом
  // В production сборке import.meta.env.DEV должен быть false
  const isDev = import.meta.env.DEV === true;
  const isProduction = import.meta.env.PROD === true;
  
  // Если версия 0.0.0, используем timestamp как версию
  let version = packageJson.version;
  if (version === '0.0.0') {
    const timestamp = Math.floor(Date.now() / 1000);
    version = `1.0.${timestamp}`;
  }
  
  // В development показываем версию с пометкой dev
  // В production показываем чистую версию
  const finalVersion = isDev ? `${version}-dev` : version;
  
  return {
    version: finalVersion,
    buildTime: BUILD_TIME,
    commitHash: COMMIT_HASH,
    environment: import.meta.env.MODE
  };
}

export function getVersionString(): string {
  const buildInfo = getBuildInfo();
  return `${buildInfo.version} (${buildInfo.commitHash})`;
}

export function getBuildTimeString(): string {
  const buildInfo = getBuildInfo();
  const buildDate = new Date(buildInfo.buildTime);
  return buildDate.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
