import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  GlobalMessageService,
  GlobalMessageType,
  I18nTestingModule,
  Price,
  TranslationService,
} from '@spartacus/core';
import {
  Quote,
  QuoteAction,
  QuoteActionType,
  QuoteFacade,
  QuoteRoleType,
  QuoteState,
} from '@spartacus/quote/root';

import { ElementRef, ViewContainerRef } from '@angular/core';
import { LAUNCH_CALLER, LaunchDialogService } from '@spartacus/storefront';
import { BehaviorSubject, EMPTY, NEVER, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { createEmptyQuote } from '../../../core/testing/quote-test-utils';
import {
  ConfirmActionDialogMappingConfig,
  QuoteUIConfig,
} from '../../config/quote-ui.config';
import { ConfirmationContext } from '../confirm-dialog/quote-actions-confirm-dialog.model';
import { CommonQuoteTestUtilsService } from '../../testing/common-quote-test-utils.service';
import { QuoteActionsByRoleComponent } from './quote-actions-by-role.component';
import createSpy = jasmine.createSpy;
import { ActiveCartFacade, Cart } from '@spartacus/cart/base/root';

const mockCartId = '1234';
const mockCode = '3333';
const threshold = 20;
const totalPrice: Price = { value: threshold + 1 };

const mockQuote: Quote = {
  ...createEmptyQuote(),
  allowedActions: [
    { type: QuoteActionType.REQUOTE, isPrimary: true },
    { type: QuoteActionType.EDIT, isPrimary: false },
  ],
  state: QuoteState.BUYER_DRAFT,
  cartId: mockCartId,
  code: mockCode,
  threshold: threshold,
  totalPrice: totalPrice,
};

const testMappings: ConfirmActionDialogMappingConfig = {
  BUYER_OFFER: {
    EDIT: {
      i18nKeyPrefix: 'quote.actions.confirmDialog.buyer_offer.edit',
      showWarningNote: true,
      showExpirationDate: true,
      showSuccessMessage: false,
      showOnlyWhenCartIsNotEmpty: false,
    },
  },
  BUYER: {
    SUBMIT: {
      i18nKeyPrefix: 'quote.actions.confirmDialog.buyer.submit',
      showWarningNote: false,
      showExpirationDate: false,
      showSuccessMessage: true,
      showOnlyWhenCartIsNotEmpty: false,
    },
  },
  EXPIRED: {
    REQUOTE: {
      i18nKeyPrefix: 'quote.actions.confirmDialog.expired.requote',
      showWarningNote: true,
      showExpirationDate: false,
      showSuccessMessage: false,
      showOnlyWhenCartIsNotEmpty: false,
    },
  },
  ALL: {
    EDIT: {
      i18nKeyPrefix: 'quote.confirmActionDialog.all.edit',
      showWarningNote: true,
      showExpirationDate: false,
      showSuccessMessage: false,
      showOnlyWhenCartIsNotEmpty: true,
    },
  },
};

const mockQuoteDetails$ = new BehaviorSubject<Quote>(mockQuote);

const currentCart: Partial<Cart> = {};

let dialogClose$: BehaviorSubject<any | undefined>;

class MockLaunchDialogService implements Partial<LaunchDialogService> {
  closeDialog(reason: any): void {
    dialogClose$.next(reason);
  }

  openDialog(
    _caller: LAUNCH_CALLER,
    _openElement?: ElementRef,
    _vcr?: ViewContainerRef,
    _data?: any
  ) {
    return of();
  }

  get dialogClose() {
    return dialogClose$.asObservable();
  }
}

class MockCommerceQuotesFacade implements Partial<QuoteFacade> {
  getQuoteDetails(): Observable<Quote> {
    return mockQuoteDetails$.asObservable();
  }

  performQuoteAction(
    _quote: Quote,
    _quoteAction: QuoteActionType
  ): Observable<unknown> {
    return EMPTY;
  }

  requote = createSpy();
}

class MockTranslationService implements Partial<TranslationService> {
  translate(key: string): Observable<string> {
    return of(key);
  }
}

class MockGlobalMessageService {
  add(): void {}
}

class MockActiveCartFacade implements Partial<ActiveCartFacade> {
  getActive(): Observable<Cart> {
    return of(currentCart);
  }
}

describe('QuoteActionsByRoleComponent', () => {
  let fixture: ComponentFixture<QuoteActionsByRoleComponent>;
  let htmlElem: HTMLElement;
  let component: QuoteActionsByRoleComponent;
  let launchDialogService: LaunchDialogService;
  let facade: QuoteFacade;
  let globalMessageService: GlobalMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [I18nTestingModule],
      declarations: [QuoteActionsByRoleComponent],
      providers: [
        {
          provide: QuoteFacade,
          useClass: MockCommerceQuotesFacade,
        },
        { provide: GlobalMessageService, useClass: MockGlobalMessageService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: LaunchDialogService, useClass: MockLaunchDialogService },
        {
          provide: QuoteUIConfig,
          useValue: {
            quote: { confirmActionDialogMapping: testMappings },
          },
        },
        { provide: ActiveCartFacade, useClass: MockActiveCartFacade },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoteActionsByRoleComponent);
    htmlElem = fixture.nativeElement;
    component = fixture.componentInstance;
    launchDialogService = TestBed.inject(LaunchDialogService);
    facade = TestBed.inject(QuoteFacade);
    globalMessageService = TestBed.inject(GlobalMessageService);
    mockQuoteDetails$.next(mockQuote);
    dialogClose$ = new BehaviorSubject<any | undefined>(undefined);
  });

  it('should create component', () => {
    expect(component).toBeDefined();
    expect(facade).toBeDefined();
  });

  describe('Ghost animation', () => {
    it('should render view for ghost animation', () => {
      component.quoteDetails$ = NEVER;
      fixture.detectChanges();

      CommonQuoteTestUtilsService.expectElementPresent(
        expect,
        htmlElem,
        '.cx-ghost-actions'
      );

      CommonQuoteTestUtilsService.expectNumberOfElementsPresent(
        expect,
        htmlElem,
        '.cx-ghost-button',
        3
      );
    });
  });

  it('should read quote details state', (done) => {
    component.quoteDetails$.pipe(take(1)).subscribe((state) => {
      expect(state).toEqual(mockQuote);
      done();
    });
  });

  it('should open confirmation dialog when action is SUBMIT', () => {
    spyOn(launchDialogService, 'openDialog');
    const quoteForSubmitAction: Quote = {
      ...mockQuote,
      allowedActions: [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.CANCEL, isPrimary: false },
      ],
    };
    const confirmationContextForSubmitAction: ConfirmationContext = {
      quote: quoteForSubmitAction,
      title: 'quote.actions.confirmDialog.buyer.submit.title',
      confirmNote: 'quote.actions.confirmDialog.buyer.submit.confirmNote',
      successMessage: 'quote.actions.confirmDialog.buyer.submit.successMessage',
      a11y: {
        close: 'quote.actions.confirmDialog.buyer.submit.a11y.close',
      },
    };
    mockQuoteDetails$.next(quoteForSubmitAction);
    fixture.detectChanges();
    component.onClick(
      QuoteActionType.SUBMIT,
      quoteForSubmitAction,
      currentCart
    );
    expect(launchDialogService.openDialog).toHaveBeenCalledWith(
      LAUNCH_CALLER.ACTION_CONFIRMATION,
      component.element,
      component['viewContainerRef'],
      { confirmationContext: confirmationContextForSubmitAction }
    );
  });

  it('should open confirmation dialog when action is EDIT and state is BUYER_OFFER', () => {
    spyOn(launchDialogService, 'openDialog');
    const quoteInBuyerOfferState: Quote = {
      ...mockQuote,
      allowedActions: [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.CANCEL, isPrimary: false },
        { type: QuoteActionType.EDIT, isPrimary: false },
      ],
      state: QuoteState.BUYER_OFFER,
    };
    const confirmationContextForEditAction: ConfirmationContext = {
      quote: quoteInBuyerOfferState,
      title: 'quote.actions.confirmDialog.buyer_offer.edit.title',
      confirmNote: 'quote.actions.confirmDialog.buyer_offer.edit.confirmNote',
      warningNote: 'quote.actions.confirmDialog.buyer_offer.edit.warningNote',
      validity: 'quote.actions.confirmDialog.validity',
      a11y: {
        close: 'quote.actions.confirmDialog.buyer_offer.edit.a11y.close',
      },
    };
    mockQuoteDetails$.next(quoteInBuyerOfferState);
    fixture.detectChanges();
    component.onClick(
      QuoteActionType.EDIT,
      quoteInBuyerOfferState,
      currentCart
    );
    expect(launchDialogService.openDialog).toHaveBeenCalledWith(
      LAUNCH_CALLER.ACTION_CONFIRMATION,
      component.element,
      component['viewContainerRef'],
      { confirmationContext: confirmationContextForEditAction }
    );
  });

  it('should not open confirmation dialog when action is CANCEL and state is BUYER_DRAFT', () => {
    spyOn(launchDialogService, 'openDialog');
    const quoteInBuyerDraftState: Quote = {
      ...mockQuote,
      allowedActions: [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.CANCEL, isPrimary: false },
        { type: QuoteActionType.EDIT, isPrimary: false },
      ],
      state: QuoteState.BUYER_DRAFT,
    };
    mockQuoteDetails$.next(quoteInBuyerDraftState);
    fixture.detectChanges();
    component.onClick(
      QuoteActionType.CANCEL,
      quoteInBuyerDraftState,
      currentCart
    );
    expect(launchDialogService.openDialog).toHaveBeenCalledTimes(0);
  });

  it('should open confirmation dialog when action is REQUOTE and state is EXPIRED', () => {
    spyOn(launchDialogService, 'openDialog');
    const expiredQuote: Quote = {
      ...mockQuote,
      allowedActions: [{ type: QuoteActionType.REQUOTE, isPrimary: true }],
      state: QuoteState.EXPIRED,
    };
    const confirmationContextForRequoteAction: ConfirmationContext = {
      quote: expiredQuote,
      title: 'quote.actions.confirmDialog.expired.requote.title',
      confirmNote: 'quote.actions.confirmDialog.expired.requote.confirmNote',
      warningNote: 'quote.actions.confirmDialog.expired.requote.warningNote',
      a11y: {
        close: 'quote.actions.confirmDialog.expired.requote.a11y.close',
      },
    };
    mockQuoteDetails$.next(expiredQuote);
    fixture.detectChanges();

    component.onClick(QuoteActionType.REQUOTE, expiredQuote, currentCart);
    expect(launchDialogService.openDialog).toHaveBeenCalledWith(
      LAUNCH_CALLER.ACTION_CONFIRMATION,
      component.element,
      component['viewContainerRef'],
      { confirmationContext: confirmationContextForRequoteAction }
    );
  });

  describe('Threshold check', () => {
    const allowedActionsSubmit = [
      { type: QuoteActionType.SUBMIT, isPrimary: true },
    ];
    const quoteFailingThreshold: Quote = {
      ...mockQuote,
      totalPrice: { value: threshold - 1 },
      allowedActions: allowedActionsSubmit,
    };
    const submittableQuote: Quote = {
      ...mockQuote,
      allowedActions: allowedActionsSubmit,
    };
    const cancellableQuote: Quote = {
      ...quoteFailingThreshold,
      allowedActions: [{ type: QuoteActionType.CANCEL, isPrimary: true }],
    };

    it('should let submit button enabled if threshold is met', () => {
      mockQuoteDetails$.next(submittableQuote);
      fixture.detectChanges();
      CommonQuoteTestUtilsService.expectElementNotToContainAttribute(
        expect,
        htmlElem,
        '.btn:first-child',
        'disabled'
      );
    });

    it('should let submit button enabled if threshold is not specified', () => {
      mockQuote.threshold = undefined;
      mockQuoteDetails$.next(submittableQuote);
      fixture.detectChanges();
      CommonQuoteTestUtilsService.expectElementNotToContainAttribute(
        expect,
        htmlElem,
        '.btn:first-child',
        'disabled'
      );
    });

    it('should disable submit button if threshold is not met and raise message', () => {
      spyOn(globalMessageService, 'add').and.callThrough();
      mockQuoteDetails$.next(quoteFailingThreshold);
      fixture.detectChanges();

      CommonQuoteTestUtilsService.expectElementToContainAttribute(
        expect,
        htmlElem,
        '.btn:first-child',
        'disabled'
      );
      expect(globalMessageService.add).toHaveBeenCalled();
    });

    it('should disable submit button if total price value is not provided', () => {
      quoteFailingThreshold.totalPrice.value = undefined;
      mockQuoteDetails$.next(quoteFailingThreshold);
      fixture.detectChanges();

      CommonQuoteTestUtilsService.expectElementToContainAttribute(
        expect,
        htmlElem,
        '.btn:first-child',
        'disabled'
      );
    });

    it('should not touch buttons other than submit', () => {
      mockQuoteDetails$.next(cancellableQuote);
      fixture.detectChanges();

      CommonQuoteTestUtilsService.expectElementNotToContainAttribute(
        expect,
        htmlElem,
        '.btn:first-child',
        'disabled'
      );
    });

    it('should not raise message in case threshold not met and submit action not present', () => {
      spyOn(globalMessageService, 'add').and.callThrough();
      mockQuoteDetails$.next(cancellableQuote);
      fixture.detectChanges();

      expect(globalMessageService.add).toHaveBeenCalledTimes(0);
    });
  });

  it('should perform quote action when action is SUBMIT and confirm dialogClose reason is yes', () => {
    spyOn(facade, 'performQuoteAction').and.callThrough();
    const newMockQuoteWithSubmitAction: Quote = {
      ...mockQuote,
      allowedActions: [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.CANCEL, isPrimary: false },
      ],
    };
    mockQuoteDetails$.next(newMockQuoteWithSubmitAction);
    fixture.detectChanges();

    component.onClick(
      QuoteActionType.SUBMIT,
      newMockQuoteWithSubmitAction,
      currentCart
    );
    launchDialogService.closeDialog('yes');
    expect(facade.performQuoteAction).toHaveBeenCalledWith(
      newMockQuoteWithSubmitAction,
      QuoteActionType.SUBMIT
    );
  });

  it("should click on 'CANCEL' button", () => {
    spyOn(facade, 'performQuoteAction').and.callThrough();
    const newMockQuoteWithSubmitAction: Quote = {
      ...mockQuote,
      allowedActions: [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.CANCEL, isPrimary: false },
      ],
    };
    mockQuoteDetails$.next(newMockQuoteWithSubmitAction);
    fixture.detectChanges();
    const editButton = CommonQuoteTestUtilsService.getHTMLElement(
      htmlElem,
      '.btn-secondary'
    );
    editButton.click();
    expect(facade.performQuoteAction).toHaveBeenCalledWith(
      newMockQuoteWithSubmitAction,
      QuoteActionType.CANCEL
    );
  });

  it("should click on 'REQUOTE' button", () => {
    spyOn(facade, 'performQuoteAction').and.callThrough();
    fixture.detectChanges();
    const requoteButton = CommonQuoteTestUtilsService.getHTMLElement(
      htmlElem,
      '.btn-primary'
    );
    requoteButton.click();
    expect(facade.requote).toHaveBeenCalledWith(mockQuote.code);
  });

  describe('isConfirmationPopupRequired', () => {
    it('should return true if role derived from state and action match', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.SUBMIT,
          QuoteState.BUYER_DRAFT,
          false
        )
      ).toBe(true);
    });
    it('should return true if state and action match', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.EDIT,
          QuoteState.BUYER_OFFER,
          false
        )
      ).toBe(true);
    });
    it('should return true for action matches for ALL role when cart is empty', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.EDIT,
          QuoteState.BUYER_DRAFT,
          false
        )
      ).toBe(true);
    });
    it('should return false for action matches for ALL role when cart is not empty', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.EDIT,
          QuoteState.BUYER_DRAFT,
          true
        )
      ).toBe(false);
    });
    it('should return false if action does not match', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.CHECKOUT,
          QuoteState.BUYER_DRAFT,
          false
        )
      ).toBe(false);
    });
    it('should return false if state does not match', () => {
      expect(
        component['isConfirmationDialogRequired'](
          QuoteActionType.SUBMIT,
          QuoteState.CANCELLED,
          false
        )
      ).toBe(false);
    });
  });

  describe('getDialogConfig', () => {
    it('should throw an error if state/action are not matching', () => {
      expect(() =>
        component['getDialogConfig'](
          QuoteActionType.ORDER,
          QuoteState.BUYER_DRAFT
        )
      ).toThrow();
    });
    it('should return configured config if state/action are matching', () => {
      expect(
        component['getDialogConfig'](
          QuoteActionType.EDIT,
          QuoteState.BUYER_OFFER
        )
      ).toEqual({
        i18nKeyPrefix: 'quote.actions.confirmDialog.buyer_offer.edit',
        showWarningNote: true,
        showExpirationDate: true,
        showSuccessMessage: false,
        showOnlyWhenCartIsNotEmpty: false,
      });
    });
    it('should return configured config if action with ALL role is matching', () => {
      expect(
        component['getDialogConfig'](
          QuoteActionType.EDIT,
          QuoteState.BUYER_DRAFT
        )
      ).toEqual({
        i18nKeyPrefix: 'quote.confirmActionDialog.all.edit',
        showWarningNote: true,
        showExpirationDate: false,
        showSuccessMessage: false,
        showOnlyWhenCartIsNotEmpty: true,
      });
    });
  });

  describe('handleConfirmationDialogClose', () => {
    let context: ConfirmationContext;
    beforeEach(() => {
      spyOn(facade, 'performQuoteAction').and.callThrough();
      spyOn(globalMessageService, 'add').and.callThrough();
      context = {
        quote: mockQuote,
        title: 'title',
        confirmNote: 'confirmNote',
        successMessage: 'successMessage',
        a11y: {
          close: 'A11y text for close modal',
        },
      };
    });

    it("should do nothing if dialog was closed selecting 'no'", () => {
      component['handleConfirmationDialogClose'](
        QuoteActionType.SUBMIT,
        context
      );
      launchDialogService.closeDialog('no');
      expect(facade.performQuoteAction).not.toHaveBeenCalled();
      expect(globalMessageService.add).not.toHaveBeenCalled();
    });

    it("should perform quote action if dialog was closed selecting 'yes'", () => {
      context.successMessage = undefined;
      component['handleConfirmationDialogClose'](QuoteActionType.EDIT, context);
      launchDialogService.closeDialog('yes');
      expect(facade.performQuoteAction).toHaveBeenCalledWith(
        mockQuote,
        QuoteActionType.EDIT
      );
      expect(globalMessageService.add).not.toHaveBeenCalled();
    });

    it("should perform quote action once if dialog was closed a few times selecting 'no', before finally selecting 'yes'", () => {
      context.successMessage = undefined;
      component['handleConfirmationDialogClose'](QuoteActionType.EDIT, context);
      launchDialogService.closeDialog('no');
      component['handleConfirmationDialogClose'](QuoteActionType.EDIT, context);
      launchDialogService.closeDialog('yes');
      expect(facade.performQuoteAction).toHaveBeenCalledTimes(1);
      expect(globalMessageService.add).not.toHaveBeenCalled();
    });

    it("should perform quote action if dialog was closed selecting 'yes' and display the given success message", () => {
      component['handleConfirmationDialogClose'](
        QuoteActionType.SUBMIT,
        context
      );
      launchDialogService.closeDialog('yes');
      expect(facade.performQuoteAction).toHaveBeenCalledWith(
        mockQuote,
        QuoteActionType.SUBMIT
      );
      expect(globalMessageService.add).toHaveBeenCalledWith(
        { key: 'successMessage' },
        GlobalMessageType.MSG_TYPE_CONFIRMATION
      );
    });
  });

  describe('getMessageType', () => {
    it('should return INFO for reject action', () => {
      expect(component['getMessageType'](QuoteActionType.REJECT)).toBe(
        GlobalMessageType.MSG_TYPE_INFO
      );
    });
    it('should return INFO for cancel action', () => {
      expect(component['getMessageType'](QuoteActionType.CANCEL)).toBe(
        GlobalMessageType.MSG_TYPE_INFO
      );
    });
    it('should return CONFIRMATION for submit action', () => {
      expect(component['getMessageType'](QuoteActionType.SUBMIT)).toBe(
        GlobalMessageType.MSG_TYPE_CONFIRMATION
      );
    });
  });

  describe('getButtonStyle', () => {
    let allowedActions: QuoteAction[];
    beforeEach(() => {
      allowedActions = [
        { type: QuoteActionType.SUBMIT, isPrimary: true },
        { type: QuoteActionType.EDIT, isPrimary: false },
        { type: QuoteActionType.CANCEL, isPrimary: false },
      ];
    });
    it("should return 'btn-primary' style for action marked as primary", () => {
      expect(
        component.getButtonStyle(allowedActions, {
          type: QuoteActionType.SUBMIT,
          isPrimary: true,
        })
      ).toEqual('btn-primary');
    });
    it("should return 'btn-secondary' style for action marked as non-primary", () => {
      expect(
        component.getButtonStyle(allowedActions, {
          type: QuoteActionType.SUBMIT,
          isPrimary: false,
        })
      ).toEqual('btn-secondary');
    });
    it("should return 'btn-secondary' style for cancel-action if there are only 2 actions", () => {
      expect(
        component.getButtonStyle(allowedActions.slice(1), {
          type: QuoteActionType.CANCEL,
          isPrimary: false,
        })
      ).toEqual('btn-secondary');
    });
    it("should return 'btn-tertiary style for cancel-action if there are more than 2 actions", () => {
      expect(
        component.getButtonStyle(allowedActions, {
          type: QuoteActionType.CANCEL,
          isPrimary: false,
        })
      ).toEqual('btn-tertiary');
    });
  });

  describe('stateToRoleTypeForDialogConfig', () => {
    it('should return buyer-role', () => {
      expect(
        component['stateToRoleTypeForDialogConfig'](QuoteState.BUYER_DRAFT)
      ).toBe(QuoteRoleType.BUYER);
    });
    it('should return seller-role', () => {
      expect(
        component['stateToRoleTypeForDialogConfig'](QuoteState.SELLER_SUBMITTED)
      ).toBe(QuoteRoleType.SELLER);
    });
    it('should return seller-approver-role', () => {
      expect(
        component['stateToRoleTypeForDialogConfig'](
          QuoteState.SELLERAPPROVER_APPROVED
        )
      ).toBe(QuoteRoleType.SELLERAPPROVER);
    });
    it('should return default (ALL) role type if no role matches', () => {
      expect(
        component['stateToRoleTypeForDialogConfig'](QuoteState.CANCELLED)
      ).toBe(QuoteRoleType.ALL);
    });
  });
});
