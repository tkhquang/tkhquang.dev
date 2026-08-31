import "./HeroPortrait.css";
import Image from "@/components/common/NextImage";
import { getProcessedImage } from "@/utils/image";
import classNames from "classnames";

const PORTRAIT_IMAGE = "/assets/resources/images/Aleks-2.jpg";

const HeroPortrait = async ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const portraitImage = await getProcessedImage({
    source: PORTRAIT_IMAGE,
    shouldStore: false,
    cache: true,
  });

  return (
    <div className={classNames("hero-portrait", className)} {...props}>
      <div className="relative w-full pb-[100%]">
        <Image
          fill
          sizes="20rem"
          className="hero-portrait__image object-cover object-[15%_50%]"
          src={portraitImage.source}
          alt="Aleks"
          placeholder="blur"
          blurDataURL={portraitImage.placeholder}
          loading="eager"
          containerClassName="hero-portrait__image-frame"
        />
      </div>
    </div>
  );
};

export default HeroPortrait;
