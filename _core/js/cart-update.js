import $ from 'jquery';
import prestashop from 'prestashop';
import {refreshCheckoutPage} from './common';

export function runUpdateCart(event) {
  prestashop.cart = event.resp.cart;
  const getCartViewUrl = $('.js-cart').data('refresh-url');

  if (!getCartViewUrl) {
    return;
  }

  let requestData = {};

  if (event && event.reason) {
    requestData = {
      id_product_attribute: event.reason.idProductAttribute,
      id_product: event.reason.idProduct,
    };
  }

  $.post(getCartViewUrl, requestData)
    .then((resp) => {
      $(prestashop.selectors.cart.detailedTotals).replaceWith(
        resp.cart_detailed_totals,
      );
      $(prestashop.selectors.cart.summaryItemsSubtotal).replaceWith(
        resp.cart_summary_items_subtotal,
      );
      $(prestashop.selectors.cart.summarySubTotalsContainer).replaceWith(
        resp.cart_summary_subtotals_container,
      );
      $(prestashop.selectors.cart.summaryProducts).replaceWith(
        resp.cart_summary_products,
      );
      $(prestashop.selectors.cart.summaryTotals).replaceWith(
        resp.cart_summary_totals,
      );
      $(prestashop.selectors.cart.detailedActions).replaceWith(
        resp.cart_detailed_actions,
      );
      $(prestashop.selectors.cart.voucher).replaceWith(resp.cart_voucher);
      $(prestashop.selectors.cart.overview).replaceWith(resp.cart_detailed);
      $(prestashop.selectors.cart.summaryTop).replaceWith(
        resp.cart_summary_top,
      );

      $(prestashop.selectors.cart.productCustomizationId).val(0);

      $(prestashop.selectors.cart.lineProductQuantity).each(
        (index, input) => {
          const $input = $(input);
          $input.attr('value', $input.val());
        },
      );

      if ($(prestashop.selectors.checkout.cartPaymentStepRefresh).length) {
        // we get the refresh flag : on payment step we need to refresh page to be sure
        // amount is correctly updated on payment modules
        refreshCheckoutPage();
      }

      prestashop.emit('updatedCart', {eventType: 'updateCart', resp});
    })
    .fail((resp) => {
      prestashop.emit('handleError', {eventType: 'updateCart', resp});
    });
}
