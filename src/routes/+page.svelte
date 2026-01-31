<script>
    import { onMount, tick } from "svelte";
    import { parseCsvToBarcodeMap } from "$lib/csvParser.js";
    import csv from "$lib/home-tan.csv?raw";
    const barcodeData = parseCsvToBarcodeMap(csv);
    let videoStream = $state(null);
    let detectedBarcode = $state(null); // Detected barcode from the camera
    let detectedData = $state(null); // Data linked to the detected barcode

    // Start scanning for barcodes using the Barcode Detection API
    async function startScanning() {
        detectedBarcode = null;
        detectedData = null;

        // Wait for Svelte to update the DOM so the <video> element is present
        await tick();

        if (!("BarcodeDetector" in window)) {
            window["BarcodeDetector"] =
                barcodeDetectorPolyfill.BarcodeDetectorPolyfill;
        }

        const barcodeDetector = new BarcodeDetector({
            formats: ["upc_a", "upc_e", "code_128", "ean_13", "ean_8"],
        });

        const video = document.querySelector("video");
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
        });
        video.srcObject = videoStream;

        await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
        });

        const scan = async () => {
            if (detectedBarcode != null) {
                videoStream.getTracks().forEach((track) => track.stop());
                // Clear the video's srcObject so the element is detached from the stopped stream
                if (video && video.srcObject) video.srcObject = null;
                videoStream = null;
                return;
            }

            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
                detectedBarcode = barcodes[0].rawValue;
                detectedData = barcodeData.get(detectedBarcode) || null;
            }
            requestAnimationFrame(scan);
        };

        video.play();
        scan();
    }

    onMount(() => {
        startScanning();
    });
</script>

{#if detectedBarcode == null}
    <p>
        Point your camera at a barcode for product information (updated 31
        January 2025, from Home Tan).
    </p>
    <video autoplay muted playsinline></video>
{:else}
    {#if detectedData != null}
        <article>
            <h2>{detectedBarcode}</h2>
            <dl>
                <dt>Name</dt>
                <dd>{detectedData.name}</dd>
                <dt>Price</dt>
                <dd>${detectedData.price}</dd>
            </dl>
        </article>
    {:else}
        <p>No product information found for this barcode.</p>
    {/if}
    <button onclick={startScanning}>Scan Again</button>
{/if}

<style>
    * {
        font-family: sans-serif;
    }
    :global(body) {
        max-width: 70ch;
        margin: auto;
        padding: 0 1rem;
    }
    video {
        display: block;
        background-color: black;
        max-height: 10rem;
        width: 100%;
    }
    dt {
        font-weight: bold;
        font-size: 1.2rem;
    }
    dd {
        margin-left: 0rem;
        margin-bottom: 0.5rem;
        font-size: 1.2rem;
    }
    button {
        font-size: 1.2rem;
        cursor: pointer;
    }
</style>
