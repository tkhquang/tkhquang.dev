import React from "react";
import Image from "@/components/common/NextImage";
import { Blog } from "@/constants/meta";
import { getPlaceholderImage } from "@/utils/next-mage";

const AUTHOR_IMAGE = "/uploads/images/author.jpg";

const Author = async () => {
  const authorImage = await getPlaceholderImage(AUTHOR_IMAGE);

  return (
    <div className="author flex-center flex-col text-center md:flex-row">
      <div className="author__image--container shrink-0">
        <Image
          alt={Blog.METADATA.author}
          src={authorImage.src}
          className="author__image size-[100px] rounded-full shadow-lg md:size-[80px]"
          width={150}
          height={150}
          placeholder="blur"
          blurDataURL={authorImage.placeholder}
          containerClassName="rounded-full"
        />
      </div>
      <div className="author__intro text-left italic opacity-75">
        <p>{Blog.METADATA.description}</p>
      </div>
    </div>
  );
};

export default Author;
