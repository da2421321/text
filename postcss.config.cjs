module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-pxtorem': {
      rootValue: 37.5, // 设计稿宽度/10，如设计稿375px则写37.5
      propList: ['*'],
      selectorBlackList: ['.norem'] // 过滤掉.norem开头的class，不进行rem转换
    },
  }
}