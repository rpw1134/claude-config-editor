export function encodeProject(path: string): string {
  return encodeURIComponent(path);
}

export function decodeProject(param: string): string {
  return decodeURIComponent(param);
}
