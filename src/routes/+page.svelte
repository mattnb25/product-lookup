<script>
  import { onMount } from "svelte";
  import Papa from "papaparse";

  const stores = {
    "Home Tan":
      "https://www.dropbox.com/scl/fi/exrblrycdt6rsalwa0j0r/home-tan.csv?rlkey=ykc4ef3mtzajzl2yspf6ouyv1&st=xx9q5bji&e=1&dl=1",
    "Tans Mart": "",
  };

  let store = $state("Home Tan");
  let status = $state("loading");
  let barcode = $state();
  let product = $state();
  let video = $state();

  let detector, frame, stream;
  const db = new Map();

  const getDownloadUrl = (value) => {
    const url = new URL(value);
    if (url.hostname === "www.dropbox.com" || url.hostname === "dropbox.com")
      url.hostname = "dl.dropboxusercontent.com";
    url.searchParams.set("dl", "1");
    return url.href;
  };

  // Smart fetch: checks headers before pulling the whole MBs payload
  const syncStore = async () => {
    status = "loading";
    try {
      const sourceUrl = stores[store];
      if (!sourceUrl) throw new Error("No URL");
      const url = getDownloadUrl(sourceUrl);

      const cache = await caches.open("csv-store");
      const head = await fetch(url, { method: "HEAD" }).catch(() => ({}));

      // Try to get ETag or Last-Modified. (Fallback to Date if CORS hides them)
      const rev =
        head.headers?.get("etag") || head.headers?.get("last-modified");
      let res = await cache.match(url);
      const cachedRev = await cache.match(`${url}-rev`).then((r) => r?.text());

      // Download only if we don't have it, or if the server confirms a change
      if (!res || !rev || rev !== cachedRev) {
        res = await fetch(url);
        if (!res.ok) throw res.status;

        await cache.put(url, res.clone());
        if (rev) await cache.put(`${url}-rev`, new Response(rev));
      }

      // Stream the parse to save memory
      db.clear();
      Papa.parse(await res.text(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => String(h).trim().toLowerCase(),
        step: ({ data: { part_no, desc, price1 } }) => {
          if (part_no)
            db.set(String(part_no).trim(), {
              desc: desc || "No description",
              price: +price1 || 0,
            });
        },
      });

      reset();
    } catch {
      status = "unavailable";
    }
  };

  const reset = () => {
    barcode = product = null;
    status = "scanning";
  };

  async function scan() {
    if (!detector || status !== "scanning" || !video || video.readyState < 2) {
      if (status === "scanning") frame = requestAnimationFrame(scan);
      return;
    }

    try {
      const [det] = await detector.detect(video);
      if (det) {
        status = "resolving";
        barcode =
          det.format === "upc_e" ? det.rawValue.slice(1, 7) : det.rawValue;
        product = db.get(barcode);
        status = product ? "found" : "not-found";
        return;
      }
    } catch {}
    frame = requestAnimationFrame(scan);
  }

  $effect(() => {
    if (status !== "scanning" || !video) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (status !== "scanning")
          return s.getTracks().forEach((t) => t.stop());
        video.srcObject = stream = s;
        video.play();
        scan();
      })
      .catch(() => (status = "unavailable"));

    return () => {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  });

  onMount(async () => {
    if (!window.BarcodeDetector) {
      try {
        [HTMLCanvasElement, OffscreenCanvas].forEach((c) => {
          if (!c) return;
          const og = c.prototype.getContext;
          c.prototype.getContext = function (t, a) {
            return og.call(
              this,
              t,
              t === "2d" ? { ...a, willReadFrequently: true } : a,
            );
          };
        });
        window.BarcodeDetector = (
          await import("@undecaf/barcode-detector-polyfill")
        ).BarcodeDetectorPolyfill;
      } catch {
        return (status = "unavailable");
      }
    }
    detector = new window.BarcodeDetector({
      formats: ["upc_a", "upc_e", "code_128", "ean_13", "ean_8"],
    });
    syncStore();
  });
</script>

<label>
  Store:
  <select bind:value={store} onchange={syncStore}>
    {#each Object.keys(stores) as name}
      <option value={name}>{name}</option>
    {/each}
  </select>
</label>

{#if status === "loading"}
  <p>Syncing {store} inventory...</p>
{:else if status === "scanning"}
  <video bind:this={video} autoplay playsinline muted></video>
  <p>Allow camera access and point camera at a barcode for product details.</p>
{:else if status === "resolving"}
  <p>Looking up {barcode} in {store}...</p>
{:else if status === "found" || status === "not-found"}
  <article>
    <h2>ITEM: {barcode}</h2>
    {#if product}
      <dl>
        <dt>Description</dt>
        <dd>{product.desc}</dd>
        <dt>Price</dt>
        <dd>${product.price?.toFixed(2)}</dd>
      </dl>
    {:else}
      <p style="font-size: 1.2rem;">Not found in system</p>
    {/if}
  </article>
  <button onclick={reset}>Scan Another Item</button>
{:else}
  <h2 class="unavailable-title">Service unavailable</h2>
  <p>
    Camera access denied, invalid store URL, or network error (try again later).
  </p>
{/if}
