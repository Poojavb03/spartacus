/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Params } from '@angular/router';
import {
  AbstractOrderEntryOwnerType,
  CartItemComponentOptions,
  OrderEntry,
} from '@spartacus/cart/base/root';

import { CommonConfigurator } from '../../core/model/common-configurator.model';
import { CommonConfiguratorUtilsService } from '../../shared/utils/common-configurator-utils.service';

@Component({
  selector: 'cx-configure-cart-entry',
  templateUrl: './configure-cart-entry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureCartEntryComponent {
  protected static readonly ERROR_MESSAGE_ENTRY_INCONSISTENT =
    "We don't expect order and quote code defined at the same time";
  @Input() cartEntry: OrderEntry;
  @Input() readOnly: boolean;
  @Input() msgBanner: boolean;
  @Input() disabled: boolean;
  @Input() options: CartItemComponentOptions;

  /**
   * Verifies whether the entry has any issues.
   *
   * @returns - whether there are any issues
   */
  hasIssues(): boolean {
    return this.commonConfigUtilsService.hasIssues(this.cartEntry);
  }

  /**
   * Determines owner for an entry (can be part of cart, order or quote)
   *
   * @returns - an owner type
   */
  getOwnerType(): CommonConfigurator.OwnerType {
    switch (this.options?.ownerType) {
      case AbstractOrderEntryOwnerType.ORDER: {
        return CommonConfigurator.OwnerType.ORDER_ENTRY;
      }
      case AbstractOrderEntryOwnerType.QUOTE: {
        return CommonConfigurator.OwnerType.QUOTE_ENTRY;
      }
      case AbstractOrderEntryOwnerType.SAVED_CART: {
        return CommonConfigurator.OwnerType.SAVED_CART_ENTRY;
      }
      default: {
        return CommonConfigurator.OwnerType.CART_ENTRY;
      }
    }
  }

  /**
   * Verifies whether the cart entry has an order code, retrieves a composed owner ID
   * and concatenates a corresponding entry number.
   *
   * @returns - an entry key
   */
  getEntityKey(): string {
    const ownerType = this.options.ownerType;
    const ownerDocumentIdNeeded: boolean =
      ownerType === AbstractOrderEntryOwnerType.ORDER ||
      ownerType === AbstractOrderEntryOwnerType.QUOTE ||
      ownerType === AbstractOrderEntryOwnerType.SAVED_CART;
    const entryNumber = this.cartEntry.entryNumber;
    if (entryNumber === undefined) {
      throw new Error('No entryNumber present in entry');
    }
    return ownerDocumentIdNeeded
      ? this.getConfiguratorOwnerId(this.options, entryNumber)
      : entryNumber.toString();
  }

  protected getConfiguratorOwnerId(
    options: CartItemComponentOptions,
    entryNumber: number
  ): string {
    const ownerId = options.ownerId;
    if (ownerId === undefined) {
      throw new Error(
        'Abstract order entry owner id must be provided in context'
      );
    }
    return this.commonConfigUtilsService.getComposedOwnerId(
      ownerId,
      entryNumber
    );
  }

  /**
   * Retrieves a corresponding route depending whether the configuration is read only or not.
   *
   * @returns - a route
   */
  getRoute(): string {
    const configuratorType = this.cartEntry.product?.configuratorType;
    return this.readOnly
      ? 'configureOverview' + configuratorType
      : 'configure' + configuratorType;
  }

  /**
   * Retrieves the state of the configuration.
   *
   *  @returns - 'true' if the configuration is read only, otherwise 'false'
   */
  getDisplayOnly(): boolean {
    return this.readOnly;
  }

  /**
   * Verifies whether the link to the configuration is disabled.
   *
   *  @returns - 'true' if the the configuration is not read only, otherwise 'false'
   */
  isDisabled() {
    return this.readOnly ? false : this.disabled;
  }

  /**
   * Retrieves the additional resolve issues accessibility description.
   *
   * @returns - If there is a 'resolve issues' link, the ID to the element with additional description will be returned.
   */
  getResolveIssuesA11yDescription(): string | undefined {
    const errorMsgId = 'cx-error-msg-' + this.cartEntry.entryNumber;
    return !this.readOnly && this.msgBanner ? errorMsgId : undefined;
  }

  /**
   * Compiles query parameters for the router link. 'resolveIssues' is only set if the component is
   * rendered in the context of the message banner, and if issues exist at all
   * @returns Query parameters
   */
  getQueryParams(): Params {
    return {
      forceReload: true,
      resolveIssues: this.msgBanner && this.hasIssues(),
    };
  }

  constructor(
    protected commonConfigUtilsService: CommonConfiguratorUtilsService
  ) {}
}
