export const publicPagePaths = ["/login", "/signup"];

export const publicApiPaths = ["/api/auth/login", "/api/auth/signup", "/api/health"];

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isPublicPagePath(pathname: string) {
  return publicPagePaths.some((path) => matchesPath(pathname, path));
}

export function isPublicApiPath(pathname: string) {
  return publicApiPaths.some((path) => matchesPath(pathname, path));
}
