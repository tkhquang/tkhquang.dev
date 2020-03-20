---
title: Configuring Gridsome for using Tailwind and PurgeCSS without any Plugins
created_at: 2020-03-15T07:56:14.483Z
updated_at: 2020-03-19T07:00:14.617Z
published: true
tags:
  - tech
cover_image: /uploads/images/gridsome.jpg
description: Setting up TailwindCSS and PurgeCSS for Gridsome without any plugins
---
**Setting up TailwindCSS and PurgeCSS for Gridsome without any plugins**

## Prerequisite

First thing first, of course you should have a working Gridsome project.
Lucky for us, the set up for a Gridsome project is quite simple and very straight forward, just make sure you have Node.js and a Package Manager (Gridsome recommends Yarn) installed on your computer.

### Install Gridsome CLI tool

 ```bash{codeTitle: "<strong>Yarn</strong>"}
yarn global add @gridsome/cli
```

or

```bash{codeTitle: "<strong>npm</strong>"}
npm install --global @gridsome/cli
```

### Create a Gridsome project

```bash{codeTitle: "Kickstarting a new project"}
gridsome create my-gridsome-site
cd my-gridsome-site
```

Now you can run `gridsome develop` start local dev server at `http://localhost:8080` or `gridsome build` to generate static files in a `/dist` folder.

## Dependencies

Next, we will install the necessary packages in our project.

```bash{codeTitle: "<strong>npm</strong>"}
npm install tailwindcss
npm install -D @fullhuman/postcss-purgecss postcss-import
```

or

```bash{codeTitle: "<strong>Yarn</strong>"}
yarn add tailwindcss
yarn add -D @fullhuman/postcss-purgecss postcss-import
```

One of the most useful features preprocessors offer is the ability to organize your CSS into multiple files and combine them at build time by processing @import statements in advance, instead of in the browser. The canonical plugin for handling this is `postcss-import`.

You can just skip them if you have no intention to include them in your project.

## Create a Tailwind Configuration File

The following command will create a minimal `tailwind.config.js` file at the root of your project.

```bash
npx tailwind init
```

This instead will create a full `tailwind.config.js` file at the root of your project. I usually go with this. So that I can take a closer look at the configurations and how things seem to work.

```bash
npx tailwind init --full
```

## Importing Tailwind

 ```css{codeTitle: "In <strong>src/assets/styles/index.css</strong>"}
/* src/assets/styles/index.css */

@import "tailwindcss/base";
/* Any of your own custom base styles go here */

@import "tailwindcss/components";
/* Any of your own custom component styles go here */

@import "tailwindcss/utilities";
/* Any of your own custom utilities go here */
```

```js{codeTitle: "In <strong>src/main.js</strong>"}
import "~/assets/styles/index.css";
```

## Gridsome Configuration

```js{codeTitle: "In <strong>gridsome.config.js</strong>"}
 const purgecss = require("@fullhuman/postcss-purgecss")({
   content: [
     "./src/**/*.vue",
     "./src/**/*.js",
     "./src/**/*.jsx",
     "./src/**/*.html",
     "./src/**/*.pug",
     "./src/**/*.md"
   ],
   whitelist: [
     "body",
     "html"
   ],
   whitelistPatterns: [
     /^g-image*/,
   ],
   defaultExtractor: content => {
     return content.match(/[\w-/:]+(?<!:)/g) || [];
   }
 });
 
 module.exports = {
  // ...Rest of the code
   css: {
     loaderOptions: {
       postcss: {
         // options here will be passed to postcss-loader
         plugins: [
           require("postcss-import"),
           require("tailwindcss")("./tailwind.config.js"),
           require("autoprefixer"),
           ...(process.env.NODE_ENV === "production" ? [purgecss] : [])
         ]
       }
     }
   }
 };
 ```

Now you can run `gridsome develop` and `gridsome build` to verify that it works.
Congratulations, you've just made Tailwind and PurgeCSS work with Gridsome without using any Gridsome plugins.
