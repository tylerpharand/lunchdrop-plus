export const CHIP_MOTION = `
  @keyframes lunchbot-chip-in {
    from {
      opacity: 0;
      translate: 0 -0.25rem;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes lunchbot-chip-out {
    from {
      opacity: 1;
      translate: 0 0;
    }
    to {
      opacity: 0;
      translate: 0 -0.25rem;
    }
  }
  .lunchbot-chip-in,
  .lunchbot-chip-out {
    animation-duration: 300ms;
    animation-timing-function: ease-out;
    animation-fill-mode: both;
  }
  .lunchbot-chip-in {
    animation-name: lunchbot-chip-in;
  }
  .lunchbot-chip-out {
    animation-name: lunchbot-chip-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .lunchbot-chip-in,
    .lunchbot-chip-out {
      animation: none;
      translate: none;
    }
    .lunchbot-chip-in {
      opacity: 1;
    }
    .lunchbot-chip-out {
      opacity: 0;
    }
  }
`

export const STATUS_MOTION = `
  @keyframes lunchbot-mark-in {
    from {
      opacity: 0;
      scale: 0.6;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
  @keyframes lunchbot-mark-out {
    from {
      opacity: 1;
      scale: 1;
    }
    to {
      opacity: 0;
      scale: 0.6;
    }
  }
  @keyframes lunchbot-mark-swap {
    from {
      opacity: 1;
      scale: 1;
    }
    to {
      opacity: 0;
      scale: 0.85;
    }
  }
  @keyframes lunchbot-check-in {
    0% {
      opacity: 0;
      scale: 0.82;
    }
    42% {
      opacity: 1;
      scale: 1.24;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  .lunchbot-mark-in,
  .lunchbot-mark-out,
  .lunchbot-mark-swap,
  .lunchbot-check-in {
    animation-timing-function: ease-out;
    animation-fill-mode: both;
  }
  .lunchbot-mark-in,
  .lunchbot-mark-out {
    animation-duration: 200ms;
  }
  .lunchbot-mark-swap {
    animation-duration: 90ms;
  }
  .lunchbot-check-in {
    animation-duration: 360ms;
  }
  .lunchbot-mark-in {
    animation-name: lunchbot-mark-in;
  }
  .lunchbot-mark-out {
    animation-name: lunchbot-mark-out;
  }
  .lunchbot-mark-swap {
    animation-name: lunchbot-mark-swap;
  }
  .lunchbot-check-in {
    animation-name: lunchbot-check-in;
  }
  @media (prefers-reduced-motion: reduce) {
    .lunchbot-mark-in,
    .lunchbot-mark-out,
    .lunchbot-mark-swap,
    .lunchbot-check-in {
      animation: none;
    }
    .lunchbot-mark-in,
    .lunchbot-check-in {
      opacity: 1;
      scale: 1;
    }
    .lunchbot-mark-out,
    .lunchbot-mark-swap {
      opacity: 0;
      scale: 1;
    }
  }
`

export const CONTROL_FOCUS = `
  .lunchbot-control:focus,
  .lunchbot-control:focus-visible,
  .lunchbot-option > .lunchbot-control:focus,
  .lunchbot-option > .lunchbot-control:focus-visible {
    outline: none;
  }
  button.lunchbot-option:focus-visible,
  .lunchbot-option:has(> .lunchbot-control:focus-visible) {
    outline: none;
    border-color: #009900;
    box-shadow: inset 0 0 0 1px #009900;
  }
`
