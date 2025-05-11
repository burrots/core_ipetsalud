import $ from 'jquery';

/**
 * Update address form on country change
 * Emit "addressFormUpdated" event
 */
function handleCountryChange(selectors) {
  $('body').on('change', selectors.country, () => {
    import(/* webpackChunkName: "address-country", webpackPrefetch: true */ './address-country')
      .then(({ runCountryChange }) => runCountryChange(selectors))
      .catch(console.error);
  });
}

$(document).ready(() => {
  handleCountryChange({
    country: '.js-country',
    address: '.js-address-form',
  });
});
