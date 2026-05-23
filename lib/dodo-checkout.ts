/** Inicia checkout en Dodo: crea sesión vía API y redirige al usuario. */
export async function startDodoCheckout(productId: string): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });

  const data = (await res.json()) as { checkout_url?: string; error?: string };
  if (!res.ok || !data.checkout_url) {
    throw new Error(data.error ?? "checkout_failed");
  }

  window.location.assign(data.checkout_url);
}
