import prestashop from 'prestashop';

export function runRefreshProduct(e, extraParameters) {
  let eventType = 'updatedProductCombination';

  if (typeof extraParameters !== 'undefined' && extraParameters.eventType) {
    // eslint-disable-next-line
      eventType = extraParameters.eventType;
  }

  prestashop.emit('updateProduct', {
    eventType,
    event: e,
    // Following variables are not used anymore, but kept for backward compatibility
    resp: {},
    reason: {
      productUrl: prestashop.urls.pages.product || '',
    },
  });
}
