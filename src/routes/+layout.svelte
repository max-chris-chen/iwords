<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import '../app.css';

	const userStore = derived(page, ($page) => $page.data.user);

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<header class="w-full flex justify-end items-center px-8 py-4 bg-white/80 shadow-sm sticky top-0 z-20">
		{#if $userStore}
			<span class="mr-4 text-gray-700">👤 {$userStore.username || $userStore.nickname}</span>
			<a href="#" class="text-blue-600 hover:underline font-medium" on:click|preventDefault={logout}>登出</a>
		{:else}
			<a href="/login" class="text-blue-600 hover:underline font-medium">登录</a>
		{/if}
	</header>
	<main class="flex-1 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64">
		{@render children()}
	</main>
</div>

<style>
header {
	backdrop-filter: blur(4px);
}
</style>
