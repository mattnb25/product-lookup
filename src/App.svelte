<script>
  import { onMount } from "svelte";
  import { getProductByUpc, timeUpdated, timeColor } from "./lib/parser.js";
  import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";

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
  const barcodeDetector = new window.BarcodeDetector({
    formats: ["upc_a", "upc_e", "code_128", "ean_13", "ean_8"],
  });

  let videoElement;
  let status = $state("idle");
  let barcode = $state(null);
  let product = $state(null);

  async function scan() {
    if (status !== "idle") return;
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

  onMount(async () => {
    await toggleCamera();
  });
</script>

<video bind:this={videoElement} autoplay playsinline muted></video>

{#if status === "idle"}
  <p>Please allow camera access and point your camera at a barcode.</p>
  <p>
    Data last updated
    <span style="color: {timeColor}">{timeUpdated}</span>
  </p>
{:else if status === "fetching"}
  <p>Searching for {barcode}...</p>
{:else if status === "not-found"}
  <article>
    <h2>ITEM: {barcode}</h2>
    <p style="font-size: 1.2rem;">Not found</p>
  </article>
  <button
    onclick={() => {
      status = "idle";
      toggleCamera();
    }}>Scan Another Item</button
  >
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
  <button
    onclick={() => {
      status = "idle";
      toggleCamera();
    }}>Scan Another Item</button
  >
{/if}
