import {
  AddEntryOptions,
  BaseCartOptions,
  CartModification,
} from '@spartacus/cart/base/root';
import {
  ActionFailPayload,
  ActionPayload,
  ActionSuccessPayload,
  StateUtils,
} from '@spartacus/core';
import { MULTI_CART_DATA } from '../multi-cart-state';

export const CART_ADD_ENTRY = '[Cart-entry] Add Entry';
export const CART_ADD_ENTRY_SUCCESS = '[Cart-entry] Add Entry Success';
export const CART_ADD_ENTRY_FAIL = '[Cart-entry] Add Entry Fail';
export const CART_REMOVE_ENTRY = '[Cart-entry] Remove Entry';
export const CART_REMOVE_ENTRY_SUCCESS = '[Cart-entry] Remove Entry Success';
export const CART_REMOVE_ENTRY_FAIL = '[Cart-entry] Remove Entry Fail';

export const CART_UPDATE_ENTRY = '[Cart-entry] Update Entry';
export const CART_UPDATE_ENTRY_SUCCESS = '[Cart-entry] Update Entry Success';
export const CART_UPDATE_ENTRY_FAIL = '[Cart-entry] Update Entry Fail';

export interface CartAddEntryPayload
  extends ActionPayload<BaseCartOptions<AddEntryOptions>> {}

export interface CartAddEntrySuccessPayload
  extends ActionSuccessPayload<
    BaseCartOptions<AddEntryOptions>,
    CartModification
  > {}

export interface CartAddEntryFailPayload
  extends ActionFailPayload<BaseCartOptions<AddEntryOptions>> {}

export class CartAddEntry extends StateUtils.EntityProcessesIncrementAction {
  readonly type = CART_ADD_ENTRY;
  constructor(public payload: CartAddEntryPayload) {
    super(MULTI_CART_DATA, payload.options.cartId);
  }
}

export class CartAddEntrySuccess extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_ADD_ENTRY_SUCCESS;
  constructor(public payload: CartAddEntrySuccessPayload) {
    super(MULTI_CART_DATA, payload.options.cartId);
  }
}

export class CartAddEntryFail extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_ADD_ENTRY_FAIL;
  constructor(public payload: CartAddEntryFailPayload) {
    super(MULTI_CART_DATA, payload.options.cartId);
  }
}

export class CartRemoveEntry extends StateUtils.EntityProcessesIncrementAction {
  readonly type = CART_REMOVE_ENTRY;
  constructor(
    public payload: { cartId: string; userId: string; entryNumber: string }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export class CartRemoveEntrySuccess extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_REMOVE_ENTRY_SUCCESS;
  constructor(
    public payload: { userId: string; cartId: string; entryNumber: string }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export class CartRemoveEntryFail extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_REMOVE_ENTRY_FAIL;
  constructor(
    public payload: {
      error: any;
      cartId: string;
      userId: string;
      entryNumber: string;
    }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export class CartUpdateEntry extends StateUtils.EntityProcessesIncrementAction {
  readonly type = CART_UPDATE_ENTRY;
  constructor(
    // TODO:#xxx - change to object
    public payload: {
      userId: string;
      cartId: string;
      entryNumber: string;
      quantity: number;
    }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export class CartUpdateEntrySuccess extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_UPDATE_ENTRY_SUCCESS;
  constructor(
    // TODO:#xxx - change to object
    public payload: {
      userId: string;
      cartId: string;
      entryNumber: string;
      quantity?: number;
    }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export class CartUpdateEntryFail extends StateUtils.EntityProcessesDecrementAction {
  readonly type = CART_UPDATE_ENTRY_FAIL;
  constructor(
    public payload: {
      error: any;
      userId: string;
      cartId: string;
      entryNumber: string;
      quantity?: number;
    }
  ) {
    super(MULTI_CART_DATA, payload.cartId);
  }
}

export type CartEntryAction =
  | CartAddEntry
  | CartAddEntrySuccess
  | CartAddEntryFail
  | CartRemoveEntry
  | CartRemoveEntrySuccess
  | CartRemoveEntryFail
  | CartUpdateEntry
  | CartUpdateEntrySuccess
  | CartUpdateEntryFail;
