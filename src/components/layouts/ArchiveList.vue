<template>
  <section class="categories w-full lg:w-3/4">
    <HorizontalLine class="my-3" />
    <h1
      class="text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto"
    >
      Categories
    </h1>

    <HorizontalLine class="my-3" />

    <dl v-for="category in categories" :key="category.id">
      <dt>
        {{ category.title }}
      </dt>
      <dd>
        <ul v-for="post in filterByCategories(category.slug)" :key="post.id">
          <li>
            {{ post.title }}
          </li>
        </ul>
      </dd>
    </dl>
  </section>
</template>
