const { withTamagui } = require('@tamagui/next-plugin')

const tamaguiPlugin = withTamagui({
  config: './tamagui.config.ts',
  components: ['tamagui'],
  importsWhitelist: ['constants.js', 'colors.js'],
  outputCSS: './src/app/tamagui.css',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = tamaguiPlugin(nextConfig)
