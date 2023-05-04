const Mode = require('frontmatter-markdown-loader/mode')
const markdownIt = require('markdown-it')
const markdownItHlJs = require('markdown-it-highlightjs')
const markdownItLA = require('markdown-it-link-attributes')
// https://blog.csdn.net/fanlehai/article/details/121347803
const uslug = require('uslug')
const uslugify = s => uslug(s, { spaces: true })
const markdownAnchor = require('markdown-it-anchor')
const markdownToc = require('markdown-it-toc-done-right')

module.exports = {
  publicPath: '/',
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.md$/,
          loader: 'frontmatter-markdown-loader',
          options: {
            mode: [Mode.VUE_COMPONENT],
            markdownIt: markdownIt({ html: true })
              .use(markdownItHlJs, { inline: true })
              .use(markdownItLA, {
                attrs: {
                  target: '_blank'
                }
              })
              .use(markdownAnchor, { permalink: true, permalinkBefore: true, permalinkSymbol: '§', slugify: uslugify })
              .use(markdownToc, { slugify: uslugify })
          }
        }
      ]
    }
  }
}
