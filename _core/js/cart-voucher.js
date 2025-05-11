import $ from 'jquery';
import prestashop from 'prestashop';
import {refreshCheckoutPage} from './common';

export function runAddVoucher(event) {
  const $addVoucherForm = $(event.currentTarget);
  const getCartViewUrl = $addVoucherForm.attr('action');

  if ($addVoucherForm.find('[name=action]').length === 0) {
    $addVoucherForm.append(
      $('<input>', {type: 'hidden', name: 'ajax', value: 1}),
    );
  }
  if ($addVoucherForm.find('[name=action]').length === 0) {
    $addVoucherForm.append(
      $('<input>', {type: 'hidden', name: 'action', value: 'update'}),
    );
  }

  $.post(getCartViewUrl, $addVoucherForm.serialize(), null, 'json')
    .then((resp) => {
      if (resp.hasError) {
        $('.js-error')
          .show()
          .find('.js-error-text')
          .text(resp.errors[0]);

        return;
      }

      // Refresh cart preview
      prestashop.emit('updateCart', {
        reason: event.target.dataset,
        resp,
      });
    })
    .fail((resp) => {
      prestashop.emit('handleError', {eventType: 'updateCart', resp});
    });
}
