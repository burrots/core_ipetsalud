import $ from 'jquery';
import prestashop from 'prestashop';
import {psGetRequestParameter} from './common';

// Used to be able to abort request if user modify something
let currentRequest = null;

// Used to clearTimeout if user flood the product quantity input
let currentRequestDelayedId = null;

/**
 * Get product update URL from different
 * sources if needed (for compatibility)
 *
 * @return {Promise}
 */
function getProductUpdateUrl() {
  const dfd = $.Deferred();
  const $productActions = $(prestashop.selectors.product.actions);
  const $quantityWantedInput = $(prestashop.selectors.quantityWanted);

  if (
    prestashop !== null
    && prestashop.urls !== null
    && prestashop.urls.pages !== null
    && prestashop.urls.pages.product !== ''
    && prestashop.urls.pages.product !== null
  ) {
    dfd.resolve(prestashop.urls.pages.product);

    return dfd.promise();
  }
  const formData = {};

  $($productActions.find('form:first').serializeArray()).each((k, v) => {
    formData[v.name] = v.value;
  });

  $.ajax({
    url: $productActions.find('form:first').attr('action'),
    method: 'POST',
    data: {
      ajax: 1,
      action: 'productrefresh',
      quantity_wanted: $quantityWantedInput.val(),
      ...formData,
    },
    dataType: 'json',
    success(data) {
      const productUpdateUrl = data.productUrl;
      prestashop.page.canonical = productUpdateUrl;
      dfd.resolve(productUpdateUrl);
    },
    error(jqXHR, textStatus, errorThrown) {
      dfd.reject({
        jqXHR,
        textStatus,
        errorThrown,
      });
    },
  });

  return dfd.promise();
}

/**
 * Update the product html
 *
 * @param {string} event
 * @param {string} eventType
 * @param {string} updateUrl
 */
function updateProduct(event, eventType, updateUrl) {
    const $productActions = $(prestashop.selectors.product.actions);
    const $quantityWantedInput = $productActions.find(
      prestashop.selectors.quantityWanted,
    );
    const $form = $productActions.find('form:first');
    const formSerialized = $form.serialize();
    let preview = psGetRequestParameter('preview');
    let updateRatingEvent;
  
    if (typeof Event === 'function') {
      updateRatingEvent = new Event('updateRating');
    } else {
      updateRatingEvent = document.createEvent('Event');
      updateRatingEvent.initEvent('updateRating', true, true);
    }
  
    if (preview !== null) {
      const adtoken = psGetRequestParameter('adtoken');
      const idEmployee = psGetRequestParameter('id_employee');
      preview = `&preview=${preview}&adtoken=${adtoken}&id_employee=${idEmployee}`;
    } else {
      preview = '';
    }
  
    // Can not get product ajax url
    if (updateUrl === null) {
      prestashop.emit('showErrorNextToAddtoCartButton', {
          errorMessage: 'error updateUrl'
      });
  
      return;
    }
  
    // New request only if new value
    if (
      event
      && event.type === 'keyup'
      && $quantityWantedInput.val() === $quantityWantedInput.data('old-value')
    ) {
      return;
    }
    $quantityWantedInput.data('old-value', $quantityWantedInput.val());
  
    if (currentRequestDelayedId) {
      clearTimeout(currentRequestDelayedId);
    }
  
    // Most update need to occur (almost) instantly, but in some cases (like keyboard actions)
    // we need to delay the update a bit more
    let updateDelay = 30;
  
    if (eventType === 'updatedProductQuantity') {
      updateDelay = 750;
    }
  
    currentRequestDelayedId = setTimeout(() => {
      if (formSerialized === '') {
        return;
      }
  
      currentRequest = $.ajax({
        url:
          updateUrl
          + (updateUrl.indexOf('?') === -1 ? '?' : '&')
          + formSerialized
          + preview,
        method: 'POST',
        data: {
          quickview: $('.modal.quickview.in').length,
          ajax: 1,
          action: 'refresh',
          quantity_wanted:
            eventType === 'updatedProductCombination'
              ? $quantityWantedInput.attr('min')
              : $quantityWantedInput.val(),
        },
        dataType: 'json',
        beforeSend() {
          if (currentRequest !== null) {
            currentRequest.abort();
          }
        },
        error(jqXHR, textStatus) {
          if (
            textStatus !== 'abort'
            && $('section#main > .ajax-error').length === 0
          ) {
            prestashop.emit('showErrorNextToAddtoCartButton', {
                errorMessage: 'error updateUrl'
            });
          }
        },
        success(data) {
          // Avoid image to blink each time we modify the product quantity
          // Can not compare directly cause of HTML comments in data.
          const $newImagesContainer = $('<div>').append(
            data.product_cover_thumbnails,
          );
  
          // Used to avoid image blinking if same image = epileptic friendly
          if (
            $(prestashop.selectors.product.imageContainer).html()
            !== $newImagesContainer
              .find(prestashop.selectors.product.imageContainer)
              .html()
          ) {
            $(prestashop.selectors.product.imageContainer).replaceWith(
              data.product_cover_thumbnails,
            );
          }
          $(prestashop.selectors.product.prices)
            .first()
            .replaceWith(data.product_prices);
          $(prestashop.selectors.product.customization)
            .first()
            .replaceWith(data.product_customization);
  
          // refill customizationId input value when updating quantity or combination
          if (
            (eventType === 'updatedProductQuantity' || eventType === 'updatedProductCombination')
            && data.id_customization
          ) {
            $(prestashop.selectors.cart.productCustomizationId).val(data.id_customization);
          } else {
            $(prestashop.selectors.product.inputCustomization).val(0);
          }
  
          $(prestashop.selectors.product.variantsUpdate)
            .first()
            .replaceWith(data.product_variants);
          $(prestashop.selectors.product.discounts)
            .first()
            .replaceWith(data.product_discounts);
          $(prestashop.selectors.product.additionalInfos)
            .first()
            .replaceWith(data.product_additional_info);
          $(prestashop.selectors.product.details).replaceWith(
            data.product_details,
          );
          $(prestashop.selectors.product.flags)
            .first()
            .replaceWith(data.product_flags);
          replaceAddToCartSections(data);
          const minimalProductQuantity = parseInt(
            data.product_minimal_quantity,
            10,
          );
  
          document.dispatchEvent(updateRatingEvent);
  
          // Prevent quantity input from blinking with classic theme.
          if (
            !isNaN(minimalProductQuantity)
            && eventType !== 'updatedProductQuantity'
          ) {
            $quantityWantedInput.attr('min', minimalProductQuantity);
            $quantityWantedInput.val(minimalProductQuantity);
          }
          prestashop.emit('updatedProduct', data, $form.serializeArray());
        },
        complete() {
          currentRequest = null;
          currentRequestDelayedId = null;
        },
      });
    }, updateDelay);
  }

/**
 * Replace all "add to cart" sections but the quantity input
 * in order to keep quantity field intact i.e.
 *
 * @param {object} data of updated product and cat
 */
function replaceAddToCartSections(data) {
  let $productAddToCart = null;

  $(data.product_add_to_cart).each((index, value) => {
    if ($(value).hasClass('product-add-to-cart')) {
      $productAddToCart = $(value);

      return false;
    }

    return true;
  });

  if ($productAddToCart === null) {
    prestashop.emit('showErrorNextToAddtoCartButton', {
        errorMessage: 'error'
    });
  }
  const $addProductToCart = $(prestashop.selectors.product.addToCart);
  const productAvailabilitySelector = '.add';
  const productAvailabilityMessageSelector = '#product-availability';
  const productMinimalQuantitySelector = '.product-minimal-quantity';

  replaceAddToCartSection({
    $addToCartSnippet: $productAddToCart,
    $targetParent: $addProductToCart,
    targetSelector: productAvailabilitySelector,
  });

  replaceAddToCartSection({
    $addToCartSnippet: $productAddToCart,
    $targetParent: $addProductToCart,
    targetSelector: productAvailabilityMessageSelector,
  });

  replaceAddToCartSection({
    $addToCartSnippet: $productAddToCart,
    $targetParent: $addProductToCart,
    targetSelector: productMinimalQuantitySelector,
  });
}

/**
 * Find DOM elements and replace their content
 *
 * @param {object} replacement Data to be replaced on the current page
 */
function replaceAddToCartSection(replacement) {
  const destinationObject = $(
    replacement.$targetParent.find(replacement.targetSelector),
  );

  if (destinationObject.length <= 0) {
    return;
  }
  const replace = replacement.$addToCartSnippet.find(
    replacement.targetSelector,
  );

  if (replace.length > 0) {
    destinationObject.replaceWith(replace[0].outerHTML);
  } else {
    destinationObject.html('');
  }
}

export function runProductUpdate(args) {
    const {eventType} = args;
    const {event} = args;

    getProductUpdateUrl()
      .done((productUpdateUrl) => updateProduct(event, eventType, productUpdateUrl),
      )
      .fail(() => {
        if ($('section#main > .ajax-error').length === 0) {
          prestashop.emit('showErrorNextToAddtoCartButton', {
              errorMessage: 'error ProductUpdate'
          });
        }
      });
}
