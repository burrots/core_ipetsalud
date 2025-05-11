/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */
import $ from 'jquery';
import prestashop from 'prestashop';
import {psGetRequestParameter} from './common';

// Check for popState event
let isOnPopStateEvent = false;

// Register form of first update
const firstFormData = [];

// Detect if the form has changed one time
let formChanged = false;

$(document).ready(() => {
  const $productActions = $(prestashop.selectors.product.actions);

  // Listen on all form elements + those who have a data-product-attribute
  $('body').on(
    'change touchspin.on.startspin',
    `${prestashop.selectors.product.variants} *[name]`,
    (e) => {
      formChanged = true;

      prestashop.emit('updateProduct', {
        eventType: 'updatedProductCombination',
        event: e,
        // Following variables are not used anymore, but kept for backward compatibility
        resp: {},
        reason: {
          productUrl: prestashop.urls.pages.product || '',
        },
      });
    },
  );

  // Stocking first form information
  $($productActions.find('form:first').serializeArray()).each(
    (k, {value, name}) => {
      firstFormData.push({value, name});
    },
  );

  window.addEventListener('popstate', (event) => {
    isOnPopStateEvent = true;

    if (
      (!event.state
        || (event.state && event.state.form && event.state.form.length === 0))
      && !formChanged
    ) {
      return;
    }

    const $form = $(prestashop.selectors.product.actions).find('form:first');

    if (event.state && event.state.form) {
      event.state.form.forEach((pair) => {
        $form.find(`[name="${pair.name}"]`).val(pair.value);
      });
    } else {
      firstFormData.forEach((pair) => {
        $form.find(`[name="${pair.name}"]`).val(pair.value);
      });
    }

    prestashop.emit('updateProduct', {
      eventType: 'updatedProductCombination',
      event,
      // Following variables are not used anymore, but kept for backward compatibility
      resp: {},
      reason: {
        productUrl: prestashop.urls.pages.product || '',
      },
    });
  });

  /**
   * Button has been removed on classic theme, but event triggering has been kept for compatibility
   */
  $('body').on(
    'click',
    prestashop.selectors.product.refresh,
    (e, extraParameters) => {
      e.preventDefault();
      import(/* webpackChunkName: "product-refresh", webpackPrefetch: true */ './product-refresh')
        .then(({ runRefreshProduct }) => runRefreshProduct(e, extraParameters))
        .catch(console.error);
    },
  );

  // Refresh all the product content
  prestashop.on('updateProduct', (args) => {
    import(/* webpackChunkName: "product-update", webpackPrefetch: true */ './product-update')
      .then(({ runProductUpdate }) => runProductUpdate(args))
      .catch(console.error);
  });

  prestashop.on('updatedProduct', (args, formData) => {
    if (!args.product_url || !args.id_product_attribute) {
      return;
    }

    /*
     * If quickview modal is present we are not on product page, so
     * we don't change the url nor title
     */
    const quickView = $('.modal.quickview');

    if (quickView.length) {
      return;
    }

    let pageTitle = document.title;

    if (args.product_title) {
      pageTitle = args.product_title;
      $(document).attr('title', pageTitle);
    }

    if (!isOnPopStateEvent) {
      window.history.pushState(
        {
          id_product_attribute: args.id_product_attribute,
          form: formData,
        },
        pageTitle,
        args.product_url,
      );
    }

    isOnPopStateEvent = false;
  });

  prestashop.on('updateCart', (event) => {
    if (!event || !event.reason || event.reason.linkAction !== 'add-to-cart') {
      return;
    }
    const $quantityWantedInput = $('#quantity_wanted');
    // Force value to 1, it will automatically trigger updateProduct and reset the appropriate min value if needed
    $quantityWantedInput.val(1);
  });

  prestashop.on('showErrorNextToAddtoCartButton', (event) => {
      import(/* webpackChunkName: "product-error", webpackPrefetch: true */ './product-error')
        .then(({ runErrorProduct }) => runErrorProduct(event))
        .catch(console.error);
  });
});
