<script lang="ts">
  let loginUsername = "";
  let loginPassword = "";
  let loginError = "";
  let loading = false;

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
      window.location.href = "/";
    } else {
      loginError = data.error || "登录失败";
    }
  }
</script>

<div style="margin:2em auto;max-width:400px">
  <h2>登录</h2>
  <input placeholder="用户名" bind:value={loginUsername} />
  <input placeholder="密码" type="password" bind:value={loginPassword} />
  <button on:click={login} disabled={loading}>登录</button>
  {#if loginError}<div style="color:red">{loginError}</div>{/if}
  <div style="margin-top:1em">
    没有账号？<a href="/register">去注册</a>
  </div>
</div>
