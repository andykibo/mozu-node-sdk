/**
 * Sensible default configuration for a NodeJS, ArcJS, or other server env.
 * Includes assumptions that you'll have access to Tenant Service, etc.
 * Not appropriate for shopper or storefront use.
 */
module.exports = [
  require('./ensure-tenant-pod-url'),
  require('./ensure-pci-pod-url'),
  require('./ensure-developer-user-claims'),
  require('./ensure-admin-user-claims'),
  require('./ensure-app-claims')
];
