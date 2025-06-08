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
  <!-- Hero Section with AI Features -->
  <div class="hero-section">
    <div class="logo">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        ></path>
      </svg>
      <div class="ai-badge">AI</div>
    </div>
    <h1 class="logo-title">iWords</h1>
    <p class="logo-subtitle">AI驱动的智能英语学习平台</p>
    
    <!-- AI Features Showcase -->
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </div>
        <h3>AI语音合成</h3>
        <p>真人级别的语音朗读，支持多种语速调节</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </div>
        <h3>智能分句</h3>
        <p>AI自动将文章拆分为句子，精准定位每个单词</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3>逐词高亮</h3>
        <p>跟随音频实时高亮单词，提升听力理解能力</p>
      </div>
    </div>
  </div>

  <!-- Auth Card -->
  <div class="auth-card">
    <div class="card-header">
      <h2>{isLoginMode ? "登录账户" : "创建账户"}</h2>
      <p>开启您的AI英语学习之旅</p>
    </div>
    
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
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          {#if loading}
            处理中...
          {:else if isLoginMode}
            开始AI学习
          {:else}
            创建账户
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 3rem;
    align-items: center;
  }

  .hero-section {
    color: white;
    text-align: center;
  }

  .logo {
    position: relative;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
  }

  .logo svg {
    width: 36px;
    height: 36px;
    color: white;
  }

  .ai-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .logo-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ffffff, #e0e7ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-subtitle {
    font-size: 1.25rem;
    margin-bottom: 3rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: left;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .feature-icon svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  .feature-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: white;
  }

  .feature-card p {
    font-size: 0.875rem;
    opacity: 0.8;
    line-height: 1.5;
  }

  .auth-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .card-header {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 2rem;
    text-align: center;
  }

  .card-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .card-header p {
    opacity: 0.9;
    font-size: 0.95rem;
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
    font-weight: 600;
    color: #374151;
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
    width: 18px;
    height: 18px;
    color: #9ca3af;
  }

  .form-input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    background: #f9fafb;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: white;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .password-toggle svg {
    width: 18px;
    height: 18px;
  }

  .password-toggle:hover {
    color: #6b7280;
    background: #f3f4f6;
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
    font-weight: 500;
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
    padding: 16px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-icon {
    width: 20px;
    height: 20px;
  }

  .submit-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auth-switch {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    margin-top: 1.5rem;
  }

  .auth-switch button {
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    margin-left: 4px;
    transition: color 0.2s ease;
  }

  .auth-switch button:hover {
    text-decoration: underline;
    color: #1d4ed8;
  }

  .api-error,
  .api-success {
    text-align: center;
    padding: 12px;
    margin-bottom: 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .api-error {
    color: #dc2626;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  .api-success {
    color: #059669;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  @media (max-width: 1024px) {
    .container {
      grid-template-columns: 1fr;
      max-width: 500px;
      gap: 2rem;
    }

    .hero-section {
      order: 2;
    }

    .auth-card {
      order: 1;
    }

    .features-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .feature-card {
      padding: 1rem;
    }

    .feature-card h3 {
      font-size: 1rem;
    }

    .feature-card p {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }

    .logo-title {
      font-size: 2.5rem;
    }

    .logo-subtitle {
      font-size: 1.125rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .card-content {
      padding: 1.5rem;
    }

    .card-header {
      padding: 1.5rem;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-card {
    animation: fadeInUp 0.8s ease-out;
  }

  .hero-section {
    animation: fadeInUp 0.6s ease-out;
  }

  .feature-card:nth-child(1) {
    animation-delay: 0.2s;
  }
  .feature-card:nth-child(2) {
    animation-delay: 0.4s;
  }
  .feature-card:nth-child(3) {
    animation-delay: 0.6s;
  }
</style>