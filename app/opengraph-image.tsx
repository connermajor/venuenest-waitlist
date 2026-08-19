import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Social-share card (Open Graph + Twitter). Rendered purely graphically — the
// nest mark on VenueNest's warm cream ground inside a sage frame — so it carries
// no font dependency (satori needs bundled fonts for text; the platform renders
// the page title beneath the image anyway).
export const runtime = "nodejs";
export const alt = "VenueNest — Join the waitlist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/venuenest-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f6f1",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 1120,
            height: 550,
            border: "3px solid #d7e0c9",
            borderRadius: 28,
            backgroundColor: "#ffffff",
          }}
        >
          <img src={logoSrc} width={520} height={397} alt="" />
        </div>
      </div>
    ),
    { ...size },
  );
}
