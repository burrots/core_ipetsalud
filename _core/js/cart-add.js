import $ from 'jquery';
import prestashop from 'prestashop';

export function runAddCart(event) {
  const $form = $(event.currentTarget.form);
  const query = `${$form.serialize()}&add=1&action=update`;
  const actionURL = $form.attr('action');
  const addToCartButton = $(event.currentTarget);

  addToCartButton.prop('disabled', true);

  const isQuantityInputValid = ($input) => {
    let validInput = true;

    $input.each((index, input) => {
      const $currentInput = $(input);
      const minimalValue = parseInt($currentInput.attr('min'), 10);

      if (minimalValue && $currentInput.val() < minimalValue) {
        onInvalidQuantity($currentInput);
        validInput = false;
      }
    });

    return validInput;
  };

  let onInvalidQuantity = ($input) => {
    $input
      .parents(prestashop.selectors.product.addToCart)
      .first()
      .find(prestashop.selectors.product.minimalQuantity)
      .addClass('error');
    $input
      .parent()
      .find('label')
      .addClass('error');
  };

  const $quantityInput = $form.find('input[min]');

  if (!isQuantityInputValid($quantityInput)) {
    onInvalidQuantity($quantityInput);

    return;
  }

  $.post(actionURL, query, null, 'json')
    .then((resp) => {
      if (!resp.hasError) {
        prestashop.emit('updateCart', {
          reason: {
            idProduct: resp.id_product,
            idProductAttribute: resp.id_product_attribute,
            idCustomization: resp.id_customization,
            linkAction: 'add-to-cart',
            cart: resp.cart,
          },
          resp,
        });
      } else {
        prestashop.emit('handleError', {
          eventType: 'addProductToCart',
          resp,
        });
      }
    })
    .fail((resp) => {
      prestashop.emit('handleError', {
        eventType: 'addProductToCart',
        resp,
      });
    })
    .always(() => {
      setTimeout(() => {
        addToCartButton.prop('disabled', false);
      }, 1000);
    });
}
