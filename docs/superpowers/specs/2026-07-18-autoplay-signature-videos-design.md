# Autoplay Signature Videos Design

## Goal

Make all four Wangjing signature videos start moving immediately on page load without requiring a click.

## Root Cause

Instagram's official embed player ignores autoplay query parameters. Browser verification showed the embedded video remains paused at 0 seconds with autoplay disabled and sound enabled. Because the player is cross-origin, the Wangjing page cannot control its internal video element.

## Solution

Store stable MP4 copies of the four approved Wangjing Instagram videos inside the website and render native HTML `video` elements.

Each video uses:

- `autoPlay`
- `muted`
- `loop`
- `playsInline`
- `preload="metadata"`

This combination allows modern desktop and mobile browsers to begin muted playback without a click and continue looping inside the page.

## Content

Use the four approved posts in the existing order:

1. https://www.instagram.com/p/DGIqZOuv4C8/
2. https://www.instagram.com/p/DVVjzUfAU7t/
3. https://www.instagram.com/p/DVNruO0gZ7Z/
4. https://www.instagram.com/p/DVVl_JrAe3-/

Save one MP4 file per post under `public/videos/signature/`. Keep each original Instagram URL as the source attribution and optional click destination.

## Layout

- Preserve the current heading and “전체 메뉴 보기” button.
- Preserve desktop four columns, tablet two columns, and mobile one column.
- Remove Instagram iframe chrome, profile header, and embedded scrollbars.
- Fill each rounded card with a portrait video using `object-fit: cover`.
- Keep the existing cream background, red accent border, and subtle shadow.

## Playback and Accessibility

- All four videos start muted and loop automatically.
- No playback click is required.
- Keep native controls hidden so the four cards remain visually consistent.
- Respect `prefers-reduced-motion: reduce` by disabling automatic motion for visitors who request reduced motion.
- Give each video an accessible Korean label.
- If a video cannot load, its card keeps a dark fallback background without breaking the section.

## Testing and Verification

- Assert all four local MP4 paths exist and contain data.
- Assert every video uses `autoPlay`, `muted`, `loop`, and `playsInline`.
- Assert Instagram iframe elements are removed.
- Run the complete test suite and production build.
- Verify in desktop and mobile browser previews that each visible video advances beyond 0 seconds without interaction.
- Deploy only after the local autoplay behavior is confirmed.

