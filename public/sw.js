// Service worker mínimo: existe para tornar o app instalável (ícone na tela
// inicial do tablet) e evitar tela em branco em quedas curtas de rede.
// Não faz cache de chamadas ao Supabase — apenas ajuda a navegação (HTML).
const CACHE = "pcp-caldeiraria-shell-v1";
const SHELL_URL = "/dashboard";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([SHELL_URL]).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só participa de navegações de página (HTML). Chamadas de API (Supabase,
  // fetch de dados) seguem direto para a rede, sem interceptação.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(SHELL_URL)) ?? Response.error();
    }),
  );
});
