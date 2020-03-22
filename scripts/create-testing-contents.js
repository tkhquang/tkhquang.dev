const fs = require("fs");
const slugify = require("slugify");

class Category {
  constructor({ title }) {
    this.title = title;
    this.slug = slugify(title, {
      replacement: "-",
      remove: undefined,
      lower: true,
      strict: true
    });
  }
}

class Post {
  constructor({
    title,
    content,
    category,
    tags,
    description,
    published,
    cover_image
  }) {
    this.title = title;
    this.content = content;
    this.created_at = new Date().toISOString();
    this.updated_at = `""`;
    this.published = published;
    this.description = description;
    this.category = category;
    this.tags = tags;
    this.cover_image = cover_image;
    this.slug = slugify(title, {
      replacement: "-",
      remove: undefined,
      lower: true,
      strict: true
    });
  }
}

const tags = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum magna purus, dapibus a cursus ac, viverra sed velit.`
  .split(/(?:,|\s|\.)+/gi)
  .filter(tag => !!tag.trim());

const coverImages = [null, "/uploads/images/default.jpg"];

const categories = [
  "Engineering",
  "The Inner Crisis",
  "Story of My Life",
  "Other"
].map(category => new Category({ title: category }));

let posts = [];

for (let index = 0; index < 100; index++) {
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  posts.push(
    new Post({
      title: `"Post #${index + 1}"`,
      content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse at varius enim. Donec eleifend porttitor ipsum, a malesuada nisl porta id. Phasellus lacinia, est et tincidunt molestie, nulla augue blandit lectus, eget sollicitudin felis nulla efficitur ipsum. Interdum et malesuada fames ac ante ipsum primis in faucibus. In et lobortis nisi. Quisque porttitor placerat mauris eu faucibus. Cras nulla dui, sollicitudin at venenatis vel, gravida non massa.

Phasellus dictum at libero et pulvinar. Vestibulum tristique velit elementum arcu tempor tempor. Curabitur sagittis arcu arcu, eleifend vestibulum justo suscipit a. Sed quis risus et erat sagittis rhoncus. Cras ornare pellentesque elementum. Quisque posuere, arcu quis sollicitudin mollis, magna risus venenatis nunc, sed feugiat orci ante quis nisi. Aliquam vestibulum lacinia lorem quis sollicitudin. Nullam viverra purus et leo ornare, in imperdiet diam gravida. Maecenas mi lacus, pharetra eleifend euismod sed, tincidunt eget ante. Nunc sit amet tellus eget eros vulputate posuere et id est. Integer venenatis, diam sit amet interdum consectetur, felis nunc mollis erat, vitae feugiat velit metus sed ipsum. In ultrices leo vel euismod commodo. Sed vitae neque non tellus elementum vestibulum vitae eget tellus. Nulla porta, turpis vitae finibus imperdiet, odio sapien vulputate quam, non mattis ipsum est id tortor.

Fusce eget lorem eu urna imperdiet porttitor a id nunc. Integer sed vulputate lectus, ornare ornare ante. Fusce euismod, lacus a eleifend ullamcorper, risus felis commodo orci, non interdum turpis leo quis eros. In hac habitasse platea dictumst. Mauris commodo sem dui, hendrerit volutpat arcu malesuada vitae. Nunc aliquet quam nulla, ac malesuada eros malesuada eget. Donec tincidunt dolor tortor, quis finibus dolor blandit eu. Fusce dictum felis ac magna sollicitudin, id convallis metus auctor. Suspendisse in lectus est.

Etiam non felis at erat hendrerit blandit sit amet quis risus. Sed tempor diam sit amet nibh vestibulum, a pharetra eros elementum. Fusce lorem libero, lacinia nec viverra lacinia, pharetra eget ante. Donec interdum massa eu massa volutpat dictum. Vivamus ornare nisl lacinia nulla malesuada, sed iaculis diam imperdiet. Aliquam in justo libero. Fusce egestas dictum volutpat. Fusce elementum ut justo at tempus.

Praesent blandit, massa et malesuada euismod, libero augue ultrices ex, ac vulputate risus arcu sed lacus. Nulla molestie suscipit molestie. Ut nec dapibus augue. Praesent ac turpis posuere, convallis nisi id, porta mauris. Phasellus faucibus ex felis. Cras et dolor erat. Proin in enim efficitur, maximus nisi nec, consectetur sapien.
      `,
      category: categories[Math.floor(Math.random() * categories.length)].slug,
      tags: shuffled.slice(0, 3),
      description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse at varius enim. Donec eleifend porttitor ipsum, a malesuada nisl porta id. Phasellus lacinia, est et tincidunt molestie, nulla augue blandit lectus, eget sollicitudin felis nulla efficitur ipsum. Interdum et malesuada fames ac ante ipsum primis in faucibus. In et lobortis nisi. Quisque porttitor placerat mauris eu faucibus. Cras nulla dui, sollicitudin at venenatis vel, gravida non massa.`,
      published: true,
      cover_image: coverImages[Math.floor(Math.random() * coverImages.length)]
    })
  );
}

const createFile = (fileName, content) => {
  fs.writeFile(fileName, content, err => {
    if (err) {
      throw err;
    }

    console.log(`Created ${fileName}!`);
  });
};

!fs.existsSync("content/categories") && fs.mkdirSync("content/categories");
categories.forEach(category => {
  const content = `---
title: ${category.title}
slug: ${category.slug}
---
  `;
  createFile(`content/categories/${category.slug}.md`, content);
});

!fs.existsSync("content/posts") && fs.mkdirSync("content/posts");
posts.forEach(post => {
  const content = `---
title: ${post.title}
created_at: ${post.created_at}
updated_at: ${post.updated_at}
published: ${post.published}
tags:
  [${post.tags.map(tag => `"${tag}"`).toString()}]
category: ${post.category}
cover_image: ${post.cover_image}
description: ${post.description}
---
${post.content}
  `;
  createFile(`content/posts/${post.slug}.md`, content);
});
