import Image from "next/image";

type BrandLogoProps = {
  className: string;
  sizes: string;
  preload?: boolean;
};

export function BrandLogo({
  className,
  sizes,
  preload = false,
}: BrandLogoProps) {
  return (
    <Image
      className={`brand-logo ${className}`}
      src="/images/wangjing/wangjing-logo.jpg"
      width={1339}
      height={451}
      sizes={sizes}
      preload={preload}
      alt="왕징양다리양꼬치"
    />
  );
}
