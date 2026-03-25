# Apercu Pro Font Files

Apercu Pro is a licensed font. You must purchase or obtain a license before using it.

Once you have the font files, place the following `.woff2` files in this directory:

```
src/fonts/
  ApercuPro-Regular.woff2
  ApercuPro-Medium.woff2
  ApercuPro-Bold.woff2
```

These are referenced in `src/app/layout.tsx` via `next/font/local`.

> **Note:** The layout will gracefully fall back to `sans-serif` until these files are present.
> Next.js will **not** throw an error if the files are missing during development — it will
> simply print a warning. Add the files when you're ready.
