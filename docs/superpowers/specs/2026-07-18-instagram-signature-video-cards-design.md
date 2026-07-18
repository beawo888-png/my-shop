# Instagram Signature Video Cards Design

## Goal

Replace the existing three static signature-menu cards on the homepage with four Instagram video players that play inside the Wangjing homepage.

## Content

Use these four public Instagram posts in the supplied order:

1. https://www.instagram.com/p/DGIqZOuv4C8/
2. https://www.instagram.com/p/DVVjzUfAU7t/
3. https://www.instagram.com/p/DVNruO0gZ7Z/
4. https://www.instagram.com/p/DVVl_JrAe3-/

Each player uses the official Instagram embed URL ending in `/embed/`. All four URLs were confirmed to render a video element without an Instagram login prompt in the embed view.

## Layout

- Keep the existing section heading, description, and “전체 메뉴 보기” action.
- Desktop: four equal-width video cards in one row.
- Tablet: two cards per row.
- Mobile: one card per row.
- Use the current cream background, dark text, red accents, and subtle borders.
- Keep consistent rounded corners and spacing with the rest of the homepage.

## Playback

- Videos play directly inside the homepage.
- Visitors do not need to leave the homepage to watch.
- Do not force autoplay. Each player retains Instagram’s own play control so four videos cannot start with sound simultaneously.
- Keep native Instagram attribution and controls inside each embed.

## Accessibility and Performance

- Give every iframe a descriptive Korean title.
- Use lazy loading for all four embeds.
- Use a fixed responsive aspect ratio to prevent layout movement while Instagram loads.
- If Instagram is unavailable, the iframe remains isolated and does not break the rest of the section.

## Testing

- Verify all four approved embed URLs are rendered.
- Verify each iframe has a title, lazy loading, and safe permissions.
- Verify desktop, tablet, and mobile column contracts in CSS.
- Run the complete test suite and production build.
- Confirm actual playback controls appear in the local preview.

