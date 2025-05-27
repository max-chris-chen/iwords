<script lang="ts">
  let regUsername = "";
  let regEmail = "";
  let regPhone = "";
  let regPassword = "";
  let registerError = "";
  let registerSuccess = "";
  let loading = false;

  async function register() {
    registerError = "";
    registerSuccess = "";
    loading = true;
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: regUsername,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      }),
    });
    const data = await res.json();
    loading = false;
    if (res.ok) {
      registerSuccess = "注册成功，请前往登录";
      regUsername = regEmail = regPhone = regPassword = "";
    } else {
      registerError = data.error || "注册失败";
    }
  }
</script>

<div style="margin:2em auto;max-width:400px">
  <h2>注册</h2>
  <input placeholder="用户名" bind:value={regUsername} />
  <input placeholder="邮箱" bind:value={regEmail} />
  <input placeholder="手机号" bind:value={regPhone} />
  <input placeholder="密码" type="password" bind:value={regPassword} />
  <button on:click={register} disabled={loading}>注册</button>
  {#if registerError}<div style="color:red">{registerError}</div>{/if}
  {#if registerSuccess}<div style="color:green">{registerSuccess}</div>{/if}
  <div style="margin-top:1em">
    已有账号？<a href="/login">去登录</a>
  </div>
</div>
