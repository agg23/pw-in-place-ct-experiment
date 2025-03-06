<script lang="ts">
	let { initial } = $props();
  let count: number = $state(initial ?? 0)
  const increment = () => {
    count += 1
  }
  const decrement = () => {
    count -= 1
  }
</script>

<div>
  <div data-testid="count">{count}</div>
  <button onclick={increment}>Increment</button>
  <button onclick={decrement}>Decrement</button>
</div>
