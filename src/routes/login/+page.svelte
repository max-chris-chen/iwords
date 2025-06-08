<script lang="ts">
  import { onMount } from "svelte";

  let email = "";
  let password = "";
  let name = "";
  let confirmPassword = "";
  let apiError = "";
  let apiSuccess = "";
  let loading = false;

  let isLoginMode = true;

  let passwordFieldType = "password";
  let confirmPasswordFieldType = "password";

  // 检查是否已登录，已登录则跳转首页
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

  function clearMessages() {
    apiError = "";
    apiSuccess = "";
  }

  function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    clearMessages();
    // Reset fields
    email = "";
    password = "";
    name = "";
    confirmPassword = "";
  }

  function togglePassword(fieldType: "password" | "confirmPassword") {
    if (fieldType === "password") {
      passwordFieldType =
        passwordFieldType === "password" ? "text" : "password";
    } else {
      confirmPasswordFieldType =
        confirmPasswordFieldType === "password" ? "text" : "password";
    }
  }

  async function handleSubmit() {
    clearMessages();
    loading = true;

    if (isLoginMode) {
      // Login logic
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email, // API expects username
          password: password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/courses";
      } else {
        apiError = data.error || "登录失败";
      }
    } else {
      // Register logic
      if (password !== confirmPassword) {
        apiError = "两次输入的密码不一致！";
        loading = false;
        return;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email, // Assuming username is email
          password: password,
          name: name, // The provided login.html has a name field. Let's send it.
        }),
      });
      const data = await res.json();
      if (res.ok) {
        apiSuccess = "注册成功！请登录。";
        toggleAuthMode();
      } else {
        apiError = data.error || "注册失败";
      }
    }
    loading = false;
  }
</script>

<div class="container">
  <!-- Logo Section -->
  <div class="logo-section">
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
    <h1 class="logo-title">iWords</h1>
    <p class="logo-subtitle">让英语学习变得简单有趣</p>
  </div>

  <!-- Auth Card -->
  <div class="auth-card">
    <div class="card-content">
      <form on:submit|preventDefault={handleSubmit}>
        <!-- Name Field (只在注册时显示) -->
        {#if !isLoginMode}
          <div class="form-group">
            <label class="form-label" for="name">姓名</label>
            <div class="input-wrapper">
              <svg
                class="input-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <input
                type="text"
                id="name"
                class="form-input"
                placeholder="请输入您的姓名"
                bind:value={name}
              />
            </div>
          </div>
        {/if}

        <!-- Email Field -->
        <div class="form-group">
          <label class="form-label" for="email">
            {#if isLoginMode}用户名或邮箱{:else}邮箱{/if}
          </label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            <input
              type="text"
              id="email"
              class="form-input"
              placeholder="请输入您的邮箱"
              required
              bind:value={email}
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
            <input
              type={passwordFieldType}
              id="password"
              class="form-input"
              placeholder="请输入密码"
              required
              bind:value={password}
            />
            <button
              type="button"
              class="password-toggle"
              on:click={() => togglePassword("password")}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if passwordFieldType === "password"}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                {:else}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  ></path>
                {/if}
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password Field (只在注册时显示) -->
        {#if !isLoginMode}
          <div class="form-group">
            <label class="form-label" for="confirmPassword">确认密码</label>
            <div class="input-wrapper">
              <svg
                class="input-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
              <input
                type={confirmPasswordFieldType}
                id="confirmPassword"
                class="form-input"
                placeholder="请再次输入密码"
                bind:value={confirmPassword}
              />
              <button
                type="button"
                class="password-toggle"
                on:click={() => togglePassword("confirmPassword")}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {#if confirmPasswordFieldType === "password"}
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  {:else}
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    ></path>
                  {/if}
                </svg>
              </button>
            </div>
          </div>
        {/if}

        <!-- Forgot Password (只在登录时显示) -->
        {#if isLoginMode}
          <div class="forgot-password">
            <a href="#forgot">忘记密码？</a>
          </div>
        {/if}

        {#if apiError}
          <div class="api-error">{apiError}</div>
        {/if}
        {#if apiSuccess}
          <div class="api-success">{apiSuccess}</div>
        {/if}

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" disabled={loading}>
          {#if loading}
            处理中...
          {:else if isLoginMode}
            登录
          {:else}
            注册
          {/if}
        </button>
      </form>

      <!-- Auth Switch -->
      <div class="auth-switch">
        <span>
          {#if isLoginMode}
            还没有账户？
          {:else}
            已有账户？
          {/if}
        </span>
        <button type="button" on:click={toggleAuthMode}>
          {#if isLoginMode}
            立即注册
          {:else}
            立即登录
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #dbeafe 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .api-error,
  .api-success {
    text-align: center;
    padding: 10px;
    margin-bottom: 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .api-error {
    color: #ef4444;
    background-color: #fef2f2;
  }

  .api-success {
    color: #10b981;
    background-color: #f0fdf4;
  }

  .container {
    width: 100%;
    max-width: 400px;
  }

  .logo-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .logo svg {
    width: 28px;
    height: 28px;
    color: white;
  }

  .logo-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 0.5rem;
  }

  .logo-subtitle {
    color: #64748b;
    font-size: 0.95rem;
  }

  .auth-card {
    background: white;
    border-radius: 16px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .card-content {
    padding: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #334155;
    margin-bottom: 0.5rem;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: #94a3b8;
  }

  .form-input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
    background: #f8fafc;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .password-toggle svg {
    width: 16px;
    height: 16px;
  }

  .password-toggle:hover {
    color: #64748b;
  }

  .forgot-password {
    text-align: right;
    margin-bottom: 1.5rem;
    margin-top: -1rem;
  }

  .forgot-password a {
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .forgot-password a:hover {
    text-decoration: underline;
    color: #1d4ed8;
  }

  .submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 1.5rem;
  }

  .submit-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auth-switch {
    text-align: center;
    color: #64748b;
    font-size: 0.875rem;
    margin-top: 1.5rem;
  }

  .auth-switch button {
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 500;
    cursor: pointer;
    margin-left: 4px;
  }

  .auth-switch button:hover {
    text-decoration: underline;
    color: #1d4ed8;
  }

  @media (max-width: 480px) {
    .container {
      max-width: 100%;
    }

    .card-content {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .logo {
      width: 50px;
      height: 50px;
    }

    .logo svg {
      width: 24px;
      height: 24px;
    }

    .logo-title {
      font-size: 1.75rem;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-card {
    animation: fadeInUp 0.6s ease-out;
  }

  .logo-section {
    animation: fadeInUp 0.4s ease-out;
  }
</style>
