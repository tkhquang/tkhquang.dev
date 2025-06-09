"use client";

import { scrolledStore } from "@/store/theme";
import { useAtomValue } from "jotai";
import React from "react";
import { FaArrowAltCircleUp } from "react-icons/fa";

const BackToTopButton = () => {
  const { isScrolled } = useAtomValue(scrolledStore);

  const scrollToTop = () => {
    window.scrollTo({
      behavior: "smooth",
      top: 0,
    });
  };

  if (!isScrolled) {
    return null;
  }

  return (
    <button
      type="button"
      className="fixed bottom-0 right-0 z-10 m-10 size-10 cursor-pointer opacity-20 transition-all duration-300 hover:opacity-75 focus:outline-none"
      title="Scroll To Top"
      onClick={scrollToTop}
    >
      <FaArrowAltCircleUp className="size-10" />
    </button>
  );
};

export default BackToTopButton;
