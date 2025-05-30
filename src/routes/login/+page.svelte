<script lang="ts">
  let loginUsername = "";
  let loginPassword = "";
  let loginError = "";
  let loading = false;

  // 检查是否已登录，已登录则跳转首页
  import { onMount } from "svelte";
  onMount(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          window.location.href = "/";
        }
      }
    } catch {}
  });

  async function login() {
    loginError = "";
    loading = true;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
      }),
    });
    const data = await res.json();
    loading = false;
    if (res.ok) {
      window.location.href = "/courses";
    } else {
      loginError = data.error || "登录失败";
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
  <div class="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white border border-gray-200">
    <h2 class="text-3xl font-extrabold mb-8 text-center text-gray-800 tracking-wide">登录</h2>
    <form on:submit|preventDefault={login} class="flex flex-col gap-6">
      <div class="flex flex-col gap-4">
        <input
          class="input input-bordered w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg transition"
          placeholder="用户名"
          bind:value={loginUsername}
          autocomplete="username"
          required
        />
        <input
          class="input input-bordered w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg transition"
          placeholder="密码"
          type="password"
          bind:value={loginPassword}
          autocomplete="current-password"
          required
        />
      </div>
      <button
        class="btn btn-primary w-full py-3 rounded-xl text-lg font-semibold shadow-md hover:scale-105 transition-transform duration-150 disabled:opacity-60 mt-2"
        type="submit"
        disabled={loading}
      >
        {loading ? '登录中…' : '登录'}
      </button>
      {#if loginError}
        <div class="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-center text-base animate-pulse">{loginError}</div>
      {/if}
      <div class="text-center text-base text-gray-500 pt-2">
        没有账号？<a href="/register" class="link link-primary ml-1 font-medium underline hover:text-blue-600">去注册</a>
      </div>
    </form>
  </div>
</div>

<style>
  .input:focus {
    box-shadow: 0 0 0 2px #60a5fa33;
  }
  .btn-primary {
    background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
    color: #fff;
    border: none;
  }
  .btn-primary:hover {
    background: linear-gradient(90deg, #60a5fa 0%, #6366f1 100%);
  }
</style>
