<svelte:head>
  <title>iWords - 您的 AI 英语教练</title>
  <meta
    name="description"
    content="iWords - 使用 AI 技术，个性化您的英语学习课程，通过跟读、听写、纠音，全面提升您的英语水平。"
  />
</svelte:head>

<div class="landing-container">
  <header class="landing-header">
    <h1>欢迎来到 iWords</h1>
    <p>您的私人 AI 英语学习教练</p>
  </header>

  <main class="features-grid">
    <div class="feature-card">
      <h2>&#128218; 创建个性化课程</h2>
      <p>根据您的学习目标和兴趣，自由创建和组织课程、章节和课文。</p>
    </div>
    <div class="feature-card">
      <h2>&#127908; AI 语音合成</h2>
      <p>
        内置先进的 TTS
        技术，将任何文本转化为发音清晰、自然的音频，随时随地练习听力。
      </p>
    </div>
    <div class="feature-card">
      <h2>&#127911; 跟读与录音</h2>
      <p>逐句跟读，录下您的发音，与标准发音进行对比，找到并纠正发音问题。</p>
    </div>
    <div class="feature-card">
      <h2>&#9999;&#65039; 智能听写练习</h2>
      <p>
        通过听写功能，检验您对单词和句子的掌握程度，有效提升拼写和听力理解能力。
      </p>
    </div>
  </main>
</div>

<style>
  .landing-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }

  .landing-header h1 {
    font-size: 3rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .landing-header p {
    font-size: 1.25rem;
    color: #666;
    margin-bottom: 3rem;
  }

  .features-grid {
    display: grid;
    /* On desktop, create a 2x2 grid for symmetry */
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-bottom: 3rem;
  }

  /* On smaller screens, stack the cards in a single column */
  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr;
    }
  }

  .feature-card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
  }

  .feature-card h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #444;
  }

  .feature-card p {
    font-size: 1rem;
    color: #777;
    line-height: 1.5;
  }

  .cta-footer h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .button-group {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .cta-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .cta-button.primary {
    background-color: #007aff;
    color: white;
  }
  .cta-button.primary:hover {
    background-color: #0056b3;
  }

  .cta-button {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #ccc;
  }
  .cta-button:hover {
    background-color: #e0e0e0;
  }
</style>
