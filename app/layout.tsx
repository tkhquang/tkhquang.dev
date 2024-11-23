import type { Metadata } from "next";
import { Montserrat, Merriweather } from "next/font/google";

import "@/assets/styles/index.scss";
import classNames from "classnames";

import { Header, Main, Footer } from "@/components/layout";

const montserrat = Montserrat({ subsets: ["latin"] });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Aleks's Portfolio",
  description:
    "Highly motivated, self-starting developer with a good understanding of HTML, CSS, JavaScript and its modern libraries and frameworks such as React, Vue, seeking to launch a career building web applications and services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={classNames("flex flex-col min-h-screen")}
        data-theme="dark"
      >
        <Header />
        <Main className=" flex-1">{children}</Main>
        <Footer />
      </body>
    </html>
  );
}
