<script>
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global(body) {
  font-family: "Inter", sans-serif;
  max-width: 400px;
  margin: auto;
  padding: 20px 20px;
  color: #333;
  line-height: 1.5;
}

:global(video) {
  width: 100%;
  object-fit: cover;
  margin-bottom: 20px;
  background-color: #000;
  aspect-ratio: 4/3;
}

:global(p) {
  margin-top: 0;
}


:global(article) {
  margin-bottom: 20px;
  letter-spacing: 0.02em;
}

:global(article h2) {
  font-size: 1rem;
  margin: 0;
  margin-bottom: 10px;
}

:global(dl) {
  margin: 0;
}

:global(dt) {
  font-size: 0.8rem;
  color: SlateGray;
  text-transform: uppercase;
}

:global(dd) {
  margin: 0;
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 1.2rem;
}

:global(button) {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  background: #000;
  color: #eee;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

:global(select) {
  font: inherit;
  margin-bottom: 0;
  background: none;
  color: #333;
  border: none;
  appearance: base-select;
}

:global(select)::picker(select) {
  appearance: base-select;
  padding: 8px;
}

:global(option) {
  margin-bottom: 4px;
}

:global(option:last-child) {
  margin-bottom:  0;
}

:global(option::checkmark) {
  order: 1;
  content: "👈";
}

:global(label) {
  display: inline-block;
  margin-bottom: 10px;
}

:global(.unavailable-title) {
  margin-top: 0;
}
</style>