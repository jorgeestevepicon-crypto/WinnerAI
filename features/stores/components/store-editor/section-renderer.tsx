import Image from "next/image";
import type { StoreSectionData, StoreTheme } from "@/features/stores/schemas";
import { Badge } from "@/components/ui/badge";
import { getReadableTextColor } from "@/lib/utils";

export function SectionRenderer({ section, theme }: { section: StoreSectionData; theme: StoreTheme }) {
  const headingStyle = { fontFamily: theme.headingFont, color: theme.primaryColor };
  const buttonStyle = { backgroundColor: theme.accentColor, color: getReadableTextColor(theme.accentColor) };
  const primaryTextColor = getReadableTextColor(theme.primaryColor);

  switch (section.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden px-8 py-16 text-center" style={{ backgroundColor: theme.backgroundColor }}>
          {section.settings.imageUrl && (
            <>
              <Image src={section.settings.imageUrl} alt="" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/45" />
            </>
          )}
          <div className="relative">
            <h1
              className="mx-auto max-w-2xl text-3xl font-bold"
              style={section.settings.imageUrl ? { fontFamily: theme.headingFont, color: "#ffffff" } : headingStyle}
            >
              {section.settings.headline}
            </h1>
            <p className={`mx-auto mt-3 max-w-xl ${section.settings.imageUrl ? "text-white/90" : "text-muted-foreground"}`}>
              {section.settings.subtitle}
            </p>
            <button className="mt-6 rounded-full px-6 py-2 text-sm font-medium" style={buttonStyle}>
              {section.settings.ctaLabel}
            </button>
          </div>
        </section>
      );
    case "benefits":
      return (
        <section className="px-8 py-12" style={{ backgroundColor: theme.backgroundColor }}>
          <h2 className="mb-6 text-center text-xl font-semibold" style={headingStyle}>
            {section.settings.title}
          </h2>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {section.settings.items.map((item, i) => (
              <div key={i} className="rounded-lg border p-4">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "product":
      return (
        <section className="px-8 py-12" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2 sm:items-center">
            {section.settings.imageUrl ? (
              <div className="relative h-40 overflow-hidden rounded-lg">
                <Image src={section.settings.imageUrl} alt={section.settings.title} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg bg-muted text-muted-foreground">Product image</div>
            )}
            <div>
              <h2 className="text-xl font-semibold" style={headingStyle}>
                {section.settings.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.settings.description}</p>
              <ul className="mt-3 list-inside list-disc text-sm">
                {section.settings.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <button className="mt-4 rounded-full px-6 py-2 text-sm font-medium" style={buttonStyle}>
                {section.settings.ctaLabel}
              </button>
            </div>
          </div>
        </section>
      );
    case "socialProof":
      return (
        <section className="relative px-8 py-12" style={{ backgroundColor: theme.backgroundColor }}>
          <Badge variant="outline" className="absolute right-4 top-4">
            Placeholder
          </Badge>
          <h2 className="mb-2 text-center text-xl font-semibold" style={headingStyle}>
            {section.settings.title}
          </h2>
          <p className="mx-auto max-w-lg text-center text-sm text-muted-foreground">{section.settings.note}</p>
        </section>
      );
    case "faq":
      return (
        <section className="px-8 py-12" style={{ backgroundColor: theme.backgroundColor }}>
          <h2 className="mb-6 text-center text-xl font-semibold" style={headingStyle}>
            {section.settings.title}
          </h2>
          <div className="mx-auto max-w-2xl space-y-3">
            {section.settings.items.map((item, i) => (
              <div key={i} className="rounded-lg border p-4">
                <p className="font-medium">{item.question}</p>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "guarantee":
      return (
        <section className="px-8 py-12 text-center" style={{ backgroundColor: theme.backgroundColor }}>
          <h2 className="text-xl font-semibold" style={headingStyle}>
            {section.settings.title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{section.settings.description}</p>
        </section>
      );
    case "cta":
      return (
        <section className="px-8 py-16 text-center" style={{ backgroundColor: theme.primaryColor }}>
          <h2 className="text-2xl font-bold" style={{ color: primaryTextColor }}>
            {section.settings.headline}
          </h2>
          <button className="mt-4 rounded-full px-6 py-2 text-sm font-medium" style={buttonStyle}>
            {section.settings.ctaLabel}
          </button>
        </section>
      );
    case "footer":
      return (
        <footer className="px-8 py-6 text-center text-xs text-muted-foreground" style={{ backgroundColor: theme.backgroundColor }}>
          {section.settings.text}
        </footer>
      );
    default:
      return null;
  }
}
