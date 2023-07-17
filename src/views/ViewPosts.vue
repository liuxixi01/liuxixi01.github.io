<template>
  <div class="container">
    <!-- 博客汇总页 -->
    <h1 class="text-center">Posts</h1>
    <hr />
    <div v-if="getPosts().length">
      <br />
      <div class="grid-6_xs-1_sm-2_md-2">
        <div
          :key="index"
          v-for="(post, index) in getPosts()"
          class="col center"
        >
          <PostCard :post="post" />
        </div>
      </div>
      <div class="center con-pagination">
        <vs-pagination v-model="curPage" :length="allPosts.length" not-margin progress />
      </div>
    </div>
    <Nothing v-else />
  </div>
</template>

<script>
import PostCard from '@/components/PostCard.vue'
import Nothing from '@/components/Nothing.vue'

export default {
  name: 'ViewPosts',
  components: {
    PostCard,
    Nothing
  },
  data: function () {
    return {
      allPosts: this.getConfig('posts.json').posts,
      curPage: 1,
      config: this.getConfig().config
    }
  },
  mounted: function () {
    this.changeTitle('Posts')
    const posts = this.allPosts.reverse()
    this.allPosts = []
    for (let i = 0; i < posts.length; i += 12) this.allPosts.push(posts.slice(i, i + 12)) // pagination, 6 posts per page
    // console.log(this.allPosts)
  },
  methods: {
    getPosts: function () {
      try {
        return this.allPosts[this.curPage - 1].slice()
      } catch (e) {
        return []
      }
    }
  }
}
</script>
