export const AVATARS: Record<string, string> = {
  Rosie: '/avartars/rosie.jpg',
  Wella: '/avartars/wella.jpg',
}

export function getAvatarSrc(displayName: string): string | null {
  const key = Object.keys(AVATARS).find((name) => name.toLowerCase() === displayName.toLowerCase())
  return key ? AVATARS[key] : null
}
