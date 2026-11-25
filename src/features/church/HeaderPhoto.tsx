import { Image } from "@chakra-ui/react";
import NextImage, { type StaticImageData } from "next/image";

import { headerBelief, headerPage, headerVisitors } from "./photos";

// A wide photo over each church page, matched by the page's slug in any
// language; other pages get the blossom. All Unsplash License, no credit
// needed: Daiga Ellaby (daisies), Jisca Lucia (forest), Kiriakos
// Verros (blossom).
const photos: { slugs: string[]; src: StaticImageData }[] = [
  { slugs: ["fur-besucher", "for-visitors", "dlya-posetiteley"], src: headerVisitors },
  { slugs: ["unser-glaube", "our-belief", "nasha-vera"], src: headerBelief },
];

export function HeaderPhoto({ slug }: { slug: string }) {
  const src = photos.find((photo) => photo.slugs.includes(slug))?.src ?? headerPage;
  return (
    <Image asChild display="block" w="full" h={{ base: "28", md: "auto" }} objectFit="cover">
      <NextImage
        src={src}
        alt=""
        sizes="100vw"
        fetchPriority="high"
        loading="eager"
        placeholder="blur"
      />
    </Image>
  );
}
