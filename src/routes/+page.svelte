<script>
  import { onMount } from "svelte";

  const stores = ["Home Tan", "Tans Mart"];
  let store = $state(stores[0]);
  let status = $state("scanning");
  let barcode = $state();
  let product = $state();
  let video = $state();
  
  let detector, frame, stream;

  // DRY API wrapper for both warmups and queries
  const api = async (payload = {}) => {
    const res = await fetch("/", { method: "POST", body: JSON.stringify({ storeName: store, ...payload }) });
    if (!res.ok) throw res.status;
    return res.json();
  };

  const reset = () => {
    barcode = product = null;
    status = "scanning";
    api().catch(() => (status = "unavailable"));
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
        barcode = det.format === "upc_e" ? det.rawValue.slice(1, 7) : det.rawValue;
        
        try {
          product = (await api({ upc: barcode })).product;
          status = "found";
        } catch (e) {
          status = e === 404 ? "not-found" : "unavailable";
        }
        return; 
      }
    } catch {}
    frame = requestAnimationFrame(scan);
  }

  $effect(() => {
    if (status !== "scanning" || !video) return;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (status !== "scanning") return s.getTracks().forEach(t => t.stop());
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
    reset();

    if (!window.BarcodeDetector) {
      try {
        [HTMLCanvasElement, OffscreenCanvas].forEach((c) => {
          if (!c) return;
          const og = c.prototype.getContext;
          c.prototype.getContext = function (t, a) {
            return og.call(this, t, t === "2d" ? { ...a, willReadFrequently: true } : a);
          };
        });
        window.BarcodeDetector = (await import("@undecaf/barcode-detector-polyfill")).BarcodeDetectorPolyfill;
      } catch {
        return (status = "unavailable");
      }
    }
    detector = new window.BarcodeDetector({ formats: ["upc_a", "upc_e", "code_128", "ean_13", "ean_8"] });
  });
</script>

<label>
  Store:
  <select bind:value={store} onchange={reset}>
    {#each stores as name}
      <option value={name}>{name}</option>
    {/each}
  </select>
</label>

{#if status === "scanning"}
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
        <dd>${product.price1?.toFixed(2)}</dd>
      </dl>
    {:else}
      <p style="font-size: 1.2rem;">Not found in system</p>
    {/if}
  </article>
  <button onclick={reset}>Scan Another Item</button>
{:else}
  <h2 class="unavailable-title">Service unavailable</h2>
  <p>Camera access denied or network error (try again later).</p>
{/if}