import { Image } from "@chakra-ui/react";
import NextImage from "next/image";

// A wide photo over each church page, matched by the page's slug in any
// language; other pages get the blossom. All Unsplash License, no credit
// needed: Daiga Ellaby (daisies), Jisca Lucia (forest), Kiriakos
// Verros (blossom).
const photos: { slugs: string[]; src: string }[] = [
  { slugs: ["fur-besucher", "for-visitors", "dlya-posetiteley"], src: "/header-visitors.jpg" },
  { slugs: ["unser-glaube", "our-belief", "nasha-vera"], src: "/header-belief.jpg" },
];

export function HeaderPhoto({ slug }: { slug: string }) {
  const src = photos.find((photo) => photo.slugs.includes(slug))?.src ?? "/header-page.jpg";
  return (
    <Image asChild display="block" w="full" h={{ base: "28", md: "auto" }} objectFit="cover">
      <NextImage
        src={src}
        alt=""
        width={2000}
        height={471}
        sizes="100vw"
        fetchPriority="high"
        loading="eager"
      />
    </Image>
  );
}
