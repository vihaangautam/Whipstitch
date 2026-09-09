// MeshGradient.jsx — grainy mesh backdrop for the Whipstitch hero
//
// Drop into src/components/. Renders as an absolutely-positioned backdrop:
//
//   <section className="relative overflow-hidden">
//     <MeshGradient />
//     <div className="relative z-10"> ...hero content... </div>
//   </section>
//
// Parent needs `relative overflow-hidden`. Content needs `relative z-10`.
// Pure CSS + one inline SVG filter. No dependencies, no images, ~2KB.

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export default function MeshGradient({
  // Bleed direction. Amplemarket bleeds from the left; "right" mirrors it.
  origin = "left",
  // Blob colours. Defaults use the rust/navy thread palette.
  // For the emerald system swap to: ["16,185,129"], ["5,150,105"], ["30,41,59"]
  colors = ["183,65,14", "217,119,6", "30,41,59"],
  intensity = 1,
  grain = 0.24,
  className = "",
}) {
  const flip = origin === "right" ? "scaleX(-1)" : "none";
  const [c1, c2, c3] = colors;

  // Smooth falloff on top, bottom, and outward (bleed) edges so the mesh
  // dissolves seamlessly into the canvas without any sharp division or hard edge.
  // The container is mirrored for origin="right", so "to right" is the outward edge.
  const mask = [
    "linear-gradient(to bottom, transparent 0%, #000 22%, #000 68%, transparent 98%)",
    "linear-gradient(to right, transparent 0%, #000 22%, #000 100%)",
  ].join(", ");

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        transform: flip,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    >
      {/* Blob layer. inset:-25% keeps the blur from showing a hard edge. */}
      <div
        className="absolute"
        style={{
          inset: "-25%",
          filter: "blur(72px)",
          backgroundImage: [
            `radial-gradient(38% 46% at 10% 38%, rgba(${c1},${0.30 * intensity}), transparent 68%)`,
            `radial-gradient(32% 40% at 3% 62%,  rgba(${c2},${0.24 * intensity}), transparent 70%)`,
            `radial-gradient(46% 54% at 18% 82%, rgba(${c3},${0.16 * intensity}), transparent 72%)`,
            `radial-gradient(28% 34% at 24% 20%, rgba(${c2},${0.14 * intensity}), transparent 74%)`,
          ].join(","),
        }}
      />

      {/* Grain. This is the layer that stops it looking like a 2015 gradient. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE,
          backgroundRepeat: "repeat",
          opacity: grain,
          mixBlendMode: "overlay",
        }}
      />

      {/* Fade toward content and edges so text never sits on colour and edges dissolve into canvas. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, transparent 32%, var(--mesh-fade,#F8FAFC) 72%), linear-gradient(to bottom, var(--mesh-fade,#F8FAFC) 0%, transparent 18%, transparent 75%, var(--mesh-fade,#F8FAFC) 100%)",
        }}
      />
    </div>
  );
}
