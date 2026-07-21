/**
 * Detecta links de vídeo (YouTube/Vimeo) e devolve a URL de EMBED do player.
 * Usado na área do aluno: link de vídeo vira player embutido; o resto continua como material.
 * Hospedagem própria (upload + venda de espaço) é a Fase B — este helper cobre só link externo.
 */
export function videoEmbed(url: string): string | null {
  const u = (url ?? "").trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/** true se a URL é um vídeo embutível (YouTube/Vimeo). */
export function isVideoUrl(url: string): boolean {
  return videoEmbed(url) !== null;
}
