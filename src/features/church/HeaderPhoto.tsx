import { Image } from "@chakra-ui/react";
import NextImage from "next/image";

// The meadow photo from the old site's header, full width.
export function HeaderPhoto() {
  return (
    <Image asChild display="block" w="full" h={{ base: "28", md: "auto" }} objectFit="cover">
      <NextImage
        src="/header-photo.jpg"
        alt=""
        width={1700}
        height={400}
        sizes="100vw"
        fetchPriority="high"
        loading="eager"
      />
    </Image>
  );
}
