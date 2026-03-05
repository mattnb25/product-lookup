<script>
  import { getProductByUpc } from "$lib/parser.js";
  import { onMount } from "svelte";

  // Don't prerender this page since it requires browser-only APIs
  export const prerender = false;

  let status = $state("idle");
  let barcode = $state(null);
  let product = $state(null);
  let barcodeDetector = $state(null);
  let videoElement = $state(null);

  onMount(async () => {
    // Import barcode detector only in browser
    const { BarcodeDetectorPolyfill } = await import(
      "@undecaf/barcode-detector-polyfill"
    );
    // Patch both standard and offscreen canvases
    [HTMLCanvasElement, OffscreenCanvas].forEach((cls) => {
      const _getContext = cls.prototype.getContext;
      cls.prototype.getContext = function (type, attr) {
        if (type === "2d") {
          attr = { ...(attr || {}), willReadFrequently: true };
        }
        return _getContext.call(this, type, attr);
      };
    });

    window.BarcodeDetector ||= BarcodeDetectorPolyfill;
    barcodeDetector = new window.BarcodeDetector({
      formats: ["upc_a", "upc_e", "code_128", "ean_13", "ean_8"],
    });

    videoElement = document.querySelector("video");
    toggleCamera();
  });

  async function scan() {
    if (status !== "idle" || !barcodeDetector) return;
    if (!videoElement || videoElement.readyState < 2) {
      return setTimeout(scan, 250);
    }

    const [detected] = await barcodeDetector.detect(videoElement);

    if (detected) {
      status = "fetching";
      toggleCamera();

      barcode =
        detected.format === "upc_e"
          ? detected.rawValue.slice(1, 7)
          : detected.rawValue;

      product = await getProductByUpc(barcode);
      status = product ? "found" : "not-found";
      return;
    }

    setTimeout(scan, 250);
  }

  async function toggleCamera() {
    const isIdle = status === "idle";
    if (isIdle) {
      videoElement.srcObject = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoElement.hidden = false;
      videoElement.play();
      scan();
    } else {
      videoElement.pause();
      videoElement.srcObject?.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
      videoElement.hidden = true;
    }
  }

  function ScanAgain() {
    status = "idle";
    barcode = null;
    product = null;
    toggleCamera();
  }
</script>

<p>updating page, may not work</p>

{#if status === "idle"}
  <p>Please allow camera access and point your camera at a barcode.</p>
{:else if status === "fetching"}
  <p>Searching for {barcode}...</p>
{:else if status === "not-found"}
  <article>
    <h2>ITEM: {barcode}</h2>
    <p>Not found</p>
  </article>
  <button onclick={ScanAgain}>Scan Another Item</button>
{:else if status === "found"}
  <article>
    <h2>ITEM: {barcode}</h2>
    <dl>
      <dt>Description</dt>
      <dd>{product?.desc}</dd>

      <dt>Price</dt>
      <dd>${product?.price1?.toFixed(2)}</dd>
    </dl>
  </article>
  <button onclick={ScanAgain}>Scan Another Item</button>
{/if}

<style>
  :global(body) {
    font-family: apple-system, sans-serif;
    max-width: 400px;
    margin: auto;
    padding: 20px 20px;
    background: #eee;
    color: #333;
    line-height: 1.5;
  }

  :global(video) {
    width: 100%;
    margin-bottom: 20px;
    background-color: #000;
    aspect-ratio: 4/3;
  }

  p {
    margin-top: 0;
  }

  article {
    margin-bottom: 20px;
  }

  article h2 {
    font-size: 0.8rem;
    margin: 0;
    margin-bottom: 10px;
  }

  dl {
    margin: 0;
  }

  dt {
    font-size: 0.8rem;
    color: SlateGray;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    margin-bottom: 10px;
    font-weight: bold;
    font-size: 1.2rem;
  }

  button {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    background: #000;
    color: #eee;
    border: none;
    font-weight: bold;
    cursor: pointer;
  }

  button:active {
    opacity: 0.8;
  }
</style>
