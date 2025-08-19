module.exports = {
  baseUrl: process.env.NODE_ENV === 'production' ? '/personal-site' : '',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
};