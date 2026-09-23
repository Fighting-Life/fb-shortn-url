<template>
  <svg viewBox="0 0 560 260" class="w-full h-auto" role="img" aria-label="Diagram alur redirect: visitor menuju validasi, lalu diteruskan ke target atau diblokir">
    <line x1="40" y1="130" x2="230" y2="130" stroke="var(--page-border)" stroke-width="2" />
    <line x1="270" y1="130" x2="360" y2="70" stroke="var(--page-border)" stroke-width="2" />
    <line x1="270" y1="130" x2="360" y2="190" stroke="var(--page-border)" stroke-width="2" />

    <circle cx="40" cy="130" r="6" fill="var(--page-muted)" />
    <text x="40" y="160" font-family="var(--font-mono)" font-size="12" fill="var(--page-muted)" text-anchor="middle">visitor</text>

    <g>
      <rect x="230" y="100" width="80" height="60" rx="6" fill="none" stroke="currentColor" class="text-pine-500" stroke-width="2" />
      <text x="270" y="126" font-family="var(--font-mono)" font-size="11" fill="var(--page-ink)" text-anchor="middle">shortCode</text>
      <text x="270" y="142" font-family="var(--font-mono)" font-size="11" fill="var(--page-ink)" text-anchor="middle">+ rule</text>
    </g>

    <g>
      <circle cx="390" cy="70" r="26" fill="none" stroke="currentColor" class="text-pine-500" stroke-width="2" />
      <text x="390" y="74" font-family="var(--font-mono)" font-size="11" fill="var(--page-ink)" text-anchor="middle">target</text>
      <text x="440" y="66" font-family="var(--font-sans)" font-size="12" fill="var(--page-muted)">302 → destination tervalidasi</text>
    </g>

    <g>
      <circle cx="390" cy="190" r="26" fill="none" stroke="currentColor" class="text-rust-500" stroke-width="2" />
      <text x="390" y="194" font-family="var(--font-mono)" font-size="11" fill="var(--page-ink)" text-anchor="middle">blocked</text>
      <text x="440" y="186" font-family="var(--font-sans)" font-size="12" fill="var(--page-muted)">rule tidak terpenuhi</text>
    </g>
  </svg>
</template>
