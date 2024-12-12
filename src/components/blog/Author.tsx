import Image from "next/image";
import React from "react";
import { Blog } from "@/constants/meta";
import { getPlaceholderImage } from "@/utils/next-mage";

const AUTHOR_IMAGE = "/uploads/images/author.jpg";

const Author = async () => {
  const authorImage = await getPlaceholderImage(AUTHOR_IMAGE);

  return (
    <div className="author flex-center flex-col text-center">
      <Image
        alt={Blog.METADATA.author}
        src={authorImage.src}
        className="author__image mb-4 rounded-full shadow-lg"
        width={150}
        height={150}
        placeholder="blur"
        blurDataURL={authorImage.placeholder}
      />
      <h1 className="author__site-title mb-4 text-2xl font-bold">
        {Blog.METADATA.author}
      </h1>
      <div className="author__intro text-left italic opacity-75">
        <p>{Blog.METADATA.description}</p>
      </div>
    </div>
  );
};

export default Author;
