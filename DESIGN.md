# Design Direction: scrcpy-gui

## Identity & Voice
- Product: Web control deck and session launcher for scrcpy and Android Debug Bridge (ADB).
- Audience: Developers, Android power users, gamers, QA engineers, and content creators.
- Mood: High-utility industrial console. Focused, quiet, highly legible, immediate feedback.
- Dial: ENERGY 1 / RHYTHM 2 / MOTION 1

## Palette & Surface
- Background Base: `#0f1319` (Dark slate-black) | `#f6f8fa` (Light crisp canvas)
- Panel Surface: `#171c24` (Dark slate container) | `#ffffff` (Light pure surface)
- Border / Outline: `#273142` (Dark muted border) | `#d0d7de` (Light clean stroke)
- Text Primary: `#e6edf3` (Dark 13.8:1 contrast) | `#1f2328` (Light 15.2:1 contrast)
- Text Secondary: `#8b949e` (Dark 4.9:1 contrast) | `#57606a` (Light 5.1:1 contrast)
- Accent / Signal: `#238636` (Success/Active green), `#1f6feb` (Action/Interactive blue), `#da3633` (Kill/Danger red)

## Typography
- UI Sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif.
- Monospace Data: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace (used for device serials, adb commands, ports, logs).

## Accessibility Standards
- WCAG AA contrast ratio minimum 4.5:1 for normal text, 3:1 for large text / borders.
- Visible focus rings (`2px solid #388bfd`, outline-offset: `2px`) on keyboard navigation.
- Minimum tap targets 44px on mobile and touch environments.
- Zero decorative animations; transitions limited to 150ms state shifts.
