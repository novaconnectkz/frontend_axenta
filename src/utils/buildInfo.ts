// Информация о сборке приложения

import packageJson from '../../package.json';

declare const __BUILD_TIME__: string;
declare const __COMMIT_HASH__: string;
declare const __COMMIT_COUNT__: number;

const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : new Date().toISOString();
const COMMIT_HASH = (typeof __COMMIT_HASH__ !== 'undefined') ? __COMMIT_HASH__ : 'dev';
const COMMIT_COUNT = (typeof __COMMIT_COUNT__ !== 'undefined') ? __COMMIT_COUNT__ : 0;

export interface BuildInfo {
  version: string;
  buildTime: string;
  commitHash: string;
  environment: string;
}

export function getBuildInfo(): BuildInfo {
  const isDev = import.meta.env.DEV === true;

  // MAJOR.MINOR из package.json, PATCH = git commit count (авто-инкремент при каждом коммите)
  const [major = '1', minor = '0'] = (packageJson.version || '1.0.0').split('.');
  const patch = COMMIT_COUNT > 0 ? COMMIT_COUNT : 0;
  const baseVersion = `${major}.${minor}.${patch}`;

  const finalVersion = isDev ? `${baseVersion}-dev` : baseVersion;

  return {
    version: finalVersion,
    buildTime: BUILD_TIME,
    commitHash: COMMIT_HASH,
    environment: import.meta.env.MODE
  };
}

export function getVersionString(): string {
  return getBuildInfo().version;
}

export function getVersionStringFull(): string {
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
