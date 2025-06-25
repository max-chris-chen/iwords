<script lang="ts">
  import { page } from "$app/state";
  import { invalidateAll, goto } from "$app/navigation";
  import "../app.css";
  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await invalidateAll();
    await goto("/login");
  }
</script>

{#if page.url.pathname !== "/login" && page.url.pathname !== "/register"}
  <nav class="top-nav">
    <div class="nav-container">
      <div class="nav-left">
        <div class="logo">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            ></path>
          </svg>
        </div>
        <a href="/" class="logo-text">iWords</a>
      </div>

      <nav class="top-main-nav">
        <a href="/" class="nav-item" class:active={page.url.pathname === "/"}
          >首页</a
        >
        <a
          href="/courses"
          class="nav-item"
          class:active={page.url.pathname.startsWith("/courses")}>我的课程</a
        >
        <a href="#" class="nav-item">探索</a>
      </nav>

      <div class="nav-right">
        {#if page.data.user}
          <div class="user-menu">
            <div class="user-avatar">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
            <span class="username">{page.data.user.username}</span>
            <div class="dropdown">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
              <div class="dropdown-menu">
                <a href="#" class="dropdown-item">个人设置</a>
                <a href="#" class="dropdown-item">学习统计</a>
                <div class="dropdown-divider"></div>
                <button onclick={logout} class="dropdown-item logout"
                  >退出登录</button
                >
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </nav>
{/if}

<main
  class="main-content-area"
  class:no-nav={page.url.pathname === "/login" ||
    page.url.pathname === "/register"}
>
  {@render children?.()}
</main>

<style>
  :root {
    --nav-height: 64px;
  }
  .top-nav {
    height: var(--nav-height);
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0 2rem;
  }
  .nav-container {
    width: 100%;
    max-width: 1400px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }
  .nav-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .logo {
    color: #2563eb;
  }
  .logo svg {
    width: 2rem;
    height: 2rem;
  }
  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    text-decoration: none;
  }
  .top-main-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .top-main-nav .nav-item {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    color: #374151;
    text-decoration: none;
    font-weight: 500;
    transition:
      background-color 0.2s,
      color 0.2s;
    font-size: 1rem;
    white-space: nowrap;
  }
  .top-main-nav .nav-item:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  .top-main-nav .nav-item.active {
    color: #3730a3;
    font-weight: 600;
  }
  .nav-right {
    display: flex;
    align-items: center;
  }
  .user-menu {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
    cursor: pointer;
    padding-bottom: 0.5rem;
  }
  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #f3f4f6;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #6b7280;
  }
  .user-avatar svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  .username {
    font-weight: 500;
    color: #374151;
  }
  .dropdown svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
    transition: transform 0.2s;
  }
  .user-menu:hover .dropdown svg {
    transform: rotate(180deg);
  }
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
    min-width: 160px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition:
      opacity 0.2s,
      transform 0.2s;
    z-index: 1001;
  }
  .user-menu:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  .dropdown-item {
    display: block;
    padding: 0.75rem 1rem;
    color: #374151;
    text-decoration: none;
    font-size: 0.875rem;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }
  .dropdown-item:hover {
    background-color: #f9fafb;
  }
  .dropdown-divider {
    height: 1px;
    background-color: #f3f4f6;
    margin: 0.5rem 0;
  }
  .logout {
    color: #ef4444;
  }
  .main-content-area {
    padding-top: var(--nav-height);
  }

  .no-nav {
    padding-top: 0;
  }
</style>
