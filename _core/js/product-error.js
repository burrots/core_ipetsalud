import prestashop from 'prestashop';

/**
 * @param {string} errorMessage
 */
function showErrorNextToAddtoCartButton(errorMessage) {
  showError(
    /* eslint-disable */
    $(
      ".quickview #product-availability, .page-product:not(.modal-open) .row #product-availability, .page-product:not(.modal-open) .product-container #product-availability"
    ),
    /* eslint-enable */
    errorMessage,
  );
}

/**
 * @param {jQuery} $container
 * @param {string} textError
 */
function showError($container, textError) {
  const $error = $(
    `<div class="alert alert-danger ajax-error" role="alert">${textError}</div>`,
  );
  $container.replaceWith($error);
}

export function runErrorProduct(event) {
    if (!event || !event.errorMessage) {
      return;
    }

    showErrorNextToAddtoCartButton(event.errorMessage);
}
