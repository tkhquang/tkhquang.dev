import Image from "next/image";
import React from "react";

interface Metadata {
  siteOwner: {
    name: string;
    description: string;
  };
}

const metadata: Metadata = {
  siteOwner: {
    description:
      "<p>Hello there, I'm Aleks, a Software Engineer who loves open-source products and micro startups. This blog is just a place for me to post random stuff about things I like, interesting stories, and sometimes technical problems.</p>",
    name: "Aleks",
  },
};

const Author: React.FC = () => {
  const imageUrl = "/uploads/images/author.jpg";

  return (
    <div className="author flex-center flex-col text-center">
      <Image
        alt={metadata.siteOwner.name}
        src={imageUrl}
        className="author__image mb-4 rounded-full shadow-lg"
        width={150}
        height={150}
      />
      <h1 className="author__site-title mb-4 text-2xl font-bold">
        {metadata.siteOwner.name}
      </h1>
      <div
        className="author__intro text-left italic opacity-75"
        dangerouslySetInnerHTML={{ __html: metadata.siteOwner.description }}
      />
    </div>
  );
};

export default Author;
